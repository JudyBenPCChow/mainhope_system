#!/usr/bin/env python3
"""Generate a monthly homework-tutoring duty calendar PDF.

Layout follows the teacher「我的當值」month grid: weekday headers 日–六,
room cards (17D green / 17E blue), names, hours, handover arrows.

Live:
  python3 scripts/generate_homework_duty_month_pdf.py
  python3 scripts/generate_homework_duty_month_pdf.py --month 2026-09
  python3 scripts/generate_homework_duty_month_pdf.py --data docs/generated/2627/2627_HOMEWORK_DUTY_2026-09.json

Requires production access via SUPABASE_SERVICE_ROLE_KEY, or
`supabase login` / SUPABASE_ACCESS_TOKEN for `supabase db query --linked`.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import tempfile
from calendar import monthrange
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Mapping, Sequence
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
SQL_FILE = ROOT / "scripts" / "sql" / "homework_duty_month.sql"
FONT_DIR = ROOT / "scripts" / ".fonts"
FONT_FILE = FONT_DIR / "WQYMicroHei.ttf"
WQY_TTC = Path("/usr/share/fonts/truetype/wqy/wqy-microhei.ttc")
MINGLIU_TTC_CANDIDATES = [
    Path("/Applications/Microsoft Word.app/Contents/Resources/DFonts/mingliu.ttc"),
    Path("/Applications/Microsoft Word.app/Contents/Resources/OtherFonts/mingliu.ttc"),
]
HK_TZ = ZoneInfo("Asia/Hong_Kong")
WEEK_HEADERS = ("日", "一", "二", "三", "四", "五", "六")
DEFAULT_ROOM_A = "17D"
DEFAULT_ROOM_B = "17E"
AY_MIN = "2026-09"
AY_MAX = "2027-06"
AY_LABEL = "2627"

# UI tokens (src/index.css :root)
INFO = (0.329, 0.569, 0.851)  # utility-blue-500
SUCCESS = (0.090, 0.631, 0.420)  # utility-green-500
WARNING = (0.980, 0.549, 0.063)  # utility-orange-500
INK = (0.08, 0.08, 0.10)
MUTED = (0.40, 0.40, 0.43)
BORDER = (0.82, 0.82, 0.84)
CARD_BG = (1.0, 1.0, 1.0)


def tint(rgb: tuple[float, float, float], alpha: float, bg: tuple[float, float, float] = (1.0, 1.0, 1.0)) -> tuple[float, float, float]:
    return tuple(bg[i] * (1.0 - alpha) + rgb[i] * alpha for i in range(3))  # type: ignore[return-value]


CELL_OPEN = tint(INFO, 0.15)
CELL_CLOSED = tint((0.55, 0.56, 0.58), 0.18)
HEADER_BG = tint((0.55, 0.56, 0.58), 0.12)
TAG_D_BG = tint(SUCCESS, 0.22)
TAG_E_BG = tint(INFO, 0.22)


def load_env_file() -> dict[str, str]:
    path = ROOT / ".env"
    out: dict[str, str] = {}
    if not path.is_file():
        return out
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        out[key.strip()] = value.strip().strip("'").strip('"')
    return out


def env(name: str) -> str:
    return (os.environ.get(name) or load_env_file().get(name) or "").strip()


def validate_year_month(raw: str) -> str:
    ym = raw.strip()[:7]
    if not re.fullmatch(r"\d{4}-\d{2}", ym):
        raise SystemExit(f"月份須為 YYYY-MM，收到：{raw}")
    month = int(ym[5:7])
    if month < 1 or month > 12:
        raise SystemExit(f"無效月份：{raw}")
    return ym


def default_year_month(today: date | None = None) -> str:
    """Align with teacher「我的當值」: clamp calendar month into 2627 9–6."""
    now = today or datetime.now(HK_TZ).date()
    ym = f"{now.year}-{now.month:02d}"
    if ym < AY_MIN:
        return AY_MIN
    if ym > AY_MAX:
        return AY_MAX
    return ym


def month_start_end(year_month: str) -> tuple[date, date]:
    year = int(year_month[:4])
    month = int(year_month[5:7])
    start = date(year, month, 1)
    last = monthrange(year, month)[1]
    return start, date(year, month, last)


def format_year_month_label(year_month: str) -> str:
    return f"{int(year_month[:4])}年{int(year_month[5:7])}月"


def hm(value: Any, fallback: str = "15:30") -> str:
    text = str(value or "").strip()
    sliced = text[:5]
    if re.fullmatch(r"\d{2}:\d{2}", sliced):
        return sliced
    return fallback


def as_room(value: Any) -> str:
    text = str(value or "").strip()
    return text or DEFAULT_ROOM_A


def hours_between(start: str, end: str) -> float:
    sh, sm = (int(x) for x in hm(start).split(":"))
    eh, em = (int(x) for x in hm(end, "19:30").split(":"))
    mins = (eh * 60 + em) - (sh * 60 + sm)
    return round(max(0, mins) / 60.0, 2)


def js_weekday(d: date) -> int:
    """Sunday = 0, matching the on-screen month grid."""
    return (d.weekday() + 1) % 7


def ensure_cjk_font() -> Path:
    FONT_DIR.mkdir(parents=True, exist_ok=True)
    if FONT_FILE.exists() and FONT_FILE.stat().st_size > 100_000:
        return FONT_FILE
    from fontTools.ttLib import TTCollection

    source = next((p for p in MINGLIU_TTC_CANDIDATES if p.exists()), None)
    index = 1 if source is not None else 0
    if source is None:
        source = WQY_TTC if WQY_TTC.exists() else None
        index = 0
    if source is None:
        raise FileNotFoundError(
            "找不到中文字型（新細明體 mingliu.ttc 或文泉驛微米黑）。"
        )
    collection = TTCollection(str(source))
    collection.fonts[index].save(str(FONT_FILE))
    return FONT_FILE


def parse_cli_json(raw: str) -> Any:
    text = raw.strip()
    if not text:
        raise ValueError("empty")
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    start = text.find("{")
    end = text.rfind("}")
    if start >= 0 and end > start:
        return json.loads(text[start : end + 1])
    raise ValueError(text[:400])


def unwrap_payload(data: Any) -> dict[str, Any]:
    if isinstance(data, dict) and "days" in data:
        return data
    if isinstance(data, dict) and "payload" in data:
        inner = data["payload"]
        if isinstance(inner, str):
            inner = json.loads(inner)
        if isinstance(inner, dict):
            return inner
    if isinstance(data, list) and data:
        row = data[0]
        if isinstance(row, dict):
            if "payload" in row:
                inner = row["payload"]
                if isinstance(inner, str):
                    inner = json.loads(inner)
                if isinstance(inner, dict):
                    return inner
            if "days" in row:
                return row
            if len(row) == 1:
                only = next(iter(row.values()))
                if isinstance(only, dict) and "days" in only:
                    return only
                if isinstance(only, str):
                    parsed = json.loads(only)
                    if isinstance(parsed, dict) and "days" in parsed:
                        return parsed
    raise ValueError(f"無法解析編更 JSON：{type(data)}")


def sql_for_month(year_month: str) -> str:
    start, _ = month_start_end(year_month)
    iso = start.isoformat()
    sql = SQL_FILE.read_text(encoding="utf-8")
    return sql.replace("date '2026-09-01'", f"date '{iso}'")


def fetch_via_supabase_cli(year_month: str) -> dict[str, Any] | None:
    supabase = shutil.which("supabase")
    if not supabase:
        local = Path.home() / ".local" / "bin" / "supabase"
        supabase = str(local) if local.is_file() else None
    sql_text = sql_for_month(year_month)
    with tempfile.NamedTemporaryFile("w", suffix=".sql", delete=False, encoding="utf-8") as tmp:
        tmp.write(sql_text)
        tmp_path = tmp.name
    try:
        if supabase:
            cmd = [supabase, "db", "query", "--linked", "-f", tmp_path]
        else:
            cmd = ["npx", "--yes", "supabase", "db", "query", "--linked", "-f", tmp_path]
        completed = subprocess.run(
            cmd,
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
            env={
                **os.environ,
                "PATH": os.environ.get("PATH", "") + os.pathsep + str(Path.home() / ".local" / "bin"),
            },
        )
    finally:
        Path(tmp_path).unlink(missing_ok=True)
    combined = (completed.stdout or "") + "\n" + (completed.stderr or "")
    if completed.returncode != 0:
        if "Access token not provided" in combined or "LegacyPlatformAuthRequiredError" in combined:
            return None
        raise SystemExit(combined.strip() or "supabase db query failed")
    try:
        payload = unwrap_payload(parse_cli_json(completed.stdout))
    except (ValueError, json.JSONDecodeError) as exc:
        raise SystemExit(f"supabase 查詢結果無法解析：{exc}") from exc
    payload["source"] = "supabase db query --linked"
    return payload


def rest_get(
    url: str, key: str, path: str, params: Mapping[str, str] | Sequence[tuple[str, str]]
) -> Any:
    query = urlencode(list(params.items()) if isinstance(params, Mapping) else params)
    req = Request(
        f"{url.rstrip('/')}{path}?{query}",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Accept": "application/json",
        },
        method="GET",
    )
    try:
        with urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise SystemExit(f"REST {path} HTTP {exc.code}: {body[:500]}") from exc
    except URLError as exc:
        raise SystemExit(f"REST {path} 連線失敗：{exc}") from exc


def fetch_via_service_role(year_month: str) -> dict[str, Any] | None:
    key = env("SUPABASE_SERVICE_ROLE_KEY")
    url = env("VITE_SUPABASE_URL") or env("SUPABASE_URL")
    if not key or not url:
        return None
    start, end = month_start_end(year_month)
    next_month = (end + timedelta(days=1)).isoformat()
    years = rest_get(url, key, "/rest/v1/academic_years", {"label": "eq.2627", "select": "id,label", "limit": "1"})
    if not years:
        raise SystemExit("production 找不到 2627 學年")
    year_id = str(years[0]["id"])
    rosters = rest_get(
        url,
        key,
        "/rest/v1/homework_tutoring_roster_months",
        {
            "academic_year_id": f"eq.{year_id}",
            "roster_month": f"eq.{start.isoformat()}",
            "select": "id,status,roster_month,published_at",
            "limit": "1",
        },
    )
    roster = rosters[0] if rosters else None
    closures = rest_get(
        url,
        key,
        "/rest/v1/homework_tutoring_calendar_closures",
        [
            ("academic_year_id", f"eq.{year_id}"),
            ("closure_date", f"gte.{start.isoformat()}"),
            ("closure_date", f"lt.{next_month}"),
            ("select", "closure_date,name"),
            ("order", "closure_date.asc"),
        ],
    )
    days_raw: list[dict[str, Any]] = []
    if roster:
        days_raw = rest_get(
            url,
            key,
            "/rest/v1/homework_tutoring_duty_days",
            {
                "roster_month_id": f"eq.{roster['id']}",
                "select": (
                    "id,duty_date,session_start,session_end,holiday_label,"
                    "secondary_room,primary_room,secondary_teacher_id,primary_teacher_id,"
                    "homework_tutoring_duty_assignments(teacher_id,session_start,session_end,room,sort_order)"
                ),
                "order": "duty_date.asc",
            },
        )
    teacher_ids: set[str] = set()
    for row in days_raw:
        if row.get("secondary_teacher_id"):
            teacher_ids.add(str(row["secondary_teacher_id"]))
        if row.get("primary_teacher_id"):
            teacher_ids.add(str(row["primary_teacher_id"]))
        for a in row.get("homework_tutoring_duty_assignments") or []:
            if a.get("teacher_id"):
                teacher_ids.add(str(a["teacher_id"]))
    names: dict[str, str] = {}
    if teacher_ids:
        id_list = ",".join(teacher_ids)
        teachers = rest_get(
            url,
            key,
            "/rest/v1/teachers",
            {"id": f"in.({id_list})", "select": "id,full_name"},
        )
        for t in teachers:
            names[str(t["id"])] = str(t.get("full_name") or "—").strip() or "—"

    def teacher_name(tid: Any) -> str:
        if not tid:
            return "—"
        return names.get(str(tid), "—")

    days: list[dict[str, Any]] = []
    for row in days_raw:
        nested = row.get("homework_tutoring_duty_assignments") or []
        assignments: list[dict[str, Any]]
        if nested:
            assignments = [
                {
                    "teacher": teacher_name(a.get("teacher_id")),
                    "start": hm(a.get("session_start")),
                    "end": hm(a.get("session_end"), "19:30"),
                    "room": as_room(a.get("room")),
                    "sortOrder": int(a.get("sort_order") or 0),
                }
                for a in nested
            ]
            assignments.sort(key=lambda a: (a["sortOrder"], a["start"], a["room"], a["teacher"]))
        else:
            assignments = []
            if row.get("secondary_teacher_id"):
                assignments.append(
                    {
                        "teacher": teacher_name(row.get("secondary_teacher_id")),
                        "start": hm(row.get("session_start")),
                        "end": hm(row.get("session_end"), "19:30"),
                        "room": as_room(row.get("secondary_room")),
                        "sortOrder": 0,
                    }
                )
            if row.get("primary_teacher_id"):
                assignments.append(
                    {
                        "teacher": teacher_name(row.get("primary_teacher_id")),
                        "start": hm(row.get("session_start")),
                        "end": hm(row.get("session_end"), "19:30"),
                        "room": as_room(row.get("primary_room") or DEFAULT_ROOM_B),
                        "sortOrder": 1,
                    }
                )
        days.append(
            {
                "isoDate": str(row.get("duty_date") or "")[:10],
                "holiday": row.get("holiday_label"),
                "secondaryRoom": row.get("secondary_room"),
                "primaryRoom": row.get("primary_room"),
                "start": hm(row.get("session_start")),
                "end": hm(row.get("session_end"), "19:30"),
                "assignments": assignments,
            }
        )
    return {
        "yearMonth": year_month,
        "academicYearLabel": AY_LABEL,
        "rosterStatus": str((roster or {}).get("status") or "未編更"),
        "publishedAt": (roster or {}).get("published_at"),
        "closures": [
            {"isoDate": str(c.get("closure_date") or "")[:10], "label": str(c.get("name") or "放假")}
            for c in closures
        ],
        "days": days,
        "source": "supabase REST (service_role)",
    }


def fetch_live(year_month: str) -> dict[str, Any]:
    payload = fetch_via_service_role(year_month)
    if payload is not None:
        return payload
    payload = fetch_via_supabase_cli(year_month)
    if payload is not None:
        return payload
    raise SystemExit(
        "無法讀取 production 編更：請在環境設定 SUPABASE_SERVICE_ROLE_KEY，"
        "或 `supabase login`／SUPABASE_ACCESS_TOKEN 後重跑。"
        "亦可先把查詢結果存成 JSON，再用 --data 產出。"
    )


def room_a(day: dict[str, Any] | None) -> str:
    if not day:
        return DEFAULT_ROOM_A
    return str(day.get("secondaryRoom") or "").strip() or DEFAULT_ROOM_A


def is_second_open(day: dict[str, Any] | None) -> bool:
    return bool(str((day or {}).get("primaryRoom") or "").strip())


def opened_rooms(day: dict[str, Any]) -> list[str]:
    a = room_a(day)
    if not is_second_open(day):
        return [a]
    b = str(day.get("primaryRoom") or "").strip() or DEFAULT_ROOM_B
    return [a] if b == a else [a, b]


def idle_label(day: dict[str, Any], room: str) -> str:
    return "暫時空缺" if room == room_a(day) else "不啟用此課室"


def room_cards(day: dict[str, Any] | None) -> list[dict[str, Any]]:
    """Mirror homeworkDutyRoomCards: always show 17D + 17E on open weekdays."""
    if not day or day.get("holiday"):
        return []
    people = list(day.get("assignments") or [])
    people.sort(key=lambda a: (hm(a.get("start")), as_room(a.get("room")), str(a.get("teacher") or "")))
    rooms = list(opened_rooms(day))
    if not is_second_open(day) and DEFAULT_ROOM_B not in rooms:
        rooms.append(DEFAULT_ROOM_B)
    for person in people:
        room = as_room(person.get("room"))
        if room not in rooms:
            rooms.append(room)
    return [
        {"room": room, "assignments": [p for p in people if as_room(p.get("room")) == room]}
        for room in rooms
    ]


def build_cells(payload: dict[str, Any]) -> list[dict[str, Any] | None]:
    year_month = str(payload["yearMonth"])
    start, end = month_start_end(year_month)
    holiday_by_iso = {
        str(c.get("isoDate") or "")[:10]: str(c.get("label") or "放假")
        for c in payload.get("closures") or []
        if str(c.get("isoDate") or "")[:10]
    }
    days_by_iso = {
        str(d.get("isoDate") or "")[:10]: d
        for d in payload.get("days") or []
        if str(d.get("isoDate") or "")[:10]
    }
    pad = js_weekday(start)
    cells: list[dict[str, Any] | None] = [None] * pad
    cursor = start
    while cursor <= end:
        iso = cursor.isoformat()
        duty = days_by_iso.get(iso)
        holiday = (duty or {}).get("holiday") or holiday_by_iso.get(iso)
        wd = js_weekday(cursor)
        weekend = wd in (0, 6) and not holiday
        cells.append(
            {
                "day": cursor.day,
                "iso": iso,
                "weekdayChar": WEEK_HEADERS[wd],
                "holiday": holiday,
                "weekend": weekend,
                "open": not weekend and not holiday,
                "duty": duty,
            }
        )
        cursor += timedelta(days=1)
    while len(cells) % 7:
        cells.append(None)
    return cells


def assignment_rows(payload: dict[str, Any], cells: list[dict[str, Any] | None]) -> list[tuple[str, str, str, str, str]]:
    rows: list[tuple[str, str, str, str, str]] = []
    for cell in cells:
        if not cell or not cell["open"]:
            continue
        weekday = f"星期{cell['weekdayChar']}"
        cards = room_cards(cell.get("duty"))
        if not cards:
            rows.append((cell["iso"], weekday, "—", "未排", "—"))
            continue
        wrote = False
        for card in cards:
            people = card["assignments"]
            if not people:
                label = idle_label(cell["duty"] or {}, card["room"])
                if label == "不啟用此課室":
                    continue
                rows.append((cell["iso"], weekday, card["room"], label, "—"))
                wrote = True
                continue
            for person in people:
                rows.append(
                    (
                        cell["iso"],
                        weekday,
                        card["room"],
                        str(person.get("teacher") or "—"),
                        f"{hm(person.get('start'))}–{hm(person.get('end'), '19:30')}",
                    )
                )
                wrote = True
        if not wrote:
            rows.append((cell["iso"], weekday, "—", "未排", "—"))
    return rows


def teacher_hours(payload: dict[str, Any]) -> list[tuple[str, int, float]]:
    hours: dict[str, float] = defaultdict(float)
    days: dict[str, set[str]] = defaultdict(set)
    for day in payload.get("days") or []:
        if day.get("holiday"):
            continue
        iso = str(day.get("isoDate") or "")[:10]
        for person in day.get("assignments") or []:
            name = str(person.get("teacher") or "").strip()
            if not name or name == "—":
                continue
            hours[name] += hours_between(hm(person.get("start")), hm(person.get("end"), "19:30"))
            days[name].add(iso)
    out = [(name, len(days[name]), round(hours[name], 2)) for name in hours]
    out.sort(key=lambda r: (-r[2], -r[1], r[0]))
    return out


def round_rect(c: Any, x: float, y: float, w: float, h: float, r: float, fill: tuple[float, float, float], stroke: tuple[float, float, float] | None) -> None:
    c.saveState()
    c.setFillColorRGB(*fill)
    if stroke:
        c.setStrokeColorRGB(*stroke)
        c.setLineWidth(0.4)
        c.roundRect(x, y, w, h, r, fill=1, stroke=1)
    else:
        c.setStrokeColorRGB(*fill)
        c.roundRect(x, y, w, h, r, fill=1, stroke=0)
    c.restoreState()


def draw_arrow(c: Any, x: float, y: float) -> None:
    c.saveState()
    c.setFillColorRGB(*INK)
    path = c.beginPath()
    path.moveTo(x, y + 3.2)
    path.lineTo(x + 3.4, y + 3.2)
    path.lineTo(x + 1.7, y)
    path.close()
    c.drawPath(path, fill=1, stroke=0)
    c.restoreState()


def fit_text(c: Any, text: str, font: str, max_size: float, min_size: float, max_width: float) -> float:
    size = max_size
    while size > min_size and c.stringWidth(text, font, size) > max_width:
        size -= 0.4
    return size


def draw_tag(c: Any, x: float, y: float, room: str, font: str) -> None:
    bg = TAG_D_BG if room == DEFAULT_ROOM_A else TAG_E_BG
    fg = SUCCESS if room == DEFAULT_ROOM_A else INFO
    label_w = c.stringWidth(room, font, 6.2) + 6
    round_rect(c, x, y, label_w, 8.2, 2.2, bg, None)
    c.setFillColorRGB(*fg)
    c.setFont(font, 6.2)
    c.drawCentredString(x + label_w / 2, y + 2.1, room)


def draw_room_card(c: Any, x: float, y: float, w: float, h: float, card: dict[str, Any], day: dict[str, Any], font: str) -> None:
    round_rect(c, x, y, w, h, 3.2, CARD_BG, BORDER)
    room = card["room"]
    tag_w = c.stringWidth(room, font, 6.2) + 6
    draw_tag(c, x + w - tag_w - 3, y + h - 10.2, room, font)
    people = card["assignments"]
    inner_w = w - 8
    if not people:
        c.setFillColorRGB(*MUTED)
        c.setFont(font, 6.4)
        c.drawString(x + 4, y + max(2.2, h / 2 - 2), idle_label(day, room)[:18])
        return
    n = len(people)
    name_size = 7.6 if n == 1 else 6.6
    hours_size = 6.0 if n == 1 else 5.5
    block = name_size + hours_size + 3.0
    gap = 7.0 if n > 1 else 0
    content_h = n * block + (n - 1) * gap
    cursor_y = y + h - 12
    if content_h > h - 13:
        scale = (h - 13) / content_h
        name_size = max(5.2, name_size * scale)
        hours_size = max(4.8, hours_size * scale)
        block = name_size + hours_size + 2.2
        gap = 6.0
        content_h = n * block + (n - 1) * gap
        cursor_y = y + h - 11.5
    for i, person in enumerate(people):
        if i > 0:
            draw_arrow(c, x + 5, cursor_y - 1.8)
            cursor_y -= gap
        name = str(person.get("teacher") or "—")
        hours = f"{hm(person.get('start'))}–{hm(person.get('end'), '19:30')}"
        size = fit_text(c, name, font, name_size, 5.0, inner_w - 2)
        c.setFillColorRGB(*INK)
        c.setFont(font, size)
        c.drawString(x + 4, cursor_y - size + 1, name)
        c.setFillColorRGB(0.35, 0.35, 0.38)
        c.setFont(font, hours_size)
        c.drawString(x + 4, cursor_y - size - hours_size + 0.4, hours)
        cursor_y -= block


def draw_calendar_page(c: Any, payload: dict[str, Any], cells: list[dict[str, Any] | None], font: str, as_of: str) -> None:
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.units import mm

    width, height = landscape(A4)
    margin = 10 * mm
    title = f"功課輔導班當值　{format_year_month_label(str(payload['yearMonth']))}"
    status = str(payload.get("rosterStatus") or "未編更")
    c.setFillColorRGB(*INK)
    c.setFont(font, 14)
    c.drawString(margin, height - 12 * mm, "明學教育")
    c.setFont(font, 16)
    c.drawString(margin, height - 19 * mm, title)
    c.setFont(font, 8)
    c.setFillColorRGB(*MUTED)
    c.drawRightString(width - margin, height - 12 * mm, f"{AY_LABEL}　狀態：{status}")
    c.drawRightString(width - margin, height - 16.5 * mm, f"資料截至 {as_of}（production 編更表）")
    c.setFont(font, 7.5)
    c.drawString(
        margin,
        height - 25 * mm,
        "對齊老師「我的當值」月曆：一格一日；綠標 17D、藍標 17E；同房多人由上而下為交接。淡藍＝平日開課，灰＝週末／放假。",
    )

    grid_top = height - 29 * mm
    grid_bottom = 12 * mm
    grid_left = margin
    grid_right = width - margin
    cols = 7
    rows = max(1, len(cells) // 7)
    cell_w = (grid_right - grid_left) / cols
    header_h = 7 * mm
    cell_h = (grid_top - grid_bottom - header_h) / rows

    c.setFillColorRGB(*HEADER_BG)
    c.rect(grid_left, grid_top - header_h, grid_right - grid_left, header_h, fill=1, stroke=0)
    c.setStrokeColorRGB(*BORDER)
    c.setLineWidth(0.5)
    c.rect(grid_left, grid_top - header_h, grid_right - grid_left, header_h, fill=0, stroke=1)
    c.setFillColorRGB(*MUTED)
    c.setFont(font, 8)
    for i, label in enumerate(WEEK_HEADERS):
        c.drawCentredString(grid_left + (i + 0.5) * cell_w, grid_top - header_h + 2.4 * mm, label)

    for idx, cell in enumerate(cells):
        col = idx % 7
        row = idx // 7
        x = grid_left + col * cell_w
        y = grid_top - header_h - (row + 1) * cell_h
        if cell is None:
            c.setFillColorRGB(0.97, 0.97, 0.97)
            c.rect(x, y, cell_w, cell_h, fill=1, stroke=0)
        elif not cell["open"]:
            c.setFillColorRGB(*CELL_CLOSED)
            c.rect(x, y, cell_w, cell_h, fill=1, stroke=0)
        else:
            c.setFillColorRGB(*CELL_OPEN)
            c.rect(x, y, cell_w, cell_h, fill=1, stroke=0)
        c.setStrokeColorRGB(*BORDER)
        c.setLineWidth(0.4)
        c.rect(x, y, cell_w, cell_h, fill=0, stroke=1)
        if cell is None:
            continue
        c.setFillColorRGB(*INK)
        c.setFont(font, 9)
        c.drawString(x + 2.5 * mm, y + cell_h - 5.2 * mm, str(cell["day"]))
        if cell["holiday"]:
            c.setFillColorRGB(*MUTED)
            c.setFont(font, 7)
            c.drawString(x + 2.5 * mm, y + cell_h - 9 * mm, "放假")
            label = str(cell["holiday"])
            size = fit_text(c, label, font, 6.5, 5.2, cell_w - 5 * mm)
            c.setFont(font, size)
            c.drawString(x + 2.5 * mm, y + cell_h - 13 * mm, label)
        elif cell["weekend"]:
            c.setFillColorRGB(*MUTED)
            c.setFont(font, 7)
            c.drawString(x + 2.5 * mm, y + cell_h - 9 * mm, "週末")
        else:
            cards = room_cards(cell.get("duty"))
            if not cards:
                c.setFillColorRGB(*MUTED)
                c.setFont(font, 7)
                c.drawString(x + 2.5 * mm, y + cell_h - 9 * mm, "未排")
                continue
            pad = 1.4 * mm
            top = y + cell_h - 5.6 * mm
            usable = top - (y + pad)
            weights = [0.8 if not card["assignments"] else 0.55 + 1.05 * len(card["assignments"]) for card in cards]
            total_w = sum(weights) or 1
            gap = pad * 0.55
            avail = usable - gap * (len(cards) - 1)
            heights = [avail * w / total_w for w in weights]
            cy = top
            for card, card_h in zip(cards, heights, strict=True):
                cy -= card_h
                draw_room_card(
                    c,
                    x + pad,
                    cy,
                    cell_w - 2 * pad,
                    card_h,
                    card,
                    cell.get("duty") or {},
                    font,
                )
                cy -= gap


def draw_table_page(
    c: Any,
    payload: dict[str, Any],
    rows: list[tuple[str, str, str, str, str]],
    hours: list[tuple[str, int, float]],
    font: str,
    as_of: str,
) -> None:
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.units import mm

    width, height = landscape(A4)
    margin = 12 * mm
    c.setFillColorRGB(*INK)
    c.setFont(font, 13)
    c.drawString(margin, height - 14 * mm, f"每日當值一覽　{format_year_month_label(str(payload['yearMonth']))}")
    c.setFillColorRGB(*MUTED)
    c.setFont(font, 8)
    c.drawRightString(width - margin, height - 14 * mm, f"資料截至 {as_of}")

    headers = ("日期", "星期", "課室", "導師", "時段")
    col_w = [38 * mm, 18 * mm, 22 * mm, 70 * mm, 32 * mm]
    table_left = margin
    row_h = 7.2 * mm
    header_y = height - 22 * mm

    def draw_header(y: float) -> None:
        c.setFillColorRGB(*HEADER_BG)
        c.rect(table_left, y, sum(col_w), row_h, fill=1, stroke=0)
        c.setStrokeColorRGB(*BORDER)
        c.rect(table_left, y, sum(col_w), row_h, fill=0, stroke=1)
        c.setFillColorRGB(*INK)
        c.setFont(font, 8)
        x = table_left
        for i, label in enumerate(headers):
            c.drawString(x + 2 * mm, y + 2.2 * mm, label)
            x += col_w[i]

    y = header_y
    draw_header(y)
    y -= row_h
    for i, row in enumerate(rows):
        if y < 18 * mm:
            c.showPage()
            c.setFillColorRGB(*INK)
            c.setFont(font, 13)
            c.drawString(margin, height - 14 * mm, f"每日當值一覽（續）　{format_year_month_label(str(payload['yearMonth']))}")
            y = height - 22 * mm
            draw_header(y)
            y -= row_h
        if i % 2 == 1:
            c.setFillColorRGB(0.97, 0.98, 0.99)
            c.rect(table_left, y, sum(col_w), row_h, fill=1, stroke=0)
        c.setStrokeColorRGB(*BORDER)
        c.setLineWidth(0.3)
        c.rect(table_left, y, sum(col_w), row_h, fill=0, stroke=1)
        c.setFillColorRGB(*INK)
        c.setFont(font, 8)
        x = table_left
        for j, value in enumerate(row):
            c.drawString(x + 2 * mm, y + 2.2 * mm, value)
            x += col_w[j]
        y -= row_h

    y -= 8 * mm
    if y < 40 * mm:
        c.showPage()
        y = height - 18 * mm
    c.setFillColorRGB(*INK)
    c.setFont(font, 12)
    c.drawString(margin, y, "本月工時（跟編更時段加總；放假日不計）")
    y -= 8 * mm
    h_headers = ("導師", "當值日數", "工時")
    h_w = [70 * mm, 28 * mm, 28 * mm]
    c.setFillColorRGB(*HEADER_BG)
    c.rect(margin, y, sum(h_w), row_h, fill=1, stroke=0)
    c.setStrokeColorRGB(*BORDER)
    c.rect(margin, y, sum(h_w), row_h, fill=0, stroke=1)
    c.setFillColorRGB(*INK)
    c.setFont(font, 8)
    x = margin
    for i, label in enumerate(h_headers):
        c.drawString(x + 2 * mm, y + 2.2 * mm, label)
        x += h_w[i]
    y -= row_h
    if not hours:
        c.setFillColorRGB(*MUTED)
        c.setFont(font, 8)
        c.drawString(margin + 2 * mm, y + 2.2 * mm, "本月尚未指派當值導師。")
        return
    for i, (name, n_days, n_hours) in enumerate(hours):
        if y < 14 * mm:
            c.showPage()
            y = height - 18 * mm
        if i % 2 == 1:
            c.setFillColorRGB(0.97, 0.98, 0.99)
            c.rect(margin, y, sum(h_w), row_h, fill=1, stroke=0)
        c.setStrokeColorRGB(*BORDER)
        c.setLineWidth(0.3)
        c.rect(margin, y, sum(h_w), row_h, fill=0, stroke=1)
        c.setFillColorRGB(*INK)
        c.setFont(font, 8)
        c.drawString(margin + 2 * mm, y + 2.2 * mm, name)
        c.drawRightString(margin + h_w[0] + h_w[1] - 2 * mm, y + 2.2 * mm, str(n_days))
        c.drawRightString(margin + sum(h_w) - 2 * mm, y + 2.2 * mm, f"{n_hours:g}")
        y -= row_h


def build_pdf(path: Path, payload: dict[str, Any], font_path: Path, as_of: str) -> None:
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.pdfgen import canvas

    pdfmetrics.registerFont(TTFont("DutyCJK", str(font_path)))
    font = "DutyCJK"
    cells = build_cells(payload)
    rows = assignment_rows(payload, cells)
    hours = teacher_hours(payload)
    path.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(path), pagesize=landscape(A4))
    c.setTitle(f"明學教育 功課輔導班當值 {format_year_month_label(str(payload['yearMonth']))}")
    c.setAuthor("明學教育")
    draw_calendar_page(c, payload, cells, font, as_of)
    c.showPage()
    draw_table_page(c, payload, rows, hours, font, as_of)
    c.save()


def snapshot_path(year_month: str, suffix: str) -> Path:
    return ROOT / "docs" / "generated" / "2627" / f"2627_HOMEWORK_DUTY_{year_month}{suffix}"


def main() -> None:
    parser = argparse.ArgumentParser(description="產出功輔當值月視圖 PDF")
    parser.add_argument("--month", help="YYYY-MM；預設跟老師「我的當值」把今日夾入 2627 學年")
    parser.add_argument("--data", help="已查好的 JSON（略過 live 查庫）")
    parser.add_argument("--output", help="PDF 路徑")
    args = parser.parse_args()

    as_of = datetime.now(HK_TZ).strftime("%Y-%m-%d %H:%M")
    if args.data:
        raw = json.loads(Path(args.data).read_text(encoding="utf-8"))
        payload = unwrap_payload(raw)
        year_month = validate_year_month(str(payload.get("yearMonth") or args.month or default_year_month()))
        payload["yearMonth"] = year_month
        payload.setdefault("source", str(args.data))
    else:
        year_month = validate_year_month(args.month or default_year_month())
        payload = fetch_live(year_month)
        payload["yearMonth"] = year_month

    payload["asOf"] = as_of
    pdf_path = Path(args.output) if args.output else snapshot_path(year_month, ".pdf")
    json_path = pdf_path.with_suffix(".json") if args.output else snapshot_path(year_month, ".json")
    json_path.parent.mkdir(parents=True, exist_ok=True)
    json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    font_path = ensure_cjk_font()
    build_pdf(pdf_path, payload, font_path, as_of)
    print(f"json\t{json_path}")
    print(f"pdf\t{pdf_path}")
    print(f"month\t{year_month}")
    print(f"status\t{payload.get('rosterStatus')}")
    print(f"source\t{payload.get('source')}")
    print(f"days\t{len(payload.get('days') or [])}")
    print(f"asOf\t{as_of}")


if __name__ == "__main__":
    main()
