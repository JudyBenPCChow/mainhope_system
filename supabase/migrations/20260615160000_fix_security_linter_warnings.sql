-- Supabase database linter: function_search_path_mutable, current_app_role SECURITY DEFINER exposure.
-- Dev RLS policies (dev_* / temp_*) are intentional; see baseline migration comment.

begin;

-- Pin search_path on flagged public functions (including any created outside migrations).
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as func
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = any(array[
        'recompute_student_enrollment_state',
        'trg_recompute_student_enrollment_state',
        'map_grade_code',
        'section_code_from_ord',
        'map_subject_code',
        'next_student_code_current_year',
        'trg_students_autocode',
        'courses_normalize_grade_code',
        'courses_build_code_base',
        'courses_set_code_base_trigger',
        'normalize_student_grade',
        'current_app_role'
      ])
  loop
    execute format('alter function %s set search_path = public', r.func);
  end loop;
end $$;

-- Match app auth: role from app_users by JWT email. SECURITY INVOKER avoids privilege escalation via RPC.
create or replace function public.current_app_role()
returns text
language sql
stable
security invoker
set search_path = public
as $$
  select au.role
  from public.app_users au
  where lower(coalesce(au.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
  limit 1;
$$;

revoke all on function public.current_app_role() from public;
revoke all on function public.current_app_role() from anon;
grant execute on function public.current_app_role() to authenticated;

commit;
