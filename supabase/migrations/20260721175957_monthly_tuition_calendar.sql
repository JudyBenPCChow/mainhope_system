-- 2627 月費與校曆支援：
-- 1) 正式校曆停課日
-- 2) 每班每月應收
-- 3) 已繳後減堂的堂費結餘
-- 4) 指定日期退讀

begin;

create table if not exists public.academic_calendar_closures (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references public.academic_years (id) on delete cascade,
  closure_date date not null,
  name text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint academic_calendar_closures_name_check
    check (char_length(trim(name)) > 0),
  constraint academic_calendar_closures_unique
    unique (academic_year_id, closure_date)
);

create index if not exists academic_calendar_closures_date_idx
  on public.academic_calendar_closures (closure_date);

comment on table public.academic_calendar_closures is
  '學院校曆停課日；批量排程會排除，並用於每月學費堂數計算。';

alter table public.student_class_enrollments
  add column if not exists withdraw_effective_date date;

alter table public.student_class_enrollments
  add column if not exists withdraw_reason text;

create index if not exists student_class_enrollments_withdraw_effective_idx
  on public.student_class_enrollments (withdraw_effective_date)
  where withdraw_effective_date is not null;

comment on column public.student_class_enrollments.withdraw_effective_date is
  '計劃退讀生效日；生效日前仍屬有效報讀，生效日起不再列入名單或月費。';

alter table public.leave_makeup_records
  add column if not exists tuition_disposition text;

alter table public.leave_makeup_records
  drop constraint if exists leave_makeup_records_tuition_disposition_check;

alter table public.leave_makeup_records
  add constraint leave_makeup_records_tuition_disposition_check
  check (
    tuition_disposition is null
    or tuition_disposition in ('減收', '轉結餘', '調堂', '錄影')
  );

comment on column public.leave_makeup_records.tuition_disposition is
  '請假財務處理：付款前減收、付款後轉結餘，或調堂／錄影而不減費。';

create table if not exists public.monthly_tuition_charges (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete restrict,
  enrollment_id uuid references public.student_class_enrollments (id) on delete set null,
  billing_month date not null,
  calendar_lesson_count integer not null default 0,
  leave_deduction_count integer not null default 0,
  chargeable_lesson_count integer not null default 0,
  unit_price numeric not null default 0,
  gross_amount numeric not null default 0,
  credit_applied numeric not null default 0,
  net_amount numeric not null default 0,
  status text not null default '草稿',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint monthly_tuition_charges_month_check
    check (billing_month = date_trunc('month', billing_month)::date),
  constraint monthly_tuition_charges_counts_check
    check (
      calendar_lesson_count >= 0
      and leave_deduction_count >= 0
      and chargeable_lesson_count >= 0
      and chargeable_lesson_count <= calendar_lesson_count
    ),
  constraint monthly_tuition_charges_amounts_check
    check (
      unit_price >= 0
      and gross_amount >= 0
      and credit_applied >= 0
      and net_amount >= 0
      and credit_applied <= gross_amount
    ),
  constraint monthly_tuition_charges_status_check
    check (status in ('草稿', '待繳費', '待收款', '已繳', '已抵扣', '作廢'))
);

create unique index if not exists monthly_tuition_charges_active_unique_idx
  on public.monthly_tuition_charges (student_id, class_id, billing_month)
  where status <> '作廢';

create index if not exists monthly_tuition_charges_student_month_idx
  on public.monthly_tuition_charges (student_id, billing_month);

create index if not exists monthly_tuition_charges_status_month_idx
  on public.monthly_tuition_charges (status, billing_month);

comment on table public.monthly_tuition_charges is
  '每班每月學費應收；應收與實際 payments 分開，支援預繳及防止同班同月重複收款。';

alter table public.payment_details
  add column if not exists monthly_tuition_charge_id uuid
    references public.monthly_tuition_charges (id) on delete set null;

create unique index if not exists payment_details_monthly_tuition_charge_unique_idx
  on public.payment_details (monthly_tuition_charge_id)
  where monthly_tuition_charge_id is not null;

create table if not exists public.tuition_credit_entries (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  class_id uuid references public.classes (id) on delete set null,
  source_leave_id uuid references public.leave_makeup_records (id) on delete set null,
  source_charge_id uuid references public.monthly_tuition_charges (id) on delete set null,
  applied_charge_id uuid references public.monthly_tuition_charges (id) on delete set null,
  lesson_count integer not null default 1,
  amount numeric not null,
  status text not null default '可用',
  notes text,
  created_at timestamptz not null default now(),
  applied_at timestamptz,
  constraint tuition_credit_entries_lesson_count_check check (lesson_count > 0),
  constraint tuition_credit_entries_amount_check check (amount > 0),
  constraint tuition_credit_entries_status_check
    check (status in ('可用', '已抵扣', '作廢')),
  constraint tuition_credit_entries_applied_check
    check (
      (status = '已抵扣' and applied_charge_id is not null and applied_at is not null)
      or (status <> '已抵扣')
    )
);

create unique index if not exists tuition_credit_entries_source_leave_unique_idx
  on public.tuition_credit_entries (source_leave_id)
  where source_leave_id is not null and status <> '作廢';

create index if not exists tuition_credit_entries_student_status_idx
  on public.tuition_credit_entries (student_id, status);

comment on table public.tuition_credit_entries is
  '學生已付款後請假所產生的堂費結餘；下次月費可抵扣並保留來源。';

alter table public.academic_calendar_closures enable row level security;
alter table public.monthly_tuition_charges enable row level security;
alter table public.tuition_credit_entries enable row level security;

drop policy if exists monthly_tuition_calendar_mgmt_closures on public.academic_calendar_closures;
create policy monthly_tuition_calendar_mgmt_closures
on public.academic_calendar_closures
for all
to authenticated
using (public.is_mgmt_staff())
with check (public.is_mgmt_staff());

drop policy if exists monthly_tuition_calendar_mgmt_charges on public.monthly_tuition_charges;
create policy monthly_tuition_calendar_mgmt_charges
on public.monthly_tuition_charges
for all
to authenticated
using (public.is_mgmt_staff())
with check (public.is_mgmt_staff());

drop policy if exists monthly_tuition_calendar_mgmt_credits on public.tuition_credit_entries;
create policy monthly_tuition_calendar_mgmt_credits
on public.tuition_credit_entries
for all
to authenticated
using (public.is_mgmt_staff())
with check (public.is_mgmt_staff());

grant select, insert, update, delete
  on public.academic_calendar_closures,
     public.monthly_tuition_charges,
     public.tuition_credit_entries
  to authenticated;

create or replace function public.get_enrollment_effective_dates(p_enrollment_ids uuid[])
returns table (
  enrollment_id uuid,
  enroll_date date,
  withdraw_effective_date date
)
language sql
stable
security definer
set search_path = ''
as $$
  select e.id, e.enroll_date, e.withdraw_effective_date
  from public.student_class_enrollments e
  where e.id = any(coalesce(p_enrollment_ids, array[]::uuid[]))
    and cardinality(coalesce(p_enrollment_ids, array[]::uuid[])) <= 500
    and exists (
      select 1
      from public.schedules s
      where s.class_id = e.class_id
        and public.teacher_can_access_schedule(s.id)
    );
$$;

revoke all on function public.get_enrollment_effective_dates(uuid[]) from public;
revoke all on function public.get_enrollment_effective_dates(uuid[]) from anon;
grant execute on function public.get_enrollment_effective_dates(uuid[]) to authenticated;

comment on function public.get_enrollment_effective_dates(uuid[]) is
  '點名名單日期過濾所需的最小報讀日期資料；只回傳呼叫者可存取排程所屬班別。';

commit;
