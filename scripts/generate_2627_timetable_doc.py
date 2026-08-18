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
VERSION = "2.5"
PREV_VERSION = "2.4"
STEM = "2627_timetable_scheme_v2.5"
STEM_TEACHERS = "2627_timetable_teachers_week_v2.5"
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

GRADES = ["S1", "S2", "S3", "S4", "S5", "S6"]
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
    "物理": "物理科",
    "生物": "生物科",
    "企會財": "企會財科",
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
# ver. 2.5：Christine 星期四兩班改星期五；其餘班別同 2.4。
CLASSES: list[tuple[int, int, str, str, str, str, str]] = [
    # Monday — Mark 矩尺連三；Katie 17E 連三；Christine 山案
    (0, 6, "矩尺座", "數學", "S1", "Mark Yu", "S1數A"),
    (0, 6, "17E", "中文", "S2", "Katie", "S2中B"),
    (0, 7, "矩尺座", "數學", "S5", "Mark Yu", "S5數B"),
    (0, 7, "17E", "中文", "S3", "Katie", "S3中E"),
    (0, 7, "山案座", "中文", "S6", "Christine Fan", "S6中B"),
    (0, 8, "矩尺座", "數學", "S4", "Mark Yu", "S4數B"),
    (0, 8, "17E", "中文", "S2", "Katie", "S2中E"),
    (0, 8, "山案座", "中文", "S5", "Christine Fan", "S5中C"),
    # Tuesday — Mark 矩尺連三；Katie 17E 連三
    (1, 6, "矩尺座", "數學", "S2", "Mark Yu", "S2數A"),
    (1, 6, "17E", "中文", "S3", "Katie", "S3中B"),
    (1, 7, "矩尺座", "數學", "S6", "Mark Yu", "S6數B"),
    (1, 7, "17E", "中文", "S1", "Katie", "S1中C"),
    (1, 8, "矩尺座", "數學", "S4", "Mark Yu", "S4數A"),
    (1, 8, "17E", "中文", "S2", "Katie", "S2中C"),
    # Wednesday — 無 Mark；Katie 留矩尺；Jackson 山案（不排 17D／17E）
    (2, 6, "矩尺座", "中文", "S1", "Katie", "S1中D"),
    (2, 7, "矩尺座", "中文", "S2", "Katie", "S2中D"),
    (2, 7, "山案座", "英文", "S5", "Jackson Lau", "S5英B"),
    (2, 8, "矩尺座", "中文", "S3", "Katie", "S3中C"),
    # Thursday — Mark 矩尺高中兩班；Katie 全日 17E（Christine 改星期五）
    (3, 6, "17E", "中文", "S3", "Katie", "S3中D"),
    (3, 7, "矩尺座", "數學", "S5", "Mark Yu", "S5數A"),
    (3, 7, "17E", "中文", "S1", "Katie", "S1中E"),
    (3, 8, "矩尺座", "數學", "S6", "Mark Yu", "S6數A"),
    (3, 8, "17E", "中文", "S1", "Katie", "S1中B"),
    # Friday — Judy 中五生物矩尺；Christine 山案連排（由星期四改排）
    (4, 7, "矩尺座", "生物", "S5", "Judy Chu", "S5生A"),
    (4, 7, "山案座", "中文", "S6", "Christine Fan", "S6中C"),
    (4, 8, "山案座", "中文", "S4", "Christine Fan", "S4中C"),
    # Saturday — Mark 矩尺（初中＋高中）；Jackson 矩尺 12:45；Leo 山案；Liam 17E
    (5, 1, "矩尺座", "數學", "S3", "Mark Yu", "S3數A"),
    (5, 1, "山案座", "數學", "S1", "Leo Chan", "S1數B"),
    (5, 2, "矩尺座", "數學", "S5", "Mark Yu", "S5數D"),
    (5, 2, "山案座", "物理", "S4", "Leo Chan", "S4物A"),
    (5, 3, "矩尺座", "英文", "S4", "Jackson Lau", "S4英B"),
    (5, 3, "山案座", "數學", "S2", "Leo Chan", "S2數C"),
    (5, 4, "矩尺座", "數學", "S6", "Mark Yu", "S6數D"),
    (5, 4, "17E", "數學", "S4", "Liam Lai", "S4數C"),
    (5, 5, "17E", "數學", "S5", "Liam Lai", "S5數C"),
    (5, 5, "山案座", "物理", "S6", "Leo Chan", "S6物A"),
    (5, 6, "山案座", "物理", "S5", "Leo Chan", "S5物A"),
    # Sunday — Katie 17E 五堂；Christine 矩尺三堂（取消中四A／中五B）；Cyndi 英仙；Emma 17D
    (6, 1, "17E", "中文", "S1", "Katie", "S1中A"),
    (6, 1, "英仙座", "英文", "S6", "Cyndi Ng", "S6英A"),
    (6, 1, "山案座", "數學", "S2", "Liam Lai", "S2數B"),
    (6, 2, "17E", "中文", "S2", "Katie", "S2中A"),
    (6, 2, "英仙座", "英文", "S5", "Cyndi Ng", "S5英A"),
    (6, 2, "山案座", "數學", "S3", "Liam Lai", "S3數B"),
    (6, 2, "17D", "生物", "S6", "Judy Chu", "S6生A"),
    (6, 3, "矩尺座", "中文", "S5", "Christine Fan", "S5中A"),
    (6, 3, "17D", "英文", "S2", "Emma Cai", "S2英A"),
    (6, 3, "山案座", "數學", "S1", "Leo Chan", "S1數C"),
    (6, 3, "17E", "生物", "S6", "Judy Chu", "S6生B"),
    (6, 4, "17E", "中文", "S3", "Katie", "S3中A"),
    (6, 4, "英仙座", "英文", "S4", "Cyndi Ng", "S4英A"),
    (6, 4, "山案座", "數學", "S6", "Leo Chan", "S6數C"),
    (6, 4, "17D", "英文", "S1", "Emma Cai", "S1英A"),
    (6, 5, "17E", "中文", "S2", "Katie", "S2中F"),
    (6, 5, "矩尺座", "中文", "S6", "Christine Fan", "S6中A"),
    (6, 5, "山案座", "數學", "S3", "Leo Chan", "S3數C"),
    (6, 6, "17E", "中文", "S1", "Katie", "S1中F"),
    (6, 6, "矩尺座", "中文", "S4", "Christine Fan", "S4中B"),
    (6, 6, "17D", "英文", "S3", "Emma Cai", "S3英A"),
    (6, 7, "山案座", "物理", "S5", "Leo Chan", "S5物B"),
    (6, 7, "17D", "英文", "S6", "Emma Cai", "S6英B"),
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
        11,
        "星期一、星期二、星期四、星期六",
        "兼職。必須星期六出勤；不排星期三、星期五、星期日。平日每日最多三班；週末每日最多五班。本版十一班：星期一、二連排三堂；星期四高中兩班；星期六三班（中三＋中五＋中六，12:45 矩尺予 Jackson 故空一格）。出勤日優先矩尺座。",
    ),
    (
        "Katie",
        "中文科",
        17,
        "星期一至星期四、星期日",
        "全職。放假星期五、星期六。平日 14:00 至最後一節；週末 09:00-18:00，中間一節食飯休息。本版十七班：星期一至四每日連排三堂；星期日五班（10:15 至 16:30，12:45 食飯休息）。老師附件：非上堂時間標空堂；放假日灰底。",
    ),
    (
        "Christine Fan",
        "中文科（中四級至中六級）",
        7,
        "星期一、星期五、星期日",
        "兼職。必須星期日出勤；不排星期六。本版星期四兩班改星期五（山案座連排 17:45 中六C、19:00 中四C）。取消星期日中四A（11:30）及中五B（19:00）；餘下星期日三班自 12:45 起。出勤日優先矩尺座或山案座。",
    ),
    (
        "Cyndi Ng",
        "英文科",
        3,
        "星期日",
        "兼職。只限星期日；小組班三班自 10:15 起；另預留一個一對一高中英文時段。",
    ),
    ("Jackson Lau", "英文科", 2, "星期三、星期六", "兼職。星期三一班、星期六一班。出勤日優先矩尺座或山案座，不排 17D／17E。"),
    (
        "Judy Chu",
        "生物科（中五級至中六級）",
        3,
        "星期五、星期日",
        "兼職。本版先排中六生物兩班、中五生物一班（另一位生物老師尚未回覆）。連堂最多兩堂，其後必須休息一節。星期日兩班中六因 11:30 僅 17D 有空，12:45 須換 17E。",
    ),
    (
        "Leo Chan",
        "數學科、物理科",
        9,
        "星期六、星期日",
        "兼職。本輪按「9 或以上」排九班（數學五、物理四）；星期四、五尚未確定，不排平日。可連續三堂。",
    ),
    (
        "Liam Lai",
        "數學科",
        4,
        "星期六、星期日",
        "兼職。本輪按「3–4」排四班數學；星期二、三尚未確定，不排該兩日。連堂上限兩堂。12 月中至 1 月頭或外出，屆時按校曆另議。",
    ),
    (
        "Emma Cai",
        "英文科",
        4,
        "星期日",
        "兼職。每周 3–4 班，四班集中星期日一天：12:45-14:00、14:00-15:15、休息一節、16:30-17:45、17:45-19:00。可連續三堂。",
    ),
]

# 本輪調查回覆（2026-08-15 至 17；既有專科老師路徑，無 C 區科目欄）
SURVEY_OVERVIEW = [
    ["老師", "科目（本輪）", "九月開班", "每周堂數", "已確定日子", "本輪已排"],
    ["Judy Chu", "生物（高中）", "願意", "3–4", "星期一、五、日", "3 班（日中六×2、五中五×1）"],
    ["Leo Chan", "數學、物理", "願意", "9 或以上", "星期六、日（全日可）", "9 班（六 5、日 4）"],
    ["Liam Lai", "數學", "願意", "3–4", "星期六、日", "4 班（六 2、日 2）"],
    ["Emma Cai", "英文", "願意", "3–4", "星期六、日（全日可）", "4 班（集中星期日）"],
    ["Natalie Kwok", "—", "暫不承接", "—", "—", "不排"],
    ["Rafael Ling", "企會財", "願意", "5–6", "無（完全未掌握）", "不排，待補時段"],
]

SURVEY_CONSTRAINTS = [
    ["老師", "尚未確定", "連堂", "備註"],
    [
        "Judy Chu",
        "星期三（預計 8 月 18 日）",
        "最多 2 堂；其後必須休息 1 節",
        "平日高中最早 17:45；一 19:00 不可故星期一無法排中五／中六（與現有數學／中文撞級）。日 14:00 起不可。本版星期日上午先排兩班中六生物。",
    ],
    [
        "Leo Chan",
        "星期四、五（預計 9 月 5 日）",
        "最多 3 堂；可連續編排",
        "一至三不可。本輪只用已確定週末，排滿九班。",
    ],
    [
        "Liam Lai",
        "星期二、三（預計 9 月 1 日）",
        "最多 2 堂；可連續編排",
        "六只用不空白且標「可」之時段。日 14:00 起不可。12 月中至 1 月頭或外出，屆時按校曆另議。",
    ],
    [
        "Emma Cai",
        "星期一至五（預計 8 月 20 日）",
        "最多 3 堂；可連續編排",
        "平日雖有部分「可」，日子標尚未確定，本版不排平日。四班集中星期日，不拆星期六。",
    ],
    [
        "Natalie Kwok",
        "—",
        "—",
        "想專注學業；私人課程仍會繼續。",
    ],
    [
        "Rafael Ling",
        "星期一至五（預計 8 月 25 日）；週末亦未填時段",
        "最多 3 堂；可連續編排",
        "時段確定後另開一輪，班數 5–6、年級平均分佈。",
    ],
]

SURVEY_SLOT_NOTES = [
    "時段選項：可／較不優先／不可／未確定。空白＝該格未填，本輪視作不可用。",
    "既有專科老師不填科目年級；科目由營運確認：Judy 生物、Leo 數學與物理、Liam 數學、Emma 英文、Rafael 企會財。",
    "現有 2026-08-12 方案 36 班及 Cyndi Ng 一對一預留全部保留，只在空格加班。",
]

PACKING_NOTES = [
    "同日順接只適用星期五、星期六、星期日；星期一至星期四不強制順接。",
    "中一級星期日：中文 10:15 → 數學 12:45 → 英文 14:00；另開 16:30 中文（F）。",
    "中二級星期日：數學 10:15 → 中文 11:30 → 英文 12:45；另開 15:15 中文（F）。",
    "中三級星期日：中文 14:00 → 數學 15:15 → 英文 16:30。",
    "中四級星期六：物理 11:30 → 英文 12:45 → 數學 14:00。",
    "中五級星期六：上午 11:30 數學（D）；下午 數學 15:15 → 物理 16:30。星期五：生物 17:45。",
    "星期五：中六中文 17:45、中四中文 19:00（Christine，山案座）；中五生物 17:45（Judy，矩尺座）。",
    "中六級星期六：數學 14:00（D）→ 物理 15:15。中六級星期日：英文 10:15 → 生物 11:30（A）；生物 12:45（B，平行班）；數學 14:00 → 中文 15:15 → 英文 17:45。",
    "Judy 先排中六生物兩班、中五生物一班；中四生物留待另一位生物老師。",
    "Emma 四班集中星期日；Rafael 企會財、Natalie 專科班、各人平日未確定檔期本版不佔格。",
    "Christine 星期日取消中四A（11:30）及中五B（19:00）。",
]

PRINCIPLES = [
    "適用學年為 2627（2026-09-01 至 2027-06-30），常規專科班，每周固定逢星期與時段。",
    "每節 75 分鐘。",
    "最遲一節為 19:00-20:15。",
    "不排 20:15-21:30。",
    "目前星期六、星期日不排 09:00-10:15。",
    "週末最早一節為 10:15-11:30。",
    "可用課室為 17D、17E、矩尺座、英仙座、山案座；17K 停用。",
    "平日 15:15-16:30 或之前為返學時間，不排常規班（詳表淺灰標示）。",
    "平日 16:30 起 17D 列作功課輔導班專用，常規班不使用 17D。",
    "平日年級時段：中一級至中三級自 16:30 起；中四級至中六級自 17:45 起。",
    "週末除 09:00 限制外，年級不限最早時段，仍禁止末節。",
    "同一老師、同一課室、同年級不同科目，同時段均不可重疊。",
    "連堂完全跟各老師問卷意願，不再統一規定「連兩節後必須空一格」。",
    "同日最多五節。",
    "兼職相鄰堂之間空檔最多一格；僅 Katie 可留較大空檔。",
    "每周堂數不多者，能同一天完成則不拆兩天。",
    "同一老師同一出勤日，班別盡量安排於同一課室。",
    "同日順接只適用星期五、星期六、星期日：同一年級該三日宜有不同科目連續時段順接，避免天地堂。星期一至星期四不強制順接。",
    "本輪按已回覆老師的每周堂數編排；同年級同科班數盡量平均，不以單一年級堆疊。",
    "Mark Yu 出勤日優先矩尺座；不排星期三、星期五、星期日。平日每日最多三班，週末每日最多五班。",
    "Katie 放假星期五、星期六；本版十七班。平日 14:00 至最後一節；週末 09:00-18:00（中間一節食飯休息）。星期一至四每日三班；星期日五班。",
    "Christine Fan 出勤日優先矩尺座或山案座；不排星期六；星期日班別不得早於 11:30。",
    "Christine Fan 本版出勤星期一、星期五、星期日；星期四兩班已改星期五。取消星期日中四A 及中五B。",
    "各天詳表最右欄為該時段空房數；返學時間或不排課之列計 0。",
    "Cyndi Ng 星期日小組班自 10:15 開始；同日另預留一個一對一高中英文時段。",
    "時間表不出現「待確認老師」。時段尚未掌握者不佔格，另列未排。",
    "Jackson Lau 出勤為星期三一班、星期六一班；優先矩尺座或山案座，不排 17D／17E。",
    "不預留三人開會空檔。",
]

VERSION_DIFFS = [
    "Christine Fan 星期四兩班改星期五：山案座 17:45 中六C、19:00 中四C；出勤改為星期一、星期五、星期日。",
    "各天詳表改為一日一頁、整表不拆開。",
    "平日 15:15-16:30 或之前淺灰標「返學時間」。",
    "各天詳表最右欄加該時段空房數。",
    "正文可列點者改列點。",
]

PENDING_NOTES = [
    "Judy Chu：意願 3–4 班，本版 3 班（中六×2、中五×1）；星期一無法排高中生物（與現有班撞級）。",
    "Rafael Ling：企會財，意願 5–6 班，時段完全未掌握（預計 8 月 25 日），本版不佔格。",
    "Natalie Kwok：暫不承接專科班。",
    "Emma／Leo／Liam 之平日尚未確定日子：確定後可再補班。",
    "英文科初中各 1 班、高中各 2 班；若平日檔期確認，宜優先補初中第二班。",
    "生物科尚無中四（留待另一位生物老師）；企會財尚未開班。",
    "Christine 中四／中五中文本版各 2 班（仍達每級 ≥2）；若要補回第三班另開下一版。",
    "Mark Yu 週末每日最多 5 班，本版星期六 3 班，仍可再加。",
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


def set_run_font(run, size_pt: float = 12, bold: bool = False, color: RGBColor | None = None) -> None:
    run.font.name = FONT_NAME_EA
    run._element.rPr.rFonts.set(qn("w:ascii"), FONT_NAME_EA)
    run._element.rPr.rFonts.set(qn("w:hAnsi"), FONT_NAME_EA)
    run._element.rPr.rFonts.set(qn("w:eastAsia"), FONT_NAME_EA)
    run.font.size = Pt(size_pt)
    run.font.bold = bold
    run.font.italic = False
    run.font.color.rgb = color if color is not None else RGBColor(0, 0, 0)


# 老師周視圖：指定不排日／放假（灰底，無斜線）
STAFF_OFF_DAYS = {
    "Katie": {4, 5},  # 星期五、星期六放假
    "Mark Yu": {2, 4, 6},  # 不排星期三、星期五、星期日
    "Christine Fan": {5},  # 不排星期六
}
STAFF_OFF_LABEL = {
    "Katie": "放假",
    "Mark Yu": "不排",
    "Christine Fan": "不排",
}
KATIE_OFF_DAYS = STAFF_OFF_DAYS["Katie"]
KATIE_WEEKDAY_DUTY_FIRST_SLOT = 4  # 14:00
KATIE_WEEKEND_DUTY_LAST_SLOT = 6  # 16:30–17:45（約至 18:00）
KATIE_WEEKEND_LUNCH_SLOT = 3  # 12:45–14:00
COLOR_MUTED = RGBColor(0x80, 0x80, 0x80)
FILL_FREE = "EDEDED"
FILL_OFF = "C0C0C0"


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


def add_para(doc: Document, text: str, *, size: float = 12, bold: bool = False, space_after: float = 6, keep_with_next: bool = False) -> None:
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
    p.paragraph_format.keep_with_next = keep_with_next
    run = p.add_run(text)
    set_run_font(run, size, bold)


def add_bullets(
    doc: Document,
    lines: list[str],
    *,
    size: float = 12,
    space_after: float = 4,
    keep_with_next: bool = False,
) -> None:
    for line in lines:
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.left_indent = Cm(0.4)
        p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
        p.paragraph_format.keep_with_next = keep_with_next
        run = p.add_run(f"• {line}")
        set_run_font(run, size)


def prevent_row_split(table) -> None:
    for row in table.rows:
        trPr = row._tr.get_or_add_trPr()
        cant = OxmlElement("w:cantSplit")
        trPr.append(cant)


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


def add_section_title(doc: Document, text: str, *, keep_with_next: bool = False) -> None:
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(8)
    p.paragraph_format.keep_with_next = keep_with_next
    run = p.add_run(text)
    set_run_font(run, 12, bold=True)
    rpr = run._element.get_or_add_rPr()
    rpr.append(OxmlElement("w:b"))
    rpr.append(OxmlElement("w:bCs"))


def shade_cell(cell, fill: str = "F0F0F0", *, stripe: bool = False, stripe_color: str = "666666") -> None:
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), fill)
    if stripe:
        shd.set(qn("w:val"), "thinDiagStripe")
        shd.set(qn("w:color"), stripe_color)
    else:
        shd.set(qn("w:val"), "clear")
    tcPr.append(shd)


def write_cell(
    cell,
    text: str,
    *,
    bold: bool = False,
    size: float = 12,
    color: RGBColor | None = None,
) -> None:
    cell.text = ""
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.space_before = Pt(0)
    run = p.add_run(text)
    set_run_font(run, size, bold, color=color)


CORE_SUBJECTS = ["中文", "英文", "數學"]
ELECTIVE_SUBJECTS = ["物理", "生物"]


def count_matrix() -> dict[str, dict[str, int]]:
    subjects = CORE_SUBJECTS + ELECTIVE_SUBJECTS
    m = {s: {g: 0 for g in GRADES} for s in subjects}
    for _, _, _, subj, grade, _, _ in CLASSES:
        if subj not in m:
            m[subj] = {g: 0 for g in GRADES}
        m[subj][grade] += 1
    return m


def count_matrix_table() -> list[list[str]]:
    """各級各科班數：最右欄各科合計、最下一行各級合計。"""
    matrix = count_matrix()
    subjects_order = CORE_SUBJECTS + ELECTIVE_SUBJECTS
    rows = [["科目", "中一級", "中二級", "中三級", "中四級", "中五級", "中六級", "合計"]]
    grade_totals = {g: 0 for g in GRADES}
    for subj in subjects_order:
        counts = [matrix[subj][g] for g in GRADES]
        for g, n in zip(GRADES, counts):
            grade_totals[g] += n
        rows.append([SUBJECT_FULL[subj]] + [str(n) for n in counts] + [str(sum(counts))])
    grand = sum(grade_totals[g] for g in GRADES)
    rows.append(["合計"] + [str(grade_totals[g]) for g in GRADES] + [str(grand)])
    return rows


def subject_grade_class_tables() -> list[tuple[str, list[tuple[str, list[list[str]]]]]]:
    """按科目、其後按年級列出全部小組班。空年級略過。"""
    grouped: dict[str, dict[str, list[tuple[int, int, str, str, str]]]] = defaultdict(
        lambda: defaultdict(list)
    )
    for d, slot, room, subj, grade, teacher, code in CLASSES:
        grouped[subj][grade].append((d, slot, room, teacher, code))
    out: list[tuple[str, list[tuple[str, list[list[str]]]]]] = []
    for subj in CORE_SUBJECTS + ELECTIVE_SUBJECTS:
        grade_blocks: list[tuple[str, list[list[str]]]] = []
        for grade in GRADES:
            items = grouped.get(subj, {}).get(grade, [])
            if not items:
                continue
            items.sort(key=lambda x: (class_section_letter(x[4]), x[0], x[1]))
            rows = [["班別", "任教老師", "星期", "時段", "課室"]]
            for d, slot, room, teacher, code in items:
                rows.append(
                    [
                        class_title(grade, subj, code),
                        teacher,
                        DAYS[d],
                        SLOT_TIMES[slot],
                        room,
                    ]
                )
            grade_blocks.append((GRADE_FULL[grade], rows))
        if grade_blocks:
            out.append((SUBJECT_FULL[subj], grade_blocks))
    return out


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


WEEKDAY_SCHOOL_LAST_SLOT = 5  # 15:15-16:30 及之前
FILL_SCHOOL = "EDEDED"
MUTED_LABELS = {"返學時間", "不排課"}


def cover_notes() -> list[str]:
    return [
        "本文件為規劃方案紀錄，供營運審閱",
        "內容以排課規則為準，尚未寫入正式班別與排程",
        f"本版為 ver. {VERSION}；ver. {PREV_VERSION} 檔案保留不動",
    ]


def day_notes(day_idx: int) -> list[str]:
    if day_idx >= 5:
        notes = [
            "週末",
            "五室皆可排常規班",
            "最遲 19:00-20:15",
            "本日不排 09:00-10:15",
        ]
    else:
        notes = [
            "平日",
            "15:15-16:30 或之前為返學時間（淺灰）",
            "16:30 起 17D 為功課輔導班專用",
            "最遲 19:00-20:15",
        ]
    if day_idx == 4:
        notes.append("本版不預留開會空檔")
        notes.append("Christine Fan：中六級中文科（C) 17:45、中四級中文科（C) 19:00，山案座")
    if day_idx == 6:
        notes.append("Christine Fan 本版自 12:45 起（已取消 11:30 中四A 及 19:00 中五B）")
        notes.append("Cyndi Ng 小組班自 10:15 起，並預留一個一對一高中英文時段")
    return notes


def day_grid(day_idx: int) -> list[list[str]]:
    header = ["時段"] + ROOMS + ["空房"]
    grid = [header]
    is_weekday = day_idx <= 4
    is_weekend = day_idx >= 5
    for s, label in enumerate(SLOT_TIMES):
        row = [label]
        school_hours = is_weekday and s <= WEEKDAY_SCHOOL_LAST_SLOT
        empty = 0
        for room in ROOMS:
            if is_weekend and s == 0:
                row.append("不排課")
                continue
            if school_hours:
                row.append("返學時間")
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
            if cell:
                row.append(cell)
            else:
                empty += 1
                row.append("—")
        if (is_weekend and s == 0) or school_hours:
            row.append("0")
        else:
            row.append(str(empty))
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
    run = sub.add_run("2627 學年常規專科班時間表")
    set_run_font(run, 12, bold=True)

    meta = doc.add_paragraph()
    meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = meta.add_run(f"方案紀錄 ver. {VERSION}｜對照 ver. {PREV_VERSION}｜未定稿入庫")
    set_run_font(run, 12)

    add_bullets(doc, cover_notes())
    add_para(doc, f"與 ver. {PREV_VERSION} 之分別", size=12, bold=True, space_after=6)
    add_bullets(doc, VERSION_DIFFS)

    # 一
    add_chapter(doc, "一、排程原則", first=False)
    add_bullets(doc, PRINCIPLES)

    # 二
    add_chapter(doc, "二、本輪老師回覆（2026-08-15 至 17）")
    add_bullets(
        doc,
        [
            "以下整理調查表各人意願",
            "科目欄為營運確認，非表格 C 區自填（既有專科老師不經 C 區）",
        ],
    )
    add_bullets(doc, SURVEY_SLOT_NOTES)
    t_s1 = doc.add_table(rows=len(SURVEY_OVERVIEW), cols=len(SURVEY_OVERVIEW[0]))
    t_s1.style = "Table Grid"
    for i, row_vals in enumerate(SURVEY_OVERVIEW):
        for j, val in enumerate(row_vals):
            write_cell(t_s1.rows[i].cells[j], val, bold=(i == 0), size=10)
            if i == 0:
                shade_cell(t_s1.rows[i].cells[j])
    add_section_title(doc, "檔期與連堂約束")
    t_s2 = doc.add_table(rows=len(SURVEY_CONSTRAINTS), cols=len(SURVEY_CONSTRAINTS[0]))
    t_s2.style = "Table Grid"
    for i, row_vals in enumerate(SURVEY_CONSTRAINTS):
        for j, val in enumerate(row_vals):
            write_cell(t_s2.rows[i].cells[j], val, bold=(i == 0), size=10)
            if i == 0:
                shade_cell(t_s2.rows[i].cells[j])
    add_section_title(doc, "本版學生順接（星期五、六、日）")
    add_bullets(doc, PACKING_NOTES)

    # 三
    add_chapter(doc, "三、各員工出勤日、班數、科目")
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
    add_bullets(
        doc,
        [
            f"已排小組班合計 {len(CLASSES)} 班",
            f"另預留時段 {len(RESERVED)} 個",
            "全部為具名老師，無待確認老師",
        ],
        space_after=4,
    )

    # 四
    add_chapter(doc, "四、各級各科班數")
    add_bullets(
        doc,
        [
            "下表為各級各科已排小組班數",
            "最右欄為各科合計",
            "最下一行為各級合計",
            "不含一對一預留",
        ],
    )
    mdata = count_matrix_table()
    t2 = doc.add_table(rows=len(mdata), cols=len(mdata[0]))
    t2.style = "Table Grid"
    last_row = len(mdata) - 1
    last_col = len(mdata[0]) - 1
    for i, row_vals in enumerate(mdata):
        for j, val in enumerate(row_vals):
            is_head = i == 0
            is_total = i == last_row or j == last_col
            write_cell(t2.rows[i].cells[j], val, bold=(is_head or is_total), size=12)
            if is_head or i == last_row:
                shade_cell(t2.rows[i].cells[j])

    # 五
    add_chapter(doc, "五、各科各級班別")
    add_bullets(doc, ["以下按科目、其後按年級列出全部已排小組班", "一對一預留見章末"])
    for subj_full, grade_blocks in subject_grade_class_tables():
        add_section_title(doc, subj_full)
        for grade_full, rows in grade_blocks:
            add_para(doc, grade_full, size=12, bold=True, space_after=6)
            tg = doc.add_table(rows=len(rows), cols=len(rows[0]))
            tg.style = "Table Grid"
            for i, row_vals in enumerate(rows):
                for j, val in enumerate(row_vals):
                    write_cell(tg.rows[i].cells[j], val, bold=(i == 0), size=10)
                    if i == 0:
                        shade_cell(tg.rows[i].cells[j])
    if RESERVED:
        add_section_title(doc, "預留時段（不計小組班）")
        for d, slot, room, teacher, title in RESERVED:
            add_para(
                doc,
                f"{title}｜{teacher}｜{DAYS[d]} {SLOT_TIMES[slot]}｜{room}",
                size=12,
                space_after=4,
            )

    # 六
    add_chapter(doc, "六、未排與待補")
    add_bullets(
        doc,
        [
            "本輪按老師已確定檔期與每周堂數編排",
            "同年級同科盡量平均",
            "以下為仍待下一輪者",
        ],
    )
    add_bullets(doc, PENDING_NOTES)
    add_bullets(doc, ["不以「待確認老師」佔用課室格"])

    # 七
    add_chapter(doc, "七、一周時間表")
    add_bullets(doc, ["以下按星期與時段列出全部已排班", "各天課室詳表見下一章"])
    overview = weekly_summary_rows()
    t3 = doc.add_table(rows=len(overview), cols=len(overview[0]))
    t3.style = "Table Grid"
    for i, row_vals in enumerate(overview):
        for j, val in enumerate(row_vals):
            write_cell(t3.rows[i].cells[j], val, bold=(i == 0), size=12)
            if i == 0:
                shade_cell(t3.rows[i].cells[j])

    # 八
    add_chapter(doc, "八、各天詳細時間表")
    add_bullets(
        doc,
        [
            "每日一頁、整表不拆開",
            "平日 15:15-16:30 或之前淺灰標返學時間",
            "最右欄為該時段空房數",
        ],
    )
    for day_idx, day_name in enumerate(DAYS):
        add_page_break(doc)
        add_section_title(doc, day_name, keep_with_next=True)
        add_bullets(doc, day_notes(day_idx), keep_with_next=True)
        grid = day_grid(day_idx)
        td = doc.add_table(rows=len(grid), cols=len(grid[0]))
        td.style = "Table Grid"
        last_col = len(grid[0]) - 1
        for i, row_vals in enumerate(grid):
            for j, val in enumerate(row_vals):
                muted = val in MUTED_LABELS
                write_cell(
                    td.rows[i].cells[j],
                    val,
                    bold=(i == 0 or j == 0 or j == last_col),
                    size=9 if i else 12,
                    color=COLOR_MUTED if muted else None,
                )
                if i == 0:
                    shade_cell(td.rows[i].cells[j])
                elif muted:
                    shade_cell(td.rows[i].cells[j], FILL_SCHOOL)
                if j == last_col:
                    td.rows[i].cells[j].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        prevent_row_split(td)

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
    from reportlab.platypus import Flowable, KeepTogether, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

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
    styles.add(
        ParagraphStyle(
            name="BWTableMuted",
            fontName=font_name,
            fontSize=9,
            leading=12,
            alignment=TA_CENTER,
            textColor=colors.Color(0.5, 0.5, 0.5),
        )
    )

    def P(text: str, style: str = "BWBody") -> Paragraph:
        return Paragraph(str(text).replace("\n", "<br/>"), styles[style])

    def chapter(text: str) -> BoldTitle:
        return BoldTitle(text)

    def bw_table(
        data: list[list],
        col_widths: list[float],
        header: bool = True,
        footer: bool = False,
    ) -> Table:
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
        if footer:
            cmds.append(("BACKGROUND", (0, -1), (-1, -1), colors.Color(0.94, 0.94, 0.94)))
        t.setStyle(TableStyle(cmds))
        return t

    def bullets(lines: list[str]) -> None:
        for line in lines:
            story.append(P(f"• {line}"))

    def day_grid_table(data: list[list[str]]) -> Table:
        last = len(data[0]) - 1
        styled = []
        gray = colors.Color(0.93, 0.93, 0.93)
        cmds = [
            ("FONTNAME", (0, 0), (-1, -1), font_name),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.black),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("BACKGROUND", (0, 0), (-1, 0), colors.Color(0.94, 0.94, 0.94)),
            ("ALIGN", (last, 0), (last, -1), "CENTER"),
            ("LEFTPADDING", (0, 0), (-1, -1), 3),
            ("RIGHTPADDING", (0, 0), (-1, -1), 3),
            ("TOPPADDING", (0, 0), (-1, -1), 2),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
        ]
        for i, row in enumerate(data):
            srow = []
            for j, val in enumerate(row):
                if val in MUTED_LABELS:
                    srow.append(Paragraph(str(val).replace("\n", "<br/>"), styles["BWTableMuted"]))
                    cmds.append(("BACKGROUND", (j, i), (j, i), gray))
                    cmds.append(("VALIGN", (j, i), (j, i), "MIDDLE"))
                else:
                    srow.append(P(val, "BWTableHeader" if i == 0 else "BWTable"))
            styled.append(srow)
        t = Table(
            styled,
            colWidths=[2.0 * cm] + [2.5 * cm] * 5 + [1.3 * cm],
            repeatRows=0,
            splitByRow=0,
        )
        t.setStyle(TableStyle(cmds))
        return t

    doc = SimpleDocTemplate(
        str(path),
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title="2627 學年常規專科班時間表",
        author="明學教育",
    )
    story: list = []
    story.append(P("明學教育", "BWCenter"))
    story.append(P("2627 學年常規專科班時間表", "BWCenter"))
    story.append(P(f"方案紀錄 ver. {VERSION}｜對照 ver. {PREV_VERSION}｜未定稿入庫", "BWCenter"))
    bullets(cover_notes())
    story.append(P(f"與 ver. {PREV_VERSION} 之分別"))
    bullets(VERSION_DIFFS)

    story.append(PageBreak())
    story.append(chapter("一、排程原則"))
    bullets(PRINCIPLES)

    story.append(PageBreak())
    story.append(chapter("二、本輪老師回覆（2026-08-15 至 17）"))
    bullets(
        [
            "以下整理調查表各人意願",
            "科目欄為營運確認，非表格 C 區自填（既有專科老師不經 C 區）",
        ]
    )
    bullets(SURVEY_SLOT_NOTES)
    story.append(bw_table(SURVEY_OVERVIEW, [2.4 * cm, 2.6 * cm, 2.2 * cm, 2.2 * cm, 3.6 * cm, 3.2 * cm]))
    story.append(Spacer(1, 8))
    story.append(chapter("檔期與連堂約束"))
    story.append(bw_table(SURVEY_CONSTRAINTS, [2.6 * cm, 3.8 * cm, 3.4 * cm, 6.4 * cm]))
    story.append(Spacer(1, 8))
    story.append(chapter("本版學生順接（星期五、六、日）"))
    bullets(PACKING_NOTES)

    story.append(PageBreak())
    story.append(chapter("三、各員工出勤日、班數、科目"))
    staff_data = [["老師", "班數", "科目", "出勤日", "備註"]]
    for name, subject, n, days, note in STAFF:
        staff_data.append([name, str(n), subject, days, note])
    story.append(bw_table(staff_data, [2.8 * cm, 1.2 * cm, 2.8 * cm, 4.2 * cm, 6.2 * cm]))
    story.append(Spacer(1, 8))
    bullets(
        [
            f"已排小組班合計 {len(CLASSES)} 班",
            f"另預留時段 {len(RESERVED)} 個",
            "全部為具名老師，無待確認老師",
        ]
    )

    story.append(PageBreak())
    story.append(chapter("四、各級各科班數"))
    bullets(
        [
            "下表為各級各科已排小組班數",
            "最右欄為各科合計",
            "最下一行為各級合計",
            "不含一對一預留",
        ]
    )
    mdata = count_matrix_table()
    story.append(bw_table(mdata, [2.0 * cm] + [1.8 * cm] * 6 + [2.0 * cm], footer=True))

    story.append(PageBreak())
    story.append(chapter("五、各科各級班別"))
    bullets(["以下按科目、其後按年級列出全部已排小組班", "一對一預留見章末"])
    list_widths = [4.0 * cm, 3.2 * cm, 2.2 * cm, 2.8 * cm, 2.0 * cm]
    for subj_full, grade_blocks in subject_grade_class_tables():
        story.append(Spacer(1, 8))
        story.append(chapter(subj_full))
        for grade_full, rows in grade_blocks:
            story.append(
                KeepTogether(
                    [
                        P(grade_full),
                        bw_table(rows, list_widths),
                    ]
                )
            )
            story.append(Spacer(1, 6))
    if RESERVED:
        story.append(Spacer(1, 8))
        story.append(chapter("預留時段（不計小組班）"))
        for d, slot, room, teacher, title in RESERVED:
            story.append(P(f"• {title}｜{teacher}｜{DAYS[d]} {SLOT_TIMES[slot]}｜{room}"))

    story.append(PageBreak())
    story.append(chapter("六、未排與待補"))
    bullets(
        [
            "本輪按老師已確定檔期與每周堂數編排",
            "同年級同科盡量平均",
            "以下為仍待下一輪者",
        ]
    )
    bullets(PENDING_NOTES)
    bullets(["不以「待確認老師」佔用課室格"])

    story.append(PageBreak())
    story.append(chapter("七、一周時間表"))
    bullets(["以下按星期與時段列出全部已排班及預留時段", "各天課室詳表見下一章"])
    story.append(bw_table(weekly_summary_rows(), [2.2 * cm, 2.6 * cm, 2.0 * cm, 5.2 * cm, 3.2 * cm]))

    story.append(PageBreak())
    story.append(chapter("八、各天詳細時間表"))
    bullets(
        [
            "每日一頁、整表不拆開",
            "平日 15:15-16:30 或之前淺灰標返學時間",
            "最右欄為該時段空房數",
        ]
    )
    for day_idx, day_name in enumerate(DAYS):
        block = [chapter(day_name)]
        for n in day_notes(day_idx):
            block.append(P(f"• {n}"))
        block.append(day_grid_table(day_grid(day_idx)))
        story.append(PageBreak())
        story.append(KeepTogether(block))

    story.append(P("— 完 —"))
    doc.build(story)


def validate() -> None:
    assert len(CLASSES) == 60, len(CLASSES)
    matrix_rows = count_matrix_table()
    assert int(matrix_rows[-1][-1]) == len(CLASSES)
    listed = sum(len(rows) - 1 for _, blocks in subject_grade_class_tables() for _, rows in blocks)
    assert listed == len(CLASSES)
    teachers = {c[5] for c in CLASSES}
    assert "待確認老師" not in teachers
    assert "Natalie Kwok" not in teachers
    assert "Rafael Ling" not in teachers
    assert "Cyndi" not in teachers  # full name Cyndi Ng
    t_busy: dict = defaultdict(list)
    r_busy: dict = defaultdict(list)
    g_busy: dict = defaultdict(list)
    for d, s, room, subj, grade, teacher, code in CLASSES:
        t_busy[(d, s)].append(teacher)
        r_busy[(d, s, room)].append(code)
        g_busy[(d, s, grade)].append(subj)
        if d <= 4:
            if grade in {"S1", "S2", "S3"}:
                assert s >= 6, (code, s)
            if grade in {"S4", "S5", "S6"}:
                assert s >= 7, (code, s)
            assert room != "17D", code
        if d >= 5:
            assert s >= 1
        assert s <= 8
        if teacher == "Judy Chu":
            assert subj == "生物" and grade in {"S5", "S6"}
        if teacher == "Emma Cai":
            assert subj == "英文" and d == 6
        if teacher == "Jackson Lau":
            assert room in {"矩尺座", "山案座"}
        if teacher == "Mark Yu":
            assert room == "矩尺座"
        if teacher == "Christine Fan":
            assert room in {"矩尺座", "山案座"}
        if teacher == "Liam Lai":
            assert subj == "數學"
        if teacher == "Leo Chan":
            assert subj in {"數學", "物理"}
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
    for teacher, days in (("Mark Yu", (0, 1)), ("Katie", (0, 1, 2, 3))):
        for d in days:
            slots = sorted(c[1] for c in CLASSES if c[5] == teacher and c[0] == d)
            assert slots == [6, 7, 8], (teacher, d, slots)
    mark_thu = sorted(c[1] for c in CLASSES if c[5] == "Mark Yu" and c[0] == 3)
    assert mark_thu == [7, 8]
    mark_thu_grades = {c[4] for c in CLASSES if c[5] == "Mark Yu" and c[0] == 3}
    assert mark_thu_grades <= {"S4", "S5", "S6"}
    mark_sat = sorted(c[1] for c in CLASSES if c[5] == "Mark Yu" and c[0] == 5)
    assert mark_sat == [1, 2, 4]
    assert {c[4] for c in CLASSES if c[5] == "Mark Yu" and c[0] == 5} == {"S3", "S5", "S6"}
    mark_per_day: dict[int, int] = defaultdict(int)
    for d, _s, _r, _subj, _g, teacher, _c in CLASSES:
        if teacher == "Mark Yu":
            mark_per_day[d] += 1
    for d, n in mark_per_day.items():
        if d <= 4:
            assert n <= 3, (d, n)
        else:
            assert n <= 5, (d, n)
    assert sum(1 for c in CLASSES if c[5] == "Katie") == 17
    assert sorted(c[1] for c in CLASSES if c[5] == "Katie" and c[0] == 6) == [1, 2, 4, 5, 6]
    assert sorted(c[1] for c in CLASSES if c[5] == "Christine Fan" and c[0] == 6) == [3, 5, 6]
    assert {c[0] for c in CLASSES if c[5] == "Christine Fan"} == {0, 4, 6}
    assert sorted(c[1] for c in CLASSES if c[5] == "Christine Fan" and c[0] == 4) == [7, 8]
    assert {c[4] for c in CLASSES if c[5] == "Christine Fan" and c[0] == 4} == {"S4", "S6"}
    assert all(c[2] == "山案座" for c in CLASSES if c[5] == "Christine Fan" and c[0] == 4)
    assert not any(c[0] == 3 and c[5] == "Christine Fan" for c in CLASSES)
    for d in range(7):
        grid = day_grid(d)
        assert grid[0][-1] == "空房"
        for ri, row in enumerate(grid[1:], start=1):
            assert row[-1].isdigit(), (d, ri, row[-1])
            slot = ri - 1
            if d <= 4 and slot <= WEEKDAY_SCHOOL_LAST_SLOT:
                assert row[1] == "返學時間"
                assert row[-1] == "0"
            if d >= 5 and slot == 0:
                assert row[-1] == "0"
    assert not any(c[6] in {"S4中A", "S5中B"} for c in CLASSES)
    assert len(RESERVED) == 1 and RESERVED[0][4].startswith("一對一高中英文科")
    rooms = defaultdict(set)
    for d, _, room, _, _, teacher, _ in CLASSES:
        rooms[(teacher, d)].add(room)
    for d, _, room, teacher, _ in RESERVED:
        rooms[(teacher, d)].add(room)
    for k, rs in rooms.items():
        if k == ("Judy Chu", 6):
            continue  # 星期日 11:30 僅 17D 有空，12:45 須換房
        assert len(rs) == 1, (k, rs)
    for name, _subject, n, _days, _note in STAFF:
        actual = sum(1 for c in CLASSES if c[5] == name)
        assert actual == n, (name, actual, n)
    allow_three = {
        ("Mark Yu", 0),
        ("Mark Yu", 1),
        ("Katie", 0),
        ("Katie", 1),
        ("Katie", 2),
        ("Katie", 3),
        ("Katie", 6),
        ("Leo Chan", 5),
        ("Leo Chan", 6),
    }
    by_td: dict[tuple[str, int], list[int]] = defaultdict(list)
    for d, s, _r, _subj, _g, teacher, _c in CLASSES:
        by_td[(teacher, d)].append(s)
    for d, s, _r, teacher, _t in RESERVED:
        by_td[(teacher, d)].append(s)
    for (teacher, d), slots in by_td.items():
        slots = sorted(slots)
        assert len(slots) <= 5, (teacher, d, slots)
        if teacher != "Katie":
            for a, b in zip(slots, slots[1:]):
                assert b - a <= 2, (teacher, d, slots)
        run = 1
        max_run = 1
        for a, b in zip(slots, slots[1:]):
            if b == a + 1:
                run += 1
                max_run = max(max_run, run)
            else:
                run = 1
        limit = 3 if (teacher, d) in allow_three else 2
        assert max_run <= limit, (teacher, d, slots, max_run)
    assert sorted(c[1] for c in CLASSES if c[5] == "Leo Chan" and c[0] == 5) == [1, 2, 3, 5, 6]
    assert sorted(c[1] for c in CLASSES if c[5] == "Leo Chan" and c[0] == 6) == [3, 4, 5, 7]
    assert sorted(c[1] for c in CLASSES if c[5] == "Liam Lai" and c[0] == 5) == [4, 5]
    assert sorted(c[1] for c in CLASSES if c[5] == "Liam Lai" and c[0] == 6) == [1, 2]
    assert sorted(c[1] for c in CLASSES if c[5] == "Emma Cai" and c[0] == 6) == [3, 4, 6, 7]
    assert not any(c[0] == 5 and c[5] == "Emma Cai" for c in CLASSES)
    judy_grades = sorted(c[4] for c in CLASSES if c[5] == "Judy Chu")
    assert judy_grades == ["S5", "S6", "S6"]
    katie_grid = teacher_week_grid("Katie")
    assert katie_grid[1][5] == ("放假", "off")
    assert katie_grid[1][6] == ("放假", "off")
    assert katie_grid[4][7] == ("食飯休息", "lunch")
    assert katie_grid[5][1] == ("空堂", "free")  # 星期一 14:00
    mark_grid = teacher_week_grid("Mark Yu")
    assert mark_grid[1][3] == ("不排", "off")  # 星期三
    assert mark_grid[1][5] == ("不排", "off")  # 星期五
    assert mark_grid[1][7] == ("不排", "off")  # 星期日
    christine_grid = teacher_week_grid("Christine Fan")
    assert christine_grid[1][6] == ("不排", "off")  # 星期六
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


def katie_week_kind(day: int, slot: int, has_class: bool) -> str:
    """Katie 周視圖格類型：off / class / lunch / free / empty。"""
    if day in KATIE_OFF_DAYS:
        return "off"
    if has_class:
        return "class"
    if day <= 4:
        return "free" if slot >= KATIE_WEEKDAY_DUTY_FIRST_SLOT else "empty"
    if slot == KATIE_WEEKEND_LUNCH_SLOT:
        return "lunch"
    if slot <= KATIE_WEEKEND_DUTY_LAST_SLOT:
        return "free"
    return "empty"


def teacher_week_grid(teacher: str) -> list[list[tuple[str, str]]]:
    """University-style week view: rows = slots, columns = days.

    Each cell is (text, kind) where kind is header / time / class / empty /
    free / lunch / off / blocked.
    """
    cells: dict[tuple[int, int], str] = {}
    for d, slot, room, subj, grade, name, code in CLASSES:
        if name == teacher:
            cells[(d, slot)] = f"{class_title(grade, subj, code)}\n{room}"
    for d, slot, room, name, title in RESERVED:
        if name == teacher:
            cells[(d, slot)] = f"{title}\n{room}"

    off_days = STAFF_OFF_DAYS.get(teacher, set())
    off_label = STAFF_OFF_LABEL.get(teacher, "不排")
    header: list[tuple[str, str]] = [("時段", "header")]
    for di, day in enumerate(DAYS):
        header.append((day, "off" if di in off_days else "header"))
    grid: list[list[tuple[str, str]]] = [header]
    for s, time_label in enumerate(SLOT_TIMES):
        row: list[tuple[str, str]] = [(time_label, "time")]
        for d in range(7):
            if d in off_days:
                row.append((off_label, "off"))
                continue
            text = cells.get((d, s))
            if teacher == "Katie":
                kind = katie_week_kind(d, s, text is not None)
                if kind == "class":
                    row.append((text or "", "class"))
                elif kind == "lunch":
                    row.append(("食飯休息", "lunch"))
                elif kind == "free":
                    row.append(("空堂", "free"))
                else:
                    row.append(("—", "empty"))
            elif d >= 5 and s == 0:
                row.append(("不排課", "blocked"))
            elif text:
                row.append((text, "class"))
            else:
                row.append(("—", "empty"))
        grid.append(row)
    return grid


def week_view_legend(name: str) -> str | None:
    if name == "Katie":
        return "圖例：淺灰「空堂」＝當值但非上堂；「食飯休息」＝週末中間一節；灰底「放假」＝全日放假。"
    if name in STAFF_OFF_DAYS:
        return "圖例：灰底「不排」＝指定不排日全日。"
    return None


def apply_week_cell_docx(cell, text: str, kind: str, *, header_like: bool) -> None:
    muted = kind in {"free", "lunch", "off"}
    write_cell(
        cell,
        text,
        bold=header_like or kind == "off",
        size=8,
        color=COLOR_MUTED if muted else None,
    )
    if kind in {"free", "lunch", "off"}:
        cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
    if kind in {"header", "time"}:
        shade_cell(cell)
    elif kind in {"free", "lunch"}:
        shade_cell(cell, FILL_FREE)
    elif kind == "off":
        shade_cell(cell, FILL_OFF)


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
    run = meta.add_run(f"獨立附件｜對應方案紀錄 ver. {VERSION}｜未定稿入庫")
    set_run_font(run, 12)

    add_bullets(
        doc,
        [
            "本文件獨立於全校課室時間表，只按老師列出一周職務",
            "每位老師先列一周總覽，周視圖另頁（橫軸星期、縱軸時段）",
            "班別名稱與時段寫法與方案紀錄一致",
            "指定不排日（Katie 放假五／六；Mark 不排三／五／日；Christine 不排六）於周視圖以灰底標示",
            "Katie 另標空堂與食飯休息",
        ],
    )

    for i, (name, subject, n, days, note) in enumerate(STAFF):
        add_chapter(doc, f"{name}", first=(i == 0))
        reserved_n = sum(1 for _d, _s, _r, teacher, _t in RESERVED if teacher == name)
        load = f"小組班：{n} 班"
        if reserved_n:
            load += f"；預留時段：{reserved_n} 個"
        add_bullets(
            doc,
            [
                f"科目：{subject}",
                load,
                teacher_hours_text(n),
                f"出勤日：{days}",
                note,
            ],
        )

        add_para(doc, "一周總覽", size=12, bold=True, space_after=6, keep_with_next=True)
        overview = teacher_week_rows(name)
        t = doc.add_table(rows=len(overview), cols=4)
        t.style = "Table Grid"
        for ri, row_vals in enumerate(overview):
            for j, val in enumerate(row_vals):
                write_cell(t.rows[ri].cells[j], val, bold=(ri == 0), size=12)
                if ri == 0:
                    shade_cell(t.rows[ri].cells[j])
        prevent_row_split(t)

        # 周視圖獨立一頁
        add_page_break(doc)
        add_para(doc, f"{name}｜周視圖", size=12, bold=True, space_after=6, keep_with_next=True)
        add_para(doc, f"科目：{subject}；{teacher_hours_text(n)}", size=12, space_after=8, keep_with_next=True)
        legend = week_view_legend(name)
        if legend:
            add_para(doc, legend, size=12, space_after=8, keep_with_next=True)
        grid = teacher_week_grid(name)
        tg = doc.add_table(rows=len(grid), cols=len(grid[0]))
        tg.style = "Table Grid"
        for ri, row_vals in enumerate(grid):
            for j, (val, kind) in enumerate(row_vals):
                apply_week_cell_docx(tg.rows[ri].cells[j], val, kind, header_like=(ri == 0 or j == 0))
        prevent_row_split(tg)

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
    from reportlab.platypus import Flowable, KeepTogether, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

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
    story.append(P(f"獨立附件｜對應方案紀錄 ver. {VERSION}｜未定稿入庫", "BWCenter"))
    story.append(
        P("• 本文件獨立於全校課室時間表，只按老師列出一周職務")
    )
    story.append(P("• 每位老師先列一周總覽，周視圖另頁（橫軸星期、縱軸時段）"))
    story.append(P("• 班別名稱與時段寫法與方案紀錄一致"))
    story.append(P("• 指定不排日（Katie 放假五／六；Mark 不排三／五／日；Christine 不排六）於周視圖以灰底標示"))
    story.append(P("• Katie 另標空堂與食飯休息"))

    for i, (name, subject, n, days, note) in enumerate(STAFF):
        story.append(PageBreak())
        story.append(BoldTitle(name))
        reserved_n = sum(1 for _d, _s, _r, teacher, _t in RESERVED if teacher == name)
        load = f"小組班：{n} 班"
        if reserved_n:
            load += f"；預留時段：{reserved_n} 個"
        story.append(P(f"• 科目：{subject}"))
        story.append(P(f"• {load}"))
        story.append(P(f"• {teacher_hours_text(n)}"))
        story.append(P(f"• 出勤日：{days}"))
        story.append(P(f"• {note}"))
        story.append(Spacer(1, 6))
        story.append(BoldTitle("一周總覽"))
        story.append(bw_table(teacher_week_rows(name), [3.2 * cm, 3.2 * cm, 2.8 * cm, 7.0 * cm]))

        # 周視圖獨立一頁
        story.append(PageBreak())
        legend = week_view_legend(name)
        # Landscape A4 usable width ≈ 26.7cm with 1.5cm margins.
        week_widths = [2.6 * cm] + [3.3 * cm] * 7
        styles_small = ParagraphStyle(
            name=f"BWTableSmall_{i}",
            fontName=font_name,
            fontSize=8,
            leading=10,
            textColor=colors.black,
        )
        styles_muted = ParagraphStyle(
            name=f"BWTableMuted_{i}",
            fontName=font_name,
            fontSize=8,
            leading=10,
            alignment=TA_CENTER,
            textColor=colors.Color(0.5, 0.5, 0.5),
        )

        def Psmall(text: str, style=styles_small) -> Paragraph:
            return Paragraph(str(text).replace("\n", "<br/>"), style)

        grid = teacher_week_grid(name)
        styled = []
        cmds = [
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
        for ri, row in enumerate(grid):
            srow = []
            for ci, (text, kind) in enumerate(row):
                if kind == "off":
                    srow.append(Paragraph(text, styles_muted))
                    cmds.append(("BACKGROUND", (ci, ri), (ci, ri), colors.Color(0.75, 0.75, 0.75)))
                    cmds.append(("ALIGN", (ci, ri), (ci, ri), "CENTER"))
                    cmds.append(("VALIGN", (ci, ri), (ci, ri), "MIDDLE"))
                elif kind in {"free", "lunch"}:
                    srow.append(Paragraph(text, styles_muted))
                    cmds.append(("BACKGROUND", (ci, ri), (ci, ri), colors.Color(0.93, 0.93, 0.93)))
                    cmds.append(("ALIGN", (ci, ri), (ci, ri), "CENTER"))
                    cmds.append(("VALIGN", (ci, ri), (ci, ri), "MIDDLE"))
                else:
                    srow.append(Psmall(text))
            styled.append(srow)
        wt = Table(styled, colWidths=week_widths, repeatRows=0, splitByRow=0)
        wt.setStyle(TableStyle(cmds))
        week_block = [
            BoldTitle(f"{name}｜周視圖"),
            P(f"科目：{subject}；{teacher_hours_text(n)}"),
        ]
        if legend:
            week_block.append(P(legend))
        week_block.append(Spacer(1, 6))
        week_block.append(wt)
        story.append(KeepTogether(week_block))

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
