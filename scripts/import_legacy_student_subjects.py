#!/usr/bin/env python3
"""匯入 Notion 舊班別名單為「學生 × 科目 × 時段」歷史事實。

預設只產生 dry-run 報告；加入 --apply-rest 才會寫入 Supabase。
需要在環境或 .env 提供 VITE_SUPABASE_URL 及 SUPABASE_SERVICE_ROLE_KEY。
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
import ssl
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from datetime import date
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = Path(os.environ.get("LEGACY_IMPORT_OUTPUT_DIR", "/tmp/mainhope-legacy-import"))
DEFAULT_CSV = Path(
    "/Users/hoiyingfan/Downloads/私人和共用 6/"
    "【2526】課程及班別 25273b60cb028020b6a9f9b45f2c52b3_all.csv"
)
PERIOD_START = date(2026, 1, 1)
PERIOD_END = date(2026, 6, 30)

SUBJECT_TITLE_RULES: list[tuple[str, str]] = [
    ("企會財", "BAFS"),
    ("會計理財", "BAFS"),
    ("BAFS", "BAFS"),
    ("中國文學", "CLIT"),
    ("文學", "CLIT"),
    ("中國歷史", "CHIS"),
    ("中史", "CHIS"),
    ("中文", "CHI"),
    ("中國語文", "CHI"),
    ("英文", "ENG"),
    ("英國語文", "ENG"),
    ("英B班", "ENG"),
    ("數學延伸部分（單元二", "M2"),
    ("數學延伸", "M2"),
    ("M2", "M2"),
    ("數學延伸部分（單元一", "M1"),
    ("M1", "M1"),
    ("數學", "MATH"),
    ("物理", "PHY"),
    ("化學", "CHEM"),
    ("生物", "BIO"),
    ("綜合科學", "SCI"),
    ("科學", "SCI"),
    ("經濟", "ECON"),
    ("地理", "GEOG"),
    ("歷史", "HIST"),
    ("資訊及通訊科技", "ICT"),
    ("ICT", "ICT"),
    ("公社", "ISCI"),
    ("公民", "ISCI"),
    ("功課輔導", "HWK"),
    ("功課班", "HWK"),
]

COURSE_CODE_PRIORITY = [
    "BAFS",
    "CHIS",
    "CLIT",
    "CHEM",
    "MATH",
    "ECON",
    "GEOG",
    "HIST",
    "HMSC",
    "ISCI",
    "ICT",
    "PHY",
    "BIO",
    "ENG",
    "CHI",
    "M2",
    "M1",
    "SCI",
    "HWK",
    "THS",
    "DAT",
]


def norm(value: str | None) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip())


def load_env_value(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if value:
        return value
    env_path = ROOT / ".env"
    if not env_path.is_file():
        return ""
    for raw in env_path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if line.startswith(f"{name}="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    return ""


def supabase_request(
    method: str,
    base_url: str,
    key: str,
    path: str,
    body: Any | None = None,
    prefer: str | None = None,
) -> Any:
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    payload = None if body is None else json.dumps(body, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        f"{base_url.rstrip('/')}/rest/v1/{path}",
        data=payload,
        headers=headers,
        method=method,
    )
    try:
        with urllib.request.urlopen(
            req, timeout=120, context=ssl.create_default_context()
        ) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Supabase HTTP {exc.code}: {detail}") from exc
    except (ssl.SSLError, urllib.error.URLError, OSError) as exc:
        raise RuntimeError(f"Supabase request failed: {exc}") from exc


def fetch_all(base_url: str, key: str, table: str, select: str) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    offset = 0
    while True:
        query = urllib.parse.urlencode(
            {"select": select, "limit": "1000", "offset": str(offset)}, safe=",*"
        )
        page = supabase_request("GET", base_url, key, f"{table}?{query}")
        if not isinstance(page, list):
            raise RuntimeError(f"Unexpected {table} response")
        rows.extend(page)
        if len(page) < 1000:
            return rows
        offset += 1000


def parse_notion_relation(cell: str) -> list[dict[str, str | None]]:
    items: list[dict[str, str | None]] = []
    for part in re.split(r",\s*(?=[^,]+?\(https?://)", str(cell or "").strip()):
        text = norm(part)
        if not text:
            continue
        match = re.match(r"^(.*?)\s*\((https?://[^)]+)\)$", text)
        if not match:
            items.append({"name": text, "ref": None})
            continue
        name = norm(match.group(1))
        ref_match = re.search(r"([0-9a-fA-F]{32})(?:\?[^)]*)?$", match.group(2))
        items.append({"name": name, "ref": ref_match.group(1).lower() if ref_match else None})
    return items


def row_has_period_schedule(row: dict[str, str]) -> bool:
    schedule_text = " ".join(
        [row.get("相關排程", "") or "", row.get("日期", "") or ""]
    )
    for day_text, month_text, year_text in re.findall(
        r"(?<!\d)(\d{2})(\d{2})(20\d{2})(?!\d)", schedule_text
    ):
        try:
            value = date(int(year_text), int(month_text), int(day_text))
        except ValueError:
            continue
        if PERIOD_START <= value <= PERIOD_END:
            return True
    return False


def infer_subject_code(row: dict[str, str]) -> str | None:
    raw_code = re.sub(r"[^A-Z0-9]", "", norm(row.get("Course Code")).upper())
    for code in COURSE_CODE_PRIORITY:
        if code in raw_code:
            return code
    combined = " ".join(
        [
            norm(row.get("班別名稱")),
            norm(row.get("課程名稱")),
            norm(row.get("Course Code")),
        ]
    )
    combined_upper = combined.upper()
    for needle, code in SUBJECT_TITLE_RULES:
        if needle.upper() in combined_upper:
            return code
    return None


def parse_source(csv_path: Path) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    with csv_path.open(newline="", encoding="utf-8-sig") as handle:
        rows = list(csv.DictReader(handle))

    source_facts: list[dict[str, Any]] = []
    rows_without_period_schedule: list[dict[str, Any]] = []
    rows_without_subject: list[dict[str, Any]] = []
    rows_without_students: list[dict[str, Any]] = []

    for index, row in enumerate(rows, start=2):
        title = norm(row.get("班別名稱")) or norm(row.get("課程名稱"))
        if not row_has_period_schedule(row):
            rows_without_period_schedule.append({"row": index, "class": title})
            continue
        subject_code = infer_subject_code(row)
        if not subject_code:
            rows_without_subject.append({"row": index, "class": title})
            continue
        students = parse_notion_relation(row.get("已報讀學生", "") or "")
        if not students:
            rows_without_students.append({"row": index, "class": title})
            continue
        for student in students:
            source_facts.append(
                {
                    "source_row": index,
                    "source_class": title,
                    "student_name": student["name"],
                    "student_ref": student["ref"],
                    "subject_code": subject_code,
                    "source_subject_label": title,
                }
            )

    return source_facts, {
        "csv_rows": len(rows),
        "rows_without_period_schedule": rows_without_period_schedule,
        "rows_without_subject": rows_without_subject,
        "rows_without_students": rows_without_students,
    }


def sql_literal(value: Any) -> str:
    if value is None:
        return "null"
    return "'" + str(value).replace("'", "''") + "'"


def source_facts_sql(source_facts: list[dict[str, Any]]) -> str:
    values = []
    for fact in source_facts:
        values.append(
            "("
            + ", ".join(
                [
                    str(int(fact["source_row"])),
                    sql_literal(fact["source_class"]),
                    sql_literal(fact["student_name"]),
                    sql_literal(fact["student_ref"]),
                    sql_literal(fact["subject_code"]),
                    sql_literal(fact["source_subject_label"]),
                ]
            )
            + ")"
        )
    return """create temporary table legacy_source_facts (
  source_row integer not null,
  source_class text not null,
  student_name text not null,
  student_ref text,
  subject_code text not null,
  source_subject_label text not null
) on commit drop;

insert into legacy_source_facts values
""" + ",\n".join(values) + ";\n"


def write_sql_files(source_facts: list[dict[str, Any]], csv_path: Path) -> tuple[Path, Path]:
    setup = source_facts_sql(source_facts)
    match_ctes = """
with student_matches as (
  select
    f.*,
    s.id as student_id,
    count(s.id) over (partition by f.source_row, f.student_name) as student_match_count
  from legacy_source_facts f
  left join public.students s on btrim(s.full_name) = f.student_name
),
resolved as (
  select sm.*, sub.id as subject_id
  from student_matches sm
  left join public.subjects sub on upper(sub.code) = sm.subject_code
),
classified as (
  select *,
    case
      when subject_id is null then 'unmatched_subject'
      when student_match_count = 0 then 'unmatched_student'
      when student_match_count > 1 then 'ambiguous_student'
      else 'matched'
    end as match_status
  from resolved
)
"""
    dry_run_sql = (
        "begin;\n"
        + setup
        + match_ctes
        + """select jsonb_build_object(
  'status_counts',
  (
    select jsonb_object_agg(match_status, fact_count)
    from (
      select match_status, count(*)::integer as fact_count
      from classified
      group by match_status
    ) counts
  ),
  'unmatched',
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'source_row', source_row,
          'source_class', source_class,
          'student_name', student_name,
          'subject_code', subject_code,
          'match_status', match_status
        )
        order by match_status, source_row, student_name
      )
      from (
        select distinct source_row, source_class, student_name, subject_code, match_status
        from classified
        where match_status <> 'matched'
      ) details
    ),
    '[]'::jsonb
  ),
  'matched_source_facts',
  count(*) filter (where match_status = 'matched'),
  'matched_unique_student_subjects',
  count(distinct (student_id, subject_id)) filter (where match_status = 'matched'),
  'duplicate_source_facts',
  count(*) filter (where match_status = 'matched')
    - count(distinct (student_id, subject_id)) filter (where match_status = 'matched')
) as report
from classified;
rollback;
"""
    )

    import_sql = (
        "begin;\n"
        + setup
        + """create temporary table legacy_batch_state (id uuid primary key) on commit drop;

with student_counts as (
  select btrim(full_name) as full_name, count(*) as match_count, min(id::text)::uuid as student_id
  from public.students
  group by btrim(full_name)
),
classified as (
  select
    f.*,
    sc.student_id,
    coalesce(sc.match_count, 0) as student_match_count,
    sub.id as subject_id
  from legacy_source_facts f
  left join student_counts sc on sc.full_name = f.student_name
  left join public.subjects sub on upper(sub.code) = f.subject_code
),
batch as (
  insert into public.legacy_import_batches (
    source_system,
    source_filename,
    period_start,
    period_end,
    total_source_rows,
    imported_rows,
    unmatched_count,
    duplicate_count
  )
  select
    'notion',
    """
        + sql_literal(csv_path.name)
        + """,
    date '2026-01-01',
    date '2026-06-30',
    (select count(*) from legacy_source_facts),
    0,
    count(*) filter (where student_match_count <> 1 or subject_id is null),
    greatest(
      0,
      count(*) filter (where student_match_count = 1 and subject_id is not null)
      - count(distinct (student_id, subject_id))
        filter (where student_match_count = 1 and subject_id is not null)
    )
  from classified
  returning id
)
insert into legacy_batch_state select id from batch;

with student_counts as (
  select btrim(full_name) as full_name, count(*) as match_count, min(id::text)::uuid as student_id
  from public.students
  group by btrim(full_name)
),
matched as (
  select
    f.*,
    sc.student_id,
    sub.id as subject_id,
    row_number() over (
      partition by sc.student_id, sub.id
      order by f.source_row, f.source_class
    ) as subject_rank
  from legacy_source_facts f
  join student_counts sc on sc.full_name = f.student_name and sc.match_count = 1
  join public.subjects sub on upper(sub.code) = f.subject_code
)
insert into public.legacy_student_subject_enrollments (
  student_id,
  subject_id,
  period_start,
  period_end,
  source_system,
  source_student_ref,
  source_student_name,
  source_subject_label,
  import_batch_id
)
select
  student_id,
  subject_id,
  date '2026-01-01',
  date '2026-06-30',
  'notion',
  student_ref,
  student_name,
  source_subject_label,
  (select id from legacy_batch_state)
from matched
where subject_rank = 1
on conflict (student_id, subject_id, period_start, period_end) do nothing;

update public.legacy_import_batches b
set imported_rows = (
  select count(*)
  from public.legacy_student_subject_enrollments h
  where h.import_batch_id = b.id
)
where b.id = (select id from legacy_batch_state);

select *
from public.legacy_import_batches
where id = (select id from legacy_batch_state);
commit;
"""
    )

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    dry_run_path = OUT_DIR / "legacy_student_subjects_dry_run.sql"
    import_path = OUT_DIR / "legacy_student_subjects_import.sql"
    dry_run_path.write_text(dry_run_sql, encoding="utf-8")
    import_path.write_text(import_sql, encoding="utf-8")
    return dry_run_path, import_path


def build_dry_run(
    source_facts: list[dict[str, Any]],
    students: list[dict[str, Any]],
    subjects: list[dict[str, Any]],
    parse_notes: dict[str, Any],
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    student_ids_by_name: dict[str, list[str]] = defaultdict(list)
    for student in students:
        name = norm(student.get("full_name"))
        if name:
            student_ids_by_name[name].append(str(student["id"]))
    subject_by_code = {norm(s.get("code")).upper(): s for s in subjects}

    matched: list[dict[str, Any]] = []
    unmatched_students: list[dict[str, Any]] = []
    ambiguous_students: list[dict[str, Any]] = []
    unmatched_subjects: list[dict[str, Any]] = []
    duplicate_keys: set[tuple[str, str]] = set()
    duplicates: list[dict[str, Any]] = []

    for fact in source_facts:
        ids = student_ids_by_name.get(fact["student_name"], [])
        subject = subject_by_code.get(fact["subject_code"])
        if not subject:
            unmatched_subjects.append(fact)
            continue
        if not ids:
            unmatched_students.append(fact)
            continue
        if len(ids) > 1:
            ambiguous_students.append({**fact, "candidate_student_ids": ids})
            continue
        key = (ids[0], str(subject["id"]))
        if key in duplicate_keys:
            duplicates.append(fact)
            continue
        duplicate_keys.add(key)
        matched.append(
            {
                "student_id": ids[0],
                "subject_id": str(subject["id"]),
                "period_start": PERIOD_START.isoformat(),
                "period_end": PERIOD_END.isoformat(),
                "source_system": "notion",
                "source_student_ref": fact["student_ref"],
                "source_student_name": fact["student_name"],
                "source_subject_label": fact["source_subject_label"],
            }
        )

    report = {
        "source": parse_notes,
        "source_fact_count": len(source_facts),
        "matched_unique_count": len(matched),
        "duplicate_count": len(duplicates),
        "unmatched_student_count": len(unmatched_students),
        "ambiguous_student_count": len(ambiguous_students),
        "unmatched_subject_count": len(unmatched_subjects),
        "unmatched_students": unmatched_students,
        "ambiguous_students": ambiguous_students,
        "unmatched_subjects": unmatched_subjects,
        "duplicates": duplicates,
    }
    return matched, report


def apply_import(
    base_url: str,
    key: str,
    source_filename: str,
    matched: list[dict[str, Any]],
    report: dict[str, Any],
) -> str:
    batch_payload = {
        "source_system": "notion",
        "source_filename": source_filename,
        "period_start": PERIOD_START.isoformat(),
        "period_end": PERIOD_END.isoformat(),
        "total_source_rows": report["source_fact_count"],
        "imported_rows": 0,
        "unmatched_count": (
            report["unmatched_student_count"]
            + report["ambiguous_student_count"]
            + report["unmatched_subject_count"]
        ),
        "duplicate_count": report["duplicate_count"],
    }
    batches = supabase_request(
        "POST",
        base_url,
        key,
        "legacy_import_batches",
        batch_payload,
        prefer="return=representation",
    )
    if not isinstance(batches, list) or len(batches) != 1:
        raise RuntimeError("Failed to create legacy import batch")
    batch_id = str(batches[0]["id"])

    inserted_count = 0
    for start in range(0, len(matched), 200):
        payload = [
            {**item, "import_batch_id": batch_id}
            for item in matched[start : start + 200]
        ]
        query = (
            "legacy_student_subject_enrollments"
            "?on_conflict=student_id,subject_id,period_start,period_end"
        )
        inserted = supabase_request(
            "POST",
            base_url,
            key,
            query,
            payload,
            prefer="resolution=ignore-duplicates,return=representation",
        )
        if isinstance(inserted, list):
            inserted_count += len(inserted)

    patch_query = (
        "legacy_import_batches?id=eq."
        + urllib.parse.quote(batch_id)
    )
    supabase_request(
        "PATCH",
        base_url,
        key,
        patch_query,
        {"imported_rows": inserted_count},
        prefer="return=minimal",
    )
    report["batch_id"] = batch_id
    report["inserted_count"] = inserted_count
    return batch_id


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("csv_path", nargs="?", type=Path, default=DEFAULT_CSV)
    parser.add_argument("--apply-rest", action="store_true")
    args = parser.parse_args()
    if not args.csv_path.is_file():
        parser.error(f"找不到 CSV：{args.csv_path}")

    base_url = load_env_value("VITE_SUPABASE_URL")
    service_key = load_env_value("SUPABASE_SERVICE_ROLE_KEY")

    source_facts, parse_notes = parse_source(args.csv_path)
    dry_run_sql_path, import_sql_path = write_sql_files(source_facts, args.csv_path)
    if not base_url or not service_key:
        print(
            json.dumps(
                {
                    "source_facts": len(source_facts),
                    "parse_notes": parse_notes,
                    "dry_run_sql": str(dry_run_sql_path),
                    "import_sql": str(import_sql_path),
                    "note": "未提供 service role；已產生可用 npx supabase db query --linked 執行的 SQL。",
                },
                ensure_ascii=False,
                indent=2,
            )
        )
        return 0

    students = fetch_all(base_url, service_key, "students", "id,full_name")
    subjects = fetch_all(base_url, service_key, "subjects", "id,code,name_zh,short_name")
    matched, report = build_dry_run(source_facts, students, subjects, parse_notes)

    if args.apply_rest:
        apply_import(base_url, service_key, args.csv_path.name, matched, report)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    report_path = OUT_DIR / "legacy_student_subjects_report.json"
    report_path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(
        json.dumps(
            {
                "report": str(report_path),
                "source_facts": report["source_fact_count"],
                "matched_unique": report["matched_unique_count"],
                "unmatched_students": report["unmatched_student_count"],
                "ambiguous_students": report["ambiguous_student_count"],
                "unmatched_subjects": report["unmatched_subject_count"],
                "duplicates": report["duplicate_count"],
                "inserted": report.get("inserted_count"),
                "batch_id": report.get("batch_id"),
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
