#!/usr/bin/env python3
"""Export 2627 unpaid tuition chase JSON (specialist period + homework month) from production.

Usage:
  python3 scripts/export_2627_period2_tuition_chase.py
  python3 scripts/export_2627_period2_tuition_chase.py --as-of 2026-10-13 --pdf
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import tempfile
from collections import defaultdict
from datetime import date, datetime
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
OUT_JSON = ROOT / "docs" / "generated" / "2627" / "2627_PERIOD2_TUITION_CHASE.json"
OUT_PDF = ROOT / "docs" / "generated" / "2627" / "2627_PERIOD2_TUITION_CHASE.pdf"
YEAR_ID = "978d2726-efdd-48db-aae7-3598c463e5d8"
YEAR_LABEL = "2627"

# 2627 附件甲常規第二期上課日
PERIOD2_DATES = {
    "2026-09-29",
    "2026-09-30",
    "2026-10-02",
    "2026-10-04",
    "2026-10-05",
    "2026-10-06",
    "2026-10-07",
    "2026-10-08",
    "2026-10-09",
    "2026-10-10",
    "2026-10-11",
    "2026-10-12",
    "2026-10-13",
    "2026-10-14",
    "2026-10-15",
    "2026-10-16",
    "2026-10-17",
    "2026-10-19",
    "2026-10-20",
    "2026-10-21",
    "2026-10-22",
    "2026-10-23",
    "2026-10-24",
    "2026-10-25",
    "2026-10-26",
    "2026-10-29",
    "2026-10-31",
    "2026-11-01",
}
BILLABLE = {
    "現場",
    "錄影回放",
    "zoom實時網課",
    "no show",
    "請假而不需補回",
    "即時直播",
    "不用補回",
    "出席",
    "網課",
    "補課",
    "線上",
}
NONDEDUCT = {"事假", "病假"}
CROSS = {"student_makeup", "class_reschedule"}
GRADE_TO_CODE = {
    "小一": "P1",
    "小二": "P2",
    "小三": "P3",
    "小四": "P4",
    "小五": "P5",
    "小六": "P6",
    "中一": "S1",
    "中二": "S2",
    "中三": "S3",
    "中四": "S4",
    "中五": "S5",
    "中六": "S6",
}
CODE_TO_LABEL = {v: k for k, v in GRADE_TO_CODE.items()}
FEE = {
    "三日": {"中一": 2800, "中二": 2900, "中三": 3000},
    "四日": {"中一": 3100, "中二": 3200, "中三": 3300},
    "五日": {"中一": 3200, "中二": 3300, "中三": 3400},
    "七日": {"中一": 3400, "中二": 3500, "中三": 3600},
}
PRIMARY_FEE = {"三日": 2500, "四日": 2700, "五日": 2800}
GRADE_MAP = {
    "P1": "小一",
    "P2": "小二",
    "P3": "小三",
    "P4": "小四",
    "P5": "小五",
    "P6": "小六",
    "S1": "中一",
    "S2": "中二",
    "S3": "中三",
    "S4": "中四",
    "S5": "中五",
    "S6": "中六",
}


def today_hk() -> str:
    return datetime.now(ZoneInfo("Asia/Hong_Kong")).date().isoformat()


def number(x: Any) -> float:
    try:
        return float(x)
    except (TypeError, ValueError):
        return 0.0


def unwrap_rows(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        if isinstance(payload.get("rows"), list):
            return payload["rows"]
        if isinstance(payload.get("result"), list):
            return payload["result"]
    raise ValueError(f"unexpected query payload: {type(payload)}")


def parse_cli_json(stdout: str) -> Any:
    text = (stdout or "").strip()
    if not text:
        raise ValueError("empty stdout")
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        start_arr = text.find("[")
        if start < 0 and start_arr < 0:
            raise
        idx = min(i for i in (start, start_arr) if i >= 0)
        return json.loads(text[idx:])


def run_sql(sql: str) -> list[dict[str, Any]]:
    supabase = shutil.which("supabase")
    if not supabase:
        local = Path.home() / ".local" / "bin" / "supabase"
        supabase = str(local) if local.is_file() else None
    with tempfile.NamedTemporaryFile("w", suffix=".sql", delete=False, encoding="utf-8") as tmp:
        tmp.write(sql)
        tmp_path = tmp.name
    try:
        if supabase:
            cmd = [supabase, "db", "query", "--linked", "-o", "json", "-f", tmp_path]
        else:
            cmd = ["npx", "--yes", "supabase", "db", "query", "--linked", "-o", "json", "-f", tmp_path]
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
        raise SystemExit(combined.strip() or "supabase db query failed")
    return unwrap_rows(parse_cli_json(completed.stdout))


def fmt_date(ymd: str | None) -> str:
    if not ymd:
        return ""
    _y, m, d = ymd.split("-")
    return f"{int(m)}/{int(d)}"


def norm_grade_code(raw: Any) -> str:
    g = str(raw or "").strip().upper()
    if len(g) == 2 and g[0] == "F" and g[1].isdigit():
        return "S" + g[1]
    return g


def resolve_grade_labels(class_grade: Any, grade_code: Any, eligible: Any) -> list[str]:
    order = "P1 P2 P3 P4 P5 P6 S1 S2 S3 S4 S5 S6".split()
    elig: list[str] = []
    for x in eligible or []:
        n = norm_grade_code(x)
        if n in order:
            elig.append(n)
    primary = norm_grade_code(grade_code)
    if primary in order and primary not in elig:
        elig.append(primary)
    elig = [c for c in order if c in set(elig)]
    if elig and eligible is not None and len(eligible) > 0:
        return [CODE_TO_LABEL[c] for c in elig if c in CODE_TO_LABEL]
    labels: list[str] = []
    for g in class_grade or []:
        t = str(g).strip().replace("級", "")
        if t in GRADE_TO_CODE:
            labels.append(t)
    labels = sorted(set(labels))
    if labels:
        return labels
    if primary in CODE_TO_LABEL:
        return [CODE_TO_LABEL[primary]]
    return []


def namespace_for(enr: dict[str, Any]) -> tuple[str, str, bool]:
    class_id = enr["class_id"]
    if enr.get("class_kind") == "private":
        return ("private", f"class:{class_id}", False)
    labels = resolve_grade_labels(
        enr.get("class_grade"), enr.get("grade_code"), enr.get("eligible_grade_codes")
    )
    if len(labels) == 1:
        return ("group_specialist", GRADE_TO_CODE[labels[0]], True)
    return ("group_specialist", f"class:{class_id}", False)


def price_of(row: dict[str, Any]) -> float | None:
    if row.get("class_price") is not None and number(row["class_price"]) > 0:
        return number(row["class_price"])
    p2 = row.get("price_per_lesson_period_2")
    if p2 is not None and number(p2) > 0:
        return number(p2)
    if row.get("course_price") is not None and number(row["course_price"]) > 0:
        return number(row["course_price"])
    return None


def covers(start: Any, count: Any, target: str) -> bool:
    if not start:
        return False
    ym = str(start)[:7]
    if len(ym) != 7:
        return False
    n = int(float(count or 1))
    if n < 1:
        n = 1
    y, m = int(ym[:4]), int(ym[5:7])
    months: list[str] = []
    for i in range(n):
        mm = m + i
        yy = y + (mm - 1) // 12
        mm = (mm - 1) % 12 + 1
        months.append(f"{yy:04d}-{mm:02d}")
    return target in months


def hw_fee(plan: str | None, grade: Any, course_code: str | None, month: str) -> int | None:
    if not plan:
        return None
    division = "primary" if "HWKP" in (course_code or "").upper() else "secondary"
    label = GRADE_MAP.get(str(grade or "").strip(), str(grade or "").strip())
    if division == "primary":
        base = PRIMARY_FEE.get(plan)
    else:
        fee_grade = "中一" if label.startswith("小") else label
        base = FEE.get(plan, {}).get(fee_grade)
    if base is None:
        return None
    if month.endswith("-12") or month.endswith("-02"):
        return round(base * 3 / 4)
    return base


SQL_ENROLLMENTS = """
select
  e.student_id::text,
  s.student_code,
  s.full_name,
  s.english_name,
  s.grade as student_grade,
  e.class_id::text,
  c.subject,
  c.class_kind,
  c.course_code_full,
  c.grade as class_grade,
  c.lesson_slots_per_session,
  c.price_per_lesson as class_price,
  c.academic_year_id::text,
  co.course_name,
  co.grade_code,
  co.eligible_grade_codes,
  co.price_per_lesson as course_price,
  co.price_per_lesson_period_2,
  co.price_per_lesson_both_periods
from student_class_enrollments e
join students s on s.id = e.student_id
join classes c on c.id = e.class_id
join academic_years y on y.id = c.academic_year_id
left join courses co on co.id = c.course_id
where e.status = '就讀中'
  and y.label = '2627'
  and coalesce(c.class_kind, '') <> 'homework'
order by s.full_name, c.subject;
"""

SQL_POOLS = """
select
  p.id::text as pool_id,
  p.student_id::text,
  p.academic_year_id::text,
  p.course_group,
  p.namespace_key,
  p.class_id::text,
  p.remaining_lessons,
  p.initial_lessons
from student_entitlement_pools p
join academic_years y on y.id = p.academic_year_id
where y.label = '2627'
  and coalesce(p.course_group,'') not in ('homework','trial')
order by p.student_id, p.namespace_key;
"""

SQL_DECLS = """
with p2 as (
  select unnest(array[
    '2026-09-29','2026-09-30','2026-10-02','2026-10-04','2026-10-05','2026-10-06','2026-10-07',
    '2026-10-08','2026-10-09','2026-10-10','2026-10-11','2026-10-12','2026-10-13','2026-10-14',
    '2026-10-15','2026-10-16','2026-10-17','2026-10-19','2026-10-20','2026-10-21','2026-10-22',
    '2026-10-23','2026-10-24','2026-10-25','2026-10-26','2026-10-29','2026-10-31','2026-11-01'
  ]::date[]) as d
)
select
  ad.student_id::text,
  ad.schedule_id::text,
  ad.pool_id::text,
  ad.source_event_type,
  sch.class_id::text,
  sch.scheduled_date::text,
  sch.start_time::text,
  sch.end_time::text,
  c.subject,
  c.lesson_slots_per_session,
  c.price_per_lesson as class_price,
  co.price_per_lesson as course_price,
  co.price_per_lesson_period_2,
  att.status as attendance_status
from attendance_declarations ad
join schedules sch on sch.id = ad.schedule_id
join p2 on p2.d = sch.scheduled_date
join classes c on c.id = sch.class_id
left join courses co on co.id = c.course_id
left join lateral (
  select ad2.status
  from attendance_details ad2
  where ad2.student_id = ad.student_id
    and ad2.schedule_id = ad.schedule_id
  order by case when ad2.status in (
    '現場','錄影回放','zoom實時網課','no show','請假而不需補回',
    '即時直播','不用補回','出席','網課','補課','線上'
  ) then 0 else 1 end
  limit 1
) att on true
where ad.status = 'active'
  and sch.status not like '%取消%'
order by ad.student_id, sch.scheduled_date, sch.start_time;
"""

SQL_PAYMENTS = """
select
  p.student_id::text,
  p.payment_date::text,
  pd.class_id::text,
  pd.lesson_count,
  pd.amount,
  pd.description,
  c.academic_year_id::text
from payment_details pd
join payments p on p.id = pd.payment_id
left join classes c on c.id = pd.class_id
where p.voided_at is null
  and p.status = '已收款'
  and p.student_id in (
    select e.student_id from student_class_enrollments e
    join classes c2 on c2.id = e.class_id
    join academic_years y on y.id = c2.academic_year_id
    where e.status = '就讀中' and y.label = '2627'
  )
order by p.student_id, p.payment_date;
"""

SQL_HW = """
with hw_students as (
  select e.student_id, e.class_id, s.student_code, s.full_name, s.grade,
         e.homework_day_plan, c.course_code_full
  from student_class_enrollments e
  join students s on s.id=e.student_id
  join classes c on c.id=e.class_id
  join academic_years y on y.id=c.academic_year_id
  where y.label='2627' and c.class_kind='homework' and e.status='就讀中'
),
pays as (
  select p.student_id, pd.class_id, pd.coverage_start_month::text as coverage_start_month,
         pd.lesson_count, pd.amount, pd.description, p.receipt_number, p.payment_date::text
  from payment_details pd
  join payments p on p.id=pd.payment_id
  join classes c on c.id=pd.class_id
  where c.class_kind='homework'
    and p.status='已收款' and p.voided_at is null
)
select hs.student_id::text, hs.student_code, hs.full_name, hs.grade, hs.homework_day_plan,
       hs.course_code_full, hs.class_id::text,
       py.coverage_start_month, py.lesson_count, py.amount, py.receipt_number, py.payment_date, py.description
from hw_students hs
left join pays py on py.student_id=hs.student_id and py.class_id=hs.class_id
order by hs.full_name, py.payment_date nulls last;
"""


def build_payload(as_of: str, billing_month: str) -> dict[str, Any]:
    enrollments = run_sql(SQL_ENROLLMENTS)
    pools = run_sql(SQL_POOLS)
    decls = run_sql(SQL_DECLS)
    payments = run_sql(SQL_PAYMENTS)
    hw_raw = run_sql(SQL_HW)

    student_meta: dict[str, dict[str, Any]] = {}
    pools_acc: dict[tuple, dict[str, Any]] = {}
    class_subject: dict[str, str] = {}
    class_units: dict[str, int] = {}
    class_price: dict[str, float] = {}

    for e in enrollments:
        sid = e["student_id"]
        student_meta.setdefault(
            sid,
            {
                "student_code": e.get("student_code"),
                "name": e.get("full_name") or e.get("english_name") or "（未命名）",
                "grade": e.get("student_grade"),
            },
        )
        cg, nk, shares = namespace_for(e)
        class_subject[e["class_id"]] = (
            (e.get("subject") or e.get("course_name") or "").strip() or "（未命名）"
        )
        class_units[e["class_id"]] = 2 if number(e.get("lesson_slots_per_session")) == 2 else 1
        pr = price_of(e)
        if pr is not None:
            class_price[e["class_id"]] = pr
        key = (sid, e["academic_year_id"], cg, nk)
        acc = pools_acc.get(key)
        if not acc:
            acc = {
                "student_id": sid,
                "year_id": e["academic_year_id"],
                "course_group": cg,
                "namespace_key": nk,
                "shares": shares,
                "class_ids": set(),
                "subjects": [],
            }
            pools_acc[key] = acc
        if e["class_id"] not in acc["class_ids"]:
            acc["class_ids"].add(e["class_id"])
            subj = class_subject[e["class_id"]]
            if subj not in acc["subjects"]:
                acc["subjects"].append(subj)

    remaining: dict[tuple, float] = {}
    initial: dict[tuple, float] = {}
    for p in pools:
        key = (
            p["student_id"],
            p["academic_year_id"],
            p.get("course_group") or "group_specialist",
            p.get("namespace_key") or f"class:{p['class_id']}",
        )
        remaining[key] = number(p["remaining_lessons"])
        initial[key] = number(p.get("initial_lessons") or 0)
    pool_by_id = {p["pool_id"]: p for p in pools}

    def applies(d: dict[str, Any], pool: dict[str, Any]) -> bool:
        if d["class_id"] in pool["class_ids"]:
            return True
        if (d.get("source_event_type") or "").strip() not in CROSS:
            return False
        pid = d.get("pool_id")
        if not pid or pid not in pool_by_id:
            return False
        dp = pool_by_id[pid]
        return (
            dp["student_id"] == pool["student_id"]
            and (dp.get("course_group") or "") == pool["course_group"]
            and (dp.get("namespace_key") or "") == pool["namespace_key"]
            and (not dp.get("academic_year_id") or dp["academic_year_id"] == pool["year_id"])
        )

    paid_by_student_class: dict[tuple[str, str], float] = defaultdict(float)
    for pay in payments:
        if pay.get("academic_year_id") and pay["academic_year_id"] != YEAR_ID:
            continue
        if not pay.get("class_id"):
            continue
        desc = pay.get("description") or ""
        if "功輔" in desc or "月費" in desc or "試堂" in desc:
            continue
        lc = number(pay.get("lesson_count"))
        if lc < 1:
            continue
        paid_by_student_class[(pay["student_id"], pay["class_id"])] += lc

    rows_out: list[dict[str, Any]] = []
    for _key, pool in pools_acc.items():
        rem_key = (
            pool["student_id"],
            pool["year_id"],
            pool["course_group"],
            pool["namespace_key"],
        )
        if rem_key not in remaining:
            continue
        rem = remaining[rem_key]
        init = initial.get(rem_key, 0)
        pending_lines: list[dict[str, Any]] = []
        pending_units = 0.0
        seen: set[str] = set()
        for d in decls:
            if d["student_id"] != pool["student_id"] or d["scheduled_date"] not in PERIOD2_DATES:
                continue
            if not applies(d, pool) or d["schedule_id"] in seen:
                continue
            seen.add(d["schedule_id"])
            u = class_units.get(
                d["class_id"], 2 if number(d.get("lesson_slots_per_session")) == 2 else 1
            )
            st = (d.get("attendance_status") or "").strip()
            if st in BILLABLE or st in NONDEDUCT:
                continue
            pending_units += u
            subj = class_subject.get(d["class_id"]) or d.get("subject") or "（未命名）"
            pr = class_price.get(d["class_id"])
            if pr is None:
                pr = price_of(d)
            pending_lines.append(
                {
                    "subject": subj,
                    "date": d["scheduled_date"],
                    "start": (d.get("start_time") or "")[:5],
                    "end": (d.get("end_time") or "")[:5],
                    "units": u,
                    "unit_price": pr,
                }
            )
        due = max(0.0, pending_units - rem)
        if due <= 0:
            continue
        paid_lessons_pool = 0.0
        for e in enrollments:
            if e["student_id"] != pool["student_id"]:
                continue
            cg, nk, _ = namespace_for(e)
            if cg == pool["course_group"] and nk == pool["namespace_key"]:
                paid_lessons_pool += paid_by_student_class[(e["student_id"], e["class_id"])]
        if init <= 0 and paid_lessons_pool <= 0:
            continue
        arrears = max(0.0, -rem)
        need = due
        charge_lines: list[dict[str, Any]] = []
        for line in sorted(pending_lines, key=lambda x: (x["date"], x["start"], x["subject"])):
            if need <= 0:
                break
            take = min(line["units"], need)
            need -= take
            amt = None if line["unit_price"] is None else round(line["unit_price"] * take, 2)
            charge_lines.append({**line, "charge_units": take, "amount": amt, "kind": "本期還會扣"})
        if need > 0:
            per = [
                (class_subject.get(cid, "（未命名）"), class_price.get(cid))
                for cid in sorted(pool["class_ids"])
            ]
            i = 0
            left = need
            while left > 0 and per:
                subj, pr = per[i % len(per)]
                take = 1
                left -= 1
                i += 1
                amt = None if pr is None else round(pr * take, 2)
                charge_lines.append(
                    {
                        "subject": subj,
                        "date": None,
                        "start": "",
                        "end": "",
                        "units": take,
                        "unit_price": pr,
                        "charge_units": take,
                        "amount": amt,
                        "kind": "已上課未付款",
                    }
                )

        by_subj: dict[str, dict[str, Any]] = defaultdict(
            lambda: {"units": 0.0, "amount": 0.0, "dates": [], "unit_price": None}
        )
        for cl in charge_lines:
            s = by_subj[cl["subject"]]
            s["units"] += cl["charge_units"]
            if cl["amount"] is not None:
                s["amount"] += cl["amount"]
            if cl["date"]:
                s["dates"].append(cl["date"])
            s["unit_price"] = cl["unit_price"]
        detail_parts = []
        for subj, info in sorted(by_subj.items()):
            dates = (
                "、".join(fmt_date(d) for d in sorted(set(info["dates"])))
                if info["dates"]
                else "已上課未付款"
            )
            detail_parts.append(f"{subj} {info['units']:g}堂（{dates}）")

        meta = student_meta[pool["student_id"]]
        pool_label = (
            ("專科班（" + CODE_TO_LABEL.get(pool["namespace_key"], pool["namespace_key"]) + "）")
            if pool["shares"]
            else "／".join(pool["subjects"])
        )
        rows_out.append(
            {
                "studentCode": meta["student_code"] or "",
                "studentName": meta["name"],
                "grade": meta["grade"] or "",
                "poolLabel": pool_label,
                "remaining": rem,
                "pending": pending_units,
                "dueLessons": due,
                "arrears": arrears,
                "amount": sum(cl["amount"] for cl in charge_lines if cl["amount"] is not None),
                "detailSummary": "；".join(detail_parts),
                "chargeLines": [
                    {
                        "kind": cl["kind"],
                        "subject": cl["subject"],
                        "date": cl["date"],
                        "dateLabel": fmt_date(cl["date"]) if cl["date"] else "已上課未付款",
                        "time": f"{cl['start']}-{cl['end']}" if cl["start"] else "",
                        "units": cl["charge_units"],
                        "unitPrice": cl["unit_price"],
                        "amount": cl["amount"],
                    }
                    for cl in charge_lines
                ],
            }
        )
    rows_out.sort(key=lambda r: (r["studentName"], r["poolLabel"]))

    hw_by_student: dict[str, dict[str, Any]] = defaultdict(lambda: {"pays": [], "meta": None})
    for row in hw_raw:
        sid = row["student_id"]
        if hw_by_student[sid]["meta"] is None:
            hw_by_student[sid]["meta"] = row
        if row.get("coverage_start_month"):
            hw_by_student[sid]["pays"].append(row)

    homework_rows: list[dict[str, Any]] = []
    for _sid, pack in hw_by_student.items():
        m = pack["meta"]
        paid = any(
            covers(p.get("coverage_start_month"), p.get("lesson_count"), billing_month)
            for p in pack["pays"]
        )
        if paid:
            continue
        plan = m.get("homework_day_plan")
        amt = hw_fee(plan, m.get("grade"), m.get("course_code_full"), billing_month)
        if amt is None:
            continue
        last_note = "未見功輔已收款覆蓋紀錄"
        if pack["pays"]:
            ends: list[str] = []
            for p in pack["pays"]:
                start = str(p.get("coverage_start_month") or "")[:7]
                n = int(float(p.get("lesson_count") or 1))
                if not start:
                    continue
                y, mo = int(start[:4]), int(start[5:7])
                mo2 = mo + n - 1
                y2 = y + (mo2 - 1) // 12
                mo2 = (mo2 - 1) % 12 + 1
                ends.append(f"{y2}年{mo2}月")
            if ends:
                last_note = f"上次覆蓋至 {sorted(ends)[-1]}"
        label = GRADE_MAP.get(str(m.get("grade") or "").strip(), str(m.get("grade") or ""))
        primary_note = (
            "（小學生跟中一價）"
            if label.startswith("小") and "HWKP" not in (m.get("course_code_full") or "").upper()
            else ""
        )
        division_label = (
            "小學部" if "HWKP" in (m.get("course_code_full") or "").upper() else "中學部"
        )
        y, mo = billing_month.split("-")
        homework_rows.append(
            {
                "studentCode": (m.get("student_code") or "").strip(),
                "studentName": (m.get("full_name") or "").strip(),
                "grade": m.get("grade") or "",
                "poolLabel": f"功課輔導班（{division_label}）",
                "dayPlan": plan or "",
                "billingMonth": billing_month,
                "billingMonthLabel": f"{int(y)}年{int(mo)}月",
                "amount": amt,
                "detailSummary": (
                    f"功課輔導 · {plan}檔 · {int(y)}年{int(mo)}月月費{primary_note} @${amt:,}"
                ),
                "lastPaidNote": last_note,
                "courseCode": m.get("course_code_full") or "",
            }
        )
    homework_rows.sort(key=lambda r: (r["studentName"], r["studentCode"]))

    payload = {
        "asOf": as_of,
        "year": YEAR_LABEL,
        "periodLabel": "常規第二期",
        "periodCaption": "常規第二期 · 9/29–11/1",
        "studentCount": len({r["studentCode"] + r["studentName"] for r in rows_out}),
        "poolCount": len(rows_out),
        "totalAmount": sum(r["amount"] for r in rows_out),
        "totalDueLessons": sum(r["dueLessons"] for r in rows_out),
        "rows": rows_out,
        "homeworkBillingMonth": billing_month,
        "homeworkRows": homework_rows,
        "homeworkStudentCount": len(homework_rows),
        "homeworkTotalAmount": sum(r["amount"] for r in homework_rows),
        "source": "supabase db query --linked",
    }
    payload["combinedStudentCount"] = len(
        {r["studentCode"] + r["studentName"] for r in rows_out}
        | {r["studentCode"] + r["studentName"] for r in homework_rows}
    )
    payload["combinedTotalAmount"] = payload["totalAmount"] + payload["homeworkTotalAmount"]
    return payload


def main() -> None:
    parser = argparse.ArgumentParser(description="匯出 2627 追收學費 JSON（可連 PDF）")
    parser.add_argument("--as-of", default=None, help="查庫日 YYYY-MM-DD（預設香港今日）")
    parser.add_argument(
        "--billing-month",
        default=None,
        help="功輔覆蓋月 YYYY-MM（預設隨 as-of 年月）",
    )
    parser.add_argument("--output", type=Path, default=OUT_JSON, help="JSON 輸出路徑")
    parser.add_argument("--pdf", action="store_true", help="一併產出 PDF")
    parser.add_argument("--pdf-output", type=Path, default=OUT_PDF, help="PDF 輸出路徑")
    args = parser.parse_args()

    as_of = args.as_of or today_hk()
    try:
        date.fromisoformat(as_of)
    except ValueError as exc:
        raise SystemExit(f"--as-of 無效：{as_of}") from exc
    billing_month = args.billing_month or as_of[:7]

    payload = build_payload(as_of, billing_month)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(
        f"{args.output} specialist={payload['studentCount']} "
        f"hw={payload['homeworkStudentCount']} total=HKD {payload['combinedTotalAmount']:,.0f}"
    )

    if args.pdf:
        pdf_script = ROOT / "scripts" / "generate_2627_period2_tuition_chase_pdf.py"
        completed = subprocess.run(
            [
                "python3",
                str(pdf_script),
                "--data",
                str(args.output),
                "--output",
                str(args.pdf_output),
            ],
            cwd=ROOT,
            check=False,
        )
        if completed.returncode != 0:
            raise SystemExit("PDF 產出失敗")
        print(args.pdf_output)


if __name__ == "__main__":
    main()
