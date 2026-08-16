-- P0-1 授權 kernel（wave 1）：catalog、兩個 predicate、session 表、profile／role-switch v2。
-- 唔改 public.current_app_role()、唔收緊現有 RLS。
-- switch_v2 雙寫 session 列＋舊 mgmt_active_roles，等 P0-2 接 v2 期間 DB 同 UI 唔會分叉。
-- 套用：npm run db:apply -- supabase/migrations/20260814230815_p0_1_authz_kernel.sql
--
-- rollback（手動）：
--   drop function if exists public.switch_my_mgmt_role_v2(text);
--   drop function if exists public.get_my_mgmt_profile_v2();
--   drop function if exists private.has_account_capability(text);
--   drop function if exists private.has_capability(text);
--   drop function if exists private.ensure_mgmt_session_role();
--   drop function if exists private.default_mgmt_role(uuid);
--   drop function if exists private.current_jwt_session_id();
--   drop function if exists private.capabilities_for_role(text);
--   drop function if exists private.account_capabilities_for_user(uuid);
--   drop table if exists private.mgmt_session_roles;
--   drop table if exists private.authz_role_capabilities;
--   drop table if exists private.authz_capabilities;
--   drop table if exists private.authz_meta;
--   drop schema if exists private restrict;

begin;

create schema if not exists private;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to postgres, supabase_admin, authenticated;

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------

create table if not exists private.authz_meta (
  id smallint primary key default 1 check (id = 1),
  authz_version integer not null default 1,
  updated_at timestamptz not null default now()
);

insert into private.authz_meta (id, authz_version)
values (1, 1)
on conflict (id) do nothing;

create table if not exists private.authz_capabilities (
  capability_key text primary key,
  check_mode text not null default 'active'
    check (check_mode in ('active', 'account')),
  description text not null
);

create table if not exists private.authz_role_capabilities (
  role text not null
    check (role in ('admin', 'manager', 'finance', 'teacher', 'alien')),
  capability_key text not null
    references private.authz_capabilities (capability_key) on delete cascade,
  primary key (role, capability_key)
);

create index if not exists authz_role_capabilities_key_idx
  on private.authz_role_capabilities (capability_key);

create table if not exists private.mgmt_session_roles (
  app_user_id uuid not null references public.app_users (id) on delete cascade,
  session_id uuid not null,
  active_role text not null
    check (active_role in ('admin', 'manager', 'finance', 'teacher', 'alien')),
  switched_at timestamptz not null default now(),
  primary key (app_user_id, session_id)
);

create index if not exists mgmt_session_roles_session_idx
  on private.mgmt_session_roles (session_id);

alter table private.authz_meta enable row level security;
alter table private.authz_capabilities enable row level security;
alter table private.authz_role_capabilities enable row level security;
alter table private.mgmt_session_roles enable row level security;

revoke all on all tables in schema private from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Seed（DB catalog 為唯一真源；對齊 p0-1-authorization-decisions.md）
-- ---------------------------------------------------------------------------

insert into private.authz_capabilities (capability_key, check_mode, description)
values
  ('students.read', 'active', '讀學生'),
  ('students.create', 'active', '新增學生'),
  ('students.update', 'active', '改學生基本資料'),
  ('students.enroll', 'active', '報讀／退讀／一對一報讀'),
  ('portal.invite', 'active', '家長 Portal 邀請'),
  ('classes.read', 'active', '讀班別'),
  ('classes.create', 'active', '新增班別'),
  ('classes.update', 'active', '改班別（含學費欄）'),
  ('schedule.read', 'active', '讀排程'),
  ('schedule.create', 'active', '建立新堂'),
  ('schedule.reschedule', 'active', '拖曳調課'),
  ('schedule.cancel', 'active', '取消堂'),
  ('schedule.substitute', 'active', '代堂'),
  ('schedule.update_status', 'active', '排程狀態／教學備註'),
  ('attendance.read', 'active', '讀出席'),
  ('attendance.take', 'active', '進行點名'),
  ('attendance.correct', 'active', '更正出席'),
  ('attendance.delete', 'active', '刪出席'),
  ('leaves.read', 'active', '讀請假'),
  ('leaves.manage', 'active', '新增／改請假（可連帶改排程）'),
  ('payments.read', 'active', '讀學費單'),
  ('payments.create', 'active', '建立學費單'),
  ('payments.mark_received', 'active', '標記已收'),
  ('payments.void', 'active', '發起作廢'),
  ('payments.void.approve', 'account', '作廢第二確認（睇已獲授角色）'),
  ('entitlements.read', 'active', '讀堂數池'),
  ('entitlements.correct', 'active', '直接改堂數池（只限外星人）'),
  ('calendar.manage', 'active', '校曆休館'),
  ('teacher_availability.manage', 'active', '老師檔期'),
  ('inbox.read', 'active', '收件匣已讀'),
  ('payroll.read', 'active', '讀計糧'),
  ('payroll.prepare', 'active', '計糧重算／prepare'),
  ('payroll.review', 'active', '標記財務已審'),
  ('payroll.exclude', 'active', '排除／恢復老師'),
  ('payroll.adjust.request', 'active', '建立調整申請'),
  ('payroll.hours', 'active', '填報工時'),
  ('payroll.submit', 'active', '提交單人／整月'),
  ('payroll.return', 'active', '退回財務'),
  ('payroll.verify', 'active', '核准調整／核實工時／抽查'),
  ('payroll.settle', 'active', '結算'),
  ('payroll.reopen', 'active', '已結算月份重開'),
  ('expenses.read', 'active', '讀成本帳'),
  ('expenses.record', 'active', '成本帳入帳／改分類'),
  ('expenses.confirm', 'active', '確認成本帳'),
  ('expenses.void', 'active', '作廢成本帳'),
  ('expenses.reopen', 'active', '重開成本帳'),
  ('system_notice.publish', 'active', '發佈系統通知'),
  ('users.manage', 'active', '用戶建立／停用'),
  ('roles.grant', 'active', '角色授予'),
  ('catalog.manage', 'active', '課程／優惠目錄'),
  ('audit.read_all', 'active', '查全部授權操作紀錄'),
  ('audit.read_own', 'active', '查自己的操作紀錄')
on conflict (capability_key) do update
  set check_mode = excluded.check_mode,
      description = excluded.description;

delete from private.authz_role_capabilities;

-- admin 營運寫入（公理 1 基底）
insert into private.authz_role_capabilities (role, capability_key)
select 'admin', k
from unnest(array[
  'students.read','students.create','students.update','students.enroll','portal.invite',
  'classes.read','classes.create','classes.update',
  'schedule.read','schedule.create','schedule.reschedule','schedule.cancel','schedule.substitute','schedule.update_status',
  'attendance.read','attendance.take','attendance.correct','attendance.delete',
  'leaves.read','leaves.manage',
  'payments.read','payments.create','payments.mark_received','payments.void',
  'entitlements.read',
  'calendar.manage','teacher_availability.manage','inbox.read',
  'payroll.read','audit.read_own'
]::text[]) as k;

-- manager = admin + 成本帳全套 + 計糧核實／結算 + 作廢第二確認 + 全查 audit
insert into private.authz_role_capabilities (role, capability_key)
select 'manager', k
from unnest(array[
  'students.read','students.create','students.update','students.enroll','portal.invite',
  'classes.read','classes.create','classes.update',
  'schedule.read','schedule.create','schedule.reschedule','schedule.cancel','schedule.substitute','schedule.update_status',
  'attendance.read','attendance.take','attendance.correct','attendance.delete',
  'leaves.read','leaves.manage',
  'payments.read','payments.create','payments.mark_received','payments.void','payments.void.approve',
  'entitlements.read',
  'calendar.manage','teacher_availability.manage','inbox.read',
  'payroll.read','payroll.return','payroll.verify','payroll.settle',
  'expenses.read','expenses.record','expenses.confirm','expenses.void','expenses.reopen',
  'audit.read_all'
]::text[]) as k;

-- alien = manager + 堂數池直接改 + 計糧重開 + 系統／用戶／目錄
insert into private.authz_role_capabilities (role, capability_key)
select 'alien', k
from unnest(array[
  'students.read','students.create','students.update','students.enroll','portal.invite',
  'classes.read','classes.create','classes.update',
  'schedule.read','schedule.create','schedule.reschedule','schedule.cancel','schedule.substitute','schedule.update_status',
  'attendance.read','attendance.take','attendance.correct','attendance.delete',
  'leaves.read','leaves.manage',
  'payments.read','payments.create','payments.mark_received','payments.void','payments.void.approve',
  'entitlements.read','entitlements.correct',
  'calendar.manage','teacher_availability.manage','inbox.read',
  'payroll.read','payroll.return','payroll.verify','payroll.settle','payroll.reopen',
  'expenses.read','expenses.record','expenses.confirm','expenses.void','expenses.reopen',
  'system_notice.publish','users.manage','roles.grant','catalog.manage',
  'audit.read_all'
]::text[]) as k;

-- finance：核對讀 + 入帳 + 計糧 P1–P6；無學費寫入、無點名寫入、無 Portal、無成本確認
insert into private.authz_role_capabilities (role, capability_key)
select 'finance', k
from unnest(array[
  'students.read','classes.read','schedule.read','attendance.read','payments.read','entitlements.read',
  'inbox.read',
  'payroll.read','payroll.prepare','payroll.review','payroll.exclude','payroll.adjust.request','payroll.hours','payroll.submit',
  'expenses.read','expenses.record',
  'audit.read_own'
]::text[]) as k;

-- teacher：窄讀／自己班點名；row scope 仍由現有 teacher RLS 執行
insert into private.authz_role_capabilities (role, capability_key)
select 'teacher', k
from unnest(array[
  'students.read','classes.read',
  'schedule.read','schedule.update_status',
  'attendance.read','attendance.take',
  'leaves.read','inbox.read'
]::text[]) as k;

update private.authz_meta
set authz_version = 1,
    updated_at = now()
where id = 1;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function private.current_jwt_session_id()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v text := nullif(trim(coalesce(auth.jwt() ->> 'session_id', '')), '');
begin
  if v is null then
    return null;
  end if;
  begin
    return v::uuid;
  exception
    when invalid_text_representation then
      return null;
  end;
end;
$$;

create or replace function private.default_mgmt_role(p_app_user_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select au.role
      from public.app_users au
      join public.app_user_roles aur
        on aur.app_user_id = au.id
       and aur.role = au.role
      where au.id = p_app_user_id
      limit 1
    ),
    (
      select aur.role
      from public.app_user_roles aur
      where aur.app_user_id = p_app_user_id
      order by case aur.role
        when 'teacher' then 1
        when 'admin' then 2
        when 'manager' then 3
        when 'finance' then 4
        when 'alien' then 5
        else 6
      end
      limit 1
    )
  );
$$;

create or replace function private.ensure_mgmt_session_role()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_app_user_id uuid := public.current_app_user_id();
  v_session_id uuid := private.current_jwt_session_id();
  v_role text;
begin
  if v_app_user_id is null or v_session_id is null then
    return public.current_app_role();
  end if;

  select msr.active_role
    into v_role
    from private.mgmt_session_roles msr
    join public.app_user_roles aur
      on aur.app_user_id = msr.app_user_id
     and aur.role = msr.active_role
   where msr.app_user_id = v_app_user_id
     and msr.session_id = v_session_id
   limit 1;

  if v_role is not null then
    return v_role;
  end if;

  v_role := private.default_mgmt_role(v_app_user_id);
  if v_role is null then
    return public.current_app_role();
  end if;

  insert into private.mgmt_session_roles (app_user_id, session_id, active_role, switched_at)
  values (v_app_user_id, v_session_id, v_role, now())
  on conflict (app_user_id, session_id) do nothing;

  select msr.active_role
    into v_role
    from private.mgmt_session_roles msr
    join public.app_user_roles aur
      on aur.app_user_id = msr.app_user_id
     and aur.role = msr.active_role
   where msr.app_user_id = v_app_user_id
     and msr.session_id = v_session_id
   limit 1;

  return coalesce(v_role, public.current_app_role());
end;
$$;

create or replace function private.capabilities_for_role(p_role text)
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select array_agg(rc.capability_key order by rc.capability_key)
      from private.authz_role_capabilities rc
      where rc.role = p_role
    ),
    '{}'::text[]
  );
$$;

create or replace function private.account_capabilities_for_user(p_app_user_id uuid)
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select array_agg(distinct rc.capability_key order by rc.capability_key)
      from public.app_user_roles aur
      join private.authz_role_capabilities rc on rc.role = aur.role
      where aur.app_user_id = p_app_user_id
    ),
    '{}'::text[]
  );
$$;

create or replace function private.has_capability(p_key text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.authz_role_capabilities rc
    where rc.role = public.current_app_role()
      and rc.capability_key = p_key
  );
$$;

create or replace function private.has_account_capability(p_key text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.app_user_roles aur
    join private.authz_role_capabilities rc
      on rc.role = aur.role
     and rc.capability_key = p_key
    where aur.app_user_id = public.current_app_user_id()
  );
$$;

comment on function private.has_capability(text) is
  '跟 current_app_role()（wave 1 仍係 account-scoped）。RLS／command 預設用呢個。';
comment on function private.has_account_capability(text) is
  '跟帳戶已獲授角色聯集。只畀 catalog check_mode=account 嘅操作，而家得 payments.void.approve。';

revoke all on function private.current_jwt_session_id() from public, anon;
revoke all on function private.default_mgmt_role(uuid) from public, anon;
revoke all on function private.ensure_mgmt_session_role() from public, anon;
revoke all on function private.capabilities_for_role(text) from public, anon;
revoke all on function private.account_capabilities_for_user(uuid) from public, anon;
revoke all on function private.has_capability(text) from public, anon, authenticated;
revoke all on function private.has_account_capability(text) from public, anon, authenticated;

-- 將來 RLS InitPlan 要用；catalog 表仍然無 Data API。
grant execute on function private.has_capability(text) to authenticated;
grant execute on function private.has_account_capability(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Public v2 RPCs
-- ---------------------------------------------------------------------------

create or replace function public.get_my_mgmt_profile_v2()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_app_user_id uuid := public.current_app_user_id();
  v_active text;
  v_result jsonb;
begin
  if v_app_user_id is null then
    return null;
  end if;

  v_active := private.ensure_mgmt_session_role();
  if v_active is null or v_active not in ('admin', 'manager', 'finance', 'teacher', 'alien') then
    return null;
  end if;

  select jsonb_build_object(
    'app_user_id', au.id,
    'email', au.email,
    'display_name', au.display_name,
    'active_role', v_active,
    'teacher_id', case
      when v_active = 'teacher' then coalesce(aur_t.teacher_id, au.teacher_id)
      else null
    end,
    'available_roles', coalesce(
      (
        select jsonb_agg(aur.role order by
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
      jsonb_build_array(v_active)
    ),
    'active_capabilities', to_jsonb(private.capabilities_for_role(v_active)),
    'account_capabilities', to_jsonb(private.account_capabilities_for_user(au.id)),
    'authz_version', (select m.authz_version from private.authz_meta m where m.id = 1)
  )
  into v_result
  from public.app_users au
  left join public.app_user_roles aur_t
    on aur_t.app_user_id = au.id
   and aur_t.role = 'teacher'
  where au.id = v_app_user_id
  limit 1;

  return v_result;
end;
$$;

create or replace function public.switch_my_mgmt_role_v2(p_role text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_app_user_id uuid := public.current_app_user_id();
  v_session_id uuid := private.current_jwt_session_id();
  v_role text := lower(trim(coalesce(p_role, '')));
begin
  if v_app_user_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if not exists (
    select 1
    from public.app_user_roles aur
    where aur.app_user_id = v_app_user_id
      and aur.role = v_role
  ) then
    raise exception 'ROLE_NOT_ASSIGNED';
  end if;

  -- 舊表：wave 1 仍係 current_app_role() 真源，保持雙寫。
  insert into public.mgmt_active_roles (app_user_id, active_role, switched_at)
  values (v_app_user_id, v_role, now())
  on conflict (app_user_id) do update
    set active_role = excluded.active_role,
        switched_at = excluded.switched_at;

  if v_session_id is not null then
    insert into private.mgmt_session_roles (app_user_id, session_id, active_role, switched_at)
    values (v_app_user_id, v_session_id, v_role, now())
    on conflict (app_user_id, session_id) do update
      set active_role = excluded.active_role,
          switched_at = excluded.switched_at;
  end if;

  return public.get_my_mgmt_profile_v2();
end;
$$;

revoke all on function public.get_my_mgmt_profile_v2() from public, anon;
revoke all on function public.switch_my_mgmt_role_v2(text) from public, anon;
grant execute on function public.get_my_mgmt_profile_v2() to authenticated;
grant execute on function public.switch_my_mgmt_role_v2(text) to authenticated;

comment on function public.get_my_mgmt_profile_v2() is
  'P0-1 profile v2。回 active_capabilities／account_capabilities／authz_version。JWT 有 session_id 就確保 session 列；current_app_role() 暫未切 session。';
comment on function public.switch_my_mgmt_role_v2(text) is
  '切角色並回傳 profile v2。wave 1 雙寫 mgmt_active_roles 同 mgmt_session_roles。';

commit;
