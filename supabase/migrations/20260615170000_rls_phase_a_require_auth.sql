-- RLS Phase A: block anon; require Supabase Auth (authenticated retains full access until Phase B/C).
-- Rollback: re-create dev_anon_all_* policies (see docs/RLS_ROLLOUT.md).

begin;

-- Helpers for Phase B/C (authenticated only)
create or replace function public.current_app_user_email()
returns text
language sql
stable
security invoker
set search_path = public
as $$
  select lower(trim(coalesce(auth.jwt() ->> 'email', '')));
$$;

create or replace function public.current_teacher_id()
returns uuid
language sql
stable
security invoker
set search_path = public
as $$
  select au.teacher_id
  from public.app_users au
  where lower(coalesce(au.email, '')) = public.current_app_user_email()
  limit 1;
$$;

revoke all on function public.current_app_user_email() from public;
revoke all on function public.current_app_user_email() from anon;
grant execute on function public.current_app_user_email() to authenticated;

revoke all on function public.current_teacher_id() from public;
revoke all on function public.current_teacher_id() from anon;
grant execute on function public.current_teacher_id() to authenticated;

comment on function public.current_app_user_email() is
  'RLS helper: JWT email (lowercase). Phase B/C.';
comment on function public.current_teacher_id() is
  'RLS helper: app_users.teacher_id for current JWT. Phase B/C.';

-- Remove permissive anon policies
do $$
declare
  r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and (
        policyname like 'dev_anon_all_%'
        or policyname like 'temp_frontend_write_%'
      )
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- Transitional: authenticated full access on every RLS-enabled public table
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
    execute format('drop policy if exists dev_auth_all_%I on public.%I', r.tablename, r.tablename);
    execute format('drop policy if exists rls_phase_a_auth_all_%I on public.%I', r.tablename, r.tablename);
    execute format(
      'create policy rls_phase_a_auth_all_%I on public.%I for all to authenticated using (true) with check (true)',
      r.tablename,
      r.tablename
    );
  end loop;
end $$;

-- Defense in depth: anon should not have direct table DML (RLS already denies rows)
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
grant usage on schema public to anon;

commit;
