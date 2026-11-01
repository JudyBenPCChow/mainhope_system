# 新報讀整體報告

口徑見 [SKILL.md](SKILL.md)。不要手改 SQL 交差；匯出與寄出都走腳本，腳本內的查詢即這份口徑。

```bash
python3 scripts/export_monthly_new_enrollment_report.py --month 2026-11 --pdf
python3 scripts/send_monthly_new_enrollment_report.py --dry-run --month 2026-11
```

寄出紀錄（只在每月 1 日對這封）：

```sql
select recipient, status, error,
       finished_at at time zone 'Asia/Hong_Kong' as finished_hk
from public.scheduled_email_sends
where job_key = 'monthly-new-enrollment-report'
  and target_date = :send_day
order by recipient;
```
