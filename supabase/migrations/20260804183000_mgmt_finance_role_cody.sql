-- mgmt finance 角色：新增 finance；Carol Fan 帳戶改為 Cody Cheong（財務）
-- 套用：npm run db:apply -- supabase/migrations/20260804183000_mgmt_finance_role_cody.sql
--
-- rollback（手動）：
--   update public.app_users
--      set role = 'admin', display_name = 'Carol Fan', updated_at = now()
--    where lower(email) = 'carolfanwl@gmail.com';
--   delete from public.app_user_roles aur
--    using public.app_users au
--    where aur.app_user_id = au.id and lower(au.email) = 'carolfanwl@gmail.com';
--   delete from public.mgmt_active_roles mar
--    using public.app_users au
--    where mar.app_user_id = au.id and lower(au.email) = 'carolfanwl@gmail.com';
--   alter table public.app_user_roles drop constraint if exists app_user_roles_role_check;
--   alter table public.app_user_roles add constraint app_user_roles_role_check
--     check (role in ('admin', 'teacher', 'alien', 'manager'));
--   alter table public.mgmt_active_roles drop constraint if exists mgmt_active_roles_active_role_check;
--   alter table public.mgmt_active_roles add constraint mgmt_active_roles_active_role_check
--     check (active_role in ('admin', 'teacher', 'alien', 'manager'));
--   alter table public.app_users drop constraint if exists app_users_role_check;
--   alter table public.app_users add constraint app_users_role_check
--     check (role in ('admin', 'teacher', 'alien', 'manager', 'student'));
--   -- 另須還原 is_mgmt_staff／get_my_mgmt_profile 至 manager 版

begin;

-- ---------------------------------------------------------------------------
-- CHECK constraints（PG 不支援直接 ALTER CHECK → DROP + ADD）
-- ---------------------------------------------------------------------------

alter table public.app_user_roles drop constraint if exists app_user_roles_role_check;
alter table public.app_user_roles
  add constraint app_user_roles_role_check
  check (role in ('admin', 'teacher', 'alien', 'manager', 'finance'));

alter table public.mgmt_active_roles drop constraint if exists mgmt_active_roles_active_role_check;
alter table public.mgmt_active_roles
  add constraint mgmt_active_roles_active_role_check
  check (active_role in ('admin', 'teacher', 'alien', 'manager', 'finance'));

alter table public.app_users drop constraint if exists app_users_role_check;
alter table public.app_users
  add constraint app_users_role_check
  check (role in ('admin', 'teacher', 'alien', 'manager', 'finance', 'student'));

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_mgmt_staff()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(public.current_app_role(), '') in ('admin', 'manager', 'finance', 'alien');
$$;

comment on function public.is_mgmt_staff() is
  'RLS：admin／manager／finance／alien。finance 可讀職員營運資料（UI 收窄至計糧／繳費紀錄等）；破壞性仍限 admin|alien。';

create or replace function public.get_my_mgmt_profile()
returns table (
  email text,
  display_name text,
  active_role text,
  teacher_id uuid,
  available_roles text[]
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    au.email,
    au.display_name,
    public.current_app_role(),
    public.current_teacher_id(),
    coalesce(
      (
        select array_agg(aur.role order by
          case aur.role
            when 'teacher' then 1
            when 'admin' then 2
            when 'manager' then 3
            when 'finance' then 4
            when 'alien' then 5
            else 6
          end
        )
        from public.app_user_roles aur
        where aur.app_user_id = au.id
      ),
      array[au.role]::text[]
    )
  from public.app_users au
  where au.id = public.current_app_user_id()
    and public.current_app_role() in ('admin', 'manager', 'finance', 'teacher', 'alien')
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- Carol Fan → Cody Cheong（finance）
-- 登入電郵暫仍 carolfanwl@gmail.com；顯示名與角色改為財務
-- ---------------------------------------------------------------------------

update public.app_users
   set role = 'finance',
       display_name = 'Cody Cheong',
       teacher_id = null,
       updated_at = now()
 where lower(email) = 'carolfanwl@gmail.com';

delete from public.app_user_roles aur
 using public.app_users au
 where aur.app_user_id = au.id
   and lower(au.email) = 'carolfanwl@gmail.com';

insert into public.app_user_roles (app_user_id, role, teacher_id)
select au.id, 'finance', null
  from public.app_users au
 where lower(au.email) = 'carolfanwl@gmail.com'
on conflict do nothing;

delete from public.mgmt_active_roles mar
 using public.app_users au
 where mar.app_user_id = au.id
   and lower(au.email) = 'carolfanwl@gmail.com';

insert into public.mgmt_active_roles (app_user_id, active_role, switched_at)
select au.id, 'finance', now()
  from public.app_users au
 where lower(au.email) = 'carolfanwl@gmail.com'
on conflict (app_user_id) do update
  set active_role = excluded.active_role,
      switched_at = excluded.switched_at;

commit;
