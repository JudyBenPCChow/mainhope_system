-- 優惠折扣：文字簡介／備註

alter table public.payment_discounts
  add column if not exists description text;

comment on column public.payment_discounts.description is
  '優惠簡介（供管理員備註說明，不影響計算）';
