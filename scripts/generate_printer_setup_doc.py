#!/usr/bin/env python3
"""明學教育影印機使用指引（Word）。

同事讀本：docs/generated/ops/PRINTER_SETUP.docx
圖片：docs/playbooks/ops/printer-setup/images/
重出：python3 scripts/generate_printer_setup_doc.py

版面以五頁為目標，方便對着畫面操作：
1. 三台機器一覽
2. 11 號舖：電話應用程式與 Mac 驅動程式
3. 11 號舖：以 IP 加入打印機
4. 17D 舖：電話應用程式與 Mac 步驟
5. 17D 舖：清單畫面，以及桌上 MF270
"""

from __future__ import annotations

from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING, WD_TAB_ALIGNMENT
from docx.opc.constants import RELATIONSHIP_TYPE as RT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

ROOT = Path(__file__).resolve().parents[1]
IMG = ROOT / "docs" / "playbooks" / "ops" / "printer-setup" / "images"
OUT = ROOT / "docs" / "generated" / "ops" / "PRINTER_SETUP.docx"

FONT = "新細明體"
INK = RGBColor(0, 0, 0)
CONTENT_CM = 16.0  # A4 寬 21cm，左右頁邊各 2.5cm

CANON_C3150_URL = "https://hk.canon/en/support/imageFORCE%20C3150/model"


def _rpr_font(size: float, *, bold: bool = False) -> OxmlElement:
    r_pr = OxmlElement("w:rPr")
    fonts = OxmlElement("w:rFonts")
    for attr in ("ascii", "hAnsi", "eastAsia", "cs"):
        fonts.set(qn(f"w:{attr}"), FONT)
    r_pr.append(fonts)
    half = str(int(round(size * 2)))
    sz = OxmlElement("w:sz")
    sz.set(qn("w:val"), half)
    sz_cs = OxmlElement("w:szCs")
    sz_cs.set(qn("w:val"), half)
    r_pr.append(sz)
    r_pr.append(sz_cs)
    if bold:
        r_pr.append(OxmlElement("w:b"))
        r_pr.append(OxmlElement("w:bCs"))
    color = OxmlElement("w:color")
    color.set(qn("w:val"), "000000")
    r_pr.append(color)
    lang = OxmlElement("w:lang")
    lang.set(qn("w:val"), "en-US")
    lang.set(qn("w:eastAsia"), "zh-HK")
    r_pr.append(lang)
    return r_pr


def set_run_font(run, size: float, *, bold: bool = False) -> None:
    run.font.name = FONT
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = False
    run.font.color.rgb = INK
    r_pr = run._element.get_or_add_rPr()
    fonts = r_pr.find(qn("w:rFonts"))
    if fonts is None:
        fonts = OxmlElement("w:rFonts")
        r_pr.append(fonts)
    for attr in ("ascii", "hAnsi", "eastAsia", "cs"):
        fonts.set(qn(f"w:{attr}"), FONT)
    lang = r_pr.find(qn("w:lang"))
    if lang is None:
        lang = OxmlElement("w:lang")
        r_pr.append(lang)
    lang.set(qn("w:val"), "en-US")
    lang.set(qn("w:eastAsia"), "zh-HK")


def no_snap(paragraph) -> None:
    p_pr = paragraph._p.get_or_add_pPr()
    snap = p_pr.find(qn("w:snapToGrid"))
    if snap is None:
        snap = OxmlElement("w:snapToGrid")
        p_pr.append(snap)
    snap.set(qn("w:val"), "0")


def style_paragraph(
    paragraph,
    *,
    before: float = 0,
    after: float = 6,
    line: float = 1.15,
    align=None,
    keep_with_next: bool = False,
    page_break_before: bool = False,
    left: float | None = None,
    first: float | None = None,
) -> None:
    fmt = paragraph.paragraph_format
    fmt.space_before = Pt(before)
    fmt.space_after = Pt(after)
    fmt.line_spacing = line
    fmt.line_spacing_rule = WD_LINE_SPACING.MULTIPLE
    fmt.keep_together = True
    fmt.keep_with_next = keep_with_next
    fmt.page_break_before = page_break_before
    if left is not None:
        fmt.left_indent = Cm(left)
    if first is not None:
        fmt.first_line_indent = Cm(first)
    if align is not None:
        paragraph.alignment = align
    no_snap(paragraph)


def add_text(paragraph, text: str, size: float, *, bold: bool = False) -> None:
    run = paragraph.add_run(text)
    set_run_font(run, size, bold=bold)


def add_bottom_rule(paragraph, *, size_eighths: int = 12, color: str = "000000") -> None:
    p_pr = paragraph._p.get_or_add_pPr()
    for child in list(p_pr):
        if child.tag == qn("w:pBdr"):
            p_pr.remove(child)
    border = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), str(size_eighths))
    bottom.set(qn("w:space"), "1")
    bottom.set(qn("w:color"), color)
    border.append(bottom)
    p_pr.append(border)


def add_hyperlink(paragraph, text: str, url: str, size: float = 10.5) -> None:
    r_id = paragraph.part.relate_to(url, RT.HYPERLINK, is_external=True)
    hyperlink = OxmlElement("w:hyperlink")
    hyperlink.set(qn("r:id"), r_id)
    run = OxmlElement("w:r")
    r_pr = _rpr_font(size)
    underline = OxmlElement("w:u")
    underline.set(qn("w:val"), "single")
    r_pr.append(underline)
    run.append(r_pr)
    text_elm = OxmlElement("w:t")
    text_elm.set(qn("xml:space"), "preserve")
    text_elm.text = text
    run.append(text_elm)
    hyperlink.append(run)
    paragraph._p.append(hyperlink)


def shade_cell(cell, fill: str) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    for child in list(tc_pr):
        if child.tag == qn("w:shd"):
            tc_pr.remove(child)
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), fill)
    tc_pr.append(shd)


def set_cell_borders(cell, *, sz: int = 4, color: str = "000000") -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    for child in list(tc_pr):
        if child.tag == qn("w:tcBorders"):
            tc_pr.remove(child)
    borders = OxmlElement("w:tcBorders")
    for edge in ("top", "left", "bottom", "right"):
        element = OxmlElement(f"w:{edge}")
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), str(sz))
        element.set(qn("w:space"), "0")
        element.set(qn("w:color"), color)
        borders.append(element)
    tc_pr.append(borders)


def set_cell_margins(cell, *, top=60, bottom=60, left=80, right=80) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    for child in list(tc_pr):
        if child.tag == qn("w:tcMar"):
            tc_pr.remove(child)
    margins = OxmlElement("w:tcMar")
    for tag, value in (("top", top), ("left", left), ("bottom", bottom), ("right", right)):
        node = OxmlElement(f"w:{tag}")
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")
        margins.append(node)
    tc_pr.append(margins)


def valign_center(cell) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    align = tc_pr.find(qn("w:vAlign"))
    if align is None:
        align = OxmlElement("w:vAlign")
        tc_pr.append(align)
    align.set(qn("w:val"), "center")


def prevent_row_split(row) -> None:
    tr_pr = row._tr.get_or_add_trPr()
    if tr_pr.find(qn("w:cantSplit")) is None:
        tr_pr.append(OxmlElement("w:cantSplit"))


def set_table_geometry(table, widths_cm: list[float], *, center: bool = False) -> None:
    table.autofit = False
    table.allow_autofit = False
    total = sum(widths_cm)
    tbl = table._tbl
    tbl_pr = tbl.tblPr
    tbl_w = tbl_pr.find(qn("w:tblW"))
    if tbl_w is None:
        tbl_w = OxmlElement("w:tblW")
        tbl_pr.append(tbl_w)
    tbl_w.set(qn("w:w"), str(int(round(total * 567))))
    tbl_w.set(qn("w:type"), "dxa")
    layout = tbl_pr.find(qn("w:tblLayout"))
    if layout is None:
        layout = OxmlElement("w:tblLayout")
        tbl_pr.append(layout)
    layout.set(qn("w:type"), "fixed")
    look = tbl_pr.find(qn("w:tblLook"))
    if look is None:
        look = OxmlElement("w:tblLook")
        tbl_pr.append(look)
    look.set(qn("w:firstRow"), "1")
    look.set(qn("w:lastRow"), "0")
    look.set(qn("w:firstColumn"), "0")
    look.set(qn("w:lastColumn"), "0")
    look.set(qn("w:noHBand"), "1")
    look.set(qn("w:noVBand"), "1")
    look.set(qn("w:val"), "0400")
    jc = tbl_pr.find(qn("w:jc"))
    if center:
        if jc is None:
            jc = OxmlElement("w:jc")
            tbl_pr.append(jc)
        jc.set(qn("w:val"), "center")
    elif jc is not None:
        tbl_pr.remove(jc)

    grid = tbl.find(qn("w:tblGrid"))
    if grid is not None:
        tbl.remove(grid)
    grid = OxmlElement("w:tblGrid")
    for width in widths_cm:
        col = OxmlElement("w:gridCol")
        col.set(qn("w:w"), str(int(round(width * 567))))
        grid.append(col)
    tbl_pr.addnext(grid)

    for row in table.rows:
        prevent_row_split(row)
        for index, cell in enumerate(row.cells):
            tc_pr = cell._tc.get_or_add_tcPr()
            tc_w = tc_pr.find(qn("w:tcW"))
            if tc_w is None:
                tc_w = OxmlElement("w:tcW")
                tc_pr.append(tc_w)
            tc_w.set(qn("w:w"), str(int(round(widths_cm[index] * 567))))
            tc_w.set(qn("w:type"), "dxa")


def cell_paragraph(cell, text: str, *, size: float = 10.5, bold: bool = False, after: float = 0) -> None:
    paragraph = cell.paragraphs[0]
    paragraph.clear()
    style_paragraph(paragraph, before=0, after=after, line=1.08)
    parts = text.split("\n")
    for index, part in enumerate(parts):
        add_text(paragraph, part, size, bold=bold)
        if index < len(parts) - 1:
            paragraph.add_run().add_break()


def add_spacer(document: Document, after: float = 8) -> None:
    paragraph = document.add_paragraph()
    style_paragraph(paragraph, before=0, after=after, line=1.0)
    p_pr = paragraph._p.get_or_add_pPr()
    spacing = p_pr.find(qn("w:spacing"))
    if spacing is None:
        spacing = OxmlElement("w:spacing")
        p_pr.append(spacing)
    spacing.set(qn("w:before"), "0")
    spacing.set(qn("w:after"), str(int(round(after * 20))))
    spacing.set(qn("w:line"), "20")
    spacing.set(qn("w:lineRule"), "exact")


def add_body(document: Document, text: str, *, size: float = 11, bold: bool = False, after: float = 6, before: float = 0, keep_with_next: bool = False) -> None:
    paragraph = document.add_paragraph()
    style_paragraph(paragraph, before=before, after=after, keep_with_next=keep_with_next)
    add_text(paragraph, text, size, bold=bold)


def add_heading(document: Document, text: str, *, level: int, page_break: bool = False) -> None:
    size = 14 if level == 1 else 12
    paragraph = document.add_paragraph(text, style="Heading 1" if level == 1 else "Heading 2")
    style_paragraph(
        paragraph,
        before=0 if level == 1 else 10,
        after=6 if level == 1 else 4,
        line=1.05,
        keep_with_next=True,
        page_break_before=page_break,
    )
    for run in paragraph.runs:
        set_run_font(run, size, bold=True)
    if level == 1:
        add_bottom_rule(paragraph, size_eighths=12)


def add_steps(document: Document, lines: list[str]) -> None:
    for index, line in enumerate(lines, start=1):
        paragraph = document.add_paragraph()
        style_paragraph(
            paragraph,
            before=1,
            after=2,
            line=1.12,
            left=0.75,
            first=-0.75,
            keep_with_next=(index == len(lines)),
        )
        add_text(paragraph, f"{index}.　", 11, bold=True)
        add_text(paragraph, line, 11)


def add_rules_box(document: Document, title: str, lines: list[str]) -> None:
    table = document.add_table(rows=1, cols=1)
    set_table_geometry(table, [CONTENT_CM])
    cell = table.cell(0, 0)
    shade_cell(cell, "F2F2F2")
    set_cell_borders(cell, sz=8)
    set_cell_margins(cell, top=80, bottom=80, left=120, right=120)
    cell_paragraph(cell, title, size=11, bold=True, after=2)
    for index, line in enumerate(lines):
        paragraph = cell.add_paragraph()
        style_paragraph(
            paragraph,
            before=1,
            after=1 if index < len(lines) - 1 else 0,
            line=1.12,
            left=0.55,
            first=-0.55,
        )
        add_text(paragraph, f"{index + 1}.　", 10.5, bold=True)
        add_text(paragraph, line, 10.5)
    add_spacer(document, 8)


def add_kv_table(document: Document, rows: list[tuple[str, str]]) -> None:
    table = document.add_table(rows=len(rows), cols=2)
    set_table_geometry(table, [3.5, CONTENT_CM - 3.5])
    for index, (label, value) in enumerate(rows):
        label_cell = table.cell(index, 0)
        value_cell = table.cell(index, 1)
        shade_cell(label_cell, "EFEFEF")
        shade_cell(value_cell, "FFFFFF")
        set_cell_borders(label_cell, sz=4)
        set_cell_borders(value_cell, sz=4)
        set_cell_margins(label_cell, top=40, bottom=40, left=80, right=80)
        set_cell_margins(value_cell, top=40, bottom=40, left=80, right=80)
        valign_center(label_cell)
        valign_center(value_cell)
        cell_paragraph(label_cell, label, size=10.5)
        cell_paragraph(value_cell, value, size=10.5, bold=True)
    add_spacer(document, 6)


def add_data_table(document: Document, header: list[str], rows: list[list[str]], widths: list[float]) -> None:
    table = document.add_table(rows=1 + len(rows), cols=len(header))
    set_table_geometry(table, widths)
    for col, text in enumerate(header):
        cell = table.cell(0, col)
        shade_cell(cell, "E6E6E6")
        set_cell_borders(cell, sz=4)
        set_cell_margins(cell, top=50, bottom=50, left=70, right=70)
        valign_center(cell)
        cell_paragraph(cell, text, size=10.5, bold=True)
    tr_pr = table.rows[0]._tr.get_or_add_trPr()
    if tr_pr.find(qn("w:tblHeader")) is None:
        tr_pr.append(OxmlElement("w:tblHeader"))
    for r_index, row in enumerate(rows, start=1):
        for c_index, text in enumerate(row):
            cell = table.cell(r_index, c_index)
            shade_cell(cell, "FFFFFF")
            set_cell_borders(cell, sz=4)
            set_cell_margins(cell, top=50, bottom=50, left=70, right=70)
            valign_center(cell)
            cell_paragraph(cell, text, size=10.5, bold=(c_index == 0))
    add_spacer(document, 6)


def add_figure(document: Document, filename: str, width_cm: float, caption: str) -> None:
    frame = min(CONTENT_CM, width_cm + 0.3)
    image_width = min(width_cm, frame - 0.24)
    table = document.add_table(rows=1, cols=1)
    set_table_geometry(table, [frame], center=True)
    cell = table.cell(0, 0)
    shade_cell(cell, "FFFFFF")
    set_cell_borders(cell, sz=4, color="BFBFBF")
    set_cell_margins(cell, top=60, bottom=40, left=60, right=60)
    picture = cell.paragraphs[0]
    style_paragraph(picture, before=0, after=2, line=1.0, align=WD_ALIGN_PARAGRAPH.CENTER)
    run = picture.add_run()
    run.add_picture(str(IMG / filename), width=Cm(image_width))
    cap = cell.add_paragraph()
    style_paragraph(cap, before=1, after=0, line=1.05, align=WD_ALIGN_PARAGRAPH.CENTER)
    add_text(cap, caption, 9)
    add_spacer(document, 8)


def add_page_field(paragraph) -> None:
    run = paragraph.add_run()
    element = run._r
    begin = OxmlElement("w:fldChar")
    begin.set(qn("w:fldCharType"), "begin")
    instruction = OxmlElement("w:instrText")
    instruction.set(qn("xml:space"), "preserve")
    instruction.text = " PAGE "
    separate = OxmlElement("w:fldChar")
    separate.set(qn("w:fldCharType"), "separate")
    text = OxmlElement("w:t")
    text.text = "1"
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    element.extend([begin, instruction, separate, text, end])
    set_run_font(run, 10)


def add_style_ref(paragraph) -> None:
    run = paragraph.add_run()
    element = run._r
    begin = OxmlElement("w:fldChar")
    begin.set(qn("w:fldCharType"), "begin")
    instruction = OxmlElement("w:instrText")
    instruction.set(qn("xml:space"), "preserve")
    instruction.text = ' STYLEREF "Heading 1" '
    separate = OxmlElement("w:fldChar")
    separate.set(qn("w:fldCharType"), "separate")
    text = OxmlElement("w:t")
    text.text = "影印機使用指引"
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    element.extend([begin, instruction, separate, text, end])
    set_run_font(run, 9)


def configure_header_footer(document: Document) -> None:
    section = document.sections[0]
    section.different_first_page_header_footer = True
    section.header_distance = Cm(0.55)
    section.footer_distance = Cm(0.45)

    def finish_header(paragraph) -> None:
        paragraph.clear()
        style_paragraph(paragraph, before=0, after=2, line=1.0)
        paragraph.paragraph_format.tab_stops.add_tab_stop(Cm(CONTENT_CM), WD_TAB_ALIGNMENT.RIGHT)
        add_text(paragraph, "明學教育", 9)
        add_text(paragraph, "\t", 9)
        add_style_ref(paragraph)
        add_bottom_rule(paragraph, size_eighths=6)

    first = section.first_page_header.paragraphs[0]
    first.clear()
    style_paragraph(first, before=0, after=2, line=1.0)
    first.paragraph_format.tab_stops.add_tab_stop(Cm(CONTENT_CM), WD_TAB_ALIGNMENT.RIGHT)
    add_text(first, "明學教育", 9)
    add_text(first, "\t2026年11月", 9)
    add_bottom_rule(first, size_eighths=6)

    finish_header(section.header.paragraphs[0])

    def finish_footer(paragraph) -> None:
        paragraph.clear()
        style_paragraph(paragraph, before=0, after=0, line=1.0, align=WD_ALIGN_PARAGRAPH.CENTER)
        add_text(paragraph, "— ", 10)
        add_page_field(paragraph)
        add_text(paragraph, " —", 10)

    finish_footer(section.first_page_footer.paragraphs[0])
    finish_footer(section.footer.paragraphs[0])
    section.footer.is_linked_to_previous = False
    section.first_page_footer.is_linked_to_previous = False
    section.header.is_linked_to_previous = False
    section.first_page_header.is_linked_to_previous = False


def configure_document(document: Document) -> None:
    section = document.sections[0]
    section.page_width = Cm(21.0)
    section.page_height = Cm(29.7)
    section.top_margin = Cm(1.7)
    section.bottom_margin = Cm(1.55)
    section.left_margin = Cm(2.5)
    section.right_margin = Cm(2.5)
    section.gutter = Cm(0)

    styles = document.styles
    for name, size, bold in (("Normal", 11, False), ("Heading 1", 14, True), ("Heading 2", 12, True)):
        style = styles[name]
        style.font.name = FONT
        style.font.size = Pt(size)
        style.font.bold = bold
        style.font.color.rgb = INK
        style.font.italic = False
        r_pr = style.element.get_or_add_rPr()
        fonts = r_pr.find(qn("w:rFonts"))
        if fonts is None:
            fonts = OxmlElement("w:rFonts")
            r_pr.append(fonts)
        for attr in ("ascii", "hAnsi", "eastAsia", "cs"):
            fonts.set(qn(f"w:{attr}"), FONT)

    styles_elm = styles.element
    doc_defaults = styles_elm.find(qn("w:docDefaults"))
    if doc_defaults is not None:
        r_pr_default = doc_defaults.find(qn("w:rPrDefault"))
        if r_pr_default is not None:
            r_pr = r_pr_default.find(qn("w:rPr"))
            if r_pr is None:
                r_pr = OxmlElement("w:rPr")
                r_pr_default.append(r_pr)
            fonts = r_pr.find(qn("w:rFonts"))
            if fonts is None:
                fonts = OxmlElement("w:rFonts")
                r_pr.append(fonts)
            for attr in ("ascii", "hAnsi", "eastAsia", "cs"):
                fonts.set(qn(f"w:{attr}"), FONT)

    configure_header_footer(document)


def build() -> Document:
    document = Document()
    configure_document(document)
    document.core_properties.title = "明學教育影印機使用指引"
    document.core_properties.subject = "11 號舖 imageFORCE C3150、17D 舖 IR-ADV C5850、17D 舖 MF270"
    document.core_properties.author = "明學教育"
    document.core_properties.category = "校舍設備"
    document.core_properties.language = "zh-HK"

    title = document.add_paragraph()
    style_paragraph(title, before=2, after=0, line=1.0, align=WD_ALIGN_PARAGRAPH.CENTER)
    add_text(title, "明學教育", 12, bold=True)

    main = document.add_paragraph()
    style_paragraph(main, before=2, after=2, line=1.0, align=WD_ALIGN_PARAGRAPH.CENTER)
    add_text(main, "影印機使用指引", 20, bold=True)

    sub = document.add_paragraph()
    style_paragraph(sub, before=0, after=2, line=1.05, align=WD_ALIGN_PARAGRAPH.CENTER)
    add_text(sub, "11 號舖 imageFORCE C3150　　17D 舖 IR-ADV C5850　　17D 舖 MF270", 10.5)
    add_bottom_rule(sub, size_eighths=12)
    add_spacer(document, 8)

    add_rules_box(
        document,
        "請先看",
        [
            "先對照下表確認機種，再按該機的頁面操作。圖為設定畫面，可對照填寫。",
            "打印前請核對黑白或彩色。並無特別需要時使用黑白。彩色打印須先向前台請示。",
            "11 號舖及 17D 坐地機的部門 ID、識別碼與以往相同。",
            "11 號舖新機請使用 Canon PRINT，並安裝本指引的 Mac 驅動程式。舊有的 Canon PRINT\u00a0Business 與舊電腦驅動程式已不適用。",
        ],
    )

    add_data_table(
        document,
        ["位置", "機種", "手提電話／iPad", "MacBook"],
        [
            ["11 號舖", "imageFORCE C3150", "Canon PRINT", "先裝 PS 驅動程式，\n再以 IP 加入"],
            ["17D 舖", "IR-ADV C5850（坐地）", "Canon PRINT\u00a0Business", "無須另裝，選 UFR II"],
            ["17D 舖", "MF270（桌上）", "與 17E 打印機相同", "只可黑白雙面"],
        ],
        [2.4, 4.6, 4.6, 4.4],
    )
    add_body(document, "各頁內容", size=12, bold=True, before=4, after=4, keep_with_next=True)
    add_data_table(
        document,
        ["頁", "內容"],
        [
            ["第 2 頁", "11 號舖：下載 Canon PRINT，以及 Mac 驅動程式"],
            ["第 3 頁", "11 號舖：在 MacBook 以 IP 加入打印機"],
            ["第 4 頁", "17D 坐地機：下載 Canon PRINT Business，以及 Mac 步驟"],
            ["第 5 頁", "17D：對照清單加入 C5850，以及桌上 MF270"],
        ],
        [2.3, 13.7],
    )

    # —— 11 號舖：下載 ——
    add_heading(document, "11 號舖　imageFORCE C3150", level=1, page_break=True)
    add_kv_table(
        document,
        [
            ("應用程式", "Canon PRINT"),
            ("應用程式內搜尋", "Image Force C3150"),
            ("Mac 驅動程式", "PS Printer Driver & Utilities for Mac V4.17.25"),
            ("適用系統", "macOS 11.7.11 至 macOS 27.0.1"),
            ("IP 位址", "192.168.50.198"),
            ("顯示名稱", "Main Hope Education Shop11"),
            ("部門 ID、識別碼", "與以往相同"),
        ],
    )

    add_heading(document, "手提電話／iPad", level=2)
    add_steps(
        document,
        [
            "在 App Store 或 Google Play 下載 Canon PRINT（開發商 Canon Inc.）。商店頁會註明應用程式名稱已變更。",
            "開啟後按左上角自動搜尋，型號選 Image Force C3150。",
            "部門 ID 及識別碼與以往相同。",
            "打印前核對黑白或彩色。並無特別需要時使用黑白。彩色打印須先向前台請示。",
        ],
    )
    add_figure(document, "canon-print.png", 11.2, "圖 1　App Store 的 Canon PRINT")

    add_heading(document, "下載 Mac 驅動程式", level=2)
    add_steps(
        document,
        [
            "開啟下方 Canon 支援頁，進入 Drivers／Software／Firmware。",
            "下載並安裝 PS Printer Driver & Utilities for Mac V4.17.25。檔案約 49.60 MB，2026 年 10 月 22 日更新。",
        ],
    )
    link = document.add_paragraph()
    style_paragraph(link, before=1, after=4, left=0.75, keep_with_next=True)
    add_hyperlink(link, CANON_C3150_URL, CANON_C3150_URL, 10)
    add_figure(document, "c3150-ps-driver.png", 15.5, "圖 2　請下載這一列 Mac 驅動程式")

    # —— 11 號舖：加入 ——
    add_heading(document, "在 MacBook 加入這台打印機", level=2, page_break=True)
    add_body(
        document,
        "「系統設定」→「打印與掃描器」→ 加入。",
        size=11,
        after=2,
        keep_with_next=True,
    )
    add_steps(
        document,
        [
            "在「新增打印機」按上方中間的地球圖示。",
            "照下表填寫。佇列留空。",
            "「使用」點「選擇軟件…」，搜尋 C3150，選剛安裝的 PS 驅動程式。",
        ],
    )
    add_data_table(
        document,
        ["欄位", "請填"],
        [
            ["位址", "192.168.50.198"],
            ["通訊協定", "行列式打印機服務程式 - LPD"],
            ["佇列", "留空"],
            ["名稱", "Main Hope Education Shop11"],
            ["使用", "選擇軟件…，搜尋 C3150，選 PS 驅動程式"],
        ],
        [3.2, 12.8],
    )
    add_figure(document, "shop11-add-printer.png", 14.4, "圖 3　11 號舖「新增打印機」。位址、名稱照上表。")
    add_body(
        document,
        "圖中「通用 PostScript 打印機」是選單目前的勾選。請改點「選擇軟件…」，搜尋 C3150，再選已安裝的 PS 驅動程式。",
        size=10.5,
        after=0,
    )

    # —— 17D：步驟 ——
    add_heading(document, "17D 舖　IR-ADV C5850 與 MF270", level=1, page_break=True)
    add_body(document, "坐地機 IR-ADV C5850", size=12, bold=True, after=4, keep_with_next=True)
    add_kv_table(
        document,
        [
            ("應用程式", "Canon PRINT Business"),
            ("應用程式內搜尋", "IR-ADV C5850"),
            ("Mac 驅動程式", "Canon iR-ADV C5840/5850 UFR II"),
            ("驅動程式來源", "與原有 C5840 相同，無須另行下載"),
            ("部門 ID、識別碼", "與以往相同"),
        ],
    )
    add_heading(document, "手提電話／iPad", level=2)
    add_steps(
        document,
        [
            "在 App Store 或 Google Play 下載 Canon PRINT Business。商店分類為「商業」。",
            "開啟後按左上角自動搜尋，型號選 IR-ADV C5850。",
            "部門 ID 及識別碼與以往相同。",
            "打印前核對黑白或彩色。並無特別需要時使用黑白。彩色打印須先向前台請示。",
        ],
    )
    add_figure(document, "canon-print-business.png", 12.6, "圖 4　App Store 的 Canon PRINT Business")

    add_heading(document, "MacBook", level=2)
    add_body(
        document,
        "此型號與明學原有的 C5840 使用同一驅動程式，無須另行下載。",
        size=11,
        after=4,
        keep_with_next=True,
    )
    add_steps(
        document,
        [
            "開啟「系統設定」→「打印與掃描器」，按加入。留在上方第一個印表機圖示的清單。",
            "搜尋並選擇 C5850。清單若顯示 Canon iR-ADV C5840，選該列亦可。",
            "「使用」選擇 Canon iR-ADV C5840/5850 UFR II。",
            "名稱填 17D 這台新機的名稱，按「加入」。",
        ],
    )

    # —— 17D：畫面與 MF270 ——
    add_heading(document, "對照清單加入", level=2, page_break=True)
    add_body(
        document,
        "下圖第一列是 17E 現有機 Canon iR-ADV C5840，名稱為 Main Hope Education 17E。",
        size=11,
        after=2,
        keep_with_next=True,
    )
    add_body(
        document,
        "17D 坐地新機的驅動程式同樣是 Canon iR-ADV C5840/5850 UFR II。",
        size=11,
        after=1,
        keep_with_next=True,
    )
    add_body(
        document,
        "名稱填這台 17D 新機的名稱。",
        size=11,
        after=4,
        keep_with_next=True,
    )
    add_figure(
        document,
        "c5840-mf270-add-printer.png",
        13.0,
        "圖 5　清單第一列 C5840（17E），第二列 MF270。驅動程式為 C5840/5850 UFR II。",
    )

    add_heading(document, "桌上機 MF270", level=2)
    add_kv_table(
        document,
        [
            ("功能", "只可黑白、雙面打印"),
            ("清單名稱", "Canon MF270 Series"),
            ("加入方式", "與 17E 打印機相同"),
        ],
    )
    add_body(
        document,
        "在「新增打印機」清單選 Canon MF270 Series（見圖 5 第二列），按「加入」。手提電話、iPad 及手提電腦都沿用 17E 打印機的步驟。",
        size=11,
        after=0,
    )
    return document


def main() -> None:
    missing = [name for name in (
        "canon-print.png",
        "c3150-ps-driver.png",
        "shop11-add-printer.png",
        "canon-print-business.png",
        "c5840-mf270-add-printer.png",
    ) if not (IMG / name).is_file()]
    if missing:
        raise SystemExit(f"缺少圖片：{', '.join(missing)}")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    document = build()
    document.save(OUT)
    print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
