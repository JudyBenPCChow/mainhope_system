#!/usr/bin/env python3
"""未安排請假核對 PDF。四頁各自從標題起。

python3 .cursor/skills/leave-unarranged-check/generate_pdf.py --data <json>
"""

from __future__ import annotations

import argparse
import json
import sys
from html import escape
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    LongTable,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "scripts"))
from generate_26sm_leave_makeup_pdf import ensure_pmingliu  # noqa: E402

BUCKETS = ("leave", "unmarked", "present", "teacher")
CHECK_CHOICE = "不補回 □　　要補堂 □"
SECTIONS = (
    (
        "leave",
        "一、已點事假或病假",
        "學生請假，當日已點事假或病假。點名沒有問題。只是尚未選「不補回」，或寫了調堂、待安排而還沒有補堂日。",
        CHECK_CHOICE,
        False,
        "補課安排「空白」、學費處理「減收」，是新增請假的預設儲存結果，不等於已決定不補。",
    ),
    (
        "unmarked",
        "二、未點名",
        "學生請假，當日沒有點名。即使是事假或病假，點名紙仍應點上。同時尚未選「不補回」，或未安排補堂。",
        CHECK_CHOICE,
        False,
        "補課安排「空白」、學費處理「減收」，是新增請假的預設儲存結果，不等於已決定不補。",
    ),
    (
        "present",
        "三、已點現場",
        "已有學生請假紀錄，點名卻是現場。請核對當日是否確實出席；若沒有出席，應改回事假或病假。",
        "出席無誤 □　　應改請假 □",
        True,
        "這幾堂是點名與請假紀錄不一致，請先核對，不要直接改成不補回。",
    ),
    (
        "teacher",
        "四、老師請假、尚未補回",
        "堂已因老師或導師請假取消，尚未安排補回。堂已取消，所以沒有點名，不併入第二頁。當日已另有學生本人請假單的，不在此頁重複。",
        CHECK_CHOICE,
        False,
        "請勾選不補回，或仍要安排補堂。學費處理欄沒有學生請假單上的選項。",
    ),
)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", required=True, type=Path)
    args = parser.parse_args()
    payload = json.loads(args.data.read_text())
    year = str(payload["year"])
    as_of = str(payload["as_of"])
    rows = list(payload["rows"])
    unknown = sorted({str(row.get("bucket")) for row in rows} - set(BUCKETS))
    if unknown:
        raise SystemExit(f"未知 bucket：{', '.join(unknown)}")

    font_path = ensure_pmingliu()
    pdfmetrics.registerFont(TTFont("PMingLiU", str(font_path)))
    font = "PMingLiU"
    ink = colors.black
    muted = colors.HexColor("#555555")
    line = colors.HexColor("#888888")
    header_bg = colors.HexColor("#d9d9d9")
    alt = colors.HexColor("#f2f2f2")
    spot = colors.HexColor("#d0d0d0")

    def style(name: str, size: float, leading: float, align=TA_LEFT, color=ink, after: float = 0):
        return ParagraphStyle(
            name, fontName=font, fontSize=size, leading=leading,
            alignment=align, textColor=color, spaceAfter=after,
        )

    sec_s = style("sec", 14, 18, TA_LEFT, ink, 1)
    sub_s = style("sub", 9, 12, TA_LEFT, muted, 2)
    note_s = style("note", 9, 13, TA_LEFT, ink, 2)
    cell_s = style("cell", 8, 10.5)
    head_s = style("head", 8, 10.5, TA_CENTER)
    center_s = style("center", 8, 10.5, TA_CENTER)

    def para(text: str, st=cell_s) -> Paragraph:
        return Paragraph(escape(str(text)).replace("\n", "<br/>"), st)

    grouped = {key: [] for key in BUCKETS}
    for row in rows:
        grouped[str(row["bucket"])].append(row)
    for key in BUCKETS:
        grouped[key].sort(key=lambda row: (row["leaveDate"], row["student"], row["classCode"]))

    headers = ["請假日期", "學生姓名", "班別", "原因", "補課安排", "學費處理", "核對"]
    widths = [24 * mm, 24 * mm, 42 * mm, 32 * mm, 22 * mm, 20 * mm, 48 * mm]

    def make_table(items: list[dict], check: str, shade: bool) -> LongTable:
        body = [[para(header, head_s) for header in headers]]
        for row in items:
            reason = row["reason"] if not str(row.get("remarks") or "").strip() else f"{row['reason']}\n{row['remarks']}"
            body.append([
                para(row["leaveDate"], center_s),
                para(str(row["student"]).strip()),
                para(row["classCode"]),
                para(reason),
                para(row["makeup"], center_s),
                para(row["tuition"], center_s),
                para(check, center_s),
            ])
        table = LongTable(body, colWidths=widths, repeatRows=1)
        commands = [
            ("BACKGROUND", (0, 0), (-1, 0), header_bg),
            ("GRID", (0, 0), (-1, -1), 0.4, line),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("LEFTPADDING", (0, 0), (-1, -1), 3),
            ("RIGHTPADDING", (0, 0), (-1, -1), 3),
        ]
        background = spot if shade else alt
        for index in range(1, len(body)):
            if shade or index % 2 == 0:
                commands.append(("BACKGROUND", (0, index), (-1, index), background))
        table.setStyle(TableStyle(commands))
        return table

    story = []
    for index, (key, heading, blurb, check, shade, extra) in enumerate(SECTIONS):
        if index:
            story.append(PageBreak())
        items = grouped[key]
        story.append(para(f"{heading}（{len(items)} 堂）", sec_s))
        story.append(para(f"{year}　截至 {as_of}。", sub_s))
        story.append(para(blurb, note_s))
        story.append(para(extra, note_s))
        story.append(Spacer(1, 3 * mm))
        story.append(make_table(items, check, shade))

    output = args.data.with_suffix(".pdf")
    output.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(output),
        pagesize=landscape(A4),
        leftMargin=12 * mm,
        rightMargin=12 * mm,
        topMargin=12 * mm,
        bottomMargin=12 * mm,
        title=f"{year} 請假未安排補堂核對",
    )

    def footer(canvas, doc_) -> None:
        canvas.saveState()
        canvas.setFont(font, 8)
        canvas.drawString(12 * mm, 6 * mm, f"明學教育　{year}　請假未安排補堂核對　{as_of}")
        canvas.drawRightString(landscape(A4)[0] - 12 * mm, 6 * mm, str(doc_.page))
        canvas.restoreState()

    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(output)


if __name__ == "__main__":
    main()
