-- Katie Lee：移除行政管理員身份，只保留專科老師。

begin;

-- 若作用中角色仍是 admin，改回 teacher（須先確認仍有 teacher 授權）。
update public.mgmt_active_roles mar
set active_role = 'teacher'
from public.app_users au
where mar.app_user_id = au.id
  and lower(trim(coalesce(au.email, ''))) = 'katie@mainhope.edu.hk'
  and mar.active_role = 'admin'
  and exists (
    select 1
    from public.app_user_roles aur
    where aur.app_user_id = au.id
      and aur.role = 'teacher'
  );

delete from public.app_user_roles aur
using public.app_users au
where aur.app_user_id = au.id
  and lower(trim(coalesce(au.email, ''))) = 'katie@mainhope.edu.hk'
  and aur.role = 'admin';

comment on table public.app_user_roles is
  '管理帳戶獲授予的角色；Christine Fan 同時擁有 teacher 與 admin；Mark Yu 同時擁有 teacher 與 manager。';

commit;
