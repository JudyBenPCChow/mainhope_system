-- Validation after transform

-- A) Core table counts
select 'students' as table_name, count(*) as row_count from public.students
union all select 'classes', count(*) from public.classes
union all select 'courses', count(*) from public.courses
union all select 'student_class_enrollments', count(*) from public.student_class_enrollments
union all select 'schedules', count(*) from public.schedules
union all select 'attendance_details', count(*) from public.attendance_details
order by table_name;

-- B) Duplicate student_code
select student_code, count(*) as dup_count
from public.students
where student_code is not null and trim(student_code) <> ''
group by student_code
having count(*) > 1
order by dup_count desc, student_code asc;

-- C) Missing class code
select id, subject, grade, course_id, section_code, course_code_full
from public.classes
where course_id is null or section_code is null or course_code_full is null
limit 100;

-- D) Duplicate class full code
select course_code_full, count(*) as dup_count
from public.classes
where course_code_full is not null
group by course_code_full
having count(*) > 1
order by dup_count desc, course_code_full asc;

-- E) Broken foreign links
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
where c.id is null;

-- F) Schedule coverage and quality signals
select
  count(*) as schedules_total,
  min(scheduled_date) as first_schedule_date,
  max(scheduled_date) as last_schedule_date,
  count(*) filter (where teacher_id is null) as schedules_without_teacher,
  count(*) filter (where classroom_id is null) as schedules_without_classroom
from public.schedules;

-- G) Duplicate schedule keys
select
  class_id,
  scheduled_date,
  coalesce(start_time, '') as start_time_norm,
  coalesce(end_time, '') as end_time_norm,
  count(*) as dup_count
from public.schedules
group by class_id, scheduled_date, coalesce(start_time, ''), coalesce(end_time, '')
having count(*) > 1
order by dup_count desc, class_id
limit 100;
