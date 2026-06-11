-- 優惠折扣：業務規則欄位（有效期、學年、互斥群組、疊加上限、僅註記）

alter table public.payment_discounts
  add column if not exists valid_from date,
  add column if not exists valid_to date,
  add column if not exists academic_year text,
  add column if not exists stack_group text,
  add column if not exists max_stack_count integer,
  add column if not exists is_label_only boolean not null default false;

alter table public.payment_discounts
  drop constraint if exists payment_discounts_valid_date_range;

alter table public.payment_discounts
  add constraint payment_discounts_valid_date_range
  check (valid_from is null or valid_to is null or valid_from <= valid_to);

alter table public.payment_discounts
  drop constraint if exists payment_discounts_max_stack_count_positive;

alter table public.payment_discounts
  add constraint payment_discounts_max_stack_count_positive
  check (max_stack_count is null or max_stack_count > 0);

-- 既有資料：percent/amount 皆空視為僅註記
update public.payment_discounts
set is_label_only = true
where (percent_off is null or percent_off = 0)
  and (amount_off is null or amount_off = 0)
  and is_label_only = false;

create index if not exists payment_discounts_academic_year_idx
  on public.payment_discounts (academic_year)
  where academic_year is not null;

create index if not exists payment_discounts_stack_group_idx
  on public.payment_discounts (stack_group)
  where stack_group is not null;
