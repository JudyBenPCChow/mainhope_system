#!/usr/bin/env python3
"""新報讀對比報告 PDF（直式 A4）：總數、各科圖、逐筆清單。

Usage:
  python3 scripts/generate_new_enrollment_comparison_pdf.py \
    --data docs/generated/2627/新報讀報告_2026-09-24_2026-11-01.json \
    --output docs/generated/2627/新報讀報告_2026-09-24_2026-11-01.pdf
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


def build_pdf(font_path: Path, payload: dict, output: Path) -> None:
    from reportlab.graphics.shapes import Drawing, Rect, String
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import mm
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import Flowable, KeepTogether, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    output.parent.mkdir(parents=True, exist_ok=True)
    pdfmetrics.registerFont(TTFont("PMingLiU", str(font_path)))
    font = "PMingLiU"
    ink = colors.HexColor("#202020")
    muted = colors.HexColor("#5f5f5f")
    line = colors.HexColor("#bdbdbd")
    header_bg = colors.HexColor("#d9d9d9")
    alt = colors.HexColor("#f7f7f7")
    withdrawn_bg = colors.HexColor("#f3efe6")
    new_bar = colors.HexColor("#3a3a3a")
    old_bar = colors.HexColor("#a3a3a3")

    start = payload["start_date"]
    end = payload["end_date"]
    title = str(payload.get("title") or "新報讀報告")
    subjects = payload["subjects"]
    rows = payload["rows"]
    new_total = int(payload["new_total"])
    new_active = int(payload["new_active"])
    existing_active = int(payload["existing_active"])
    people = int(payload["people"])
    trial = int(payload["trial"])
    direct = int(payload["direct"])
    withdrawn = int(payload["withdrawn"])
    current = new_active + existing_active
    share = new_active / current * 100 if current else 0

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="ZhTitle", fontName=font, fontSize=14, leading=18, alignment=TA_CENTER, textColor=ink, spaceAfter=1.5 * mm))
    styles.add(ParagraphStyle(name="ZhMeta", fontName=font, fontSize=8.5, leading=12, alignment=TA_CENTER, textColor=muted, spaceAfter=1 * mm))
    styles.add(ParagraphStyle(name="ZhSection", fontName=font, fontSize=11, leading=15, alignment=TA_LEFT, textColor=ink, spaceBefore=3.5 * mm, spaceAfter=1.5 * mm))
    styles.add(ParagraphStyle(name="ZhBody", fontName=font, fontSize=8.5, leading=12, alignment=TA_LEFT, textColor=ink, spaceAfter=1 * mm))
    styles.add(ParagraphStyle(name="ZhCell", fontName=font, fontSize=8, leading=10.5, alignment=TA_LEFT, textColor=ink))
    styles.add(ParagraphStyle(name="ZhCellCenter", fontName=font, fontSize=8, leading=10.5, alignment=TA_CENTER, textColor=ink))
    styles.add(ParagraphStyle(name="ZhCellRight", fontName=font, fontSize=8, leading=10.5, alignment=TA_RIGHT, textColor=ink))
    styles.add(ParagraphStyle(name="ZhCaption", fontName=font, fontSize=7.5, leading=10, alignment=TA_LEFT, textColor=muted, spaceBefore=0.6 * mm, spaceAfter=1 * mm))

    def p(text: str, style: str = "ZhCell") -> Paragraph:
        return Paragraph(escape(str(text)), styles[style])

    class DrawingFlowable(Flowable):
        def __init__(self, drawing: Drawing) -> None:
            super().__init__()
            self.drawing = drawing
            self.width = drawing.width
            self.height = drawing.height

        def wrap(self, aw: float, ah: float):
            return self.width, self.height

        def draw(self) -> None:
            self.drawing.drawOn(self.canv, 0, 0)

    def legend(drawing: Drawing, x: float, y: float) -> None:
        drawing.add(Rect(x, y, 3.2 * mm, 2.2 * mm, fillColor=new_bar, strokeColor=None, strokeWidth=0))
        drawing.add(String(x + 4.2 * mm, y, "新增仍就讀中", fontName=font, fontSize=8, fillColor=ink))
        drawing.add(Rect(x + 32 * mm, y, 3.2 * mm, 2.2 * mm, fillColor=old_bar, strokeColor=None, strokeWidth=0))
        drawing.add(String(x + 36.2 * mm, y, "已有就讀中", fontName=font, fontSize=8, fillColor=ink))

    def grouped_chart() -> DrawingFlowable:
        label_w = 46 * mm
        plot_w = 98 * mm
        row_h = 9.2 * mm
        top_pad = 7 * mm
        n = len(subjects)
        max_value = max(max(s["new_active"], s["existing_active"]) for s in subjects)
        width = label_w + plot_w + 16 * mm
        height = top_pad + n * row_h
        drawing = Drawing(width, height)
        legend(drawing, 0, height - 4.2 * mm)
        for i, item in enumerate(subjects):
            base = height - top_pad - (i + 1) * row_h
            drawing.add(String(0, base + 5.4 * mm, item["chart"], fontName=font, fontSize=7.5, fillColor=ink))
            for offset, value, color in (
                (5.2 * mm, item["new_active"], new_bar),
                (2.2 * mm, item["existing_active"], old_bar),
            ):
                bar_w = 0 if max_value == 0 else plot_w * value / max_value
                if bar_w > 0:
                    drawing.add(Rect(label_w, base + offset, bar_w, 2.2 * mm, fillColor=color, strokeColor=None, strokeWidth=0))
                drawing.add(String(label_w + bar_w + 1.4 * mm, base + offset, str(value), fontName=font, fontSize=7, fillColor=ink))
        return DrawingFlowable(drawing)

    def share_chart() -> DrawingFlowable:
        label_w = 46 * mm
        plot_w = 98 * mm
        row_h = 6.4 * mm
        n = len(subjects)
        width = label_w + plot_w + 18 * mm
        height = n * row_h + 2 * mm
        drawing = Drawing(width, height)
        for i, item in enumerate(subjects):
            total = item["new_active"] + item["existing_active"]
            pct = 0 if total == 0 else item["new_active"] / total * 100
            base = height - (i + 1) * row_h
            drawing.add(String(0, base + 1.6 * mm, item["chart"], fontName=font, fontSize=7.5, fillColor=ink))
            drawing.add(Rect(label_w, base + 1.3 * mm, plot_w, 2.3 * mm, fillColor=colors.HexColor("#ececec"), strokeColor=None, strokeWidth=0))
            drawing.add(Rect(label_w, base + 1.3 * mm, plot_w * pct / 100, 2.3 * mm, fillColor=new_bar, strokeColor=None, strokeWidth=0))
            drawing.add(String(label_w + plot_w + 1.6 * mm, base + 1.5 * mm, f"{pct:.1f}%", fontName=font, fontSize=7, fillColor=ink))
        return DrawingFlowable(drawing)

    def total_chart() -> DrawingFlowable:
        label_w = 32 * mm
        plot_w = 112 * mm
        width = label_w + plot_w + 18 * mm
        height = 18 * mm
        drawing = Drawing(width, height)
        legend(drawing, 0, height - 4 * mm)
        max_value = max(new_active, existing_active)
        for i, (label, value, color) in enumerate(
            (("新增", new_active, new_bar), ("已有", existing_active, old_bar))
        ):
            base = 8 * mm - i * 5.2 * mm
            drawing.add(String(0, base, label, fontName=font, fontSize=8, fillColor=ink))
            bar_w = plot_w * value / max_value
            drawing.add(Rect(label_w, base - 0.4 * mm, bar_w, 3.2 * mm, fillColor=color, strokeColor=None, strokeWidth=0))
            drawing.add(String(label_w + bar_w + 1.6 * mm, base, f"{value} 筆", fontName=font, fontSize=8, fillColor=ink))
        return DrawingFlowable(drawing)

    def grid(data_rows: int) -> TableStyle:
        cmds = [
            ("FONTNAME", (0, 0), (-1, -1), font),
            ("BACKGROUND", (0, 0), (-1, 0), header_bg),
            ("TEXTCOLOR", (0, 0), (-1, -1), ink),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("GRID", (0, 0), (-1, -1), 0.4, line),
            ("TOPPADDING", (0, 0), (-1, -1), 2),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ("LEFTPADDING", (0, 0), (-1, -1), 2),
            ("RIGHTPADDING", (0, 0), (-1, -1), 2),
        ]
        for i in range(1, data_rows + 1):
            if i % 2 == 0:
                cmds.append(("BACKGROUND", (0, i), (-1, i), alt))
        return TableStyle(cmds)

    story: list = []
    story.append(Paragraph(escape(f"明學教育 · {title}"), styles["ZhTitle"]))
    story.append(Paragraph(escape(f"{start} 至 {end}　｜　2627 專科班、功課輔導班及進行中私人課程"), styles["ZhMeta"]))
    story.append(Paragraph(escape("新增按報讀建立日計算，含舊生加科。已有就讀中是該日前已建立、目前仍就讀中的報讀。圖表新增只計仍就讀中。"), styles["ZhMeta"]))

    story.append(Paragraph(escape("一、總新增與已有就讀中"), styles["ZhSection"]))
    story.append(Paragraph(escape(f"新增報讀 {new_total} 筆（{people} 人）。其中仍就讀中 {new_active} 筆，已退讀 {withdrawn} 筆。已有就讀中 {existing_active} 筆。目前就讀中合計 {current} 筆，新增佔 {share:.1f}%（{new_active}／{current}）。試堂 {trial} 筆，直接報讀 {direct} 筆；已退讀 {withdrawn} 筆都是直接報讀。"), styles["ZhBody"]))
    story.append(Spacer(1, 1 * mm))
    story.append(total_chart())
    story.append(Paragraph(escape("橫條單位：筆。新增為仍就讀中。來源：MainHope production。"), styles["ZhCaption"]))

    story.append(Paragraph(escape("二、各科新增與已有就讀中"), styles["ZhSection"]))
    story.append(grouped_chart())
    story.append(Paragraph(escape("每科兩條：上為新增仍就讀中，下為已有就讀中。單位：筆。"), styles["ZhCaption"]))

    story.append(KeepTogether([
        Paragraph(escape("三、各科新增佔目前就讀中"), styles["ZhSection"]),
        share_chart(),
        Paragraph(escape("百分比＝該科新增仍就讀中 ÷ 該科目前就讀中。淺底為 100%。"), styles["ZhCaption"]),
    ]))

    story.append(Paragraph(escape("四、各科數字"), styles["ZhSection"]))
    head = [p(h, "ZhCellCenter") for h in ("科目", "新增仍就讀中", "已有就讀中", "目前就讀中", "新增佔比", "期間已退讀")]
    data = [head]
    sum_new = sum_old = sum_wd = 0
    for item in subjects:
        total = item["new_active"] + item["existing_active"]
        pct = "—" if total == 0 else f"{item['new_active'] / total * 100:.1f}%"
        data.append([
            p(item["subject"]),
            p(str(item["new_active"]), "ZhCellCenter"),
            p(str(item["existing_active"]), "ZhCellCenter"),
            p(str(total), "ZhCellCenter"),
            p(pct, "ZhCellCenter"),
            p(str(item["withdrawn"]), "ZhCellCenter"),
        ])
        sum_new += item["new_active"]
        sum_old += item["existing_active"]
        sum_wd += item["withdrawn"]
    data.append([
        p("合計"),
        p(str(sum_new), "ZhCellCenter"),
        p(str(sum_old), "ZhCellCenter"),
        p(str(sum_new + sum_old), "ZhCellCenter"),
        p(f"{share:.1f}%", "ZhCellCenter"),
        p(str(sum_wd), "ZhCellCenter"),
    ])
    table = Table(data, colWidths=[52 * mm, 24 * mm, 22 * mm, 22 * mm, 20 * mm, 22 * mm])
    table.setStyle(grid(len(data) - 1))
    story.append(table)

    story.append(Paragraph(escape("五、新報讀清單"), styles["ZhSection"]))
    story.append(Paragraph(escape("一筆報讀一列。註冊日期是學生檔建立日；早於 9 月 24 日的是舊生加科。私人課程兩筆都是英國語文。"), styles["ZhBody"]))
    list_head = [p(h, "ZhCellCenter") for h in ("#", "姓名", "註冊日期", "年級", "科目", "試堂或直接報讀", "狀態")]
    list_data = [list_head]
    withdrawn_indexes: list[int] = []
    for i, row in enumerate(rows, 1):
        if row["status"] == "已退讀":
            withdrawn_indexes.append(i)
        list_data.append([
            p(str(i), "ZhCellCenter"),
            p(row["name"]),
            p(row["registered_on"], "ZhCellCenter"),
            p(row["grade"], "ZhCellCenter"),
            p(row["subject"]),
            p(row["path"], "ZhCellCenter"),
            p(row["status"], "ZhCellCenter"),
        ])
    list_table = Table(
        list_data,
        colWidths=[8 * mm, 22 * mm, 24 * mm, 12 * mm, 58 * mm, 28 * mm, 16 * mm],
        repeatRows=1,
    )
    list_style = grid(len(list_data) - 1)
    for idx in withdrawn_indexes:
        list_style.add("BACKGROUND", (0, idx), (-1, idx), withdrawn_bg)
    list_table.setStyle(list_style)
    story.append(list_table)

    def footer(canvas, doc) -> None:
        canvas.saveState()
        canvas.setFont(font, 8)
        canvas.setFillColor(muted)
        canvas.drawString(14 * mm, 8 * mm, f"明學教育 · {title} · {start} 至 {end}")
        canvas.drawRightString(A4[0] - 14 * mm, 8 * mm, str(doc.page))
        canvas.restoreState()

    doc = SimpleDocTemplate(
        str(output),
        pagesize=A4,
        leftMargin=14 * mm,
        rightMargin=14 * mm,
        topMargin=12 * mm,
        bottomMargin=14 * mm,
        title=title,
        author="明學教育",
    )
    doc.build(story, onFirstPage=footer, onLaterPages=footer)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate 新報讀對比報告 PDF")
    parser.add_argument("--data", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    payload = json.loads(args.data.read_text(encoding="utf-8"))
    build_pdf(ensure_cjk_font(), payload, args.output)
    print(f"Wrote {args.output}")


if __name__ == "__main__":
    main()
