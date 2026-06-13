-- Phase B hotfix: stop RLS infinite recursion (stack depth limit exceeded).
-- SECURITY INVOKER helpers that read app_users / scoped tables re-enter RLS when used in policies.
-- These helpers only resolve the current JWT user; DEFINER bypass is the standard Supabase pattern.

begin;

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select au.role
  from public.app_users au
  where lower(coalesce(au.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
  limit 1;
$$;

create or replace function public.current_teacher_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select au.teacher_id
  from public.app_users au
  where lower(coalesce(au.email, '')) = public.current_app_user_email()
  limit 1;
$$;

create or replace function public.current_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select au.id
  from public.app_users au
  where lower(coalesce(au.email, '')) = public.current_app_user_email()
  limit 1;
$$;

create or replace function public.teacher_can_access_class(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.classes c
    where c.id = p_class_id
      and c.teacher_id = public.current_teacher_id()
  );
$$;

create or replace function public.teacher_can_access_schedule(p_schedule_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.schedules s
    left join public.classes c on c.id = s.class_id
    where s.id = p_schedule_id
      and (
        s.teacher_id = public.current_teacher_id()
        or c.teacher_id = public.current_teacher_id()
      )
  );
$$;

create or replace function public.teacher_can_access_student(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.student_class_enrollments e
    join public.classes c on c.id = e.class_id
    where e.student_id = p_student_id
      and c.teacher_id = public.current_teacher_id()
  )
  or exists (
    select 1
    from public.calendar_event_students ces
    join public.calendar_event_teachers cet on cet.event_id = ces.event_id
    where ces.student_id = p_student_id
      and cet.teacher_id = public.current_teacher_id()
  );
$$;

create or replace function public.teacher_can_access_calendar_event(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.calendar_events e
    where e.id = p_event_id
      and (
        e.visibility = 'teachers'
        or exists (
          select 1
          from public.calendar_event_teachers cet
          where cet.event_id = e.id
            and cet.teacher_id = public.current_teacher_id()
        )
      )
  );
$$;

revoke all on function public.current_app_role() from public;
revoke all on function public.current_app_role() from anon;
grant execute on function public.current_app_role() to authenticated;

revoke all on function public.current_teacher_id() from public;
revoke all on function public.current_teacher_id() from anon;
grant execute on function public.current_teacher_id() to authenticated;

revoke all on function public.current_app_user_id() from public;
revoke all on function public.current_app_user_id() from anon;
grant execute on function public.current_app_user_id() to authenticated;

revoke all on function public.teacher_can_access_class(uuid) from public;
revoke all on function public.teacher_can_access_class(uuid) from anon;
grant execute on function public.teacher_can_access_class(uuid) to authenticated;

revoke all on function public.teacher_can_access_schedule(uuid) from public;
revoke all on function public.teacher_can_access_schedule(uuid) from anon;
grant execute on function public.teacher_can_access_schedule(uuid) to authenticated;

revoke all on function public.teacher_can_access_student(uuid) from public;
revoke all on function public.teacher_can_access_student(uuid) from anon;
grant execute on function public.teacher_can_access_student(uuid) to authenticated;

revoke all on function public.teacher_can_access_calendar_event(uuid) from public;
revoke all on function public.teacher_can_access_calendar_event(uuid) from anon;
grant execute on function public.teacher_can_access_calendar_event(uuid) to authenticated;

comment on function public.current_app_role() is
  'RLS helper: JWT email → app_users.role. SECURITY DEFINER avoids app_users policy recursion.';
comment on function public.current_teacher_id() is
  'RLS helper: JWT email → app_users.teacher_id. SECURITY DEFINER avoids app_users policy recursion.';
comment on function public.current_app_user_id() is
  'RLS helper: JWT email → app_users.id. SECURITY DEFINER avoids app_users policy recursion.';
comment on function public.teacher_can_access_class(uuid) is
  'RLS helper: DEFINER to avoid classes policy recursion.';
comment on function public.teacher_can_access_schedule(uuid) is
  'RLS helper: DEFINER to avoid schedules policy recursion.';
comment on function public.teacher_can_access_student(uuid) is
  'RLS helper: DEFINER to avoid students/calendar policy recursion.';
comment on function public.teacher_can_access_calendar_event(uuid) is
  'RLS helper: DEFINER to avoid calendar_events policy recursion.';

commit;
