#!/usr/bin/env python3
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IN_DIR = ROOT / "import-output" / "remapped"


def add_guard_enrollments(src: Path, dst: Path) -> None:
    txt = src.read_text(encoding="utf-8")
    pat = re.compile(
        r"(INSERT INTO public\.student_class_enrollments.*?SELECT\s+'(?P<sid>[0-9a-f-]{36})'::uuid,\s+'(?P<cid>[0-9a-f-]{36})'::uuid,.*?WHERE NOT EXISTS\s*\(.*?\)\s*)(;)",
        re.I | re.S,
    )

    def repl(m: re.Match) -> str:
        sid = m.group("sid")
        cid = m.group("cid")
        body = m.group(1).rstrip()
        extra = (
            f"\nAND EXISTS (SELECT 1 FROM public.students s WHERE s.id = '{sid}'::uuid)"
            f"\nAND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '{cid}'::uuid)"
        )
        return body + extra + ";"

    out = pat.sub(repl, txt)
    dst.write_text(out, encoding="utf-8")


def add_guard_schedules(src: Path, dst: Path) -> None:
    txt = src.read_text(encoding="utf-8")
    pat = re.compile(
        r"(INSERT INTO public\.schedules.*?SELECT\s+'(?P<cid>[0-9a-f-]{36})'::uuid,\s+(?P<tid>null::uuid|'[0-9a-f-]{36}'::uuid),\s+(?P<room>null::uuid|'[0-9a-f-]{36}'::uuid).*?WHERE NOT EXISTS\s*\(.*?\)\s*)(;)",
        re.I | re.S,
    )

    def repl(m: re.Match) -> str:
        cid = m.group("cid")
        tid_expr = m.group("tid")
        room = m.group("room")
        body = m.group(1).rstrip()
        extra = f"\nAND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '{cid}'::uuid)"
        if tid_expr.lower() != "null::uuid":
            tid = tid_expr.split("'")[1]
            extra += f"\nAND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = '{tid}'::uuid)"
        if room.lower() != "null::uuid":
            room_id = room.split("'")[1]
            extra += f"\nAND EXISTS (SELECT 1 FROM public.classrooms r WHERE r.id = '{room_id}'::uuid)"
        return body + extra + ";"

    out = pat.sub(repl, txt)
    dst.write_text(out, encoding="utf-8")


def add_guard_attendance(src: Path, dst: Path) -> None:
    txt = src.read_text(encoding="utf-8")
    pat = re.compile(
        r"(INSERT INTO public\.attendance_details.*?SELECT\s+'(?P<sid>[0-9a-f-]{36})'::uuid,\s+'(?P<cid>[0-9a-f-]{36})'::uuid,.*?WHERE NOT EXISTS\s*\(.*?\)\s*)(;)",
        re.I | re.S,
    )

    def repl(m: re.Match) -> str:
        sid = m.group("sid")
        cid = m.group("cid")
        body = m.group(1).rstrip()
        extra = (
            f"\nAND EXISTS (SELECT 1 FROM public.students s WHERE s.id = '{sid}'::uuid)"
            f"\nAND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '{cid}'::uuid)"
        )
        return body + extra + ";"

    out = pat.sub(repl, txt)
    dst.write_text(out, encoding="utf-8")


def main() -> None:
    add_guard_enrollments(
        IN_DIR / "2526_enrollments_insert.remapped.sql",
        IN_DIR / "2526_enrollments_insert.remapped.safe.sql",
    )
    add_guard_schedules(
        IN_DIR / "2526_schedules_insert.remapped.sql",
        IN_DIR / "2526_schedules_insert.remapped.safe.sql",
    )
    add_guard_attendance(
        IN_DIR / "2526_attendance_insert.remapped.sql",
        IN_DIR / "2526_attendance_insert.remapped.safe.sql",
    )
    print("generated safe sql files in", IN_DIR)


if __name__ == "__main__":
    main()
