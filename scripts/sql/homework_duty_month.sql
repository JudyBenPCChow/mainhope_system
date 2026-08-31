-- 2627 功輔當值月視圖（老師「我的當值」月曆同源：編更日＋指派＋放假）。
-- 預設月份由腳本代入；手動跑時把 2026-09-01 改成目標月首日。

with params as (
  select date '2026-09-01' as month_start,
         (date '2026-09-01' + interval '1 month')::date as month_end
),
ay as (
  select id, label
  from public.academic_years
  where label = '2627'
  limit 1
),
roster as (
  select rm.id, rm.status, rm.roster_month, rm.published_at
  from public.homework_tutoring_roster_months rm
  join ay on ay.id = rm.academic_year_id
  where rm.roster_month = (select month_start from params)
  limit 1
),
closures as (
  select c.closure_date::text as iso_date, coalesce(c.name, '放假') as label
  from public.homework_tutoring_calendar_closures c
  join ay on ay.id = c.academic_year_id
  where c.closure_date >= (select month_start from params)
    and c.closure_date < (select month_end from params)
),
assign_json as (
  select
    a.duty_day_id,
    jsonb_agg(
      jsonb_build_object(
        'teacher', coalesce(nullif(btrim(t.full_name), ''), '—'),
        'start', to_char(a.session_start, 'HH24:MI'),
        'end', to_char(a.session_end, 'HH24:MI'),
        'room', a.room,
        'sortOrder', a.sort_order
      )
      order by a.sort_order, a.session_start, a.room, t.full_name
    ) as assignments
  from public.homework_tutoring_duty_assignments a
  left join public.teachers t on t.id = a.teacher_id
  group by a.duty_day_id
),
legacy_json as (
  select
    d.id as duty_day_id,
    coalesce(
      jsonb_agg(x.obj order by x.sort_order) filter (where x.obj is not null),
      '[]'::jsonb
    ) as assignments
  from public.homework_tutoring_duty_days d
  join roster r on r.id = d.roster_month_id
  left join lateral (
    select *
    from (
      values
        (
          0,
          d.secondary_teacher_id,
          coalesce(nullif(btrim(d.secondary_room), ''), '17D'),
          d.session_start,
          d.session_end
        ),
        (
          1,
          d.primary_teacher_id,
          coalesce(nullif(btrim(d.primary_room), ''), '17E'),
          d.session_start,
          d.session_end
        )
    ) as v(sort_order, teacher_id, room, session_start, session_end)
  ) slot on true
  left join public.teachers t on t.id = slot.teacher_id
  left join lateral (
    select case
      when slot.teacher_id is null then null
      else jsonb_build_object(
        'teacher', coalesce(nullif(btrim(t.full_name), ''), '—'),
        'start', to_char(slot.session_start, 'HH24:MI'),
        'end', to_char(slot.session_end, 'HH24:MI'),
        'room', slot.room,
        'sortOrder', slot.sort_order
      )
    end as obj
  ) x on true
  group by d.id
),
days as (
  select jsonb_build_object(
    'isoDate', d.duty_date::text,
    'holiday', d.holiday_label,
    'secondaryRoom', d.secondary_room,
    'primaryRoom', d.primary_room,
    'start', to_char(d.session_start, 'HH24:MI'),
    'end', to_char(d.session_end, 'HH24:MI'),
    'assignments', case
      when coalesce(jsonb_array_length(aj.assignments), 0) > 0 then aj.assignments
      else coalesce(lj.assignments, '[]'::jsonb)
    end
  ) as day_obj
  from public.homework_tutoring_duty_days d
  join roster r on r.id = d.roster_month_id
  left join assign_json aj on aj.duty_day_id = d.id
  left join legacy_json lj on lj.duty_day_id = d.id
)
select jsonb_build_object(
  'yearMonth', to_char((select month_start from params), 'YYYY-MM'),
  'academicYearLabel', coalesce((select label from ay), '2627'),
  'rosterStatus', coalesce((select status from roster), '未編更'),
  'publishedAt', (select published_at from roster),
  'closures', coalesce(
    (select jsonb_agg(jsonb_build_object('isoDate', iso_date, 'label', label) order by iso_date) from closures),
    '[]'::jsonb
  ),
  'days', coalesce(
    (select jsonb_agg(day_obj order by day_obj->>'isoDate') from days),
    '[]'::jsonb
  )
) as payload;
