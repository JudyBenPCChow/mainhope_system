-- 優惠類型、階梯表、自組規則

alter table public.payment_discounts
  add column if not exists discount_kind text not null default 'fixed_amount',
  add column if not exists lesson_tiers jsonb,
  add column if not exists group_enrollment_rules jsonb;

alter table public.payment_discounts
  drop constraint if exists payment_discounts_kind_check;

alter table public.payment_discounts
  add constraint payment_discounts_kind_check
  check (discount_kind in (
    'fixed_amount',
    'lesson_tier',
    'lesson_tier_early_bird',
    'group_class',
    'referral_referee',
    'referral_referrer_cash'
  ));

comment on column public.payment_discounts.discount_kind is
  'fixed_amount | lesson_tier | lesson_tier_early_bird | group_class | referral_referee | referral_referrer_cash';

comment on column public.payment_discounts.lesson_tiers is
  '{"selection":"highest_only","tiers":[{"min_lessons":24,"amount_off":200},...]}';

comment on column public.payment_discounts.group_enrollment_rules is
  '{"min_group_size":3,"require_same_class_id":true,"require_enrollment_period":"兩期全報",...}';
