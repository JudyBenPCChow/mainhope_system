-- Advisor hygiene（database-contract-advisor-hygiene）：
-- 1) 三支 trigger DEFINER：REVOKE EXECUTE FROM PUBLIC／anon／authenticated
--    （trigger 仍由 table owner 觸發；postgres／service_role 保留）
-- 2) list_portal_class_schedules：REVOKE PUBLIC＋anon；authenticated 保留
--    （CREATE OR REPLACE 曾把 PUBLIC execute 還原；體內已 is_portal()）
-- 3) 8 支 INVOKER：只 ALTER SET search_path，唔 CREATE OR REPLACE
--    （REPLACE 會還原 GRANT，連剛 revoke 嘅 trigger EXECUTE 都會返嚟）
-- 4) 刪重複 unique index app_users_email_lower_uidx；留 app_users_email_unique
--
-- 禁止本檔：revoke token RPC（contact_update_*／front_desk_intake_*／peek_portal_invite）；
-- 唔插測試列；唔合併 permissive policies；唔加 FK index。

-- ── 1) trigger EXECUTE ───────────────────────────────────────────────────
revoke execute on function public.classes_backfill_null_schedule_teachers()
  from public, anon, authenticated;

revoke execute on function public.schedules_default_teacher_from_class()
  from public, anon, authenticated;

revoke execute on function public.teachers_ensure_private_row()
  from public, anon, authenticated;

-- ── 2) portal 列表 RPC：anon 唔好打；authenticated 留 ───────────────────
revoke execute on function public.list_portal_class_schedules(uuid)
  from public, anon;
grant execute on function public.list_portal_class_schedules(uuid)
  to authenticated;

-- ── 3) INVOKER search_path（只 ALTER）────────────────────────────────────
alter function public.academic_year_label_from_date(p_date date)
  set search_path = public;

alter function public.grade_code_to_label(p_code text)
  set search_path = public;

alter function public.normalize_class_grade_label(raw text)
  set search_path = public;

alter function public.normalize_class_grade_array(grades text[])
  set search_path = public;

alter function public.portal_resolve_unit_price(
  p_enrollment_period text,
  p_class_price numeric,
  p_course_price numeric,
  p_course_price_p2 numeric,
  p_course_price_both numeric
) set search_path = public;

alter function public.recompute_student_enrollment_state(p_student_id uuid)
  set search_path = public;

alter function public.trg_recompute_student_state_from_student_row()
  set search_path = public;

alter function public.apo_assistant_is_pending_makeup(p_status text)
  set search_path = public;

-- ── 4) 重複 email unique index ──────────────────────────────────────────
drop index if exists public.app_users_email_lower_uidx;
