-- HK expense history_import (idempotent on origin_key)

begin;

insert into public.expense_entries (
  spent_on, title, amount_hkd, pay_method, owner_label,
  ledger_account_id, ledger_status, suggested_account_id, suggestion_hint,
  notes, origin, origin_key, created_by_label
)
select
  '2026-08-03'::date,
  '買垃圾袋',
  30.00,
  'cashbox',
  'Sophie',
  a.id,
  'pending_review',
  a.id,
  NULL,
  '[Notion類別:文具雜物]',
  'history_import',
  'HK|notion|3a986fe67d8e5625|2026-08-03|30.00|550eee05e4865270',
  'history_import'
from public.expense_ledger_accounts a
where a.code = 'supplies'
on conflict (origin_key) do nothing;

insert into public.expense_entries (
  spent_on, title, amount_hkd, pay_method, owner_label,
  ledger_account_id, ledger_status, suggested_account_id, suggestion_hint,
  notes, origin, origin_key, created_by_label
)
select
  '2026-07-23'::date,
  'Henry買物理教材',
  280.00,
  'cashbox',
  'Sophie',
  a.id,
  'pending_review',
  a.id,
  NULL,
  '[Notion類別:教材]',
  'history_import',
  'HK|notion|3f254c198e763e2b|2026-07-23|280.00|837f7a7af6c620c6',
  'history_import'
from public.expense_ledger_accounts a
where a.code = 'materials'
on conflict (origin_key) do nothing;

insert into public.expense_entries (
  spent_on, title, amount_hkd, pay_method, owner_label,
  ledger_account_id, ledger_status, suggested_account_id, suggestion_hint,
  notes, origin, origin_key, created_by_label
)
select
  '2026-07-23'::date,
  '買飲品',
  15.00,
  'cashbox',
  'Sophie',
  a.id,
  'pending_review',
  a.id,
  NULL,
  '[Notion類別:文具雜物]',
  'history_import',
  'HK|notion|2fe7ba96aade6fd6|2026-07-23|15.00|6de2fca790187ea6',
  'history_import'
from public.expense_ledger_accounts a
where a.code = 'supplies'
on conflict (origin_key) do nothing;

insert into public.expense_entries (
  spent_on, title, amount_hkd, pay_method, owner_label,
  ledger_account_id, ledger_status, suggested_account_id, suggestion_hint,
  notes, origin, origin_key, created_by_label
)
select
  '2026-07-21'::date,
  '買抽紙巾',
  56.00,
  'cashbox',
  'Sophie',
  a.id,
  'pending_review',
  a.id,
  NULL,
  '[Notion類別:文具雜物]',
  'history_import',
  'HK|notion|7bcd9c8865ff7c2c|2026-07-21|56.00|bbabb73fc81645d2',
  'history_import'
from public.expense_ledger_accounts a
where a.code = 'supplies'
on conflict (origin_key) do nothing;

insert into public.expense_entries (
  spent_on, title, amount_hkd, pay_method, owner_label,
  ledger_account_id, ledger_status, suggested_account_id, suggestion_hint,
  notes, origin, origin_key, created_by_label
)
select
  '2026-07-17'::date,
  '888',
  888.00,
  'bank_card',
  'Mark',
  a.id,
  'pending_review',
  a.id,
  NULL,
  '[Notion類別:文具雜物]',
  'history_import',
  'HK|notion|7e74750dbed4755a|2026-07-17|888.00|eaa67f3a93d0acb0',
  'history_import'
from public.expense_ledger_accounts a
where a.code = 'supplies'
on conflict (origin_key) do nothing;

insert into public.expense_entries (
  spent_on, title, amount_hkd, pay_method, owner_label,
  ledger_account_id, ledger_status, suggested_account_id, suggestion_hint,
  notes, origin, origin_key, created_by_label
)
select
  '2026-07-12'::date,
  'Henry買bio資料',
  87.00,
  'cashbox',
  'Sophie',
  a.id,
  'pending_review',
  a.id,
  NULL,
  '[Notion類別:教材]',
  'history_import',
  'HK|notion|287c9f51f2b7b582|2026-07-12|87.00|e801943281394bb7',
  'history_import'
from public.expense_ledger_accounts a
where a.code = 'materials'
on conflict (origin_key) do nothing;

update public.expense_entries e
set
  voided_at = coalesce(e.voided_at, now()),
  void_reason = coalesce(
    e.void_reason,
    '該月已有計糧過帳；歷史薪金列不作成本'
  ),
  voided_by_label = coalesce(e.voided_by_label, 'history_import'),
  updated_at = now()
where e.origin = 'history_import'
  and e.voided_at is null
  and (
    e.title ~* '(人工|薪金|薪酬|工資|兼職|mpf|強積金)'
    or coalesce(e.suggestion_hint, '') ilike '%計糧%'
  )
  and to_char(e.spent_on, 'YYYY-MM') in (
    select distinct to_char(p.spent_on, 'YYYY-MM')
    from public.expense_entries p
    where p.origin = 'payroll_settle'
      and p.voided_at is null
  );

commit;
