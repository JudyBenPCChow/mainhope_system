-- FK preflight checks before schedule rebuild / optional legacy imports

-- A) Required anchor tables should not be empty
select 'students_count' as check_name, count(*) as value from public.students
union all
select 'classes_count', count(*) from public.classes
union all
select 'teachers_count', count(*) from public.teachers;

-- B) Existing FK integrity (must be zero)
select 'enrollments_missing_student' as issue, count(*) as cnt
from public.student_class_enrollments e
left join public.students s on s.id = e.student_id
where s.id is null
union all
select 'enrollments_missing_class', count(*)
from public.student_class_enrollments e
left join public.classes c on c.id = e.class_id
where c.id is null
union all
select 'schedules_missing_class', count(*)
from public.schedules s
left join public.classes c on c.id = s.class_id
where c.id is null
union all
select 'schedules_missing_teacher', count(*)
from public.schedules s
left join public.teachers t on t.id = s.teacher_id
where s.teacher_id is not null and t.id is null
union all
select 'schedules_missing_classroom', count(*)
from public.schedules s
left join public.classrooms r on r.id = s.classroom_id
where s.classroom_id is not null and r.id is null;

-- C) Class metadata readiness for class-driven schedule rebuild
select
  count(*) as classes_total,
  count(*) filter (where coalesce(trim(day_of_week), '') <> '') as classes_with_day,
  count(*) filter (where coalesce(trim(time_slot), '') <> '') as classes_with_time_slot,
  count(*) filter (
    where coalesce(trim(day_of_week), '') <> '' and coalesce(trim(time_slot), '') <> ''
  ) as classes_ready_for_schedule_rebuild
from public.classes;

-- D) Rows likely skipped by class-driven rebuild (manual follow-up queue)
select id, subject, day_of_week, time_slot, start_date, end_date
from public.classes
where coalesce(trim(day_of_week), '') = ''
   or coalesce(trim(time_slot), '') = ''
order by created_at desc
limit 100;

-- E) Unrecognized weekday tokens (dirty data detector)
with raw_day_tokens as (
  select c.id, c.subject, trim(day_token) as day_token
  from public.classes c
  cross join lateral regexp_split_to_table(coalesce(c.day_of_week, ''), '[,，]') as day_token
  where coalesce(c.day_of_week, '') <> ''
),
matched as (
  select distinct r.id, r.subject, r.day_token
  from raw_day_tokens r
  join public.weekday_aliases a
    on a.is_active = true
   and (r.day_token = a.alias or r.day_token like '%' || a.alias || '%')
)
select r.id, r.subject, r.day_token as unrecognized_day_token
from raw_day_tokens r
left join matched m
  on m.id = r.id and m.day_token = r.day_token
where m.id is null
order by r.subject, r.id
limit 200;

-- F) Unparseable time slots (expects at least HH:MM-HH:MM)
select id, subject, time_slot
from public.classes
where coalesce(time_slot, '') <> ''
  and regexp_match(time_slot, '([0-2][0-9]:[0-5][0-9])\\s*-\\s*([0-2][0-9]:[0-5][0-9])') is null
order by subject, id
limit 200;
