-- Transform staging data into current schema

begin;

create or replace function public.section_code_from_ord(n integer)
returns text
language sql
immutable
as $$
  select case
    when n <= 26 then chr(64 + n)
    else chr(64 + ((n - 1) % 26 + 1)) || ((n - 1) / 26 + 1)::text
  end
$$;

-- 1) Students
insert into public.students (
  id, old_student_id, student_code, full_name, english_name, gender, date_of_birth, grade, school,
  status, registration_status, enrollment_status, academic_stage,
  parent_name, parent_relationship, parent_phone, student_phone, whatsapp, address, remarks,
  created_at, updated_at
)
select
  coalesce(s.id, gen_random_uuid()),
  nullif(trim(s.old_student_id), ''),
  nullif(trim(s.student_code), ''),
  trim(s.full_name),
  nullif(trim(s.english_name), ''),
  nullif(trim(s.gender), ''),
  s.date_of_birth,
  public.normalize_student_grade(nullif(trim(s.grade), '')),
  nullif(trim(s.school), ''),
  coalesce(nullif(trim(s.status), ''), '在讀'),
  coalesce(nullif(trim(s.registration_status), ''), '已註冊'),
  coalesce(nullif(trim(s.enrollment_status), ''), '在讀'),
  coalesce(nullif(trim(s.academic_stage), ''), '中學中'),
  nullif(trim(s.parent_name), ''),
  nullif(trim(s.parent_relationship), ''),
  nullif(trim(s.parent_phone), ''),
  nullif(trim(s.student_phone), ''),
  nullif(trim(s.whatsapp), ''),
  nullif(trim(s.address), ''),
  nullif(trim(s.remarks), ''),
  coalesce(s.created_at, now()),
  coalesce(s.updated_at, now())
from staging.students_import s
on conflict (id) do update
set
  old_student_id = excluded.old_student_id,
  student_code = excluded.student_code,
  full_name = excluded.full_name,
  english_name = excluded.english_name,
  gender = excluded.gender,
  date_of_birth = excluded.date_of_birth,
  grade = excluded.grade,
  school = excluded.school,
  status = excluded.status,
  registration_status = excluded.registration_status,
  enrollment_status = excluded.enrollment_status,
  academic_stage = excluded.academic_stage,
  parent_name = excluded.parent_name,
  parent_relationship = excluded.parent_relationship,
  parent_phone = excluded.parent_phone,
  student_phone = excluded.student_phone,
  whatsapp = excluded.whatsapp,
  address = excluded.address,
  remarks = excluded.remarks,
  updated_at = coalesce(excluded.updated_at, now());

-- 2) Courses
insert into public.courses (
  subject_id, grade_code, course_seq, course_code_base, price_per_lesson
)
select distinct
  sb.id,
  upper(trim(c.grade_code)),
  c.course_seq,
  sb.code || upper(trim(c.grade_code)) || lpad(c.course_seq::text, 3, '0'),
  c.price_per_lesson
from staging.classes_import c
join public.subjects sb
  on sb.name_zh = trim(c.subject_name)
  or sb.short_name = trim(c.subject_name)
on conflict (subject_id, grade_code, course_seq) do update
set
  course_code_base = excluded.course_code_base,
  price_per_lesson = coalesce(excluded.price_per_lesson, public.courses.price_per_lesson),
  updated_at = now();

-- 3) Classes (preserve imported class_id as pk)
with class_rows as (
  select
    c.class_id,
    c.subject_name,
    ay.label as ay_label,
    crs.id as course_id,
    sb.code as subject_code,
    upper(trim(c.grade_code)) as grade_code,
    c.course_seq,
    coalesce(nullif(trim(c.section_code), ''), 'A') as section_code,
    c.day_of_week,
    c.time_slot,
    c.teacher_id,
    c.classroom_id,
    c.capacity,
    c.price_per_lesson,
    c.start_date,
    c.end_date,
    coalesce(nullif(trim(c.status), ''), '進行中') as status
  from staging.classes_import c
  join public.academic_years ay on ay.label = trim(c.academic_year_label)
  join public.subjects sb
    on sb.name_zh = trim(c.subject_name)
    or sb.short_name = trim(c.subject_name)
  join public.courses crs
    on crs.subject_id = sb.id
   and crs.grade_code = upper(trim(c.grade_code))
   and crs.course_seq = c.course_seq
),
ranked as (
  select
    r.*,
    row_number() over (partition by r.course_id order by r.class_id) as ord
  from class_rows r
)
insert into public.classes (
  id, subject, course_id, academic_year_id, section_code, course_code_full, grade,
  day_of_week, time_slot, teacher_id, classroom_id, capacity, start_date, end_date, status
)
select
  r.class_id,
  r.subject_name,
  r.course_id,
  ay.id,
  coalesce(r.section_code, public.section_code_from_ord(r.ord::integer)),
  r.ay_label || '-' || r.subject_code || r.grade_code || lpad(r.course_seq::text, 3, '0') || '-' ||
    coalesce(r.section_code, public.section_code_from_ord(r.ord::integer)),
  array[r.grade_code]::text[],
  nullif(trim(r.day_of_week), ''),
  nullif(trim(r.time_slot), ''),
  r.teacher_id,
  r.classroom_id,
  r.capacity,
  r.start_date,
  r.end_date,
  r.status
from ranked r
join public.academic_years ay on ay.label = r.ay_label
on conflict (id) do update
set
  subject = excluded.subject,
  course_id = excluded.course_id,
  academic_year_id = excluded.academic_year_id,
  section_code = excluded.section_code,
  course_code_full = excluded.course_code_full,
  grade = excluded.grade,
  day_of_week = excluded.day_of_week,
  time_slot = excluded.time_slot,
  teacher_id = excluded.teacher_id,
  classroom_id = excluded.classroom_id,
  capacity = excluded.capacity,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  status = excluded.status,
  updated_at = now();

-- 4) Enrollments
insert into public.student_class_enrollments (
  student_id, class_id, status, enroll_date, remarks
)
select
  e.student_id,
  e.class_id,
  coalesce(nullif(trim(e.status), ''), '就讀中'),
  e.enroll_date,
  e.remarks
from staging.enrollments_import e
join public.students s on s.id = e.student_id
join public.classes c on c.id = e.class_id;

-- 5) Schedules
insert into public.schedules (
  class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks
)
select
  s.class_id,
  s.teacher_id,
  s.classroom_id,
  s.scheduled_date,
  nullif(trim(s.start_time), ''),
  nullif(trim(s.end_time), ''),
  coalesce(nullif(trim(s.status), ''), '預定'),
  s.remarks
from staging.schedules_import s
join public.classes c on c.id = s.class_id;

-- 6) Attendance
insert into public.attendance_details (
  student_id, class_id, attendance_date, status, remarks
)
select
  a.student_id,
  a.class_id,
  a.attendance_date,
  coalesce(nullif(trim(a.status), ''), '出席'),
  a.remarks
from staging.attendance_import a
join public.students s on s.id = a.student_id
join public.classes c on c.id = a.class_id;

commit;
