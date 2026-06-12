-- 26SM 暑期優惠目錄（可重複執行：依名稱 upsert）

insert into public.payment_discounts (
  id, name, discount_kind, percent_off, amount_off, is_active, sort_order,
  academic_year, valid_to, stack_group, lesson_tiers, eligibility_rules, is_label_only
)
values
  (
    'f26sm000-0000-4000-8000-000000000001',
    '26SM 多報階梯',
    'lesson_tier',
    null, null, true, 10,
    '26SM', null, '26sm_lesson_tier',
    '{"selection":"highest_only","tiers":[
      {"min_lessons":24,"amount_off":200},
      {"min_lessons":36,"amount_off":600},
      {"min_lessons":48,"amount_off":1000},
      {"min_lessons":60,"amount_off":1800}
    ]}'::jsonb,
    '{"family_lesson_pool":{"aggregate_sibling_lessons":true}}'::jsonb,
    false
  ),
  (
    'f26sm000-0000-4000-8000-000000000002',
    '26SM 早鳥額外',
    'lesson_tier_early_bird',
    null, null, true, 11,
    '26SM', '2026-06-24', '26sm_lesson_tier_early',
    '{"selection":"highest_only","tiers":[
      {"min_lessons":24,"amount_off":200},
      {"min_lessons":36,"amount_off":300},
      {"min_lessons":48,"amount_off":500},
      {"min_lessons":60,"amount_off":700}
    ]}'::jsonb,
    '{"family_lesson_pool":{"aggregate_sibling_lessons":true}}'::jsonb,
    false
  ),
  (
    'f26sm000-0000-4000-8000-000000000003',
    '26SM 主科加副科',
    'fixed_amount',
    null, 100, true, 20,
    '26SM', null, null,
    null,
    '{"require_one_from_each_group":[
      {"group":"main","label":"主科"},
      {"groups":["junior_elective","senior_elective"],"label":"副科"}
    ],"min_enrollment_period_per_line":"第一期"}'::jsonb,
    false
  ),
  (
    'f26sm000-0000-4000-8000-000000000004',
    '26SM 自組同班',
    'group_class',
    null, 200, true, 30,
    '26SM', null, null,
    null,
    null,
    false
  ),
  (
    'f26sm000-0000-4000-8000-000000000005',
    '26SM 被推薦優惠',
    'referral_referee',
    null, 100, true, 40,
    '26SM', null, null,
    null,
    '{"min_total_lessons":12,"require_new_student":true}'::jsonb,
    false
  ),
  (
    'f26sm000-0000-4000-8000-000000000006',
    '26SM 推薦回贈（現金待發）',
    'referral_referrer_cash',
    null, 100, true, 41,
    '26SM', null, null,
    null,
    '{"min_total_lessons":12,"require_new_student":true}'::jsonb,
    true
  )
on conflict (id) do update set
  name = excluded.name,
  discount_kind = excluded.discount_kind,
  percent_off = excluded.percent_off,
  amount_off = excluded.amount_off,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  academic_year = excluded.academic_year,
  valid_to = excluded.valid_to,
  stack_group = excluded.stack_group,
  lesson_tiers = excluded.lesson_tiers,
  eligibility_rules = excluded.eligibility_rules,
  is_label_only = excluded.is_label_only,
  updated_at = now();

update public.payment_discounts
set group_enrollment_rules = '{
  "min_group_size": 3,
  "require_same_class_id": true,
  "require_enrollment_period": "兩期全報",
  "require_course_mode": "summer_two_period",
  "require_joint_payment": true,
  "amount_off_per_student": 200
}'::jsonb
where id = 'f26sm000-0000-4000-8000-000000000004';
