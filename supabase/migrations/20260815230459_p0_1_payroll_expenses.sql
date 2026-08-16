-- P0-1 domain 6–7：計糧狀態機／成本帳放寬 finance 入帳。
-- 未喺 staging allow-deny 通過前，唔好套 production（禁 npm run db:apply --linked）。
--
-- 計糧：admin 只讀。P1–P6 finance；P7–P9 manager＋alien；reopen alien。
-- 費率寫入暫 catalog.manage（無獨立 key／無費率 UI）。
-- 成本帳：finance 可入帳／改 pending 分類；confirm／void／reopen 仍 manager＋alien。
-- 科目／規則寫入 catalog.manage。

-- ---------------------------------------------------------------------------
-- payroll_runs 狀態機
-- ---------------------------------------------------------------------------

create or replace function public.payroll_runs_enforce_capabilities()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
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

drop trigger if exists trg_payroll_runs_enforce_capabilities on public.payroll_runs;
create trigger trg_payroll_runs_enforce_capabilities
  before insert or update on public.payroll_runs
  for each row
  execute function public.payroll_runs_enforce_capabilities();

-- ---------------------------------------------------------------------------
-- payroll_teacher_states 欄位
-- ---------------------------------------------------------------------------

create or replace function public.payroll_teacher_states_enforce_capabilities()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.finance_reviewed
      and not private.has_capability('payroll.review')
    then
      raise exception 'PAYROLL_REVIEW_DENIED' using errcode = '42501';
    end if;
    if new.excluded
      and not private.has_capability('payroll.exclude')
    then
      raise exception 'PAYROLL_EXCLUDE_DENIED' using errcode = '42501';
    end if;
    if new.submit_status in ('submitted', 'accepted')
      and not private.has_capability('payroll.submit')
    then
      raise exception 'PAYROLL_SUBMIT_DENIED' using errcode = '42501';
    end if;
    if new.submit_status = 'returned'
      and not private.has_capability('payroll.return')
    then
      raise exception 'PAYROLL_RETURN_DENIED' using errcode = '42501';
    end if;
    if new.manager_spot_checked
      and not private.has_capability('payroll.verify')
    then
      raise exception 'PAYROLL_VERIFY_DENIED' using errcode = '42501';
    end if;
    if not new.finance_reviewed
      and not new.excluded
      and new.submit_status in ('none')
      and not new.manager_spot_checked
      and not (
        private.has_capability('payroll.prepare')
        or private.has_capability('payroll.review')
      )
    then
      raise exception 'PAYROLL_PREPARE_DENIED' using errcode = '42501';
    end if;
    return new;
  end if;

  if new.finance_reviewed is distinct from old.finance_reviewed
    and not private.has_capability('payroll.review')
  then
    raise exception 'PAYROLL_REVIEW_DENIED' using errcode = '42501';
  end if;
  if (new.excluded is distinct from old.excluded
      or new.exclude_reason is distinct from old.exclude_reason)
    and not private.has_capability('payroll.exclude')
  then
    raise exception 'PAYROLL_EXCLUDE_DENIED' using errcode = '42501';
  end if;
  if new.submit_status is distinct from old.submit_status then
    if new.submit_status in ('submitted', 'accepted')
      and not private.has_capability('payroll.submit')
    then
      raise exception 'PAYROLL_SUBMIT_DENIED' using errcode = '42501';
    end if;
    if new.submit_status = 'returned'
      and not private.has_capability('payroll.return')
    then
      raise exception 'PAYROLL_RETURN_DENIED' using errcode = '42501';
    end if;
    if new.submit_status = 'none'
      and not (
        private.has_capability('payroll.submit')
        or private.has_capability('payroll.return')
      )
    then
      raise exception 'PAYROLL_SUBMIT_DENIED' using errcode = '42501';
    end if;
  end if;
  if new.manager_spot_checked is distinct from old.manager_spot_checked
    and not private.has_capability('payroll.verify')
  then
    raise exception 'PAYROLL_VERIFY_DENIED' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_payroll_teacher_states_enforce_capabilities
  on public.payroll_teacher_states;
create trigger trg_payroll_teacher_states_enforce_capabilities
  before insert or update on public.payroll_teacher_states
  for each row
  execute function public.payroll_teacher_states_enforce_capabilities();

-- ---------------------------------------------------------------------------
-- payroll_adjustments：申請 vs 核准
-- ---------------------------------------------------------------------------

create or replace function public.payroll_adjustments_enforce_capabilities()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if not private.has_capability('payroll.adjust.request') then
      raise exception 'PAYROLL_ADJUST_DENIED' using errcode = '42501';
    end if;
    return new;
  end if;
  if new.status is distinct from old.status
    and new.status in ('approved', 'rejected')
    and not private.has_capability('payroll.verify')
  then
    raise exception 'PAYROLL_VERIFY_DENIED'
      using errcode = '42501', hint = '核准／駁回調整須 payroll.verify';
  end if;
  if new.status is distinct from old.status
    and new.status = 'pending'
    and not private.has_capability('payroll.adjust.request')
  then
    raise exception 'PAYROLL_ADJUST_DENIED' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_payroll_adjustments_enforce_capabilities
  on public.payroll_adjustments;
create trigger trg_payroll_adjustments_enforce_capabilities
  before insert or update on public.payroll_adjustments
  for each row
  execute function public.payroll_adjustments_enforce_capabilities();

-- ---------------------------------------------------------------------------
-- payroll RLS
-- ---------------------------------------------------------------------------

drop policy if exists payroll_rates_mgmt_all on public.payroll_rates;
drop policy if exists rls_cap_select_payroll_rates on public.payroll_rates;
drop policy if exists rls_cap_write_payroll_rates on public.payroll_rates;

create policy rls_cap_select_payroll_rates
on public.payroll_rates for select to authenticated
using (private.has_capability('payroll.read') and public.is_mgmt_staff());

create policy rls_cap_write_payroll_rates
on public.payroll_rates for all to authenticated
using (private.has_capability('catalog.manage'))
with check (private.has_capability('catalog.manage'));

drop policy if exists payroll_runs_mgmt_all on public.payroll_runs;
drop policy if exists rls_cap_select_payroll_runs on public.payroll_runs;
drop policy if exists rls_cap_insert_payroll_runs on public.payroll_runs;
drop policy if exists rls_cap_update_payroll_runs on public.payroll_runs;

create policy rls_cap_select_payroll_runs
on public.payroll_runs for select to authenticated
using (private.has_capability('payroll.read') and public.is_mgmt_staff());

create policy rls_cap_insert_payroll_runs
on public.payroll_runs for insert to authenticated
with check (
  private.has_capability('payroll.prepare')
  or private.has_capability('payroll.verify')
);

create policy rls_cap_update_payroll_runs
on public.payroll_runs for update to authenticated
using (private.has_capability('payroll.read') and public.is_mgmt_staff())
with check (private.has_capability('payroll.read') and public.is_mgmt_staff());

drop policy if exists payroll_teacher_states_mgmt_all
  on public.payroll_teacher_states;
drop policy if exists rls_cap_select_payroll_teacher_states
  on public.payroll_teacher_states;
drop policy if exists rls_cap_write_payroll_teacher_states
  on public.payroll_teacher_states;

create policy rls_cap_select_payroll_teacher_states
on public.payroll_teacher_states for select to authenticated
using (private.has_capability('payroll.read') and public.is_mgmt_staff());

create policy rls_cap_write_payroll_teacher_states
on public.payroll_teacher_states for all to authenticated
using (
  private.has_capability('payroll.prepare')
  or private.has_capability('payroll.review')
  or private.has_capability('payroll.exclude')
  or private.has_capability('payroll.submit')
  or private.has_capability('payroll.return')
  or private.has_capability('payroll.verify')
)
with check (
  private.has_capability('payroll.prepare')
  or private.has_capability('payroll.review')
  or private.has_capability('payroll.exclude')
  or private.has_capability('payroll.submit')
  or private.has_capability('payroll.return')
  or private.has_capability('payroll.verify')
);

drop policy if exists payroll_manual_hours_mgmt_all on public.payroll_manual_hours;
drop policy if exists rls_cap_select_payroll_manual_hours
  on public.payroll_manual_hours;
drop policy if exists rls_cap_write_payroll_manual_hours
  on public.payroll_manual_hours;

create policy rls_cap_select_payroll_manual_hours
on public.payroll_manual_hours for select to authenticated
using (private.has_capability('payroll.read') and public.is_mgmt_staff());

create policy rls_cap_write_payroll_manual_hours
on public.payroll_manual_hours for all to authenticated
using (private.has_capability('payroll.hours'))
with check (private.has_capability('payroll.hours'));

drop policy if exists payroll_adjustments_mgmt_all on public.payroll_adjustments;
drop policy if exists rls_cap_select_payroll_adjustments
  on public.payroll_adjustments;
drop policy if exists rls_cap_insert_payroll_adjustments
  on public.payroll_adjustments;
drop policy if exists rls_cap_update_payroll_adjustments
  on public.payroll_adjustments;

create policy rls_cap_select_payroll_adjustments
on public.payroll_adjustments for select to authenticated
using (private.has_capability('payroll.read') and public.is_mgmt_staff());

create policy rls_cap_insert_payroll_adjustments
on public.payroll_adjustments for insert to authenticated
with check (private.has_capability('payroll.adjust.request'));

create policy rls_cap_update_payroll_adjustments
on public.payroll_adjustments for update to authenticated
using (
  private.has_capability('payroll.adjust.request')
  or private.has_capability('payroll.verify')
)
with check (
  private.has_capability('payroll.adjust.request')
  or private.has_capability('payroll.verify')
);

-- ---------------------------------------------------------------------------
-- 成本帳：capability + 放寬 finance 讀／入帳
-- ---------------------------------------------------------------------------

create or replace function public.expense_entries_guard_update()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- 已 void：禁止救回或改金額／日期／科目／來源
  if old.voided_at is not null then
    if new.voided_at is distinct from old.voided_at
       or new.amount_hkd is distinct from old.amount_hkd
       or new.spent_on is distinct from old.spent_on
       or new.ledger_account_id is distinct from old.ledger_account_id
       or new.ledger_status is distinct from old.ledger_status
       or new.teacher_id is distinct from old.teacher_id
       or new.origin is distinct from old.origin
       or new.origin_key is distinct from old.origin_key
       or new.title is distinct from old.title
       or new.pay_method is distinct from old.pay_method
    then
      raise exception '已作廢成本列不可修改關鍵欄；請另開新單。';
    end if;
    return new;
  end if;

  if old.voided_at is null and new.voided_at is not null then
    if not private.has_capability('expenses.void') then
      raise exception 'EXPENSE_VOID_DENIED'
        using errcode = '42501', hint = '作廢成本列須 expenses.void';
    end if;
  elsif old.ledger_status is distinct from new.ledger_status then
    if new.ledger_status = 'confirmed'
      and not private.has_capability('expenses.confirm')
    then
      raise exception 'EXPENSE_CONFIRM_DENIED'
        using errcode = '42501', hint = '確認成本列須 expenses.confirm';
    end if;
    if old.ledger_status = 'confirmed'
      and new.ledger_status = 'pending_review'
      and not private.has_capability('expenses.reopen')
    then
      raise exception 'EXPENSE_REOPEN_DENIED'
        using errcode = '42501', hint = 'reopen 須 expenses.reopen';
    end if;
  elsif not private.has_capability('expenses.record') then
    raise exception 'EXPENSE_RECORD_DENIED'
      using errcode = '42501', hint = '入帳／改分類須 expenses.record';
  end if;

  -- 來源／冪等鍵永遠不可改
  if new.origin is distinct from old.origin
     or new.origin_key is distinct from old.origin_key
  then
    raise exception '成本列來源（origin／origin_key）不可修改。';
  end if;

  -- confirmed：鎖金額／日期／老師／標題／支付；科目須先 reopen
  if old.ledger_status = 'confirmed' and new.ledger_status = 'confirmed' then
    if new.amount_hkd is distinct from old.amount_hkd
       or new.spent_on is distinct from old.spent_on
       or new.teacher_id is distinct from old.teacher_id
       or new.class_id is distinct from old.class_id
       or new.subject_code is distinct from old.subject_code
       or new.title is distinct from old.title
       or new.pay_method is distinct from old.pay_method
       or new.ledger_account_id is distinct from old.ledger_account_id
    then
      raise exception '已確認成本列鎖金額／日期／科目；請先 reopen（改為待覆核）再改科目。';
    end if;
  end if;

  -- reopen：只准 pending_review，其餘關鍵欄仍鎖（payroll／已確認金額）
  if old.ledger_status = 'confirmed' and new.ledger_status = 'pending_review' then
    if new.amount_hkd is distinct from old.amount_hkd
       or new.spent_on is distinct from old.spent_on
       or new.teacher_id is distinct from old.teacher_id
       or new.origin is distinct from old.origin
       or new.origin_key is distinct from old.origin_key
    then
      raise exception 'reopen 只准改科目分類，不可改金額／日期／老師／來源。';
    end if;
    if new.ledger_account_id is distinct from old.ledger_account_id then
      raise exception '請先 reopen，再於待覆核狀態改科目。';
    end if;
  end if;

  -- 計糧過帳列：即使 pending 亦鎖金額／老師／日期
  if old.origin = 'payroll_settle' then
    if new.amount_hkd is distinct from old.amount_hkd
       or new.spent_on is distinct from old.spent_on
       or new.teacher_id is distinct from old.teacher_id
    then
      raise exception '計糧過帳列不可改金額／日期／老師。';
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop policy if exists expense_accounts_select on public.expense_ledger_accounts;
drop policy if exists expense_accounts_write_alien on public.expense_ledger_accounts;
drop policy if exists rls_cap_select_expense_ledger_accounts
  on public.expense_ledger_accounts;
drop policy if exists rls_cap_write_expense_ledger_accounts
  on public.expense_ledger_accounts;

create policy rls_cap_select_expense_ledger_accounts
on public.expense_ledger_accounts for select to authenticated
using (private.has_capability('expenses.read'));

create policy rls_cap_write_expense_ledger_accounts
on public.expense_ledger_accounts for all to authenticated
using (private.has_capability('catalog.manage'))
with check (private.has_capability('catalog.manage'));

drop policy if exists expense_rules_select on public.expense_category_rules;
drop policy if exists expense_rules_write_alien on public.expense_category_rules;
drop policy if exists rls_cap_select_expense_category_rules
  on public.expense_category_rules;
drop policy if exists rls_cap_write_expense_category_rules
  on public.expense_category_rules;

create policy rls_cap_select_expense_category_rules
on public.expense_category_rules for select to authenticated
using (private.has_capability('expenses.read'));

create policy rls_cap_write_expense_category_rules
on public.expense_category_rules for all to authenticated
using (private.has_capability('catalog.manage'))
with check (private.has_capability('catalog.manage'));

drop policy if exists expense_entries_select on public.expense_entries;
drop policy if exists expense_entries_insert on public.expense_entries;
drop policy if exists expense_entries_update on public.expense_entries;
drop policy if exists rls_cap_select_expense_entries on public.expense_entries;
drop policy if exists rls_cap_insert_expense_entries on public.expense_entries;
drop policy if exists rls_cap_update_expense_entries on public.expense_entries;

create policy rls_cap_select_expense_entries
on public.expense_entries for select to authenticated
using (private.has_capability('expenses.read'));

create policy rls_cap_insert_expense_entries
on public.expense_entries for insert to authenticated
with check (private.has_capability('expenses.record'));

create policy rls_cap_update_expense_entries
on public.expense_entries for update to authenticated
using (
  private.has_capability('expenses.record')
  or private.has_capability('expenses.confirm')
  or private.has_capability('expenses.void')
  or private.has_capability('expenses.reopen')
)
with check (
  private.has_capability('expenses.record')
  or private.has_capability('expenses.confirm')
  or private.has_capability('expenses.void')
  or private.has_capability('expenses.reopen')
);

update private.authz_meta
set authz_version = 6,
    updated_at = now()
where id = 1;
