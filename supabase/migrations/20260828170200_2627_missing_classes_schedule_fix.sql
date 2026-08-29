-- 修正 2627 補班排程星期（PG dow：0=日、1=一…6=六）

begin;

delete from public.schedules s
using public.classes c
where s.class_id = c.id
  and c.course_code_full in (
    '2627-CHIS5001-C',
    '2627-CHIS6001-C',
    '2627-CHIS4001-C',
    '2627-CHIS3001-F',
    '2627-CHIS2001-G',
    '2627-CHIS2001-F',
    '2627-CHIS1001-F'
  );

create temp table if not exists _2627_missing_class_seed (
  course_code_full text primary key,
  pg_dow int not null,
  start_time text not null,
  end_time text not null
) on commit drop;

truncate _2627_missing_class_seed;

insert into _2627_missing_class_seed values
  ('2627-CHIS5001-C', 1, '19:00', '20:15'),
  ('2627-CHIS6001-C', 5, '17:45', '19:00'),
  ('2627-CHIS4001-C', 5, '19:00', '20:15'),
  ('2627-CHIS3001-F', 6, '16:30', '17:45'),
  ('2627-CHIS2001-G', 6, '17:45', '19:00'),
  ('2627-CHIS2001-F', 0, '15:15', '16:30'),
  ('2627-CHIS1001-F', 0, '16:30', '17:45');

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
where extract(dow from d)::int = s.pg_dow
  and not exists (
    select 1
    from public.academic_calendar_closures acc
    where acc.academic_year_id = ay.id
      and acc.closure_date = d::date
  );

commit;
