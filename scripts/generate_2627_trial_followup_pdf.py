#!/usr/bin/env python3
"""Generate 試堂名單 PDF（直式 A4；版式對齊人手改過的 Word 稿）.

Usage:
  python3 scripts/generate_2627_trial_followup_pdf.py
  python3 scripts/generate_2627_trial_followup_pdf.py --data docs/generated/2627/2627_TRIAL_FOLLOWUP_2026-10.json
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

DEFAULT_DATA = ROOT / "docs" / "generated" / "2627" / "2627_TRIAL_FOLLOWUP_2026-10.json"
OUTPUT = ROOT / "docs" / "generated" / "2627" / "2627_TRIAL_FOLLOWUP_2026-10.pdf"


def ensure_pmingliu() -> Path:
    return ensure_cjk_font()


def class_cell(row: dict) -> str:
    teacher = row.get("teacher") or "—"
    return f"{row.get('classLabel') or ''}\n{teacher}".strip()


def when_cell(row: dict) -> str:
    return f"{row.get('trialDate') or ''}\n{row.get('time') or ''}".strip()


def status_cell(row: dict) -> str:
    bits = [row.get("trialType") or "", row.get("payment") or "—"]
    return " · ".join(str(bit) for bit in bits if bit)


def build_pdf(font_path: Path, payload: dict, output: Path) -> None:
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_LEFT
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import mm
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    output.parent.mkdir(parents=True, exist_ok=True)
    pdfmetrics.registerFont(TTFont("PMingLiU", str(font_path)))
    font = "PMingLiU"
    ink = colors.HexColor("#202020")
    muted = colors.HexColor("#5f5f5f")
    line = colors.HexColor("#bdbdbd")
    header_bg = colors.HexColor("#d9d9d9")

    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="ZhTitle",
            fontName=font,
            fontSize=14,
            leading=18,
            alignment=TA_CENTER,
            textColor=ink,
            spaceAfter=3 * mm,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhMeta",
            fontName=font,
            fontSize=9,
            leading=12,
            alignment=TA_CENTER,
            textColor=muted,
            spaceAfter=4 * mm,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhSection",
            fontName=font,
            fontSize=12,
            leading=16,
            alignment=TA_LEFT,
            textColor=ink,
            spaceBefore=2 * mm,
            spaceAfter=1.5 * mm,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhNote",
            fontName=font,
            fontSize=12,
            leading=16,
            alignment=TA_LEFT,
            textColor=ink,
            spaceAfter=2 * mm,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhCell",
            fontName=font,
            fontSize=11,
            leading=14,
            alignment=TA_LEFT,
            textColor=ink,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhOtherHead",
            fontName=font,
            fontSize=14,
            leading=18,
            alignment=TA_LEFT,
            textColor=ink,
            spaceBefore=3 * mm,
            spaceAfter=2 * mm,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhOtherItem",
            fontName=font,
            fontSize=14,
            leading=18,
            alignment=TA_LEFT,
            textColor=ink,
            spaceAfter=1 * mm,
        )
    )

    def p(text: str, style: str = "ZhCell") -> Paragraph:
        return Paragraph(escape(str(text)).replace("\n", "<br/>"), styles[style])

    as_of = str(payload.get("asOf") or "")
    period_caption = str(payload.get("periodCaption") or "")
    follow_rows = list(payload.get("followUpRows") or [])
    upcoming_rows = list(payload.get("upcomingRows") or [])
    other_followups = list(payload.get("otherFollowups") or [])
    if not other_followups and payload.get("cancelledNote"):
        other_followups = [str(payload.get("cancelledNote"))]

    # 對齊 Word：左右 1.91cm、上下 2.54cm
    doc = SimpleDocTemplate(
        str(output),
        pagesize=A4,
        leftMargin=19.1 * mm,
        rightMargin=19.1 * mm,
        topMargin=25.4 * mm,
        bottomMargin=25.4 * mm,
        title="試堂名單（跟進轉化）",
        author="明學教育",
    )
    story: list = []
    story.append(p("明學教育 · 試堂名單（未來試堂＋跟進轉化）", "ZhTitle"))
    story.append(p(f"{period_caption}　｜　查庫日 {as_of}　｜", "ZhMeta"))

    # 可用寬 ≈ 171.8mm
    col_widths = [9 * mm, 20 * mm, 13 * mm, 23 * mm, 42 * mm, 32 * mm, 32.8 * mm]

    def section_table(headers: list[str], rows: list[list[str]]) -> None:
        data = [[p(h) for h in headers]]
        for values in rows:
            data.append([p(v) for v in values])
        table = Table(data, colWidths=col_widths, repeatRows=1)
        style_cmds = [
            ("FONTNAME", (0, 0), (-1, -1), font),
            ("BACKGROUND", (0, 0), (-1, 0), header_bg),
            ("TEXTCOLOR", (0, 0), (-1, -1), ink),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("GRID", (0, 0), (-1, -1), 0.5, line),
            ("LEFTPADDING", (0, 0), (-1, -1), 3),
            ("RIGHTPADDING", (0, 0), (-1, -1), 3),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]
        table.setStyle(TableStyle(style_cmds))
        story.append(table)

    story.append(p("一、待跟進轉化（已試堂、該科尚未轉正）", "ZhSection"))
    story.append(
        p(
            "點名已為「現場」，系統結果仍待跟進。轉正後請在試堂頁標「已轉化」。右欄「跟進」可手寫結果或下次聯絡日。",
            "ZhNote",
        )
    )
    section_table(
        ["#", "學生", "級別", "聯絡電話", "試堂班別", "試堂日", "跟進狀態"],
        [
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
        ],
    )

    story.append(Spacer(1, 4 * mm))
    story.append(p("二、未來試堂（自查庫日起）", "ZhSection"))
    story.append(
        p(
            "請核對出單／上紙；試堂當日完成點名後，改入上表跟進轉化。未出單列以淺底標示。",
            "ZhNote",
        )
    )
    section_table(
        ["#", "學生", "級別", "聯絡電話", "試堂班別", "試堂日", "時間"],
        [
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
        ],
    )

    if other_followups:
        story.append(Spacer(1, 4 * mm))
        story.append(p("其他跟進", "ZhOtherHead"))
        for i, item in enumerate(other_followups, 1):
            story.append(p(f"{i}. {item}", "ZhOtherItem"))

    doc.build(story)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA)
    parser.add_argument("--output", type=Path, default=OUTPUT)
    args = parser.parse_args()
    payload = json.loads(args.data.read_text(encoding="utf-8"))
    font_path = ensure_pmingliu()
    build_pdf(font_path, payload, args.output)
    print(f"Wrote {args.output}")


if __name__ == "__main__":
    main()
