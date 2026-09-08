-- 2627：Elaine Yao 星期日 M2 兩班（中四 12:45、中五 14:00；首堂 2026-09-13）
-- 課室：山案座（兩節連堂皆空；矩尺／17E／英仙座其中一節已佔）
-- 班號：中四為 B（A＝Cheryl 星期六）；中五為 A（2627 首開）

begin;

create temp table if not exists _2627_elaine_m2_seed (
  course_code_full text primary key,
  course_id uuid not null,
  section_code text not null,
  grade text not null,
  day_of_week text not null,
  weekday int not null, -- PostgreSQL extract(dow): 0=日
  time_slot text not null,
  start_time text not null,
  end_time text not null,
  teacher_id uuid not null,
  classroom_id uuid not null
) on commit drop;

truncate _2627_elaine_m2_seed;

insert into _2627_elaine_m2_seed values
  (
    '2627-M2S4001-B',
    '1c4a57b0-8e1a-4133-92e6-a03619776154', -- M2S4001
    'B',
    '中四',
    '星期日',
    0,
    '12:45–14:00',
    '12:45',
    '14:00',
    'fb4f114f-476e-41f3-ae57-b272730a91c0', -- Elaine Yao
    '9b8d95ae-e2b7-4062-8b10-f608d41a0298'  -- 山案座
  ),
  (
    '2627-M2S5001-A',
    'd4a66dd2-84d8-4c2f-9da9-81f3ba9a5142', -- M2S5001
    'A',
    '中五',
    '星期日',
    0,
    '14:00–15:15',
    '14:00',
    '15:15',
    'fb4f114f-476e-41f3-ae57-b272730a91c0',
    '9b8d95ae-e2b7-4062-8b10-f608d41a0298'
  );

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
  '數學延伸部分（單元二 M2）',
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
from _2627_elaine_m2_seed s
cross join public.academic_years ay
where ay.label = '2627'
  and not exists (
    select 1 from public.classes c
    where c.course_code_full = s.course_code_full
  );

-- 首堂 2026-09-13；專科最後上課日 2027-06-28（星期日最後一堂為 06-27）；扣校舍假期
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
join _2627_elaine_m2_seed s on s.course_code_full = c.course_code_full
cross join lateral generate_series(date '2026-09-13', date '2027-06-28', interval '1 day') as d
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
