-- 未點名課堂清單（供行政每日提醒 Edge Function 使用）
-- 規則對齊 .cursor/skills/missing-roll-call-reminder/queries.md

create or replace function public.list_missing_roll_call_lessons(
  p_month_start date default null,
  p_month_end_exclusive date default null
)
returns table (
  teacher_name text,
  scheduled_date date,
  start_time text,
  end_time text,
  subject text,
  course_code_full text,
  course_name text
)
language sql
stable
security definer
set search_path = public
as $$
with bounds as (
  select
    coalesce(
      p_month_start,
      date_trunc('month', (timezone('Asia/Hong_Kong', now()))::date)::date
    ) as month_start,
    coalesce(
      p_month_end_exclusive,
      (
        date_trunc('month', (timezone('Asia/Hong_Kong', now()))::date)
        + interval '1 month'
      )::date
    ) as month_end_exclusive
),
hk as (
  select
    (timezone('Asia/Hong_Kong', now()))::date as d,
    (timezone('Asia/Hong_Kong', now()))::time as t
),
due as (
  select
    s.id,
    s.scheduled_date,
    s.start_time,
    s.end_time,
    s.class_id,
    c.subject,
    c.course_code_full,
    co.course_name,
    t.full_name as teacher_name
  from public.schedules s
  join public.classes c on c.id = s.class_id
  join public.academic_years ay on ay.id = c.academic_year_id
  left join public.courses co on co.id = c.course_id
  left join public.teachers t on t.id = s.teacher_id
  cross join bounds b
  cross join hk
  where s.scheduled_date >= b.month_start
    and s.scheduled_date < b.month_end_exclusive
    and (
      s.scheduled_date < hk.d
      or (
        s.scheduled_date = hk.d
        and s.end_time is not null
        and btrim(s.end_time) ~ '^\d{1,2}:\d{2}'
        and btrim(s.end_time)::time <= hk.t
      )
    )
    and coalesce(s.status, '') not like '%取消%'
    and s.class_id is not null
    and coalesce(t.full_name, '') not ilike '%test%'
    and coalesce(t.full_name, '') not ilike '%HWKP%'
    and coalesce(c.course_code_full, '') not ilike '%HWKP%'
    and coalesce(c.course_code_full, '') not ilike '%test%'
    and coalesce(c.subject, '') not ilike '%test%'
    and coalesce(co.course_name, '') not ilike '%test%'
)
select
  d.teacher_name,
  d.scheduled_date,
  d.start_time,
  d.end_time,
  d.subject,
  d.course_code_full,
  d.course_name
from due d
where not exists (
  select 1 from public.attendance_details ad where ad.schedule_id = d.id
)
and (
  exists (
    select 1
    from public.attendance_declarations decl
    join public.student_class_enrollments e
      on e.student_id = decl.student_id
     and e.class_id = d.class_id
     and e.status = '就讀中'
    where decl.schedule_id = d.id
      and decl.status = 'active'
      and (e.enroll_date is null or d.scheduled_date >= e.enroll_date)
      and (e.withdraw_effective_date is null or d.scheduled_date < e.withdraw_effective_date)
  )
  or exists (
    select 1
    from public.trial_sessions ts
    join public.payments pay on pay.id = ts.payment_id
    where ts.schedule_id = d.id
      and ts.payment_id is not null
      and pay.status = '已收款'
      and coalesce(ts.status, '') not like '%取消%'
  )
  or exists (
    select 1 from public.leave_makeup_records l
    where l.makeup_schedule_id = d.id
  )
)
order by d.teacher_name nulls last, d.scheduled_date, d.start_time;
$$;

comment on function public.list_missing_roll_call_lessons(date, date) is
  '本曆月至香港此刻已下課、點名紙有人、尚未有 attendance_details 的課堂（排除測試／取消）。';

revoke all on function public.list_missing_roll_call_lessons(date, date) from public;
revoke all on function public.list_missing_roll_call_lessons(date, date) from anon, authenticated;
grant execute on function public.list_missing_roll_call_lessons(date, date) to service_role;

notify pgrst, 'reload schema';
