-- Deterministic schedule rebuild from current classes metadata
-- Goal: rebuild schedules without relying on legacy remapped SQL
-- Requires: public.weekday_aliases (seed via 34_seed_weekday_aliases.sql)

begin;

with raw_day_tokens as (
  select
    c.id as class_id,
    c.teacher_id,
    c.classroom_id,
    coalesce(c.start_date, date '2025-09-01') as start_date,
    coalesce(c.end_date, date '2026-08-31') as end_date,
    trim(day_token) as day_token_raw,
    trim(slot_token) as slot_token
  from public.classes c
  cross join lateral regexp_split_to_table(coalesce(c.day_of_week, ''), '[,，]') as day_token
  cross join lateral regexp_split_to_table(coalesce(c.time_slot, ''), '[,，]') as slot_token
  where coalesce(c.day_of_week, '') <> ''
    and coalesce(c.time_slot, '') <> ''
),
class_days as (
  select
    r.class_id,
    r.teacher_id,
    r.classroom_id,
    r.start_date,
    r.end_date,
    a.iso_dow,
    r.slot_token
  from raw_day_tokens r
  left join public.weekday_aliases a
    on a.is_active = true
   and (
      r.day_token_raw = a.alias
      or r.day_token_raw like '%' || a.alias || '%'
   )
  where a.iso_dow is not null
),
normalized as (
  select
    class_id,
    teacher_id,
    classroom_id,
    start_date,
    end_date,
    iso_dow,
    substring(slot_token from '([0-2][0-9]:[0-5][0-9])') as start_time,
    substring(slot_token from '-\\s*([0-2][0-9]:[0-5][0-9])') as end_time
  from class_days
),
expanded as (
  select
    n.class_id,
    n.teacher_id,
    n.classroom_id,
    d::date as scheduled_date,
    n.start_time,
    n.end_time
  from normalized n
  cross join lateral generate_series(n.start_date, n.end_date, interval '1 day') as d
  where n.iso_dow is not null
    and n.start_time is not null
    and n.end_time is not null
    and extract(isodow from d) = n.iso_dow
)
insert into public.schedules (
  class_id,
  teacher_id,
  classroom_id,
  scheduled_date,
  start_time,
  end_time,
  status,
  remarks
)
select
  e.class_id,
  case
    when e.teacher_id is not null and exists (select 1 from public.teachers t where t.id = e.teacher_id)
      then e.teacher_id
    else null
  end as teacher_id,
  case
    when e.classroom_id is not null and exists (select 1 from public.classrooms r where r.id = e.classroom_id)
      then e.classroom_id
    else null
  end as classroom_id,
  e.scheduled_date,
  e.start_time,
  e.end_time,
  '預定',
  '[fk-safe rebuild] generated from classes.day_of_week/time_slot'
from expanded e
where exists (select 1 from public.classes c where c.id = e.class_id)
  and not exists (
    select 1
    from public.schedules s
    where s.class_id = e.class_id
      and s.scheduled_date = e.scheduled_date
      and coalesce(s.start_time, '') = coalesce(e.start_time, '')
      and coalesce(s.end_time, '') = coalesce(e.end_time, '')
  );

commit;
