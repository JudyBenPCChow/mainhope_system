#!/usr/bin/env python3
"""
依 reconcile_report.json 中「對不到」與「模糊多候選」的 CSV 列，
自 2526 課程 CSV 產生 public.classes 的 INSERT SQL。

輸出：import-output/residual_classes_insert.sql
UUID：uuid5（固定），鍵為 2526-residual-row{row_index}，重跑不變。
"""
from __future__ import annotations

import csv
import importlib.util
import json
import re
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / "import-output" / "reconcile_report.json"
CSV_PATH = Path(
    "/Users/hoiyingfan/Downloads/私人和共用/"
    "【2526】課程及班別 25273b60cb028020b6a9f9b45f2c52b3_all.csv"
)
OUT = ROOT / "import-output" / "residual_classes_insert.sql"
NS = uuid.UUID("a3bbcee5-b2c0-4bef-9c0d-0e5f1a2b3c4d")


def load_importer():
    p = ROOT / "scripts" / "import_2526_roster.py"
    spec = importlib.util.spec_from_file_location("roster_importer", p)
    m = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(m)
    return m


def sql_str(s: str | None) -> str:
    if s is None or str(s).strip() == "":
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"


def norm_time(s: str) -> str | None:
    t = (s or "").strip().replace("：", ":").replace("－", "-").replace("—", "-")
    return t or None


def strip_tail_code(title: str) -> str:
    t = re.sub(r"\s+", " ", (title or "").strip())
    for _ in range(4):
        t2 = re.sub(r"(?:[\s　]+)?(?:[A-Z]{2,}|[A-Z][a-z]+)\s*$", "", t).strip()
        if t2 == t:
            break
        t = t2
    return t


def main() -> None:
    rep = json.loads(REPORT.read_text(encoding="utf-8"))
    want: set[int] = set()
    for u in rep.get("unmatched_classes", []):
        want.add(int(u["row_index"]))
    for a in rep.get("ambiguous_class_keys", []):
        want.add(int(a["row_index"]))

    imp = load_importer()

    by_row: dict[int, dict[str, str]] = {}
    with CSV_PATH.open(newline="", encoding="utf-8-sig") as f:
        for i, row in enumerate(csv.DictReader(f)):
            ri = i + 2
            if ri in want:
                by_row[ri] = {k: (v or "").strip() for k, v in row.items()}

    missing = sorted(want - set(by_row.keys()))
    if missing:
        raise SystemExit(f"CSV 找不到列號: {missing}")

    lines: list[str] = [
        "-- 對照報告中「對不到」+「模糊多候選」之 CSV 列：新增 public.classes",
        f"-- 共 {len(want)} 筆；course_code / teacher_id / classroom_id 為 NULL",
        "-- 執行前請備份；若與既有班別語意重複，請自行刪除或調整後再執行。",
        "",
        "BEGIN;",
        "",
    ]

    id_lines: list[str] = []
    for ri in sorted(want):
        row = by_row[ri]
        title = (row.get("班別名稱") or "").strip() or (row.get("課程名稱") or "").strip()
        subject = strip_tail_code(title) or "其他"
        slot = norm_time(row.get("時間", "") or "")
        grades = imp.parse_grades(row.get("適用年級", "") or "")
        if not grades:
            tg = imp.infer_grade_from_title(title)
            if tg:
                grades = [tg + "級"] if not tg.endswith("級") else [tg]
        grades = [
            (g + "級") if (not g.endswith("級") and re.match(r"^(小|中)[一二三四五六]$", g)) else g
            for g in grades
        ]
        if not grades:
            t0 = title
            for pref, lab in (
                ("中五", "中五級"),
                ("中四", "中四級"),
                ("中六", "中六級"),
                ("中三", "中三級"),
                ("中一", "中一級"),
                ("中二", "中二級"),
            ):
                if t0.startswith(pref):
                    grades = [lab]
                    break
        dow = imp.canonical_weekdays(row.get("逢星期", "") or "")
        price_s = (row.get("每堂堂費") or "").strip()
        price_sql = "NULL" if not price_s else price_s
        cid = str(uuid.uuid5(NS, f"2526-residual-row{ri}"))

        gsql = "NULL"
        if grades:
            inner = ",".join(sql_str(x) for x in grades)
            gsql = f"ARRAY[{inner}]::text[]"

        lines.append(
            "INSERT INTO public.classes ("
            "id, subject, course_code, grade, day_of_week, time_slot, "
            "teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status"
            ") VALUES ("
            f"{sql_str(cid)}::uuid, "
            f"{sql_str(subject)}, "
            "NULL, "
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
        lines.append("-- row_index=" + str(ri) + " 原始班名：" + title.replace("\n", " ").replace("'", "''"))
        lines.append("")
        id_lines.append(f"{ri}:{cid}")

    lines.append("-- row_index → class_id（選課用）")
    lines.append("-- " + " | ".join(id_lines))
    lines.append("")
    lines.append("COMMIT;")

    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {OUT} ({len(want)} inserts)")


if __name__ == "__main__":
    main()
