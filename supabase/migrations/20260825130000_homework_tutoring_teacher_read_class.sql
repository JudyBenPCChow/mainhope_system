-- 功輔班無固定 classes.teacher_id；有 homework_tutoring_nav 的老師需可讀該班，
-- 否則報更／我的當值 fetchHomeworkClass 會以為「尚未建立班」。

begin;

create or replace function public.teacher_has_homework_tutoring_nav()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.teachers t
    where t.id = public.current_teacher_id()
      and coalesce(t.homework_tutoring_nav, false)
  );
$$;

revoke all on function public.teacher_has_homework_tutoring_nav() from public;
revoke all on function public.teacher_has_homework_tutoring_nav() from anon;
grant execute on function public.teacher_has_homework_tutoring_nav() to authenticated;

comment on function public.teacher_has_homework_tutoring_nav() is
  'RLS：目前老師是否獲開功課輔導側欄（teachers.homework_tutoring_nav）。';

drop policy if exists rls_phase_b_teacher_select_classes on public.classes;
create policy rls_phase_b_teacher_select_classes
  on public.classes
  for select
  to authenticated
  using (
    public.is_teacher_role()
    and (
      teacher_id = public.current_teacher_id()
      or (
        class_kind = 'homework'
        and public.teacher_has_homework_tutoring_nav()
      )
    )
  );

commit;
