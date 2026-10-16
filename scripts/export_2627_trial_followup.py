#!/usr/bin/env python3
"""Export 2627 trial follow-up JSON (and optional PDF) from production.

Usage:
  python3 scripts/export_2627_trial_followup.py
  python3 scripts/export_2627_trial_followup.py --as-of 2026-10-20 --pdf
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from datetime import date
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = Path(__file__).resolve().parent
OUT_JSON = ROOT / "docs" / "generated" / "2627" / "2627_TRIAL_FOLLOWUP.json"
OUT_PDF = ROOT / "docs" / "generated" / "2627" / "2627_TRIAL_FOLLOWUP.pdf"

if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

_tuition_spec = importlib.util.spec_from_file_location(
    "export_2627_period2_tuition_chase",
    SCRIPTS / "export_2627_period2_tuition_chase.py",
)
_tuition = importlib.util.module_from_spec(_tuition_spec)
assert _tuition_spec.loader is not None
_tuition_spec.loader.exec_module(_tuition)

run_sql = _tuition.run_sql
today_hk = _tuition.today_hk
GRADE_TO_CODE = _tuition.GRADE_TO_CODE

ATTENDED = {"現場", "出席"}

SQL = """
select
  ts.trial_date::text as trial_date,
  coalesce(ts.trial_type, '') as trial_type,
  coalesce(ts.status, '') as status,
  coalesce(ts.outcome, 'open') as outcome,
  ts.outcome_reason,
  ts.outcome_note,
  s.full_name as student_name,
  s.grade as student_grade,
  s.parent_phone_country_code,
  s.parent_phone,
  s.whatsapp,
  s.student_phone,
  c.subject,
  c.course_code_full,
  co.course_name,
  coalesce(t.english_name, t.full_name, '') as teacher_name,
  sch.start_time,
  sch.end_time,
  pay.status as payment_status,
  exists (
    select 1
    from student_class_enrollments e
    where e.student_id = ts.student_id
      and e.class_id = ts.class_id
      and e.status = '就讀中'
  ) as enrolled_active,
  (
    select ad.status
    from attendance_details ad
    where ad.student_id = ts.student_id
      and ad.schedule_id = ts.schedule_id
    limit 1
  ) as attendance_status
from trial_sessions ts
join students s on s.id = ts.student_id
join classes c on c.id = ts.class_id
join academic_years y on y.id = c.academic_year_id
left join courses co on co.id = c.course_id
left join schedules sch on sch.id = ts.schedule_id
left join teachers t on t.id = coalesce(sch.teacher_id, c.teacher_id)
left join payments pay on pay.id = ts.payment_id
where y.label = '2627'
  and coalesce(ts.outcome, 'open') <> 'converted'
  and coalesce(s.full_name, '') not ilike '%test%'
  and coalesce(c.course_code_full, '') not ilike '%test%'
  and coalesce(c.subject, '') not ilike '%test%'
order by ts.trial_date, sch.start_time, s.full_name;
"""


def fmt_hm(raw: str | None) -> str:
    text = str(raw or "").strip()
    if len(text) >= 5 and text[2] == ":":
        return text[:5]
    return text


def fmt_day(ymd: str) -> str:
    parsed = date.fromisoformat(ymd[:10])
    return f"{parsed.month}月{parsed.day}日"


def grade_code(raw: str | None) -> str:
    text = str(raw or "").strip()
    if text in GRADE_TO_CODE:
        return GRADE_TO_CODE[text]
    if text.upper() in {v.upper() for v in GRADE_TO_CODE.values()}:
        return text.upper()
    return text or "—"


def contact_of(row: dict[str, Any]) -> str:
    parent = str(row.get("parent_phone") or "").strip()
    if parent:
        cc = str(row.get("parent_phone_country_code") or "").strip()
        return f"{cc} {parent}".strip()
    for key in ("whatsapp", "student_phone"):
        value = str(row.get(key) or "").strip()
        if value:
            return value
    return "—"


def class_label(row: dict[str, Any]) -> str:
    name = str(row.get("course_name") or row.get("subject") or "").strip()
    return name or "—"


def time_label(row: dict[str, Any]) -> str:
    start = fmt_hm(row.get("start_time"))
    end = fmt_hm(row.get("end_time"))
    if start and end:
        return f"{start}-{end}"
    return start or end or ""


def payment_label(row: dict[str, Any]) -> str:
    status = str(row.get("payment_status") or "").strip()
    return status or "未出單"


def is_cancelled(row: dict[str, Any]) -> bool:
    return "取消" in str(row.get("status") or "")


def attended(row: dict[str, Any]) -> bool:
    mark = str(row.get("attendance_status") or "").strip()
    if mark in ATTENDED:
        return True
    if not mark and str(row.get("status") or "").strip() == "已完成":
        return True
    return False


def other_line(row: dict[str, Any]) -> str:
    day = fmt_day(str(row["trial_date"]))
    name = str(row.get("student_name") or "").strip() or "（未命名）"
    label = class_label(row)
    if is_cancelled(row):
        return f"{day} {name} {label} 已取消"
    outcome = str(row.get("outcome") or "open")
    if outcome == "lost":
        reason = str(row.get("outcome_reason") or "").strip()
        extra = f"：{reason}" if reason else ""
        return f"{day} {name} {label} 已流失{extra}"
    if outcome == "other":
        reason = str(row.get("outcome_reason") or row.get("outcome_note") or "").strip()
        extra = f"：{reason}" if reason else ""
        return f"{day} {name} {label} 其他結果{extra}"
    mark = str(row.get("attendance_status") or "").strip()
    if mark:
        return f"{day} {name} {label} 點名為{mark}"
    return f"{day} {name} {label} 尚未點名"


def build_payload(as_of: str) -> dict[str, Any]:
    as_of_date = date.fromisoformat(as_of)
    month_start = as_of_date.replace(day=1).isoformat()
    rows = run_sql(SQL)
    follow: list[dict[str, Any]] = []
    upcoming: list[dict[str, Any]] = []
    other: list[str] = []

    for row in rows:
        if row.get("enrolled_active") in (True, "true", "t", "1"):
            continue
        trial_day = str(row.get("trial_date") or "")[:10]
        if not trial_day:
            continue
        base = {
            "studentName": str(row.get("student_name") or "").strip(),
            "grade": grade_code(row.get("student_grade")),
            "contact": contact_of(row),
            "classLabel": class_label(row),
            "teacher": str(row.get("teacher_name") or "").strip() or "—",
            "trialDate": fmt_day(trial_day),
            "time": time_label(row),
            "trialType": str(row.get("trial_type") or "").strip(),
            "payment": payment_label(row),
            "actionHint": "跟進轉正",
            "_sort": (trial_day, time_label(row), str(row.get("student_name") or "")),
        }
        outcome = str(row.get("outcome") or "open")
        past = trial_day < as_of
        future = trial_day >= as_of
        in_month_or_future = trial_day >= month_start or future

        if is_cancelled(row):
            if in_month_or_future:
                other.append(other_line(row))
            continue
        if outcome in {"lost", "other"}:
            if in_month_or_future:
                other.append(other_line(row))
            continue
        if future:
            upcoming.append(base)
            continue
        if past and attended(row):
            follow.append(base)
            continue
        if past and in_month_or_future:
            other.append(other_line(row))

    follow.sort(key=lambda item: item["_sort"])
    upcoming.sort(key=lambda item: item["_sort"])
    for item in follow + upcoming:
        item.pop("_sort", None)

    parsed = as_of_date
    return {
        "asOf": as_of,
        "periodCaption": f"{parsed.year}年{parsed.month}月",
        "followUpRows": follow,
        "upcomingRows": upcoming,
        "otherFollowups": other,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="匯出 2627 試堂跟進 JSON（可連 PDF）")
    parser.add_argument("--as-of", default=None, help="查庫日 YYYY-MM-DD（預設香港今日）")
    parser.add_argument("--output", type=Path, default=OUT_JSON)
    parser.add_argument("--pdf", action="store_true")
    parser.add_argument("--pdf-output", type=Path, default=OUT_PDF)
    args = parser.parse_args()
    as_of = args.as_of or today_hk()
    date.fromisoformat(as_of)
    payload = build_payload(as_of)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(
        f"{args.output} follow={len(payload['followUpRows'])} "
        f"upcoming={len(payload['upcomingRows'])} other={len(payload['otherFollowups'])}"
    )
    if args.pdf:
        pdf_spec = importlib.util.spec_from_file_location(
            "generate_2627_trial_followup_pdf",
            SCRIPTS / "generate_2627_trial_followup_pdf.py",
        )
        pdf_mod = importlib.util.module_from_spec(pdf_spec)
        assert pdf_spec.loader is not None
        pdf_spec.loader.exec_module(pdf_mod)
        pdf_mod.build_pdf(pdf_mod.ensure_pmingliu(), payload, args.pdf_output)
        print(f"Wrote {args.pdf_output}")


if __name__ == "__main__":
    main()
