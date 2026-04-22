#!/usr/bin/env python3
"""
將【2526】排程 CSV 轉成 public.schedules 的 INSERT SQL（Supabase SQL Editor 執行）。

規則（與業主定案一致）：
  - 只處理「日期」晚於 2026-04-15（即 2026-04-16 起）。
  - 「已取消」整列不匯入。
  - 狀態：正常（排程中）／未有學生報讀／補堂／空白 → 預定；正常（已完成）→ 完成。
  - teacher_id 僅用 classes.teacher_id；不使用 CSV 內 Notion 連結。
  - classroom_id 一律 NULL。
  - 時間字串全形冒號等先正規化。
  - 班別：排程班別（去 Notion）為主；空則用堂次名稱 ^\\d{8}_(.+)$ 後綴；並套用 TITLE_ALIASES。
  - 班別對應：先班名鍵；不行則 soft_pick（同 reconcile，分數門檻 55）；多候選或對不到則略過。
  - 同一 (class_id, scheduled_date, start_time, end_time) 只保留第一筆（其餘略過）。
  - remarks 前綴 [2526排程CSV]。

用法（專案根目錄）：
  python3 scripts/import_2526_schedules.py [CSV路徑]
    → import-output/2526_schedules_insert.sql
    → import-output/2526_schedules_import_report.json
"""

from __future__ import annotations

import csv
import importlib.util
import json
import re
from datetime import date
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CSV = Path(
    "/Users/hoiyingfan/Downloads/私人和共用 2/"
    "【2526】排程 25973b60cb0280b4917cccc613542ebb_all.csv"
)
OUT_SQL = ROOT / "import-output" / "2526_schedules_insert.sql"
OUT_REPORT = ROOT / "import-output" / "2526_schedules_import_report.json"

rec: Any = None  # 於 main 內載入 reconcile 模組

DATE_AFTER = date(2026, 4, 15)
REMARKS_PREFIX = "[2526排程CSV]"

# 排程 CSV 與 DB 班名不一致時之別名（值用於班名鍵／soft 比對）
TITLE_ALIASES: dict[str, str] = {
    "中四級生物A班": "中四級生物科A班JCHU",
}

SESSION_TITLE_RE = re.compile(r"^\d{8}_(.+)$")
WD_CN = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"]


def load_module(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    m = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(m)
    return m


def sql_str(s: str) -> str:
    return "'" + str(s).replace("'", "''") + "'"


def strip_notion_title(s: str) -> str:
    s = rec.norm_ws(s or "")
    if not s:
        return ""
    m = re.match(r"^(.+?)\s*\(https://www\.notion\.so/", s)
    return m.group(1).strip() if m else s


def parse_csv_date(s: str) -> date | None:
    s = (s or "").strip()
    m = re.match(r"(\d{4})年(\d{1,2})月(\d{1,2})日", s)
    if not m:
        return None
    y, mo, d = int(m.group(1)), int(m.group(2)), int(m.group(3))
    try:
        return date(y, mo, d)
    except ValueError:
        return None


def normalize_time_slot(raw: str) -> tuple[str | None, str | None]:
    """回傳 (start_time, end_time) 如 17:45, 19:00；失敗則 (None, None)。"""
    t = (raw or "").strip().replace("：", ":").replace("－", "-").replace("—", "-")
    m = re.match(r"^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\s*$", t)
    if not m:
        return None, None
    return m.group(1), m.group(2)


def resolve_row_title(row: dict[str, str]) -> str:
    t = strip_notion_title(row.get("排程班別") or "")
    if t:
        return rec.norm_ws(t)
    sess = (row.get("堂次名稱") or "").strip()
    m = SESSION_TITLE_RE.match(sess)
    if m:
        return rec.norm_ws(m.group(1))
    return ""


def apply_aliases(title: str) -> str:
    t = rec.norm_ws(title)
    return TITLE_ALIASES.get(t, t)


def map_status_for_insert(csv_status: str) -> str:
    """回傳寫入 DB 之 status（預定／完成）。已取消應於上游略過。"""
    s = rec.norm_ws(csv_status or "")
    if not s:
        return "預定"
    if "已完成" in s:
        return "完成"
    return "預定"


def should_skip_cancelled(csv_status: str) -> bool:
    s = rec.norm_ws(csv_status or "")
    return "取消" in s


def build_soft_pr(
    title: str, scheduled: date, time_slot_norm: str, imp: Any
) -> dict[str, Any]:
    g = imp.infer_grade_from_title(title)
    grade_arr = [g] if g else []
    wd = WD_CN[scheduled.weekday()]
    subj = imp.subject_from_row({"班別名稱": title, "課程名稱": ""})
    return {
        "day_of_week": wd,
        "time_slot": time_slot_norm,
        "grade_arr": grade_arr,
        "subject_inferred": subj,
    }


def resolve_class_id(
    title: str,
    key_index: dict[str, list[str]],
    classes: list[dict[str, Any]],
    pr_soft: dict[str, Any],
) -> tuple[str | None, str]:
    t = apply_aliases(title)
    cid, how, cands = rec.match_class_by_keys(t, key_index)
    if cid:
        return cid, how
    if len(cands) > 1:
        return None, "班名鍵多筆候選"
    sc_id, sc_val, sc_cands = rec.soft_pick_class(pr_soft, classes)
    if sc_id:
        return sc_id, f"soft_match({sc_val})"
    if len(sc_cands) > 1 and sc_val >= 55:
        return None, "soft_match同分多筆"
    return None, "班名鍵無命中且soft不足"


def main() -> int:
    import sys

    csv_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_CSV
    if not csv_path.is_file():
        print(f"找不到 CSV：{csv_path}", file=sys.stderr)
        return 1

    global rec
    rec = load_module(ROOT / "scripts" / "reconcile_2526_roster_to_db.py", "rec")
    imp = load_module(ROOT / "scripts" / "import_2526_roster.py", "imp")

    sb_url, sb_key = rec.load_env()
    classes = rec.supabase_fetch_all(
        sb_url,
        sb_key,
        "classes?select=id,subject,grade,day_of_week,time_slot,course_code,teacher_id",
    )
    key_index = rec.build_db_key_index(classes)
    id_to_class = {str(c["id"]): c for c in classes}

    with csv_path.open(newline="", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))

    inserts: list[dict[str, Any]] = []
    skipped: list[dict[str, Any]] = []
    seen_keys: set[tuple[str, str, str, str]] = set()

    for i, row in enumerate(rows):
        line_no = i + 2
        raw_date = row.get("日期") or ""
        d = parse_csv_date(raw_date)
        if d is None or d <= DATE_AFTER:
            continue

        st = row.get("課堂狀態") or ""
        if should_skip_cancelled(st):
            skipped.append({"line": line_no, "reason": "已取消不匯入", "date": raw_date, "title_hint": resolve_row_title(row)})
            continue

        start_t, end_t = normalize_time_slot(row.get("上堂時間") or "")
        if not start_t:
            skipped.append({"line": line_no, "reason": "上堂時間無法解析", "date": raw_date, "time": row.get("上堂時間")})
            continue

        title = resolve_row_title(row)
        if not title:
            skipped.append({"line": line_no, "reason": "無班別（排程班別空且堂次無法還原）", "date": raw_date})
            continue

        time_slot_norm = f"{start_t}-{end_t}"
        pr_soft = build_soft_pr(title, d, time_slot_norm, imp)
        cid, how = resolve_class_id(title, key_index, classes, pr_soft)
        if not cid:
            skipped.append(
                {
                    "line": line_no,
                    "reason": how,
                    "date": raw_date,
                    "class_title": title,
                }
            )
            continue

        cls = id_to_class.get(cid)
        if not cls:
            skipped.append({"line": line_no, "reason": "internal: class row missing", "class_id": cid})
            continue

        teacher_id = cls.get("teacher_id")
        tid_sql = "NULL::uuid" if teacher_id in (None, "") else f"{sql_str(str(teacher_id))}::uuid"

        dedup_key = (cid, d.isoformat(), start_t, end_t)
        if dedup_key in seen_keys:
            skipped.append(
                {
                    "line": line_no,
                    "reason": "與前序列重複（同班同日同時段只入一筆）",
                    "class_title": title,
                    "date": raw_date,
                    "time": time_slot_norm,
                }
            )
            continue
        seen_keys.add(dedup_key)

        status_db = map_status_for_insert(st)
        orig_st = rec.norm_ws(st) or "(空)"
        remarks = f"{REMARKS_PREFIX} 原狀態:{orig_st} 對班:{how}"[:500]

        inserts.append(
            {
                "line": line_no,
                "class_id": cid,
                "teacher_sql": tid_sql,
                "scheduled_date": d.isoformat(),
                "start_time": start_t,
                "end_time": end_t,
                "status": status_db,
                "remarks": remarks,
                "class_title": title,
            }
        )

    sql_lines = [
        "-- 2526 排程 CSV → public.schedules",
        f"-- 來源: {csv_path}",
        f"-- 日期條件: 晚於 {DATE_AFTER.isoformat()}；已取消不匯入；classroom_id 一律 NULL",
        f"-- 共 {len(inserts)} 筆 INSERT（略過已存在之同班同日同起迄時間）",
        "",
        "BEGIN;",
        "",
    ]

    for ins in inserts:
        block = (
            "INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)\n"
            "SELECT "
            f"{sql_str(ins['class_id'])}::uuid, {ins['teacher_sql']}, NULL::uuid, "
            f"{sql_str(ins['scheduled_date'])}::date, "
            f"{sql_str(ins['start_time'])}, {sql_str(ins['end_time'])}, "
            f"{sql_str(ins['status'])}, {sql_str(ins['remarks'])}\n"
            "WHERE NOT EXISTS (\n"
            "  SELECT 1 FROM public.schedules s\n"
            "  WHERE s.class_id = " + sql_str(ins["class_id"]) + "::uuid\n"
            "    AND s.scheduled_date = " + sql_str(ins["scheduled_date"]) + "::date\n"
            "    AND coalesce(s.start_time, '') = " + sql_str(ins["start_time"]) + "\n"
            "    AND coalesce(s.end_time, '') = " + sql_str(ins["end_time"]) + "\n"
            ");"
        )
        sql_lines.append(block)
        sql_lines.append(f"-- line {ins['line']} {ins['class_title']}")
        sql_lines.append("")

    sql_lines.append("COMMIT;")

    OUT_SQL.parent.mkdir(parents=True, exist_ok=True)
    OUT_SQL.write_text("\n".join(sql_lines), encoding="utf-8")

    report = {
        "source_csv": str(csv_path),
        "date_rule": f"scheduled_date > {DATE_AFTER.isoformat()}",
        "insert_statements": len(inserts),
        "skipped": skipped,
        "skipped_count": len(skipped),
    }
    OUT_REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Wrote {OUT_SQL} ({len(inserts)} inserts)")
    print(f"Wrote {OUT_REPORT} (skipped {len(skipped)})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
