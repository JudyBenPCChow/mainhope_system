#!/usr/bin/env python3
"""Generate the staff-facing P0-1 feature × role PDF.

Output: docs/generated/print/P0-1_AUTHZ_FEATURE_ROLES.pdf
"""

from __future__ import annotations

from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs" / "generated" / "print" / "P0-1_AUTHZ_FEATURE_ROLES.pdf"
FONT_DIR = ROOT / "scripts" / ".fonts"
FONT_FILE = FONT_DIR / "PMingLiU.ttf"
MINGLIU_TTC_CANDIDATES = [
    Path("/Applications/Microsoft Word.app/Contents/Resources/DFonts/mingliu.ttc"),
    Path("/Applications/Microsoft Word.app/Contents/Resources/OtherFonts/mingliu.ttc"),
]

ROLES = ("admin", "manager", "finance", "teacher", "alien")
ROLE_LABELS = ("行政", "管理層", "財務", "老師", "外星人")

# (功能, 擁有此功能的角色, 備註)
Section = tuple[str, str | None, list[tuple[str, tuple[str, ...], str]]]

SECTIONS: list[Section] = [
    (
        "學生、報讀與家長邀請",
        None,
        [
            ("查閱學生資料", ("admin", "manager", "finance", "teacher", "alien"), "財務可查閱，不可更改。"),
            ("新增學生", ("admin", "manager", "alien"), ""),
            ("更改學生資料", ("admin", "manager", "alien"), "財務不可更改。"),
            ("報讀／退讀（專科班、私人課程、功課輔導班）", ("admin", "manager", "alien"), ""),
            ("發送家長 Portal 邀請", ("admin", "manager", "alien"), "財務不可發送。"),
        ],
    ),
    (
        "班別",
        "專科班、私人課程、功課輔導班適用同一套權限。",
        [
            ("查閱班別", ("admin", "manager", "finance", "teacher", "alien"), ""),
            ("新增班別", ("admin", "manager", "alien"), ""),
            ("更改班別（含學費）", ("admin", "manager", "alien"), ""),
        ],
    ),
    (
        "排程",
        None,
        [
            ("查閱排程", ("admin", "manager", "finance", "teacher", "alien"), "財務可查閱，不可更改。"),
            ("建立課堂", ("admin", "manager", "alien"), ""),
            ("改期／調整排程時間", ("admin", "manager", "alien"), ""),
            ("取消課堂", ("admin", "manager", "alien"), ""),
            ("安排代堂", ("admin", "manager", "alien"), "僅更改該堂的實際授課老師。"),
            ("更改排程狀態／教學備註", ("admin", "manager", "teacher", "alien"), "老師僅可更改教學備註。"),
        ],
    ),
    (
        "點名與出席",
        None,
        [
            ("查閱出席紀錄", ("admin", "manager", "finance", "teacher", "alien"), "財務可查閱，不可更改。"),
            ("點名", ("admin", "manager", "teacher", "alien"), "老師可為當日課堂點名，不可刪除出席紀錄。點名時會扣除已繳堂數。"),
            ("更正出席紀錄", ("admin", "manager", "alien"), ""),
            ("刪除出席紀錄", ("admin", "manager", "alien"), ""),
        ],
    ),
    (
        "請假",
        None,
        [
            ("查閱請假", ("admin", "manager", "teacher", "alien"), "財務不可查閱請假。"),
            ("新增／更改請假", ("admin", "manager", "alien"), "必要時可一併處理出席紀錄與排程。"),
        ],
    ),
    (
        "學費單與收款",
        "開立學費單後三十分鐘內可直接作廢。逾時須由帳戶已獲授管理層或外星人身分之同仁確認，同一人亦可。",
        [
            ("查閱學費單", ("admin", "manager", "finance", "alien"), "老師不可查閱。財務可查閱，不可更改。"),
            ("開立學費單", ("admin", "manager", "alien"), ""),
            ("登記收款", ("admin", "manager", "alien"), ""),
            ("發起作廢學費單", ("admin", "manager", "alien"), ""),
            ("作廢學費單之第二確認（開單逾三十分鐘）", ("manager", "alien"), "以帳戶已獲授身分為準。"),
        ],
    ),
    (
        "已繳堂數",
        "點名時系統會扣除已繳堂數，此為點名功能的一部分，無須另開權限。直接在調動表更改已繳堂數，僅限外星人。",
        [
            ("查閱已繳堂數", ("admin", "manager", "finance", "alien"), ""),
            ("直接更改已繳堂數", ("alien",), "行政與管理層目前無法直接更改；申請流程另行安排。"),
        ],
    ),
    (
        "校曆與檔期",
        None,
        [
            ("設定校曆（校舍假期）", ("admin", "manager", "alien"), ""),
            ("設定老師檔期", ("admin", "manager", "alien"), ""),
        ],
    ),
    (
        "收件匣",
        None,
        [
            ("標記收件匣已讀", ("admin", "manager", "finance", "teacher", "alien"), ""),
        ],
    ),
    (
        "計糧",
        "行政只可查閱，不負責計糧寫入。準備至提交由財務負責；退回、核實與結算由管理層及外星人負責；已結算月份重開僅限外星人。",
        [
            ("查閱計糧", ("admin", "manager", "finance", "alien"), ""),
            ("重算／準備計糧", ("finance",), ""),
            ("標記財務已審", ("finance",), ""),
            ("排除或恢復老師", ("finance",), ""),
            ("建立調整申請", ("finance",), ""),
            ("填報工時", ("finance",), ""),
            ("提交（單人或整月）", ("finance",), ""),
            ("退回財務", ("manager", "alien"), ""),
            ("核實工時／核准調整", ("manager", "alien"), ""),
            ("結算", ("manager", "alien"), ""),
            ("重開已結算月份", ("alien",), ""),
            ("更改計糧費率", ("alien",), "目前尚無獨立畫面。"),
        ],
    ),
    (
        "成本帳",
        "老師人工由計糧結算後自動過帳，無須在此新增。其他開支分兩步：先新增（待覆核），再確認入帳；未確認不計入本月總成本。行政不可查閱。財務可新增開支及更改分類，不可確認、作廢或重開。",
        [
            ("查閱成本帳", ("manager", "finance", "alien"), "行政不可查閱。"),
            ("新增開支（待覆核）", ("manager", "finance", "alien"), "畫面為「新增開支」。可一併指定或其後更改科目。尚未計入總成本。"),
            ("更改分類", ("manager", "finance", "alien"), "待覆核時可改科目。已確認者須先重開。"),
            ("確認入帳", ("manager", "alien"), "確認後才計入本月已確認總成本。"),
            ("作廢成本帳", ("manager", "alien"), ""),
            ("重開成本帳", ("manager", "alien"), "改回待覆核後，方可再改分類。"),
        ],
    ),
    (
        "系統設定",
        None,
        [
            ("發佈系統通知", ("alien",), ""),
            ("建立或停用用戶", ("alien",), ""),
            ("授予角色", ("alien",), ""),
            ("管理課程與優惠目錄", ("alien",), ""),
        ],
    ),
    (
        "操作紀錄",
        None,
        [
            ("查閱全部操作紀錄", ("manager", "alien"), ""),
            ("查閱自己的操作紀錄", ("admin", "finance"), "管理層與外星人可藉「查閱全部」一併查看自己的紀錄。"),
        ],
    ),
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


def build_pdf(font_path: Path) -> None:
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_LEFT
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import mm
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import Flowable, LongTable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    pdfmetrics.registerFont(TTFont("PMingLiU", str(font_path)))
    font = "PMingLiU"
    page = landscape(A4)
    usable = page[0] - 24 * mm
    ink = colors.HexColor("#202020")
    muted = colors.HexColor("#5f5f5f")
    line = colors.HexColor("#bdbdbd")
    header_bg = colors.HexColor("#e9ecef")
    alternate = colors.HexColor("#f7f7f7")
    accent = colors.HexColor("#315f66")
    note_bg = colors.HexColor("#f4f1ea")

    role_w = 18 * mm
    name_w = 68 * mm
    note_w = usable - name_w - role_w * len(ROLES)
    col_widths = [name_w, *([role_w] * len(ROLES)), note_w]

    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="ZhTitle",
            fontName=font,
            fontSize=16,
            leading=21,
            alignment=TA_CENTER,
            textColor=accent,
            spaceAfter=3,
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
            spaceAfter=8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhHeading",
            fontName=font,
            fontSize=11,
            leading=15,
            textColor=accent,
            spaceBefore=8,
            spaceAfter=3,
            keepWithNext=True,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhBody",
            fontName=font,
            fontSize=8.6,
            leading=12.5,
            alignment=TA_LEFT,
            textColor=ink,
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhIntro",
            fontName=font,
            fontSize=8.6,
            leading=12.5,
            alignment=TA_LEFT,
            textColor=ink,
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
            name="ZhHead",
            fontName=font,
            fontSize=8,
            leading=11,
            alignment=TA_CENTER,
            textColor=ink,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhNote",
            fontName=font,
            fontSize=7.6,
            leading=10.5,
            alignment=TA_LEFT,
            textColor=muted,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Dash",
            fontName=font,
            fontSize=8,
            leading=12,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#c0c0c0"),
        )
    )

    class Tick(Flowable):
        def __init__(self, color: colors.Color) -> None:
            super().__init__()
            self.color = color
            self.width = 11
            self.height = 9

        def draw(self) -> None:
            canv = self.canv
            canv.saveState()
            canv.setStrokeColor(self.color)
            canv.setLineWidth(1.4)
            canv.setLineCap(1)
            canv.setLineJoin(1)
            canv.line(1.4, 3.8, 4.1, 1.3)
            canv.line(4.1, 1.3, 9.4, 7.4)
            canv.restoreState()

    def tick_cell(has: bool) -> object:
        if has:
            return Tick(accent)
        return Paragraph("—", styles["Dash"])

    def section_table(rows: list[tuple[str, tuple[str, ...], str]]) -> LongTable:
        header = [
            Paragraph("功能", styles["ZhHead"]),
            *[Paragraph(label, styles["ZhHead"]) for label in ROLE_LABELS],
            Paragraph("備註", styles["ZhHead"]),
        ]
        data = [header]
        for name, holders, note in rows:
            data.append(
                [
                    Paragraph(escape(name), styles["ZhCell"]),
                    *[tick_cell(role in holders) for role in ROLES],
                    Paragraph(escape(note), styles["ZhNote"]),
                ]
            )
        table = LongTable(data, colWidths=col_widths, repeatRows=1, hAlign="CENTER", splitByRow=1)
        style = [
            ("BACKGROUND", (0, 0), (-1, 0), header_bg),
            ("GRID", (0, 0), (-1, -1), 0.4, line),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("ALIGN", (1, 0), (5, -1), "CENTER"),
            ("TOPPADDING", (0, 0), (-1, -1), 3.2),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3.2),
            ("LEFTPADDING", (0, 0), (-1, -1), 3.5),
            ("RIGHTPADDING", (0, 0), (-1, -1), 3.5),
        ]
        for index in range(2, len(data), 2):
            style.append(("BACKGROUND", (0, index), (-1, index), alternate))
        table.setStyle(TableStyle(style))
        return table

    intro_lines = [
        "本表列出各項後台功能可由哪些角色執行，供內部員工查閱。專科班、私人課程、功課輔導班適用同一套權限。",
        "老師欄的「可」均限於自己任教或代堂的班別與課堂。",
        "管理層擁有行政的全部權限，並另有成本帳確認、計糧結算、作廢第二確認及查閱全部操作紀錄等職能。外星人擁有管理層的全部權限，並另有系統設定、直接更改已繳堂數，以及重開已結算之計糧月份。財務與老師不在上述階層之內。",
        "本表為已核定權限。系統畫面之選單與按鈕尚未完全按此調整；日常作業請以本表及管理層指示為準。",
    ]
    intro_table = Table(
        [[Paragraph(escape(text), styles["ZhIntro"])] for text in intro_lines],
        colWidths=[usable],
        hAlign="CENTER",
    )
    intro_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), note_bg),
                ("BOX", (0, 0), (-1, -1), 0.5, line),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (0, 0), 6),
                ("BOTTOMPADDING", (0, -1), (-1, -1), 6),
                ("TOPPADDING", (0, 1), (-1, -2), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -2), 2),
            ]
        )
    )

    story: list[object] = [
        Paragraph("明學教育｜功能與角色權限一覽", styles["ZhTitle"]),
        Paragraph("內部員工參考｜2026-08-19", styles["ZhSub"]),
        intro_table,
        Spacer(1, 3 * mm),
    ]

    for title, blurb, rows in SECTIONS:
        story.append(Paragraph(title, styles["ZhHeading"]))
        if blurb:
            story.append(Paragraph(escape(blurb), styles["ZhBody"]))
        story.append(section_table(rows))
        story.append(Spacer(1, 2.5 * mm))

    def footer(canvas, doc) -> None:
        canvas.saveState()
        canvas.setFont(font, 8)
        canvas.setFillColor(muted)
        canvas.drawString(12 * mm, 8 * mm, "明學教育｜內部參考｜功能與角色權限一覽")
        canvas.drawRightString(page[0] - 12 * mm, 8 * mm, f"第 {doc.page} 頁")
        canvas.restoreState()

    document = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=page,
        leftMargin=12 * mm,
        rightMargin=12 * mm,
        topMargin=11 * mm,
        bottomMargin=14 * mm,
        title="明學教育｜功能與角色權限一覽",
        author="明學教育",
        subject="內部員工參考：各角色可執行的後台功能",
    )
    document.build(story, onFirstPage=footer, onLaterPages=footer)
    print(f"wrote {OUTPUT}")


def main() -> None:
    build_pdf(ensure_pmingliu())


if __name__ == "__main__":
    main()
