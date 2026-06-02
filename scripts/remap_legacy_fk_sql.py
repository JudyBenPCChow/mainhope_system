#!/usr/bin/env python3
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMPORT_DIR = ROOT / "import-output"
OUT_DIR = IMPORT_DIR / "remapped"
OUT_DIR.mkdir(parents=True, exist_ok=True)


def load_text(p: Path) -> str:
    return p.read_text(encoding="utf-8")


def parse_new_class_title_to_id() -> dict[str, str]:
    """
    From 2526_import.sql enrollment remarks:
      [2526匯入] <title>
    map title -> class_id (new/current ids)
    """
    txt = load_text(IMPORT_DIR / "2526_import.sql")
    pat = re.compile(
        r"INSERT INTO public\.student_class_enrollments .*?VALUES \('([0-9a-f-]{36})'::uuid,\s*'([0-9a-f-]{36})'::uuid,\s*'[^']*',\s*'[^']*'::date,\s*'\[2526匯入\]\s*([^']+)'\)",
        re.I | re.S,
    )
    out: dict[str, str] = {}
    for _sid, cid, title in pat.findall(txt):
        t = title.strip()
        out.setdefault(t, cid)
    return out


def parse_old_id_to_title_from_reconcile() -> dict[str, str]:
    """
    reconcile_roster_links.json keeps old db class ids and csv title.
    """
    p = IMPORT_DIR / "reconcile_roster_links.json"
    rows = json.loads(load_text(p))
    out: dict[str, str] = {}
    for r in rows:
        old = str(r.get("class_id_db") or "").strip()
        title = str(r.get("class_title_csv") or "").strip()
        if old and title:
            out.setdefault(old, title)
    return out


def parse_new_student_name_to_ids() -> dict[str, list[str]]:
    """
    From 2526_import.sql students insert:
      ('<id>'::uuid, '<name>', ...)
    """
    txt = load_text(IMPORT_DIR / "2526_import.sql")
    pat = re.compile(r"\('([0-9a-f-]{36})'::uuid,\s*'([^']+)'", re.I)
    out: dict[str, list[str]] = {}
    for sid, name in pat.findall(txt):
        nm = name.strip()
        out.setdefault(nm, []).append(sid)
    return out


def build_old_to_new_student_map() -> tuple[dict[str, str], dict[str, str]]:
    """
    Use reconcile_roster_links.json:
      old student_id_db + student_name_csv
    map to new student id by exact unique name in 2526_import.sql.
    """
    rows = json.loads(load_text(IMPORT_DIR / "reconcile_roster_links.json"))
    name_to_new_ids = parse_new_student_name_to_ids()
    old_to_new: dict[str, str] = {}
    unresolved: dict[str, str] = {}
    for r in rows:
        old = str(r.get("student_id_db") or "").strip()
        name = str(r.get("student_name_csv") or "").strip()
        if not old or not name:
            continue
        ids = name_to_new_ids.get(name, [])
        if len(ids) == 1:
            old_to_new[old] = ids[0]
        elif len(ids) > 1:
            unresolved.setdefault(old, f"{name} (duplicate name)")
        else:
            unresolved.setdefault(old, f"{name} (name not found)")
    return old_to_new, unresolved


def build_old_to_new_class_map() -> tuple[dict[str, str], dict[str, str], dict[str, str]]:
    title_to_new = parse_new_class_title_to_id()
    old_to_title = parse_old_id_to_title_from_reconcile()
    old_to_new: dict[str, str] = {}
    unresolved_old: dict[str, str] = {}
    unresolved_title: dict[str, str] = {}
    for old, title in old_to_title.items():
        new_id = title_to_new.get(title)
        if new_id:
            old_to_new[old] = new_id
        else:
            unresolved_title[old] = title
    for old, title in unresolved_title.items():
        unresolved_old[old] = title
    return old_to_new, unresolved_old, title_to_new


def remap_ids_in_sql(
    src_name: str,
    dst_name: str,
    class_map: dict[str, str],
    student_map: dict[str, str],
    table_hint: str,
) -> dict[str, int]:
    txt = load_text(IMPORT_DIR / src_name)
    counts = {
        "total_old_refs": 0,
        "class_remapped": 0,
        "class_unmapped": 0,
        "student_remapped": 0,
        "student_unmapped": 0,
    }

    old_refs = sorted(set(re.findall(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", txt, re.I)))
    for oid in old_refs:
        hit = txt.count(oid)
        if oid in class_map:
            counts["class_remapped"] += hit
            txt = txt.replace(oid, class_map[oid])
        elif oid in student_map:
            counts["student_remapped"] += hit
            txt = txt.replace(oid, student_map[oid])
        else:
            # unknown UUID could be teacher/classroom/other. keep but count as unmapped generic.
            # For operational visibility, split by table hint:
            if "attendance" in table_hint or "enroll" in table_hint:
                counts["student_unmapped"] += hit
            else:
                counts["class_unmapped"] += hit
    counts["total_old_refs"] = (
        counts["class_remapped"]
        + counts["class_unmapped"]
        + counts["student_remapped"]
        + counts["student_unmapped"]
    )

    header = (
        f"-- AUTO-REMAP from {src_name}\n"
        f"-- table: {table_hint}\n"
        f"-- total old refs: {counts['total_old_refs']}\n"
        f"-- class remapped refs: {counts['class_remapped']}\n"
        f"-- class unmapped refs: {counts['class_unmapped']}\n"
        f"-- student remapped refs: {counts['student_remapped']}\n"
        f"-- student unmapped refs: {counts['student_unmapped']}\n\n"
    )
    (OUT_DIR / dst_name).write_text(header + txt, encoding="utf-8")
    return counts


def main() -> None:
    old_to_new_class, unresolved_class, title_to_new = build_old_to_new_class_map()
    old_to_new_student, unresolved_student = build_old_to_new_student_map()
    report = {
        "old_to_new_class_count": len(old_to_new_class),
        "old_to_new_student_count": len(old_to_new_student),
        "unresolved_old_class_count": len(unresolved_class),
        "unresolved_old_student_count": len(unresolved_student),
        "remap_sources": {
            "title_to_new_count": len(title_to_new),
        },
        "files": {},
        "unresolved_old_class_ids": unresolved_class,
        "unresolved_old_student_ids": unresolved_student,
    }

    report["files"]["2526_enrollments_insert.sql"] = remap_ids_in_sql(
        "2526_enrollments_insert.sql",
        "2526_enrollments_insert.remapped.sql",
        old_to_new_class,
        old_to_new_student,
        "student_class_enrollments",
    )
    report["files"]["2526_schedules_insert.sql"] = remap_ids_in_sql(
        "2526_schedules_insert.sql",
        "2526_schedules_insert.remapped.sql",
        old_to_new_class,
        old_to_new_student,
        "schedules",
    )
    report["files"]["2526_attendance_insert.sql"] = remap_ids_in_sql(
        "2526_attendance_insert.sql",
        "2526_attendance_insert.remapped.sql",
        old_to_new_class,
        old_to_new_student,
        "attendance_details",
    )

    (OUT_DIR / "remap_report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"generated: {OUT_DIR}")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
