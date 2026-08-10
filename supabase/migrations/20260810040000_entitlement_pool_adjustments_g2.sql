-- G2：權益池調動稽核表＋作廢第二人確認欄
-- 見 docs/backlog/payment-entitlement-correction-ui.md

-- ---------------------------------------------------------------------------
-- entitlement_pool_adjustments（人工增刪／搬堂原因表）
-- ---------------------------------------------------------------------------
create table if not exists public.entitlement_pool_adjustments (
  id uuid primary key default gen_random_uuid(),
  adjustment_batch_id uuid not null default gen_random_uuid(),
  pool_id uuid not null references public.student_entitlement_pools (id) on delete restrict,
  student_id uuid not null references public.students (id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete cascade,
  delta_lessons numeric(8, 2) not null
    check (delta_lessons <> 0),
  reason_code text not null
    check (reason_code in (
      'g2a_lesson_count_fix',
      'g2b_wrong_class_move',
      'g2c_transfer_friend',
      'transfer_subject',
      'manual_other'
    )),
  notes text not null,
  related_pool_id uuid references public.student_entitlement_pools (id) on delete set null,
  related_payment_id uuid references public.payments (id) on delete set null,
  before_remaining numeric(8, 2) not null,
  after_remaining numeric(8, 2) not null,
  created_by_email text,
  created_by_name text,
  created_at timestamptz not null default now()
);

create index if not exists entitlement_pool_adjustments_student_id_idx
  on public.entitlement_pool_adjustments (student_id);

create index if not exists entitlement_pool_adjustments_pool_id_idx
  on public.entitlement_pool_adjustments (pool_id);

create index if not exists entitlement_pool_adjustments_created_at_idx
  on public.entitlement_pool_adjustments (created_at desc);

create index if not exists entitlement_pool_adjustments_batch_idx
  on public.entitlement_pool_adjustments (adjustment_batch_id);

comment on table public.entitlement_pool_adjustments is
  '人工權益池調動稽核（G2a／G2b／轉科／送親友）。唔係會計認列。';

alter table public.entitlement_pool_adjustments enable row level security;

drop policy if exists rls_mgmt_all_entitlement_pool_adjustments on public.entitlement_pool_adjustments;
create policy rls_mgmt_all_entitlement_pool_adjustments
on public.entitlement_pool_adjustments
for all
to authenticated
using (public.is_mgmt_staff())
with check (public.is_mgmt_staff());

-- ---------------------------------------------------------------------------
-- 作廢第二人確認（>30 分鐘）
-- ---------------------------------------------------------------------------
alter table public.payments
  add column if not exists void_second_confirmer_email text;

alter table public.payments
  add column if not exists void_second_confirmer_name text;

comment on column public.payments.void_second_confirmer_email is
  '開單超過 30 分鐘作廢時，第二確認人（manager／alien）電郵。';
