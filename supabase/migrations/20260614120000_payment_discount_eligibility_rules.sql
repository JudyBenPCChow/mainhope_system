-- 優惠折扣：繳費明細資格條件（JSON）

alter table public.payment_discounts
  add column if not exists eligibility_rules jsonb;

comment on column public.payment_discounts.eligibility_rules is
  '繳費資格：min_subject_count、min_total_lessons、required_subject_codes、require_any_subject_codes 等';
