-- P0-1 session 角色：JWT 有 session_id 就唔再持續 fallback app_users.role。
-- 未喺 staging 通過前，唔好套 production（禁 npm run db:apply --linked）。
--
-- 無 session_id（而家 App／舊測試）：維持 mgmt_active_roles → app_users.role。
-- 有 session_id：讀 private.mgmt_session_roles；未有列則用 default_mgmt_role 做 seed 查詢
-- （唔喺 RLS 路徑 INSERT）。profile RPC 仍會 ensure 寫列。

create or replace function public.current_app_role()
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.current_app_user_id();
  v_session uuid := private.current_jwt_session_id();
  v_role text;
begin
  if v_uid is null then
    return null;
  end if;

  if v_session is not null then
    select msr.active_role
      into v_role
      from private.mgmt_session_roles msr
      join public.app_user_roles aur
        on aur.app_user_id = msr.app_user_id
       and aur.role = msr.active_role
     where msr.app_user_id = v_uid
       and msr.session_id = v_session
     limit 1;
    if v_role is not null then
      return v_role;
    end if;
    return private.default_mgmt_role(v_uid);
  end if;

  select coalesce(
    (
      select mar.active_role
      from public.mgmt_active_roles mar
      join public.app_user_roles aur
        on aur.app_user_id = mar.app_user_id
       and aur.role = mar.active_role
      where mar.app_user_id = v_uid
      limit 1
    ),
    au.role
  )
  into v_role
  from public.app_users au
  where au.id = v_uid
  limit 1;

  return v_role;
end;
$$;

comment on function public.current_app_role() is
  'P0-1：JWT 有 session_id 跟 mgmt_session_roles／default_mgmt_role；否則舊 mgmt_active_roles＋app_users.role。';

comment on function public.get_my_mgmt_profile_v2() is
  'P0-1 profile v2。JWT 有 session_id 就 ensure session 列；current_app_role() 有 session_id 時跟 session 表。';

comment on function public.switch_my_mgmt_role_v2(text) is
  '切角色並回傳 profile v2。無 session_id 仍雙寫 mgmt_active_roles；有則寫 mgmt_session_roles。';

update private.authz_meta
set authz_version = 8,
    updated_at = now()
where id = 1;
