#!/usr/bin/env python3
"""匯出一整個曆月的新報讀整體報告 JSON，並可出 PDF。

  python3 scripts/export_monthly_new_enrollment_report.py --month 2026-11 --pdf
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
from calendar import monthrange
from datetime import date
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = Path(__file__).resolve().parent
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

GRADE_LABELS = {
    "P1": "小一",
    "P2": "小二",
    "P3": "小三",
    "P4": "小四",
    "P5": "小五",
    "P6": "小六",
    "S1": "中一",
    "S2": "中二",
    "S3": "中三",
    "S4": "中四",
    "S5": "中五",
    "S6": "中六",
    "GD": "已畢業",
    "NA": "不適用",
}

CHART_LABELS = {
    "數學（必修部份）": "數學必修",
    "數學延伸部分（單元二 M2）": "數學 M2",
    "企業、會計與財務概論": "企會財",
}


def previous_month(today: date) -> tuple[date, date]:
    if today.month == 1:
        year, month = today.year - 1, 12
    else:
        year, month = today.year, today.month - 1
    return month_bounds(year, month)


def month_bounds(year: int, month: int) -> tuple[date, date]:
    return date(year, month, 1), date(year, month, monthrange(year, month)[1])


def parse_month(value: str) -> tuple[date, date]:
    parts = value.split("-")
    if len(parts) != 2 or len(parts[0]) != 4 or len(parts[1]) != 2:
        raise SystemExit("月份須為 YYYY-MM")
    year, month = int(parts[0]), int(parts[1])
    if month < 1 or month > 12:
        raise SystemExit("月份須為 YYYY-MM")
    return month_bounds(year, month)


def grade_label(code: str | None) -> str:
    if not code:
        return "—"
    return GRADE_LABELS.get(code, code)


def list_subject(class_kind: str, subject: str) -> str:
    if class_kind != "private":
        return subject or "(未填科目)"
    if "英國語文" in (subject or ""):
        return "英國語文（私人課程）"
    base = subject or "私人課程"
    if base.endswith("（私人課程）"):
        return base
    return f"{base}（私人課程）"


def run_sql(sql: str) -> list[dict[str, Any]]:
    supabase = shutil.which("supabase")
    if not supabase:
        local = Path.home() / ".local" / "bin" / "supabase"
        supabase = str(local) if local.is_file() else None
    with tempfile.NamedTemporaryFile("w", suffix=".sql", delete=False, encoding="utf-8") as tmp:
        tmp.write(sql)
        tmp_path = tmp.name
    try:
        if supabase:
            cmd = [supabase, "db", "query", "--linked", "-o", "json", "-f", tmp_path]
        else:
            cmd = ["npx", "--yes", "supabase", "db", "query", "--linked", "-o", "json", "-f", tmp_path]
        completed = subprocess.run(
            cmd,
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
            env={
                **os.environ,
                "PATH": os.environ.get("PATH", "") + os.pathsep + str(Path.home() / ".local" / "bin"),
            },
        )
    finally:
        Path(tmp_path).unlink(missing_ok=True)
    if completed.returncode != 0:
        detail = ((completed.stdout or "") + "\n" + (completed.stderr or "")).strip()
        raise SystemExit(detail or "supabase db query failed")
    text = completed.stdout.strip()
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        start = text.find("[")
        if start < 0:
            raise
        parsed = json.loads(text[start:])
    if isinstance(parsed, dict):
        parsed = parsed.get("rows") or parsed.get("result") or []
    if not isinstance(parsed, list):
        raise SystemExit("查庫結果不是列陣")
    return parsed


def report_sql(start: date, end: date) -> str:
    if start.isoformat() != str(start) or end.isoformat() != str(end):
        raise SystemExit("日期格式不正確")
    return f"""
with params as (
  select date '{start.isoformat()}' as start_date,
         date '{end.isoformat()}' as end_date
),
scoped as (
  select
    e.id as enrollment_id,
    e.student_id,
    e.status,
    btrim(st.full_name, E' \\t\\n\\r') as full_name,
    st.grade,
    (st.created_at at time zone 'Asia/Hong_Kong')::date as registered_on,
    (e.created_at at time zone 'Asia/Hong_Kong')::date as enrollment_created_on,
    c.class_kind,
    case
      when c.class_kind = 'private' then '私人課程'
      else coalesce(subj.name_zh, nullif(btrim(c.subject), ''), '(未填科目)')
    end as subject_label,
    coalesce(subj.name_zh, nullif(btrim(c.subject), ''), '') as raw_subject,
    case
      when exists (
        select 1 from trial_sessions t
        where t.student_id = e.student_id
          and t.outcome = 'converted'
          and (t.converted_enrollment_id = e.id or t.class_id = e.class_id)
      ) then '試堂'
      else '直接報讀'
    end as path
  from student_class_enrollments e
  join students st on st.id = e.student_id
  join classes c on c.id = e.class_id
  left join teachers te on te.id = c.teacher_id
  left join courses co on co.id = c.course_id
  left join subjects subj on subj.id = co.subject_id
  left join academic_years ay on ay.id = c.academic_year_id
  where coalesce(st.full_name, '') not ilike '%test%'
    and coalesce(st.full_name, '') not ilike '%測試%'
    and coalesce(te.full_name, '') not ilike '%test%'
    and (
      (c.class_kind in ('group', 'homework') and ay.label = '2627')
      or c.class_kind = 'private'
    )
)
select
  case
    when enrollment_created_on between (select start_date from params) and (select end_date from params)
      then 'new'
    when status = '就讀中'
     and enrollment_created_on < (select start_date from params)
      then 'existing'
    else 'ignore'
  end as bucket,
  student_id::text,
  full_name,
  grade,
  registered_on::text,
  status,
  class_kind,
  subject_label,
  raw_subject,
  path
from scoped
where (
  enrollment_created_on between (select start_date from params) and (select end_date from params)
) or (
  status = '就讀中'
  and enrollment_created_on < (select start_date from params)
)
order by registered_on, full_name, subject_label, status;
"""


def build_payload(start: date, end: date, rows: list[dict[str, Any]]) -> dict[str, Any]:
    new_rows = [row for row in rows if row.get("bucket") == "new"]
    existing_rows = [row for row in rows if row.get("bucket") == "existing"]
    subjects: dict[str, dict[str, int]] = {}

    def slot(label: str) -> dict[str, int]:
        entry = subjects.get(label)
        if entry is None:
            entry = {"new_active": 0, "existing_active": 0, "withdrawn": 0}
            subjects[label] = entry
        return entry

    for row in existing_rows:
        slot(str(row.get("subject_label") or "(未填科目)"))["existing_active"] += 1
    withdrawn = 0
    trial = 0
    direct = 0
    list_rows = []
    for row in new_rows:
        label = str(row.get("subject_label") or "(未填科目)")
        status = str(row.get("status") or "")
        path = str(row.get("path") or "")
        if status == "就讀中":
            slot(label)["new_active"] += 1
        elif status == "已退讀":
            slot(label)["withdrawn"] += 1
            withdrawn += 1
        if path == "試堂":
            trial += 1
        else:
            direct += 1
        list_rows.append(
            {
                "name": str(row.get("full_name") or "").strip(),
                "registered_on": str(row.get("registered_on") or ""),
                "grade": grade_label(row.get("grade")),
                "subject": list_subject(str(row.get("class_kind") or ""), str(row.get("raw_subject") or label)),
                "path": "試堂" if path == "試堂" else "直接報讀",
                "status": status or "—",
            }
        )
    subject_rows = [
        {
            "subject": name,
            "chart": CHART_LABELS.get(name, name),
            "new_active": counts["new_active"],
            "existing_active": counts["existing_active"],
            "withdrawn": counts["withdrawn"],
        }
        for name, counts in subjects.items()
    ]
    subject_rows.sort(key=lambda item: (-item["new_active"], -item["existing_active"], item["subject"]))
    new_active = sum(item["new_active"] for item in subject_rows)
    existing_active = sum(item["existing_active"] for item in subject_rows)
    people = len({str(row.get("student_id")) for row in new_rows})
    return {
        "title": "新報讀整體報告",
        "month": f"{start.year:04d}-{start.month:02d}",
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "new_total": len(new_rows),
        "new_active": new_active,
        "existing_active": existing_active,
        "people": people,
        "trial": trial,
        "direct": direct,
        "withdrawn": withdrawn,
        "subjects": subject_rows,
        "rows": list_rows,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="匯出曆月新報讀整體報告")
    parser.add_argument("--month", default=None, help="YYYY-MM；省略則用香港今日的上一個曆月")
    parser.add_argument("--pdf", action="store_true", help="同時產出 PDF")
    parser.add_argument("--workdir", type=Path, default=None)
    args = parser.parse_args()
    if args.month:
        start, end = parse_month(args.month)
    else:
        from datetime import datetime
        from zoneinfo import ZoneInfo

        start, end = previous_month(datetime.now(ZoneInfo("Asia/Hong_Kong")).date())
    payload = build_payload(start, end, run_sql(report_sql(start, end)))
    work = args.workdir or (ROOT / "docs" / "generated" / "2627")
    work.mkdir(parents=True, exist_ok=True)
    json_path = work / f"新報讀整體報告_{start.isoformat()}_{end.isoformat()}.json"
    json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {json_path}")
    if args.pdf:
        from generate_new_enrollment_comparison_pdf import build_pdf
        from cjk_pdf_font import ensure_cjk_font

        pdf_path = work / f"新報讀整體報告_{start.isoformat()}_{end.isoformat()}.pdf"
        build_pdf(ensure_cjk_font(), payload, pdf_path)
        print(f"Wrote {pdf_path}")


if __name__ == "__main__":
    main()
