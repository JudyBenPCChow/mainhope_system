-- 2627 小學功輔班：獨立 homework 班（預設 17E、15:30–20:00）。
-- production 可能已手種；本檔 idempotent。中學班場次結束改 20:00。

begin;

insert into public.courses (
  subject_id, grade_code, course_seq, course_code_base, course_name, course_mode, eligible_grade_codes
)
select
  'eeb155be-f117-43ff-b5db-60e8aba86286'::uuid,
  'P1',
  99,
  'HWKP1099',
  '常規功課輔導班（小學）',
  'regular',
  array['P1', 'P2', 'P3', 'P4', 'P5', 'P6']::text[]
where not exists (
  select 1 from public.courses where course_code_base = 'HWKP1099'
);

insert into public.classes (
  subject,
  class_kind,
  course_id,
  academic_year_id,
  academic_year_label,
  section_code,
  course_code_full,
  classroom_id,
  day_of_week,
  time_slot,
  lesson_slots_per_session,
  capacity,
  start_date,
  end_date,
  status
)
select
  '功課輔導',
  'homework',
  c.id,
  '978d2726-efdd-48db-aae7-3598c463e5d8'::uuid,
  '2627',
  'A',
  '2627-HWKP1099-A',
  (select id from public.classrooms where name = '17E' limit 1),
  '一至五',
  '15:30-20:00',
  1,
  40,
  date '2026-10-01',
  date '2027-06-30',
  '進行中'
from public.courses c
where c.course_code_base = 'HWKP1099'
  and not exists (
    select 1 from public.classes cl where cl.course_code_full = '2627-HWKP1099-A'
  );

-- 中學／小學功輔官方結束統一 20:00
update public.classes
set time_slot = '15:30-20:00',
    updated_at = now()
where class_kind = 'homework'
  and academic_year_label = '2627'
  and course_code_full in ('2627-HWKS1099-A', '2627-HWKP1099-A')
  and time_slot is distinct from '15:30-20:00';

commit;
