-- 管理層可做計糧財務預備 P1–P6（審閱／排除／重算／提交等），與財務同等寫入能力。
-- 產品覆寫：營運要管理層在同一身份下審批並提交工資單，不要另開財務身份。
-- 同時撤回先前授予 Mark Yu 的 finance 角色。

begin;

insert into private.authz_role_capabilities (role, capability_key)
select 'manager', k
from unnest(array[
  'payroll.prepare',
  'payroll.review',
  'payroll.exclude',
  'payroll.adjust.request',
  'payroll.hours',
  'payroll.submit'
]::text[]) as k
on conflict (role, capability_key) do nothing;

update private.authz_meta
set authz_version = 14,
    updated_at = now()
where id = 1;

delete from public.app_user_roles aur
using public.app_users au
where aur.app_user_id = au.id
  and lower(trim(coalesce(au.email, ''))) = 'markyu@mainhope.edu.hk'
  and aur.role = 'finance';

update public.mgmt_active_roles mar
set active_role = 'manager',
    switched_at = now()
from public.app_users au
where mar.app_user_id = au.id
  and lower(trim(coalesce(au.email, ''))) = 'markyu@mainhope.edu.hk'
  and mar.active_role = 'finance';

update private.mgmt_session_roles msr
set active_role = 'manager',
    switched_at = now()
from public.app_users au
where msr.app_user_id = au.id
  and lower(trim(coalesce(au.email, ''))) = 'markyu@mainhope.edu.hk'
  and msr.active_role = 'finance';

comment on table public.app_user_roles is
  '管理帳戶獲授予的角色；Christine Fan 同時擁有 teacher 與 admin；Mark Yu 同時擁有 teacher 與 manager。';

commit;
