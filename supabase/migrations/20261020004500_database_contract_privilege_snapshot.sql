-- 對齊正式環境已生效、但 git 沒有留下的函式執行權與 search_path。
-- 可重跑。不用 CREATE OR REPLACE：REPLACE 會把 PUBLIC EXECUTE 還原，改完 trigger 必須再 REVOKE。
-- 不收回公開 token 函式（contact_update_*、front_desk_intake_*、peek_portal_invite）的 anon 執行權。
-- 不插入測試列。

begin;

-- 三支 trigger：只留擁有者與 service_role。
revoke execute on function public.classes_backfill_null_schedule_teachers() from public, anon, authenticated;
revoke execute on function public.schedules_default_teacher_from_class() from public, anon, authenticated;
revoke execute on function public.teachers_ensure_private_row() from public, anon, authenticated;

-- 家長課表：anon 不可；已登入可。
revoke execute on function public.list_portal_class_schedules(uuid) from public, anon;
grant execute on function public.list_portal_class_schedules(uuid) to authenticated;

-- 八支 INVOKER：只釘 search_path，不改執行權。
alter function public.academic_year_label_from_date(date) set search_path = public;
alter function public.grade_code_to_label(text) set search_path = public;
alter function public.normalize_class_grade_label(text) set search_path = public;
alter function public.normalize_class_grade_array(text[]) set search_path = public;
alter function public.portal_resolve_unit_price(text, numeric, numeric, numeric, numeric) set search_path = public;
alter function public.recompute_student_enrollment_state(uuid) set search_path = public;
alter function public.trg_recompute_student_state_from_student_row() set search_path = public;
alter function public.apo_assistant_is_pending_makeup(text) set search_path = public;

-- 重複電郵索引（正式環境已只剩 app_users_email_unique）。
drop index if exists public.app_users_email_lower_uidx;

-- 10 月 CREATE OR REPLACE 後再次對公眾開放的兩支 trigger。
revoke execute on function public.forbid_grade_scope_pool_on_mixed_class() from public, anon, authenticated;
revoke execute on function public.leads_sync_interested_subjects_on_convert() from public, anon, authenticated;

-- 只補 search_path。執行權已收回，這裡不再 GRANT。
alter function public.leads_set_updated_at() set search_path = public;

commit;
