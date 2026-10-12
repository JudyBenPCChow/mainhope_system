#!/usr/bin/env python3
"""Generate 試堂名單 docx（直式 A4；版式以人手改過的稿為準）.

Usage:
  python3 scripts/generate_2627_trial_followup_docx.py
  python3 scripts/generate_2627_trial_followup_docx.py --data docs/generated/2627/2627_TRIAL_FOLLOWUP_2026-10.json
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from docx import Document
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATA = ROOT / "docs" / "generated" / "2627" / "2627_TRIAL_FOLLOWUP_2026-10.json"
OUTPUT = ROOT / "docs" / "generated" / "2627" / "2627_TRIAL_FOLLOWUP_2026-10.docx"

FONT_NAME = "新細明體"
INK = RGBColor(0x20, 0x20, 0x20)
MUTED = RGBColor(0x5F, 0x5F, 0x5F)
HEADER_FILL = "D9D9D9"
BODY_SIZE = 12.0


def set_run_font(run, size: float, *, bold: bool = False, color: RGBColor = INK) -> None:
    run.font.name = FONT_NAME
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    properties = run._element.get_or_add_rPr()
    fonts = properties.get_or_add_rFonts()
    for attribute in ("ascii", "hAnsi", "eastAsia"):
        fonts.set(qn(f"w:{attribute}"), FONT_NAME)
    language = OxmlElement("w:lang")
    language.set(qn("w:eastAsia"), "zh-HK")
    properties.append(language)


def shade_cell(cell, fill: str) -> None:
    properties = cell._tc.get_or_add_tcPr()
    shading = OxmlElement("w:shd")
    shading.set(qn("w:fill"), fill)
    shading.set(qn("w:val"), "clear")
    properties.append(shading)


def set_cell_width(cell, width_cm: float) -> None:
    cell.width = Cm(width_cm)
    properties = cell._tc.get_or_add_tcPr()
    width = properties.first_child_found_in("w:tcW")
    if width is None:
        width = OxmlElement("w:tcW")
        properties.append(width)
    width.set(qn("w:w"), str(int(width_cm * 567)))
    width.set(qn("w:type"), "dxa")


def prevent_row_split(row) -> None:
    properties = row._tr.get_or_add_trPr()
    properties.append(OxmlElement("w:cantSplit"))


def repeat_header(row) -> None:
    properties = row._tr.get_or_add_trPr()
    repeat = OxmlElement("w:tblHeader")
    repeat.set(qn("w:val"), "true")
    properties.append(repeat)


def write_cell(cell, text: str, *, bold: bool = False, size: float = BODY_SIZE) -> None:
    cell.text = ""
    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
    lines = str(text).split("\n") or [""]
    for i, line in enumerate(lines):
        paragraph = cell.paragraphs[0] if i == 0 else cell.add_paragraph()
        paragraph.paragraph_format.space_before = Pt(0)
        paragraph.paragraph_format.space_after = Pt(0)
        paragraph.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
        run = paragraph.add_run(line)
        set_run_font(run, size, bold=bold)


def add_paragraph(
    doc: Document,
    text: str,
    *,
    size: float = 12,
    bold: bool = False,
    center: bool = False,
    color: RGBColor = INK,
    space_after: float = 6,
) -> None:
    paragraph = doc.add_paragraph()
    paragraph.paragraph_format.space_before = Pt(0)
    paragraph.paragraph_format.space_after = Pt(space_after)
    paragraph.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
    if center:
        paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = paragraph.add_run(text)
    set_run_font(run, size, bold=bold, color=color)


def add_table(doc: Document, headers: list[str], rows: list[list[str]], widths: list[float]) -> None:
    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    header_row = table.rows[0]
    repeat_header(header_row)
    prevent_row_split(header_row)
    for j, title in enumerate(headers):
        write_cell(header_row.cells[j], title, bold=(j <= 1), size=BODY_SIZE)
        shade_cell(header_row.cells[j], HEADER_FILL)
        set_cell_width(header_row.cells[j], widths[j])

    for i, values in enumerate(rows):
        tr = table.rows[i + 1]
        prevent_row_split(tr)
        for j, value in enumerate(values):
            write_cell(tr.cells[j], value, size=BODY_SIZE)
            set_cell_width(tr.cells[j], widths[j])


def class_cell(row: dict) -> str:
    teacher = row.get("teacher") or "—"
    return f"{row.get('classLabel') or ''}\n{teacher}".strip()


def when_cell(row: dict) -> str:
    return f"{row.get('trialDate') or ''}\n{row.get('time') or ''}".strip()


def status_cell(row: dict) -> str:
    bits = [row.get("trialType") or "", row.get("payment") or "—"]
    return " · ".join(str(bit) for bit in bits if bit)


def build_docx(payload: dict, output: Path) -> None:
    as_of = str(payload.get("asOf") or "")
    period_caption = str(payload.get("periodCaption") or "")
    follow_rows = list(payload.get("followUpRows") or [])
    upcoming_rows = list(payload.get("upcomingRows") or [])
    other_followups = list(payload.get("otherFollowups") or [])
    if not other_followups and payload.get("cancelledNote"):
        other_followups = [str(payload.get("cancelledNote"))]

    # 欄寬對人手稿（dxa→cm 約 ÷567）
    widths = [0.59, 1.96, 1.28, 2.25, 4.72, 3.00, 3.00]

    doc = Document()
    section = doc.sections[0]
    section.page_width = Cm(21.0)
    section.page_height = Cm(29.7)
    section.left_margin = Cm(1.91)
    section.right_margin = Cm(1.91)
    section.top_margin = Cm(2.54)
    section.bottom_margin = Cm(2.54)

    add_paragraph(
        doc,
        "明學教育 · 試堂名單（未來試堂＋跟進轉化）",
        size=14,
        bold=True,
        center=True,
        space_after=6,
    )
    add_paragraph(
        doc,
        f"{period_caption}　｜　查庫日 {as_of}　｜",
        size=9,
        center=True,
        color=MUTED,
        space_after=10,
    )

    add_paragraph(doc, "一、待跟進轉化（已試堂、該科尚未轉正）", size=12, bold=True, space_after=4)
    add_paragraph(
        doc,
        "點名已為「現場」，系統結果仍待跟進。轉正後請在試堂頁標「已轉化」。右欄「跟進」可手寫結果或下次聯絡日。",
        size=12,
        space_after=6,
    )
    follow_table_rows = [
        [
            str(i),
            str(row.get("studentName") or ""),
            str(row.get("grade") or ""),
            str(row.get("contact") or "—"),
            class_cell(row),
            when_cell(row),
            str(row.get("actionHint") or "跟進轉正"),
        ]
        for i, row in enumerate(follow_rows, 1)
    ]
    add_table(
        doc,
        ["#", "學生", "級別", "聯絡電話", "試堂班別", "試堂日", "跟進狀態"],
        follow_table_rows,
        widths,
    )

    add_paragraph(doc, "", size=12, space_after=8)
    add_paragraph(doc, "二、未來試堂（自查庫日起）", size=12, bold=True, space_after=4)
    add_paragraph(
        doc,
        "請核對出單／上紙；試堂當日完成點名後，改入上表跟進轉化。未出單列以淺底標示。",
        size=12,
        space_after=6,
    )
    upcoming_table_rows = [
        [
            str(i),
            str(row.get("studentName") or ""),
            str(row.get("grade") or ""),
            str(row.get("contact") or "—"),
            class_cell(row),
            when_cell(row),
            status_cell(row),
        ]
        for i, row in enumerate(upcoming_rows, 1)
    ]
    add_table(
        doc,
        ["#", "學生", "級別", "聯絡電話", "試堂班別", "試堂日", "時間"],
        upcoming_table_rows,
        widths,
    )

    if other_followups:
        add_paragraph(doc, "", size=12, space_after=8)
        add_paragraph(doc, "其他跟進", size=14, space_after=4)
        for i, item in enumerate(other_followups, 1):
            add_paragraph(doc, f"{i}. {item}", size=14, space_after=2)

    output.parent.mkdir(parents=True, exist_ok=True)
    doc.save(str(output))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA)
    parser.add_argument("--output", type=Path, default=OUTPUT)
    args = parser.parse_args()
    payload = json.loads(args.data.read_text(encoding="utf-8"))
    build_docx(payload, args.output)
    print(f"Wrote {args.output}")


if __name__ == "__main__":
    main()
