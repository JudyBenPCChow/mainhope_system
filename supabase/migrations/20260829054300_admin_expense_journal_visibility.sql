-- 行政日記帳：科目 visibility 分層；admin 加 expenses.record；RLS 前台科目可讀寫。
-- 套用：npm run db:apply -- supabase/migrations/20260829054300_admin_expense_journal_visibility.sql

begin;

alter table public.expense_ledger_accounts
  add column if not exists visibility text not null default 'manager';

alter table public.expense_ledger_accounts
  drop constraint if exists expense_ledger_accounts_visibility_check;

alter table public.expense_ledger_accounts
  add constraint expense_ledger_accounts_visibility_check
  check (visibility in ('front_desk', 'manager'));

comment on column public.expense_ledger_accounts.visibility is
  'front_desk＝行政日記帳可見／可入；manager＝僅管理層／財務／外星人（租金、人工、水電等）。';

update public.expense_ledger_accounts
set visibility = 'front_desk', updated_at = now()
where code in ('materials', 'supplies', 'team_welfare', 'marketing');

update public.expense_ledger_accounts
set visibility = 'manager', updated_at = now()
where code not in ('materials', 'supplies', 'team_welfare', 'marketing');

insert into private.authz_role_capabilities (role, capability_key)
values ('admin', 'expenses.record')
on conflict (role, capability_key) do nothing;

create or replace function public.expense_entries_guard_insert()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_code text;
begin
  if new.origin = 'manual' then
    if new.ledger_account_id is null then
      raise exception '請選擇科目'
        using errcode = '23514', hint = '人手日記帳必須選擇科目';
    end if;
    select a.code into v_code
    from public.expense_ledger_accounts a
    where a.id = new.ledger_account_id;
    if v_code in ('labor_tutor', 'labor_employer_mpf') then
      raise exception '導師薪酬／僱主強積金須由計糧結算過帳，不可人手入帳。'
        using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_expense_entries_guard_insert on public.expense_entries;
create trigger trg_expense_entries_guard_insert
  before insert on public.expense_entries
  for each row
  execute function public.expense_entries_guard_insert();

drop policy if exists rls_cap_select_expense_ledger_accounts
  on public.expense_ledger_accounts;
drop policy if exists rls_cap_write_expense_ledger_accounts
  on public.expense_ledger_accounts;

create policy rls_cap_select_expense_ledger_accounts
on public.expense_ledger_accounts for select to authenticated
using (
  private.has_capability('expenses.read')
  or (
    private.has_capability('expenses.record')
    and visibility = 'front_desk'
  )
);

create policy rls_cap_write_expense_ledger_accounts
on public.expense_ledger_accounts for all to authenticated
using (private.has_capability('catalog.manage'))
with check (private.has_capability('catalog.manage'));

drop policy if exists rls_cap_select_expense_category_rules
  on public.expense_category_rules;
drop policy if exists rls_cap_write_expense_category_rules
  on public.expense_category_rules;

create policy rls_cap_select_expense_category_rules
on public.expense_category_rules for select to authenticated
using (
  private.has_capability('expenses.read')
  or private.has_capability('expenses.record')
);

create policy rls_cap_write_expense_category_rules
on public.expense_category_rules for all to authenticated
using (private.has_capability('catalog.manage'))
with check (private.has_capability('catalog.manage'));

drop policy if exists rls_cap_select_expense_entries on public.expense_entries;
drop policy if exists rls_cap_insert_expense_entries on public.expense_entries;
drop policy if exists rls_cap_update_expense_entries on public.expense_entries;

create policy rls_cap_select_expense_entries
on public.expense_entries for select to authenticated
using (
  private.has_capability('expenses.read')
  or (
    private.has_capability('expenses.record')
    and exists (
      select 1
      from public.expense_ledger_accounts a
      where a.id = expense_entries.ledger_account_id
        and a.visibility = 'front_desk'
    )
  )
);

create policy rls_cap_insert_expense_entries
on public.expense_entries for insert to authenticated
with check (
  private.has_capability('expenses.record')
  and (
    private.has_capability('expenses.read')
    or exists (
      select 1
      from public.expense_ledger_accounts a
      where a.id = ledger_account_id
        and a.visibility = 'front_desk'
        and a.active
    )
  )
);

create policy rls_cap_update_expense_entries
on public.expense_entries for update to authenticated
using (
  (
    private.has_capability('expenses.read')
    and (
      private.has_capability('expenses.record')
      or private.has_capability('expenses.confirm')
      or private.has_capability('expenses.void')
      or private.has_capability('expenses.reopen')
    )
  )
  or (
    private.has_capability('expenses.record')
    and not private.has_capability('expenses.read')
    and exists (
      select 1
      from public.expense_ledger_accounts a
      where a.id = expense_entries.ledger_account_id
        and a.visibility = 'front_desk'
    )
  )
)
with check (
  (
    private.has_capability('expenses.read')
    and (
      private.has_capability('expenses.record')
      or private.has_capability('expenses.confirm')
      or private.has_capability('expenses.void')
      or private.has_capability('expenses.reopen')
    )
  )
  or (
    private.has_capability('expenses.record')
    and not private.has_capability('expenses.read')
    and exists (
      select 1
      from public.expense_ledger_accounts a
      where a.id = ledger_account_id
        and a.visibility = 'front_desk'
    )
  )
);

update private.authz_meta
set authz_version = 12,
    updated_at = now()
where id = 1;

commit;
