-- HK 成本帳：科目／建議規則／入帳明細＋RLS（manager／alien）
-- 套用：npm run db:apply -- supabase/migrations/20260805101837_hk_expense_cost_ledger.sql
-- 計劃：docs/plans/2026-08-05-hk-expense-cost-stats.md

begin;

-- ---------------------------------------------------------------------------
-- 科目
-- ---------------------------------------------------------------------------

create table if not exists public.expense_ledger_accounts (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  label text not null,
  account_group text not null
    check (account_group in ('direct', 'overhead')),
  subject text,
  sort_order integer not null default 100,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint expense_ledger_accounts_code_unique unique (code)
);

comment on table public.expense_ledger_accounts is
  'HK 成本帳科目；direct＝可歸因直接成本，overhead＝公司層間接。';

create index if not exists expense_ledger_accounts_group_sort_idx
  on public.expense_ledger_accounts (account_group, sort_order, code);

-- ---------------------------------------------------------------------------
-- 入帳建議規則（服務日常人手入帳；唔係 Notion map 表）
-- ---------------------------------------------------------------------------

create table if not exists public.expense_category_rules (
  id uuid primary key default gen_random_uuid(),
  pattern text not null,
  ledger_account_id uuid references public.expense_ledger_accounts (id) on delete set null,
  force_pending boolean not null default false,
  hint text,
  priority integer not null default 100,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.expense_category_rules is
  '人手入帳 title 建議科目；pattern 為 ILIKE 子串。';

create index if not exists expense_category_rules_priority_idx
  on public.expense_category_rules (active, priority, pattern);

-- ---------------------------------------------------------------------------
-- 成本入帳
-- ---------------------------------------------------------------------------

create table if not exists public.expense_entries (
  id uuid primary key default gen_random_uuid(),
  spent_on date not null,
  title text not null,
  amount_hkd numeric(12, 2) not null
    check (amount_hkd <> 0),
  pay_method text not null
    check (pay_method in (
      'bank_card',
      'cashbox',
      'fps',
      'cheque',
      'staff_advance',
      'other'
    )),
  owner_label text,
  ledger_account_id uuid references public.expense_ledger_accounts (id) on delete restrict,
  ledger_status text not null default 'pending_review'
    check (ledger_status in ('pending_review', 'confirmed')),
  suggested_account_id uuid references public.expense_ledger_accounts (id) on delete set null,
  suggestion_hint text,
  notes text,
  voided_at timestamptz,
  void_reason text,
  voided_by_label text,
  teacher_id uuid references public.teachers (id) on delete set null,
  class_id uuid references public.classes (id) on delete set null,
  subject_code text,
  origin text not null default 'manual'
    check (origin in ('manual', 'payroll_settle', 'history_import')),
  origin_key text,
  created_by_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint expense_entries_origin_key_unique unique (origin_key)
);

comment on table public.expense_entries is
  'HK 成本入帳。計糧結算過帳 origin=payroll_settle；儀表板只讀未 void 列。';

comment on column public.expense_entries.origin_key is
  '冪等鍵；payroll: payroll|{month_key}|{teacher_id}|labor_tutor 等。';

comment on column public.expense_entries.pay_method is
  '支付渠道；staff_advance 只係渠道，唔當報銷狀態。';

create index if not exists expense_entries_spent_on_idx
  on public.expense_entries (spent_on desc);

create index if not exists expense_entries_status_idx
  on public.expense_entries (ledger_status)
  where voided_at is null;

create index if not exists expense_entries_account_idx
  on public.expense_entries (ledger_account_id)
  where voided_at is null;

create index if not exists expense_entries_teacher_idx
  on public.expense_entries (teacher_id)
  where teacher_id is not null and voided_at is null;

create index if not exists expense_entries_origin_idx
  on public.expense_entries (origin, spent_on desc);

-- ---------------------------------------------------------------------------
-- 鎖／void：confirmed 鎖金額／日期／老師／來源；改科目先 reopen
-- ---------------------------------------------------------------------------

create or replace function public.expense_entries_guard_update()
returns trigger
language plpgsql
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
    -- reopen 當下唔改科目；之後 pending 再改
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

drop trigger if exists trg_expense_entries_guard_update on public.expense_entries;
create trigger trg_expense_entries_guard_update
  before update on public.expense_entries
  for each row
  execute function public.expense_entries_guard_update();

-- ---------------------------------------------------------------------------
-- RLS：只 manager／alien（admin／finance／teacher JWT 直打被拒）
-- 科目／規則寫入限 alien；entries 可讀寫；禁硬刪
-- ---------------------------------------------------------------------------

alter table public.expense_ledger_accounts enable row level security;
alter table public.expense_category_rules enable row level security;
alter table public.expense_entries enable row level security;

drop policy if exists expense_accounts_select on public.expense_ledger_accounts;
create policy expense_accounts_select
  on public.expense_ledger_accounts
  for select
  to authenticated
  using (public.current_app_role() in ('manager', 'alien'));

drop policy if exists expense_accounts_write_alien on public.expense_ledger_accounts;
create policy expense_accounts_write_alien
  on public.expense_ledger_accounts
  for all
  to authenticated
  using (public.is_alien())
  with check (public.is_alien());

drop policy if exists expense_rules_select on public.expense_category_rules;
create policy expense_rules_select
  on public.expense_category_rules
  for select
  to authenticated
  using (public.current_app_role() in ('manager', 'alien'));

drop policy if exists expense_rules_write_alien on public.expense_category_rules;
create policy expense_rules_write_alien
  on public.expense_category_rules
  for all
  to authenticated
  using (public.is_alien())
  with check (public.is_alien());

drop policy if exists expense_entries_select on public.expense_entries;
create policy expense_entries_select
  on public.expense_entries
  for select
  to authenticated
  using (public.current_app_role() in ('manager', 'alien'));

drop policy if exists expense_entries_insert on public.expense_entries;
create policy expense_entries_insert
  on public.expense_entries
  for insert
  to authenticated
  with check (public.current_app_role() in ('manager', 'alien'));

drop policy if exists expense_entries_update on public.expense_entries;
create policy expense_entries_update
  on public.expense_entries
  for update
  to authenticated
  using (public.current_app_role() in ('manager', 'alien'))
  with check (public.current_app_role() in ('manager', 'alien'));

-- 無 DELETE policy → 禁硬刪

grant select on public.expense_ledger_accounts to authenticated;
grant insert, update on public.expense_ledger_accounts to authenticated;

grant select on public.expense_category_rules to authenticated;
grant insert, update on public.expense_category_rules to authenticated;

grant select, insert, update on public.expense_entries to authenticated;

-- ---------------------------------------------------------------------------
-- 種子科目
-- ---------------------------------------------------------------------------

insert into public.expense_ledger_accounts (code, label, account_group, sort_order) values
  ('labor_tutor', '導師薪酬（計糧）', 'direct', 10),
  ('labor_employer_mpf', '僱主強積金', 'direct', 20),
  ('labor_non_payroll', '非計糧人工', 'direct', 30),
  ('materials', '教材', 'direct', 40),
  ('direct_other', '其他直接成本', 'direct', 90),
  ('rent_mgmt', '租金及管理費', 'overhead', 110),
  ('utilities_net', '水電／上網電話', 'overhead', 120),
  ('cleaning', '清潔', 'overhead', 130),
  ('software', '軟件訂閱', 'overhead', 140),
  ('supplies', '文具雜物', 'overhead', 150),
  ('marketing', '廣告／印刷', 'overhead', 160),
  ('team_welfare', '團建／餐飲', 'overhead', 170),
  ('overhead_other', '其他間接成本', 'overhead', 190)
on conflict (code) do update
  set label = excluded.label,
      account_group = excluded.account_group,
      sort_order = excluded.sort_order,
      active = true,
      updated_at = now();

-- ---------------------------------------------------------------------------
-- 種子規則（營運用詞；薪金類 force_pending）
-- ---------------------------------------------------------------------------

insert into public.expense_category_rules (pattern, ledger_account_id, force_pending, hint, priority)
select v.pattern, a.id, v.force_pending, v.hint, v.priority
from (
  values
    ('薪金', null::text, true, '導師薪酬應由計糧結算過帳，勿人手入帳。', 10),
    ('薪酬', null, true, '導師薪酬應由計糧結算過帳，勿人手入帳。', 10),
    ('工資', null, true, '導師薪酬應由計糧結算過帳，勿人手入帳。', 10),
    ('人工', null, true, '若屬計糧覆蓋人員，應由結算過帳；否則選「非計糧人工」。', 15),
    ('MPF', 'labor_employer_mpf', true, '僱主強積金通常隨計糧過帳；人手入請覆核。', 20),
    ('強積金', 'labor_employer_mpf', true, '僱主強積金通常隨計糧過帳；人手入請覆核。', 20),
    ('退學費', null, true, '退學費唔當成本自動入帳；請覆核或 void。', 5),
    ('退款', null, true, '退款／退學費唔當成本自動入帳；請覆核或 void。', 5),
    ('按金', null, true, '按金通常唔當成本；請覆核。', 5),
    ('租金', 'rent_mgmt', false, null, 40),
    ('管理費', 'rent_mgmt', false, null, 40),
    ('電費', 'utilities_net', false, null, 50),
    ('水費', 'utilities_net', false, null, 50),
    ('上網', 'utilities_net', false, null, 50),
    ('電話', 'utilities_net', false, null, 50),
    ('清潔', 'cleaning', false, null, 60),
    ('教材', 'materials', false, null, 70),
    ('文具', 'supplies', false, null, 80),
    ('廣告', 'marketing', false, null, 90),
    ('印刷', 'marketing', false, null, 90),
    ('軟件', 'software', false, null, 100),
    ('訂閱', 'software', false, null, 100),
    ('團建', 'team_welfare', false, null, 110),
    ('餐', 'team_welfare', false, null, 110)
) as v(pattern, account_code, force_pending, hint, priority)
left join public.expense_ledger_accounts a on a.code = v.account_code
where not exists (
  select 1 from public.expense_category_rules r
  where r.pattern = v.pattern and r.priority = v.priority
);

commit;
