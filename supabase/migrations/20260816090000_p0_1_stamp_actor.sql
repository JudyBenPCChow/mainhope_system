-- P0-1 波 5：稽核／標籤 actor 由 DB 推導，唔信 request payload。
-- 未喺 staging allow-deny 通過前，唔好套 production（禁 npm run db:apply --linked）。
-- JWT 有 user 先蓋；service_role／無 JWT 嘅 edge insert 保留原值。

-- ---------------------------------------------------------------------------
-- 標籤：角色中文名＋顯示名＋email（U3 own-read 靠 email）
-- ---------------------------------------------------------------------------

create or replace function private.stamp_actor_label()
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.current_app_user_id();
  v_role text := public.current_app_role();
  v_email text := public.current_app_user_email();
  v_display text;
  v_zh text;
begin
  if v_uid is null then
    return null;
  end if;

  select nullif(trim(au.display_name), '') into v_display
  from public.app_users au
  where au.id = v_uid;

  v_email := nullif(trim(coalesce(v_email, '')), '');
  v_zh := case v_role
    when 'admin' then '行政'
    when 'manager' then '管理層'
    when 'finance' then '財務'
    when 'teacher' then '老師'
    when 'alien' then '外星人'
    else coalesce(v_role, '未登入')
  end;

  if v_email is null then
    return v_zh || '（' || coalesce(v_display, '未命名') || '）';
  end if;
  if v_display is null or lower(v_display) = v_email then
    return v_zh || '（' || v_email || '）';
  end if;
  return v_zh || '（' || v_display || '／' || v_email || '）';
end;
$$;

revoke all on function private.stamp_actor_label() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 收件匣已讀鍵：老師 teacher:{id}；職員 staff:{active_role}:{display|email}
-- ---------------------------------------------------------------------------

create or replace function public.current_inbox_actor_key()
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.current_app_user_id();
  v_role text := public.current_app_role();
  v_teacher uuid;
  v_name text;
begin
  if v_uid is null then
    return null;
  end if;

  if v_role = 'teacher' then
    v_teacher := public.current_teacher_id();
    if v_teacher is not null then
      return 'teacher:' || v_teacher::text;
    end if;
  end if;

  select coalesce(nullif(trim(au.display_name), ''), au.email, '未命名')
    into v_name
  from public.app_users au
  where au.id = v_uid;

  return 'staff:' || coalesce(v_role, 'unknown') || ':' || coalesce(v_name, '未命名');
end;
$$;

comment on function public.current_inbox_actor_key() is
  'P0-1：收件匣已讀身分由 JWT／app_users 推導。老師 teacher:{id}；職員 staff:{role}:{display|email}。';

revoke all on function public.current_inbox_actor_key() from public, anon;
grant execute on function public.current_inbox_actor_key() to authenticated;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create or replace function private.trg_stamp_mgmt_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.current_app_user_id();
  v_role text;
  v_label text;
begin
  if v_uid is null then
    return new;
  end if;
  v_role := public.current_app_role();
  v_label := private.stamp_actor_label();
  if v_role is not null then
    new.role := v_role;
  end if;
  if v_label is not null then
    new.actor_label := v_label;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_stamp_mgmt_audit_log on public.mgmt_audit_log;
create trigger trg_stamp_mgmt_audit_log
  before insert or update on public.mgmt_audit_log
  for each row
  execute function private.trg_stamp_mgmt_audit_log();

create or replace function private.trg_stamp_mgmt_system_errors()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.current_app_user_id();
  v_role text;
  v_label text;
begin
  if v_uid is null then
    return new;
  end if;
  v_role := public.current_app_role();
  v_label := private.stamp_actor_label();
  if v_role is not null then
    new.role := v_role;
  end if;
  if v_label is not null then
    new.actor_label := v_label;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_stamp_mgmt_system_errors on public.mgmt_system_errors;
create trigger trg_stamp_mgmt_system_errors
  before insert or update on public.mgmt_system_errors
  for each row
  execute function private.trg_stamp_mgmt_system_errors();

create or replace function private.trg_stamp_inbox_reads_actor()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_key text := public.current_inbox_actor_key();
begin
  if v_key is null then
    raise exception '無法確認收件匣身分'
      using errcode = '42501';
  end if;
  new.actor_key := v_key;
  return new;
end;
$$;

drop trigger if exists trg_stamp_inbox_reads_actor on public.inbox_reads;
create trigger trg_stamp_inbox_reads_actor
  before insert or update on public.inbox_reads
  for each row
  execute function private.trg_stamp_inbox_reads_actor();

create or replace function private.trg_stamp_script_library_created_by()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_label text;
begin
  if public.current_app_user_id() is null then
    return new;
  end if;
  v_label := private.stamp_actor_label();
  if v_label is not null then
    new.created_by_label := v_label;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_stamp_script_library_created_by on public.script_library_entries;
create trigger trg_stamp_script_library_created_by
  before insert on public.script_library_entries
  for each row
  execute function private.trg_stamp_script_library_created_by();

create or replace function private.trg_stamp_expense_actor_labels()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_label text;
begin
  if public.current_app_user_id() is null then
    return new;
  end if;
  v_label := private.stamp_actor_label();
  if v_label is null then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.created_by_label := v_label;
  elsif new.voided_at is not null and old.voided_at is null then
    new.voided_by_label := v_label;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_stamp_expense_actor_labels on public.expense_entries;
create trigger trg_stamp_expense_actor_labels
  before insert or update on public.expense_entries
  for each row
  execute function private.trg_stamp_expense_actor_labels();

create or replace function private.trg_stamp_lesson_reminder_by()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_label text;
begin
  if public.current_app_user_id() is null then
    return new;
  end if;
  v_label := private.stamp_actor_label();
  if v_label is not null then
    new.reminded_by := v_label;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_stamp_lesson_reminder_by on public.lesson_reminder_logs;
create trigger trg_stamp_lesson_reminder_by
  before insert or update on public.lesson_reminder_logs
  for each row
  execute function private.trg_stamp_lesson_reminder_by();

create or replace function private.trg_stamp_entitlement_adjustment_actor()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.current_app_user_id() is null then
    return new;
  end if;
  new.created_by_email := nullif(public.current_app_user_email(), '');
  new.created_by_name := private.stamp_actor_label();
  return new;
end;
$$;

drop trigger if exists trg_stamp_entitlement_adjustment_actor
  on public.entitlement_pool_adjustments;
create trigger trg_stamp_entitlement_adjustment_actor
  before insert on public.entitlement_pool_adjustments
  for each row
  execute function private.trg_stamp_entitlement_adjustment_actor();

create or replace function private.trg_stamp_payroll_run_actor()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_label text;
begin
  if public.current_app_user_id() is null then
    return new;
  end if;
  v_label := private.stamp_actor_label();
  if v_label is null then
    return new;
  end if;
  if new.status = '待管理層核實'
    and (tg_op = 'INSERT' or old.status is distinct from new.status)
  then
    new.submitted_by := v_label;
  end if;
  if new.status = '已結算'
    and (tg_op = 'INSERT' or old.status is distinct from new.status)
  then
    new.settled_by := v_label;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_stamp_payroll_run_actor on public.payroll_runs;
create trigger trg_stamp_payroll_run_actor
  before insert or update on public.payroll_runs
  for each row
  execute function private.trg_stamp_payroll_run_actor();

update private.authz_meta
set authz_version = 10,
    updated_at = now()
where id = 1;
