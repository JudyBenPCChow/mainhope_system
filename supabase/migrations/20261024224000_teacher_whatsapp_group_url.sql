-- 老師 WhatsApp 群組邀請連結。放在 teachers_private，避免班別目錄與家長入口讀到可加入群組的網址。

alter table public.teachers_private
  add column if not exists whatsapp_group_url text;

comment on column public.teachers_private.whatsapp_group_url is
  '老師 WhatsApp 群組邀請連結（https://chat.whatsapp.com/…）。僅行政可寫。';

alter table public.teachers_private
  drop constraint if exists teachers_private_whatsapp_group_url_format;

alter table public.teachers_private
  add constraint teachers_private_whatsapp_group_url_format
  check (
    whatsapp_group_url is null
    or whatsapp_group_url ~ '^https://chat\.whatsapp\.com/[A-Za-z0-9]{8,64}(\?[A-Za-z0-9_=&%.-]{0,80})?$'
  );

-- 老師不可改自己的群組連結（與電郵、通訊電郵、薪資相同；僅行政可寫）
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
      or new.whatsapp_group_url is distinct from old.whatsapp_group_url
    then
      raise exception 'TEACHER_PRIVATE_UPDATE_DENIED'
        using errcode = '42501',
          hint = '老師不可更改電郵、通訊電郵、薪資或 WhatsApp 群組連結';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function public.teachers_private_enforce_teacher_update() from public, anon, authenticated;

notify pgrst, 'reload schema';
