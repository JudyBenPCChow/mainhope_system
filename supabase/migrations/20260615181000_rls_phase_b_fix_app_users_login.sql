-- Phase B hotfix: login bootstrap for app_users.
-- is_mgmt_staff() / is_teacher_role() call current_app_role() which reads app_users;
-- without a role-agnostic own-row SELECT policy, all roles fail login (chicken-and-egg).

begin;

drop policy if exists rls_phase_b_teacher_select_app_users on public.app_users;
drop policy if exists rls_phase_b_auth_select_own_app_user on public.app_users;

-- Any authenticated user may read their own app_users row (login + session restore).
create policy rls_phase_b_auth_select_own_app_user
on public.app_users
for select
to authenticated
using (lower(coalesce(email, '')) = public.current_app_user_email());

comment on policy rls_phase_b_auth_select_own_app_user on public.app_users is
  'Login bootstrap: read own row before current_app_role() can resolve. Phase B hotfix.';

commit;
