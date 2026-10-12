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
order by t.english_name nulls last, t.full_name, s.start_time;
```
-- 含功輔（HWKP／HWKS）與私人一對一；正式寄出時每封 BCC cfan@mainhope.edu.hk。


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
