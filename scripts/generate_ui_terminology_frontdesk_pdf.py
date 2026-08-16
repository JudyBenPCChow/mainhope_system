#!/usr/bin/env python3
"""Generate the frontdesk UI terminology change reference PDF.

Source: docs/playbooks/frontdesk/UI_TERMINOLOGY_CHANGE_REFERENCE.md
Output: docs/generated/frontdesk/UI_TERMINOLOGY_CHANGE_REFERENCE.pdf
"""

from __future__ import annotations

from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "playbooks" / "frontdesk" / "UI_TERMINOLOGY_CHANGE_REFERENCE.md"
OUTPUT = ROOT / "docs" / "generated" / "frontdesk" / "UI_TERMINOLOGY_CHANGE_REFERENCE.pdf"
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


def parse_reference() -> tuple[str, str, list[list[str]], list[str]]:
    lines = SOURCE.read_text(encoding="utf-8").splitlines()
    title = lines[0].removeprefix("# ").strip()
    status = next(line.removeprefix("狀態：").strip() for line in lines if line.startswith("狀態："))

    header_index = next(
        index for index, line in enumerate(lines) if line.startswith("| 範圍 | 現時畫面可能見到 |")
    )
    table_rows: list[list[str]] = []
    for line in lines[header_index:]:
        if not line.startswith("|"):
            if table_rows:
                break
            continue
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if all(set(cell) <= {"-", ":", " "} for cell in cells):
            continue
        table_rows.append(cells)

    notes_heading = lines.index("## 不會因此改變")
    notes = [
        line.removeprefix("- ").strip()
        for line in lines[notes_heading + 1 :]
        if line.startswith("- ")
    ]
    if len(table_rows) < 2:
        raise ValueError("找不到 UI 用語對照表。")
    return title, status, table_rows, notes


def build_pdf(font_path: Path) -> None:
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_LEFT
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import mm
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import KeepTogether, LongTable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    title, status, rows, notes = parse_reference()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    pdfmetrics.registerFont(TTFont("PMingLiU", str(font_path)))
    font = "PMingLiU"
    page_width, _ = landscape(A4)
    ink = colors.HexColor("#202020")
    muted = colors.HexColor("#5f5f5f")
    line = colors.HexColor("#bdbdbd")
    header = colors.HexColor("#e9ecef")
    accent = colors.HexColor("#315f66")
    alternate = colors.HexColor("#f7f7f7")

    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="ZhTitle",
            fontName=font,
            fontSize=17,
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
            leading=12,
            alignment=TA_CENTER,
            textColor=muted,
            spaceAfter=9,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhCell",
            fontName=font,
            fontSize=8.4,
            leading=11,
            alignment=TA_LEFT,
            textColor=ink,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhCellStrong",
            fontName=font,
            fontSize=8.5,
            leading=11,
            alignment=TA_LEFT,
            textColor=ink,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhNote",
            fontName=font,
            fontSize=9,
            leading=13,
            alignment=TA_LEFT,
            textColor=ink,
            leftIndent=4 * mm,
            firstLineIndent=-3 * mm,
            spaceAfter=3,
        )
    )

    def paragraph(text: str, strong: bool = False) -> Paragraph:
        return Paragraph(escape(text), styles["ZhCellStrong" if strong else "ZhCell"])

    rendered_rows = [
        [paragraph(cell, strong=row_index == 0) for cell in row]
        for row_index, row in enumerate(rows)
    ]
    table = LongTable(
        rendered_rows,
        colWidths=[28 * mm, 46 * mm, 47 * mm, 143 * mm],
        repeatRows=1,
        hAlign="CENTER",
    )
    table_style = [
        ("BACKGROUND", (0, 0), (-1, 0), header),
        ("TEXTCOLOR", (0, 0), (-1, 0), ink),
        ("GRID", (0, 0), (-1, -1), 0.45, line),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
    ]
    for row_index in range(2, len(rows), 2):
        table_style.append(("BACKGROUND", (0, row_index), (-1, row_index), alternate))
    table.setStyle(TableStyle(table_style))

    note_rows = [[Paragraph("不會因此改變", styles["ZhCellStrong"])]]
    note_rows.extend(
        [[Paragraph(f"• {escape(note)}", styles["ZhNote"])]]
        for note in notes
    )
    note_table = Table(note_rows, colWidths=[264 * mm], hAlign="CENTER")
    note_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), header),
                ("BOX", (0, 0), (-1, -1), 0.6, line),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )

    def footer(canvas, doc) -> None:
        canvas.saveState()
        canvas.setFont(font, 8)
        canvas.setFillColor(muted)
        canvas.drawString(14 * mm, 9 * mm, "明學教育｜前台用語更新對照")
        canvas.drawRightString(page_width - 14 * mm, 9 * mm, f"第 {doc.page} 頁")
        canvas.restoreState()

    document = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=landscape(A4),
        leftMargin=12 * mm,
        rightMargin=12 * mm,
        topMargin=12 * mm,
        bottomMargin=15 * mm,
        title=title,
        author="明學教育",
    )
    story = [
        Paragraph(title, styles["ZhTitle"]),
        Paragraph(f"{escape(status)}｜更新日期：2026-08-16", styles["ZhSub"]),
        table,
        Spacer(1, 7 * mm),
        KeepTogether(note_table),
    ]
    document.build(story, onFirstPage=footer, onLaterPages=footer)


def main() -> None:
    font_path = ensure_pmingliu()
    build_pdf(font_path)
    print(f"wrote {OUTPUT}")


if __name__ == "__main__":
    main()
