-- P0-1 波 5：其餘表／舊 role literal 寫政策。
-- 未喺 staging allow-deny 通過前，唔好套 production（禁 npm run db:apply --linked）。
--
-- 優惠套用 leftover ALL（財務可寫）撤掉；優惠目錄寫入改 catalog.manage
-- 已廢待辦寫入只限外星人；話術庫暫跟 calendar.manage；明日提醒寫入 students.update
-- 舊匯入寫入改 students.enroll（公理 1 含 manager）
-- inbox ops／inbox_reads／portal view-as 今轉唔改

-- ---------------------------------------------------------------------------
-- payment_discount_applications：撤 leftover ALL
-- ---------------------------------------------------------------------------

drop policy if exists rls_mgmt_all_payment_discount_applications
  on public.payment_discount_applications;

-- ---------------------------------------------------------------------------
-- payment_discounts：is_alien() → catalog.manage
-- ---------------------------------------------------------------------------

drop policy if exists rls_phase_c_alien_all_payment_discounts
  on public.payment_discounts;
drop policy if exists rls_cap_write_payment_discounts
  on public.payment_discounts;

create policy rls_cap_write_payment_discounts
on public.payment_discounts for all to authenticated
using (private.has_capability('catalog.manage'))
with check (private.has_capability('catalog.manage'));

-- ---------------------------------------------------------------------------
-- referral_records：撤冗餘 is_alien() ALL（寫入已有 payments.create）
-- ---------------------------------------------------------------------------

drop policy if exists rls_phase_c_alien_all_referral_records
  on public.referral_records;

-- ---------------------------------------------------------------------------
-- admin_todos：畫面已廢；寫入鎖 catalog.manage
-- ---------------------------------------------------------------------------

drop policy if exists rls_phase_b_mgmt_all_admin_todos on public.admin_todos;
drop policy if exists rls_cap_select_admin_todos on public.admin_todos;
drop policy if exists rls_cap_write_admin_todos on public.admin_todos;

create policy rls_cap_select_admin_todos
on public.admin_todos for select to authenticated
using (public.is_mgmt_staff());

create policy rls_cap_write_admin_todos
on public.admin_todos for all to authenticated
using (private.has_capability('catalog.manage'))
with check (private.has_capability('catalog.manage'));

-- ---------------------------------------------------------------------------
-- script_library_entries：暫跟 calendar.manage（無獨立 key；公理 1 前台職員）
-- ---------------------------------------------------------------------------

drop policy if exists script_library_entries_mgmt_all
  on public.script_library_entries;
drop policy if exists rls_cap_select_script_library_entries
  on public.script_library_entries;
drop policy if exists rls_cap_write_script_library_entries
  on public.script_library_entries;

create policy rls_cap_select_script_library_entries
on public.script_library_entries for select to authenticated
using (private.has_capability('calendar.manage'));

create policy rls_cap_write_script_library_entries
on public.script_library_entries for all to authenticated
using (private.has_capability('calendar.manage'))
with check (private.has_capability('calendar.manage'));

-- ---------------------------------------------------------------------------
-- lesson_reminder_logs：寫入 students.update（聯絡學生）；財務只讀
-- ---------------------------------------------------------------------------

drop policy if exists rls_mgmt_all_lesson_reminder_logs
  on public.lesson_reminder_logs;
drop policy if exists rls_cap_select_lesson_reminder_logs
  on public.lesson_reminder_logs;
drop policy if exists rls_cap_write_lesson_reminder_logs
  on public.lesson_reminder_logs;

create policy rls_cap_select_lesson_reminder_logs
on public.lesson_reminder_logs for select to authenticated
using (private.has_capability('students.read') and public.is_mgmt_staff());

create policy rls_cap_write_lesson_reminder_logs
on public.lesson_reminder_logs for all to authenticated
using (private.has_capability('students.update'))
with check (private.has_capability('students.update'));

-- ---------------------------------------------------------------------------
-- legacy import：寫入 students.enroll（公理 1 含 manager）
-- ---------------------------------------------------------------------------

drop policy if exists legacy_import_batches_mgmt_all
  on public.legacy_import_batches;
drop policy if exists rls_cap_write_legacy_import_batches
  on public.legacy_import_batches;

create policy rls_cap_write_legacy_import_batches
on public.legacy_import_batches for all to authenticated
using (private.has_capability('students.enroll'))
with check (private.has_capability('students.enroll'));

drop policy if exists legacy_student_subject_enrollments_mgmt_all
  on public.legacy_student_subject_enrollments;
drop policy if exists rls_cap_write_legacy_student_subject_enrollments
  on public.legacy_student_subject_enrollments;

create policy rls_cap_write_legacy_student_subject_enrollments
on public.legacy_student_subject_enrollments for all to authenticated
using (private.has_capability('students.enroll'))
with check (private.has_capability('students.enroll'));

update private.authz_meta
set authz_version = 9,
    updated_at = now()
where id = 1;
