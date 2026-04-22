#!/usr/bin/env python3
"""
依 2526 CSV + 目前 Supabase classes／students，
產生 student_class_enrollments 的 INSERT SQL（略過已存在之相同 student_id+class_id）。

班別 id 解析優先序：
  1) import-output/residual_classes_insert.sql 註解列出的 row_index → uuid5(residual_ns, 2526-residual-row{n})
  2) import-output/one_on_one_and_single_classes.csv 的 row_index → uuid5(oneon_ns, 2526-1on1-row{n}+{班別名稱})
  3) 其餘：與 reconcile 相同之班名鍵／模糊比對；同分取候選中字典序最小的 class id

重名學生：取資料庫回傳順序第一筆 id（寫入 enrollment_report.json 供人工核對）。
"""
from __future__ import annotations

import csv
import importlib.util
import json
import re
import uuid
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = Path(
    "/Users/hoiyingfan/Downloads/私人和共用/"
    "【2526】課程及班別 25273b60cb028020b6a9f9b45f2c52b3_all.csv"
)
RESIDUAL_SQL = ROOT / "import-output" / "residual_classes_insert.sql"
ONE_ON_CSV = ROOT / "import-output" / "one_on_one_and_single_classes.csv"
OUT_SQL = ROOT / "import-output" / "2526_enrollments_insert.sql"
OUT_REPORT = ROOT / "import-output" / "enrollment_generation_report.json"

NS_ONE = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")
NS_RES = uuid.UUID("a3bbcee5-b2c0-4bef-9c0d-0e5f1a2b3c4d")


def load_module(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    m = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(m)
    return m


def parse_residual_row_indices() -> set[int]:
    if not RESIDUAL_SQL.is_file():
        return set()
    s = RESIDUAL_SQL.read_text(encoding="utf-8")
    return {int(m.group(1)) for m in re.finditer(r"^-- row_index=(\d+)", s, re.MULTILINE)}


def parse_one_on_one_map() -> dict[int, str]:
    if not ONE_ON_CSV.is_file():
        return {}
    out: dict[int, str] = {}
    with ONE_ON_CSV.open(encoding="utf-8-sig", newline="") as f:
        for r in csv.DictReader(f):
            out[int(r["row_index"])] = (r.get("班別名稱") or "").strip()
    return out


def sql_str(s: str) -> str:
    return "'" + str(s).replace("'", "''") + "'"


def main() -> None:
    rec = load_module(ROOT / "scripts" / "reconcile_2526_roster_to_db.py", "rec")
    imp = load_module(ROOT / "scripts" / "import_2526_roster.py", "imp")

    sb_url, sb_key = rec.load_env()
    students = rec.supabase_fetch_all(sb_url, sb_key, "students?select=id,full_name")
    classes = rec.supabase_fetch_all(
        sb_url, sb_key, "classes?select=id,subject,grade,day_of_week,time_slot,course_code"
    )

    name_to_ids: dict[str, list[str]] = defaultdict(list)
    for s in students:
        fn = rec.norm_ws(str(s.get("full_name") or ""))
        if fn:
            name_to_ids[fn].append(str(s["id"]))

    residual_rows = parse_residual_row_indices()
    one_on_map = parse_one_on_one_map()

    parsed = rec.parse_csv_rows(imp, CSV_PATH)
    key_index = rec.build_db_key_index(classes)

    ambiguous_students_used: dict[str, str] = {}
    skipped_no_class: list[dict] = []
    skipped_no_student: list[dict] = []

    pairs: list[tuple[str, str, int, str, str]] = []
    seen: set[tuple[str, str]] = set()

    for pr in parsed:
        ri = pr["row_index"]
        title = pr["title"]
        cid: str | None = None
        if ri in residual_rows:
            cid = str(uuid.uuid5(NS_RES, f"2526-residual-row{ri}"))
        elif ri in one_on_map:
            cid = str(uuid.uuid5(NS_ONE, f"2526-1on1-row{ri}-{one_on_map[ri]}"))
        else:
            cid, how, cands = rec.match_class_by_keys(title, key_index)
            if cid is None:
                sc_id, sc_val, sc_cands = rec.soft_pick_class(pr, classes)
                if sc_id:
                    cid = sc_id
                elif sc_cands:
                    cid = sorted(sc_cands)[0]
        if not cid:
            skipped_no_class.append({"row_index": ri, "title": title})
            continue

        for sn in pr["student_names"]:
            ids = name_to_ids.get(sn, [])
            if not ids:
                skipped_no_student.append({"row_index": ri, "title": title, "student_name": sn})
                continue
            sid = ids[0]
            if len(ids) > 1:
                ambiguous_students_used[sn] = sid
            key = (sid, cid)
            if key in seen:
                continue
            seen.add(key)
            rem = f"[2526匯入] {title}"[:500]
            pairs.append((sid, cid, ri, title, rem))

    lines = [
        "-- 2526 CSV → student_class_enrollments（略過已存在之相同 student_id + class_id）",
        "-- 重名學生已取第一筆 id，請見 import-output/enrollment_generation_report.json",
        "",
        "BEGIN;",
        "",
    ]

    for sid, cid, ri, title, rem in pairs:
        lines.append(
            "INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)"
            "\nSELECT "
            f"{sql_str(sid)}::uuid, {sql_str(cid)}::uuid, "
            f"{sql_str('就讀中')}, {sql_str('2025-09-01')}::date, {sql_str(rem)}"
            "\nWHERE NOT EXISTS ("
            "\n  SELECT 1 FROM public.student_class_enrollments e"
            "\n  WHERE e.student_id = "
            f"{sql_str(sid)}::uuid AND e.class_id = {sql_str(cid)}::uuid"
            "\n);"
        )
        lines.append(f"-- row {ri} {title.replace(chr(39), chr(39)+chr(39))}")
        lines.append("")

    lines.append("COMMIT;")

    OUT_SQL.write_text("\n".join(lines), encoding="utf-8")

    OUT_REPORT.write_text(
        json.dumps(
            {
                "enrollment_statements": len(pairs),
                "skipped_no_class": skipped_no_class,
                "skipped_no_student": skipped_no_student,
                "ambiguous_student_first_id": ambiguous_students_used,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    print(f"Wrote {OUT_SQL} ({len(pairs)} inserts)")
    print(f"Wrote {OUT_REPORT}")
    if skipped_no_class:
        print("skipped_no_class:", len(skipped_no_class))
    if skipped_no_student:
        print("skipped_no_student:", len(skipped_no_student))


if __name__ == "__main__":
    main()
