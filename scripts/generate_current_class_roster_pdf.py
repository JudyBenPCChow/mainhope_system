#!/usr/bin/env python3
"""2627 進行中班別、時間、任教老師及就讀學生 PDF。

  python3 scripts/generate_current_class_roster_pdf.py \
    --classes docs/generated/2627/2627_CLASS_ROSTER_2026-10-23.json \
    --private-slots docs/generated/2627/2627_CLASS_ROSTER_2026-10-23_private_slots.json \
    --private-bounds docs/generated/2627/2627_CLASS_ROSTER_2026-10-23_private_bounds.json
"""

from __future__ import annotations

import argparse
import json
import sys
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = Path(__file__).resolve().parent
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))
from cjk_pdf_font import ensure_cjk_font

AS_OF = "2026-10-23"
OUT_DIR = ROOT / "docs" / "generated" / "2627"
DEFAULT_CLASSES = OUT_DIR / "2627_CLASS_ROSTER_2026-10-23.json"
DEFAULT_SLOTS = OUT_DIR / "2627_CLASS_ROSTER_2026-10-23_private_slots.json"
DEFAULT_BOUNDS = OUT_DIR / "2627_CLASS_ROSTER_2026-10-23_private_bounds.json"
DEFAULT_OUTPUT = OUT_DIR / "2627_班別及就讀學生_2026-10-23.pdf"

GRADE_LABEL = {
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
GRADE_RANK = {code: i for i, code in enumerate(["S1", "S2", "S3", "S4", "S5", "S6"])}
SUBJECT_LABEL = {
    "中國語文": "中文",
    "英國語文": "英文",
    "數學（必修部份）": "數學",
    "數學延伸部分（單元二 M2）": "數學延伸（M2）",
    "綜合科學": "綜合科學",
    "企業、會計與財務概論": "企會財",
}
SUBJECT_RANK = {name: i for i, name in enumerate(SUBJECT_LABEL)}
WEEKDAY_RANK = {
    "星期一": 1,
    "星期二": 2,
    "星期三": 3,
    "星期四": 4,
    "星期五": 5,
    "星期六": 6,
    "星期日": 7,
    "一至五": 0,
}
DOW_LABEL = {
    0: "星期日",
    1: "星期一",
    2: "星期二",
    3: "星期三",
    4: "星期四",
    5: "星期五",
    6: "星期六",
}
HW_ORDER = ["一", "二", "三", "四", "五", "六", "日"]
HW_FULL = {
    "一": "星期一",
    "二": "星期二",
    "三": "星期三",
    "四": "星期四",
    "五": "星期五",
    "六": "星期六",
    "日": "星期日",
}


def load_rows(path: Path) -> list[dict]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(payload, dict) and "rows" in payload:
        return list(payload["rows"])
    if isinstance(payload, list):
        return payload
    raise ValueError(f"無法讀取 {path}")


def subject_label(name: str) -> str:
    return SUBJECT_LABEL.get(name, name)


def grade_heading(grades: list[str] | None, grade_code: str | None) -> str:
    labels = [str(g).strip() for g in (grades or []) if str(g).strip() and str(g).strip() != "不適用"]
    if len(labels) >= 2:
        return f"{labels[0]}至{labels[-1]}"
    if len(labels) == 1:
        return labels[0]
    if grade_code and grade_code in GRADE_LABEL:
        return GRADE_LABEL[grade_code]
    return "年級未填"


def clock_parts(hhmm: str) -> tuple[str, str]:
    hour_text, minute_text = hhmm.strip()[:5].split(":")
    hour = int(hour_text)
    minute = int(minute_text)
    if hour < 12:
        period = "上午"
        hour12 = 12 if hour == 0 else hour
    elif hour < 13:
        period = "中午"
        hour12 = hour
    else:
        period = "下午"
        hour12 = hour - 12
    return period, f"{hour12}:{minute:02d}"


def format_span(start: str, end: str) -> str:
    start_period, start_clock = clock_parts(start)
    end_period, end_clock = clock_parts(end)
    if start_period == end_period:
        return f"{start_period}{start_clock}-{end_clock}"
    return f"{start_period}{start_clock}-{end_period}{end_clock}"


def format_when(day: str | None, slot: str | None) -> str:
    day_text = (day or "").strip()
    if day_text == "一至五":
        weekday = "逢星期一至五"
    elif day_text:
        weekday = day_text if day_text.startswith("逢") else f"逢{day_text}"
    else:
        weekday = ""
    slot_text = (slot or "").strip().replace("–", "-").replace("—", "-")
    if "-" in slot_text:
        start, end = slot_text.split("-", 1)
        clock = format_span(start, end)
    else:
        clock = slot_text
    return "\n".join(part for part in (weekday, clock) if part) or "—"


def student_grade(code: str | None) -> str:
    if code is None or not str(code).strip():
        return "年級未填"
    return GRADE_LABEL.get(str(code).strip(), str(code).strip())


def format_homework_days(days: list[str] | None) -> str:
    chosen = [day for day in HW_ORDER if day in set(days or [])]
    if not chosen:
        return ""
    if chosen == ["一", "二", "三", "四", "五"]:
        return "星期一至五"
    return "、".join(HW_FULL[day] for day in chosen)


def student_lines(students: list[dict], homework: bool) -> str:
    lines: list[str] = []
    ordered = sorted(students, key=lambda row: str(row.get("name") or "").strip())
    for row in ordered:
        name = str(row.get("name") or "").strip()
        if not name:
            continue
        bits = [student_grade(row.get("grade"))]
        if homework:
            plan = str(row.get("plan") or "").strip()
            if plan:
                bits.append(plan)
            day_text = format_homework_days(row.get("days"))
            bits.append(day_text or "出席日未填")
        lines.append(f"{name}（{'，'.join(bits)}）")
    return "\n".join(lines) if lines else "暫無就讀中學生"


def class_title(row: dict) -> str:
    kind = row.get("class_kind")
    code = str(row.get("course_code_full") or "").strip()
    if kind == "homework":
        division = "小學部" if "HWKP" in code else "中學部"
        head = f"{division}功課輔導班"
    elif kind == "private":
        head = str(row.get("subject") or "私人課程").strip()
    else:
        heading = grade_heading(row.get("grade"), row.get("grade_code"))
        section = str(row.get("section_code") or "").strip()
        section_text = f" {section}班" if section else ""
        head = f"{heading}級{subject_label(str(row.get('subject') or ''))}{section_text}"
    return f"{head}\n{code}" if code else head


def specialist_sort_key(row: dict) -> tuple:
    grades = [str(g).strip() for g in (row.get("grade") or []) if str(g).strip()]
    cross = 1 if len(grades) > 1 else 0
    rank = GRADE_RANK.get(str(row.get("grade_code") or ""), 50)
    subject_rank = SUBJECT_RANK.get(str(row.get("subject") or ""), 50)
    day = WEEKDAY_RANK.get(str(row.get("day_of_week") or ""), 9)
    slot = str(row.get("time_slot") or "")
    section = str(row.get("section_code") or "")
    return (cross, rank, subject_rank, section, day, slot, str(row.get("course_code_full") or ""))


def group_banner(row: dict) -> str:
    grades = [str(g).strip() for g in (row.get("grade") or []) if str(g).strip()]
    if len(grades) > 1:
        return f"{grades[0]}至{grades[-1]}"
    code = str(row.get("grade_code") or "")
    return GRADE_LABEL.get(code, grades[0] if grades else "其他")


def merge_patterns(slots: list[dict]) -> list[dict]:
    ordered = sorted(slots, key=lambda row: ((row["dow"] or 7) if row["dow"] != 0 else 7, row["start"]))
    merged: list[dict] = []
    for slot in ordered:
        if (
            merged
            and merged[-1]["dow"] == slot["dow"]
            and merged[-1]["end"] == slot["start"]
            and merged[-1]["n"] == slot["n"]
        ):
            merged[-1]["end"] = slot["end"]
            merged[-1]["double"] = True
        else:
            merged.append({**slot, "double": False})
    return merged


def private_when(subject: str, slots_by_subject: dict[str, list[dict]], bounds_by_subject: dict[str, dict]) -> str:
    slots = slots_by_subject.get(subject, [])
    bounds = bounds_by_subject.get(subject, {})
    last_any = bounds.get("last_any") or ""
    next_date = bounds.get("next_date") or ""
    if not slots:
        if last_any:
            return f"常規學年內尚未排程\n最後排程 {last_any}"
        return "尚未排程"
    patterns = merge_patterns(slots)
    total = sum(int(row["n"]) for row in patterns)
    top = max(patterns, key=lambda row: int(row["n"]))
    lines: list[str] = []
    if total and int(top["n"]) / total >= 0.8:
        line = f"逢{DOW_LABEL[int(top['dow'])]} {format_span(top['start'], top['end'])}"
        if top["double"]:
            line += "（連堂兩節）"
        lines.append(line)
        if len(patterns) > 1:
            lines.append("另有個別不同時段")
    else:
        for pattern in patterns:
            line = f"逢{DOW_LABEL[int(pattern['dow'])]} {format_span(pattern['start'], pattern['end'])}"
            if pattern["double"]:
                line += f"（連堂兩節，{int(pattern['n'])}次）"
            else:
                line += f"（{int(pattern['n'])}堂）"
            lines.append(line)
    if next_date:
        lines.append(f"下一堂 {next_date}")
    elif last_any:
        lines.append(f"最近一堂 {last_any}")
    return "\n".join(lines)


def build_pdf(
    classes: list[dict],
    slots: list[dict],
    bounds: list[dict],
    output: Path,
    as_of: str = AS_OF,
    term_start: str = "2026-09-01",
) -> None:
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.units import mm
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    font_path = ensure_cjk_font()
    pdfmetrics.registerFont(TTFont("PMingLiU", str(font_path)))
    font = "PMingLiU"
    ink = colors.HexColor("#202020")
    muted = colors.HexColor("#5f5f5f")
    line = colors.HexColor("#bdbdbd")
    header_bg = colors.HexColor("#d9d9d9")
    banner_bg = colors.HexColor("#ececec")
    empty_bg = colors.HexColor("#f7f7f7")

    styles = {
        "title": ParagraphStyle("ZhTitle", fontName=font, fontSize=14, leading=18, alignment=TA_CENTER, textColor=ink, spaceAfter=1.5 * mm),
        "meta": ParagraphStyle("ZhMeta", fontName=font, fontSize=9, leading=12, alignment=TA_CENTER, textColor=muted, spaceAfter=2 * mm),
        "note": ParagraphStyle("ZhNote", fontName=font, fontSize=8, leading=11, alignment=TA_LEFT, textColor=muted, spaceAfter=2 * mm),
        "section": ParagraphStyle("ZhSection", fontName=font, fontSize=12, leading=16, alignment=TA_LEFT, textColor=ink, spaceBefore=2 * mm, spaceAfter=1.2 * mm),
        "cell": ParagraphStyle("ZhCell", fontName=font, fontSize=8.5, leading=11, alignment=TA_LEFT, textColor=ink),
        "head": ParagraphStyle("ZhHead", fontName=font, fontSize=8.5, leading=11, alignment=TA_CENTER, textColor=ink),
        "banner": ParagraphStyle("ZhBanner", fontName=font, fontSize=9, leading=12, alignment=TA_LEFT, textColor=ink),
        "footer": ParagraphStyle("ZhFooter", fontName=font, fontSize=8, leading=10, alignment=TA_RIGHT, textColor=muted),
    }

    def p(text: str, style: str = "cell") -> Paragraph:
        return Paragraph(escape(str(text)).replace("\n", "<br/>"), styles[style])

    def as_students(value) -> list[dict]:
        if isinstance(value, str):
            value = json.loads(value) if value.strip() else []
        return list(value or [])

    for row in classes:
        row["students"] = as_students(row.get("students"))

    specialist = [row for row in classes if row.get("class_kind") == "group"]
    homework = [row for row in classes if row.get("class_kind") == "homework"]
    private = [row for row in classes if row.get("class_kind") == "private"]
    if not specialist and not homework and not private:
        raise SystemExit("查無進行中班別，已停止產出。")
    specialist.sort(key=specialist_sort_key)
    homework.sort(key=lambda row: str(row.get("course_code_full") or ""))
    private.sort(key=lambda row: (str(row.get("teacher") or ""), str(row.get("subject") or "")))

    slots_by_subject: dict[str, list[dict]] = {}
    for slot in slots:
        slots_by_subject.setdefault(str(slot["subject"]), []).append(
            {
                "dow": int(slot["dow"]),
                "start": str(slot["start_time"]),
                "end": str(slot["end_time"]),
                "n": int(slot["n"]),
            }
        )
    bounds_by_subject = {str(row["subject"]): row for row in bounds}

    def enrollment_count(rows: list[dict]) -> int:
        return sum(len(row.get("students") or []) for row in rows)

    empty_specialist = sum(1 for row in specialist if not row.get("students"))
    summary = (
        f"專科班 {len(specialist)} 班，就讀中報讀 {enrollment_count(specialist)} 筆"
        f"（其中 {empty_specialist} 班暫無就讀中學生）。"
        f"功課輔導班 {len(homework)} 班，就讀中報讀 {enrollment_count(homework)} 筆。"
        f"私人課程 {len(private)} 班，就讀中報讀 {enrollment_count(private)} 筆。"
    )

    output.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(output),
        pagesize=landscape(A4),
        leftMargin=12 * mm,
        rightMargin=12 * mm,
        topMargin=12 * mm,
        bottomMargin=14 * mm,
        title="班別、時間、任教老師及就讀學生",
        author="明學教育",
    )
    story: list = [
        p("明學教育　班別、時間、任教老師及就讀學生", "title"),
        p(f"資料日期 {as_of}　｜　2627 常規學年進行中的專科班、功課輔導班，以及進行中的私人課程", "meta"),
        p(summary, "note"),
        p(
            "學生只列報讀狀態為就讀中。專科班時間及任教老師為班別本身的逢星期、時段與主責老師。"
            "功課輔導班沒有固定任教老師，當日跟當值編更；學生括號內為報讀日數及出席日。"
            f"私人課程班別沒有固定逢星期，時間取 {term_start} 起未取消排程：若某一時段佔多數則列該時段，否則並列各時段及堂數。不含暑期及上一學年。",
            "note",
        ),
    ]

    col_widths = [62 * mm, 52 * mm, 38 * mm, 121 * mm]

    def add_table(headers: list[str], body: list[tuple], banners: set[int]) -> None:
        data = [[p(header, "head") for header in headers]]
        empty_rows: list[int] = []
        for index, item in enumerate(body, start=1):
            kind, values = item
            if kind == "banner":
                data.append([p(values[0], "banner"), "", "", ""])
            else:
                data.append([p(value) for value in values])
                if values[-1] == "暫無就讀中學生":
                    empty_rows.append(index)
        table = Table(data, colWidths=col_widths, repeatRows=1)
        commands = [
            ("FONTNAME", (0, 0), (-1, -1), font),
            ("BACKGROUND", (0, 0), (-1, 0), header_bg),
            ("TEXTCOLOR", (0, 0), (-1, -1), ink),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("GRID", (0, 0), (-1, -1), 0.4, line),
            ("LEFTPADDING", (0, 0), (-1, -1), 3),
            ("RIGHTPADDING", (0, 0), (-1, -1), 3),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("ALIGN", (0, 0), (-1, 0), "CENTER"),
            ("VALIGN", (0, 0), (-1, 0), "MIDDLE"),
        ]
        for index in banners:
            commands.append(("SPAN", (0, index), (-1, index)))
            commands.append(("BACKGROUND", (0, index), (-1, index), banner_bg))
        for index in empty_rows:
            commands.append(("BACKGROUND", (0, index), (-1, index), empty_bg))
        table.setStyle(TableStyle(commands))
        story.append(table)

    story.append(p("一、專科班", "section"))
    specialist_body: list[tuple] = []
    banner_rows: set[int] = set()
    current_banner = None
    for row in specialist:
        banner = group_banner(row)
        if banner != current_banner:
            current_banner = banner
            specialist_body.append(("banner", [f"{banner}級"]))
            banner_rows.add(len(specialist_body))
        students = student_lines(list(row.get("students") or []), homework=False)
        specialist_body.append(
            (
                "class",
                [
                    class_title(row),
                    format_when(row.get("day_of_week"), row.get("time_slot")),
                    str(row.get("teacher") or "未指定"),
                    students,
                ],
            )
        )
    add_table(["班別", "時間", "任教老師", "就讀學生"], specialist_body, banner_rows)

    story.append(Spacer(1, 3 * mm))
    story.append(p("二、功課輔導班", "section"))
    homework_body = []
    for row in homework:
        homework_body.append(
            (
                "class",
                [
                    class_title(row),
                    format_when(row.get("day_of_week"), row.get("time_slot")),
                    "按當值編更",
                    student_lines(list(row.get("students") or []), homework=True),
                ],
            )
        )
    add_table(["班別", "時間", "任教老師", "就讀學生"], homework_body, set())

    story.append(Spacer(1, 3 * mm))
    story.append(p("三、私人課程", "section"))
    private_body = []
    for row in private:
        private_body.append(
            (
                "class",
                [
                    class_title(row),
                    private_when(str(row.get("subject") or ""), slots_by_subject, bounds_by_subject),
                    str(row.get("teacher") or "未指定"),
                    student_lines(list(row.get("students") or []), homework=False),
                ],
            )
        )
    add_table(["班別", "時間", "任教老師", "就讀學生"], private_body, set())

    def draw_footer(canvas, doc_) -> None:
        canvas.saveState()
        canvas.setFont(font, 8)
        canvas.setFillColor(muted)
        canvas.drawString(12 * mm, 7 * mm, f"明學教育　班別及就讀學生　資料日期 {as_of}")
        canvas.drawRightString(landscape(A4)[0] - 12 * mm, 7 * mm, f"第 {doc_.page} 頁")
        canvas.restoreState()

    doc.build(story, onFirstPage=draw_footer, onLaterPages=draw_footer)
    print(
        f"Wrote {output} specialist={len(specialist)} homework={len(homework)} private={len(private)} "
        f"enrollments={enrollment_count(classes)}"
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--classes", type=Path, default=DEFAULT_CLASSES)
    parser.add_argument("--private-slots", type=Path, default=DEFAULT_SLOTS)
    parser.add_argument("--private-bounds", type=Path, default=DEFAULT_BOUNDS)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--as-of", default=AS_OF, help="資料日期 YYYY-MM-DD")
    parser.add_argument("--term-start", default="2026-09-01", help="私人課程排程起算日")
    args = parser.parse_args()
    build_pdf(
        load_rows(args.classes),
        load_rows(args.private_slots),
        load_rows(args.private_bounds),
        args.output,
        as_of=args.as_of,
        term_start=args.term_start,
    )


if __name__ == "__main__":
    main()
