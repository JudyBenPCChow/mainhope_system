#!/usr/bin/env python3
"""Generate the complete MainHope terminology PDF.

Source: docs/meta/TERMINOLOGY.md
Output: docs/generated/frontdesk/MAINHOPE_TERMINOLOGY.pdf
"""

from __future__ import annotations

import re
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "meta" / "TERMINOLOGY.md"
OUTPUT = ROOT / "docs" / "generated" / "frontdesk" / "MAINHOPE_TERMINOLOGY.pdf"
FONT_DIR = ROOT / "scripts" / ".fonts"
FONT_FILE = FONT_DIR / "PMingLiU.ttf"
MINGLIU_TTC_CANDIDATES = [
    Path("/Applications/Microsoft Word.app/Contents/Resources/DFonts/mingliu.ttc"),
    Path("/Applications/Microsoft Word.app/Contents/Resources/OtherFonts/mingliu.ttc"),
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


def inline_markup(text: str) -> str:
    """Convert the small Markdown subset used by TERMINOLOGY.md."""
    links: list[str] = []

    def save_link(match: re.Match[str]) -> str:
        links.append(match.group(1))
        return f"@@LINK{len(links) - 1}@@"

    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", save_link, text)
    text = escape(text.strip())
    text = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"`([^`]+)`", r"<font color='#4f4f4f'>\1</font>", text)
    for index, label in enumerate(links):
        text = text.replace(f"@@LINK{index}@@", escape(label))
    return text


def is_table_separator(cells: list[str]) -> bool:
    return all(set(cell) <= {"-", ":", " "} for cell in cells)


def build_pdf(font_path: Path) -> None:
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_LEFT
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import mm
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import (
        HRFlowable,
        LongTable,
        PageBreak,
        Paragraph,
        SimpleDocTemplate,
        Spacer,
        TableStyle,
    )

    raw_lines = SOURCE.read_text(encoding="utf-8").splitlines()
    update_date = next(
        line.removeprefix("更新日期：").strip()
        for line in raw_lines
        if line.startswith("更新日期：")
    )
    lines = [line for line in raw_lines if not line.startswith("更新日期：")]
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    pdfmetrics.registerFont(TTFont("PMingLiU", str(font_path)))
    font = "PMingLiU"
    ink = colors.HexColor("#202020")
    muted = colors.HexColor("#5f5f5f")
    line_color = colors.HexColor("#bdbdbd")
    header_bg = colors.HexColor("#e9ecef")
    alternate = colors.HexColor("#f7f7f7")
    accent = colors.HexColor("#315f66")

    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="ZhTitle",
            fontName=font,
            fontSize=20,
            leading=27,
            alignment=TA_CENTER,
            textColor=accent,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhSubtitle",
            fontName=font,
            fontSize=9.5,
            leading=13,
            alignment=TA_CENTER,
            textColor=muted,
            spaceAfter=10,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhHeading",
            fontName=font,
            fontSize=14,
            leading=19,
            textColor=accent,
            spaceBefore=8,
            spaceAfter=6,
            keepWithNext=True,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhBody",
            fontName=font,
            fontSize=10,
            leading=15,
            alignment=TA_LEFT,
            textColor=ink,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhBullet",
            fontName=font,
            fontSize=10,
            leading=15,
            alignment=TA_LEFT,
            textColor=ink,
            leftIndent=5 * mm,
            firstLineIndent=-3.5 * mm,
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhCell",
            fontName=font,
            fontSize=9.2,
            leading=13,
            alignment=TA_LEFT,
            textColor=ink,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhCellHeader",
            fontName=font,
            fontSize=9.4,
            leading=13,
            alignment=TA_LEFT,
            textColor=ink,
        )
    )

    def cell(text: str, header: bool = False) -> Paragraph:
        return Paragraph(inline_markup(text), styles["ZhCellHeader" if header else "ZhCell"])

    def footer(canvas, doc) -> None:
        canvas.saveState()
        canvas.setFont(font, 8)
        canvas.setFillColor(muted)
        canvas.drawString(16 * mm, 10 * mm, "明學教育｜完整用語表")
        canvas.drawRightString(A4[0] - 16 * mm, 10 * mm, f"第 {doc.page} 頁")
        canvas.restoreState()

    story = [
        Paragraph(inline_markup(lines[0].removeprefix("# ")), styles["ZhTitle"]),
        Paragraph(f"全體員工查閱｜更新日期：{escape(update_date)}", styles["ZhSubtitle"]),
    ]

    index = 1
    section_count = 0
    while index < len(lines):
        line = lines[index].strip()
        if not line:
            index += 1
            continue
        if line == "---":
            story.extend(
                [
                    Spacer(1, 2 * mm),
                    HRFlowable(width="100%", thickness=0.5, color=line_color),
                    Spacer(1, 2 * mm),
                ]
            )
            index += 1
            continue
        if line.startswith("## "):
            section_count += 1
            if section_count > 1 and line.startswith(("## 4.", "## 7.", "## 10.")):
                story.append(PageBreak())
            story.append(Paragraph(inline_markup(line[3:]), styles["ZhHeading"]))
            index += 1
            continue
        if line.startswith("|"):
            raw_rows: list[list[str]] = []
            while index < len(lines) and lines[index].strip().startswith("|"):
                row = [part.strip() for part in lines[index].strip().strip("|").split("|")]
                if not is_table_separator(row):
                    raw_rows.append(row)
                index += 1
            rendered = [
                [cell(value, header=row_index == 0) for value in row]
                for row_index, row in enumerate(raw_rows)
            ]
            table = LongTable(
                rendered,
                colWidths=[42 * mm, 135 * mm],
                repeatRows=1,
                hAlign="CENTER",
                splitByRow=1,
            )
            table_style = [
                ("BACKGROUND", (0, 0), (-1, 0), header_bg),
                ("GRID", (0, 0), (-1, -1), 0.45, line_color),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ]
            for row_index in range(2, len(raw_rows), 2):
                table_style.append(("BACKGROUND", (0, row_index), (-1, row_index), alternate))
            table.setStyle(TableStyle(table_style))
            story.extend([table, Spacer(1, 4 * mm)])
            continue
        if line.startswith("- "):
            story.append(Paragraph(f"• {inline_markup(line[2:])}", styles["ZhBullet"]))
            index += 1
            continue
        if line.startswith("# "):
            index += 1
            continue

        paragraph_lines = [line]
        index += 1
        while index < len(lines):
            next_line = lines[index].strip()
            if not next_line or next_line == "---" or next_line.startswith(("## ", "|", "- ")):
                break
            paragraph_lines.append(next_line)
            index += 1
        story.append(Paragraph(inline_markup(" ".join(paragraph_lines)), styles["ZhBody"]))

    document = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        leftMargin=16 * mm,
        rightMargin=16 * mm,
        topMargin=15 * mm,
        bottomMargin=17 * mm,
        title="明學教育完整用語表",
        author="明學教育",
        subject="公司用詞及其含義",
    )
    document.build(story, onFirstPage=footer, onLaterPages=footer)
    print(f"wrote {OUTPUT}")


def main() -> None:
    build_pdf(ensure_pmingliu())


if __name__ == "__main__":
    main()
