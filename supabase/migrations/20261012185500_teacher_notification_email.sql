-- 老師通訊電郵：寄送系統通知（例如尚未點名提醒）。與既有 email（登入／明學電郵）分開，不回填。

alter table public.teachers_private
  add column if not exists notification_email text;

comment on column public.teachers_private.notification_email is
  '通訊電郵：系統通知收件地址。不是登入電郵。';

-- 老師不可改自己的通訊電郵（與電郵、薪資相同；僅行政可寫）
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
      or new.notification_email is distinct from old.notification_email
    then
      raise exception 'TEACHER_PRIVATE_UPDATE_DENIED'
        using errcode = '42501',
          hint = '老師不可更改電郵、通訊電郵或薪資';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

notify pgrst, 'reload schema';
