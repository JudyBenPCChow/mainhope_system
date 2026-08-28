-- 2627 v3.6：補入 7 班中文（CSV 有、prod 缺）＋逢星期排程（扣附件甲校舍假）

begin;

create temp table if not exists _2627_missing_class_seed (
  course_code_full text primary key,
  course_id uuid not null,
  section_code text not null,
  grade text not null,
  day_of_week text not null,
  weekday int not null, -- PostgreSQL extract(dow): 0=日 1=一 … 6=六
  time_slot text not null,
  start_time text not null,
  end_time text not null,
  teacher_id uuid not null,
  classroom_id uuid not null
) on commit drop;

truncate _2627_missing_class_seed;

insert into _2627_missing_class_seed values
  ('2627-CHIS5001-C', '69d78034-8f74-4704-847b-fba090f532ba', 'C', '中五', '星期一', 1, '19:00–20:15', '19:00', '20:15', 'f1ee1000-0000-4000-8000-000000001012', '9b8d95ae-e2b7-4062-8b10-f608d41a0298'),
  ('2627-CHIS6001-C', 'ad84f651-aa0e-4bdd-8437-a4f4f99d85d2', 'C', '中六', '星期五', 5, '17:45–19:00', '17:45', '19:00', 'f1ee1000-0000-4000-8000-000000001012', '9b8d95ae-e2b7-4062-8b10-f608d41a0298'),
  ('2627-CHIS4001-C', 'a34c5169-e1e8-4ac6-804e-20e79ea34b5d', 'C', '中四', '星期五', 5, '19:00–20:15', '19:00', '20:15', 'f1ee1000-0000-4000-8000-000000001012', '9b8d95ae-e2b7-4062-8b10-f608d41a0298'),
  ('2627-CHIS3001-F', '1f8c58bb-7da8-4733-adce-7d54d8f68ba5', 'F', '中三', '星期六', 6, '16:30–17:45', '16:30', '17:45', 'f1ee1000-0000-4000-8000-000000001016', '03cc2c78-d80c-4920-ac76-3fed12d1c859'),
  ('2627-CHIS2001-G', '977771ca-607e-4770-aed9-1956d4f3f76c', 'G', '中二', '星期六', 6, '17:45–19:00', '17:45', '19:00', 'f1ee1000-0000-4000-8000-000000001016', '03cc2c78-d80c-4920-ac76-3fed12d1c859'),
  ('2627-CHIS2001-F', '977771ca-607e-4770-aed9-1956d4f3f76c', 'F', '中二', '星期日', 0, '15:15–16:30', '15:15', '16:30', '1f501fa8-dc4f-4d6b-b67b-3381e420acaa', '03cc2c78-d80c-4920-ac76-3fed12d1c859'),
  ('2627-CHIS1001-F', 'cf8d438e-1656-44c7-9e99-1e8c3c5fedbe', 'F', '中一', '星期日', 0, '16:30–17:45', '16:30', '17:45', '1f501fa8-dc4f-4d6b-b67b-3381e420acaa', '03cc2c78-d80c-4920-ac76-3fed12d1c859');

insert into public.classes (
  subject,
  course_id,
  academic_year_id,
  section_code,
  course_code_full,
  grade,
  day_of_week,
  time_slot,
  lesson_slots_per_session,
  teacher_id,
  classroom_id,
  start_date,
  end_date,
  status
)
select
  '中國語文',
  s.course_id,
  ay.id,
  s.section_code,
  s.course_code_full,
  array[s.grade]::text[],
  s.day_of_week,
  s.time_slot,
  1,
  s.teacher_id,
  s.classroom_id,
  date '2026-09-01',
  date '2027-06-30',
  '進行中'
from _2627_missing_class_seed s
cross join public.academic_years ay
where ay.label = '2627'
  and not exists (
    select 1 from public.classes c
    where c.course_code_full = s.course_code_full
  );

insert into public.schedules (
  class_id,
  teacher_id,
  classroom_id,
  scheduled_date,
  start_time,
  end_time,
  status,
  session_number
)
select
  c.id,
  c.teacher_id,
  c.classroom_id,
  d::date,
  s.start_time,
  s.end_time,
  '預定',
  row_number() over (partition by c.id order by d)::int
from public.classes c
join _2627_missing_class_seed s on s.course_code_full = c.course_code_full
cross join lateral generate_series(date '2026-09-01', date '2027-06-30', interval '1 day') as d
join public.academic_years ay on ay.id = c.academic_year_id and ay.label = '2627'
where extract(dow from d)::int = s.weekday
  and not exists (
    select 1
    from public.academic_calendar_closures acc
    where acc.academic_year_id = ay.id
      and acc.closure_date = d::date
  )
  and not exists (
    select 1 from public.schedules existing
    where existing.class_id = c.id
      and existing.scheduled_date = d::date
      and existing.start_time = s.start_time
  );

commit;
