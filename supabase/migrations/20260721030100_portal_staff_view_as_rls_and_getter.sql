-- Align RLS + getter with production follow-up (idempotent).

begin;

drop policy if exists portal_staff_view_as_mgmt_all on public.portal_staff_view_as;
drop policy if exists portal_staff_view_as_own on public.portal_staff_view_as;
create policy portal_staff_view_as_own
on public.portal_staff_view_as
for all
to authenticated
using (
  public.is_mgmt_staff()
  and staff_app_user_id = public.current_app_user_id()
)
with check (
  public.is_mgmt_staff()
  and staff_app_user_id = public.current_app_user_id()
);

create or replace function public.get_portal_view_as()
returns table (student_id uuid, student_name text)
language sql
stable
security definer
set search_path = public
as $$
  select v.student_id, s.full_name::text
  from public.portal_staff_view_as v
  join public.students s on s.id = v.student_id
  where v.staff_app_user_id = public.current_app_user_id()
    and public.is_mgmt_staff()
  limit 1;
$$;

revoke all on function public.get_portal_view_as() from public;
revoke all on function public.get_portal_view_as() from anon;
grant execute on function public.get_portal_view_as() to authenticated;

commit;
