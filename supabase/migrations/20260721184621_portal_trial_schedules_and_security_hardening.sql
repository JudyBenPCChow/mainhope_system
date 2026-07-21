-- Portal：試堂時間表（student-scoped RPC）+ 邀請綁定／級別 helper 安全加固。
-- 不擴闊 portal_select_schedules（避免試堂學生讀取整班排程）。

begin;

-- ---------------------------------------------------------------------------
-- 1. list_portal_my_trial_schedules：僅 current_portal_student_id() 的試堂
-- ---------------------------------------------------------------------------

create or replace function public.list_portal_my_trial_schedules(
  p_from date default null,
  p_to date default null,
  p_limit integer default null
)
returns table (
  trial_id uuid,
  payment_id uuid,
  schedule_id uuid,
  class_id uuid,
  scheduled_date date,
  start_time text,
  end_time text,
  schedule_status text,
  session_number integer,
  teacher_id uuid,
  classroom_id uuid,
  subject text,
  course_code_full text,
  teacher_name text,
  classroom_name text,
  trial_type text,
  trial_status text,
  trial_date date
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_student_id uuid := public.current_portal_student_id();
  v_limit integer;
begin
  if v_student_id is null then
    raise exception 'NOT_PORTAL_STUDENT';
  end if;

  if p_limit is not null and p_limit < 1 then
    raise exception 'INVALID_LIMIT';
  end if;
  if p_limit is not null and p_limit > 200 then
    raise exception 'LIMIT_TOO_LARGE';
  end if;
  v_limit := coalesce(p_limit, 200);

  return query
  select
    ts.id as trial_id,
    ts.payment_id,
    ts.schedule_id,
    coalesce(ts.class_id, s.class_id) as class_id,
    coalesce(s.scheduled_date, ts.trial_date) as scheduled_date,
    s.start_time::text as start_time,
    s.end_time::text as end_time,
    s.status as schedule_status,
    s.session_number,
    s.teacher_id,
    s.classroom_id,
    c.subject,
    c.course_code_full,
    coalesce(nullif(btrim(t.abbr), ''), t.full_name) as teacher_name,
    cr.name as classroom_name,
    ts.trial_type,
    ts.status as trial_status,
    ts.trial_date
  from public.trial_sessions ts
  left join public.schedules s on s.id = ts.schedule_id
  left join public.classes c on c.id = coalesce(ts.class_id, s.class_id)
  left join public.teachers t on t.id = s.teacher_id
  left join public.classrooms cr on cr.id = s.classroom_id
  where ts.student_id = v_student_id
    and coalesce(ts.status, '') not in ('已取消', '取消')
    and (
      p_from is null
      or coalesce(s.scheduled_date, ts.trial_date) >= p_from
    )
    and (
      p_to is null
      or coalesce(s.scheduled_date, ts.trial_date) <= p_to
    )
  order by
    coalesce(s.scheduled_date, ts.trial_date) asc,
    s.start_time asc nulls last,
    ts.created_at asc
  limit v_limit;
end;
$$;

comment on function public.list_portal_my_trial_schedules(date, date, integer) is
  'Portal: current student trial sessions with minimal schedule display fields. Does not broaden schedules RLS.';

revoke all on function public.list_portal_my_trial_schedules(date, date, integer) from public;
revoke all on function public.list_portal_my_trial_schedules(date, date, integer) from anon;
grant execute on function public.list_portal_my_trial_schedules(date, date, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. redeem_portal_invite：禁止覆寫 admin / teacher / alien
-- ---------------------------------------------------------------------------

create or replace function public.redeem_portal_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := public.current_app_user_email();
  v_invite public.student_portal_invites;
  v_user_id uuid;
  v_name text;
  v_existing_role text;
begin
  if v_email is null or v_email = '' then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select * into v_invite
  from public.student_portal_invites
  where token = p_token
  limit 1;

  if not found then
    raise exception 'INVITE_NOT_FOUND';
  end if;
  if v_invite.used_at is not null then
    raise exception 'INVITE_ALREADY_USED';
  end if;
  if v_invite.expires_at < now() then
    raise exception 'INVITE_EXPIRED';
  end if;

  select au.role
  into v_existing_role
  from public.app_users au
  where lower(coalesce(au.email, '')) = v_email
  limit 1;

  if v_existing_role in ('admin', 'teacher', 'alien') then
    raise exception 'MGMT_ACCOUNT_CANNOT_REDEEM_PORTAL_INVITE';
  end if;

  select coalesce(full_name, '家長') into v_name
  from public.students where id = v_invite.student_id;

  update public.app_users
    set role = 'student',
        student_id = v_invite.student_id,
        updated_at = now()
  where lower(coalesce(email, '')) = v_email
  returning id into v_user_id;

  if v_user_id is null then
    insert into public.app_users (email, display_name, role, student_id)
    values (v_email, v_name, 'student', v_invite.student_id)
    returning id into v_user_id;
  end if;

  update public.student_portal_invites
    set used_at = now(), used_by_email = v_email
    where id = v_invite.id;

  return v_invite.student_id;
end;
$$;

comment on function public.redeem_portal_invite(text) is
  'Portal: bind JWT email to invite student_id. Refuses to overwrite admin/teacher/alien accounts.';

-- ---------------------------------------------------------------------------
-- 3. Grade helpers：僅本人或 mgmt staff 可讀級別
-- ---------------------------------------------------------------------------

create or replace function public.portal_student_grade_label(p_student_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_student_id is null then
    return null;
  end if;
  if not (
    public.is_mgmt_staff()
    or p_student_id = public.current_portal_student_id()
  ) then
    return null;
  end if;

  return (
    select public.grade_code_to_label(s.grade)
    from public.students s
    where s.id = p_student_id
  );
end;
$$;

create or replace function public.portal_class_matches_student_grade(
  p_class_id uuid,
  p_student_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_class_id is null or p_student_id is null then
    return false;
  end if;
  if not (
    public.is_mgmt_staff()
    or p_student_id = public.current_portal_student_id()
  ) then
    return false;
  end if;

  return exists (
    select 1
    from public.classes c
    left join public.courses co on co.id = c.course_id
    cross join lateral (
      select public.portal_student_grade_label(p_student_id) as lbl
    ) g
    where c.id = p_class_id
      and g.lbl is not null
      and c.class_kind = 'group'
      and coalesce(c.status, '') not ilike '%已結束%'
      and (
        exists (
          select 1
          from unnest(coalesce(c.grade, '{}'::text[])) gr
          where public.normalize_class_grade_label(gr) = g.lbl
             or gr = g.lbl
             or gr like g.lbl || '%'
        )
        or public.grade_code_to_label(co.grade_code) = g.lbl
      )
  );
end;
$$;

commit;
