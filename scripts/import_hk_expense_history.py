#!/usr/bin/env python3
"""
HK 成本帳歷史過渡匯入（Excel ∪ Notion → expense_entries）。

原則（docs/product/plans/2026-08-05-hk-expense-cost-stats.md §9）：
  - origin = history_import；origin_key 冪等
  - 一律 pending_review；薪金類 force pending＋hint
  - 該月若已有 payroll_settle 過帳 → void 歷史薪金列
  - 唔加來源追蹤產品欄；唔以 Excel／Notion 做主 taxonomy

用法（專案根目錄）：
  python3 scripts/import_hk_expense_history.py \\
    --excel import-output/hk-expense-raw/26-27-mainhope-accounting.xlsx

  python3 scripts/import_hk_expense_history.py \\
    --excel … --notion path/to/notion.csv --apply

  DRY_RUN 預設；加 --apply 先寫 SQL 再經 supabase db query --linked 套用。
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import subprocess
import sys
import xml.etree.ElementTree as ET
import zipfile
from dataclasses import asdict, dataclass
from datetime import date, datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "import-output" / "hk-expense-raw"
SUPABASE_BIN_CANDIDATES = [
    "supabase",
    str(Path.home() / ".local/bin/supabase"),
    "/tmp/supabase-cli/supabase",
]

# 與 migration 種子規則同序（priority 升序；先 match 先用）
SEED_RULES: list[tuple[str, str | None, bool, str | None, int]] = [
    ("退學費", None, True, "退學費唔當成本自動入帳；請覆核或 void。", 5),
    ("退款", None, True, "退款／退學費唔當成本自動入帳；請覆核或 void。", 5),
    ("按金", None, True, "按金通常唔當成本；請覆核。", 5),
    ("薪金", None, True, "導師薪酬應由計糧結算過帳，勿人手入帳。", 10),
    ("薪酬", None, True, "導師薪酬應由計糧結算過帳，勿人手入帳。", 10),
    ("工資", None, True, "導師薪酬應由計糧結算過帳，勿人手入帳。", 10),
    ("人工", None, True, "若屬計糧覆蓋人員，應由結算過帳；否則選「非計糧人工」。", 15),
    ("MPF", "labor_employer_mpf", True, "僱主強積金通常隨計糧過帳；人手入請覆核。", 20),
    ("強積金", "labor_employer_mpf", True, "僱主強積金通常隨計糧過帳；人手入請覆核。", 20),
    ("租金", "rent_mgmt", False, None, 40),
    ("管理費", "rent_mgmt", False, None, 40),
    ("電費", "utilities_net", False, None, 50),
    ("水費", "utilities_net", False, None, 50),
    ("上網", "utilities_net", False, None, 50),
    ("電話", "utilities_net", False, None, 50),
    ("寬頻", "utilities_net", False, None, 50),
    ("清潔", "cleaning", False, None, 60),
    ("教材", "materials", False, None, 70),
    ("文具", "supplies", False, None, 80),
    ("廣告", "marketing", False, None, 90),
    ("印刷", "marketing", False, None, 90),
    ("軟件", "software", False, None, 100),
    ("訂閱", "software", False, None, 100),
    ("subscription", "software", False, None, 100),
    ("bluehost", "software", False, None, 100),
    ("團建", "team_welfare", False, None, 110),
    ("餐", "team_welfare", False, None, 110),
    ("cheque charge", "overhead_other", False, None, 120),
    ("returned cheque", "overhead_other", False, None, 120),
]

NOTION_CATEGORY_TO_CODE: dict[str, str | None] = {
    "上網或電話費": "utilities_net",
    "教材": "materials",
    "前台人工": "labor_non_payroll",
    "兼職工資": None,
    "交通費": "overhead_other",
    "傳單印刷": "marketing",
    "團建聚餐": "team_welfare",
    "文具雜物": "supplies",
    "其他費用": None,
    "功課班": None,
}

SALARY_HINT = "歷史薪金／人工列：應由計糧過帳；有 payroll 月請 void。"
SALARY_TITLE_RE = re.compile(
    r"(人工|薪金|薪酬|工資|兼職|mpf|強積金|雇主報稅)",
    re.IGNORECASE,
)
REFUND_TITLE_RE = re.compile(r"(退學費|退一堂|退款|退.+班)")

HK_MONTH_SHEETS = {
    "APR 04": "2026-04",
    "MAY 05": "2026-05",
    "JUN 06": "2026-06",
    "JUL 07": "2026-07",
    "AUG 08": "2026-08",
}

PAY_METHOD_MAP = {
    "銀行": "bank_card",
    "公司銀行卡": "bank_card",
    "現金": "cashbox",
    "cash box": "cashbox",
    "cashbox": "cashbox",
    "cashbox 即取": "cashbox",
    "余sir": "other",
    "內地還款": "other",
    "員工自行先付": "staff_advance",
    "轉數快": "fps",
    "支票": "cheque",
}


@dataclass
class StagingRow:
    spent_on: str
    title: str
    amount_hkd: float
    pay_method: str
    owner_label: str | None
    notes: str | None
    origin_key: str
    account_code: str | None
    suggestion_hint: str | None
    is_salary_like: bool
    sheet_or_source: str


def sql_literal(s: str | None) -> str:
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"


def sql_num(n: float) -> str:
    return f"{n:.2f}"


def short_hash(*parts: object) -> str:
    raw = "|".join("" if p is None else str(p).strip() for p in parts)
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()[:16]


def excel_serial_to_iso(serial: float | int | str) -> str:
    n = int(float(serial))
    return (datetime(1899, 12, 30) + timedelta(days=n)).date().isoformat()


def parse_notion_date(raw: str) -> str | None:
    s = (raw or "").strip()
    if not s:
        return None
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%m/%d/%Y"):
        try:
            return datetime.strptime(s, fmt).date().isoformat()
        except ValueError:
            continue
    return None


def parse_amount(raw: object) -> float | None:
    if raw is None:
        return None
    s = str(raw).strip().replace(",", "").replace("HK$", "").replace("hk$", "")
    if not s:
        return None
    try:
        v = float(s)
    except ValueError:
        return None
    if v == 0 or not (v == v):  # NaN
        return None
    return round(v, 2)


def map_pay_method(raw: str | None) -> str:
    key = (raw or "").strip().lower()
    if not key:
        return "other"
    for label, code in PAY_METHOD_MAP.items():
        if key == label.lower() or key == label:
            return code
    # loose
    if "cash" in key or "現金" in (raw or ""):
        return "cashbox"
    if "銀行" in (raw or "") or "bank" in key:
        return "bank_card"
    if "先付" in (raw or "") or "墊" in (raw or ""):
        return "staff_advance"
    return "other"


def suggest_for_title(title: str) -> tuple[str | None, str | None, bool]:
    """回傳 (account_code, hint, force_pending)。"""
    t = title.strip().lower()
    if not t:
        return None, None, False
    for pattern, code, force, hint, _prio in SEED_RULES:
        if pattern.lower() in t:
            return code, hint, force
    return None, None, False


def is_salary_like(title: str) -> bool:
    return bool(SALARY_TITLE_RE.search(title or ""))


def pick_notion_title(desc: str, related: str) -> tuple[str, str | None]:
    """擇優：較長、非純數字說明作 title；另一欄入 notes。"""
    a = (desc or "").strip()
    b = (related or "").strip()

    def score(s: str) -> tuple[int, int]:
        if not s:
            return (0, 0)
        if re.fullmatch(r"\d+(\.\d+)?", s):
            return (1, len(s))
        return (2, len(s))

    if score(a) >= score(b):
        title, other = a or b or "（無說明）", b if b and b != a else None
    else:
        title, other = b or a or "（無說明）", a if a and a != b else None
    return title, other


def apply_suggest(
    title: str, notion_category: str | None = None
) -> tuple[str | None, str | None, bool]:
    code, hint, force = suggest_for_title(title)
    salary = is_salary_like(title)
    if REFUND_TITLE_RE.search(title):
        return None, hint or "退款／退學費唔當成本自動入帳；請覆核或 void。", True
    if salary:
        # 薪金類：唔自動當 confirmed 成本；account 可留空或 MPF 建議仍 pending
        if code == "labor_employer_mpf":
            return code, hint or SALARY_HINT, True
        return None, hint or SALARY_HINT, True
    if code is None and notion_category:
        cat_code = NOTION_CATEGORY_TO_CODE.get(notion_category.strip())
        if cat_code is not None or notion_category.strip() in NOTION_CATEGORY_TO_CODE:
            if notion_category.strip() == "兼職工資":
                return None, SALARY_HINT, True
            return cat_code, hint, force
    return code, hint, force


# ---------- Excel parse (zip/xlsx, no deps) ----------

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
REL_NS = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"


def _load_shared_strings(z: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in z.namelist():
        return []
    root = ET.fromstring(z.read("xl/sharedStrings.xml"))
    out: list[str] = []
    for si in root.findall("m:si", NS):
        texts = [
            t.text or ""
            for t in si.iter("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t")
        ]
        out.append("".join(texts))
    return out


def _cell_value(c: ET.Element, shared: list[str]) -> str | None:
    v = c.find("m:v", NS)
    if v is None or v.text is None:
        return None
    if c.attrib.get("t") == "s":
        return shared[int(v.text)]
    return v.text


def parse_excel(path: Path) -> list[StagingRow]:
    rows: list[StagingRow] = []
    with zipfile.ZipFile(path) as z:
        wb = ET.fromstring(z.read("xl/workbook.xml"))
        sheets = [
            (s.attrib.get("name"), s.attrib.get(REL_NS))
            for s in wb.findall("m:sheets/m:sheet", NS)
        ]
        shared = _load_shared_strings(z)
        rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
        rid_to_target = {r.attrib["Id"]: r.attrib["Target"] for r in rels}

        for name, rid in sheets:
            if name not in HK_MONTH_SHEETS or not rid:
                continue
            month_key = HK_MONTH_SHEETS[name]
            target = "xl/" + rid_to_target[rid].lstrip("/")
            if target.startswith("xl/xl/"):
                target = target[3:]
            root = ET.fromstring(z.read(target))
            sheet_rows = root.findall("m:sheetData/m:row", NS)
            for row in sheet_rows[1:]:
                vals: list[str | None] = []
                for c in row.findall("m:c", NS):
                    vals.append(_cell_value(c, shared))
                # pad
                while len(vals) < 6:
                    vals.append(None)
                date_raw, title, amount_raw, pay_raw, owner, receipt = vals[:6]
                if not date_raw or not title:
                    continue
                amount = parse_amount(amount_raw)
                if amount is None:
                    continue
                try:
                    spent_on = excel_serial_to_iso(date_raw)
                except Exception:
                    continue
                title_s = str(title).strip()
                pay = map_pay_method(pay_raw)
                owner_s = (owner or "").strip() or None
                notes_parts = []
                if receipt and str(receipt).strip():
                    notes_parts.append(f"單據：{str(receipt).strip()}")
                code, hint, _force = apply_suggest(title_s)
                salary = is_salary_like(title_s)
                origin_key = (
                    f"HK|excel|{month_key}|"
                    f"{short_hash(spent_on, title_s, f'{amount:.2f}', pay)}"
                )
                rows.append(
                    StagingRow(
                        spent_on=spent_on,
                        title=title_s,
                        amount_hkd=amount,
                        pay_method=pay,
                        owner_label=owner_s,
                        notes="; ".join(notes_parts) if notes_parts else None,
                        origin_key=origin_key,
                        account_code=code,
                        suggestion_hint=hint,
                        is_salary_like=salary,
                        sheet_or_source=name,
                    )
                )
    return rows


def parse_notion_csv(path: Path) -> list[StagingRow]:
    rows: list[StagingRow] = []
    with path.open(newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for i, raw in enumerate(reader):
            spent = parse_notion_date(raw.get("日期") or "")
            if not spent:
                continue
            amount = parse_amount(raw.get("金額"))
            if amount is None:
                continue
            desc = raw.get("費用說明") or ""
            related = raw.get("報銷相關紀錄") or ""
            title, other = pick_notion_title(desc, related)
            cat = (raw.get("費用類別") or "").strip() or None
            pay = map_pay_method(raw.get("支付方式"))
            owner = (raw.get("填表人員") or "").strip() or None
            created = (raw.get("建立時間") or "").strip() or str(i)
            code, hint, _force = apply_suggest(title, cat)
            salary = is_salary_like(title) or (cat == "兼職工資")
            notes_parts: list[str] = []
            if cat:
                notes_parts.append(f"[Notion類別:{cat}]")
            if other:
                notes_parts.append(other)
            # 丟棄報銷處理；檔名可選入 notes
            media = (raw.get("檔案和媒體") or "").strip()
            if media:
                notes_parts.append(f"檔名：{media.split('/')[-1][:80]}")
            origin_key = (
                f"HK|notion|{short_hash(created)}|{spent}|{amount:.2f}|"
                f"{short_hash(title)}"
            )
            rows.append(
                StagingRow(
                    spent_on=spent,
                    title=title,
                    amount_hkd=amount,
                    pay_method=pay,
                    owner_label=owner,
                    notes="; ".join(notes_parts) if notes_parts else None,
                    origin_key=origin_key,
                    account_code=code,
                    suggestion_hint=hint if salary or hint else hint,
                    is_salary_like=salary,
                    sheet_or_source="notion",
                )
            )
    return rows


def find_supabase() -> str | None:
    for bin_path in SUPABASE_BIN_CANDIDATES:
        try:
            r = subprocess.run(
                [bin_path, "--version"],
                capture_output=True,
                text=True,
                check=False,
            )
            if r.returncode == 0:
                return bin_path
        except FileNotFoundError:
            continue
    return None


def db_query(sql: str) -> dict | list | None:
    bin_path = find_supabase()
    if not bin_path:
        raise SystemExit("找不到 supabase CLI（~/.local/bin/supabase）")
    r = subprocess.run(
        [bin_path, "db", "query", "--linked", sql],
        cwd=str(ROOT),
        capture_output=True,
        text=True,
        check=False,
    )
    out = (r.stdout or "") + (r.stderr or "")
    if r.returncode != 0:
        raise SystemExit(f"supabase db query 失敗：\n{out[-2000:]}")
    # CLI 可能印 login 訊息再 JSON
    start = out.find("{")
    if start < 0:
        return None
    try:
        return json.loads(out[start:])
    except json.JSONDecodeError:
        return {"raw": out[start : start + 500]}


def build_insert_sql(rows: list[StagingRow]) -> str:
    parts = [
        "-- HK expense history_import (idempotent on origin_key)",
        "begin;",
    ]
    for r in rows:
        hint = r.suggestion_hint
        notes = r.notes
        if r.account_code:
            parts.append(
                f"""
insert into public.expense_entries (
  spent_on, title, amount_hkd, pay_method, owner_label,
  ledger_account_id, ledger_status, suggested_account_id, suggestion_hint,
  notes, origin, origin_key, created_by_label
)
select
  {sql_literal(r.spent_on)}::date,
  {sql_literal(r.title)},
  {sql_num(r.amount_hkd)},
  {sql_literal(r.pay_method)},
  {sql_literal(r.owner_label)},
  a.id,
  'pending_review',
  a.id,
  {sql_literal(hint)},
  {sql_literal(notes)},
  'history_import',
  {sql_literal(r.origin_key)},
  'history_import'
from public.expense_ledger_accounts a
where a.code = {sql_literal(r.account_code)}
on conflict (origin_key) do nothing;
""".strip()
            )
        else:
            parts.append(
                f"""
insert into public.expense_entries (
  spent_on, title, amount_hkd, pay_method, owner_label,
  ledger_account_id, ledger_status, suggested_account_id, suggestion_hint,
  notes, origin, origin_key, created_by_label
) values (
  {sql_literal(r.spent_on)}::date,
  {sql_literal(r.title)},
  {sql_num(r.amount_hkd)},
  {sql_literal(r.pay_method)},
  {sql_literal(r.owner_label)},
  null,
  'pending_review',
  null,
  {sql_literal(hint)},
  {sql_literal(notes)},
  'history_import',
  {sql_literal(r.origin_key)},
  'history_import'
)
on conflict (origin_key) do nothing;
""".strip()
            )

    # 有 payroll_settle 之月：void 歷史薪金類
    parts.append(
        """
update public.expense_entries e
set
  voided_at = coalesce(e.voided_at, now()),
  void_reason = coalesce(
    e.void_reason,
    '該月已有計糧過帳；歷史薪金列不作成本'
  ),
  voided_by_label = coalesce(e.voided_by_label, 'history_import'),
  updated_at = now()
where e.origin = 'history_import'
  and e.voided_at is null
  and (
    e.title ~* '(人工|薪金|薪酬|工資|兼職|mpf|強積金)'
    or coalesce(e.suggestion_hint, '') ilike '%計糧%'
  )
  and to_char(e.spent_on, 'YYYY-MM') in (
    select distinct to_char(p.spent_on, 'YYYY-MM')
    from public.expense_entries p
    where p.origin = 'payroll_settle'
      and p.voided_at is null
  );
""".strip()
    )
    parts.append("commit;")
    return "\n\n".join(parts) + "\n"


def summarize(rows: list[StagingRow]) -> dict:
    by_month: dict[str, dict] = {}
    for r in rows:
        mk = r.spent_on[:7]
        bucket = by_month.setdefault(
            mk,
            {"n": 0, "amount": 0.0, "salary_n": 0, "salary_amount": 0.0, "with_account": 0},
        )
        bucket["n"] += 1
        bucket["amount"] += r.amount_hkd
        if r.is_salary_like:
            bucket["salary_n"] += 1
            bucket["salary_amount"] += r.amount_hkd
        if r.account_code:
            bucket["with_account"] += 1
    return {
        "total": len(rows),
        "unique_keys": len({r.origin_key for r in rows}),
        "by_month": {
            k: {
                **v,
                "amount": round(v["amount"], 2),
                "salary_amount": round(v["salary_amount"], 2),
            }
            for k, v in sorted(by_month.items())
        },
    }


def sample_july(rows: list[StagingRow]) -> list[dict]:
    """抽樣驗收用：租金／按金／寬頻／薪金／軟件。"""
    want = [
        "按金",
        "租金",
        "寬頻",
        "前台人工",
        "subscription",
        "mpf",
        "電費",
    ]
    jul = [r for r in rows if r.spent_on.startswith("2026-07")]
    picked: list[StagingRow] = []
    for w in want:
        for r in jul:
            if w.lower() in r.title.lower() and r not in picked:
                picked.append(r)
                break
    # 補幾筆
    for r in jul:
        if len(picked) >= 10:
            break
        if r not in picked:
            picked.append(r)
    return [
        {
            "spent_on": r.spent_on,
            "title": r.title,
            "amount": r.amount_hkd,
            "pay_method": r.pay_method,
            "account_code": r.account_code,
            "hint": r.suggestion_hint,
            "salary": r.is_salary_like,
            "origin_key": r.origin_key,
        }
        for r in picked[:10]
    ]


def main() -> None:
    ap = argparse.ArgumentParser(description="HK 成本帳歷史匯入 ETL")
    ap.add_argument("--excel", type=Path, help="Excel xlsx 路徑（HK 月表）")
    ap.add_argument("--notion", type=Path, help="Notion 日記帳 CSV 路徑")
    ap.add_argument(
        "--apply",
        action="store_true",
        help="經 supabase db query --linked 寫入（預設只 staging）",
    )
    ap.add_argument(
        "--out-dir",
        type=Path,
        default=OUT_DIR,
        help="staging／SQL 輸出目錄",
    )
    args = ap.parse_args()
    if not args.excel and not args.notion:
        ap.error("請至少指定 --excel 或 --notion")

    args.out_dir.mkdir(parents=True, exist_ok=True)
    all_rows: list[StagingRow] = []
    if args.excel:
        if not args.excel.is_file():
            raise SystemExit(f"找不到 Excel：{args.excel}")
        excel_rows = parse_excel(args.excel)
        print(f"Excel：{len(excel_rows)} 列 ← {args.excel}")
        all_rows.extend(excel_rows)
    if args.notion:
        if not args.notion.is_file():
            raise SystemExit(f"找不到 Notion CSV：{args.notion}")
        notion_rows = parse_notion_csv(args.notion)
        print(f"Notion：{len(notion_rows)} 列 ← {args.notion}")
        all_rows.extend(notion_rows)

    # dedupe by origin_key（同檔重列）
    seen: set[str] = set()
    deduped: list[StagingRow] = []
    for r in all_rows:
        if r.origin_key in seen:
            continue
        seen.add(r.origin_key)
        deduped.append(r)
    all_rows = deduped

    summary = summarize(all_rows)
    july_sample = sample_july(all_rows)
    staging_path = args.out_dir / "history_import_staging.json"
    staging_path.write_text(
        json.dumps(
            {
                "generated_at": datetime.now().isoformat(timespec="seconds"),
                "summary": summary,
                "july_sample": july_sample,
                "rows": [asdict(r) for r in all_rows],
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    sql_path = args.out_dir / "history_import.sql"
    sql_path.write_text(build_insert_sql(all_rows), encoding="utf-8")

    print(json.dumps(summary, ensure_ascii=False, indent=2))
    print("\n7 月抽樣：")
    for s in july_sample:
        print(
            f"  {s['spent_on']}  {s['amount']:>10}  "
            f"acct={s['account_code'] or '—':20}  "
            f"{'[薪]' if s['salary'] else '    '}  {s['title'][:60]}"
        )
    print(f"\nstaging → {staging_path}")
    print(f"sql     → {sql_path}")

    if not args.apply:
        print("\n（dry-run）未寫入 DB。確認後加 --apply。")
        return

    print("\n套用中（supabase db query --linked）…")
    # 用 -f 較穩；部分 CLI 版本對超長 positional SQL 不穩
    bin_path = find_supabase()
    assert bin_path
    r = subprocess.run(
        [bin_path, "db", "query", "--linked", "-f", str(sql_path)],
        cwd=str(ROOT),
        capture_output=True,
        text=True,
        check=False,
    )
    out = (r.stdout or "") + (r.stderr or "")
    if r.returncode != 0:
        # 若 -f 唔支援，退回 stdin／positional 分段
        print(out[-1500:])
        raise SystemExit(f"套用失敗（exit {r.returncode}）")
    print(out[-800:] if out else "ok")

    verify = db_query(
        """
select
  to_char(spent_on, 'YYYY-MM') as month,
  count(*) as n,
  count(*) filter (where voided_at is not null) as voided,
  count(*) filter (
    where title ~* '(人工|薪金|薪酬|工資|mpf|強積金)' and voided_at is null
  ) as salary_pending,
  round(sum(amount_hkd) filter (where voided_at is null)::numeric, 2) as amount_open
from expense_entries
where origin = 'history_import'
group by 1
order by 1;
"""
    )
    print("\nDB 驗收（history_import by month）：")
    print(json.dumps(verify, ensure_ascii=False, indent=2) if verify else "(no json)")


if __name__ == "__main__":
    main()
