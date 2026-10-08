-- 例 1：點名扣堂改由系統函式記帳，不跟點名人能否讀收款／改蓋印班的池。
-- 仍在寫入出席的同一下呼叫。畫面失敗提示（例 4）、名冊閘（例 5）、歷史補扣不做。
-- 套用：npm run db:apply -- supabase/migrations/20261008072108_attendance_consume_system_ledger.sql

begin;

create or replace function private.is_billable_attendance_status(p_status text)
returns boolean
language plpgsql
immutable
set search_path = public
as $$
declare
  s text := btrim(coalesce(p_status, ''));
begin
  if s = '' then
    return false;
  end if;
  if s in (
    '現場',
    '錄影回放',
    'zoom實時網課',
    'no show',
    '請假而不需補回',
    '即時直播',
    '不用補回',
    '出席',
    '網課',
    '補課',
    '線上'
  ) then
    return true;
  end if;
  if s like '%缺席%' then
    return false;
  end if;
  if s like '%請假%' and s is distinct from '請假而不需補回' then
    return false;
  end if;
  if s like '%網課%' then
    return true;
  end if;
  if s like '%線上%' and s not like '%假%' then
    return true;
  end if;
  return false;
end;
$$;

create or replace function private.uses_entitlement_roster_label(p_label text)
returns boolean
language plpgsql
immutable
set search_path = public
as $$
declare
  s text := btrim(coalesce(p_label, ''));
begin
  if s = '' then
    return false;
  end if;
  if s ~* '^\d{2}SM$' then
    return false;
  end if;
  if s ~ '^\d{4}$' then
    return (substring(s from 1 for 2)::int * 1000 + 900)
      >= (26 * 1000 + 900);
  end if;
  return false;
end;
$$;

create or replace function private.student_has_paid_trial_on_schedule(
  p_student_id uuid,
  p_schedule_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.trial_sessions ts
    join public.payments pay on pay.id = ts.payment_id
    where ts.student_id = p_student_id
      and ts.schedule_id = p_schedule_id
      and pay.status = '已收款'
      and coalesce(ts.status, '') not like '%取消%'
  );
$$;

create or replace function private.normalize_grade_code(p_raw text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  g text := upper(btrim(coalesce(p_raw, '')));
begin
  if g ~ '^F[1-6]$' then
    return 'S' || substring(g from 2 for 1);
  end if;
  if g ~ '^[PS][1-6]$' then
    return g;
  end if;
  return null;
end;
$$;

create or replace function private.grade_code_from_label(p_label text)
returns text
language sql
immutable
set search_path = public
as $$
  select case btrim(coalesce(p_label, ''))
    when '小一' then 'P1'
    when '小二' then 'P2'
    when '小三' then 'P3'
    when '小四' then 'P4'
    when '小五' then 'P5'
    when '小六' then 'P6'
    when '中一' then 'S1'
    when '中二' then 'S2'
    when '中三' then 'S3'
    when '中四' then 'S4'
    when '中五' then 'S5'
    when '中六' then 'S6'
    else private.normalize_grade_code(p_label)
  end;
$$;

create or replace function private.entitlement_namespace_for_class(
  p_class_id uuid,
  p_is_trial boolean
)
returns table(course_group text, namespace_key text)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_kind text;
  v_subject text;
  v_course_name text;
  v_grade text[];
  v_grade_code text;
  v_eligible text[];
  v_codes text[] := array[]::text[];
  v_code text;
  v_label text;
  v_class_key text := 'class:' || p_class_id::text;
begin
  select
    c.class_kind,
    c.subject,
    c.grade,
    co.course_name,
    co.grade_code,
    co.eligible_grade_codes
  into
    v_kind,
    v_subject,
    v_grade,
    v_course_name,
    v_grade_code,
    v_eligible
  from public.classes c
  left join public.courses co on co.id = c.course_id
  where c.id = p_class_id;

  if not found then
    return;
  end if;

  if p_is_trial then
    course_group := 'trial';
    namespace_key := v_class_key;
    return next;
    return;
  end if;

  if coalesce(v_kind, '') = 'homework'
    or coalesce(v_subject, '') ~* '功課輔導|HWK|homework'
    or coalesce(v_course_name, '') ~* '功課輔導|HWK|homework'
  then
    course_group := 'homework';
    namespace_key := v_class_key;
    return next;
    return;
  end if;

  if coalesce(v_kind, '') = 'private'
    or coalesce(v_subject, '') ~ '一對一|一對二|單對單'
  then
    course_group := 'private';
    namespace_key := v_class_key;
    return next;
    return;
  end if;

  if v_eligible is not null then
    foreach v_label in array v_eligible loop
      v_code := private.normalize_grade_code(v_label);
      if v_code is not null and not (v_code = any (v_codes)) then
        v_codes := v_codes || v_code;
      end if;
    end loop;
  end if;
  v_code := private.normalize_grade_code(v_grade_code);
  if v_code is not null and not (v_code = any (v_codes)) then
    v_codes := v_codes || v_code;
  end if;

  if cardinality(v_codes) = 1 then
    course_group := 'group_specialist';
    namespace_key := v_codes[1];
    return next;
    return;
  end if;

  if cardinality(coalesce(v_eligible, array[]::text[])) = 0
    and cardinality(coalesce(v_grade, array[]::text[])) = 1
  then
    v_code := private.grade_code_from_label(v_grade[1]);
    if v_code is not null then
      course_group := 'group_specialist';
      namespace_key := v_code;
      return next;
      return;
    end if;
  end if;

  course_group := 'group_specialist';
  namespace_key := v_class_key;
  return next;
end;
$$;

create or replace function private.pool_id_for_namespace(
  p_student_id uuid,
  p_academic_year_id uuid,
  p_course_group text,
  p_namespace_key text
)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.id
  from public.student_entitlement_pools p
  where p.student_id = p_student_id
    and p.academic_year_id = p_academic_year_id
    and p.course_group = p_course_group
    and p.namespace_key = p_namespace_key
  limit 1;
$$;

create or replace function public.apply_attendance_entitlement_delta(
  p_student_id uuid,
  p_schedule_id uuid,
  p_class_id uuid,
  p_attendance_detail_id uuid default null,
  p_previous_status text default null,
  p_next_status text default null,
  p_lesson_units numeric default 1
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sched_class uuid;
  v_year_id uuid;
  v_year_label text;
  v_was boolean;
  v_is boolean;
  v_units numeric;
  v_delta numeric;
  v_pool_id uuid;
  v_decl_id uuid;
  v_decl_pool uuid;
  v_ns_group text;
  v_ns_key text;
  v_remaining numeric;
  v_att_id uuid := p_attendance_detail_id;
begin
  if p_student_id is null or p_schedule_id is null or p_class_id is null then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  if not private.has_capability('attendance.take') then
    raise exception 'NOT_AUTHORIZED'
      using errcode = '42501', hint = '需要 attendance.take';
  end if;

  if public.is_mgmt_staff() then
    null;
  elsif public.is_teacher_role()
    and public.teacher_can_write_attendance(p_class_id, p_schedule_id)
  then
    null;
  else
    raise exception 'NOT_AUTHORIZED'
      using errcode = '42501', hint = '不可為該堂記帳';
  end if;

  select s.class_id into v_sched_class
  from public.schedules s
  where s.id = p_schedule_id;
  if not found or v_sched_class is distinct from p_class_id then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  select c.academic_year_id, ay.label
    into v_year_id, v_year_label
  from public.classes c
  left join public.academic_years ay on ay.id = c.academic_year_id
  where c.id = p_class_id;
  if v_year_id is null or not private.uses_entitlement_roster_label(v_year_label) then
    return;
  end if;

  v_was := private.is_billable_attendance_status(p_previous_status);
  v_is := private.is_billable_attendance_status(p_next_status);
  if v_was = v_is then
    return;
  end if;

  v_units := case when coalesce(p_lesson_units, 0) > 0 then p_lesson_units else 1 end;
  v_delta := case when v_is and not v_was then -v_units else v_units end;

  if v_att_id is not null
    and not exists (
      select 1 from public.attendance_details ad where ad.id = v_att_id
    )
  then
    v_att_id := null;
  end if;

  if v_att_id is not null then
    select ece.pool_id
      into v_pool_id
    from public.entitlement_consumption_events ece
    where ece.attendance_detail_id = v_att_id
      and ece.reason in ('entitlement_consumed', 'entitlement_reinstated')
    order by ece.created_at asc
    limit 1;
  end if;

  if v_pool_id is null
    and private.student_has_paid_trial_on_schedule(p_student_id, p_schedule_id)
  then
    select n.course_group, n.namespace_key
      into v_ns_group, v_ns_key
    from private.entitlement_namespace_for_class(p_class_id, true) n;
    v_pool_id := private.pool_id_for_namespace(
      p_student_id, v_year_id, v_ns_group, v_ns_key
    );
    -- 有試堂票但池未鑄：不要改扣專科池
    if v_pool_id is null then
      return;
    end if;
  end if;

  if v_pool_id is null then
    select d.id, d.pool_id
      into v_decl_id, v_decl_pool
    from public.attendance_declarations d
    where d.student_id = p_student_id
      and d.schedule_id = p_schedule_id
      and d.status = 'active'
    order by d.created_at desc
    limit 1;
    v_pool_id := v_decl_pool;
  end if;

  if v_pool_id is null then
    select d.pool_id
      into v_pool_id
    from public.attendance_declarations d
    where d.student_id = p_student_id
      and d.schedule_id = p_schedule_id
      and d.pool_id is not null
    order by d.created_at desc
    limit 1;
  end if;

  if v_pool_id is null
    and private.student_has_paid_trial_on_schedule(p_student_id, p_schedule_id)
  then
    select n.course_group, n.namespace_key
      into v_ns_group, v_ns_key
    from private.entitlement_namespace_for_class(p_class_id, true) n;
    v_pool_id := private.pool_id_for_namespace(
      p_student_id, v_year_id, v_ns_group, v_ns_key
    );
    if v_pool_id is null then
      return;
    end if;
  end if;

  if v_pool_id is null then
    select n.course_group, n.namespace_key
      into v_ns_group, v_ns_key
    from private.entitlement_namespace_for_class(p_class_id, false) n;
    v_pool_id := private.pool_id_for_namespace(
      p_student_id, v_year_id, v_ns_group, v_ns_key
    );
  end if;

  if v_pool_id is null then
    return;
  end if;

  select p.remaining_lessons
    into v_remaining
  from public.student_entitlement_pools p
  where p.id = v_pool_id
  for update;
  if not found then
    return;
  end if;

  update public.student_entitlement_pools
  set
    remaining_lessons = coalesce(v_remaining, 0) + v_delta,
    updated_at = now()
  where id = v_pool_id;

  insert into public.entitlement_consumption_events (
    pool_id,
    student_id,
    schedule_id,
    attendance_detail_id,
    declaration_id,
    delta_lessons,
    reason
  ) values (
    v_pool_id,
    p_student_id,
    p_schedule_id,
    v_att_id,
    case when v_decl_id is not null then v_decl_id else null end,
    v_delta,
    case when v_delta < 0 then 'entitlement_consumed' else 'entitlement_reinstated' end
  );
end;
$$;

comment on function public.apply_attendance_entitlement_delta(uuid, uuid, uuid, uuid, text, text, numeric) is
  '點名計費狀態轉換時由系統扣／退已繳堂數。不跟點名人的 payments.read 或池上蓋印班。剩餘可負。';

revoke all on function private.is_billable_attendance_status(text) from public, anon, authenticated;
revoke all on function private.uses_entitlement_roster_label(text) from public, anon, authenticated;
revoke all on function private.student_has_paid_trial_on_schedule(uuid, uuid) from public, anon, authenticated;
revoke all on function private.normalize_grade_code(text) from public, anon, authenticated;
revoke all on function private.grade_code_from_label(text) from public, anon, authenticated;
revoke all on function private.entitlement_namespace_for_class(uuid, boolean) from public, anon, authenticated;
revoke all on function private.pool_id_for_namespace(uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.apply_attendance_entitlement_delta(uuid, uuid, uuid, uuid, text, text, numeric) from public, anon;
grant execute on function public.apply_attendance_entitlement_delta(uuid, uuid, uuid, uuid, text, text, numeric) to authenticated;

notify pgrst, 'reload schema';

commit;
