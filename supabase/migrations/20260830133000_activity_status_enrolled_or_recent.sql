-- 活躍生＝現時在讀，或近三個月有報讀事件，或近三個月有退讀生效。
-- 唔加新欄；只改 recompute_student_enrollment_state。

create or replace function public.recompute_student_enrollment_state(p_student_id uuid)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_reg text;
  v_stage text;
  v_has_active_enrollment boolean;
  v_has_recent_enrollment boolean;
  v_has_recent_withdraw boolean;
  v_enroll text;
  v_activity text;
  v_status text;
begin
  if p_student_id is null then
    return;
  end if;

  select registration_status, academic_stage
    into v_reg, v_stage
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

  v_enroll := case when v_has_active_enrollment then '在讀' else '非在讀' end;
  v_activity := case
    when v_has_active_enrollment or v_has_recent_enrollment or v_has_recent_withdraw
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
  where id = p_student_id;
end;
$$;

comment on function public.recompute_student_enrollment_state(uuid) is
  '依報讀紀錄重算 enrollment_status（現時就讀中）、activity_status（在讀或近三個月報讀／退讀）與 legacy status';

do $$
declare
  r record;
begin
  for r in select id from public.students loop
    perform public.recompute_student_enrollment_state(r.id);
  end loop;
end $$;
