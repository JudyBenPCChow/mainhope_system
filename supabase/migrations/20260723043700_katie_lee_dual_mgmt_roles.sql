-- Katie Lee 雙身份：行政／專科老師（與 Mark Yu 相同模式）。
-- 角色切換必須經 switch_my_mgmt_role 驗證；localStorage 只作前端快取。

begin;

-- 確保既有 teacher 授權存在（沿用 app_users.teacher_id）。
insert into public.app_user_roles (app_user_id, role, teacher_id)
select au.id, 'teacher', au.teacher_id
from public.app_users au
where lower(trim(coalesce(au.email, ''))) = 'katie@mainhope.edu.hk'
  and au.role = 'teacher'
  and au.teacher_id is not null
on conflict (app_user_id, role) do update
set teacher_id = excluded.teacher_id;

-- 額外授予行政身份。
insert into public.app_user_roles (app_user_id, role, teacher_id)
select au.id, 'admin', null
from public.app_users au
where lower(trim(coalesce(au.email, ''))) = 'katie@mainhope.edu.hk'
  and au.role = 'teacher'
  and au.teacher_id is not null
on conflict (app_user_id, role) do nothing;

-- 預設維持老師視角，避免部署後權限突然擴大。
insert into public.mgmt_active_roles (app_user_id, active_role)
select au.id, 'teacher'
from public.app_users au
where lower(trim(coalesce(au.email, ''))) = 'katie@mainhope.edu.hk'
  and exists (
    select 1
    from public.app_user_roles aur
    where aur.app_user_id = au.id
      and aur.role = 'teacher'
  )
on conflict (app_user_id) do nothing;

comment on table public.app_user_roles is
  '管理帳戶獲授予的角色；Mark Yu、Katie Lee 同時擁有 teacher 與 admin。';

commit;
