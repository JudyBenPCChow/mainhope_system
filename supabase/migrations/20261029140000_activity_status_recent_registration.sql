-- 活躍生另加：學生主檔建立日（香港日期）在過去一個月內，即使尚未報讀。
-- 滿一個月且從未有班別報讀者，每日重算改回非活躍生。

create or replace function public.recompute_student_enrollment_state(p_student_id uuid)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_reg text;
  v_stage text;
  v_created_at timestamptz;
  v_has_active_enrollment boolean;
  v_has_recent_enrollment boolean;
  v_has_recent_withdraw boolean;
  v_has_recent_registration boolean;
  v_enroll text;
  v_activity text;
  v_status text;
begin
  if p_student_id is null then
    return;
  end if;

  select registration_status, academic_stage, created_at
    into v_reg, v_stage, v_created_at
  from public.students
  where id = p_student_id;

  if not found then
    return;
  end if;

  select exists(
    select 1
    from public.student_class_enrollments e
    where e.student_id = p_student_id
      and e.status = '就讀中'
  )
  into v_has_active_enrollment;

  select exists(
    select 1
    from public.student_class_enrollments e
    where e.student_id = p_student_id
      and coalesce(e.enroll_date, (e.created_at at time zone 'Asia/Hong_Kong')::date)
        >= (current_date - interval '3 months')::date
  )
  into v_has_recent_enrollment;

  select exists(
    select 1
    from public.student_class_enrollments e
    where e.student_id = p_student_id
      and e.withdraw_effective_date is not null
      and e.withdraw_effective_date >= (current_date - interval '3 months')::date
  )
  into v_has_recent_withdraw;

  v_has_recent_registration :=
    v_created_at is not null
    and (v_created_at at time zone 'Asia/Hong_Kong')::date
      >= ((timezone('Asia/Hong_Kong', now()))::date - interval '1 month')::date;

  v_enroll := case when v_has_active_enrollment then '在讀' else '非在讀' end;
  v_activity := case
    when v_has_active_enrollment
      or v_has_recent_enrollment
      or v_has_recent_withdraw
      or v_has_recent_registration
    then '活躍生'
    else '非活躍生'
  end;

  if coalesce(v_stage, '中學階段') = '已畢業' then
    v_status := '已畢業';
  elsif coalesce(v_reg, '已註冊') = '非注冊' then
    v_status := '非注冊';
  elsif v_enroll = '在讀' then
    v_status := '在讀';
  else
    v_status := '非在讀';
  end if;

  if coalesce(v_reg, '已註冊') = '非注冊' then
    v_enroll := '非在讀';
  end if;

  update public.students
  set enrollment_status = v_enroll,
      activity_status = v_activity,
      status = v_status,
      updated_at = now()
  where id = p_student_id
    and (
      enrollment_status is distinct from v_enroll
      or activity_status is distinct from v_activity
      or status is distinct from v_status
    );
end;
$$;

comment on function public.recompute_student_enrollment_state(uuid) is
  '依報讀紀錄重算 enrollment_status（現時就讀中）、activity_status（在讀、近三個月報讀／退讀，或近一個月新登記）與 legacy status';

revoke execute on function public.recompute_student_enrollment_state(uuid) from public, anon;
grant execute on function public.recompute_student_enrollment_state(uuid) to authenticated, service_role;

-- 新建主檔當下重算，避免只建檔、尚未報讀的新生停在預設非活躍生。
drop trigger if exists students_recompute_state_on_insert on public.students;

create trigger students_recompute_state_on_insert
after insert on public.students
for each row
execute function public.trg_recompute_student_state_from_student_row();

-- 只回填近一個月建立、目前仍為非活躍生的主檔。
do $$
declare
  r record;
begin
  for r in
    select s.id
    from public.students s
    where s.activity_status = '非活躍生'
      and (s.created_at at time zone 'Asia/Hong_Kong')::date
        >= ((timezone('Asia/Hong_Kong', now()))::date - interval '1 month')::date
  loop
    perform public.recompute_student_enrollment_state(r.id);
  end loop;
end $$;

create or replace function public.recompute_expired_new_student_activity()
returns void
language plpgsql
set search_path = public
as $$
declare
  r record;
begin
  for r in
    select s.id
    from public.students s
    where s.activity_status = '活躍生'
      and (s.created_at at time zone 'Asia/Hong_Kong')::date
        < ((timezone('Asia/Hong_Kong', now()))::date - interval '1 month')::date
      and not exists (
        select 1
        from public.student_class_enrollments e
        where e.student_id = s.id
      )
  loop
    perform public.recompute_student_enrollment_state(r.id);
  end loop;
end;
$$;

comment on function public.recompute_expired_new_student_activity() is
  '近一個月新登記已屆滿、且從未有班別報讀者，改回非活躍生';

revoke all on function public.recompute_expired_new_student_activity() from public, anon, authenticated;
grant execute on function public.recompute_expired_new_student_activity() to service_role;

create extension if not exists pg_cron;

do $$
declare
  r record;
begin
  for r in
    select jobid from cron.job
    where jobname = 'activity-status-expire-new-students'
  loop
    perform cron.unschedule(r.jobid);
  end loop;
end $$;

-- 香港 00:15（UTC 16:15）
select cron.schedule(
  'activity-status-expire-new-students',
  '15 16 * * *',
  $$select public.recompute_expired_new_student_activity()$$
);
