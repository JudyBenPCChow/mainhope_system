#!/usr/bin/env python3
"""Generate simple 2627 calendar handout: 日期｜假期｜專科班｜功課班（✅／❌）.

Source: docs/policies/academic/ACADEMIC_CALENDAR.md
Output: docs/generated/2627/2627_ACADEMIC_CALENDAR_HANDOUT.pdf
"""

from __future__ import annotations

from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "generated" / "2627" / "2627_ACADEMIC_CALENDAR_HANDOUT.pdf"
FONT_DIR = ROOT / "scripts" / ".fonts"
FONT_FILE = FONT_DIR / "PMingLiU.ttf"
EMOJI_YES = FONT_DIR / "emoji_yes.png"
EMOJI_NO = FONT_DIR / "emoji_no.png"
APPLE_EMOJI = Path("/System/Library/Fonts/Apple Color Emoji.ttc")
MINGLIU_TTC_CANDIDATES = [
    Path("/Applications/Microsoft Word.app/Contents/Resources/DFonts/mingliu.ttc"),
    Path("/Applications/Microsoft Word.app/Contents/Resources/OtherFonts/mingliu.ttc"),
]

# (start, end, holiday_name) — inclusive ranges
SPECIALIST_OFF = [
    (date(2026, 9, 26), date(2026, 9, 26), "中秋節翌日"),
    (date(2026, 10, 1), date(2026, 10, 1), "國慶節"),
    (date(2026, 10, 18), date(2026, 10, 18), "重陽節"),
    (date(2026, 12, 25), date(2027, 1, 1), "聖誕／元旦"),
    (date(2027, 2, 4), date(2027, 2, 10), "農曆新年"),
    (date(2027, 3, 29), date(2027, 3, 30), "復活節"),
    (date(2027, 6, 9), date(2027, 6, 9), "端午節"),
]

HOMEWORK_OFF = [
    (date(2026, 9, 26), date(2026, 9, 26), "中秋節翌日"),
    (date(2026, 10, 1), date(2026, 10, 1), "國慶節"),
    (date(2026, 10, 18), date(2026, 10, 19), "重陽節及翌日"),
    (date(2026, 12, 22), date(2026, 12, 31), "聖誕假期"),
    (date(2027, 1, 1), date(2027, 1, 1), "元旦"),
    (date(2027, 2, 4), date(2027, 2, 10), "農曆新年"),
    (date(2027, 3, 26), date(2027, 3, 30), "復活節"),
    (date(2027, 4, 5), date(2027, 4, 5), "清明節"),
    (date(2027, 5, 1), date(2027, 5, 1), "勞動節"),
    (date(2027, 5, 13), date(2027, 5, 13), "佛誕"),
    (date(2027, 6, 9), date(2027, 6, 9), "端午節"),
]

EXTRA_LABELS = {
    date(2026, 10, 19): "重陽節翌日",
    date(2026, 12, 22): "聖誕假期（功輔）",
    date(2026, 12, 23): "聖誕假期（功輔）",
    date(2026, 12, 24): "聖誕假期（功輔）",
    date(2027, 3, 26): "耶穌受難節",
    date(2027, 3, 27): "復活節（功輔）",
    date(2027, 3, 28): "復活節（功輔）",
}


def expand(ranges: list[tuple[date, date, str]]) -> dict[date, str]:
    out: dict[date, str] = {}
    for start, end, name in ranges:
        d = start
        while d <= end:
            out[d] = name
            d += timedelta(days=1)
    return out


def weekday_zh(d: date) -> str:
    return "一二三四五六日"[d.weekday()]


def ensure_pmingliu() -> Path:
    FONT_DIR.mkdir(parents=True, exist_ok=True)
    if FONT_FILE.exists() and FONT_FILE.stat().st_size > 1_000_000:
        return FONT_FILE
    from fontTools.ttLib import TTCollection

    src = next((p for p in MINGLIU_TTC_CANDIDATES if p.exists()), None)
    if src is None:
        raise FileNotFoundError("找不到 mingliu.ttc（新細明體）。請安裝 Microsoft Word 後重試。")
    ttc = TTCollection(str(src))
    ttc.fonts[1].save(str(FONT_FILE))
    return FONT_FILE


def ensure_emoji_pngs() -> tuple[Path, Path]:
    """Render ✅ / ❌ via Apple Color Emoji (CJK body font has no emoji glyphs)."""
    FONT_DIR.mkdir(parents=True, exist_ok=True)
    if EMOJI_YES.exists() and EMOJI_NO.exists():
        return EMOJI_YES, EMOJI_NO
    if not APPLE_EMOJI.exists():
        raise FileNotFoundError("找不到 Apple Color Emoji。")

    from PIL import Image, ImageDraw, ImageFont

    font = ImageFont.truetype(str(APPLE_EMOJI), 160)
    for ch, path in [("✅", EMOJI_YES), ("❌", EMOJI_NO)]:
        canvas = Image.new("RGBA", (220, 220), (255, 255, 255, 0))
        draw = ImageDraw.Draw(canvas)
        draw.text((20, 20), ch, font=font, embedded_color=True)
        bbox = canvas.getbbox()
        if bbox is None:
            raise RuntimeError(f"無法渲染 emoji：{ch}")
        cropped = canvas.crop(bbox)
        side = max(cropped.size) + 8
        out = Image.new("RGBA", (side, side), (255, 255, 255, 0))
        out.paste(
            cropped,
            ((side - cropped.size[0]) // 2, (side - cropped.size[1]) // 2),
            cropped,
        )
        out.save(path)
    return EMOJI_YES, EMOJI_NO


def build_rows() -> list[list]:
    """Each data row: [date_str, holiday, specialist_off: bool, homework_off: bool]."""
    sp = expand(SPECIALIST_OFF)
    hw = expand(HOMEWORK_OFF)
    days = sorted(set(sp) | set(hw))
    rows: list[list] = [["日期", "假期", "專科班", "功課班"]]
    for d in days:
        name = EXTRA_LABELS.get(d) or sp.get(d) or hw.get(d) or ""
        rows.append([f"{d.isoformat()}（{weekday_zh(d)}）", name, d in sp, d in hw])
    return rows


def build_pdf(path: Path, font_path: Path, yes_png: Path, no_png: Path) -> None:
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import cm, mm
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import Image, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    pdfmetrics.registerFont(TTFont("PMingLiU", str(font_path)))
    font = "PMingLiU"
    ink = colors.HexColor("#1a1a1a")
    soft = colors.HexColor("#f3f1ec")
    line = colors.HexColor("#c8c2b6")
    accent = colors.HexColor("#5c4a32")
    off_bg = colors.HexColor("#f5e8e4")
    on_bg = colors.HexColor("#e8f5e9")
    icon_size = 4.2 * mm

    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="DocTitle",
            fontName=font,
            fontSize=14,
            leading=20,
            alignment=TA_CENTER,
            textColor=ink,
            spaceAfter=2,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Brand",
            fontName=font,
            fontSize=16,
            leading=22,
            alignment=TA_CENTER,
            textColor=accent,
            spaceAfter=2,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Sub",
            fontName=font,
            fontSize=9,
            leading=12,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#555555"),
            spaceAfter=8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Cell",
            fontName=font,
            fontSize=9,
            leading=12,
            alignment=TA_CENTER,
            textColor=ink,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CellLeft",
            fontName=font,
            fontSize=9,
            leading=12,
            textColor=ink,
        )
    )
    styles.add(
        ParagraphStyle(
            name="LegendText",
            fontName=font,
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#555555"),
        )
    )

    def cell(text: str, left: bool = False) -> Paragraph:
        return Paragraph(str(text), styles["CellLeft" if left else "Cell"])

    def icon(off: bool) -> Image:
        img = Image(str(no_png if off else yes_png))
        img.drawHeight = icon_size
        img.drawWidth = icon_size
        img.hAlign = "CENTER"
        return img

    raw = build_rows()
    data = []
    for i, row in enumerate(raw):
        if i == 0:
            data.append([cell(c) for c in row])
        else:
            data.append([cell(row[0]), cell(row[1], left=True), icon(row[2]), icon(row[3])])

    widths = [4.6 * cm, 5.4 * cm, 3.25 * cm, 3.25 * cm]
    t = Table(data, colWidths=widths, repeatRows=1)
    cmds = [
        ("FONTNAME", (0, 0), (-1, -1), font),
        ("BACKGROUND", (0, 0), (-1, 0), soft),
        ("TEXTCOLOR", (0, 0), (-1, -1), ink),
        ("GRID", (0, 0), (-1, -1), 0.4, line),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ]
    for r_i, row in enumerate(raw[1:], start=1):
        cmds.append(("BACKGROUND", (2, r_i), (2, r_i), off_bg if row[2] else on_bg))
        cmds.append(("BACKGROUND", (3, r_i), (3, r_i), off_bg if row[3] else on_bg))
    t.setStyle(TableStyle(cmds))

    legend = Table(
        [
            [
                Image(str(yes_png), width=icon_size, height=icon_size),
                Paragraph("上課／開放", styles["LegendText"]),
                Image(str(no_png), width=icon_size, height=icon_size),
                Paragraph("不上課／放假", styles["LegendText"]),
                Paragraph("｜　暫定稿", styles["LegendText"]),
            ]
        ],
        colWidths=[0.6 * cm, 2.6 * cm, 0.6 * cm, 3.0 * cm, 3.0 * cm],
    )
    legend.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("LEFTPADDING", (0, 0), (-1, -1), 2),
                ("RIGHTPADDING", (0, 0), (-1, -1), 2),
            ]
        )
    )

    doc = SimpleDocTemplate(
        str(path),
        pagesize=A4,
        leftMargin=1.8 * cm,
        rightMargin=1.8 * cm,
        topMargin=1.4 * cm,
        bottomMargin=1.4 * cm,
        title="2627 學年假期對照（專科班／功課班）",
        author="明學教育",
    )
    story = [
        Paragraph("明學教育", styles["Brand"]),
        Paragraph("2026–2027 學年假期對照表", styles["DocTitle"]),
        legend,
        Spacer(1, 6),
        t,
        Spacer(1, 8),
        Paragraph("正式公佈前如有修訂，以校方最新通知為準。", styles["Sub"]),
    ]

    def _footer(canvas, _doc):
        canvas.saveState()
        canvas.setFont(font, 8)
        canvas.setFillColor(colors.HexColor("#888888"))
        canvas.drawCentredString(
            A4[0] / 2, 0.9 * cm, f"第 {canvas.getPageNumber()} 頁｜明學教育｜2627 假期對照（暫定）"
        )
        canvas.restoreState()

    path.parent.mkdir(parents=True, exist_ok=True)
    doc.build(story, onFirstPage=_footer, onLaterPages=_footer)


def main() -> None:
    font_path = ensure_pmingliu()
    yes_png, no_png = ensure_emoji_pngs()
    build_pdf(OUT, font_path, yes_png, no_png)
    print("wrote", OUT)


if __name__ == "__main__":
    main()
