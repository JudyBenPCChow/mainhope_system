-- Christine Fan、Mark Yu：雙身份專科老師 + 管理層（manager）。
-- Mark 由既有 teacher+admin 改為 teacher+manager（移除 admin）。
-- 角色切換必須經 switch_my_mgmt_role 驗證；localStorage 只作前端快取。

begin;

-- ── Christine Fan：授予 teacher + manager ──
insert into public.app_user_roles (app_user_id, role, teacher_id)
select au.id, 'teacher', au.teacher_id
from public.app_users au
where lower(trim(coalesce(au.email, ''))) = 'cfan@mainhope.edu.hk'
  and au.teacher_id is not null
on conflict (app_user_id, role) do update
set teacher_id = excluded.teacher_id;

insert into public.app_user_roles (app_user_id, role, teacher_id)
select au.id, 'manager', null
from public.app_users au
where lower(trim(coalesce(au.email, ''))) = 'cfan@mainhope.edu.hk'
  and au.teacher_id is not null
on conflict (app_user_id, role) do nothing;

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

-- ── Mark Yu：teacher 維持；改授 manager；移除 admin ──
insert into public.app_user_roles (app_user_id, role, teacher_id)
select au.id, 'teacher', au.teacher_id
from public.app_users au
where lower(trim(coalesce(au.email, ''))) = 'markyu@mainhope.edu.hk'
  and au.teacher_id is not null
on conflict (app_user_id, role) do update
set teacher_id = excluded.teacher_id;

insert into public.app_user_roles (app_user_id, role, teacher_id)
select au.id, 'manager', null
from public.app_users au
where lower(trim(coalesce(au.email, ''))) = 'markyu@mainhope.edu.hk'
  and au.teacher_id is not null
on conflict (app_user_id, role) do nothing;

delete from public.app_user_roles aur
using public.app_users au
where aur.app_user_id = au.id
  and lower(trim(coalesce(au.email, ''))) = 'markyu@mainhope.edu.hk'
  and aur.role = 'admin';

-- 若目前 active_role 仍是已移除的 admin，改回老師視角。
update public.mgmt_active_roles mar
set active_role = 'teacher',
    switched_at = now()
from public.app_users au
where mar.app_user_id = au.id
  and lower(trim(coalesce(au.email, ''))) = 'markyu@mainhope.edu.hk'
  and mar.active_role = 'admin';

insert into public.mgmt_active_roles (app_user_id, active_role)
select au.id, 'teacher'
from public.app_users au
where lower(trim(coalesce(au.email, ''))) = 'markyu@mainhope.edu.hk'
  and exists (
    select 1
    from public.app_user_roles aur
    where aur.app_user_id = au.id
      and aur.role = 'teacher'
  )
on conflict (app_user_id) do nothing;

comment on table public.app_user_roles is
  '管理帳戶獲授予的角色；Christine Fan、Mark Yu 同時擁有 teacher 與 manager；Katie Lee 同時擁有 teacher 與 admin。';

commit;
