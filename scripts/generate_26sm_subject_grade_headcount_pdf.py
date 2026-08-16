#!/usr/bin/env python3
"""Generate 26SM subject × grade enrolment headcount PDF.

Snapshot (2026-08-16):  python3 scripts/generate_26sm_subject_grade_headcount_pdf.py
"""

from __future__ import annotations

from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs" / "generated" / "26sm" / "26SM_SUBJECT_GRADE_HEADCOUNT.pdf"
FONT_DIR = ROOT / "scripts" / ".fonts"
FONT_FILE = FONT_DIR / "PMingLiU.ttf"
MINGLIU_TTC_CANDIDATES = [
    Path("/Applications/Microsoft Word.app/Contents/Resources/DFonts/mingliu.ttc"),
    Path("/Applications/Microsoft Word.app/Contents/Resources/OtherFonts/mingliu.ttc"),
]

AS_OF = "2026-08-16"
TITLE = "26SM 各科各級就讀人數"

# 專科班：科目, 中一…中六, 全級。0＝已開無人；—＝未開班。
SUBJECT_ROWS: list[list[str]] = [
    ["中文", "2", "3", "3", "2", "3", "10", "23"],
    ["英文", "2", "5", "2", "—", "6", "9", "24"],
    ["數學", "1", "2", "8", "4", "3", "6", "24"],
    ["科學", "0", "0", "4", "—", "—", "—", "4"],
    ["物理", "—", "—", "—", "2", "0", "0", "2"],
    ["化學", "—", "—", "—", "0", "0", "1", "1"],
    ["生物", "—", "—", "—", "4", "0", "6", "10"],
    ["M2", "—", "—", "—", "3", "0", "0", "3"],
    ["企會財", "—", "—", "—", "—", "1", "1", "2"],
]

SUBJECT_TOTALS: list[list[str]] = [
    ["英文", "24"],
    ["數學", "24"],
    ["中文", "23"],
    ["生物", "10"],
    ["科學", "4"],
    ["M2", "3"],
    ["物理", "2"],
    ["企會財", "2"],
    ["化學", "1"],
]

TEACHER_ROWS: list[list[str]] = [
    ["Mark Yu", "數學", "21"],
    ["Christine Fan", "中文", "15"],
    ["Cheryl Ng", "英文、M2", "12"],
    ["Cyndi Ng", "英文", "11"],
    ["Katie Lee", "中文", "6"],
    ["Henry Wong", "生物", "5"],
    ["Judy Chu", "生物", "5"],
    ["Phoebe Tam", "化學、科學", "5"],
    ["Jackson Lau", "英文", "4"],
    ["Liam Lai", "數學", "3"],
    ["Billy Shek", "中文", "2"],
    ["Leo Chan", "物理", "2"],
    ["Rafael Ling", "企會財", "2"],
]


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


def build_pdf(font_path: Path) -> None:
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import mm
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import (
        Paragraph,
        SimpleDocTemplate,
        Spacer,
        Table,
        TableStyle,
    )

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    pdfmetrics.registerFont(TTFont("PMingLiU", str(font_path)))
    font = "PMingLiU"
    ink = colors.HexColor("#202020")
    muted = colors.HexColor("#5f5f5f")
    line = colors.HexColor("#bdbdbd")
    header_bg = colors.HexColor("#e9ecef")
    accent = colors.HexColor("#315f66")
    alternate = colors.HexColor("#f7f7f7")

    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="ZhTitle",
            fontName=font,
            fontSize=16,
            leading=22,
            alignment=TA_CENTER,
            textColor=accent,
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhSub",
            fontName=font,
            fontSize=9,
            leading=13,
            alignment=TA_CENTER,
            textColor=muted,
            spaceAfter=10,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhH2",
            fontName=font,
            fontSize=11,
            leading=16,
            alignment=TA_LEFT,
            textColor=ink,
            spaceBefore=12,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhNote",
            fontName=font,
            fontSize=8.5,
            leading=12,
            alignment=TA_LEFT,
            textColor=muted,
            spaceAfter=8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhCell",
            fontName=font,
            fontSize=9,
            leading=12,
            alignment=TA_LEFT,
            textColor=ink,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhCellCenter",
            fontName=font,
            fontSize=9,
            leading=12,
            alignment=TA_CENTER,
            textColor=ink,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhCellRight",
            fontName=font,
            fontSize=9,
            leading=12,
            alignment=TA_RIGHT,
            textColor=ink,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhHead",
            fontName=font,
            fontSize=9,
            leading=12,
            alignment=TA_CENTER,
            textColor=ink,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhStat",
            fontName=font,
            fontSize=11,
            leading=14,
            alignment=TA_CENTER,
            textColor=ink,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhFooter",
            fontName=font,
            fontSize=8,
            leading=11,
            alignment=TA_CENTER,
            textColor=muted,
        )
    )

    def cell(text: str, style: str = "ZhCell") -> Paragraph:
        return Paragraph(escape(text), styles[style])

    def styled_table(data: list[list], col_widths: list[float], *, right_from: int = 1) -> Table:
        table = Table(data, colWidths=col_widths, repeatRows=1, hAlign="CENTER")
        cmds = [
            ("FONTNAME", (0, 0), (-1, -1), font),
            ("BACKGROUND", (0, 0), (-1, 0), header_bg),
            ("TEXTCOLOR", (0, 0), (-1, -1), ink),
            ("GRID", (0, 0), (-1, -1), 0.4, line),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
            ("RIGHTPADDING", (0, 0), (-1, -1), 5),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("ALIGN", (0, 0), (0, -1), "LEFT"),
            ("ALIGN", (right_from, 1), (-1, -1), "CENTER"),
        ]
        for i in range(1, len(data)):
            if i % 2 == 0:
                cmds.append(("BACKGROUND", (0, i), (-1, i), alternate))
        table.setStyle(TableStyle(cmds))
        return table

    usable = 160 * mm
    story: list = [
        Paragraph("明學教育", styles["ZhSub"]),
        Paragraph(TITLE, styles["ZhTitle"]),
        Paragraph(f"暑期專科班｜截至 {AS_OF}｜production 快照", styles["ZhSub"]),
    ]

    stat_data = [
        [cell("已開專科科目", "ZhHead"), cell("專科報讀人次", "ZhHead"), cell("不重複學生", "ZhHead"), cell("英文中四", "ZhHead")],
        [cell("9", "ZhStat"), cell("93", "ZhStat"), cell("56", "ZhStat"), cell("未開班", "ZhStat")],
    ]
    stat_table = Table(stat_data, colWidths=[usable / 4] * 4, hAlign="CENTER")
    stat_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), header_bg),
                ("GRID", (0, 0), (-1, -1), 0.4, line),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(stat_table)
    story.append(Spacer(1, 8))
    story.append(
        Paragraph(
            "人數＝報讀狀態「就讀中」的不重複學生。同年級多班已合併。"
            "「0」＝該級已開班但無人就讀；「—」＝該級沒有開班。"
            "同一學生報讀多科會分別計入各科，故各科全級合計（93）大於不重複學生（56）。",
            styles["ZhNote"],
        )
    )

    story.append(Paragraph("一、各科 × 年級（不分班別）", styles["ZhH2"]))
    grade_headers = ["科目", "中一", "中二", "中三", "中四", "中五", "中六", "全級"]
    matrix = [[cell(h, "ZhHead") for h in grade_headers]]
    for row in SUBJECT_ROWS:
        matrix.append(
            [cell(row[0])]
            + [cell(v, "ZhCellCenter") for v in row[1:-1]]
            + [cell(row[-1], "ZhCellCenter")]
        )
    col_w = [28 * mm] + [18.8 * mm] * 6 + [19.2 * mm]
    story.append(styled_table(matrix, col_w))
    story.append(
        Paragraph(
            "Source: production classes＋student_class_enrollments · 26SM · 專科班小組課 · 就讀中",
            styles["ZhNote"],
        )
    )

    story.append(Paragraph("二、每科全級合計", styles["ZhH2"]))
    totals = [[cell("科目", "ZhHead"), cell("全級就讀人數", "ZhHead")]]
    for subj, n in SUBJECT_TOTALS:
        totals.append([cell(subj), cell(n, "ZhCellCenter")])
    story.append(styled_table(totals, [80 * mm, 80 * mm]))

    story.append(Paragraph("三、功輔班（不屬專科）", styles["ZhH2"]))
    hwk = [
        [cell("科目", "ZhHead"), cell("年級", "ZhHead"), cell("任教", "ZhHead"), cell("就讀人數", "ZhHead")],
        [cell("功輔班"), cell("小六", "ZhCellCenter"), cell("Test Only"), cell("3", "ZhCellCenter")],
    ]
    story.append(styled_table(hwk, [40 * mm, 40 * mm, 40 * mm, 40 * mm]))
    story.append(
        Paragraph("示範／測試班；不計入上方專科全級。連功輔：報讀 96 人次、不重複 59 人。", styles["ZhNote"])
    )

    story.append(Paragraph("四、各老師學生總數", styles["ZhH2"]))
    story.append(
        Paragraph(
            "專科班就讀中、不重複學生。老師名下多班已去重；無人就讀的老師不列出。Emma Cai 於 26SM 無專科任教班。",
            styles["ZhNote"],
        )
    )
    teachers = [[cell("老師", "ZhHead"), cell("任教科目", "ZhHead"), cell("學生人數", "ZhHead")]]
    for name, subjects, n in TEACHER_ROWS:
        teachers.append([cell(name), cell(subjects), cell(n, "ZhCellCenter")])
    story.append(styled_table(teachers, [55 * mm, 70 * mm, 35 * mm]))
    story.append(
        Paragraph("上表合計 93 人＝專科報讀人次；因學生跨科，全社不重複仍為 56。", styles["ZhNote"])
    )
    story.append(Spacer(1, 12))
    story.append(Paragraph("— 完 —", styles["ZhFooter"]))

    def add_page_number(canvas, doc) -> None:
        canvas.saveState()
        canvas.setFont(font, 8)
        canvas.setFillColor(muted)
        canvas.drawCentredString(A4[0] / 2, 12 * mm, f"— {doc.page} —")
        canvas.restoreState()

    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        leftMargin=25 * mm,
        rightMargin=25 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        title=TITLE,
        author="明學教育",
    )
    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)


def main() -> None:
    font_path = ensure_pmingliu()
    build_pdf(font_path)
    print("wrote", OUTPUT)


if __name__ == "__main__":
    main()
