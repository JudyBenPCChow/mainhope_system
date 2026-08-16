#!/usr/bin/env python3
"""Generate leave / makeup follow-up PDF.

Live:  python3 scripts/generate_26sm_leave_makeup_pdf.py --data <json>
Snapshot (26SM 2026-08-16):  python3 scripts/generate_26sm_leave_makeup_pdf.py
"""

from __future__ import annotations

import argparse
import json
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs" / "generated" / "26sm" / "26SM_LEAVE_MAKEUP_FOLLOWUP.pdf"
FONT_DIR = ROOT / "scripts" / ".fonts"
FONT_FILE = FONT_DIR / "PMingLiU.ttf"
MINGLIU_TTC_CANDIDATES = [
    Path("/Applications/Microsoft Word.app/Contents/Resources/DFonts/mingliu.ttc"),
    Path("/Applications/Microsoft Word.app/Contents/Resources/OtherFonts/mingliu.ttc"),
]

AS_OF = "2026-08-16"
TITLE = "26SM 請假補堂待跟進"

# bucket, class, teacher, students, reason, leave_date, arranged, makeup_date, lessons, note
ROWS: list[tuple[str, str, str, str, str, str, bool, str, int, str]] = [
    ("s_none", "26SM-BAFSS6008-B", "Rafael Ling", "蔡汶軒", "事假", "2026-07-27", False, "—", 1, "系統寫調堂但未有補堂日"),
    ("s_none", "26SM-BIOS6008-A", "Henry Wong", "黃慧淇", "事假", "2026-08-06", False, "—", 1, "系統寫調堂但未有補堂日"),
    ("s_none", "26SM-BIOS6008-A", "Henry Wong", "黃慧淇", "事假", "2026-08-13", False, "—", 1, "備註：8月底補"),
    ("s_none", "26SM-BIOS6008-A", "Henry Wong", "黃慧淇", "事假", "2026-08-15", False, "—", 1, "備註：8月底補"),
    ("s_none", "26SM-CHIS2008-C", "Katie Lee", "梁希箏", "事假", "2026-08-13", False, "—", 1, "系統寫調堂但未有補堂日"),
    ("s_none", "26SM-CHIS4008-B", "Christine Fan", "黃詠仁", "事假", "2026-08-17", False, "—", 1, "請假日尚未到"),
    ("s_none", "26SM-CHIS5008-A", "Christine Fan", "梁天因", "事假", "2026-07-21", False, "—", 2, "連堂；備註：8月底補"),
    ("s_none", "26SM-CHIS5008-A", "Christine Fan", "霍健一", "病假", "2026-07-21", False, "—", 2, "連堂"),
    ("s_none", "26SM-CHIS5008-A", "Christine Fan", "霍健一", "事假", "2026-08-04", False, "—", 2, "連堂；系統寫調堂但未有補堂日"),
    ("s_none", "26SM-CHIS6008-A", "Christine Fan", "蔡汶軒", "病假", "2026-07-14", False, "—", 2, "連堂；備註：8月底補"),
    ("s_none", "26SM-CHIS6008-A", "Christine Fan", "郭羨潼", "事假", "2026-08-18", False, "—", 2, "連堂；請假日尚未到"),
    ("s_none", "26SM-CHIS6008-B", "Christine Fan", "吳梓甄", "事假", "2026-07-16", False, "—", 1, "備註：8月底補"),
    ("s_none", "26SM-ENGS1008-A", "Cheryl Ng", "曾一帆", "事假", "2026-08-03", False, "—", 1, "系統寫調堂但未有補堂日"),
    ("s_none", "26SM-ENGS2008-B", "Cheryl Ng", "謝瑋翹", "事假", "2026-07-14", False, "—", 1, "備註：要上學，8月底補"),
    ("s_none", "26SM-ENGS2008-B", "Cheryl Ng", "朱俊賢", "事假", "2026-07-23", False, "—", 1, ""),
    ("s_none", "26SM-ENGS2008-B", "Cheryl Ng", "朱俊賢", "事假", "2026-07-30", False, "—", 1, ""),
    ("s_none", "26SM-ENGS3008-A", "Cheryl Ng", "陳佳鐫", "事假", "2026-08-17", False, "—", 1, "請假日尚未到"),
    ("s_none", "26SM-ENGS5008-A", "Cyndi Ng", "蔡佳俊", "事假", "2026-08-22", False, "—", 2, "連堂；請假日尚未到"),
    ("s_none", "26SM-MATHS1008-A", "Mark Yu", "計曉汶", "事假", "2026-08-14", False, "—", 1, ""),
    ("s_none", "26SM-MATHS1008-A", "Mark Yu", "計曉汶", "事假", "2026-08-19", False, "—", 1, "請假日尚未到"),
    ("s_none", "26SM-MATHS2008-A", "Mark Yu", "梁希箏", "病假", "2026-08-14", False, "—", 1, ""),
    ("s_none", "26SM-MATHS3008-A", "Mark Yu", "阮心兒", "事假", "2026-07-15", False, "—", 1, "備註：8月底補回"),
    ("s_none", "26SM-MATHS3008-A", "Mark Yu", "阮心兒", "事假", "2026-07-17", False, "—", 1, "備註：8月底補回"),
    ("s_none", "26SM-MATHS3008-A", "Mark Yu", "阮心兒", "事假", "2026-07-31", False, "—", 1, "紅雨請假；系統寫調堂但未有補堂日"),
    ("s_none", "26SM-MATHS3008-A", "Mark Yu", "黃詠仁", "事假", "2026-08-14", False, "—", 1, ""),
    ("s_none", "26SM-MATHS4008-B", "Mark Yu", "蔡曉朗", "事假", "2026-07-18", False, "—", 2, "連堂；備註：8月底補堂"),
    ("s_none", "26SM-MATHS4008-B", "Mark Yu", "何迪萱", "事假", "2026-07-25", False, "—", 2, "連堂；備註：8月底補"),
    ("s_none", "26SM-MATHS4008-B", "Mark Yu", "何迪萱", "事假", "2026-08-01", False, "—", 2, "連堂；備註：8月底補"),
    ("s_none", "26SM-PHYS4008-A", "Leo Chan", "何迪萱", "事假", "2026-07-24", False, "—", 2, "連堂；備註：8月底補回"),
    ("s_none", "26SM-PHYS4008-A", "Leo Chan", "何迪萱", "事假", "2026-07-31", False, "—", 2, "連堂；系統寫調堂但未有補堂日"),
    ("s_none", "26SM-SCIS3008-A", "Phoebe Tam", "蕭樂瑩", "事假", "2026-08-07", False, "—", 1, "系統寫調堂但未有補堂日"),
    ("s_none", "26SM-SCIS3008-A", "Phoebe Tam", "蕭樂瑩", "事假", "2026-08-08", False, "—", 1, "系統寫調堂但未有補堂日；同日老師亦請假，此列只計學生事假"),
    ("t_none", "26SM-CHIS4008-B", "Christine Fan", "楊茵喬、黃詠仁", "老師病假", "2026-08-10", False, "—", 2, "單堂報讀生；當日該堂取消"),
    ("t_none", "26SM-CHIS6008-B", "Christine Fan", "吳梓甄、張展榮", "老師病假", "2026-08-10", False, "—", 2, ""),
    ("t_none", "26SM-PHYS4008-A", "Leo Chan", "何迪萱、莫麗琪", "老師請假", "2026-08-21", False, "—", 4, "連堂 2 節；請假日尚未到"),
    ("t_none", "26SM-SCIS3008-A", "Phoebe Tam", "何迪寶、張泳彤", "導師腸胃炎請假", "2026-08-08", False, "—", 2, "蕭樂瑩當日另有學生事假，不在此列重複"),
    ("s_pending", "26SM-ENGS6008-A", "Cyndi Ng", "趙佳鑫", "事假", "2026-08-16", True, "2026-07-26", 2, "連堂；補堂日早於請假日，疑綁錯堂"),
    ("t_pending", "26SM-CHEMS6008-A", "Phoebe Tam", "蕭馥鎣", "導師請假", "2026-07-17、07-18", True, "2026-08-01", 2, "補堂日已過，點名未扣堂"),
    ("t_pending", "26SM-ENGS5008-A", "Cyndi Ng", "林芍延", "老師請假", "2026-08-09", True, "2026-08-22", 2, "連堂；補堂日尚未到"),
    ("t_pending", "26SM-ENGS5009-A", "Jackson Lau", "梁景維、關智博、陳心然", "老師臨時請假", "2026-08-06", True, "2026-08-19", 3, "補堂日尚未到；黃渲棋只報第一期，不在此列"),
    ("t_pending", "26SM-ENGS6008-A", "Cyndi Ng", "徐思思、葉熙桐、蕭馥鎣、郭羨潼、黃慧淇", "老師請假", "2026-08-09", True, "2026-08-22", 10, "連堂 2 節；補堂日尚未到"),
]

BUCKET_LABEL = {
    "s_none": "1 學生請假未安排",
    "s_pending": "2 學生請假已排未上",
    "t_none": "3 老師請假未安排",
    "t_pending": "4 老師請假已排未上",
}

BUCKET_ORDER = ("s_none", "t_none", "s_pending", "t_pending")


def ensure_pmingliu() -> Path:
    FONT_DIR.mkdir(parents=True, exist_ok=True)
    if FONT_FILE.exists() and FONT_FILE.stat().st_size > 1_000_000:
        return FONT_FILE

    from fontTools.ttLib import TTCollection

    source = next((path for path in MINGLIU_TTC_CANDIDATES if path.exists()), None)
    if source is None:
        raise FileNotFoundError("找不到 mingliu.ttc（新細明體）。請安裝 Microsoft Word 後重試。")
    collection = TTCollection(str(source))
    collection.fonts[1].save(str(FONT_FILE))
    return FONT_FILE


def names_of(rows: list[tuple]) -> set[str]:
    names: set[str] = set()
    for row in rows:
        for name in row[3].split("、"):
            trimmed = name.strip()
            if trimmed:
                names.add(trimmed)
    return names


def lessons_of(rows: list[tuple]) -> int:
    return sum(row[8] for row in rows)


def is_overdue(row: tuple, as_of: str) -> bool:
    arranged, makeup = row[6], row[7]
    return arranged and makeup != "—" and makeup < as_of


def rows_from_json(payload: dict) -> list[tuple]:
    out: list[tuple] = []
    for item in payload["rows"]:
        out.append(
            (
                str(item["bucket"]),
                str(item["classCode"]),
                str(item["teacher"]),
                str(item["students"]),
                str(item["reason"]),
                str(item["leaveDate"]),
                bool(item["arranged"]),
                str(item.get("makeupDate") or "—"),
                int(item["lessons"]),
                str(item.get("note") or ""),
            )
        )
    return out


def output_path_for(year: str) -> Path:
    return ROOT / "docs" / "generated" / year.lower() / f"{year}_LEAVE_MAKEUP_FOLLOWUP.pdf"


def build_pdf(
    font_path: Path,
    *,
    rows: list[tuple],
    year: str,
    as_of: str,
    output: Path,
    start_date: str | None = None,
    end_date: str | None = None,
) -> None:
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import mm
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import KeepTogether, LongTable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    output.parent.mkdir(parents=True, exist_ok=True)

    pdfmetrics.registerFont(TTFont("PMingLiU", str(font_path)))
    font = "PMingLiU"
    page_width, _ = landscape(A4)
    ink = colors.HexColor("#202020")
    muted = colors.HexColor("#5f5f5f")
    line = colors.HexColor("#bdbdbd")
    header_bg = colors.HexColor("#e9ecef")
    accent = colors.HexColor("#315f66")
    alternate = colors.HexColor("#f7f7f7")
    warn_bg = colors.HexColor("#f8f1e3")
    danger_bg = colors.HexColor("#f6e4e4")
    info_bg = colors.HexColor("#e8eef3")

    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="ZhTitle",
            fontName=font,
            fontSize=16,
            leading=20,
            alignment=TA_CENTER,
            textColor=accent,
            spaceAfter=3,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhSub",
            fontName=font,
            fontSize=9,
            leading=12,
            alignment=TA_CENTER,
            textColor=muted,
            spaceAfter=8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhCell",
            fontName=font,
            fontSize=7.6,
            leading=10.2,
            alignment=TA_LEFT,
            textColor=ink,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhCellCenter",
            fontName=font,
            fontSize=7.6,
            leading=10.2,
            alignment=TA_CENTER,
            textColor=ink,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhCellRight",
            fontName=font,
            fontSize=7.6,
            leading=10.2,
            alignment=TA_RIGHT,
            textColor=ink,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhHead",
            fontName=font,
            fontSize=7.8,
            leading=10.4,
            alignment=TA_CENTER,
            textColor=ink,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhStat",
            fontName=font,
            fontSize=9,
            leading=13,
            alignment=TA_CENTER,
            textColor=ink,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhNote",
            fontName=font,
            fontSize=8.4,
            leading=12,
            alignment=TA_LEFT,
            textColor=ink,
        )
    )

    need_arrange = [row for row in rows if not row[6]]
    need_attend = [row for row in rows if row[6]]
    overdue = [row for row in rows if is_overdue(row, as_of)]
    arrange_people = names_of(need_arrange)
    attend_people = names_of(need_attend)
    all_people = names_of(rows)

    def cell(text: str, style: str = "ZhCell") -> Paragraph:
        return Paragraph(escape(text), styles[style])

    stat_data = [
        [cell("要安排（人／堂）", "ZhHead"), cell("還要補（人／堂）", "ZhHead"), cell("涉及學生（人／堂）", "ZhHead"), cell("補堂日已過仍未上", "ZhHead")],
        [
            cell(f"{len(arrange_people)} 人　{lessons_of(need_arrange)} 堂", "ZhStat"),
            cell(f"{len(attend_people)} 人　{lessons_of(need_attend)} 堂", "ZhStat"),
            cell(f"{len(all_people)} 人　{lessons_of(rows)} 堂", "ZhStat"),
            cell(f"{len(overdue)} 列", "ZhStat"),
        ],
    ]
    stat_table = Table(stat_data, colWidths=[68 * mm, 68 * mm, 68 * mm, 68 * mm], hAlign="CENTER")
    stat_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), header_bg),
                ("BACKGROUND", (0, 1), (0, 1), warn_bg),
                ("BACKGROUND", (1, 1), (1, 1), info_bg),
                ("BACKGROUND", (3, 1), (3, 1), danger_bg),
                ("GRID", (0, 0), (-1, -1), 0.45, line),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )

    breakdown_header = [cell("分類", "ZhHead"), cell("人數", "ZhHead"), cell("欠堂", "ZhHead")]
    breakdown_rows = [breakdown_header]
    for bucket in BUCKET_ORDER:
        subset = [row for row in rows if row[0] == bucket]
        breakdown_rows.append(
            [
                cell(BUCKET_LABEL[bucket]),
                cell(str(len(names_of(subset))), "ZhCellCenter"),
                cell(str(lessons_of(subset)), "ZhCellCenter"),
            ]
        )
    breakdown = Table(breakdown_rows, colWidths=[90 * mm, 40 * mm, 40 * mm], hAlign="CENTER")
    breakdown.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), header_bg),
                ("GRID", (0, 0), (-1, -1), 0.45, line),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    for index in range(2, len(breakdown_rows), 2):
        breakdown.setStyle(TableStyle([("BACKGROUND", (0, index), (-1, index), alternate)]))

    headers = [
        "分類",
        "班別班號",
        "任教老師",
        "涉及學生",
        "請假原因",
        "原請假日",
        "已安排補堂",
        "補堂日子",
        "欠堂",
        "備註",
    ]
    body: list[list[Paragraph]] = [[cell(h, "ZhHead") for h in headers]]
    row_kinds: list[str] = ["header"]
    for row in rows:
        bucket, class_code, teacher, students, reason, leave_date, arranged, makeup, lessons, note = row
        body.append(
            [
                cell(BUCKET_LABEL[bucket]),
                cell(class_code),
                cell(teacher),
                cell(students),
                cell(reason),
                cell(leave_date),
                cell("是" if arranged else "否", "ZhCellCenter"),
                cell(makeup, "ZhCellCenter"),
                cell(str(lessons), "ZhCellRight"),
                cell(note),
            ]
        )
        if is_overdue(row, as_of):
            row_kinds.append("danger")
        elif not arranged:
            row_kinds.append("warn")
        else:
            row_kinds.append("info")

    col_widths = [
        32 * mm,
        36 * mm,
        26 * mm,
        38 * mm,
        24 * mm,
        28 * mm,
        18 * mm,
        22 * mm,
        12 * mm,
        36 * mm,
    ]
    detail = LongTable(body, colWidths=col_widths, repeatRows=1, hAlign="CENTER")
    table_style: list = [
        ("BACKGROUND", (0, 0), (-1, 0), header_bg),
        ("GRID", (0, 0), (-1, -1), 0.4, line),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 3),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3),
    ]
    for index, kind in enumerate(row_kinds):
        if kind == "header":
            continue
        bg = warn_bg if kind == "warn" else danger_bg if kind == "danger" else info_bg
        table_style.append(("BACKGROUND", (0, index), (-1, index), bg))
    detail.setStyle(TableStyle(table_style))

    notes = [
        "要安排＝未有補堂日／未掛補回堂（含系統寫「調堂」但未選日）。",
        "還要補＝已有補堂日，但該生尚未以現場／錄影回放／zoom／出席等扣堂狀態點名（含未來補堂日）。",
        "同一學生可同時出現在兩類。連堂按 2 堂計。",
        "錄影／不補回／已補課／已上不列入。天氣取消堂已有補回並已點名，不列入。",
        "底色：黃＝未安排；紅＝補堂日已過仍未上；藍＝已排、補堂日未到或當日。",
    ]
    note_rows = [[cell("口徑", "ZhHead")]]
    note_rows.extend([[Paragraph(f"• {escape(note)}", styles["ZhNote"])] for note in notes])
    note_table = Table(note_rows, colWidths=[272 * mm], hAlign="CENTER")
    note_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), header_bg),
                ("BOX", (0, 0), (-1, -1), 0.5, line),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )

    def footer(canvas, doc) -> None:
        canvas.saveState()
        canvas.setFont(font, 8)
        canvas.setFillColor(muted)
        canvas.drawString(12 * mm, 8 * mm, f"明學教育｜{year} 請假補堂待跟進")
        canvas.drawRightString(page_width - 12 * mm, 8 * mm, f"第 {doc.page} 頁")
        canvas.restoreState()

    title = f"{year} 請假補堂待跟進"
    range_label = f"（{start_date}–{end_date}）" if start_date and end_date else ""
    document = SimpleDocTemplate(
        str(output),
        pagesize=landscape(A4),
        leftMargin=12 * mm,
        rightMargin=12 * mm,
        topMargin=11 * mm,
        bottomMargin=14 * mm,
        title=title,
        author="明學教育",
    )
    story = [
        Paragraph(title, styles["ZhTitle"]),
        Paragraph(
            f"{year}{range_label}｜production 截點 {as_of}｜連堂按 2 堂計",
            styles["ZhSub"],
        ),
        stat_table,
        Spacer(1, 4 * mm),
        breakdown,
        Spacer(1, 5 * mm),
        detail,
        Spacer(1, 5 * mm),
        KeepTogether(note_table),
    ]
    document.build(story, onFirstPage=footer, onLaterPages=footer)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate leave / makeup follow-up PDF")
    parser.add_argument("--data", type=Path, help="JSON from leave-makeup-followup skill")
    parser.add_argument("--year", default="26SM")
    parser.add_argument("--as-of", dest="as_of", default=AS_OF)
    args = parser.parse_args()

    year = args.year
    as_of = args.as_of
    start_date = "2026-07-01" if year == "26SM" else None
    end_date = "2026-08-31" if year == "26SM" else None
    rows = ROWS
    output = OUTPUT if year == "26SM" and args.data is None else output_path_for(year)

    if args.data is not None:
        payload = json.loads(args.data.read_text(encoding="utf-8"))
        year = str(payload.get("year") or year)
        as_of = str(payload.get("as_of") or as_of)
        start_date = payload.get("start_date") or start_date
        end_date = payload.get("end_date") or end_date
        rows = rows_from_json(payload)
        output = output_path_for(year)

    font_path = ensure_pmingliu()
    build_pdf(
        font_path,
        rows=rows,
        year=year,
        as_of=as_of,
        output=output,
        start_date=start_date,
        end_date=end_date,
    )
    print(f"wrote {output}")


if __name__ == "__main__":
    main()
