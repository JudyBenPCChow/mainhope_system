-- Christine Fan：雙身份由 teacher+manager 改為 teacher+admin（移除 manager）。
-- 角色切換必須經 switch_my_mgmt_role 驗證；localStorage 只作前端快取。

begin;

-- 確保 teacher 授權存在（沿用 app_users.teacher_id）。
insert into public.app_user_roles (app_user_id, role, teacher_id)
select au.id, 'teacher', au.teacher_id
from public.app_users au
where lower(trim(coalesce(au.email, ''))) = 'cfan@mainhope.edu.hk'
  and au.teacher_id is not null
on conflict (app_user_id, role) do update
set teacher_id = excluded.teacher_id;

-- 改授行政身份。
insert into public.app_user_roles (app_user_id, role, teacher_id)
select au.id, 'admin', null
from public.app_users au
where lower(trim(coalesce(au.email, ''))) = 'cfan@mainhope.edu.hk'
  and au.teacher_id is not null
on conflict (app_user_id, role) do nothing;

-- 移除管理層身份。
delete from public.app_user_roles aur
using public.app_users au
where aur.app_user_id = au.id
  and lower(trim(coalesce(au.email, ''))) = 'cfan@mainhope.edu.hk'
  and aur.role = 'manager';

-- 若目前 active_role 仍是已移除的 manager，改回老師視角。
update public.mgmt_active_roles mar
set active_role = 'teacher',
    switched_at = now()
from public.app_users au
where mar.app_user_id = au.id
  and lower(trim(coalesce(au.email, ''))) = 'cfan@mainhope.edu.hk'
  and mar.active_role = 'manager';

insert into public.mgmt_active_roles (app_user_id, active_role)
select au.id, 'teacher'
from public.app_users au
where lower(trim(coalesce(au.email, ''))) = 'cfan@mainhope.edu.hk'
  and exists (
    select 1
    from public.app_user_roles aur
    where aur.app_user_id = au.id
      and aur.role = 'teacher'
  )
on conflict (app_user_id) do nothing;

comment on table public.app_user_roles is
  '管理帳戶獲授予的角色；Christine Fan、Katie Lee 同時擁有 teacher 與 admin；Mark Yu 同時擁有 teacher 與 manager。';

commit;
