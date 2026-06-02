#!/usr/bin/env python3
import csv
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMPORT_DIR = ROOT / "import-output"
OUT_DIR = IMPORT_DIR / "staging-csv"
OUT_DIR.mkdir(parents=True, exist_ok=True)


def nullify(v: str) -> str:
    t = v.strip()
    return "" if t.upper() == "NULL" else t


def to_grade_code(grade_text: str) -> str:
    g = grade_text.replace("級", "").strip()
    mapping = {
        "小一": "P1",
        "小二": "P2",
        "小三": "P3",
        "小四": "P4",
        "小五": "P5",
        "小六": "P6",
        "中一": "F1",
        "中二": "F2",
        "中三": "F3",
        "中四": "F4",
        "中五": "F5",
        "中六": "F6",
    }
    return mapping.get(g, "")


def academic_year_label(start_date: str) -> str:
    if not start_date:
        return "2526"
    y = int(start_date[:4])
    m = int(start_date[5:7])
    sy = y if m >= 9 else y - 1
    return f"{str(sy)[-2:]}{str(sy+1)[-2:]}"


def extract_students():
    src = (IMPORT_DIR / "2526_import.sql").read_text(encoding="utf-8")
    # tuple: id, full_name, student_code, grade, school, status, registration_status, enrollment_status, academic_stage
    pat = re.compile(
        r"\('([0-9a-f-]{36})'::uuid,\s*'([^']*)',\s*'([^']*)',\s*(NULL|'[^']*'),\s*(NULL|'[^']*'),\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)'\)",
        re.I,
    )
    rows = []
    for m in pat.findall(src):
        sid, full_name, student_code, grade_raw, school_raw, status, reg_status, enroll_status, stage = m
        grade = nullify(grade_raw.strip("'"))
        school = nullify(school_raw.strip("'"))
        rows.append(
            {
                "id": sid,
                "student_code": student_code,
                "full_name": full_name,
                "english_name": "",
                "grade": grade,
                "school": school,
                "status": status,
                "registration_status": reg_status,
                "enrollment_status": enroll_status,
                "academic_stage": stage,
            }
        )
    return rows


def extract_classes():
    files = [
        IMPORT_DIR / "2526_import.sql",
        IMPORT_DIR / "one_on_one_classes_insert.sql",
        IMPORT_DIR / "residual_classes_insert.sql",
    ]
    pat = re.compile(
        r"INSERT INTO public\.classes .*?VALUES \('([0-9a-f-]{36})'::uuid,\s*'([^']*)',\s*(NULL|'[^']*'),\s*(ARRAY\[[^\]]*\]::text\[]|NULL),\s*(NULL|'[^']*'),\s*(NULL|'[^']*'),\s*(NULL|'[0-9a-f-]{36}'::uuid),\s*(NULL|'[0-9a-f-]{36}'::uuid),\s*(NULL|[0-9]+),\s*(NULL|[0-9]+(?:\.[0-9]+)?),\s*'([0-9-]{10})'::date,\s*'([0-9-]{10})'::date,\s*'([^']*)'\);",
        re.I,
    )
    rows = []
    seen = set()
    for f in files:
        txt = f.read_text(encoding="utf-8")
        for m in pat.findall(txt):
            (
                cid,
                subject,
                course_code_raw,
                grade_arr_raw,
                day_raw,
                slot_raw,
                teacher_raw,
                classroom_raw,
                capacity_raw,
                price_raw,
                start_date,
                end_date,
                status,
            ) = m
            if cid in seen:
                continue
            seen.add(cid)
            grade_first = ""
            if grade_arr_raw.upper() != "NULL":
                gmatch = re.search(r"'([^']+)'", grade_arr_raw)
                if gmatch:
                    grade_first = gmatch.group(1)
            grade_code = to_grade_code(grade_first)
            course_code = nullify(course_code_raw.strip("'"))
            seq = 1001
            if course_code:
                mm = re.search(r"(\d{4})$", course_code)
                if mm:
                    seq = int(mm.group(1))
            rows.append(
                {
                    "class_id": cid,
                    "academic_year_label": academic_year_label(start_date),
                    "subject_name": subject,
                    "grade_code": grade_code,
                    "course_seq": seq,
                    "section_code": "",
                    "day_of_week": nullify(day_raw.strip("'")),
                    "time_slot": nullify(slot_raw.strip("'")),
                    "teacher_id": nullify(teacher_raw.replace("::uuid", "").strip("'")),
                    "classroom_id": nullify(classroom_raw.replace("::uuid", "").strip("'")),
                    "capacity": nullify(capacity_raw),
                    "price_per_lesson": nullify(price_raw),
                    "start_date": start_date,
                    "end_date": end_date,
                    "status": status,
                }
            )
    return rows


def extract_enrollments():
    src = (IMPORT_DIR / "2526_import.sql").read_text(encoding="utf-8")
    pat = re.compile(
        r"INSERT INTO public\.student_class_enrollments .*?VALUES \('([0-9a-f-]{36})'::uuid,\s*'([0-9a-f-]{36})'::uuid,\s*'([^']*)',\s*'([0-9-]{10})'::date,\s*'([^']*)'\);",
        re.I,
    )
    rows = []
    for sid, cid, status, enroll_date, remarks in pat.findall(src):
        rows.append(
            {
                "student_id": sid,
                "class_id": cid,
                "status": status,
                "enroll_date": enroll_date,
                "remarks": remarks,
            }
        )
    return rows


def extract_schedules():
    path = IMPORT_DIR / "remapped" / "2526_schedules_insert.remapped.class_only.safe.sql"
    if not path.exists():
        return []
    src = path.read_text(encoding="utf-8")
    pat = re.compile(
        r"INSERT INTO public\.schedules .*?SELECT '([0-9a-f-]{36})'::uuid,\s*(NULL::uuid|'[0-9a-f-]{36}'::uuid),\s*(NULL::uuid|'[0-9a-f-]{36}'::uuid),\s*'([0-9-]{10})'::date,\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)'",
        re.I | re.S,
    )
    rows = []
    for cid, tid_raw, rid_raw, d, st, et, status, remarks in pat.findall(src):
        rows.append(
            {
                "class_id": cid,
                "teacher_id": nullify(tid_raw.replace("::uuid", "").strip("'")),
                "classroom_id": nullify(rid_raw.replace("::uuid", "").strip("'")),
                "scheduled_date": d,
                "start_time": st,
                "end_time": et,
                "status": status,
                "remarks": remarks,
            }
        )
    return rows


def extract_attendance():
    path = IMPORT_DIR / "remapped" / "2526_attendance_insert.remapped.safe.sql"
    if not path.exists():
        return []
    src = path.read_text(encoding="utf-8")
    pat = re.compile(
        r"INSERT INTO public\.attendance_details .*?SELECT '([0-9a-f-]{36})'::uuid,\s*'([0-9a-f-]{36})'::uuid,\s*'([0-9-]{10})'::date,\s*'([^']*)',\s*(NULL|'[^']*')",
        re.I | re.S,
    )
    rows = []
    for sid, cid, d, status, remarks_raw in pat.findall(src):
        rows.append(
            {
                "student_id": sid,
                "class_id": cid,
                "attendance_date": d,
                "status": status,
                "remarks": nullify(remarks_raw.strip("'")),
            }
        )
    return rows


def write_csv(name: str, rows: list[dict], headers: list[str]):
    out = OUT_DIR / name
    with out.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=headers)
        w.writeheader()
        for r in rows:
            w.writerow({h: r.get(h, "") for h in headers})
    return out


def main():
    students = extract_students()
    classes = extract_classes()
    enrollments = extract_enrollments()
    schedules = extract_schedules()
    attendance = extract_attendance()

    files = [
        write_csv(
            "students_import.csv",
            students,
            ["id", "student_code", "full_name", "english_name", "grade", "school", "status", "registration_status", "enrollment_status", "academic_stage"],
        ),
        write_csv(
            "classes_import.csv",
            classes,
            ["class_id", "academic_year_label", "subject_name", "grade_code", "course_seq", "section_code", "day_of_week", "time_slot", "teacher_id", "classroom_id", "capacity", "price_per_lesson", "start_date", "end_date", "status"],
        ),
        write_csv(
            "enrollments_import.csv",
            enrollments,
            ["student_id", "class_id", "status", "enroll_date", "remarks"],
        ),
        write_csv(
            "schedules_import.csv",
            schedules,
            ["class_id", "teacher_id", "classroom_id", "scheduled_date", "start_time", "end_time", "status", "remarks"],
        ),
        write_csv(
            "attendance_import.csv",
            attendance,
            ["student_id", "class_id", "attendance_date", "status", "remarks"],
        ),
    ]

    print("Generated files:")
    for f in files:
        print("-", f)
    print("Counts:", {
        "students": len(students),
        "classes": len(classes),
        "enrollments": len(enrollments),
        "schedules": len(schedules),
        "attendance": len(attendance),
    })


if __name__ == "__main__":
    main()
