-- RLS Phase B: teacher scoped access via current_teacher_id(); admin/alien retain full access.
-- Replaces rls_phase_a_auth_all_* on affected tables. Phase C will refine admin/alien splits.
-- Rollback: re-apply 20260615170000_rls_phase_a_require_auth.sql (see docs/RLS_ROLLOUT.md).

begin;

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
  select coalesce(public.current_app_role(), '') in ('admin', 'alien');
$$;

create or replace function public.is_teacher_role()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(public.current_app_role(), '') = 'teacher';
$$;

create or replace function public.current_app_user_id()
returns uuid
language sql
stable
security invoker
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
security invoker
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
security invoker
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
security invoker
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
security invoker
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

revoke all on function public.is_mgmt_staff() from public;
revoke all on function public.is_mgmt_staff() from anon;
grant execute on function public.is_mgmt_staff() to authenticated;

revoke all on function public.is_teacher_role() from public;
revoke all on function public.is_teacher_role() from anon;
grant execute on function public.is_teacher_role() to authenticated;

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

comment on function public.is_mgmt_staff() is 'RLS Phase B: admin or alien.';
comment on function public.is_teacher_role() is 'RLS Phase B: app_users.role = teacher.';
comment on function public.teacher_can_access_class(uuid) is 'RLS Phase B: class assigned to current teacher.';
comment on function public.teacher_can_access_schedule(uuid) is 'RLS Phase B: schedule owned by or class assigned to current teacher.';
comment on function public.teacher_can_access_student(uuid) is 'RLS Phase B: student enrolled in teacher class or linked via assigned todo.';
comment on function public.teacher_can_access_calendar_event(uuid) is 'RLS Phase B: todo visible to current teacher.';

-- ---------------------------------------------------------------------------
-- Drop Phase A transitional policies (replaced below)
-- ---------------------------------------------------------------------------

do $$
declare
  r record;
begin
  for r in
    select c.relname as tablename
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relrowsecurity = true
  loop
    execute format('drop policy if exists rls_phase_a_auth_all_%I on public.%I', r.tablename, r.tablename);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Admin / alien: full access helper macro via repeated policy names
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
  mgmt_only text[] := array[
    'payments',
    'payment_details',
    'payment_batches',
    'payment_discounts',
    'payment_discount_applications',
    'referral_records',
    'admin_todos',
    'enrollment_change_events',
    'student_status_history',
    'student_relationships',
    'teacher_availability_slots',
    'mgmt_audit_log',
    'mgmt_system_errors',
    'calendar_event_users'
  ];
begin
  foreach t in array mgmt_only loop
    execute format('drop policy if exists rls_phase_b_mgmt_all_%I on public.%I', t, t);
    execute format(
      'create policy rls_phase_b_mgmt_all_%I on public.%I for all to authenticated using (public.is_mgmt_staff()) with check (public.is_mgmt_staff())',
      t,
      t
    );
  end loop;
end $$;

-- Reference tables: mgmt full + teacher read
do $$
declare
  t text;
  ref_tables text[] := array[
    'subjects',
    'academic_years',
    'academic_year_periods',
    'courses',
    'classrooms'
  ];
begin
  foreach t in array ref_tables loop
    execute format('drop policy if exists rls_phase_b_mgmt_all_%I on public.%I', t, t);
    execute format('drop policy if exists rls_phase_b_teacher_select_%I on public.%I', t, t);
    execute format(
      'create policy rls_phase_b_mgmt_all_%I on public.%I for all to authenticated using (public.is_mgmt_staff()) with check (public.is_mgmt_staff())',
      t,
      t
    );
    execute format(
      'create policy rls_phase_b_teacher_select_%I on public.%I for select to authenticated using (public.is_teacher_role())',
      t,
      t
    );
  end loop;
end $$;

-- app_users: mgmt full; any authenticated user reads own row (login bootstrap)
drop policy if exists rls_phase_b_mgmt_all_app_users on public.app_users;
drop policy if exists rls_phase_b_teacher_select_app_users on public.app_users;
drop policy if exists rls_phase_b_auth_select_own_app_user on public.app_users;
create policy rls_phase_b_mgmt_all_app_users
on public.app_users
for all
to authenticated
using (public.is_mgmt_staff())
with check (public.is_mgmt_staff());

create policy rls_phase_b_auth_select_own_app_user
on public.app_users
for select
to authenticated
using (lower(coalesce(email, '')) = public.current_app_user_email());

-- teachers: mgmt full; teacher read all (dropdown labels); update own profile
drop policy if exists rls_phase_b_mgmt_all_teachers on public.teachers;
drop policy if exists rls_phase_b_teacher_select_teachers on public.teachers;
drop policy if exists rls_phase_b_teacher_update_teachers on public.teachers;
create policy rls_phase_b_mgmt_all_teachers
on public.teachers
for all
to authenticated
using (public.is_mgmt_staff())
with check (public.is_mgmt_staff());

create policy rls_phase_b_teacher_select_teachers
on public.teachers
for select
to authenticated
using (public.is_teacher_role());

create policy rls_phase_b_teacher_update_teachers
on public.teachers
for update
to authenticated
using (public.is_teacher_role() and id = public.current_teacher_id())
with check (public.is_teacher_role() and id = public.current_teacher_id());

-- classes
drop policy if exists rls_phase_b_mgmt_all_classes on public.classes;
drop policy if exists rls_phase_b_teacher_select_classes on public.classes;
drop policy if exists rls_phase_b_teacher_update_classes on public.classes;
create policy rls_phase_b_mgmt_all_classes
on public.classes
for all
to authenticated
using (public.is_mgmt_staff())
with check (public.is_mgmt_staff());

create policy rls_phase_b_teacher_select_classes
on public.classes
for select
to authenticated
using (public.is_teacher_role() and public.teacher_can_access_class(id));

create policy rls_phase_b_teacher_update_classes
on public.classes
for update
to authenticated
using (public.is_teacher_role() and public.teacher_can_access_class(id))
with check (public.is_teacher_role() and public.teacher_can_access_class(id));

-- schedules
drop policy if exists rls_phase_b_mgmt_all_schedules on public.schedules;
drop policy if exists rls_phase_b_teacher_all_schedules on public.schedules;
create policy rls_phase_b_mgmt_all_schedules
on public.schedules
for all
to authenticated
using (public.is_mgmt_staff())
with check (public.is_mgmt_staff());

create policy rls_phase_b_teacher_all_schedules
on public.schedules
for all
to authenticated
using (public.is_teacher_role() and public.teacher_can_access_schedule(id))
with check (
  public.is_teacher_role()
  and (
    teacher_id = public.current_teacher_id()
    or public.teacher_can_access_class(class_id)
  )
);

-- student_class_enrollments
drop policy if exists rls_phase_b_mgmt_all_student_class_enrollments on public.student_class_enrollments;
drop policy if exists rls_phase_b_teacher_all_student_class_enrollments on public.student_class_enrollments;
create policy rls_phase_b_mgmt_all_student_class_enrollments
on public.student_class_enrollments
for all
to authenticated
using (public.is_mgmt_staff())
with check (public.is_mgmt_staff());

create policy rls_phase_b_teacher_all_student_class_enrollments
on public.student_class_enrollments
for all
to authenticated
using (public.is_teacher_role() and public.teacher_can_access_class(class_id))
with check (public.is_teacher_role() and public.teacher_can_access_class(class_id));

-- students
drop policy if exists rls_phase_b_mgmt_all_students on public.students;
drop policy if exists rls_phase_b_teacher_select_students on public.students;
create policy rls_phase_b_mgmt_all_students
on public.students
for all
to authenticated
using (public.is_mgmt_staff())
with check (public.is_mgmt_staff());

create policy rls_phase_b_teacher_select_students
on public.students
for select
to authenticated
using (public.is_teacher_role() and public.teacher_can_access_student(id));

-- attendance_details
drop policy if exists rls_phase_b_mgmt_all_attendance_details on public.attendance_details;
drop policy if exists rls_phase_b_teacher_all_attendance_details on public.attendance_details;
create policy rls_phase_b_mgmt_all_attendance_details
on public.attendance_details
for all
to authenticated
using (public.is_mgmt_staff())
with check (public.is_mgmt_staff());

create policy rls_phase_b_teacher_all_attendance_details
on public.attendance_details
for all
to authenticated
using (public.is_teacher_role() and public.teacher_can_access_class(class_id))
with check (public.is_teacher_role() and public.teacher_can_access_class(class_id));

-- leave_makeup_records & trial_sessions (teacher read via class)
drop policy if exists rls_phase_b_mgmt_all_leave_makeup_records on public.leave_makeup_records;
drop policy if exists rls_phase_b_teacher_select_leave_makeup_records on public.leave_makeup_records;
create policy rls_phase_b_mgmt_all_leave_makeup_records
on public.leave_makeup_records
for all
to authenticated
using (public.is_mgmt_staff())
with check (public.is_mgmt_staff());

create policy rls_phase_b_teacher_select_leave_makeup_records
on public.leave_makeup_records
for select
to authenticated
using (public.is_teacher_role() and public.teacher_can_access_class(class_id));

drop policy if exists rls_phase_b_mgmt_all_trial_sessions on public.trial_sessions;
drop policy if exists rls_phase_b_teacher_select_trial_sessions on public.trial_sessions;
create policy rls_phase_b_mgmt_all_trial_sessions
on public.trial_sessions
for all
to authenticated
using (public.is_mgmt_staff())
with check (public.is_mgmt_staff());

create policy rls_phase_b_teacher_select_trial_sessions
on public.trial_sessions
for select
to authenticated
using (public.is_teacher_role() and public.teacher_can_access_class(class_id));

-- classroom_booking_requests
drop policy if exists rls_phase_b_mgmt_all_classroom_booking_requests on public.classroom_booking_requests;
drop policy if exists rls_phase_b_teacher_all_classroom_booking_requests on public.classroom_booking_requests;
create policy rls_phase_b_mgmt_all_classroom_booking_requests
on public.classroom_booking_requests
for all
to authenticated
using (public.is_mgmt_staff())
with check (public.is_mgmt_staff());

create policy rls_phase_b_teacher_all_classroom_booking_requests
on public.classroom_booking_requests
for all
to authenticated
using (
  public.is_teacher_role()
  and requesting_teacher_id = public.current_teacher_id()
)
with check (
  public.is_teacher_role()
  and requesting_teacher_id = public.current_teacher_id()
);

-- calendar_events
drop policy if exists rls_phase_b_mgmt_all_calendar_events on public.calendar_events;
drop policy if exists rls_phase_b_teacher_select_calendar_events on public.calendar_events;
create policy rls_phase_b_mgmt_all_calendar_events
on public.calendar_events
for all
to authenticated
using (public.is_mgmt_staff())
with check (public.is_mgmt_staff());

create policy rls_phase_b_teacher_select_calendar_events
on public.calendar_events
for select
to authenticated
using (public.is_teacher_role() and public.teacher_can_access_calendar_event(id));

-- calendar_event_teachers
drop policy if exists rls_phase_b_mgmt_all_calendar_event_teachers on public.calendar_event_teachers;
drop policy if exists rls_phase_b_teacher_select_calendar_event_teachers on public.calendar_event_teachers;
create policy rls_phase_b_mgmt_all_calendar_event_teachers
on public.calendar_event_teachers
for all
to authenticated
using (public.is_mgmt_staff())
with check (public.is_mgmt_staff());

create policy rls_phase_b_teacher_select_calendar_event_teachers
on public.calendar_event_teachers
for select
to authenticated
using (
  public.is_teacher_role()
  and public.teacher_can_access_calendar_event(event_id)
);

-- calendar_event_students
drop policy if exists rls_phase_b_mgmt_all_calendar_event_students on public.calendar_event_students;
drop policy if exists rls_phase_b_teacher_select_calendar_event_students on public.calendar_event_students;
create policy rls_phase_b_mgmt_all_calendar_event_students
on public.calendar_event_students
for all
to authenticated
using (public.is_mgmt_staff())
with check (public.is_mgmt_staff());

create policy rls_phase_b_teacher_select_calendar_event_students
on public.calendar_event_students
for select
to authenticated
using (
  public.is_teacher_role()
  and public.teacher_can_access_calendar_event(event_id)
);

-- calendar_event_tags
drop policy if exists rls_phase_b_mgmt_all_calendar_event_tags on public.calendar_event_tags;
drop policy if exists rls_phase_b_teacher_select_calendar_event_tags on public.calendar_event_tags;
create policy rls_phase_b_mgmt_all_calendar_event_tags
on public.calendar_event_tags
for all
to authenticated
using (public.is_mgmt_staff())
with check (public.is_mgmt_staff());

create policy rls_phase_b_teacher_select_calendar_event_tags
on public.calendar_event_tags
for select
to authenticated
using (
  public.is_teacher_role()
  and public.teacher_can_access_calendar_event(event_id)
);

-- calendar_event_updates: teacher can add follow-ups on assigned todos
drop policy if exists rls_phase_b_mgmt_all_calendar_event_updates on public.calendar_event_updates;
drop policy if exists rls_phase_b_teacher_select_calendar_event_updates on public.calendar_event_updates;
drop policy if exists rls_phase_b_teacher_insert_calendar_event_updates on public.calendar_event_updates;
create policy rls_phase_b_mgmt_all_calendar_event_updates
on public.calendar_event_updates
for all
to authenticated
using (public.is_mgmt_staff())
with check (public.is_mgmt_staff());

create policy rls_phase_b_teacher_select_calendar_event_updates
on public.calendar_event_updates
for select
to authenticated
using (
  public.is_teacher_role()
  and public.teacher_can_access_calendar_event(event_id)
);

create policy rls_phase_b_teacher_insert_calendar_event_updates
on public.calendar_event_updates
for insert
to authenticated
with check (
  public.is_teacher_role()
  and exists (
    select 1
    from public.calendar_event_teachers cet
    where cet.event_id = calendar_event_updates.event_id
      and cet.teacher_id = public.current_teacher_id()
  )
);

-- enrollment_change_events: teacher read own-class history (ClassDetailView tab)
drop policy if exists rls_phase_b_teacher_select_enrollment_change_events on public.enrollment_change_events;
create policy rls_phase_b_teacher_select_enrollment_change_events
on public.enrollment_change_events
for select
to authenticated
using (public.is_teacher_role() and public.teacher_can_access_class(class_id));

commit;
