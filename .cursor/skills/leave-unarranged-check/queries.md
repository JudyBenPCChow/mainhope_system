# 未安排請假核對 — SQL

專案：**MainHope_production**（`gudmbilboyhouotilrvt`）。把 `'2627'` 換成該次 `academic_years.label`。

## 1. 學生請假、尚未安排補堂

依 `att_status` 分頁：`事假`／`病假` → `leave`；`未點名` → `unmarked`；`現場` → `present`。其他狀態不要自行歸頁。

```sql
select c.course_code_full as class_code,
       btrim(st.full_name) as student_name,
       coalesce(lm.leave_reason, '—') as leave_reason,
       lm.leave_date::text as leave_date,
       coalesce(nullif(btrim(lm.makeup_type), ''), '空白') as makeup_type,
       coalesce(nullif(btrim(lm.tuition_disposition), ''), '空白') as tuition_disposition,
       coalesce(lm.remarks, '') as remarks,
       coalesce((
         select ad.status
         from attendance_details ad
         where ad.schedule_id = lm.schedule_id
           and ad.student_id = lm.student_id
         order by ad.id
         limit 1
       ), '未點名') as att_status
from leave_makeup_records lm
join classes c on c.id = lm.class_id
join students st on st.id = lm.student_id
where c.academic_year_id = (select id from academic_years where label = '2627')
  and coalesce(lm.leave_reason, '') not ilike '%老師%'
  and coalesce(lm.leave_reason, '') not ilike '%導師%'
  and coalesce(lm.status, '') not ilike '%已補課%'
  and coalesce(lm.status, '') not ilike '%已完成%'
  and coalesce(lm.status, '') not ilike '%放棄%'
  and coalesce(lm.makeup_type, '') not ilike '%錄影%'
  and coalesce(lm.makeup_type, '') not ilike '%錄像%'
  and coalesce(lm.makeup_type, '') not ilike '%不補回%'
  and lm.makeup_date is null
  and lm.makeup_schedule_id is null
order by lm.leave_date, student_name, class_code;
```

## 2. 老師請假取消、尚未補回

全部 `bucket = teacher`。不要因為 `att_status` 是未點名而併入學生「未點名」頁。

```sql
with ay as (
  select id from academic_years where label = '2627'
),
cancelled as (
  select s.id as schedule_id,
         s.class_id,
         s.scheduled_date,
         s.cancel_reason,
         c.course_code_full as class_code
  from schedules s
  join classes c on c.id = s.class_id
  left join teachers ct on ct.id = c.teacher_id
  left join teachers stch on stch.id = s.teacher_id
  where c.academic_year_id = (select id from ay)
    and s.status ilike '%取消%'
    and (
      coalesce(s.cancel_reason, '') ilike '%老師%'
      or coalesce(s.cancel_reason, '') ilike '%導師%'
    )
    and not (
      coalesce(ct.full_name, stch.full_name) ilike '%Test%'
      or coalesce(ct.full_name, stch.full_name) ilike '%HWKP%'
      or coalesce(c.course_code_full, '') ilike '%Test%'
    )
    and not exists (
      select 1 from schedules ms
      where ms.class_id = s.class_id
        and ms.status not ilike '%取消%'
        and coalesce(ms.remarks, '') like '%makeup_of=' || s.id::text || '%'
    )
),
enrolled as (
  select c.schedule_id, c.class_code, c.scheduled_date, c.cancel_reason,
         e.student_id, btrim(st.full_name) as student_name
  from cancelled c
  join student_class_enrollments e on e.class_id = c.class_id
  join students st on st.id = e.student_id
  where (e.enroll_date is null or e.enroll_date <= c.scheduled_date)
    and (e.withdraw_effective_date is null or e.withdraw_effective_date > c.scheduled_date)
)
select en.class_code,
       en.student_name,
       en.scheduled_date::text as leave_date,
       en.cancel_reason,
       coalesce((
         select ad.status from attendance_details ad
         where ad.schedule_id = en.schedule_id and ad.student_id = en.student_id
         order by ad.id limit 1
       ), '未點名') as att_status
from enrolled en
where not exists (
  select 1
  from leave_makeup_records lm
  where lm.student_id = en.student_id
    and lm.schedule_id = en.schedule_id
    and coalesce(lm.leave_reason, '') not ilike '%老師%'
    and coalesce(lm.leave_reason, '') not ilike '%導師%'
)
order by en.scheduled_date, en.student_name, en.class_code;
```
