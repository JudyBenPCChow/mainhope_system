-- 無畫面出糧：停用 Cody 財務角色；對話結算可用 postgres 改 payroll_runs。
-- 不從 CHECK 刪掉 finance 值；用戶管理不再授予。

begin;

-- ---------------------------------------------------------------------------
-- Cody Cheong 不再進入管理後台
-- ---------------------------------------------------------------------------

delete from public.mgmt_active_roles mar
using public.app_users au
where mar.app_user_id = au.id
  and lower(trim(coalesce(au.email, ''))) = 'cody@mainhope.edu.hk';

delete from public.app_user_roles aur
using public.app_users au
where aur.app_user_id = au.id
  and aur.role = 'finance'
  and lower(trim(coalesce(au.email, ''))) = 'cody@mainhope.edu.hk';

update public.app_users
set role = 'student',
    updated_at = now()
where lower(trim(coalesce(email, ''))) = 'cody@mainhope.edu.hk'
  and role = 'finance';

comment on table public.app_user_roles is
  '管理帳戶獲授予的角色。財務角色已停用，不再授予；歷史值仍可存在。';

-- ---------------------------------------------------------------------------
-- 對話／MCP（postgres）可寫 payroll_runs，不必再假 JWT
-- ---------------------------------------------------------------------------

create or replace function public.payroll_runs_enforce_capabilities()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if current_user in ('postgres', 'supabase_admin') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if not (
      private.has_capability('payroll.prepare')
      or private.has_capability('payroll.verify')
    ) then
      raise exception 'PAYROLL_PREPARE_DENIED'
        using errcode = '42501',
          hint = '開計糧月份須 payroll.prepare 或 payroll.verify';
    end if;
    return new;
  end if;

  if new.calc_version is distinct from old.calc_version
    and not private.has_capability('payroll.prepare')
  then
    raise exception 'PAYROLL_PREPARE_DENIED'
      using errcode = '42501', hint = '重算須 payroll.prepare';
  end if;

  if old.status is distinct from new.status then
    if new.status = '待管理層核實'
      and not private.has_capability('payroll.submit')
    then
      raise exception 'PAYROLL_SUBMIT_DENIED'
        using errcode = '42501', hint = '送核須 payroll.submit';
    elsif old.status = '待管理層核實'
      and new.status = '財務審閱中'
      and not private.has_capability('payroll.return')
    then
      raise exception 'PAYROLL_RETURN_DENIED'
        using errcode = '42501', hint = '退回須 payroll.return';
    elsif new.status = '已結算'
      and not private.has_capability('payroll.settle')
    then
      raise exception 'PAYROLL_SETTLE_DENIED'
        using errcode = '42501', hint = '結算須 payroll.settle';
    elsif old.status = '已結算'
      and not private.has_capability('payroll.reopen')
    then
      raise exception 'PAYROLL_REOPEN_DENIED'
        using errcode = '42501', hint = '重開須 payroll.reopen';
    elsif new.status in ('草稿', '財務審閱中')
      and old.status not in ('待管理層核實', '已結算')
      and not private.has_capability('payroll.prepare')
    then
      raise exception 'PAYROLL_PREPARE_DENIED'
        using errcode = '42501', hint = '改草稿／審閱中須 payroll.prepare';
    end if;
  end if;

  return new;
end;
$$;

revoke execute on function public.payroll_runs_enforce_capabilities() from public;
revoke execute on function public.payroll_runs_enforce_capabilities() from anon;

commit;
