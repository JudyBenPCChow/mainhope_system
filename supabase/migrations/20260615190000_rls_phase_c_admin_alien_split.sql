-- RLS Phase C: admin / alien split on sensitive tables; tighten teacher class/schedule writes (align UI).
-- Phase B is_mgmt_staff() retained for shared operational tables (students, classes, payments, …).

begin;

-- ---------------------------------------------------------------------------
-- Role helpers (SECURITY DEFINER — same pattern as Phase B hotfix)
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role(), '') = 'admin';
$$;

create or replace function public.is_alien()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role(), '') = 'alien';
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;

revoke all on function public.is_alien() from public;
revoke all on function public.is_alien() from anon;
grant execute on function public.is_alien() to authenticated;

comment on function public.is_admin() is 'RLS Phase C: app_users.role = admin.';
comment on function public.is_alien() is 'RLS Phase C: app_users.role = alien.';

-- ---------------------------------------------------------------------------
-- Teacher: view-only on classes / schedules / enrollments (UI already blocks edits)
-- ---------------------------------------------------------------------------

drop policy if exists rls_phase_b_teacher_update_classes on public.classes;
drop policy if exists rls_phase_b_teacher_all_schedules on public.schedules;
drop policy if exists rls_phase_b_teacher_select_schedules on public.schedules;
drop policy if exists rls_phase_b_teacher_update_schedules on public.schedules;
create policy rls_phase_b_teacher_select_schedules
on public.schedules
for select
to authenticated
using (public.is_teacher_role() and public.teacher_can_access_schedule(id));

create policy rls_phase_b_teacher_update_schedules
on public.schedules
for update
to authenticated
using (public.is_teacher_role() and public.teacher_can_access_schedule(id))
with check (public.is_teacher_role() and public.teacher_can_access_schedule(id));

drop policy if exists rls_phase_b_teacher_all_student_class_enrollments on public.student_class_enrollments;
drop policy if exists rls_phase_b_teacher_select_student_class_enrollments on public.student_class_enrollments;
create policy rls_phase_b_teacher_select_student_class_enrollments
on public.student_class_enrollments
for select
to authenticated
using (public.is_teacher_role() and public.teacher_can_access_class(class_id));

-- ---------------------------------------------------------------------------
-- app_users: alien manages; everyone reads own row for login
-- ---------------------------------------------------------------------------

drop policy if exists rls_phase_b_mgmt_all_app_users on public.app_users;
drop policy if exists rls_phase_c_alien_all_app_users on public.app_users;

create policy rls_phase_c_alien_all_app_users
on public.app_users
for all
to authenticated
using (public.is_alien())
with check (public.is_alien());

-- rls_phase_b_auth_select_own_app_user unchanged (login bootstrap)

-- ---------------------------------------------------------------------------
-- Alien-only (UI: SystemLogs, Users, PaymentDiscounts, ReferralRebates, Courses mgmt)
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
  alien_only text[] := array[
    'referral_records'
  ];
begin
  foreach t in array alien_only loop
    execute format('drop policy if exists rls_phase_b_mgmt_all_%I on public.%I', t, t);
    execute format('drop policy if exists rls_phase_c_alien_all_%I on public.%I', t, t);
    execute format(
      'create policy rls_phase_c_alien_all_%I on public.%I for all to authenticated using (public.is_alien()) with check (public.is_alien())',
      t,
      t
    );
  end loop;
end $$;

-- courses: alien write; admin + teacher read (class creation / embeds)
drop policy if exists rls_phase_b_mgmt_all_courses on public.courses;
drop policy if exists rls_phase_b_teacher_select_courses on public.courses;
drop policy if exists rls_phase_c_alien_all_courses on public.courses;
drop policy if exists rls_phase_c_admin_select_courses on public.courses;

create policy rls_phase_c_alien_all_courses
on public.courses
for all
to authenticated
using (public.is_alien())
with check (public.is_alien());

create policy rls_phase_c_admin_select_courses
on public.courses
for select
to authenticated
using (public.is_admin());

create policy rls_phase_b_teacher_select_courses
on public.courses
for select
to authenticated
using (public.is_teacher_role());

-- payment_discounts + applications: alien write; admin read (Payments page embed)
drop policy if exists rls_phase_b_mgmt_all_payment_discounts on public.payment_discounts;
drop policy if exists rls_phase_b_mgmt_all_payment_discount_applications on public.payment_discount_applications;
drop policy if exists rls_phase_c_alien_all_payment_discounts on public.payment_discounts;
drop policy if exists rls_phase_c_alien_all_payment_discount_applications on public.payment_discount_applications;
drop policy if exists rls_phase_c_admin_select_payment_discounts on public.payment_discounts;
drop policy if exists rls_phase_c_admin_select_payment_discount_applications on public.payment_discount_applications;

create policy rls_phase_c_alien_all_payment_discounts
on public.payment_discounts
for all
to authenticated
using (public.is_alien())
with check (public.is_alien());

create policy rls_phase_c_admin_select_payment_discounts
on public.payment_discounts
for select
to authenticated
using (public.is_admin());

create policy rls_phase_c_alien_all_payment_discount_applications
on public.payment_discount_applications
for all
to authenticated
using (public.is_alien())
with check (public.is_alien());

create policy rls_phase_c_admin_select_payment_discount_applications
on public.payment_discount_applications
for select
to authenticated
using (public.is_admin());

-- mgmt logs: alien reads; any authenticated may append (audit / error reporting)
drop policy if exists rls_phase_b_mgmt_all_mgmt_audit_log on public.mgmt_audit_log;
drop policy if exists rls_phase_b_mgmt_all_mgmt_system_errors on public.mgmt_system_errors;
drop policy if exists rls_phase_c_alien_select_mgmt_audit_log on public.mgmt_audit_log;
drop policy if exists rls_phase_c_auth_insert_mgmt_audit_log on public.mgmt_audit_log;
drop policy if exists rls_phase_c_alien_select_mgmt_system_errors on public.mgmt_system_errors;
drop policy if exists rls_phase_c_auth_insert_mgmt_system_errors on public.mgmt_system_errors;

create policy rls_phase_c_alien_select_mgmt_audit_log
on public.mgmt_audit_log
for select
to authenticated
using (public.is_alien());

create policy rls_phase_c_auth_insert_mgmt_audit_log
on public.mgmt_audit_log
for insert
to authenticated
with check (true);

create policy rls_phase_c_alien_select_mgmt_system_errors
on public.mgmt_system_errors
for select
to authenticated
using (public.is_alien());

create policy rls_phase_c_auth_insert_mgmt_system_errors
on public.mgmt_system_errors
for insert
to authenticated
with check (true);

-- payments*, admin_todos, enrollment*, etc. stay rls_phase_b_mgmt_all_* (admin + alien)

commit;
