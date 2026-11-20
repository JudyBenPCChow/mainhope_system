# 營運異常檢查 — 只屬於本 skill 的 SQL

專案：**MainHope_production**（`gudmbilboyhouotilrvt`）。

`:start_date`、`:end_date` 換成該次香港日期（`date '2026-10-01'`）。點名與補堂改跑專科點名跟進、未完成補堂兩份 skill 的 queries，不要把那些 SQL 抄到這裡。

## 校舍假期被標成取消

有列就是異常。假期當日沒有排程、或當日另有補堂，不要用這段去找。

```sql
select s.scheduled_date::text as day,
       c.course_code_full,
       s.status,
       s.cancel_reason
from public.schedules s
join public.classes c on c.id = s.class_id
where s.scheduled_date >= :start_date
  and s.scheduled_date <= :end_date
  and coalesce(s.status, '') like '%取消%'
  and coalesce(s.cancel_reason, '') like '校舍假期%'
order by s.scheduled_date, c.course_code_full;
```

## 已出席、結果仍待跟進的試堂

只計實際出席。未點名、缺席、no show、事假、病假不在此清單。`outcome = 'open'` 即待跟進。

```sql
select t.trial_date::text as day,
       btrim(st.full_name) as student_name,
       c.course_code_full,
       t.status as trial_status,
       ad.status as attendance_status
from public.trial_sessions t
join public.students st on st.id = t.student_id
join public.classes c on c.id = t.class_id
join public.attendance_details ad
  on ad.schedule_id = t.schedule_id
 and ad.student_id = t.student_id
where t.trial_date >= :start_date
  and t.trial_date <= :end_date
  and t.outcome = 'open'
  and coalesce(t.status, '') not like '%取消%'
  and coalesce(t.status, '') not like '%待改期%'
  and btrim(ad.status) in (
    '現場', '錄影回放', 'zoom實時網課', '出席', '網課', '補課', '線上', '即時直播'
  )
order by t.trial_date, c.course_code_full, st.full_name;
```
