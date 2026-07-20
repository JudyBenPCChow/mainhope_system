-- Staff view-as: list enrollable class ids for a student (mgmt only).

begin;

create or replace function public.list_portal_enrollable_class_ids(p_student_id uuid)
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select c.id
  from public.classes c
  where public.is_mgmt_staff()
    and public.portal_class_matches_student_grade(c.id, p_student_id);
$$;

revoke all on function public.list_portal_enrollable_class_ids(uuid) from public;
revoke all on function public.list_portal_enrollable_class_ids(uuid) from anon;
grant execute on function public.list_portal_enrollable_class_ids(uuid) to authenticated;

commit;
