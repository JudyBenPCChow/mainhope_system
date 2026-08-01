-- legacy 表：管理層可讀（manager ≥ admin 讀權限）
-- 寫入維持 admin｜alien（FOR ALL 政策不變）

drop policy if exists legacy_import_batches_mgmt_select on public.legacy_import_batches;
create policy legacy_import_batches_mgmt_select
on public.legacy_import_batches
for select
to authenticated
using (public.is_mgmt_staff());

drop policy if exists legacy_student_subject_enrollments_mgmt_select
  on public.legacy_student_subject_enrollments;
create policy legacy_student_subject_enrollments_mgmt_select
on public.legacy_student_subject_enrollments
for select
to authenticated
using (public.is_mgmt_staff());
