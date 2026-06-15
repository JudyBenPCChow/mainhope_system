#!/usr/bin/env python3
"""由 import-output/one_on_one_and_single_classes.csv 產生 public.classes 的 INSERT SQL。"""
from __future__ import annotations

import csv
import re
import uuid
from pathlib import Path

NS = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")  # 固定命名空間，重跑 id 不變

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "import-output" / "one_on_one_and_single_classes.csv"
OUT = ROOT / "import-output" / "one_on_one_classes_insert.sql"

DAY_EN = {
    "MON": "星期一",
    "TUE": "星期二",
    "WED": "星期三",
    "THU": "星期四",
    "FRI": "星期五",
    "SAT": "星期六",
    "SUN": "星期日",
}


def sql_str(s: str | None) -> str:
    if s is None or str(s).strip() == "":
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"


def norm_time(s: str) -> str | None:
    t = (s or "").strip().replace("：", ":").replace("－", "-").replace("—", "-")
    return t or None


def canonical_weekday(raw: str) -> str | None:
    if not (raw or "").strip():
        return None
    parts = re.split(r"[,，]", raw.strip())
    out: list[str] = []
    for p in parts:
        p = p.strip()
        if not p:
            continue
        u = p.upper()
        if u in DAY_EN:
            c = DAY_EN[u]
            if c not in out:
                out.append(c)
    return ", ".join(out) if out else None


def strip_tail_code(title: str) -> str:
    t = re.sub(r"\s+", " ", (title or "").strip())
    for _ in range(4):
        t2 = re.sub(r"(?:[\s　]+)?(?:[A-Z]{2,}|[A-Z][a-z]+)\s*$", "", t).strip()
        if t2 == t:
            break
        t = t2
    return t


def parse_grades(cell: str) -> list[str]:
    if not (cell or "").strip() or cell.strip().upper() == "NA":
        return []
    arr: list[str] = []
    for p in re.split(r"[,，]", cell):
        g = p.strip()
        if not g or g.upper() == "NA":
            continue
        if not g.endswith("級") and re.match(r"^(小|中)[一二三四五六]$", g):
            g = g + "級"
        arr.append(g)
    return arr


def infer_grade_from_title(title: str) -> str | None:
    t = title or ""
    m = re.search(r"(小|中)([一二三四五六])級", t)
    if m:
        return f"{m[1]}{m[2]}級"
    m = re.search(r"中([一二三四五六])(?:級|數|英|化|物|生|文|M)", t)
    if m:
        return f"中{m.group(1)}級"
    m = re.search(r"小([一二三四五六])(?:級|數|英)", t)
    if m:
        return f"小{m.group(1)}級"
    if t.startswith("中五"):
        return "中五級"
    if t.startswith("中四"):
        return "中四級"
    if t.startswith("中六"):
        return "中六級"
    if t.startswith("中三"):
        return "中三級"
    if t.startswith("中一"):
        return "中一級"
    if t.startswith("中二"):
        return "中二級"
    return None


def main() -> None:
    rows: list[dict[str, str]] = []
    with SRC.open(encoding="utf-8-sig", newline="") as f:
        for r in csv.DictReader(f):
            rows.append({k: (v or "").strip() for k, v in r.items()})

    lines: list[str] = [
        "-- 一對一／單對單班別：寫入 public.classes（無老師／課室）",
        "-- 來源：import-output/one_on_one_and_single_classes.csv",
        "-- 每列固定 uuid，便於之後寫 student_class_enrollments。執行前請備份。",
        "",
        "BEGIN;",
        "",
    ]

    id_map: list[tuple[int, str, str]] = []

    for r in rows:
        rid = int(r["row_index"])
        title = r["班別名稱"]
        subject = strip_tail_code(title) or "其他"
        slot = norm_time(r["時間"])
        grades = parse_grades(r["適用年級"])
        if not grades:
            ig = infer_grade_from_title(title)
            if ig:
                grades = [ig]
        dow = canonical_weekday(r["逢星期"])
        price_s = (r["每堂堂費"] or "").strip()
        price_sql = "NULL" if not price_s else price_s
        cid = str(uuid.uuid5(NS, f"2526-1on1-row{rid}-{title}"))
        id_map.append((rid, cid, title))

        gsql = "NULL"
        if grades:
            inner = ",".join(sql_str(x) for x in grades)
            gsql = f"ARRAY[{inner}]::text[]"

        lines.append(
            "INSERT INTO public.classes ("
            "id, subject, grade, day_of_week, time_slot, "
            "teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status"
            ") VALUES ("
            f"{sql_str(cid)}::uuid, "
            f"{sql_str(subject)}, "
            f"{gsql}, "
            f"{sql_str(dow)}, "
            f"{sql_str(slot)}, "
            "NULL, NULL, NULL, "
            f"{price_sql}, "
            f"{sql_str('2025-09-01')}::date, "
            f"{sql_str('2026-08-31')}::date, "
            f"{sql_str('進行中')}"
            ");"
        )
        lines.append("-- row_index=" + str(rid) + " 原始班名：" + title.replace("'", "''"))
        lines.append("")

    lines.append("-- row_index → class_id 對照（選課／核對用）")
    lines.append("-- " + " | ".join(f"{a}:{b}" for a, b, _ in id_map))
    lines.append("")
    lines.append("COMMIT;")

    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {OUT} ({len(id_map)} inserts)")


if __name__ == "__main__":
    main()
