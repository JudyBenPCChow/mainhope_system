-- 繳費單：項目小計 + 多項優惠套用紀錄

alter table public.payments
  add column if not exists subtotal_amount numeric;

create table if not exists public.payment_discount_applications (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments (id) on delete cascade,
  payment_discount_id uuid not null references public.payment_discounts (id) on delete restrict,
  sort_order integer not null default 0,
  amount_deducted numeric,
  created_at timestamptz not null default now()
);

create index if not exists payment_discount_applications_payment_id_idx
  on public.payment_discount_applications (payment_id);

create unique index if not exists payment_discount_applications_payment_discount_unique_idx
  on public.payment_discount_applications (payment_id, payment_discount_id);

-- 既有單據：小計由明細加總
update public.payments p
set subtotal_amount = coalesce((
  select sum(pd.amount)
  from public.payment_details pd
  where pd.payment_id = p.id
), 0)
where p.subtotal_amount is null;

-- 既有單據：將 payment_discount_id 遷移至 junction 表
insert into public.payment_discount_applications (payment_id, payment_discount_id, sort_order)
select p.id, p.payment_discount_id, 0
from public.payments p
where p.payment_discount_id is not null
  and not exists (
    select 1
    from public.payment_discount_applications a
    where a.payment_id = p.id
  );

alter table public.payment_discount_applications enable row level security;

drop policy if exists dev_anon_all_payment_discount_applications on public.payment_discount_applications;
drop policy if exists dev_auth_all_payment_discount_applications on public.payment_discount_applications;

create policy dev_anon_all_payment_discount_applications
on public.payment_discount_applications
for all
to anon
using (true)
with check (true);

create policy dev_auth_all_payment_discount_applications
on public.payment_discount_applications
for all
to authenticated
using (true)
with check (true);

grant select, insert, update, delete on table public.payment_discount_applications to anon, authenticated;
