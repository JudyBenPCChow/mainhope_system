# 老師明日課堂查詢

`execute_sql` 用 `.mcp.json` 的 `project_ref`。把 `'2026-10-13'` 換成目標日（香港翌日）。

## 1) 當日排程（按實授老師）

```sql
with target as (
  select date '2026-10-13' as d
)
select
  s.id as schedule_id,
  s.scheduled_date,
  s.start_time,
  s.end_time,
  s.status,
  s.is_extra_lesson,
  s.remarks as schedule_remarks,
  s.teacher_id,
  t.full_name as teacher_name,
  t.english_name as teacher_english_name,
  ot.full_name as original_teacher_name,
  c.id as class_id,
  c.subject,
  c.course_code_full,
  co.course_name,
  cr.name as classroom_name
from public.schedules s
join public.classes c on c.id = s.class_id
join public.academic_years ay on ay.id = c.academic_year_id
left join public.courses co on co.id = c.course_id
left join public.teachers t on t.id = s.teacher_id
left join public.teachers ot on ot.id = s.original_teacher_id
left join public.classrooms cr on cr.id = s.classroom_id
cross join target
where s.scheduled_date = target.d
  and s.teacher_id is not null
  and coalesce(s.status, '') not like '%取消%'
  and coalesce(t.full_name, '') not ilike '%test%'
  and coalesce(c.course_code_full, '') not ilike '%test%'
  and coalesce(c.subject, '') not ilike '%test%'
  and coalesce(co.course_name, '') not ilike '%test%'
  and coalesce(c.class_kind, '') <> 'homework'
  and coalesce(c.course_code_full, '') !~* 'HWK'
  and coalesce(c.subject, '') !~* '(功課輔導|homework)'
  and coalesce(co.course_name, '') !~* '(功課輔導|homework)'
  and coalesce(s.remarks, '') not like '%功輔佔室%'
order by t.english_name nulls last, t.full_name, s.start_time;
```
-- 不含功課輔導班佔室（15:15 起，不是當值）。私人一對一仍列入。正式寄出時每封 BCC cfan@mainhope.edu.hk。


## 2) 點名紙學生（應到）

把 `schedule_id` 列表代入。口徑對齊未點名 skill／點名紙：有效宣告∩就讀中＋報讀／退讀日；或已收款未取消試堂；或補堂目標指到該堂。

```sql
with ids as (
  select unnest(array[
    '00000000-0000-0000-0000-000000000000'::uuid
  ]) as schedule_id
)
select
  s.id as schedule_id,
  st.id as student_id,
  st.full_name as student_name,
  'declaration'::text as source
from ids
join public.schedules s on s.id = ids.schedule_id
join public.attendance_declarations decl
  on decl.schedule_id = s.id and decl.status = 'active'
join public.students st on st.id = decl.student_id
join public.student_class_enrollments e
  on e.student_id = decl.student_id
 and e.class_id = s.class_id
 and e.status = '就讀中'
 and (e.enroll_date is null or s.scheduled_date >= e.enroll_date)
 and (e.withdraw_effective_date is null or s.scheduled_date < e.withdraw_effective_date)

union

select
  s.id,
  st.id,
  st.full_name,
  'trial'
from ids
join public.schedules s on s.id = ids.schedule_id
join public.trial_sessions ts on ts.schedule_id = s.id
join public.payments pay on pay.id = ts.payment_id
join public.students st on st.id = ts.student_id
where ts.payment_id is not null
  and pay.status = '已收款'
  and coalesce(ts.status, '') not like '%取消%'

union

select
  s.id,
  st.id,
  st.full_name,
  'makeup_target'
from ids
join public.schedules s on s.id = ids.schedule_id
join public.leave_makeup_records l on l.makeup_schedule_id = s.id
join public.students st on st.id = l.student_id

order by schedule_id, student_name;
```

## 3) 本堂請假（事假／病假／錄影／zoom）

```sql
with ids as (
  select unnest(array[
    '00000000-0000-0000-0000-000000000000'::uuid
  ]) as schedule_id
)
select
  s.id as schedule_id,
  st.full_name as student_name,
  l.leave_reason,
  l.makeup_type,
  l.remarks as leave_remarks,
  l.leave_date,
  ms.scheduled_date as makeup_scheduled_date,
  ms.start_time as makeup_start_time
from ids
join public.schedules s on s.id = ids.schedule_id
join public.leave_makeup_records l
  on l.schedule_id = s.id
  or (l.class_id = s.class_id and l.leave_date = s.scheduled_date)
join public.students st on st.id = l.student_id
left join public.schedules ms on ms.id = l.makeup_schedule_id
order by s.id, st.full_name;
```

分類（在組文時做，不要改 SQL 結果意涵）：

| 欄位 | 條件 |
| --- | --- |
| 錄影／zoom名單 | `makeup_type` 含 錄影／網課／線上／zoom／Zoom／即時直播／錄影回放 |
| 事假／病假名單 | 本堂請假且非上一類 |
| 學生名單 | 查詢 2 的學生，扣除上兩類（同 `student_id`／姓名） |

## 4) 收件電郵（自動寄用）

```sql
select
  t.id,
  t.full_name,
  t.english_name,
  p.notification_email
from public.teachers t
left join public.teachers_private p on p.teacher_id = t.id
where t.id = any(array[
  '00000000-0000-0000-0000-000000000000'::uuid
]);
```

## 5) 功輔當值（每人自己的時段）

已編更、非假期。時間用當值段，不使用佔室排程的 15:15。不寫課室。學生只計該日星期在 `homework_weekdays` 內的就讀中報讀。備註寫「功輔當值」，不標不用上堂。

```sql
with target as (
  select date '2026-10-13' as d
),
duty as (
  select
    a.id as assignment_id,
    a.teacher_id,
    t.full_name as teacher_name,
    t.english_name as teacher_english_name,
    t.honorific,
    to_char(a.session_start, 'HH24:MI') as duty_start,
    to_char(a.session_end, 'HH24:MI') as duty_end,
    c.id as class_id,
    c.course_code_full,
    co.course_name,
    d.duty_date,
    (array['日','一','二','三','四','五','六'])[extract(dow from d.duty_date)::int + 1] as weekday_char
  from public.homework_tutoring_duty_days d
  join public.homework_tutoring_roster_months rm on rm.id = d.roster_month_id
  join public.homework_tutoring_duty_assignments a on a.duty_day_id = d.id
  join public.classes c on c.id = rm.class_id
  join public.teachers t on t.id = a.teacher_id
  left join public.courses co on co.id = c.course_id
  cross join target
  where d.duty_date = target.d
    and rm.status = '已編更'
    and nullif(btrim(d.holiday_label), '') is null
    and coalesce(t.full_name, '') not ilike '%test%'
    and coalesce(c.course_code_full, '') not ilike '%test%'
)
select
  duty.teacher_id,
  duty.teacher_name,
  duty.teacher_english_name,
  duty.honorific,
  duty.duty_start,
  duty.duty_end,
  duty.course_code_full,
  duty.course_name,
  coalesce((
    select jsonb_agg(x.student_name order by x.student_name)
    from (
      select distinct st.full_name as student_name
      from public.student_class_enrollments e
      join public.students st on st.id = e.student_id
      where e.class_id = duty.class_id
        and e.status = '就讀中'
        and (e.enroll_date is null or duty.duty_date >= e.enroll_date)
        and (e.withdraw_effective_date is null or duty.duty_date < e.withdraw_effective_date)
        and duty.weekday_char = any(coalesce(e.homework_weekdays, '{}'::text[]))
    ) x
  ), '[]'::jsonb) as student_names
from duty
order by duty.teacher_english_name nulls last, duty.teacher_name, duty.duty_start;
```
