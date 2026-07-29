-- 收款臨時 Special discount：applications 可不連目錄（payment_discount_id null）

alter table public.payment_discount_applications
  alter column payment_discount_id drop not null;

alter table public.payment_discount_applications
  drop constraint if exists payment_discount_applications_catalog_or_special_chk;

alter table public.payment_discount_applications
  add constraint payment_discount_applications_catalog_or_special_chk
  check (
    payment_discount_id is not null
    or (amount_deducted is not null and amount_deducted > 0)
  );

-- 每單最多一筆 Special discount（payment_discount_id is null）
create unique index if not exists payment_discount_applications_one_special_per_payment_idx
  on public.payment_discount_applications (payment_id)
  where payment_discount_id is null;

-- 系統通知：僅行政／外星人可見
insert into public.inbox_events (
  event_type,
  category,
  title,
  body,
  action_path,
  audience_teacher_ids,
  audience_roles,
  payload
)
select
  'system_update',
  'system',
  '收款可加 Special discount',
  E'收款登記（／Payments）優惠區新增「Special discount」：勾選後只需輸入減免金額，收據會固定顯示 Special discount。\n\n可與目錄優惠併用（先套目錄，再扣 Special discount）。不計入互斥群組與每單上限。\n\n用途：臨時減免、目錄尚未涵蓋的情況；無需自訂優惠名稱。',
  '/Payments',
  '{}'::uuid[],
  array['admin', 'alien']::text[],
  '{}'::jsonb
where not exists (
  select 1
  from public.inbox_events e
  where e.event_type = 'system_update'
    and e.title = '收款可加 Special discount'
);
