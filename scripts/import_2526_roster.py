#!/usr/bin/env python3
"""
將「【2526】課程及班別」類 CSV（班別名稱、學生名單逗號分隔…）轉成 Supabase 寫入：
  students（缺者新增；已存在則依姓名對應）
  classes（每列一班；course_code 留空）
  student_class_enrollments（每名學生每班一列；remarks 標記 [2526匯入]）

用法（於專案根目錄）：
  python3 scripts/import_2526_roster.py [CSV路徑]
    → 產生 import-output/2526_import.sql（建議在 Supabase SQL Editor 執行）
    → 產生 import-output/students_for_list_import.csv（對齊學生列表匯出欄位，id 留空）

  python3 scripts/import_2526_roster.py --apply-rest [CSV路徑]
    → 需環境變數 SUPABASE_SERVICE_ROLE_KEY（anon 金鑰無法寫入 classes 時會 401）

環境變數：
  DRY_RUN=1  僅解析並寫入 preview JSON，不產生大檔 SQL
"""

from __future__ import annotations

import csv
import json
import os
import re
import ssl
import sys
import time
import urllib.error
import urllib.request
from collections import defaultdict
from pathlib import Path
from typing import Any
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "import-output"
DEFAULT_CSV = Path(
    "/Users/hoiyingfan/Downloads/私人和共用/"
    "【2526】課程及班別 25273b60cb028020b6a9f9b45f2c52b3_all.csv"
)

DAY_ALIASES: dict[str, str] = {
    "星期一": "星期一",
    "星期二": "星期二",
    "星期三": "星期三",
    "星期四": "星期四",
    "星期五": "星期五",
    "星期六": "星期六",
    "星期日": "星期日",
    "週一": "星期一",
    "週二": "星期二",
    "週三": "星期三",
    "週四": "星期四",
    "週五": "星期五",
    "週六": "星期六",
    "週日": "星期日",
    "MON": "星期一",
    "TUE": "星期二",
    "WED": "星期三",
    "THU": "星期四",
    "FRI": "星期五",
    "SAT": "星期六",
    "SUN": "星期日",
}


def load_env() -> tuple[str, str]:
    env_path = ROOT / ".env"
    url = os.environ.get("VITE_SUPABASE_URL", "").strip()
    key = os.environ.get("VITE_SUPABASE_ANON_KEY", "").strip()
    if env_path.is_file():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith("VITE_SUPABASE_URL=") and not url:
                url = line.split("=", 1)[1].strip().strip('"').strip("'")
            elif line.startswith("VITE_SUPABASE_ANON_KEY=") and not key:
                key = line.split("=", 1)[1].strip().strip('"').strip("'")
            elif line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                pass  # 僅供 load_service_key 讀取
    if not url or not key:
        raise SystemExit("缺少 VITE_SUPABASE_URL 或 VITE_SUPABASE_ANON_KEY（請設定於環境或 .env）")
    return url, key


def load_service_role_key() -> str | None:
    k = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if k:
        return k
    env_path = ROOT / ".env"
    if not env_path.is_file():
        return None
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    return None


def sql_literal(s: str | None) -> str:
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"


def sql_text_array(arr: list[str] | None) -> str:
    if not arr:
        return "NULL"
    inner = ",".join(sql_literal(x) for x in arr)
    return f"ARRAY[{inner}]::text[]"


def build_import_sql(parsed: list[dict[str, Any]], all_names: set[str]) -> str:
    """單一交易：固定 UUID，便於 student_class_enrollments 引用。"""
    name_to_sid: dict[str, str] = {n: str(uuid4()) for n in sorted(all_names)}
    lines: list[str] = [
        "-- 2526 課程及班別匯入（由 scripts/import_2526_roster.py 產生）",
        "-- 請於 Supabase SQL Editor 以具寫入權限身分執行（會繞過 RLS）。",
        "-- 若學生姓名已在 public.students 存在，可能產生重複姓名資料列，執行前請先備份或改寫本檔。",
        "BEGIN;",
        "",
    ]
    # students
    stud_vals: list[str] = []
    seq = 0
    for name in sorted(all_names):
        sid = name_to_sid[name]
        tg = None
        for pr in parsed:
            if name in pr["student_names"]:
                tg = infer_student_grade(pr["grade_arr"], infer_grade_from_title(pr["title"]))
                if tg:
                    break
        code = f"S-2526-IMP-{seq:05d}"
        seq += 1
        stud_vals.append(
            "  ("
            + f"{sql_literal(sid)}::uuid, "
            + f"{sql_literal(name)}, "
            + f"{sql_literal(code)}, "
            + f"{sql_literal(tg)}, "
            + "NULL, "
            + "'在讀', "
            + "'已註冊', "
            + "'在讀', "
            + "'中學中'"
            + ")"
        )
    lines.append("INSERT INTO public.students (")
    lines.append(
        "  id, full_name, student_code, grade, school, status, registration_status, enrollment_status, academic_stage"
    )
    lines.append(") VALUES")
    lines.append(",\n".join(stud_vals) + ";")
    lines.append("")

    # classes + enrollments
    for pr in parsed:
        cid = str(uuid4())
        garr = pr["grade_arr"]
        lines.append(
            "INSERT INTO public.classes ("
            "id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, "
            "capacity, price_per_lesson, start_date, end_date, status"
            ") VALUES ("
            f"{sql_literal(cid)}::uuid, "
            f"{sql_literal(pr['subject'] or '其他')}, "
            "NULL, "
            f"{sql_text_array(garr)}, "
            f"{sql_literal(pr['day_of_week'])}, "
            f"{sql_literal(pr['time_slot'])}, "
            "NULL, NULL, NULL, "
            + (
                "NULL, "
                if pr["price_per_lesson"] is None
                else f"{pr['price_per_lesson']}, "
            )
            + f"{sql_literal('2025-09-01')}::date, "
            + f"{sql_literal('2026-08-31')}::date, "
            + f"{sql_literal('進行中')}"
            + ");"
        )
        tag = (f"[2526匯入] {pr['title']}")[:500]
        for sn in pr["student_names"]:
            sid = name_to_sid.get(sn)
            if not sid:
                continue
            lines.append(
                "INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ("
                f"{sql_literal(sid)}::uuid, {sql_literal(cid)}::uuid, "
                f"{sql_literal('就讀中')}, {sql_literal('2025-09-01')}::date, {sql_literal(tag)}"
                ");"
            )
        lines.append("")

    lines.append("COMMIT;")
    return "\n".join(lines)


def write_students_csv_export_format(all_names: set[str], parsed: list[dict[str, Any]]) -> None:
    """對齊 StudentsListPage.formatCsv 欄位（含 UTF-8 BOM）；id 留空供參考／手動補。"""
    headers = [
        "id",
        "student_code",
        "full_name",
        "english_name",
        "grade",
        "status",
        "student_phone",
        "parent_phone",
        "school",
    ]
    esc = lambda v: (  # noqa: E731
        f'"{str(v).replace(chr(34), chr(34)+chr(34))}"' if any(c in str(v) for c in '",\n') else str(v)
    )
    rows_out: list[str] = [",".join(headers)]
    seq = 0
    for name in sorted(all_names):
        tg = ""
        for pr in parsed:
            if name in pr["student_names"]:
                g = infer_student_grade(pr["grade_arr"], infer_grade_from_title(pr["title"]))
                if g:
                    tg = g
                    break
        code = f"S-2526-IMP-{seq:05d}"
        seq += 1
        row = ["", code, name, "", tg, "在讀", "", "", ""]
        rows_out.append(",".join(esc(c) for c in row))
    (OUT_DIR / "students_for_list_import.csv").write_text(
        "\uFEFF" + "\n".join(rows_out), encoding="utf-8"
    )


def norm_ws(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").strip())


def norm_time_slot(s: str | None) -> str | None:
    if not s or not str(s).strip():
        return None
    t = str(s).strip().replace("：", ":").replace("－", "-").replace("—", "-")
    return t or None


def parse_grades(適用年級: str) -> list[str]:
    if not 適用年級 or not str(適用年級).strip():
        return []
    parts = re.split(r"[,，]", str(適用年級))
    out: list[str] = []
    for p in parts:
        g = norm_ws(p)
        if g and g.upper() != "NA":
            out.append(g)
    return out


def infer_grade_from_title(title: str) -> str | None:
    m = re.search(r"小([一二三四五六])級|中([一二三四五六])級", title or "")
    if not m:
        return None
    if m.group(1):
        mp = {"一": "小一", "二": "小二", "三": "小三", "四": "小四", "五": "小五", "六": "小六"}
        return mp.get(m.group(1))
    mp = {"一": "中一", "二": "中二", "三": "中三", "四": "中四", "五": "中五", "六": "中六"}
    return mp.get(m.group(2))


def canonical_weekdays(raw: str | None) -> str | None:
    if not raw or not str(raw).strip():
        return None
    tokens = re.split(r"[,，]", str(raw).strip())
    seen: list[str] = []
    for tok in tokens:
        t = tok.strip().upper() if len(tok.strip()) <= 4 else tok.strip()
        if t in DAY_ALIASES:
            c = DAY_ALIASES[t]
            if c not in seen:
                seen.append(c)
        elif tok.strip() in DAY_ALIASES:
            c = DAY_ALIASES[tok.strip()]
            if c not in seen:
                seen.append(c)
    return ", ".join(seen) if seen else None


def subject_from_row(row: dict[str, str]) -> str:
    title = norm_ws(row.get("班別名稱", "") or "")
    eng = norm_ws(row.get("課程名稱", "") or "")
    low = eng.lower()

    # 班名內常見科目字樣
    m = re.search(
        r"(中文|英文|數學|M2|物理|化學|生物|科學|企會財|公社|公民|地理|歷史|中史|經濟|資訊|音樂|體育|視藝|BAFS)科",
        title,
        re.I,
    )
    if m:
        x = m.group(1).upper()
        if x == "M2":
            return "數學延伸"
        if x == "BAFS":
            return "企會財"
        return m.group(1)

    rules: list[tuple[str, str]] = [
        ("chinese", "中文"),
        ("mathematics", "數學"),
        ("integrated science", "科學"),
        ("physics", "物理"),
        ("chemistry", "化學"),
        ("biology", "生物"),
        ("english", "英文"),
        ("m2", "數學延伸"),
        ("bafs", "企會財"),
        ("nd100", "英文"),
        ("功課輔導", "功課輔導"),
        ("one on one", "一對一"),
        ("one on two", "一對二"),
        ("js english", "英文"),
        ("ss english", "英文"),
        ("s1 english", "英文"),
        ("s2 english", "英文"),
        ("s4 english", "英文"),
        ("s5 english", "英文"),
        ("s6 english", "英文"),
        ("p5", "數學"),
        ("p6", "數學"),
    ]
    for needle, subj in rules:
        if needle in low:
            return subj

    if eng:
        # 去掉常見前綴後當備註科目
        return eng[:80] if len(eng) < 40 else eng[:40] + "…"

    if "功課輔導" in title:
        return "功課輔導"
    if "英文" in title:
        return "英文"
    if "數學" in title:
        return "數學"
    if "中文" in title:
        return "中文"
    return "其他"


def infer_student_grade(class_grades: list[str], title_grade: str | None) -> str | None:
    if class_grades:
        return class_grades[0]
    return title_grade


def split_student_names(cell: str) -> list[str]:
    if not cell or not str(cell).strip():
        return []
    # 全形／半形逗號；避免誤拆小數
    parts = re.split(r"[,，]", str(cell))
    names: list[str] = []
    for p in parts:
        n = norm_ws(p)
        if n:
            names.append(n)
    return names


def parse_price(v: str) -> float | None:
    s = (v or "").strip()
    if not s:
        return None
    try:
        return float(s)
    except ValueError:
        return None


def supabase_request(
    method: str,
    url: str,
    key: str,
    path: str,
    body: Any | None = None,
    prefer: str | None = None,
) -> tuple[int, Any]:
    full = f"{url.rstrip('/')}/rest/v1/{path}"
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(full, data=data, headers=headers, method=method)

    def do_open(ctx: ssl.SSLContext) -> tuple[int, Any]:
        opener = urllib.request.build_opener(urllib.request.HTTPSHandler(context=ctx))
        try:
            with opener.open(req, timeout=120) as resp:
                raw = resp.read().decode("utf-8")
                if not raw:
                    return resp.status, None
                return resp.status, json.loads(raw)
        except urllib.error.HTTPError as e:
            err = e.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"HTTP {e.code} {full}: {err}") from e

    verified = ssl.create_default_context()
    insecure = ssl.create_default_context()
    insecure.check_hostname = False
    insecure.verify_mode = ssl.CERT_NONE
    for label, ctx in (("verified", verified), ("insecure", insecure)):
        try:
            return do_open(ctx)
        except (ssl.SSLError, urllib.error.URLError, OSError) as e:
            if label == "verified" and (
                "CERTIFICATE_VERIFY_FAILED" in str(e)
                or isinstance(e, ssl.SSLError)
                or (isinstance(e, urllib.error.URLError) and isinstance(e.reason, ssl.SSLError))
            ):
                continue
            raise
    raise RuntimeError("HTTPS 請求失敗（憑證與無憑證重試皆未成功）")


def fetch_all_students(sb_url: str, key: str) -> dict[str, list[str]]:
    """full_name -> [id, ...]"""
    page_size = 1000
    start = 0
    by_name: dict[str, list[str]] = defaultdict(list)
    while True:
        path = f"students?select=id,full_name,student_code&limit={page_size}&offset={start}"
        status, rows = supabase_request("GET", sb_url, key, path)
        if status != 200 or not isinstance(rows, list):
            raise RuntimeError(f"fetch students failed: {status}")
        if not rows:
            break
        for r in rows:
            fn = norm_ws(str(r.get("full_name", "")))
            if fn:
                by_name[fn].append(str(r["id"]))
        if len(rows) < page_size:
            break
        start += page_size
    return by_name


def main() -> int:
    dry = os.environ.get("DRY_RUN", "").strip() in ("1", "true", "yes")
    args = [a for a in sys.argv[1:] if a != "--apply-rest"]
    csv_path = Path(args[0]) if args else DEFAULT_CSV
    if not csv_path.is_file():
        print(f"找不到 CSV：{csv_path}", file=sys.stderr)
        return 1

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    with csv_path.open(newline="", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))

    # 預處理每列
    parsed: list[dict[str, Any]] = []
    all_names: set[str] = set()
    for i, row in enumerate(rows):
        title = norm_ws(row.get("班別名稱", "") or "")
        course = norm_ws(row.get("課程名稱", "") or "")
        if not title and not course:
            continue
        names = split_student_names(row.get("學生名單", "") or "")
        for n in names:
            all_names.add(n)
        grades = parse_grades(row.get("適用年級", "") or "")
        tg = infer_grade_from_title(title)
        subject = subject_from_row(row)
        day = canonical_weekdays(row.get("逢星期", "") or "")
        slot = norm_time_slot(row.get("時間", "") or "")
        price = parse_price(row.get("每堂堂費", "") or "")
        remark = (row.get("報讀時備註", "") or "").strip()
        parsed.append(
            {
                "row_index": i + 2,
                "title": title or course,
                "course_name": course,
                "subject": subject,
                "grade_arr": grades if grades else ([tg] if tg else []),
                "day_of_week": day,
                "time_slot": slot,
                "price_per_lesson": price,
                "class_remark": remark,
                "student_names": names,
            }
        )

    (OUT_DIR / "parsed_summary.json").write_text(
        json.dumps(
            {
                "source": str(csv_path),
                "class_rows": len(parsed),
                "unique_student_names": len(all_names),
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    if dry:
        (OUT_DIR / "parsed_classes_preview.json").write_text(
            json.dumps(parsed[:25], ensure_ascii=False, indent=2), encoding="utf-8"
        )
        print(f"DRY_RUN：已寫入 {OUT_DIR}/parsed_summary.json 與 preview")
        return 0

    sql_text = build_import_sql(parsed, all_names)
    (OUT_DIR / "2526_import.sql").write_text(sql_text, encoding="utf-8")
    write_students_csv_export_format(all_names, parsed)
    print(f"已寫入 {OUT_DIR / '2526_import.sql'}（請於 Supabase SQL Editor 執行）")
    print(f"已寫入 {OUT_DIR / 'students_for_list_import.csv'}（學生列表頁欄位格式）")

    apply_rest = "--apply-rest" in sys.argv
    if not apply_rest:
        print("未指定 --apply-rest，已跳過 REST API 寫入（anon 金鑰通常無權 INSERT classes）。")
        return 0

    service = load_service_role_key()
    if not service:
        print(
            "錯誤：--apply-rest 需要 SUPABASE_SERVICE_ROLE_KEY（請寫入 .env 或匯出環境變數）。",
            file=sys.stderr,
        )
        return 1

    sb_url, _anon = load_env()
    sb_key = service

    by_name = fetch_all_students(sb_url, sb_key)
    name_to_id: dict[str, str] = {}
    ambiguous: list[str] = []
    for n in sorted(all_names):
        ids = by_name.get(n, [])
        if len(ids) > 1:
            ambiguous.append(n)
            name_to_id[n] = ids[0]
        elif len(ids) == 1:
            name_to_id[n] = ids[0]
    # 需新建
    to_create = [n for n in all_names if n not in name_to_id]
    seq = int(time.time()) % 90000
    for j, n in enumerate(to_create):
        tg = None
        for pr in parsed:
            if n in pr["student_names"]:
                tg = infer_student_grade(pr["grade_arr"], infer_grade_from_title(pr["title"]))
                if tg:
                    break
        code = f"S-2526-IMP-{seq + j:05d}"
        body = {
            "full_name": n,
            "student_code": code,
            "grade": tg,
            "school": None,
            "registration_status": "已註冊",
            "enrollment_status": "在讀",
            "academic_stage": "中學中",
            "status": "在讀",
        }
        st, ins = supabase_request(
            "POST",
            sb_url,
            sb_key,
            "students",
            body,
            prefer="return=representation",
        )
        if st not in (200, 201) or not isinstance(ins, list) or not ins:
            raise RuntimeError(f"insert student failed {n}: {st} {ins}")
        name_to_id[n] = str(ins[0]["id"])
        by_name[n].append(name_to_id[n])

    created_classes: list[dict[str, Any]] = []
    enrollments_payload: list[dict[str, Any]] = []

    for pr in parsed:
        garr = pr["grade_arr"]
        class_body: dict[str, Any] = {
            "subject": pr["subject"] or "其他",
            "course_code": None,
            "grade": garr if garr else None,
            "day_of_week": pr["day_of_week"],
            "time_slot": pr["time_slot"],
            "teacher_id": None,
            "classroom_id": None,
            "capacity": None,
            "price_per_lesson": pr["price_per_lesson"],
            "start_date": "2025-09-01",
            "end_date": "2026-08-31",
            "status": "進行中",
        }
        st, cls = supabase_request(
            "POST",
            sb_url,
            sb_key,
            "classes",
            class_body,
            prefer="return=representation",
        )
        if st not in (200, 201) or not isinstance(cls, list) or not cls:
            raise RuntimeError(f"insert class failed row {pr['row_index']}: {st} {cls}")
        cid = str(cls[0]["id"])
        created_classes.append({"id": cid, "title": pr["title"], "row": pr["row_index"]})
        tag = f"[2526匯入] {pr['title']}"
        for sn in pr["student_names"]:
            sid = name_to_id.get(sn)
            if not sid:
                continue
            enrollments_payload.append(
                {
                    "student_id": sid,
                    "class_id": cid,
                    "status": "就讀中",
                    "enroll_date": "2025-09-01",
                    "remarks": tag[:500],
                }
            )

    # bulk enrollments in chunks
    chunk = 200
    for i in range(0, len(enrollments_payload), chunk):
        batch = enrollments_payload[i : i + chunk]
        st, _ = supabase_request(
            "POST",
            sb_url,
            sb_key,
            "student_class_enrollments",
            batch,
            prefer="return=minimal",
        )
        if st not in (200, 201):
            raise RuntimeError(f"batch enroll failed at {i}: {st}")

    report = {
        "classes_created": len(created_classes),
        "enrollments_inserted": len(enrollments_payload),
        "students_created": len(to_create),
        "ambiguous_duplicate_names": ambiguous,
        "class_ids": [c["id"] for c in created_classes],
    }
    (OUT_DIR / "import_report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
