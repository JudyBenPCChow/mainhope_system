#!/usr/bin/env python3
"""
將【2526】出席記錄 CSV 轉成 public.attendance_details 匯入 SQL。
"""

from __future__ import annotations

import csv
import importlib.util
import json
import re
from datetime import datetime
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CSV = Path(
    "/Users/hoiyingfan/Downloads/私人和共用 3/"
    "【2526】出席記錄 25273b60cb02801fa12ddc0951477a0a_all.csv"
)
OUT_SQL = ROOT / "import-output" / "2526_attendance_insert.sql"
OUT_REPORT = ROOT / "import-output" / "2526_attendance_report.json"
OUT_UNMATCHED_STUDENTS = ROOT / "import-output" / "2526_attendance_unmatched_students.csv"
OUT_UNMATCHED_CLASSES = ROOT / "import-output" / "2526_attendance_unmatched_classes.csv"
OUT_NON_STANDARD = ROOT / "import-output" / "2526_attendance_non_standard_time_slots.csv"
OUT_ONE_ON_ONE_AMBIG = ROOT / "import-output" / "2526_attendance_one_on_one_ambiguous_with_students.csv"
OUT_SPECIAL_MD = ROOT / "import-output" / "2526_attendance_special_cases.md"

REMARKS_PREFIX = "[2526出席CSV]"
DAY_NAMES = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"]
LESSON_SLOT_SET = {
    "09:00-10:15",
    "10:15-11:30",
    "11:30-12:45",
    "12:45-14:00",
    "14:00-15:15",
    "15:15-16:30",
    "16:30-17:45",
    "17:45-19:00",
    "19:00-20:15",
    "20:15-21:30",
}


def load_module(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    m = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(m)
    return m


def sql_str(s: str) -> str:
    return "'" + str(s).replace("'", "''") + "'"


def norm_ws(rec: Any, s: str) -> str:
    return rec.norm_ws(s or "")


def strip_notion_link(rec: Any, s: str) -> str:
    t = norm_ws(rec, s)
    if not t:
        return ""
    t = re.sub(r"\s*\(https?://[^)]*\)\s*", "", t).strip()
    if t.startswith("@"):
        t = t[1:].strip()
    return norm_ws(rec, t)


def parse_date(s: str) -> str | None:
    raw = (s or "").strip()
    try:
        return datetime.strptime(raw, "%d/%m/%Y").strftime("%Y-%m-%d")
    except ValueError:
        return None


def normalize_time_slot(s: str) -> str | None:
    t = (s or "").strip().replace("：", ":").replace("－", "-").replace("—", "-").replace("–", "-")
    m = re.match(r"^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$", t)
    if not m:
        return None
    return f"{int(m.group(1)):02d}:{m.group(2)}-{int(m.group(3)):02d}:{m.group(4)}"


def schedule_title_to_class_title(rec: Any, schedule_ref: str) -> str:
    t = strip_notion_link(rec, schedule_ref)
    if not t:
        return ""
    m = re.match(r"^\d{8}_(.+)$", t)
    if m:
        t = m.group(1).strip()
    t = re.sub(r"\s*\(\d+\)\s*$", "", t)
    return norm_ws(rec, t)


def is_primary_school_class_title(title: str) -> bool:
    t = (title or "").strip()
    return "小學" in t or t.startswith("小")


def split_student_names(rec: Any, s: str) -> list[str]:
    raw = (s or "").strip()
    if not raw:
        return []
    parts = re.split(r"[，,]", raw)
    out: list[str] = []
    for p in parts:
        n = strip_notion_link(rec, p)
        if n:
            out.append(n)
    return out


def is_accidental_blank_row(rec: Any, row: dict[str, str]) -> bool:
    keys = [
        "出席紀錄名稱",
        "任教老師",
        "出席學生",
        "對應排程紀錄",
        "教學紀錄",
        "行政紀錄",
        "課堂名稱",
        "請堂或補堂紀錄（老師填寫）",
    ]
    return all(not strip_notion_link(rec, row.get(k, "")) for k in keys)


def merge_remarks(rec: Any, row: dict[str, str]) -> str | None:
    sections: list[str] = []
    for key in ("教學紀錄", "行政紀錄", "請堂或補堂紀錄（老師填寫）"):
        v = norm_ws(rec, row.get(key, ""))
        if v:
            sections.append(f"{key}: {v}")
    if not sections:
        return None
    return (f"{REMARKS_PREFIX} " + " | ".join(sections))[:800]


def write_csv(path: Path, headers: list[str], rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=headers)
        w.writeheader()
        for r in rows:
            w.writerow({h: r.get(h, "") for h in headers})


def resolve_by_enrollment(candidate_class_ids: list[str], student_ids: list[str], enrolled_pairs: set[tuple[str, str]]) -> str | None:
    if not candidate_class_ids or not student_ids:
        return None
    hits = [cid for cid in candidate_class_ids if all((sid, cid) in enrolled_pairs for sid in student_ids)]
    return hits[0] if len(hits) == 1 else None


def resolve_missing_schedule_by_students(
    student_ids: list[str],
    student_to_class_ids: dict[str, set[str]],
    classes_by_id: dict[str, dict[str, Any]],
    weekday: str,
    slot_for_matching: str | None,
) -> tuple[str | None, str]:
    if not student_ids:
        return None, "schedule_ref_missing_no_students"
    common: set[str] | None = None
    for sid in student_ids:
        cids = student_to_class_ids.get(sid, set())
        common = set(cids) if common is None else (common & cids)
    if not common:
        return None, "schedule_ref_missing_no_common_enrollment"
    cands = set(common)
    by_weekday = {cid for cid in cands if weekday in str(classes_by_id.get(cid, {}).get("day_of_week") or "")}
    if by_weekday:
        cands = by_weekday
    if slot_for_matching:
        by_slot = {cid for cid in cands if str(classes_by_id.get(cid, {}).get("time_slot") or "") == slot_for_matching}
        if by_slot:
            cands = by_slot
    if len(cands) == 1:
        return next(iter(cands)), "schedule_ref_missing_enrollment_intersection"
    return None, "schedule_ref_missing_ambiguous_common_enrollment"


def main() -> int:
    import sys

    csv_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_CSV
    if not csv_path.is_file():
        print(f"找不到 CSV: {csv_path}", file=sys.stderr)
        return 1

    rec = load_module(ROOT / "scripts" / "reconcile_2526_roster_to_db.py", "rec")
    imp = load_module(ROOT / "scripts" / "import_2526_roster.py", "imp")

    sb_url, sb_key = rec.load_env()
    students = rec.supabase_fetch_all(sb_url, sb_key, "students?select=id,full_name")
    classes = rec.supabase_fetch_all(sb_url, sb_key, "classes?select=id,subject,grade,day_of_week,time_slot,teacher_id")
    enrollments = rec.supabase_fetch_all(sb_url, sb_key, "student_class_enrollments?select=student_id,class_id,status")
    id_to_class = {str(c["id"]): c for c in classes}
    class_key_index = rec.build_db_key_index(classes)

    enrolled_pairs: set[tuple[str, str]] = set()
    student_to_class_ids: dict[str, set[str]] = {}
    for e in enrollments:
        sid = str(e.get("student_id") or "")
        cid = str(e.get("class_id") or "")
        st = str(e.get("status") or "")
        if not sid or not cid:
            continue
        if st and st not in ("就讀中", "試讀中", "補課中"):
            continue
        enrolled_pairs.add((sid, cid))
        student_to_class_ids.setdefault(sid, set()).add(cid)

    name_to_ids: dict[str, list[str]] = {}
    for s in students:
        n = norm_ws(rec, str(s.get("full_name") or ""))
        if n:
            name_to_ids.setdefault(n, []).append(str(s["id"]))

    with csv_path.open(encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))

    inserts: list[dict[str, Any]] = []
    skipped: list[dict[str, Any]] = []
    unmatched_students_rows: list[dict[str, Any]] = []
    unmatched_classes_rows: list[dict[str, Any]] = []
    non_standard_rows: list[dict[str, Any]] = []
    one_on_one_ambiguous_rows: list[dict[str, Any]] = []
    special_invalid_date_rows: list[dict[str, Any]] = []
    special_no_hit_rows: list[dict[str, Any]] = []
    special_schedule_missing_unresolved_rows: list[dict[str, Any]] = []
    seen_insert_keys: set[tuple[str, str, str]] = set()

    for idx, row in enumerate(rows):
        line = idx + 2
        student_names = split_student_names(rec, row.get("出席學生", ""))
        if is_accidental_blank_row(rec, row):
            skipped.append({"line": line, "reason": "疑似前台誤按空白列"})
            continue

        ymd = parse_date(row.get("上課日期", ""))
        if not ymd:
            skipped.append({"line": line, "reason": "日期格式無法解析", "raw_date": row.get("上課日期", "")})
            special_invalid_date_rows.append(
                {
                    "line": line,
                    "raw_date": row.get("上課日期", ""),
                    "raw_time": row.get("上課時間", ""),
                    "students": " | ".join(student_names),
                    "schedule_ref": row.get("對應排程紀錄", ""),
                }
            )
            continue

        slot = normalize_time_slot(row.get("上課時間", ""))
        if not student_names:
            skipped.append({"line": line, "reason": "出席學生為空"})
            continue

        student_ids: list[str] = []
        student_failed = False
        for nm in student_names:
            ids = name_to_ids.get(nm, [])
            if len(ids) == 1:
                student_ids.append(ids[0])
            else:
                student_failed = True
                reason = "student_name_not_found" if not ids else "student_name_ambiguous"
                unmatched_students_rows.append(
                    {
                        "line": line,
                        "student_name": nm,
                        "reason": reason,
                        "candidate_student_ids": "|".join(ids),
                        "class_title": "",
                        "date": ymd,
                        "time_slot": slot or "",
                    }
                )
                skipped.append({"line": line, "reason": f"學生無法唯一對應: {nm}"})
        if student_failed:
            continue

        involves_wen_juexi = any(nm == "溫珏禧" for nm in student_names)
        slot_for_matching = slot or ""
        if slot == "20:00-22:00" and involves_wen_juexi:
            slot_for_matching = ""

        if slot and slot not in LESSON_SLOT_SET and not (slot == "20:00-22:00" and involves_wen_juexi):
            non_standard_rows.append(
                {
                    "line": line,
                    "date": ymd,
                    "time_slot": slot,
                    "schedule_ref": row.get("對應排程紀錄", ""),
                    "students": row.get("出席學生", ""),
                }
            )
            skipped.append({"line": line, "reason": "非系統指定時段", "time_slot": slot})
            continue

        class_title = schedule_title_to_class_title(rec, row.get("對應排程紀錄", ""))
        class_id: str | None = None
        how = ""
        cands: list[str] = []
        if not class_title:
            weekday = DAY_NAMES[datetime.strptime(ymd, "%Y-%m-%d").weekday()]
            class_id, how = resolve_missing_schedule_by_students(
                student_ids, student_to_class_ids, id_to_class, weekday, slot_for_matching or None
            )
            if class_id is None:
                skipped.append({"line": line, "reason": "對應排程紀錄缺失且無法由學生報讀推斷班別"})
                unmatched_classes_rows.append(
                    {
                        "line": line,
                        "class_title": "",
                        "reason": "schedule_ref_missing",
                        "students": " | ".join(student_names),
                        "candidate_class_ids": "",
                        "schedule_ref": row.get("對應排程紀錄", ""),
                    }
                )
                special_schedule_missing_unresolved_rows.append(
                    {
                        "line": line,
                        "date": ymd,
                        "time_slot": slot or "",
                        "students": " | ".join(student_names),
                        "reason": how,
                        "schedule_ref": row.get("對應排程紀錄", ""),
                    }
                )
                continue
        else:
            if is_primary_school_class_title(class_title):
                skipped.append({"line": line, "reason": "小學班別不錄入", "class_title": class_title})
                continue
            class_id, how, cands = rec.match_class_by_keys(class_title, class_key_index)
            if class_id is None and len(cands) == 0:
                dt = datetime.strptime(ymd, "%Y-%m-%d")
                pr_soft = {
                    "day_of_week": DAY_NAMES[dt.weekday()],
                    "time_slot": slot_for_matching,
                    "grade_arr": [imp.infer_grade_from_title(class_title)] if imp.infer_grade_from_title(class_title) else [],
                    "subject_inferred": imp.subject_from_row({"班別名稱": class_title, "課程名稱": ""}),
                }
                sc_id, sc_val, sc_cands = rec.soft_pick_class(pr_soft, classes)
                if sc_id:
                    class_id = sc_id
                    how = f"soft_match({sc_val})"
                elif sc_val >= 55 and len(sc_cands) > 1:
                    how = f"soft_ambiguous({sc_val})"
                    cands = sc_cands
            if class_id is None and cands:
                by_enroll = resolve_by_enrollment(cands, student_ids, enrolled_pairs)
                if by_enroll:
                    class_id = by_enroll
                    how = f"{how}+enrollment_disambiguated"
            if class_id is None:
                skipped.append({"line": line, "reason": f"班別無法唯一對應: {how}", "class_title": class_title})
                if how == "班名鍵無命中":
                    special_no_hit_rows.append(
                        {
                            "line": line,
                            "class_title": class_title,
                            "students": " | ".join(student_names),
                            "date": ymd,
                            "time_slot": slot or "",
                            "schedule_ref": row.get("對應排程紀錄", ""),
                        }
                    )
                if ("一對一" in class_title or "單對單" in class_title) and "ambiguous" in how:
                    one_on_one_ambiguous_rows.append(
                        {
                            "line": line,
                            "class_title": class_title,
                            "reason": how,
                            "students": " | ".join(student_names),
                            "date": ymd,
                            "time_slot": slot or "",
                            "schedule_ref": row.get("對應排程紀錄", ""),
                            "candidate_class_ids": "|".join(cands or []),
                        }
                    )
                unmatched_classes_rows.append(
                    {
                        "line": line,
                        "class_title": class_title,
                        "reason": how,
                        "students": " | ".join(student_names),
                        "candidate_class_ids": "|".join(cands or []),
                        "schedule_ref": row.get("對應排程紀錄", ""),
                    }
                )
                continue

        remarks = merge_remarks(rec, row)
        for sid in student_ids:
            dedup_key = (sid, class_id, ymd)  # type: ignore[arg-type]
            if dedup_key in seen_insert_keys:
                continue
            seen_insert_keys.add(dedup_key)
            inserts.append(
                {
                    "line": line,
                    "student_id": sid,
                    "class_id": class_id,
                    "date": ymd,
                    "status": "出席",
                    "remarks": remarks,
                    "class_match": how,
                }
            )

    sql_lines = [
        "-- 2526 出席記錄 CSV -> public.attendance_details",
        f"-- source: {csv_path}",
        "-- 規則: 學生只用姓名對應；時間空白/格式錯誤時可匯入（不以時間匹配）",
        f"-- total rows in csv: {len(rows)}",
        f"-- generated inserts: {len(inserts)}",
        "",
        "BEGIN;",
        "",
    ]
    for it in inserts:
        remarks_sql = "NULL" if not it["remarks"] else sql_str(it["remarks"])
        sql_lines.append(
            "INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)\n"
            "SELECT "
            f"{sql_str(it['student_id'])}::uuid, "
            f"{sql_str(it['class_id'])}::uuid, "
            f"{sql_str(it['date'])}::date, "
            f"{sql_str(it['status'])}, "
            f"{remarks_sql}\n"
            "WHERE NOT EXISTS (\n"
            "  SELECT 1 FROM public.attendance_details a\n"
            f"  WHERE a.student_id = {sql_str(it['student_id'])}::uuid\n"
            f"    AND a.class_id = {sql_str(it['class_id'])}::uuid\n"
            f"    AND a.attendance_date = {sql_str(it['date'])}::date\n"
            ");"
        )
        sql_lines.append(f"-- line {it['line']} ({it['class_match']})")
        sql_lines.append("")
    sql_lines.append("COMMIT;")

    OUT_SQL.parent.mkdir(parents=True, exist_ok=True)
    OUT_SQL.write_text("\n".join(sql_lines), encoding="utf-8")

    report = {
        "source_csv": str(csv_path),
        "csv_rows": len(rows),
        "insert_rows": len(inserts),
        "skipped_count": len(skipped),
        "non_standard_time_slot_rows": len(non_standard_rows),
        "unmatched_student_rows": len(unmatched_students_rows),
        "unmatched_class_rows": len(unmatched_classes_rows),
        "one_on_one_ambiguous_rows": len(one_on_one_ambiguous_rows),
        "special_invalid_date_rows": len(special_invalid_date_rows),
        "special_no_hit_rows": len(special_no_hit_rows),
        "special_schedule_missing_unresolved_rows": len(special_schedule_missing_unresolved_rows),
        "notes": [
            "時間格式空白/無法解析時，若其餘資料可判斷，仍可匯入（不以時間作匹配）。",
            "非系統指定時段仍略過；溫珏禧 + 20:00-22:00 例外放行。",
            "對應排程紀錄缺失時，先用學生報讀交集推斷班別。",
            "小學班別不錄入；出席學生空白不錄入。",
        ],
        "skipped_samples": skipped[:200],
    }
    OUT_REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    write_csv(
        OUT_UNMATCHED_STUDENTS,
        ["line", "student_name", "reason", "candidate_student_ids", "class_title", "date", "time_slot"],
        unmatched_students_rows,
    )
    write_csv(
        OUT_UNMATCHED_CLASSES,
        ["line", "class_title", "reason", "students", "candidate_class_ids", "schedule_ref"],
        unmatched_classes_rows,
    )
    write_csv(OUT_NON_STANDARD, ["line", "date", "time_slot", "schedule_ref", "students"], non_standard_rows)
    write_csv(
        OUT_ONE_ON_ONE_AMBIG,
        ["line", "class_title", "reason", "students", "date", "time_slot", "schedule_ref", "candidate_class_ids"],
        one_on_one_ambiguous_rows,
    )

    md_lines: list[str] = []
    md_lines.append("# 2526 出席匯入特殊例子\n")
    md_lines.append(f"- 來源：`{csv_path}`\n")
    md_lines.append(f"- 產生時間：`{datetime.now().isoformat(timespec='seconds')}`\n")
    md_lines.append("\n## 1) 日期格式無法解析（需人工修正）\n")
    md_lines.extend(
        ["- （無）\n"]
        if not special_invalid_date_rows
        else [
            f"- line {r['line']}｜日期=`{r['raw_date']}`｜時間=`{r['raw_time']}`｜學生=`{r['students']}`｜排程=`{r['schedule_ref']}`\n"
            for r in special_invalid_date_rows
        ]
    )
    md_lines.append("\n## 2) 班名鍵完全無命中（需同事指定班別）\n")
    md_lines.extend(
        ["- （無）\n"]
        if not special_no_hit_rows
        else [
            f"- line {r['line']}｜班名=`{r['class_title']}`｜學生=`{r['students']}`｜日期=`{r['date']}`｜時間=`{r['time_slot']}`｜排程=`{r['schedule_ref']}`\n"
            for r in special_no_hit_rows
        ]
    )
    md_lines.append("\n## 3) 對應排程紀錄缺失且無法由學生報讀推斷班別\n")
    md_lines.extend(
        ["- （無）\n"]
        if not special_schedule_missing_unresolved_rows
        else [
            f"- line {r['line']}｜日期=`{r['date']}`｜時間=`{r['time_slot']}`｜學生=`{r['students']}`｜原因=`{r['reason']}`\n"
            for r in special_schedule_missing_unresolved_rows
        ]
    )
    OUT_SPECIAL_MD.write_text("".join(md_lines), encoding="utf-8")

    print(f"Wrote {OUT_SQL} ({len(inserts)} inserts)")
    print(f"Wrote {OUT_REPORT}")
    print(f"Wrote {OUT_UNMATCHED_STUDENTS} ({len(unmatched_students_rows)} rows)")
    print(f"Wrote {OUT_UNMATCHED_CLASSES} ({len(unmatched_classes_rows)} rows)")
    print(f"Wrote {OUT_NON_STANDARD} ({len(non_standard_rows)} rows)")
    print(f"Wrote {OUT_ONE_ON_ONE_AMBIG} ({len(one_on_one_ambiguous_rows)} rows)")
    print(f"Wrote {OUT_SPECIAL_MD}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
