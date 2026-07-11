-- Remove production-only temporary SELECT bypasses (USING true for anon+authenticated).
-- These were not in git; they defeated Phase B/C role scoping on SELECT.
-- Formal rls_phase_b_*/rls_phase_c_*/portal_* policies are left unchanged.

begin;

drop policy if exists temp_frontend_read_admin_todos on public.admin_todos;
drop policy if exists temp_frontend_read_classes on public.classes;
drop policy if exists temp_frontend_read_classrooms on public.classrooms;
drop policy if exists temp_frontend_read_leave_makeup_records on public.leave_makeup_records;
drop policy if exists temp_frontend_read_mgmt_audit_log on public.mgmt_audit_log;
drop policy if exists temp_frontend_read_mgmt_system_errors on public.mgmt_system_errors;
drop policy if exists temp_frontend_read_payments on public.payments;
drop policy if exists temp_frontend_read_schedules on public.schedules;
drop policy if exists temp_frontend_read_student_class_enrollments on public.student_class_enrollments;
drop policy if exists temp_frontend_read_students on public.students;
drop policy if exists temp_frontend_read_teachers on public.teachers;

commit;
