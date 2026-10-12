#!/usr/bin/env python3
"""Generate 2627 常規第二期未交學費追收 PDF.

Usage:
  python3 scripts/generate_2627_period2_tuition_chase_pdf.py
  python3 scripts/generate_2627_period2_tuition_chase_pdf.py --data docs/generated/2627/2627_PERIOD2_TUITION_CHASE.json
"""

from __future__ import annotations

import argparse
import json
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATA = ROOT / "docs" / "generated" / "2627" / "2627_PERIOD2_TUITION_CHASE.json"
OUTPUT = ROOT / "docs" / "generated" / "2627" / "2627_PERIOD2_TUITION_CHASE.pdf"
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


def money(value: float | int | None) -> str:
    if value is None:
        return "—"
    return f"{float(value):,.0f}"


def build_pdf(font_path: Path, payload: dict, output: Path) -> None:
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import mm
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import (
        KeepTogether,
        Paragraph,
        SimpleDocTemplate,
        Spacer,
        Table,
        TableStyle,
    )

    output.parent.mkdir(parents=True, exist_ok=True)
    pdfmetrics.registerFont(TTFont("PMingLiU", str(font_path)))
    font = "PMingLiU"
    ink = colors.HexColor("#202020")
    muted = colors.HexColor("#5f5f5f")
    line = colors.HexColor("#bdbdbd")
    header_bg = colors.HexColor("#e9ecef")
    accent = colors.HexColor("#315f66")
    alternate = colors.HexColor("#f7f7f7")
    soft = colors.HexColor("#f3f6f6")

    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="ZhTitle",
            fontName=font,
            fontSize=15,
            leading=20,
            alignment=TA_CENTER,
            textColor=ink,
            spaceAfter=2 * mm,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhMeta",
            fontName=font,
            fontSize=9,
            leading=13,
            alignment=TA_CENTER,
            textColor=muted,
            spaceAfter=1 * mm,
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
            spaceAfter=2 * mm,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhCell",
            fontName=font,
            fontSize=8,
            leading=11,
            alignment=TA_LEFT,
            textColor=ink,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhCellCenter",
            fontName=font,
            fontSize=8,
            leading=11,
            alignment=TA_CENTER,
            textColor=ink,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhCellRight",
            fontName=font,
            fontSize=8,
            leading=11,
            alignment=TA_RIGHT,
            textColor=ink,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhSection",
            fontName=font,
            fontSize=11,
            leading=15,
            alignment=TA_LEFT,
            textColor=accent,
            spaceBefore=3 * mm,
            spaceAfter=1.5 * mm,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhDetailHead",
            fontName=font,
            fontSize=9,
            leading=12,
            alignment=TA_LEFT,
            textColor=ink,
            spaceBefore=1.5 * mm,
            spaceAfter=0.5 * mm,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhDetailLine",
            fontName=font,
            fontSize=8,
            leading=11,
            alignment=TA_LEFT,
            textColor=ink,
            leftIndent=3 * mm,
        )
    )

    def p(text: str, style: str = "ZhCell") -> Paragraph:
        return Paragraph(escape(str(text)).replace("\n", "<br/>"), styles[style])

    as_of = str(payload.get("asOf") or "")
    period_caption = str(payload.get("periodCaption") or payload.get("periodLabel") or "")
    student_count = int(payload.get("studentCount") or 0)
    pool_count = int(payload.get("poolCount") or 0)
    total_amount = float(payload.get("totalAmount") or 0)
    total_due = float(payload.get("totalDueLessons") or 0)
    rows = list(payload.get("rows") or [])
    hw_rows = list(payload.get("homeworkRows") or [])
    hw_count = int(payload.get("homeworkStudentCount") or len(hw_rows))
    hw_total = float(payload.get("homeworkTotalAmount") or sum(float(r.get("amount") or 0) for r in hw_rows))
    combined_total = float(payload.get("combinedTotalAmount") or (total_amount + hw_total))
    combined_students = int(
        payload.get("combinedStudentCount")
        or len(
            {f"{r.get('studentCode')}{r.get('studentName')}" for r in rows}
            | {f"{r.get('studentCode')}{r.get('studentName')}" for r in hw_rows}
        )
    )

    doc = SimpleDocTemplate(
        str(output),
        pagesize=landscape(A4),
        leftMargin=10 * mm,
        rightMargin=10 * mm,
        topMargin=10 * mm,
        bottomMargin=10 * mm,
        title="未交學費名單（專科第二期＋功輔十月）",
        author="明學教育",
    )
    story: list = []
    story.append(p("明學教育 · 未交學費名單（專科第二期＋功輔十月）", "ZhTitle"))
    story.append(p(f"{period_caption}　｜　功輔按 2026年10月月費　｜　查庫日 {as_of}　｜　production", "ZhMeta"))
    story.append(
        p(
            f"合計 {combined_students} 人　｜　專科 HKD {money(total_amount)}＋功輔 HKD {money(hw_total)}"
            f"＝ HKD {money(combined_total)}　｜　專科金額尚未計入逾期罰款（每科每月最高 $50；功輔不適用）",
            "ZhMeta",
        )
    )
    story.append(
        p(
            "專科口徑與系統「學費追收」相同：本期要交＝max(0, 本期還會扣 − 尚餘可扣堂數)，含已上課未付款。"
            "功輔以繳費紀錄覆蓋月份為準（已收款且未作廢）；休學不計。",
            "ZhNote",
        )
    )

    story.append(p("一、專科 · 常規第二期總表", "ZhSection"))
    story.append(
        p(
            f"學生 {student_count} 人／{pool_count} 組別　｜　要交合共 {total_due:g} 堂　｜　學費小計 HKD {money(total_amount)}",
            "ZhNote",
        )
    )
    table_data = [
        [
            p("#", "ZhCellCenter"),
            p("學號", "ZhCellCenter"),
            p("學生", "ZhCellCenter"),
            p("年級", "ZhCellCenter"),
            p("組別", "ZhCellCenter"),
            p("要交堂數", "ZhCellCenter"),
            p("金額（HKD）", "ZhCellCenter"),
            p("科／堂／日期", "ZhCellCenter"),
        ]
    ]
    for i, row in enumerate(rows, 1):
        table_data.append(
            [
                p(str(i), "ZhCellCenter"),
                p(row.get("studentCode") or "", "ZhCell"),
                p(row.get("studentName") or "", "ZhCell"),
                p(row.get("grade") or "", "ZhCellCenter"),
                p(row.get("poolLabel") or "", "ZhCell"),
                p(f"{float(row.get('dueLessons') or 0):g}", "ZhCellCenter"),
                p(money(row.get("amount")), "ZhCellRight"),
                p(row.get("detailSummary") or "", "ZhCell"),
            ]
        )

    col_widths = [10 * mm, 22 * mm, 20 * mm, 12 * mm, 32 * mm, 16 * mm, 22 * mm, 142 * mm]
    table = Table(table_data, colWidths=col_widths, repeatRows=1)
    style_cmds = [
        ("FONTNAME", (0, 0), (-1, -1), font),
        ("BACKGROUND", (0, 0), (-1, 0), header_bg),
        ("TEXTCOLOR", (0, 0), (-1, -1), ink),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.4, line),
        ("LEFTPADDING", (0, 0), (-1, -1), 2.5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 2.5),
        ("TOPPADDING", (0, 0), (-1, -1), 2.2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.2),
    ]
    for r in range(1, len(table_data)):
        if r % 2 == 0:
            style_cmds.append(("BACKGROUND", (0, r), (-1, r), alternate))
    table.setStyle(TableStyle(style_cmds))
    story.append(table)

    story.append(Spacer(1, 3 * mm))
    story.append(p("二、專科 · 逐人明細", "ZhSection"))
    for row in rows:
        code = row.get("studentCode") or ""
        name = row.get("studentName") or ""
        grade = row.get("grade") or "—"
        pool = row.get("poolLabel") or ""
        due = float(row.get("dueLessons") or 0)
        amount = row.get("amount")
        remaining = float(row.get("remaining") or 0)
        pending = float(row.get("pending") or 0)
        arrears = float(row.get("arrears") or 0)
        head = (
            f"{code} {name}（{grade}）— {pool}　｜　尚餘 {remaining:g}　｜　"
            f"還會扣 {pending:g}　｜　要交 {due:g} 堂　｜　HKD {money(amount)}"
        )
        if arrears > 0:
            head += f"　｜　已上課未付款 {arrears:g} 堂"
        block = [p(head, "ZhDetailHead")]
        for charge in row.get("chargeLines") or []:
            kind = str(charge.get("kind") or "")
            subject = str(charge.get("subject") or "")
            date_label = str(charge.get("dateLabel") or "")
            time_label = str(charge.get("time") or "")
            units = float(charge.get("units") or 0)
            unit_price = charge.get("unitPrice")
            line_amount = charge.get("amount")
            prefix = "〔已上課未付款〕" if kind == "已上課未付款" else ""
            when = date_label if kind == "已上課未付款" else f"{date_label} {time_label}".strip()
            price_bit = ""
            if unit_price is not None:
                price_bit = f" @${float(unit_price):g} = ${money(line_amount)}"
            elif line_amount is not None:
                price_bit = f" = ${money(line_amount)}"
            block.append(p(f"• {prefix}{when} {subject} × {units:g}堂{price_bit}", "ZhDetailLine"))
        story.append(KeepTogether(block))

    if hw_rows:
        story.append(Spacer(1, 3 * mm))
        story.append(p("三、功課輔導班 · 2026年10月未繳", "ZhSection"))
        story.append(
            p(
                f"學生 {hw_count} 人　｜　月費小計 HKD {money(hw_total)}　｜　"
                "已繳以單據覆蓋月份為準；價目跟日數檔（中學部小學生跟中一價）",
                "ZhNote",
            )
        )
        hw_table_data = [
            [
                p("#", "ZhCellCenter"),
                p("學號", "ZhCellCenter"),
                p("學生", "ZhCellCenter"),
                p("年級", "ZhCellCenter"),
                p("日數檔", "ZhCellCenter"),
                p("金額（HKD）", "ZhCellCenter"),
                p("說明", "ZhCellCenter"),
            ]
        ]
        for i, row in enumerate(hw_rows, 1):
            hw_table_data.append(
                [
                    p(str(i), "ZhCellCenter"),
                    p(row.get("studentCode") or "", "ZhCell"),
                    p(row.get("studentName") or "", "ZhCell"),
                    p(row.get("grade") or "", "ZhCellCenter"),
                    p(row.get("dayPlan") or "", "ZhCellCenter"),
                    p(money(row.get("amount")), "ZhCellRight"),
                    p(
                        f"{row.get('detailSummary') or ''}；{row.get('lastPaidNote') or ''}".rstrip("；"),
                        "ZhCell",
                    ),
                ]
            )
        hw_widths = [10 * mm, 22 * mm, 22 * mm, 14 * mm, 16 * mm, 24 * mm, 168 * mm]
        hw_table = Table(hw_table_data, colWidths=hw_widths, repeatRows=1)
        hw_cmds = [
            ("FONTNAME", (0, 0), (-1, -1), font),
            ("BACKGROUND", (0, 0), (-1, 0), header_bg),
            ("TEXTCOLOR", (0, 0), (-1, -1), ink),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("GRID", (0, 0), (-1, -1), 0.4, line),
            ("LEFTPADDING", (0, 0), (-1, -1), 2.5),
            ("RIGHTPADDING", (0, 0), (-1, -1), 2.5),
            ("TOPPADDING", (0, 0), (-1, -1), 2.2),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2.2),
            ("BACKGROUND", (0, 1), (-1, -1), soft),
        ]
        for r in range(1, len(hw_table_data)):
            if r % 2 == 0:
                hw_cmds.append(("BACKGROUND", (0, r), (-1, r), alternate))
        hw_table.setStyle(TableStyle(hw_cmds))
        story.append(hw_table)

    def on_page(canvas, doc_):  # noqa: ANN001
        canvas.saveState()
        canvas.setFont(font, 8)
        canvas.setFillColor(muted)
        canvas.drawString(10 * mm, 6 * mm, "明學教育 · 學費追收 · 專科第二期＋功輔十月")
        canvas.drawRightString(
            landscape(A4)[0] - 10 * mm,
            6 * mm,
            f"第 {doc_.page} 頁",
        )
        canvas.restoreState()

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)


def main() -> None:
    parser = argparse.ArgumentParser(description="產出常規第二期未交學費 PDF")
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA, help="JSON 資料路徑")
    parser.add_argument("--output", type=Path, default=OUTPUT, help="PDF 輸出路徑")
    args = parser.parse_args()
    if not args.data.exists():
        raise SystemExit(f"找不到資料檔：{args.data}")
    payload = json.loads(args.data.read_text(encoding="utf-8"))
    font_path = ensure_pmingliu()
    build_pdf(font_path, payload, args.output)
    print(args.output)


if __name__ == "__main__":
    main()
