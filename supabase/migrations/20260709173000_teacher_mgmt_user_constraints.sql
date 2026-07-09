begin;

alter table public.app_users
  drop constraint if exists app_users_teacher_requires_teacher_id;

alter table public.app_users
  add constraint app_users_teacher_requires_teacher_id
  check (role <> 'teacher' or teacher_id is not null);

create unique index if not exists app_users_teacher_unique_teacher_id
  on public.app_users (teacher_id)
  where role = 'teacher' and teacher_id is not null;

commit;
