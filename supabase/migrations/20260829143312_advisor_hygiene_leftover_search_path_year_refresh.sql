-- 08-21 覆核之後先出現／漏列：
-- 1) refresh_academic_year_is_current：DEFINER 會 UPDATE academic_years.is_current
--    唔應俾 anon／authenticated 當 RPC 打（同第一刀 trigger REVOKE）
-- 2) 兩支 INVOKER 未釘 search_path（08-28 課程年級碼）
-- 仍禁止 CREATE OR REPLACE。

revoke execute on function public.refresh_academic_year_is_current()
  from public, anon, authenticated;

alter function public.grade_codes_to_class_labels(p_codes text[])
  set search_path = public;

alter function public.courses_normalize_eligible_grade_codes()
  set search_path = public;
