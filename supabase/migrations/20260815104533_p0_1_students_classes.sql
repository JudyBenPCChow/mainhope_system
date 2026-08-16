-- P0-1 domain 2：學生／班別／報讀／Portal 邀請改用 capability predicate。
-- 未喺 staging allow-deny 通過前，唔好套 production（禁 npm run db:apply --linked）。
--
-- 讀：students.read／classes.read（職員全表；老師／家長 SELECT 政策唔郁）
-- 學生寫：create／update（DELETE 亦用 update）
-- 報讀寫：students.enroll
-- 邀請寫：portal.invite
-- 今次唔收：trial_sessions、pending lessons、前台填表、聯絡 token、Portal 報讀申請、courses

-- 職員讀要用 is_mgmt_staff() 收窄：teacher 亦有 students.read／classes.read，
-- 但只可以行現有 row-scope SELECT，唔可以睇全表。

drop policy if exists rls_phase_b_mgmt_all_students on public.students;
drop policy if exists rls_cap_select_students on public.students;
drop policy if exists rls_cap_insert_students on public.students;
drop policy if exists rls_cap_update_students on public.students;
drop policy if exists rls_cap_delete_students on public.students;

create policy rls_cap_select_students
on public.students for select to authenticated
using (private.has_capability('students.read') and public.is_mgmt_staff());

create policy rls_cap_insert_students
on public.students for insert to authenticated
with check (private.has_capability('students.create'));

create policy rls_cap_update_students
on public.students for update to authenticated
using (private.has_capability('students.update'))
with check (private.has_capability('students.update'));

create policy rls_cap_delete_students
on public.students for delete to authenticated
using (private.has_capability('students.update'));

drop policy if exists rls_phase_b_mgmt_all_classes on public.classes;
drop policy if exists rls_cap_select_classes on public.classes;
drop policy if exists rls_cap_insert_classes on public.classes;
drop policy if exists rls_cap_update_classes on public.classes;
drop policy if exists rls_cap_delete_classes on public.classes;

create policy rls_cap_select_classes
on public.classes for select to authenticated
using (private.has_capability('classes.read') and public.is_mgmt_staff());

create policy rls_cap_insert_classes
on public.classes for insert to authenticated
with check (private.has_capability('classes.create'));

create policy rls_cap_update_classes
on public.classes for update to authenticated
using (private.has_capability('classes.update'))
with check (private.has_capability('classes.update'));

create policy rls_cap_delete_classes
on public.classes for delete to authenticated
using (private.has_capability('classes.update'));

drop policy if exists rls_phase_b_mgmt_all_student_class_enrollments
  on public.student_class_enrollments;
drop policy if exists rls_cap_select_student_class_enrollments
  on public.student_class_enrollments;
drop policy if exists rls_cap_write_student_class_enrollments
  on public.student_class_enrollments;

create policy rls_cap_select_student_class_enrollments
on public.student_class_enrollments for select to authenticated
using (private.has_capability('students.read') and public.is_mgmt_staff());

create policy rls_cap_write_student_class_enrollments
on public.student_class_enrollments for all to authenticated
using (private.has_capability('students.enroll'))
with check (private.has_capability('students.enroll'));

drop policy if exists rls_mgmt_all_student_enrollment_sessions
  on public.student_enrollment_sessions;
drop policy if exists rls_cap_select_student_enrollment_sessions
  on public.student_enrollment_sessions;
drop policy if exists rls_cap_write_student_enrollment_sessions
  on public.student_enrollment_sessions;

create policy rls_cap_select_student_enrollment_sessions
on public.student_enrollment_sessions for select to authenticated
using (private.has_capability('students.read') and public.is_mgmt_staff());

create policy rls_cap_write_student_enrollment_sessions
on public.student_enrollment_sessions for all to authenticated
using (private.has_capability('students.enroll'))
with check (private.has_capability('students.enroll'));

drop policy if exists rls_phase_b_mgmt_all_enrollment_change_events
  on public.enrollment_change_events;
drop policy if exists rls_cap_select_enrollment_change_events
  on public.enrollment_change_events;
drop policy if exists rls_cap_write_enrollment_change_events
  on public.enrollment_change_events;

create policy rls_cap_select_enrollment_change_events
on public.enrollment_change_events for select to authenticated
using (private.has_capability('students.read') and public.is_mgmt_staff());

create policy rls_cap_write_enrollment_change_events
on public.enrollment_change_events for all to authenticated
using (private.has_capability('students.enroll'))
with check (private.has_capability('students.enroll'));

drop policy if exists rls_phase_b_mgmt_all_student_relationships
  on public.student_relationships;
drop policy if exists rls_cap_select_student_relationships
  on public.student_relationships;
drop policy if exists rls_cap_write_student_relationships
  on public.student_relationships;

create policy rls_cap_select_student_relationships
on public.student_relationships for select to authenticated
using (private.has_capability('students.read') and public.is_mgmt_staff());

create policy rls_cap_write_student_relationships
on public.student_relationships for all to authenticated
using (private.has_capability('students.update'))
with check (private.has_capability('students.update'));

drop policy if exists rls_phase_b_mgmt_all_student_status_history
  on public.student_status_history;
drop policy if exists rls_cap_select_student_status_history
  on public.student_status_history;
drop policy if exists rls_cap_write_student_status_history
  on public.student_status_history;

create policy rls_cap_select_student_status_history
on public.student_status_history for select to authenticated
using (private.has_capability('students.read') and public.is_mgmt_staff());

create policy rls_cap_write_student_status_history
on public.student_status_history for all to authenticated
using (private.has_capability('students.update'))
with check (private.has_capability('students.update'));

drop policy if exists portal_invites_mgmt_all on public.student_portal_invites;
drop policy if exists rls_cap_select_student_portal_invites
  on public.student_portal_invites;
drop policy if exists rls_cap_write_student_portal_invites
  on public.student_portal_invites;

create policy rls_cap_select_student_portal_invites
on public.student_portal_invites for select to authenticated
using (private.has_capability('students.read') and public.is_mgmt_staff());

create policy rls_cap_write_student_portal_invites
on public.student_portal_invites for all to authenticated
using (private.has_capability('portal.invite'))
with check (private.has_capability('portal.invite'));

update private.authz_meta
set authz_version = 3,
    updated_at = now()
where id = 1;
