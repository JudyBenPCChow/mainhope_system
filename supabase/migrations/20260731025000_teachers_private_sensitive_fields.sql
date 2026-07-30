-- P1-1: 老師不可讀他師電話／email／薪資／備註。
-- 敏感欄移至 teachers_private；teachers 維持目錄欄供排程 join／下拉。

create table if not exists public.teachers_private (
  teacher_id uuid primary key references public.teachers (id) on delete cascade,
  phone text,
  email text,
  salary_per_lesson numeric,
  remarks text,
  updated_at timestamptz not null default now()
);

comment on table public.teachers_private is
  '老師敏感資料：電話／電郵／薪資／備註；僅本人（teacher）或行政／外星人可讀寫';

insert into public.teachers_private (teacher_id, phone, email, salary_per_lesson, remarks)
select t.id, t.phone, t.email, t.salary_per_lesson, t.remarks
from public.teachers t
on conflict (teacher_id) do update set
  phone = excluded.phone,
  email = excluded.email,
  salary_per_lesson = excluded.salary_per_lesson,
  remarks = excluded.remarks,
  updated_at = now();

alter table public.teachers drop column if exists phone;
alter table public.teachers drop column if exists email;
alter table public.teachers drop column if exists salary_per_lesson;
alter table public.teachers drop column if exists remarks;

alter table public.teachers_private enable row level security;

drop policy if exists rls_mgmt_all_teachers_private on public.teachers_private;
create policy rls_mgmt_all_teachers_private
on public.teachers_private
for all
to authenticated
using (public.is_mgmt_staff())
with check (public.is_mgmt_staff());

drop policy if exists rls_teacher_select_own_teachers_private on public.teachers_private;
create policy rls_teacher_select_own_teachers_private
on public.teachers_private
for select
to authenticated
using (
  public.is_teacher_role()
  and teacher_id = public.current_teacher_id()
);

drop policy if exists rls_teacher_update_own_teachers_private on public.teachers_private;
create policy rls_teacher_update_own_teachers_private
on public.teachers_private
for update
to authenticated
using (
  public.is_teacher_role()
  and teacher_id = public.current_teacher_id()
)
with check (
  public.is_teacher_role()
  and teacher_id = public.current_teacher_id()
);

grant select, insert, update, delete on public.teachers_private to authenticated;

-- 老師不可改自己薪資／電郵（僅可改電話／備註，對齊既有前端）
create or replace function public.teachers_private_enforce_teacher_update()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if public.is_teacher_role() then
    if new.salary_per_lesson is distinct from old.salary_per_lesson
      or new.email is distinct from old.email
    then
      raise exception 'TEACHER_PRIVATE_UPDATE_DENIED'
        using errcode = '42501',
          hint = '老師不可更改電郵或薪資';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_teachers_private_enforce_teacher_update on public.teachers_private;
create trigger trg_teachers_private_enforce_teacher_update
  before update on public.teachers_private
  for each row
  execute function public.teachers_private_enforce_teacher_update();

-- 新增老師時自動建 private 列
create or replace function public.teachers_ensure_private_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.teachers_private (teacher_id)
  values (new.id)
  on conflict (teacher_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_teachers_ensure_private_row on public.teachers;
create trigger trg_teachers_ensure_private_row
  after insert on public.teachers
  for each row
  execute function public.teachers_ensure_private_row();
