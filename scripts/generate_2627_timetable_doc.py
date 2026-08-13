#!/usr/bin/env python3
"""Generate 2627 timetable record (docx + pdf): 12pt 新細明體, B/W, chapter page breaks."""

from __future__ import annotations

from collections import defaultdict
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "docs" / "year" / "2627" / "timetable"
STEM = "2627_timetable_scheme_2026-08-08"
STEM_TEACHERS = "2627_timetable_teachers_week_2026-08-08"
FONT_DIR = OUT_DIR / ".fonts"
FONT_NAME_EA = "新細明體"
FONT_FILE = FONT_DIR / "PMingLiU.ttf"
MINGLIU_TTC_CANDIDATES = [
    Path("/Applications/Microsoft Word.app/Contents/Resources/DFonts/mingliu.ttc"),
    Path("/Applications/Microsoft Word.app/Contents/Resources/OtherFonts/mingliu.ttc"),
]

SLOTS = [
    "09:00–10:15",
    "10:15–11:30",
    "11:30–12:45",
    "12:45–14:00",
    "14:00–15:15",
    "15:15–16:30",
    "16:30–17:45",
    "17:45–19:00",
    "19:00–20:15",
]
ROOMS = ["17D", "17E", "矩尺座", "英仙座", "山案座"]
DAYS = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"]

GRADE_FULL = {
    "S1": "中一級",
    "S2": "中二級",
    "S3": "中三級",
    "S4": "中四級",
    "S5": "中五級",
    "S6": "中六級",
}
SUBJECT_FULL = {
    "中文": "中文科",
    "英文": "英文科",
    "數學": "數學科",
}
# Display times in timetable cells (ASCII hyphen, per record format).
SLOT_TIMES = [
    "09:00-10:15",
    "10:15-11:30",
    "11:30-12:45",
    "12:45-14:00",
    "14:00-15:15",
    "15:15-16:30",
    "16:30-17:45",
    "17:45-19:00",
    "19:00-20:15",
]


def class_section_letter(code: str) -> str:
    return code[-1]


def class_title(grade: str, subject: str, code: str) -> str:
    """e.g. 中六級中文科（A)"""
    return f"{GRADE_FULL[grade]}{SUBJECT_FULL[subject]}（{class_section_letter(code)})"


def class_cell_text(grade: str, subject: str, teacher: str, code: str, slot_idx: int) -> str:
    return f"{class_title(grade, subject, code)}\n{teacher}\n{SLOT_TIMES[slot_idx]}"


# (day_idx, slot_idx, room, subject, grade, teacher, code)
# Katie：放假五、六；一×1；二至四各連排三堂（16:30–20:15）；日×3。
# Mark：一、二各連排三堂；四高中兩班（17:45–20:15）；六×1；無三／五／日。
CLASSES: list[tuple[int, int, str, str, str, str, str]] = [
    # Monday — Mark 17E 連三；Katie 矩尺座×1；Christine 山案座
    (0, 6, "17E", "數學", "S1", "Mark Yu", "S1數A"),
    (0, 6, "矩尺座", "中文", "S2", "Katie", "S2中B"),
    (0, 7, "17E", "數學", "S5", "Mark Yu", "S5數B"),
    (0, 7, "山案座", "中文", "S6", "Christine Fan", "S6中B"),
    (0, 8, "17E", "數學", "S4", "Mark Yu", "S4數B"),
    (0, 8, "山案座", "中文", "S5", "Christine Fan", "S5中C"),
    # Tuesday — Mark 17E 連三；Katie 矩尺座 連三
    (1, 6, "17E", "數學", "S2", "Mark Yu", "S2數A"),
    (1, 6, "矩尺座", "中文", "S3", "Katie", "S3中B"),
    (1, 7, "17E", "數學", "S6", "Mark Yu", "S6數B"),
    (1, 7, "矩尺座", "中文", "S1", "Katie", "S1中C"),
    (1, 8, "17E", "數學", "S4", "Mark Yu", "S4數A"),
    (1, 8, "矩尺座", "中文", "S2", "Katie", "S2中C"),
    # Wednesday — Katie 連三；Jackson 英仙座
    (2, 6, "矩尺座", "中文", "S1", "Katie", "S1中D"),
    (2, 7, "矩尺座", "中文", "S2", "Katie", "S2中D"),
    (2, 7, "英仙座", "英文", "S5", "Jackson Lau", "S5英B"),
    (2, 8, "矩尺座", "中文", "S3", "Katie", "S3中C"),
    # Thursday — Mark 17E 高中兩班；Katie 連三；Christine 山案座
    # （同年級不撞：slot7 唔排 S6 數／slot8 唔排 S4 數）
    (3, 6, "矩尺座", "中文", "S3", "Katie", "S3中D"),
    (3, 7, "17E", "數學", "S5", "Mark Yu", "S5數A"),
    (3, 7, "矩尺座", "中文", "S1", "Katie", "S1中E"),
    (3, 7, "山案座", "中文", "S6", "Christine Fan", "S6中C"),
    (3, 8, "17E", "數學", "S6", "Mark Yu", "S6數A"),
    (3, 8, "矩尺座", "中文", "S1", "Katie", "S1中B"),
    (3, 8, "山案座", "中文", "S4", "Christine Fan", "S4中C"),
    # Friday — Katie／Mark 放假；開會空檔 16:30-17:45
    # Saturday — no 09:00; Mark 17D×1；Jackson 17E
    (5, 1, "17D", "數學", "S3", "Mark Yu", "S3數A"),
    (5, 3, "17E", "英文", "S4", "Jackson Lau", "S4英B"),
    # Sunday — no 09:00; Christine 17D from 11:30; Katie 17E×3; Cyndi Ng 英仙座
    (6, 1, "17E", "中文", "S1", "Katie", "S1中A"),
    (6, 2, "17E", "中文", "S2", "Katie", "S2中A"),
    (6, 2, "17D", "中文", "S4", "Christine Fan", "S4中A"),
    (6, 3, "17D", "中文", "S5", "Christine Fan", "S5中A"),
    (6, 4, "17E", "中文", "S3", "Katie", "S3中A"),
    (6, 4, "英仙座", "英文", "S4", "Cyndi Ng", "S4英A"),
    (6, 5, "17D", "中文", "S6", "Christine Fan", "S6中A"),
    (6, 6, "17D", "中文", "S4", "Christine Fan", "S4中B"),
    (6, 8, "17D", "中文", "S5", "Christine Fan", "S5中B"),
    (6, 1, "英仙座", "英文", "S6", "Cyndi Ng", "S6英A"),
    (6, 2, "英仙座", "英文", "S5", "Cyndi Ng", "S5英A"),
]

# (day_idx, slot_idx, room, teacher, title)
# Reserved non-group slots shown on the timetable.
RESERVED: list[tuple[int, int, str, str, str]] = [
    (6, 5, "英仙座", "Cyndi Ng", "一對一高中英文科（預留）"),
]

MINUTES_PER_CLASS = 75

STAFF = [
    (
        "Mark Yu",
        "數學科",
        9,
        "星期一、星期二、星期四、星期六",
        "兼職。必須星期六出勤；不排星期三、星期五、星期日。星期一、二連排三堂；星期四高中兩班（17:45-20:15）；星期六一班。",
    ),
    (
        "Katie",
        "中文科",
        13,
        "星期一至星期四、星期日",
        "全職。放假星期五、星期六。星期一一班；星期二至四每日連排三堂；星期日三班。",
    ),
    (
        "Christine Fan",
        "中文科（中四級至中六級）",
        9,
        "星期一、星期四、星期日",
        "兼職。必須星期日出勤；不排星期六；星期日最早 11:30。",
    ),
    (
        "Cyndi Ng",
        "英文科",
        3,
        "星期日",
        "兼職。只限星期日；小組班三班自 10:15 起；另預留一個一對一高中英文時段。",
    ),
    ("Jackson Lau", "英文科", 2, "星期三、星期六", "兼職。星期三一班、星期六一班。"),
]

PRINCIPLES = [
    "適用學年為 2627（2026-09-01 至 2027-06-30），正規小組課，每周固定逢星期與時段。",
    "每節 75 分鐘；最遲一節為 19:00-20:15；不排 20:15-21:30。",
    "目前星期六、星期日不排 09:00-10:15；週末最早一節為 10:15-11:30。",
    "可用課室為 17D、17E、矩尺座、英仙座、山案座；17K 停用。平日 17D 全日列作功課輔導班專用，常規班不使用 17D。",
    "平日年級時段：中一級至中三級自 16:30 起；中四級至中六級自 17:45 起。週末除上述 09:00 限制外，年級不限最早時段，仍禁止末節。",
    "同一老師、同一課室、同年級不同科目，同時段均不可重疊。",
    "一般連堂最多兩節，其後須空至少一格；同日最多五節。例外：Mark Yu 星期一、二連排三堂；Katie 星期二至四連排三堂。兼職相鄰堂之間空檔最多一格；僅 Katie 可留較大空檔。",
    "同一老師同一出勤日，班別盡量安排於同一課室。",
    "Mark Yu 星期四排高中數學兩班（17:45-20:15）；不排星期三、星期五、星期日。",
    "Katie 放假星期五、星期六；星期一一班；星期二至四每日三班；星期日三班。",
    "Christine Fan 星期日班別最早於 11:30 開始。",
    "Cyndi Ng 星期日小組班自 10:15 開始；同日另預留一個一對一高中英文時段。",
    "時間表不出現「待確認老師」。未有具名老師承接的班數，另列未排缺口。",
    "Jackson Lau 出勤為星期三一班、星期六一班。",
    "Mark Yu、Christine Fan、Katie 開會空檔為星期五 16:30-17:45。",
    "核心科目標為中文科、英文科、數學科每級至少兩班。本方案僅排已確認老師配額；不足者見未排缺口。",
]


def teacher_hours_text(n_classes: int) -> str:
    total_min = n_classes * MINUTES_PER_CLASS
    hours, minutes = divmod(total_min, 60)
    if minutes:
        return f"{n_classes} 班 × {MINUTES_PER_CLASS} 分鐘＝每周授課 {hours} 小時 {minutes} 分鐘（合共 {total_min} 分鐘）"
    return f"{n_classes} 班 × {MINUTES_PER_CLASS} 分鐘＝每周授課 {hours} 小時（合共 {total_min} 分鐘）"


def ensure_pmingliu() -> Path:
    FONT_DIR.mkdir(parents=True, exist_ok=True)
    if FONT_FILE.exists() and FONT_FILE.stat().st_size > 1_000_000:
        return FONT_FILE
    from fontTools.ttLib import TTCollection

    src = next((p for p in MINGLIU_TTC_CANDIDATES if p.exists()), None)
    if src is None:
        raise FileNotFoundError("找不到 mingliu.ttc（新細明體）。請安裝 Microsoft Word 後重試。")
    ttc = TTCollection(str(src))
    # face 1 = PMingLiU / 新細明體
    ttc.fonts[1].save(str(FONT_FILE))
    return FONT_FILE


def set_run_font(run, size_pt: float = 12, bold: bool = False) -> None:
    run.font.name = FONT_NAME_EA
    run._element.rPr.rFonts.set(qn("w:ascii"), FONT_NAME_EA)
    run._element.rPr.rFonts.set(qn("w:hAnsi"), FONT_NAME_EA)
    run._element.rPr.rFonts.set(qn("w:eastAsia"), FONT_NAME_EA)
    run.font.size = Pt(size_pt)
    run.font.bold = bold
    run.font.italic = False
    run.font.color.rgb = RGBColor(0, 0, 0)


def set_style_font(style, size_pt: float = 12) -> None:
    style.font.name = FONT_NAME_EA
    style.font.size = Pt(size_pt)
    style.font.italic = False
    style.font.color.rgb = RGBColor(0, 0, 0)
    if style.element.rPr is None:
        style.element.get_or_add_rPr()
    rpr = style.element.rPr
    rfonts = rpr.get_or_add_rFonts()
    rfonts.set(qn("w:ascii"), FONT_NAME_EA)
    rfonts.set(qn("w:hAnsi"), FONT_NAME_EA)
    rfonts.set(qn("w:eastAsia"), FONT_NAME_EA)


def add_page_break(doc: Document) -> None:
    doc.add_page_break()


def add_para(doc: Document, text: str, *, size: float = 12, bold: bool = False, space_after: float = 6) -> None:
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
    run = p.add_run(text)
    set_run_font(run, size, bold)


def add_chapter(doc: Document, text: str, *, first: bool = False) -> None:
    if not first:
        add_page_break(doc)
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(12)
    p.paragraph_format.space_before = Pt(0)
    run = p.add_run(text)
    set_run_font(run, 12, bold=True)
    # Explicit bold for East Asian fonts in Word.
    rpr = run._element.get_or_add_rPr()
    b = OxmlElement("w:b")
    bCs = OxmlElement("w:bCs")
    rpr.append(b)
    rpr.append(bCs)


def add_section_title(doc: Document, text: str) -> None:
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(8)
    run = p.add_run(text)
    set_run_font(run, 12, bold=True)
    rpr = run._element.get_or_add_rPr()
    rpr.append(OxmlElement("w:b"))
    rpr.append(OxmlElement("w:bCs"))


def shade_cell(cell, fill: str = "F0F0F0") -> None:
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), fill)
    shd.set(qn("w:val"), "clear")
    tcPr.append(shd)


def write_cell(cell, text: str, *, bold: bool = False, size: float = 12) -> None:
    cell.text = ""
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.space_before = Pt(0)
    run = p.add_run(text)
    set_run_font(run, size, bold)


def count_matrix() -> dict[str, dict[str, int]]:
    grades = ["S1", "S2", "S3", "S4", "S5", "S6"]
    subjects = ["中文", "英文", "數學"]
    m = {s: {g: 0 for g in grades} for s in subjects}
    for _, _, _, subj, grade, _, _ in CLASSES:
        m[subj][grade] += 1
    return m


def weekly_summary_rows() -> list[list[str]]:
    rows = [["星期", "時段", "課室", "班別", "任教老師"]]
    items: list[tuple[int, int, str, str, str]] = []
    for d, slot, room, subj, grade, teacher, code in CLASSES:
        items.append((d, slot, room, class_title(grade, subj, code), teacher))
    for d, slot, room, teacher, title in RESERVED:
        items.append((d, slot, room, title, teacher))
    for d, slot, room, title, teacher in sorted(items, key=lambda x: (x[0], x[1], x[2])):
        rows.append([DAYS[d], SLOT_TIMES[slot], room, title, teacher])
    return rows


def day_grid(day_idx: int) -> list[list[str]]:
    header = ["時段"] + ROOMS
    grid = [header]
    is_weekday = day_idx <= 4
    is_weekend = day_idx >= 5
    for s, label in enumerate(SLOT_TIMES):
        row = [label]
        for room in ROOMS:
            if is_weekend and s == 0:
                row.append("不排課")
                continue
            if is_weekday and room == "17D":
                cell = "功課輔導班"
            else:
                cell = ""
            hits = [
                class_cell_text(grade, subj, teacher, code, slot)
                for d, slot, r, subj, grade, teacher, code in CLASSES
                if d == day_idx and slot == s and r == room
            ]
            reserved_hits = [
                f"{title}\n{teacher}\n{SLOT_TIMES[slot]}"
                for d, slot, r, teacher, title in RESERVED
                if d == day_idx and slot == s and r == room
            ]
            hits.extend(reserved_hits)
            if hits:
                extra = "\n\n".join(hits)
                cell = extra if not cell else f"{cell}\n{extra}"
            if day_idx == 4 and s == 6 and room != "17D":
                meet = "開會空檔\nMark Yu／Christine Fan／Katie\n16:30-17:45"
                cell = meet if not cell else f"{cell}\n{meet}"
            row.append(cell if cell else "—")
        grid.append(row)
    return grid


def configure_docx_styles(doc: Document) -> None:
    for section in doc.sections:
        section.top_margin = Cm(2.2)
        section.bottom_margin = Cm(2.2)
        section.left_margin = Cm(2.2)
        section.right_margin = Cm(2.2)
    set_style_font(doc.styles["Normal"], 12)
    for name in ("Heading 1", "Heading 2", "Title"):
        if name in doc.styles:
            set_style_font(doc.styles[name], 12)


def build_docx(path: Path) -> None:
    doc = Document()
    configure_docx_styles(doc)

    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title.add_run("明學教育")
    set_run_font(run, 12, bold=True)

    sub = doc.add_paragraph()
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = sub.add_run("2627 學年常規小組課時間表")
    set_run_font(run, 12, bold=True)

    meta = doc.add_paragraph()
    meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = meta.add_run("方案紀錄｜2026-08-08｜修訂 2026-08-12｜未定稿入庫")
    set_run_font(run, 12)

    add_para(doc, "本文件為規劃方案紀錄，供營運審閱。內容以排課規則為準，尚未寫入正式班別與排程。", size=12)

    # 一
    add_chapter(doc, "一、排程原則", first=True)
    for i, line in enumerate(PRINCIPLES, 1):
        add_para(doc, f"{i}. {line}", size=12, space_after=6)

    # 二
    add_chapter(doc, "二、各員工出勤日、班數、科目")
    t = doc.add_table(rows=1, cols=4)
    t.style = "Table Grid"
    for i, h in enumerate(["老師", "班數", "科目", "出勤日與備註"]):
        write_cell(t.rows[0].cells[i], h, bold=True, size=12)
        shade_cell(t.rows[0].cells[i])
    for name, subject, n, days, note in STAFF:
        items = [c for c in CLASSES if c[5] == name]
        room_by_day: dict[str, set[str]] = {}
        for d, _, room, _, _, _, _ in items:
            room_by_day.setdefault(DAYS[d], set()).add(room)
        room_note = "；".join(f"{d}={'／'.join(sorted(rs))}" for d, rs in room_by_day.items())
        titles = "、".join(
            class_title(c[4], c[3], c[6]) for c in sorted(items, key=lambda x: (x[0], x[1]))
        )
        reserved_titles = "、".join(
            title for d, slot, room, teacher, title in RESERVED if teacher == name
        )
        detail = f"{days}\n同日課室：{room_note}\n班別：{titles}"
        if reserved_titles:
            detail += f"\n預留：{reserved_titles}"
        detail += f"\n{note}"
        row = t.add_row().cells
        for cell, val in zip(row, [name, str(n), subject, detail]):
            write_cell(cell, val, size=12)
    add_para(
        doc,
        f"已排小組班合計 {len(CLASSES)} 班；另預留時段 {len(RESERVED)} 個。全部為具名老師，無待確認老師。",
        size=12,
        space_after=0,
    )

    # 三
    add_chapter(doc, "三、各級各科班數")
    matrix = count_matrix()
    t2 = doc.add_table(rows=4, cols=7)
    t2.style = "Table Grid"
    headers = ["科目", "中一級", "中二級", "中三級", "中四級", "中五級", "中六級"]
    for j, h in enumerate(headers):
        write_cell(t2.rows[0].cells[j], h, bold=True, size=12)
        shade_cell(t2.rows[0].cells[j])
    for i, subj in enumerate(["中文", "英文", "數學"], 1):
        vals = [SUBJECT_FULL[subj]] + [str(matrix[subj][g]) for g in ["S1", "S2", "S3", "S4", "S5", "S6"]]
        for j, val in enumerate(vals):
            write_cell(t2.rows[i].cells[j], val, bold=(j == 0), size=12)

    # 四
    add_chapter(doc, "四、未排缺口")
    add_para(doc, "目標：中文科、英文科、數學科每級至少兩班。以下為本方案尚未排入之差額。", size=12)
    gaps = []
    for subj in ["中文", "英文", "數學"]:
        for g in ["S1", "S2", "S3", "S4", "S5", "S6"]:
            n = matrix[subj][g]
            if n < 2:
                gaps.append(f"{GRADE_FULL[g]}{SUBJECT_FULL[subj]}：已排 {n}，尚欠 {2 - n}")
    if gaps:
        for g in gaps:
            add_para(doc, g, size=12, space_after=4)
    else:
        add_para(doc, "無。", size=12)
    add_para(doc, "缺口待增聘或確認老師後另開一輪排程，不以「待確認老師」佔用課室格。", size=12)

    # 五
    add_chapter(doc, "五、一周時間表")
    add_para(doc, "以下按星期與時段列出全部已排班。各天課室詳表見下一章。", size=12)
    overview = weekly_summary_rows()
    t3 = doc.add_table(rows=len(overview), cols=7)
    t3.style = "Table Grid"
    for i, row_vals in enumerate(overview):
        for j, val in enumerate(row_vals):
            write_cell(t3.rows[i].cells[j], val, bold=(i == 0), size=12)
            if i == 0:
                shade_cell(t3.rows[i].cells[j])

    # 六
    add_chapter(doc, "六、各天詳細時間表")
    for day_idx, day_name in enumerate(DAYS):
        add_section_title(doc, day_name)
        note = "平日。17D 為功課輔導班專用。最遲 19:00-20:15。"
        if day_idx >= 5:
            note = "週末。五室皆可排常規班。最遲 19:00-20:15。本日不排 09:00-10:15。"
        if day_idx == 4:
            note += " 16:30-17:45 為 Mark Yu、Christine Fan、Katie 開會空檔。"
        if day_idx == 6:
            note += " Christine Fan 班別自 11:30 起。Cyndi Ng 小組班自 10:15 起，並預留一個一對一高中英文時段。"
        add_para(doc, note, size=12)
        grid = day_grid(day_idx)
        td = doc.add_table(rows=len(grid), cols=len(grid[0]))
        td.style = "Table Grid"
        for i, row_vals in enumerate(grid):
            for j, val in enumerate(row_vals):
                write_cell(td.rows[i].cells[j], val, bold=(i == 0 or j == 0), size=9 if i else 12)
                if i == 0:
                    shade_cell(td.rows[i].cells[j])

    add_para(doc, "— 完 —", size=12)
    doc.save(path)


def build_pdf(path: Path, font_path: Path) -> None:
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_LEFT
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import cm
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import Flowable, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    pdfmetrics.registerFont(TTFont("PMingLiU", str(font_path)))
    font_name = "PMingLiU"

    class BoldTitle(Flowable):
        """12pt chapter title; fake-bold by overstriking for CJK without a bold face."""

        def __init__(self, text: str):
            super().__init__()
            self.text = text
            self.height = 22

        def wrap(self, availWidth, availHeight):
            self.width = availWidth
            return availWidth, self.height

        def draw(self):
            self.canv.setFillColor(colors.black)
            self.canv.setFont(font_name, 12)
            y = 6
            # Slight offsets to simulate bold weight.
            for dx, dy in ((0, 0), (0.25, 0), (0, 0.25), (0.25, 0.25)):
                self.canv.drawString(dx, y + dy, self.text)

    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="BWCenter",
            fontName=font_name,
            fontSize=12,
            leading=18,
            alignment=TA_CENTER,
            textColor=colors.black,
            spaceAfter=8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="BWBody",
            fontName=font_name,
            fontSize=12,
            leading=18,
            textColor=colors.black,
            alignment=TA_LEFT,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="BWTable",
            fontName=font_name,
            fontSize=9,
            leading=12,
            textColor=colors.black,
        )
    )
    styles.add(
        ParagraphStyle(
            name="BWTableHeader",
            fontName=font_name,
            fontSize=10,
            leading=13,
            textColor=colors.black,
        )
    )

    def P(text: str, style: str = "BWBody") -> Paragraph:
        return Paragraph(str(text).replace("\n", "<br/>"), styles[style])

    def chapter(text: str) -> BoldTitle:
        return BoldTitle(text)

    def bw_table(data: list[list], col_widths: list[float], header: bool = True) -> Table:
        styled = []
        for i, row in enumerate(data):
            styled.append([P(c, "BWTableHeader" if header and i == 0 else "BWTable") for c in row])
        t = Table(styled, colWidths=col_widths, repeatRows=1 if header else 0)
        cmds = [
            ("FONTNAME", (0, 0), (-1, -1), font_name),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
        ]
        if header:
            cmds.append(("BACKGROUND", (0, 0), (-1, 0), colors.Color(0.94, 0.94, 0.94)))
        t.setStyle(TableStyle(cmds))
        return t

    doc = SimpleDocTemplate(
        str(path),
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title="2627 學年常規小組課時間表",
        author="明學教育",
    )
    story: list = []
    story.append(P("明學教育", "BWCenter"))
    story.append(P("2627 學年常規小組課時間表", "BWCenter"))
    story.append(P("方案紀錄｜2026-08-08｜修訂 2026-08-12｜未定稿入庫", "BWCenter"))
    story.append(P("本文件為規劃方案紀錄，供營運審閱。內容以排課規則為準，尚未寫入正式班別與排程。"))

    story.append(PageBreak())
    story.append(chapter("一、排程原則"))
    for i, line in enumerate(PRINCIPLES, 1):
        story.append(P(f"{i}. {line}"))

    story.append(PageBreak())
    story.append(chapter("二、各員工出勤日、班數、科目"))
    staff_data = [["老師", "班數", "科目", "出勤日", "備註"]]
    for name, subject, n, days, note in STAFF:
        staff_data.append([name, str(n), subject, days, note])
    story.append(bw_table(staff_data, [2.8 * cm, 1.2 * cm, 2.8 * cm, 4.2 * cm, 6.2 * cm]))
    story.append(Spacer(1, 8))
    story.append(
        P(f"已排小組班合計 {len(CLASSES)} 班；另預留時段 {len(RESERVED)} 個。全部為具名老師，無待確認老師。")
    )

    story.append(PageBreak())
    story.append(chapter("三、各級各科班數"))
    matrix = count_matrix()
    mdata = [["科目", "中一級", "中二級", "中三級", "中四級", "中五級", "中六級"]]
    for subj in ["中文", "英文", "數學"]:
        mdata.append(
            [SUBJECT_FULL[subj]] + [str(matrix[subj][g]) for g in ["S1", "S2", "S3", "S4", "S5", "S6"]]
        )
    story.append(bw_table(mdata, [2.2 * cm] + [2.25 * cm] * 6))

    story.append(PageBreak())
    story.append(chapter("四、未排缺口"))
    story.append(P("目標：中文科、英文科、數學科每級至少兩班。以下為本方案尚未排入之差額。"))
    for subj in ["中文", "英文", "數學"]:
        for g in ["S1", "S2", "S3", "S4", "S5", "S6"]:
            n = matrix[subj][g]
            if n < 2:
                story.append(P(f"{GRADE_FULL[g]}{SUBJECT_FULL[subj]}：已排 {n}，尚欠 {2 - n}"))
    story.append(P("缺口待增聘或確認老師後另開一輪排程，不以「待確認老師」佔用課室格。"))

    story.append(PageBreak())
    story.append(chapter("五、一周時間表"))
    story.append(P("以下按星期與時段列出全部已排班及預留時段。各天課室詳表見下一章。"))
    story.append(bw_table(weekly_summary_rows(), [2.2 * cm, 2.6 * cm, 2.0 * cm, 5.2 * cm, 3.2 * cm]))

    story.append(PageBreak())
    story.append(chapter("六、各天詳細時間表"))
    for day_idx, day_name in enumerate(DAYS):
        if day_idx > 0:
            story.append(Spacer(1, 10))
        story.append(chapter(day_name))
        note = "平日。17D 為功課輔導班專用。最遲 19:00-20:15。"
        if day_idx >= 5:
            note = "週末。五室皆可排常規班。最遲 19:00-20:15。本日不排 09:00-10:15。"
        if day_idx == 4:
            note += " 16:30-17:45 為 Mark Yu、Christine Fan、Katie 開會空檔。"
        if day_idx == 6:
            note += " Christine Fan 班別自 11:30 起。Cyndi Ng 小組班自 10:15 起，並預留一個一對一高中英文時段。"
        story.append(P(note))
        story.append(bw_table(day_grid(day_idx), [2.3 * cm] + [3.0 * cm] * 5))

    story.append(P("— 完 —"))
    doc.build(story)


def validate() -> None:
    assert len(CLASSES) == 36
    teachers = {c[5] for c in CLASSES}
    assert "待確認老師" not in teachers
    assert "Cyndi" not in teachers  # full name Cyndi Ng
    t_busy: dict = defaultdict(list)
    r_busy: dict = defaultdict(list)
    g_busy: dict = defaultdict(list)
    for d, s, room, subj, grade, teacher, code in CLASSES:
        t_busy[(d, s)].append(teacher)
        r_busy[(d, s, room)].append(code)
        g_busy[(d, s, grade)].append(subj)
    for d, s, room, teacher, title in RESERVED:
        t_busy[(d, s)].append(teacher)
        r_busy[(d, s, room)].append(title)
    for k, v in t_busy.items():
        assert len(v) == len(set(v)), k
    for k, v in r_busy.items():
        assert len(v) == 1, (k, v)
    for k, v in g_busy.items():
        assert len(v) == len(set(v)), (k, v)
    for d, s, _, _, _, teacher, _ in CLASSES:
        if teacher == "Christine Fan" and d == 6:
            assert s >= 2
        if teacher == "Cyndi Ng":
            assert d == 6 and s >= 1
        # Weekend: no 09:00
        if d >= 5:
            assert s >= 1
    assert {c[0] for c in CLASSES if c[5] == "Jackson Lau"} == {2, 5}
    assert {c[0] for c in CLASSES if c[5] == "Katie"} == {0, 1, 2, 3, 6}
    assert {c[0] for c in CLASSES if c[5] == "Mark Yu"} == {0, 1, 3, 5}
    # Mark／Katie weekday blocks of 3 (slots 6–8)
    for teacher, days in (("Mark Yu", (0, 1)), ("Katie", (1, 2, 3))):
        for d in days:
            slots = sorted(c[1] for c in CLASSES if c[5] == teacher and c[0] == d)
            assert slots == [6, 7, 8], (teacher, d, slots)
    katie_mon = [c[1] for c in CLASSES if c[5] == "Katie" and c[0] == 0]
    assert katie_mon == [6]
    mark_thu = sorted(c[1] for c in CLASSES if c[5] == "Mark Yu" and c[0] == 3)
    assert mark_thu == [7, 8]
    mark_thu_grades = {c[4] for c in CLASSES if c[5] == "Mark Yu" and c[0] == 3}
    assert mark_thu_grades <= {"S4", "S5", "S6"}
    mark_sat = sorted(c[1] for c in CLASSES if c[5] == "Mark Yu" and c[0] == 5)
    assert mark_sat == [1]
    assert len(RESERVED) == 1 and RESERVED[0][4].startswith("一對一高中英文科")
    rooms = defaultdict(set)
    for d, _, room, _, _, teacher, _ in CLASSES:
        rooms[(teacher, d)].add(room)
    for d, _, room, teacher, _ in RESERVED:
        rooms[(teacher, d)].add(room)
    for k, rs in rooms.items():
        assert len(rs) == 1, (k, rs)
    print("validation ok", len(CLASSES), "classes", len(RESERVED), "reserved")


def teacher_week_rows(teacher: str) -> list[list[str]]:
    """Rows for one teacher: 星期, 時段, 課室, 班別."""
    rows = [["星期", "時段", "課室", "班別"]]
    items: list[tuple[int, int, str, str]] = []
    for d, slot, room, subj, grade, name, code in CLASSES:
        if name == teacher:
            items.append((d, slot, room, class_title(grade, subj, code)))
    for d, slot, room, name, title in RESERVED:
        if name == teacher:
            items.append((d, slot, room, title))
    for d, slot, room, title in sorted(items, key=lambda x: (x[0], x[1], x[2])):
        rows.append([DAYS[d], SLOT_TIMES[slot], room, title])
    return rows


def teacher_week_grid(teacher: str) -> list[list[str]]:
    """University-style week view: rows = slots, columns = days."""
    # cell[(day, slot)] = "班別\n課室"
    cells: dict[tuple[int, int], str] = {}
    for d, slot, room, subj, grade, name, code in CLASSES:
        if name == teacher:
            cells[(d, slot)] = f"{class_title(grade, subj, code)}\n{room}"
    for d, slot, room, name, title in RESERVED:
        if name == teacher:
            cells[(d, slot)] = f"{title}\n{room}"

    header = ["時段"] + DAYS
    grid = [header]
    for s, time_label in enumerate(SLOT_TIMES):
        row = [time_label]
        for d in range(7):
            if d >= 5 and s == 0:
                row.append("不排課")
            else:
                row.append(cells.get((d, s), "—"))
        grid.append(row)
    return grid


def build_teachers_docx(path: Path) -> None:
    doc = Document()
    configure_docx_styles(doc)

    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title.add_run("明學教育")
    set_run_font(run, 12, bold=True)

    sub = doc.add_paragraph()
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = sub.add_run("2627 學年各老師一周排程")
    set_run_font(run, 12, bold=True)

    meta = doc.add_paragraph()
    meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = meta.add_run("獨立附件｜對應方案紀錄 2026-08-08（修訂 2026-08-12）｜未定稿入庫")
    set_run_font(run, 12)

    add_para(
        doc,
        "本文件獨立於全校課室時間表，只按老師列出一周職務。每位老師先列一周總覽，周視圖另頁（橫軸星期、縱軸時段）。班別名稱與時段寫法與方案紀錄一致。",
        size=12,
    )

    for i, (name, subject, n, days, note) in enumerate(STAFF):
        add_chapter(doc, f"{name}", first=(i == 0))
        add_para(doc, f"科目：{subject}", size=12, space_after=4)
        reserved_n = sum(1 for _d, _s, _r, teacher, _t in RESERVED if teacher == name)
        load = f"小組班：{n} 班"
        if reserved_n:
            load += f"；預留時段：{reserved_n} 個"
        add_para(doc, load, size=12, space_after=4)
        add_para(doc, teacher_hours_text(n), size=12, space_after=4)
        add_para(doc, f"出勤日：{days}", size=12, space_after=4)
        add_para(doc, note, size=12, space_after=8)

        add_para(doc, "一周總覽", size=12, bold=True, space_after=6)
        overview = teacher_week_rows(name)
        t = doc.add_table(rows=len(overview), cols=4)
        t.style = "Table Grid"
        for ri, row_vals in enumerate(overview):
            for j, val in enumerate(row_vals):
                write_cell(t.rows[ri].cells[j], val, bold=(ri == 0), size=12)
                if ri == 0:
                    shade_cell(t.rows[ri].cells[j])

        # 周視圖獨立一頁
        add_page_break(doc)
        add_para(doc, f"{name}｜周視圖", size=12, bold=True, space_after=6)
        add_para(doc, f"科目：{subject}；{teacher_hours_text(n)}", size=12, space_after=8)
        grid = teacher_week_grid(name)
        tg = doc.add_table(rows=len(grid), cols=len(grid[0]))
        tg.style = "Table Grid"
        for ri, row_vals in enumerate(grid):
            for j, val in enumerate(row_vals):
                write_cell(tg.rows[ri].cells[j], val, bold=(ri == 0 or j == 0), size=8)
                if ri == 0:
                    shade_cell(tg.rows[ri].cells[j])

    add_para(doc, "— 完 —", size=12)
    doc.save(path)


def build_teachers_pdf(path: Path, font_path: Path) -> None:
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_LEFT
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import cm
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import Flowable, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    pdfmetrics.registerFont(TTFont("PMingLiU", str(font_path)))
    font_name = "PMingLiU"
    page = landscape(A4)

    class BoldTitle(Flowable):
        def __init__(self, text: str):
            super().__init__()
            self.text = text
            self.height = 22

        def wrap(self, availWidth, availHeight):
            self.width = availWidth
            return availWidth, self.height

        def draw(self):
            self.canv.setFillColor(colors.black)
            self.canv.setFont(font_name, 12)
            y = 6
            for dx, dy in ((0, 0), (0.25, 0), (0, 0.25), (0.25, 0.25)):
                self.canv.drawString(dx, y + dy, self.text)

    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="BWCenter",
            fontName=font_name,
            fontSize=12,
            leading=18,
            alignment=TA_CENTER,
            textColor=colors.black,
            spaceAfter=8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="BWBody",
            fontName=font_name,
            fontSize=12,
            leading=18,
            textColor=colors.black,
            alignment=TA_LEFT,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="BWTable",
            fontName=font_name,
            fontSize=11,
            leading=15,
            textColor=colors.black,
        )
    )
    styles.add(
        ParagraphStyle(
            name="BWTableHeader",
            fontName=font_name,
            fontSize=11,
            leading=15,
            textColor=colors.black,
        )
    )

    def P(text: str, style: str = "BWBody") -> Paragraph:
        return Paragraph(str(text).replace("\n", "<br/>"), styles[style])

    def bw_table(data: list[list], col_widths: list[float]) -> Table:
        styled = [[P(c, "BWTableHeader" if i == 0 else "BWTable") for c in row] for i, row in enumerate(data)]
        t = Table(styled, colWidths=col_widths, repeatRows=1)
        t.setStyle(
            TableStyle(
                [
                    ("FONTNAME", (0, 0), (-1, -1), font_name),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("BACKGROUND", (0, 0), (-1, 0), colors.Color(0.94, 0.94, 0.94)),
                    ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
                    ("LEFTPADDING", (0, 0), (-1, -1), 4),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ]
            )
        )
        return t

    doc = SimpleDocTemplate(
        str(path),
        pagesize=page,
        leftMargin=1.5 * cm,
        rightMargin=1.5 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
        title="2627 學年各老師一周排程",
        author="明學教育",
    )
    story: list = []
    story.append(P("明學教育", "BWCenter"))
    story.append(P("2627 學年各老師一周排程", "BWCenter"))
    story.append(P("獨立附件｜對應方案紀錄 2026-08-08（修訂 2026-08-12）｜未定稿入庫", "BWCenter"))
    story.append(
        P(
            "本文件獨立於全校課室時間表，只按老師列出一周職務。每位老師先列一周總覽，周視圖另頁（橫軸星期、縱軸時段）。班別名稱與時段寫法與方案紀錄一致。"
        )
    )

    for i, (name, subject, n, days, note) in enumerate(STAFF):
        story.append(PageBreak())
        story.append(BoldTitle(name))
        reserved_n = sum(1 for _d, _s, _r, teacher, _t in RESERVED if teacher == name)
        load = f"小組班：{n} 班"
        if reserved_n:
            load += f"；預留時段：{reserved_n} 個"
        story.append(P(f"科目：{subject}"))
        story.append(P(load))
        story.append(P(teacher_hours_text(n)))
        story.append(P(f"出勤日：{days}"))
        story.append(P(note))
        story.append(Spacer(1, 6))
        story.append(BoldTitle("一周總覽"))
        story.append(bw_table(teacher_week_rows(name), [3.2 * cm, 3.2 * cm, 2.8 * cm, 7.0 * cm]))

        # 周視圖獨立一頁
        story.append(PageBreak())
        story.append(BoldTitle(f"{name}｜周視圖"))
        story.append(P(f"科目：{subject}；{teacher_hours_text(n)}"))
        story.append(Spacer(1, 6))
        # Landscape A4 usable width ≈ 26.7cm with 1.5cm margins.
        week_widths = [2.6 * cm] + [3.3 * cm] * 7
        styles_small = ParagraphStyle(
            name=f"BWTableSmall_{i}",
            fontName=font_name,
            fontSize=8,
            leading=10,
            textColor=colors.black,
        )

        def Psmall(text: str, style=styles_small) -> Paragraph:
            return Paragraph(str(text).replace("\n", "<br/>"), style)

        grid = teacher_week_grid(name)
        styled = [[Psmall(c) for c in row] for row in grid]
        wt = Table(styled, colWidths=week_widths, repeatRows=1)
        wt.setStyle(
            TableStyle(
                [
                    ("FONTNAME", (0, 0), (-1, -1), font_name),
                    ("GRID", (0, 0), (-1, -1), 0.4, colors.black),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("BACKGROUND", (0, 0), (-1, 0), colors.Color(0.94, 0.94, 0.94)),
                    ("BACKGROUND", (0, 0), (0, -1), colors.Color(0.94, 0.94, 0.94)),
                    ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
                    ("LEFTPADDING", (0, 0), (-1, -1), 2),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 2),
                    ("TOPPADDING", (0, 0), (-1, -1), 2),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                ]
            )
        )
        story.append(wt)

    story.append(P("— 完 —"))
    doc.build(story)


def main() -> None:
    validate()
    font_path = ensure_pmingliu()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    docx_path = OUT_DIR / f"{STEM}.docx"
    pdf_path = OUT_DIR / f"{STEM}.pdf"
    build_docx(docx_path)
    print("wrote", docx_path)
    build_pdf(pdf_path, font_path)
    print("wrote", pdf_path)

    teachers_docx = OUT_DIR / f"{STEM_TEACHERS}.docx"
    teachers_pdf = OUT_DIR / f"{STEM_TEACHERS}.pdf"
    build_teachers_docx(teachers_docx)
    print("wrote", teachers_docx)
    build_teachers_pdf(teachers_pdf, font_path)
    print("wrote", teachers_pdf)
    print("font", font_path)


if __name__ == "__main__":
    main()
