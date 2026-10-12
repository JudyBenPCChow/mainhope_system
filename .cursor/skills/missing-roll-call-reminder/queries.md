# 未點名查詢

`execute_sql` 用 `.mcp.json` 的 `project_ref`。把 `2026-10-01`／`2026-11-01` 換成該曆月的月初與下月月初。

已下課：堂日早於香港今日，或堂日等於今日且 `end_time` 已過。今日未下課不在結果內。

點名紙有人（2627 起常規學年）：有效到課宣告且報讀仍為就讀中、通過報讀日／退讀生效日；或已收款且未取消的試堂；或補堂目標指到該堂。任一成立即應點名。

```sql
with hk as (
  select (now() at time zone 'Asia/Hong_Kong')::date as d,
         (now() at time zone 'Asia/Hong_Kong')::time as t
),
due as (
  select
    s.id,
    s.scheduled_date,
    s.start_time,
    s.end_time,
    s.class_id,
    c.subject,
    c.course_code_full,
    co.course_name,
    t.full_name as teacher_name
  from public.schedules s
  join public.classes c on c.id = s.class_id
  join public.academic_years ay on ay.id = c.academic_year_id
  left join public.courses co on co.id = c.course_id
  left join public.teachers t on t.id = s.teacher_id
  cross join hk
  where s.scheduled_date >= date '2026-10-01'
    and s.scheduled_date < date '2026-11-01'
    and (
      s.scheduled_date < hk.d
      or (
        s.scheduled_date = hk.d
        and s.end_time is not null
        and btrim(s.end_time) ~ '^\d{1,2}:\d{2}'
        and btrim(s.end_time)::time <= hk.t
      )
    )
    and coalesce(s.status, '') not like '%取消%'
    and s.class_id is not null
    and coalesce(t.full_name, '') not ilike '%test%'
    and coalesce(t.full_name, '') not ilike '%HWKP%'
    and coalesce(c.course_code_full, '') not ilike '%HWKP%'
    and coalesce(c.course_code_full, '') not ilike '%test%'
    and coalesce(c.subject, '') not ilike '%test%'
    and coalesce(co.course_name, '') not ilike '%test%'
)
select
  teacher_name,
  scheduled_date,
  start_time,
  end_time,
  subject,
  course_code_full,
  course_name
from due d
where not exists (
  select 1 from public.attendance_details ad where ad.schedule_id = d.id
)
and (
  exists (
    select 1
    from public.attendance_declarations decl
    join public.student_class_enrollments e
      on e.student_id = decl.student_id
     and e.class_id = d.class_id
     and e.status = '就讀中'
    where decl.schedule_id = d.id
      and decl.status = 'active'
      and (e.enroll_date is null or d.scheduled_date >= e.enroll_date)
      and (e.withdraw_effective_date is null or d.scheduled_date < e.withdraw_effective_date)
  )
  or exists (
    select 1
    from public.trial_sessions ts
    join public.payments pay on pay.id = ts.payment_id
    where ts.schedule_id = d.id
      and ts.payment_id is not null
      and pay.status = '已收款'
      and coalesce(ts.status, '') not like '%取消%'
  )
  or exists (
    select 1 from public.leave_makeup_records l
    where l.makeup_schedule_id = d.id
  )
)
order by teacher_name, scheduled_date, start_time;
```
