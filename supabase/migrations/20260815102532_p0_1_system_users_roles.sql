-- P0-1 domain 1：系統通知／用戶／角色改用 capability predicate。
-- 未喺 staging allow-deny 通過前，唔好套 production（禁 npm run db:apply --linked）。
--
-- 系統通知寫入：system_notice.publish（alien）
-- 用戶寫入：users.manage（alien）
-- 角色授予：roles.grant（alien）；Data API 補 GRANT，profile RPC 仍係 definer
-- ops 收件匣寫入維持 is_mgmt_staff()（行政日常排程／請假通知）

-- ---------------------------------------------------------------------------
-- inbox_events：拆 SELECT 同 ops／system 寫入
-- ---------------------------------------------------------------------------

drop policy if exists rls_mgmt_all_inbox_events on public.inbox_events;
drop policy if exists rls_mgmt_select_inbox_events on public.inbox_events;
drop policy if exists rls_mgmt_insert_ops_inbox_events on public.inbox_events;
drop policy if exists rls_mgmt_update_ops_inbox_events on public.inbox_events;
drop policy if exists rls_mgmt_delete_ops_inbox_events on public.inbox_events;
drop policy if exists rls_cap_insert_system_inbox_events on public.inbox_events;
drop policy if exists rls_cap_update_system_inbox_events on public.inbox_events;
drop policy if exists rls_cap_delete_system_inbox_events on public.inbox_events;

create policy rls_mgmt_select_inbox_events
on public.inbox_events
for select
to authenticated
using (public.is_mgmt_staff());

create policy rls_mgmt_insert_ops_inbox_events
on public.inbox_events
for insert
to authenticated
with check (
  public.is_mgmt_staff()
  and coalesce(category, 'ops') = 'ops'
);

create policy rls_mgmt_update_ops_inbox_events
on public.inbox_events
for update
to authenticated
using (
  public.is_mgmt_staff()
  and coalesce(category, 'ops') = 'ops'
)
with check (
  public.is_mgmt_staff()
  and coalesce(category, 'ops') = 'ops'
);

create policy rls_mgmt_delete_ops_inbox_events
on public.inbox_events
for delete
to authenticated
using (
  public.is_mgmt_staff()
  and coalesce(category, 'ops') = 'ops'
);

create policy rls_cap_insert_system_inbox_events
on public.inbox_events
for insert
to authenticated
with check (
  private.has_capability('system_notice.publish')
  and category = 'system'
  and event_type = 'system_update'
);

create policy rls_cap_update_system_inbox_events
on public.inbox_events
for update
to authenticated
using (
  private.has_capability('system_notice.publish')
  and category = 'system'
)
with check (
  private.has_capability('system_notice.publish')
  and category = 'system'
  and event_type = 'system_update'
);

create policy rls_cap_delete_system_inbox_events
on public.inbox_events
for delete
to authenticated
using (
  private.has_capability('system_notice.publish')
  and category = 'system'
);

comment on policy rls_cap_insert_system_inbox_events on public.inbox_events is
  'P0-1：發佈系統通知要 system_notice.publish。';

-- ---------------------------------------------------------------------------
-- app_users：寫入改 has_capability('users.manage')；自己列 SELECT 不變
-- ---------------------------------------------------------------------------

drop policy if exists rls_phase_c_alien_all_app_users on public.app_users;
drop policy if exists rls_cap_users_manage_app_users on public.app_users;

create policy rls_cap_users_manage_app_users
on public.app_users
for all
to authenticated
using (private.has_capability('users.manage'))
with check (private.has_capability('users.manage'));

comment on policy rls_cap_users_manage_app_users on public.app_users is
  'P0-1：建立／停用／改後台用戶要 users.manage。';

-- ---------------------------------------------------------------------------
-- app_user_roles：補 Data API GRANT + roles.grant
-- ---------------------------------------------------------------------------

grant select, insert, delete on public.app_user_roles to authenticated;

drop policy if exists rls_cap_roles_grant_app_user_roles on public.app_user_roles;

create policy rls_cap_roles_grant_app_user_roles
on public.app_user_roles
for all
to authenticated
using (private.has_capability('roles.grant'))
with check (private.has_capability('roles.grant'));

comment on policy rls_cap_roles_grant_app_user_roles on public.app_user_roles is
  'P0-1：授予／撤銷角色要 roles.grant。';

update private.authz_meta
set authz_version = 2,
    updated_at = now()
where id = 1;
