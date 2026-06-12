-- 聯合收費批次 + 推薦回贈紀錄

create table if not exists public.payment_batches (
  id uuid primary key default gen_random_uuid(),
  payment_date date not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.payments
  add column if not exists payment_batch_id uuid references public.payment_batches (id) on delete set null;

create index if not exists payments_payment_batch_id_idx
  on public.payments (payment_batch_id)
  where payment_batch_id is not null;

create table if not exists public.referral_records (
  id uuid primary key default gen_random_uuid(),
  referrer_student_id uuid not null references public.students (id) on delete restrict,
  referee_student_id uuid not null references public.students (id) on delete restrict,
  payment_id uuid not null references public.payments (id) on delete cascade,
  referee_discount_amount numeric not null default 100,
  referrer_rebate_amount numeric not null default 100,
  rebate_status text not null default 'pending',
  rebate_paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint referral_records_rebate_status_check
    check (rebate_status in ('pending', 'paid', 'cancelled')),
  constraint referral_records_distinct_students check (referrer_student_id <> referee_student_id)
);

create index if not exists referral_records_referrer_idx on public.referral_records (referrer_student_id);
create index if not exists referral_records_payment_idx on public.referral_records (payment_id);
create unique index if not exists referral_records_payment_unique_idx on public.referral_records (payment_id);

alter table public.payment_batches enable row level security;
alter table public.referral_records enable row level security;

drop policy if exists dev_anon_all_payment_batches on public.payment_batches;
drop policy if exists dev_auth_all_payment_batches on public.payment_batches;
create policy dev_anon_all_payment_batches on public.payment_batches for all to anon using (true) with check (true);
create policy dev_auth_all_payment_batches on public.payment_batches for all to authenticated using (true) with check (true);
grant select, insert, update, delete on table public.payment_batches to anon, authenticated;

drop policy if exists dev_anon_all_referral_records on public.referral_records;
drop policy if exists dev_auth_all_referral_records on public.referral_records;
create policy dev_anon_all_referral_records on public.referral_records for all to anon using (true) with check (true);
create policy dev_auth_all_referral_records on public.referral_records for all to authenticated using (true) with check (true);
grant select, insert, update, delete on table public.referral_records to anon, authenticated;
