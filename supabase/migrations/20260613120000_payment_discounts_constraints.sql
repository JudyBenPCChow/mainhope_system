-- 優惠折扣：數值範圍 CHECK constraints

alter table public.payment_discounts
  drop constraint if exists payment_discounts_percent_off_range;

alter table public.payment_discounts
  add constraint payment_discounts_percent_off_range
  check (percent_off is null or (percent_off >= 0 and percent_off <= 100));

alter table public.payment_discounts
  drop constraint if exists payment_discounts_amount_off_nonneg;

alter table public.payment_discounts
  add constraint payment_discounts_amount_off_nonneg
  check (amount_off is null or amount_off >= 0);
