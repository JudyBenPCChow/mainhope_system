#!/usr/bin/env python3
"""每月 1 日寄出上一個曆月的新報讀整體報告。

  python3 scripts/send_monthly_new_enrollment_report.py --dry-run --month 2026-11
  python3 scripts/send_monthly_new_enrollment_report.py --scheduled
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
from datetime import date, datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = Path(__file__).resolve().parent
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

TO = ["markyu@mainhope.edu.hk", "526956762@qq.com"]
CC = ["cfan@mainhope.edu.hk"]
DEFAULT_FROM = "明學教育 <noreply@mainhope.edu.hk>"
JOB = "monthly-new-enrollment-report"
WEEKDAY = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"]


def load_export():
    spec = importlib.util.spec_from_file_location(
        "export_monthly_new_enrollment_report",
        SCRIPTS / "export_monthly_new_enrollment_report.py",
    )
    if spec is None or spec.loader is None:
        raise RuntimeError("無法載入匯出腳本")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def hk_today() -> date:
    return datetime.now(ZoneInfo("Asia/Hong_Kong")).date()


def next_first(sent_on: date) -> date:
    if sent_on.month == 12:
        return date(sent_on.year + 1, 1, 1)
    return date(sent_on.year, sent_on.month + 1, 1)


def zh_full(value: date) -> str:
    return f"{value.year}年{value.month}月{value.day}日（{WEEKDAY[value.weekday()]}）"


def month_label(start: date) -> str:
    return f"{start.year}年{start.month}月"


def share_text(payload: dict) -> str:
    new_active = int(payload["new_active"])
    existing = int(payload["existing_active"])
    current = new_active + existing
    if current == 0:
        return "目前沒有仍就讀中的報讀可對比。"
    share = new_active / current * 100
    return f"目前就讀中合計 {current} 筆，本月新增佔 {share:.1f}%（{new_active}／{current}）。"


def email_text(payload: dict, sent_on: date) -> str:
    start = date.fromisoformat(payload["start_date"])
    nxt = next_first(sent_on)
    return "\n".join(
        [
            f"附件為{month_label(start)}新報讀整體報告（{payload['start_date']} 至 {payload['end_date']}）。",
            "此為一整個月的報告，與逢星期二、五的試堂及轉正、追收學費分開寄出。",
            "",
            (
                f"期間新增報讀 {payload['new_total']} 筆（{payload['people']} 人）。"
                f"其中仍就讀中 {payload['new_active']} 筆，已退讀 {payload['withdrawn']} 筆。"
                f"月初前已建立、目前仍就讀中的報讀有 {payload['existing_active']} 筆。"
                f"{share_text(payload)}"
                f"試堂 {payload['trial']} 筆，直接報讀 {payload['direct']} 筆。"
            ),
            "",
            f"下次發送日期：{zh_full(nxt)}上午10:00",
            "本電郵自動於每月1日產生，涵蓋上一個曆月。",
            "",
            "(以上乃系統發出之提醒，切勿回覆本電郵）",
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
            "User-Agent": "mainhope-monthly-new-enrollment-report",
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


def claim_send(run_sql, day: str, recipient: str) -> str:
    rows = run_sql(
        "select public.claim_scheduled_email_send("
        f"{sql_literal(JOB)}, {sql_literal(day)}::date, {sql_literal(recipient)}) as action"
    )
    if not rows:
        raise SystemExit("寄出紀錄沒有回應")
    action = str(rows[0].get("action") or "")
    if action not in ("send", "skip"):
        raise SystemExit(f"寄出紀錄回應無法辨識：{action}")
    return action


def finish_send(run_sql, day: str, recipient: str, ok: bool, resend_id: str, error: str) -> None:
    flag = "true" if ok else "false"
    resend_sql = "null" if not resend_id else sql_literal(resend_id)
    error_sql = "null" if not error else "$mh$" + error.replace("$mh$", "")[:500] + "$mh$"
    run_sql(
        "select public.finish_scheduled_email_send("
        f"{sql_literal(JOB)}, {sql_literal(day)}::date, {sql_literal(recipient)}, {flag}, "
        f"{resend_sql}, {error_sql})"
    )


def within_window(now: datetime) -> bool:
    minutes = now.hour * 60 + now.minute
    return 10 * 60 <= minutes <= 11 * 60 + 30


def main() -> None:
    parser = argparse.ArgumentParser(description="寄出曆月新報讀整體報告")
    parser.add_argument("--month", default=None, help="YYYY-MM；排程省略則用上一個曆月")
    parser.add_argument("--send-day", default=None, help="香港發送日 YYYY-MM-DD")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--scheduled", action="store_true")
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--workdir", type=Path, default=None)
    args = parser.parse_args()

    now = datetime.now(ZoneInfo("Asia/Hong_Kong"))
    send_day = date.fromisoformat(args.send_day) if args.send_day else now.date()
    if args.send_day and not args.force and send_day != now.date():
        print(f"已過香港當日（發送日 {send_day.isoformat()}，今日 {now.date().isoformat()}），不寄出")
        return
    if args.scheduled and not args.force:
        if send_day.day != 1:
            print("不是每月 1 日，不寄出")
            return
        if not within_window(now):
            print("不在香港 10:00–11:30，不寄出")
            return

    export = load_export()
    if args.month:
        start, end = export.parse_month(args.month)
    else:
        if send_day.day != 1 and not args.force:
            raise SystemExit("不是每月 1 日。指定月份請加 --month YYYY-MM。")
        start, end = export.previous_month(send_day)

    payload = export.build_payload(start, end, export.run_sql(export.report_sql(start, end)))
    work = args.workdir or (ROOT / "docs" / "generated" / "2627")
    work.mkdir(parents=True, exist_ok=True)
    stem = f"新報讀整體報告_{start.isoformat()}_{end.isoformat()}"
    json_path = work / f"{stem}.json"
    pdf_path = work / f"{stem}.pdf"
    json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    from cjk_pdf_font import ensure_cjk_font
    from generate_new_enrollment_comparison_pdf import build_pdf

    build_pdf(ensure_cjk_font(), payload, pdf_path)
    subject = f"【系統報告】新報讀整體報告（{month_label(start)}）"
    body = email_text(payload, send_day)
    print(subject)
    print(body)
    print(f"PDF {pdf_path}")
    if args.dry_run:
        print("dry_run：未寄出")
        return

    api_key, from_addr = read_mail_key()
    if not api_key:
        raise SystemExit("未設定 RESEND_API_KEY，無法寄出。")
    day = send_day.isoformat()
    if not args.force:
        actions = [claim_send(export.run_sql, day, recipient) for recipient in TO]
        if all(action == "skip" for action in actions):
            print("已寄出，跳過")
            return
    try:
        resend_id = send_email(api_key=api_key, from_addr=from_addr, subject=subject, text=body, pdf=pdf_path)
    except SystemExit as exc:
        if not args.force:
            for recipient in TO:
                finish_send(export.run_sql, day, recipient, False, "", str(exc)[:500])
        raise
    if not args.force:
        for recipient in TO:
            finish_send(export.run_sql, day, recipient, True, resend_id, "")
    print(f"已寄出 {JOB} {resend_id}")
    print(f"收件 {', '.join(TO)}；副本 {', '.join(CC)}")


if __name__ == "__main__":
    main()
