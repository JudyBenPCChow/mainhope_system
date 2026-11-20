# 自動信寄出紀錄

專案：**MainHope_production**（`gudmbilboyhouotilrvt`）。

`:send_day`＝香港發送日。`:lesson_date`＝發送日的下一日（明日課堂的 `target_date`）。

```sql
select job_key, target_date::text, recipient, status, error,
       finished_at at time zone 'Asia/Hong_Kong' as finished_hk
from public.scheduled_email_sends
where (job_key = 'tomorrow-lesson' and target_date = :lesson_date)
   or (job_key in (
         'missing-roll-call',
         'trial-followup-pdf',
         'tuition-chase-pdf',
         'monthly-new-enrollment-report'
       )
       and target_date = :send_day)
order by job_key, recipient;
```

明日課堂應寄名單。函式回傳 jsonb 陣列。只用來對姓名，不要把電郵寫進回覆。空白 `notification_email`＝跳過原因「無通訊電郵」。

```sql
select teacher_name, notification_email
from jsonb_to_recordset(
  public.teacher_tomorrow_lesson_email_payload(:lesson_date::date)
) as t(teacher_name text, notification_email text);
```
