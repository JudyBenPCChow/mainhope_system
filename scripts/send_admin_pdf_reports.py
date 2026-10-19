#!/usr/bin/env python3
"""逢星期二、五寄出試堂及轉正、追收學費兩封行政 PDF。

  python3 scripts/send_admin_pdf_reports.py --dry-run
  python3 scripts/send_admin_pdf_reports.py
"""

from __future__ import annotations

import argparse
import base64
import importlib.util
import json
import os
import re
import sys
import urllib.error
import urllib.request
from datetime import date, datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = Path(__file__).resolve().parent
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

TO = ["526956762@qq.com"]
CC = ["markyu@mainhope.edu.hk", "cfan@mainhope.edu.hk"]
DEFAULT_FROM = "明學教育 <noreply@mainhope.edu.hk>"
WEEKDAY = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"]
JOB_TRIAL = "trial-followup-pdf"
JOB_TUITION = "tuition-chase-pdf"
RECIPIENT = TO[0]


def load_module(filename: str):
    spec = importlib.util.spec_from_file_location(filename.replace(".py", ""), SCRIPTS / filename)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"無法載入 {filename}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def hk_today() -> date:
    return datetime.now(ZoneInfo("Asia/Hong_Kong")).date()


def next_send_date(sent_on: date) -> date:
    """星期二的下一封是星期五；星期五的下一封是下星期二。其餘日子取下一個星期二或五。"""
    weekday = sent_on.weekday()
    if weekday == 1:
        return sent_on + timedelta(days=3)
    if weekday == 4:
        return sent_on + timedelta(days=4)
    for offset in range(1, 8):
        candidate = sent_on + timedelta(days=offset)
        if candidate.weekday() in (1, 4):
            return candidate
    return sent_on + timedelta(days=7)


def slash_dm(value: date) -> str:
    return f"{value.day}/{value.month}"


def zh_day(value: date) -> str:
    return f"{value.month}月{value.day}日"


def zh_full(value: date) -> str:
    return f"{value.year}年{value.month}月{value.day}日（{WEEKDAY[value.weekday()]}）"


def footer(sent_on: date) -> str:
    nxt = next_send_date(sent_on)
    return (
        f"下次發送日期：{zh_full(nxt)}上午10:00\n"
        "本電郵自動逢星期二及五產生。\n"
        "\n"
        "(以上乃系統發出之提醒，切勿回覆本電郵）"
    )


def hkd(amount: float | int) -> str:
    return f"{float(amount):,.0f}"


def trial_text(payload: dict, sent_on: date) -> str:
    follow = payload.get("followUpRows") or []
    upcoming = payload.get("upcomingRows") or []
    other = payload.get("otherFollowups") or []
    return "\n".join(
        [
            "前台／行政同事︰",
            "",
            f"附件為截至{zh_day(sent_on)}的試堂名單，請查閱並跟進。",
            "",
            f"一、待跟進轉化（已試堂、該科尚未轉正）：{len(follow)} 人",
            f"二、未來試堂（查庫日及以後、非取消）：{len(upcoming)} 人",
            f"其他跟進（取消等不入上表者）：{len(other)} 項",
            "",
            "轉正後請在試堂頁標「已轉化」。",
            "",
            footer(sent_on),
        ]
    )


def tuition_text(payload: dict, sent_on: date) -> str:
    period = str(payload.get("periodLabel") or "常規第二期")
    month = str(payload.get("homeworkBillingMonth") or sent_on.strftime("%Y-%m"))
    year, mon = int(month[:4]), int(month[5:7])
    return "\n".join(
        [
            "前台／行政同事︰",
            "",
            f"附件為截至{zh_day(sent_on)}的未繳學費清單。",
            "",
            (
                f"專科{period}：{payload.get('studentCount', 0)} 人，"
                f"HKD {hkd(payload.get('totalAmount') or 0)}"
                "（尚未計入逾期罰款；每科每月最高 $50）"
            ),
            (
                f"功輔{year}年{mon}月月費：{payload.get('homeworkStudentCount', 0)} 人，"
                f"HKD {hkd(payload.get('homeworkTotalAmount') or 0)}"
                "（休學不計；不適用逾期罰款）"
            ),
            (
                f"合計：{payload.get('combinedStudentCount', 0)} 人，"
                f"HKD {hkd(payload.get('combinedTotalAmount') or 0)}"
            ),
            "",
            footer(sent_on),
        ]
    )


def read_mail_key() -> tuple[str, str]:
    api_key = os.environ.get("RESEND_API_KEY", "").strip()
    from_addr = os.environ.get("RESEND_FROM", "").strip() or DEFAULT_FROM
    env_file = ROOT / ".env.mail"
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            text = line.strip()
            if not text or text.startswith("#") or "=" not in text:
                continue
            key, value = text.split("=", 1)
            value = value.strip().strip('"').strip("'")
            if key.strip() == "RESEND_API_KEY" and not api_key:
                api_key = value
            if key.strip() == "RESEND_FROM" and os.environ.get("RESEND_FROM", "").strip() == "":
                from_addr = value or from_addr
    return api_key, from_addr


def send_email(*, api_key: str, from_addr: str, subject: str, text: str, pdf: Path) -> str:
    body = {
        "from": from_addr,
        "to": TO,
        "cc": CC,
        "subject": subject,
        "text": text,
        "attachments": [
            {
                "filename": pdf.name,
                "content": base64.b64encode(pdf.read_bytes()).decode("ascii"),
            }
        ],
    }
    request = urllib.request.Request(
        "https://api.resend.com/emails",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise SystemExit(f"寄信失敗（{exc.code}）：{detail[:300]}") from exc
    return str(payload.get("id") or "")


def sql_literal(value: str) -> str:
    if not re.fullmatch(r"[A-Za-z0-9_@.+-]{1,200}", value):
        raise SystemExit(f"拒絕寫入寄出紀錄：{value}")
    return "'" + value.replace("'", "''") + "'"


def claim_send(run_sql, job: str, day: str, recipient: str) -> str:
    rows = run_sql(
        "select public.claim_scheduled_email_send("
        f"{sql_literal(job)}, {sql_literal(day)}::date, {sql_literal(recipient)}) as action"
    )
    if not rows:
        raise SystemExit("寄出紀錄沒有回應")
    action = str(rows[0].get("action") or "")
    if action not in ("send", "skip"):
        raise SystemExit(f"寄出紀錄回應無法辨識：{action}")
    return action


def finish_send(run_sql, job: str, day: str, recipient: str, ok: bool, resend_id: str, error: str) -> None:
    flag = "true" if ok else "false"
    resend_sql = "null" if not resend_id else sql_literal(resend_id)
    error_sql = "null" if not error else "$mh$" + error.replace("$mh$", "")[:500] + "$mh$"
    run_sql(
        "select public.finish_scheduled_email_send("
        f"{sql_literal(job)}, {sql_literal(day)}::date, {sql_literal(recipient)}, {flag}, "
        f"{resend_sql}, {error_sql})"
    )


def within_pdf_window(now: datetime) -> bool:
    minutes = now.hour * 60 + now.minute
    return 10 * 60 <= minutes <= 11 * 60 + 30


def main() -> None:
    parser = argparse.ArgumentParser(description="寄出試堂及追收學費行政 PDF")
    parser.add_argument("--as-of", default=None, help="查庫日 YYYY-MM-DD（預設香港今日）")
    parser.add_argument("--send-day", default=None, help="香港發送日 YYYY-MM-DD")
    parser.add_argument("--dry-run", action="store_true", help="查庫並組文，不寄信")
    parser.add_argument("--scheduled", action="store_true", help="排程呼叫：只在星期二、五 10:00–11:30")
    parser.add_argument("--force", action="store_true", help="已寄出仍再寄")
    parser.add_argument("--workdir", type=Path, default=None, help="PDF 輸出目錄")
    args = parser.parse_args()

    now = datetime.now(ZoneInfo("Asia/Hong_Kong"))
    if args.send_day and not args.force and args.send_day != now.date().isoformat():
        print(f"已過香港當日（發送日 {args.send_day}，今日 {now.date().isoformat()}），不寄出")
        return
    if args.scheduled and not args.force:
        if now.weekday() not in (1, 4):
            print("不是星期二或星期五，不寄出")
            return
        if not within_pdf_window(now):
            print("不在香港 10:00–11:30，不寄出")
            return

    sent_on = date.fromisoformat(args.as_of) if args.as_of else hk_today()
    as_of = sent_on.isoformat()
    work = args.workdir or (ROOT / "docs" / "generated" / "2627")
    work.mkdir(parents=True, exist_ok=True)

    trial_mod = load_module("export_2627_trial_followup.py")
    tuition_mod = load_module("export_2627_period2_tuition_chase.py")
    trial_pdf_mod = load_module("generate_2627_trial_followup_pdf.py")
    tuition_pdf_mod = load_module("generate_2627_period2_tuition_chase_pdf.py")

    trial_payload = trial_mod.build_payload(as_of)
    tuition_payload = tuition_mod.build_payload(as_of, as_of[:7])
    font = trial_pdf_mod.ensure_pmingliu()

    trial_pdf = work / f"試堂及轉正_{as_of}.pdf"
    tuition_pdf = work / f"追收學費清單_{as_of}.pdf"
    trial_pdf_mod.build_pdf(font, trial_payload, trial_pdf)
    tuition_pdf_mod.build_pdf(font, tuition_payload, tuition_pdf)

    trial_subject = f"【系統報告】試堂及轉正（{slash_dm(sent_on)})"
    tuition_subject = f"【系統報告】追收學費清單（{slash_dm(sent_on)})"
    trial_body = trial_text(trial_payload, sent_on)
    tuition_body = tuition_text(tuition_payload, sent_on)

    print(trial_subject)
    print(trial_body)
    print("---")
    print(tuition_subject)
    print(tuition_body)
    print(f"PDF {trial_pdf}")
    print(f"PDF {tuition_pdf}")

    if args.dry_run:
        print("dry_run：未寄出")
        return

    api_key, from_addr = read_mail_key()
    if not api_key:
        raise SystemExit("未設定 RESEND_API_KEY，無法寄出。")
    run_sql = tuition_mod.run_sql
    day = sent_on.isoformat()
    jobs = ((JOB_TRIAL, trial_subject, trial_body, trial_pdf), (JOB_TUITION, tuition_subject, tuition_body, tuition_pdf))
    for job, subject, body, pdf in jobs:
        if not args.force and claim_send(run_sql, job, day, RECIPIENT) == "skip":
            print(f"已寄出，跳過 {job}")
            continue
        try:
            resend_id = send_email(
                api_key=api_key,
                from_addr=from_addr,
                subject=subject,
                text=body,
                pdf=pdf,
            )
        except SystemExit as exc:
            if not args.force:
                finish_send(run_sql, job, day, RECIPIENT, False, "", str(exc)[:500])
            raise
        if not args.force:
            finish_send(run_sql, job, day, RECIPIENT, True, resend_id, "")
        print(f"已寄出 {job} {resend_id}")
    print(f"收件 {', '.join(TO)}；副本 {', '.join(CC)}")


if __name__ == "__main__":
    main()
