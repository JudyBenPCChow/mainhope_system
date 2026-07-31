-- mgmt manager role：新增 manager；CHECK DROP+ADD；is_mgmt_staff／profile／roster 支援
-- 套用：npm run db:apply -- supabase/migrations/20260801020000_mgmt_manager_role.sql
--
-- rollback（手動）：
--   alter table public.app_user_roles drop constraint if exists app_user_roles_role_check;
--   alter table public.app_user_roles add constraint app_user_roles_role_check
--     check (role in ('admin', 'teacher', 'alien'));
--   alter table public.mgmt_active_roles drop constraint if exists mgmt_active_roles_active_role_check;
--   alter table public.mgmt_active_roles add constraint mgmt_active_roles_active_role_check
--     check (active_role in ('admin', 'teacher', 'alien'));
--   alter table public.app_users drop constraint if exists app_users_role_check;
--   alter table public.app_users add constraint app_users_role_check
--     check (role in ('admin', 'teacher', 'alien', 'student'));
--   create or replace function public.is_mgmt_staff()
--   returns boolean language sql stable security invoker set search_path = public
--   as $$ select coalesce(public.current_app_role(), '') in ('admin', 'alien'); $$;

begin;

-- ---------------------------------------------------------------------------
-- CHECK constraints（PG 不支援直接 ALTER CHECK → DROP + ADD）
-- ---------------------------------------------------------------------------

alter table public.app_user_roles drop constraint if exists app_user_roles_role_check;
alter table public.app_user_roles
  add constraint app_user_roles_role_check
  check (role in ('admin', 'teacher', 'alien', 'manager'));

alter table public.mgmt_active_roles drop constraint if exists mgmt_active_roles_active_role_check;
alter table public.mgmt_active_roles
  add constraint mgmt_active_roles_active_role_check
  check (active_role in ('admin', 'teacher', 'alien', 'manager'));

alter table public.app_users drop constraint if exists app_users_role_check;
alter table public.app_users
  add constraint app_users_role_check
  check (role in ('admin', 'teacher', 'alien', 'manager', 'student'));

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_mgmt_staff()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(public.current_app_role(), '') in ('admin', 'manager', 'alien');
$$;

comment on function public.is_mgmt_staff() is
  'RLS：admin／manager／alien。manager 第一期視同職員可讀寫（UI 收緊破壞性操作）；第二期再拆 reader／writer。';

create or replace function public.get_my_mgmt_profile()
returns table (
  email text,
  display_name text,
  active_role text,
  teacher_id uuid,
  available_roles text[]
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    au.email,
    au.display_name,
    public.current_app_role(),
    public.current_teacher_id(),
    coalesce(
      (
        select array_agg(aur.role order by
          case aur.role
            when 'teacher' then 1
            when 'admin' then 2
            when 'manager' then 3
            when 'alien' then 4
            else 5
          end
        )
        from public.app_user_roles aur
        where aur.app_user_id = au.id
      ),
      array[au.role]::text[]
    )
  from public.app_users au
  where au.id = public.current_app_user_id()
    and public.current_app_role() in ('admin', 'manager', 'teacher', 'alien')
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- Roster RPC：職員列舉加 manager（is_mgmt_staff 已含 manager，授權計數會自動通）
-- ---------------------------------------------------------------------------

create or replace function public.get_teacher_schedule_roster_context(p_schedule_ids uuid[])
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_schedule_ids uuid[];
  v_requested_count integer;
  v_authorized_count integer;
begin
  if public.current_app_role() not in ('admin', 'alien', 'teacher', 'manager') then
    raise exception 'NOT_AUTHORIZED';
  end if;

  select coalesce(array_agg(x order by x), array[]::uuid[])
  into v_schedule_ids
  from (
    select distinct unnest(coalesce(p_schedule_ids, array[]::uuid[])) as x
  ) requested
  where x is not null;

  v_requested_count := cardinality(v_schedule_ids);
  if v_requested_count = 0 then
    return jsonb_build_object(
      'schedules', '[]'::jsonb,
      'periods', '[]'::jsonb,
      'enrollments', '[]'::jsonb,
      'enrollment_sessions', '[]'::jsonb,
      'trials', '[]'::jsonb,
      'leaves', '[]'::jsonb,
      'attendance', '[]'::jsonb
    );
  end if;
  if v_requested_count > 100 then
    raise exception 'TOO_MANY_SCHEDULES';
  end if;

  select count(*)
  into v_authorized_count
  from public.schedules s
  where s.id = any(v_schedule_ids)
    and (
      public.is_mgmt_staff()
      or (
        public.is_teacher_role()
        and public.teacher_owns_schedule_row(
          public.current_teacher_id(),
          s.class_id,
          s.teacher_id,
          s.original_teacher_id
        )
      )
    );

  if v_authorized_count <> v_requested_count then
    raise exception 'SCHEDULE_ACCESS_DENIED';
  end if;

  return (
    with requested_schedules as (
      select
        s.id,
        s.class_id,
        s.scheduled_date,
        s.session_number,
        c.academic_year_id,
        ay.label as academic_year_label,
        c.subject,
        c.class_kind,
        c.course_code_full,
        c.day_of_week,
        c.time_slot,
        c.lesson_slots_per_session,
        co.course_name,
        case
          when co.course_mode = 'summer_two_period' then 'summer_two_period'
          else 'regular'
        end as course_mode
      from public.schedules s
      left join public.classes c on c.id = s.class_id
      left join public.courses co on co.id = c.course_id
      left join public.academic_years ay on ay.id = c.academic_year_id
      where s.id = any(v_schedule_ids)
    ),
    requested_classes as (
      select distinct rs.class_id
      from requested_schedules rs
      where rs.class_id is not null
    ),
    requested_years as (
      select distinct rs.academic_year_id
      from requested_schedules rs
      where rs.academic_year_id is not null
    ),
    enrollment_rows as (
      select
        e.id,
        e.class_id,
        e.student_id,
        e.status,
        e.enroll_date,
        e.withdraw_effective_date,
        e.enrollment_period,
        e.created_at,
        st.full_name,
        st.english_name,
        st.grade,
        st.school,
        coalesce(
          nullif(btrim(st.whatsapp), ''),
          nullif(btrim(st.student_phone), ''),
          nullif(btrim(st.parent_phone), '')
        ) as contact_phone
      from public.student_class_enrollments e
      join requested_classes rc on rc.class_id = e.class_id
      join public.students st on st.id = e.student_id
      where e.status = '就讀中'
    ),
    relevant_leaves as (
      select distinct
        l.id,
        l.student_id,
        l.class_id,
        l.schedule_id,
        l.leave_date,
        l.leave_reason,
        l.makeup_type,
        l.makeup_schedule_id,
        l.status,
        l.created_at,
        st.full_name,
        st.english_name,
        st.grade,
        coalesce(
          nullif(btrim(st.whatsapp), ''),
          nullif(btrim(st.student_phone), ''),
          nullif(btrim(st.parent_phone), '')
        ) as contact_phone
      from public.leave_makeup_records l
      join public.students st on st.id = l.student_id
      where l.schedule_id = any(v_schedule_ids)
         or l.makeup_schedule_id = any(v_schedule_ids)
         or exists (
           select 1
           from requested_schedules rs
           where rs.class_id = l.class_id
             and rs.scheduled_date = l.leave_date
         )
    ),
    relevant_attendance as (
      select distinct
        a.id,
        a.student_id,
        a.class_id,
        a.attendance_date,
        a.schedule_id,
        a.status,
        a.remarks,
        a.created_at,
        st.full_name,
        st.english_name
      from public.attendance_details a
      join public.students st on st.id = a.student_id
      where a.schedule_id = any(v_schedule_ids)
         or (
           a.schedule_id is null
           and exists (
             select 1
             from requested_schedules rs
             where rs.class_id = a.class_id
               and rs.scheduled_date = a.attendance_date
           )
         )
    )
    select jsonb_build_object(
      'schedules',
      coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', rs.id,
            'class_id', rs.class_id,
            'scheduled_date', rs.scheduled_date,
            'session_number', rs.session_number,
            'academic_year_id', rs.academic_year_id,
            'academic_year_label', rs.academic_year_label,
            'subject', rs.subject,
            'class_kind', rs.class_kind,
            'course_code_full', rs.course_code_full,
            'course_name', rs.course_name,
            'day_of_week', rs.day_of_week,
            'time_slot', rs.time_slot,
            'lesson_slots_per_session', rs.lesson_slots_per_session,
            'course_mode', rs.course_mode
          )
          order by rs.scheduled_date, rs.id
        )
        from requested_schedules rs
      ), '[]'::jsonb),
      'periods',
      coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', p.id,
            'academic_year_id', p.academic_year_id,
            'period_code', p.period_code,
            'label', p.label,
            'start_date', p.start_date,
            'end_date', p.end_date
          )
          order by p.academic_year_id, p.period_code
        )
        from public.academic_year_periods p
        join requested_years ry on ry.academic_year_id = p.academic_year_id
      ), '[]'::jsonb),
      'enrollments',
      coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', e.id,
            'class_id', e.class_id,
            'student_id', e.student_id,
            'status', e.status,
            'enroll_date', e.enroll_date,
            'withdraw_effective_date', e.withdraw_effective_date,
            'enrollment_period', e.enrollment_period,
            'created_at', e.created_at,
            'full_name', e.full_name,
            'english_name', e.english_name,
            'grade', e.grade,
            'school', e.school,
            'contact_phone', e.contact_phone
          )
          order by e.created_at, e.id
        )
        from enrollment_rows e
      ), '[]'::jsonb),
      'enrollment_sessions',
      coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'enrollment_id', es.enrollment_id,
            'schedule_id', es.schedule_id,
            'session_number', s.session_number
          )
          order by es.enrollment_id, s.session_number nulls last, es.schedule_id
        )
        from public.student_enrollment_sessions es
        join enrollment_rows e on e.id = es.enrollment_id
        join public.schedules s on s.id = es.schedule_id
      ), '[]'::jsonb),
      'trials',
      coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', t.id,
            'schedule_id', t.schedule_id,
            'class_id', t.class_id,
            'student_id', t.student_id,
            'status', t.status,
            'full_name', st.full_name,
            'english_name', st.english_name,
            'grade', st.grade,
            'contact_phone', coalesce(
              nullif(btrim(st.whatsapp), ''),
              nullif(btrim(st.student_phone), ''),
              nullif(btrim(st.parent_phone), '')
            )
          )
          order by t.created_at, t.id
        )
        from public.trial_sessions t
        join public.students st on st.id = t.student_id
        where t.schedule_id = any(v_schedule_ids)
      ), '[]'::jsonb),
      'leaves',
      coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', l.id,
            'student_id', l.student_id,
            'class_id', l.class_id,
            'schedule_id', l.schedule_id,
            'leave_date', l.leave_date,
            'leave_reason', l.leave_reason,
            'makeup_type', l.makeup_type,
            'makeup_schedule_id', l.makeup_schedule_id,
            'status', l.status,
            'created_at', l.created_at,
            'full_name', l.full_name,
            'english_name', l.english_name,
            'grade', l.grade,
            'contact_phone', l.contact_phone
          )
          order by l.created_at, l.id
        )
        from relevant_leaves l
      ), '[]'::jsonb),
      'attendance',
      coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', a.id,
            'student_id', a.student_id,
            'class_id', a.class_id,
            'attendance_date', a.attendance_date,
            'schedule_id', a.schedule_id,
            'status', a.status,
            'remarks', a.remarks,
            'created_at', a.created_at,
            'full_name', a.full_name,
            'english_name', a.english_name
          )
          order by a.created_at, a.id
        )
        from relevant_attendance a
      ), '[]'::jsonb)
    )
  );
end;
$$;

commit;
