#!/usr/bin/env python3
"""Generate 2627 Saturday Mid-Autumn holiday student notify PDF.

Usage:
  python3 scripts/generate_2627_sat_midautumn_holiday_notify_pdf.py
"""

from __future__ import annotations

from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs" / "generated" / "2627" / "2627_SAT_MIDAUTUMN_HOLIDAY_NOTIFY.pdf"
FONT_DIR = ROOT / "scripts" / ".fonts"
FONT_FILE = FONT_DIR / "PMingLiU.ttf"
MINGLIU_TTC_CANDIDATES = [
    Path("/Applications/Microsoft Word.app/Contents/Resources/DFonts/mingliu.ttc"),
    Path("/Applications/Microsoft Word.app/Contents/Resources/OtherFonts/mingliu.ttc"),
]

AS_OF = "2026-09-25"
HOLIDAY = "2026-09-26"
TITLE = "中秋節翌日（星期六）無需上堂通知名單"

# Production snapshot 2026-09-25：2627 逢星期六專科班、就讀中（去重）
STUDENT_ROWS: list[dict[str, str]] = [
    {"code": "20261970", "name": "吳梓甄", "grade": "S6", "phone": "95775686", "classes": "2627-CHIS6001-A（16:30–17:45／Christine Fan）"},
    {"code": "20261925", "name": "屈卓衡", "grade": "S2", "phone": "60649220", "classes": "2627-CHIS2001-C（17:45–19:00／Billy Shek）"},
    {"code": "20261908", "name": "張以諾", "grade": "S4", "phone": "94588220", "classes": "2627-CHIS4001-A（12:45–14:00／Christine Fan）"},
    {"code": "20261848", "name": "張展榮", "grade": "S6", "phone": "63923637", "classes": "2627-CHIS6001-A（16:30–17:45／Christine Fan）"},
    {"code": "20261892", "name": "張聖汶", "grade": "S2", "phone": "91252523", "classes": "2627-MATHS2001-C（12:45–14:00／Leo Chan）"},
    {"code": "20261690", "name": "徐思思", "grade": "S6", "phone": "56961026", "classes": "2627-CHIS6001-A（16:30–17:45／Christine Fan）"},
    {"code": "20261969", "name": "曾一帆", "grade": "P6", "phone": "44832821", "classes": "2627-ENGS1001-B（10:15–11:30／Cheryl Ng）"},
    {"code": "20261623", "name": "朱震軒", "grade": "S6", "phone": "92129327", "classes": "2627-MATHS6001-D（14:00–15:15／Mark Yu）；2627-CHIS6001-A（16:30–17:45／Christine Fan）"},
    {"code": "20261631", "name": "李承鋒", "grade": "S5", "phone": "92295081", "classes": "2627-MATHS5001-D（11:30–12:45／Mark Yu）"},
    {"code": "20261680", "name": "林藝萱", "grade": "S4", "phone": "67136012", "classes": "2627-M2S4001-A（11:30–12:45／Cheryl Ng）"},
    {"code": "20261614", "name": "梁天因", "grade": "S5", "phone": "66888704", "classes": "2627-MATHS5001-D（11:30–12:45／Mark Yu）；2627-CHIS5001-A（14:00–15:15／Christine Fan）"},
    {"code": "20261932", "name": "梁景維", "grade": "S6", "phone": "67195931", "classes": "2627-ENGS4004-B（12:45–14:00／Jackson Lau）"},
    {"code": "20261760", "name": "羅兆斐", "grade": "S6", "phone": "62913691", "classes": "2627-MATHS6001-D（14:00–15:15／Mark Yu）；2627-CHIS6001-A（16:30–17:45／Christine Fan）"},
    {"code": "20261898", "name": "羅善瀧", "grade": "S2", "phone": "95058111", "classes": "2627-CHIS2001-C（17:45–19:00／Billy Shek）"},
    {"code": "20261968", "name": "莫麗琪", "grade": "S4", "phone": "51708118", "classes": "2627-M2S4001-A（11:30–12:45／Cheryl Ng）"},
    {"code": "20261899", "name": "葉梓軒", "grade": "S4", "phone": "67050538", "classes": "2627-MATHS4001-D（15:15–16:30／Mark Yu）"},
    {"code": "20261498", "name": "葉熙桐", "grade": "S6", "phone": "69528622", "classes": "2627-MATHS6001-D（14:00–15:15／Mark Yu）"},
    {"code": "20261711", "name": "蔡汶軒", "grade": "S6", "phone": "90465382", "classes": "2627-CHIS6001-A（16:30–17:45／Christine Fan）"},
    {"code": "20261552", "name": "蕭馥鎣", "grade": "S6", "phone": "65831112", "classes": "2627-MATHS6001-D（14:00–15:15／Mark Yu）；2627-CHIS6001-A（16:30–17:45／Christine Fan）"},
    {"code": "20261770", "name": "譚仟渝", "grade": "S5", "phone": "97326262", "classes": "2627-MATHS5001-D（11:30–12:45／Mark Yu）"},
    {"code": "20261593", "name": "趙佳鑫", "grade": "S6", "phone": "13480801222", "classes": "2627-MATHS6001-D（14:00–15:15／Mark Yu）；2627-CHIS6001-A（16:30–17:45／Christine Fan）"},
    {"code": "20261976", "name": "陳善珈", "grade": "S6", "phone": "65428899", "classes": "2627-ENGS4004-B（12:45–14:00／Jackson Lau）"},
    {"code": "20261962", "name": "陳心然", "grade": "S6", "phone": "69056945", "classes": "2627-ENGS4004-B（12:45–14:00／Jackson Lau）"},
    {"code": "20261873", "name": "雷洛驊", "grade": "S2", "phone": "54308702", "classes": "2627-CHIS2001-C（17:45–19:00／Billy Shek）"},
    {"code": "20261920", "name": "馮國璇", "grade": "S3", "phone": "92126107", "classes": "2627-MATHS3001-A（10:15–11:30／Mark Yu）"},
    {"code": "20261960", "name": "黃詠仁", "grade": "S4", "phone": "61263399", "classes": "2627-MATHS4001-D（15:15–16:30／Mark Yu）"},
]

CLASS_ROWS: list[dict[str, str]] = [
    {"time": "10:15–11:30", "code": "2627-ENGS1001-B", "subject": "英國語文", "teacher": "Cheryl Ng", "n": "1", "students": "曾一帆"},
    {"time": "10:15–11:30", "code": "2627-MATHS3001-A", "subject": "數學（必修部份）", "teacher": "Mark Yu", "n": "1", "students": "馮國璇"},
    {"time": "11:30–12:45", "code": "2627-M2S4001-A", "subject": "數學延伸部分（單元二 M2）", "teacher": "Cheryl Ng", "n": "2", "students": "林藝萱、莫麗琪"},
    {"time": "11:30–12:45", "code": "2627-MATHS5001-D", "subject": "數學（必修部份）", "teacher": "Mark Yu", "n": "3", "students": "李承鋒、梁天因、譚仟渝"},
    {"time": "12:45–14:00", "code": "2627-CHIS4001-A", "subject": "中國語文", "teacher": "Christine Fan", "n": "1", "students": "張以諾"},
    {"time": "12:45–14:00", "code": "2627-ENGS4004-B", "subject": "英國語文", "teacher": "Jackson Lau", "n": "3", "students": "梁景維、陳善珈、陳心然"},
    {"time": "12:45–14:00", "code": "2627-MATHS2001-C", "subject": "數學（必修部份）", "teacher": "Leo Chan", "n": "1", "students": "張聖汶"},
    {"time": "14:00–15:15", "code": "2627-CHIS5001-A", "subject": "中國語文", "teacher": "Christine Fan", "n": "1", "students": "梁天因"},
    {"time": "14:00–15:15", "code": "2627-MATHS6001-D", "subject": "數學（必修部份）", "teacher": "Mark Yu", "n": "5", "students": "朱震軒、羅兆斐、葉熙桐、蕭馥鎣、趙佳鑫"},
    {"time": "15:15–16:30", "code": "2627-MATHS4001-D", "subject": "數學（必修部份）", "teacher": "Mark Yu", "n": "2", "students": "葉梓軒、黃詠仁"},
    {"time": "16:30–17:45", "code": "2627-CHIS6001-A", "subject": "中國語文", "teacher": "Christine Fan", "n": "8", "students": "吳梓甄、張展榮、徐思思、朱震軒、羅兆斐、蔡汶軒、蕭馥鎣、趙佳鑫"},
    {"time": "17:45–19:00", "code": "2627-CHIS2001-C", "subject": "中國語文", "teacher": "Billy Shek", "n": "3", "students": "屈卓衡、羅善瀧、雷洛驊"},
]

PRIVATE_NOTE = (
    "另計私人課程：黃瑋霆（20261891／61584482）· 黃瑋霆數學（必修部份）一對一 · "
    "Natalie Kwok · 2026-09-26 14:00–15:15 仍有「正常」排程，通知放假時請一併處理。"
)


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
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    pdfmetrics.registerFont(TTFont("PMingLiU", str(font_path)))
    font = "PMingLiU"
    ink = colors.HexColor("#202020")
    muted = colors.HexColor("#5f5f5f")
    line = colors.HexColor("#bdbdbd")
    header_bg = colors.HexColor("#e9ecef")
    accent = colors.HexColor("#315f66")
    alternate = colors.HexColor("#f7f7f7")
    warn_bg = colors.HexColor("#fff4e5")

    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="ZhTitle",
            fontName=font,
            fontSize=15,
            leading=20,
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
            spaceAfter=8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhH2",
            fontName=font,
            fontSize=11,
            leading=15,
            alignment=TA_LEFT,
            textColor=ink,
            spaceBefore=10,
            spaceAfter=5,
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
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhWarn",
            fontName=font,
            fontSize=8.5,
            leading=12,
            alignment=TA_LEFT,
            textColor=ink,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhCell",
            fontName=font,
            fontSize=8.5,
            leading=11,
            alignment=TA_LEFT,
            textColor=ink,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhCellCenter",
            fontName=font,
            fontSize=8.5,
            leading=11,
            alignment=TA_CENTER,
            textColor=ink,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhHead",
            fontName=font,
            fontSize=8.5,
            leading=11,
            alignment=TA_CENTER,
            textColor=ink,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhFooter",
            fontName=font,
            fontSize=8,
            leading=10,
            alignment=TA_RIGHT,
            textColor=muted,
        )
    )

    def cell(text: str, style_name: str = "ZhCell") -> Paragraph:
        return Paragraph(escape(text).replace("；", "<br/>"), styles[style_name])

    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        leftMargin=12 * mm,
        rightMargin=12 * mm,
        topMargin=12 * mm,
        bottomMargin=12 * mm,
        title=TITLE,
        author="MainHope",
    )

    story: list = []
    story.append(Paragraph(escape(TITLE), styles["ZhTitle"]))
    story.append(
        Paragraph(
            escape(
                f"放假日：{HOLIDAY}（星期六·中秋節翌日／校舍假期）· 學年 2627 · "
                f"查庫日期 {AS_OF} · 就讀中專科班"
            ),
            styles["ZhSub"],
        )
    )
    story.append(
        Paragraph(
            escape(
                f"須通知專科班學生 {len(STUDENT_ROWS)} 人（去重）。"
                "功輔只開星期一至五，無需納入。"
                "校舍假期專科班本來不建排程；本名單以班別星期推算平常逢星期六上堂者。"
            ),
            styles["ZhNote"],
        )
    )

    warn_table = Table(
        [[Paragraph(escape(PRIVATE_NOTE), styles["ZhWarn"])]],
        colWidths=[186 * mm],
    )
    warn_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), warn_bg),
                ("BOX", (0, 0), (-1, -1), 0.5, line),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    story.append(warn_table)
    story.append(Spacer(1, 6))

    story.append(Paragraph(escape(f"一、按學生（通知用 · {len(STUDENT_ROWS)} 人）"), styles["ZhH2"]))
    student_data = [
        [
            cell("學號", "ZhHead"),
            cell("姓名", "ZhHead"),
            cell("年級", "ZhHead"),
            cell("聯絡電話", "ZhHead"),
            cell("星期六班別", "ZhHead"),
        ]
    ]
    for row in STUDENT_ROWS:
        student_data.append(
            [
                cell(row["code"], "ZhCellCenter"),
                cell(row["name"], "ZhCellCenter"),
                cell(row["grade"], "ZhCellCenter"),
                cell(row["phone"], "ZhCellCenter"),
                cell(row["classes"]),
            ]
        )

    student_table = Table(
        student_data,
        colWidths=[28 * mm, 22 * mm, 14 * mm, 28 * mm, 94 * mm],
        repeatRows=1,
    )
    student_style = [
        ("BACKGROUND", (0, 0), (-1, 0), header_bg),
        ("TEXTCOLOR", (0, 0), (-1, -1), ink),
        ("FONTNAME", (0, 0), (-1, -1), font),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.4, line),
        ("LEFTPADDING", (0, 0), (-1, -1), 3),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]
    for i in range(1, len(student_data)):
        if i % 2 == 0:
            student_style.append(("BACKGROUND", (0, i), (-1, i), alternate))
    student_table.setStyle(TableStyle(student_style))
    story.append(student_table)

    story.append(Paragraph(escape(f"二、按班別（核對用 · {len(CLASS_ROWS)} 班有人）"), styles["ZhH2"]))
    class_data = [
        [
            cell("時段", "ZhHead"),
            cell("班別代碼", "ZhHead"),
            cell("科目", "ZhHead"),
            cell("老師", "ZhHead"),
            cell("人數", "ZhHead"),
            cell("學生", "ZhHead"),
        ]
    ]
    for row in CLASS_ROWS:
        class_data.append(
            [
                cell(row["time"], "ZhCellCenter"),
                cell(row["code"]),
                cell(row["subject"]),
                cell(row["teacher"]),
                cell(row["n"], "ZhCellCenter"),
                cell(row["students"]),
            ]
        )

    class_table = Table(
        class_data,
        colWidths=[28 * mm, 38 * mm, 36 * mm, 28 * mm, 12 * mm, 44 * mm],
        repeatRows=1,
    )
    class_style = [
        ("BACKGROUND", (0, 0), (-1, 0), header_bg),
        ("TEXTCOLOR", (0, 0), (-1, -1), ink),
        ("FONTNAME", (0, 0), (-1, -1), font),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.4, line),
        ("LEFTPADDING", (0, 0), (-1, -1), 3),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]
    for i in range(1, len(class_data)):
        if i % 2 == 0:
            class_style.append(("BACKGROUND", (0, i), (-1, i), alternate))
    class_table.setStyle(TableStyle(class_style))
    story.append(class_table)

    story.append(Spacer(1, 8))
    story.append(
        Paragraph(
            escape("來源：MainHope_production · 本檔僅供行政通知用"),
            styles["ZhFooter"],
        )
    )

    doc.build(story)
    print(f"Wrote {OUTPUT}")


def main() -> None:
    font_path = ensure_pmingliu()
    build_pdf(font_path)


if __name__ == "__main__":
    main()
