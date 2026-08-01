-- 逾期學費罰款：獨立表 + 按班池 RPC（2026-10-01 覆蓋公式）
-- 罰款唔入 payment_details；已繳池只計學費堂數。

begin;

create table if not exists public.payment_late_fee_items (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments (id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete restrict,
  amount numeric not null default 50 check (amount >= 0),
  billing_month text not null,
  waived boolean not null default false,
  waiver_reason text,
  created_at timestamptz not null default now(),
  constraint payment_late_fee_items_billing_month_chk
    check (billing_month ~ '^\d{4}-\d{2}$'),
  constraint payment_late_fee_items_waiver_chk
    check (
      (waived = false and waiver_reason is null)
      or (waived = true and length(trim(waiver_reason)) > 0)
    )
);

create index if not exists payment_late_fee_items_payment_id_idx
  on public.payment_late_fee_items (payment_id);

create index if not exists payment_late_fee_items_class_month_idx
  on public.payment_late_fee_items (class_id, billing_month);

comment on table public.payment_late_fee_items is
  '收款單逾期學費罰款列（獨立於 payment_details）；waived=true 仍保留供統計；billing_month=YYYY-MM（today 曆月）。';

alter table public.payment_late_fee_items enable row level security;

drop policy if exists rls_phase_b_mgmt_select_payment_late_fee_items on public.payment_late_fee_items;
drop policy if exists rls_phase_b_mgmt_insert_payment_late_fee_items on public.payment_late_fee_items;
drop policy if exists rls_phase_b_mgmt_update_payment_late_fee_items on public.payment_late_fee_items;

create policy rls_phase_b_mgmt_select_payment_late_fee_items
  on public.payment_late_fee_items
  for select
  to authenticated
  using (public.is_mgmt_staff());

create policy rls_phase_b_mgmt_insert_payment_late_fee_items
  on public.payment_late_fee_items
  for insert
  to authenticated
  with check (public.is_mgmt_staff());

create policy rls_phase_b_mgmt_update_payment_late_fee_items
  on public.payment_late_fee_items
  for update
  to authenticated
  using (public.is_mgmt_staff())
  with check (public.is_mgmt_staff());

-- 單生：每班已繳／cutoff 前後已扣／是否應罰／本月是否已處理
create or replace function public.student_class_late_fee_pools(
  p_student_id uuid,
  p_billing_month text default to_char((timezone('Asia/Hong_Kong', now()))::date, 'YYYY-MM'),
  p_cutoff date default '2026-10-01'::date
)
returns table (
  class_id uuid,
  course_mode text,
  class_kind text,
  paid_lessons numeric,
  billable_before bigint,
  billable_after bigint,
  covered_for_new numeric,
  trigger_late_fee boolean,
  already_handled_month boolean
)
language sql
stable
security invoker
set search_path = public
as $$
  with paid as (
    select
      pd.class_id,
      coalesce(sum(pd.lesson_count), 0)::numeric as paid_lessons
    from public.payments p
    join public.payment_details pd on pd.payment_id = p.id
    where p.student_id = p_student_id
      and p.status = '已收款'
      and pd.class_id is not null
      and pd.lesson_count is not null
      and pd.lesson_count > 0
    group by pd.class_id
  ),
  billable as (
    select
      a.class_id,
      count(*) filter (where a.attendance_date < p_cutoff)::bigint as billable_before,
      count(*) filter (where a.attendance_date >= p_cutoff)::bigint as billable_after
    from public.attendance_details a
    where a.student_id = p_student_id
      and (
        coalesce(a.status, '') in (
          '現場', '錄影回放', 'zoom實時網課', 'no show', '請假而不需補回',
          '即時直播', '不用補回',
          '出席', '網課', '補課', '線上'
        )
        or (
          coalesce(a.status, '') like '%網課%'
          and coalesce(a.status, '') not like '%缺席%'
          and coalesce(a.status, '') not like '%請假%'
        )
        or (
          coalesce(a.status, '') like '%線上%'
          and coalesce(a.status, '') not like '%缺席%'
          and coalesce(a.status, '') not like '%假%'
        )
      )
      and not exists (
        select 1
        from public.trial_sessions ts
        where ts.student_id = a.student_id
          and ts.class_id = a.class_id
          and (
            (a.schedule_id is not null and ts.schedule_id = a.schedule_id)
            or ts.trial_date = a.attendance_date
          )
      )
    group by a.class_id
  ),
  handled as (
    select distinct lf.class_id
    from public.payment_late_fee_items lf
    join public.payments p on p.id = lf.payment_id
    where p.student_id = p_student_id
      and p.status is distinct from '作廢'
      and lf.billing_month = p_billing_month
  ),
  class_ids as (
    select class_id from paid
    union
    select class_id from billable
    union
    select class_id from handled
  )
  select
    c.id as class_id,
    coalesce(co.course_mode, 'regular')::text as course_mode,
    coalesce(c.class_kind, 'group')::text as class_kind,
    coalesce(paid.paid_lessons, 0)::numeric as paid_lessons,
    coalesce(billable.billable_before, 0)::bigint as billable_before,
    coalesce(billable.billable_after, 0)::bigint as billable_after,
    greatest(0, coalesce(paid.paid_lessons, 0) - coalesce(billable.billable_before, 0))::numeric
      as covered_for_new,
    (
      coalesce(billable.billable_after, 0)
      > greatest(0, coalesce(paid.paid_lessons, 0) - coalesce(billable.billable_before, 0))
    ) as trigger_late_fee,
    (handled.class_id is not null) as already_handled_month
  from class_ids ids
  join public.classes c on c.id = ids.class_id
  left join public.courses co on co.id = c.course_id
  left join paid on paid.class_id = c.id
  left join billable on billable.class_id = c.id
  left join handled on handled.class_id = c.id;
$$;

comment on function public.student_class_late_fee_pools(uuid, text, date) is
  '逾期罰款按班池：paid／cutoff 前後 billable（排除試堂出席）、trigger、本月已處理（非作廢）。security invoker。';

revoke all on function public.student_class_late_fee_pools(uuid, text, date) from public;
revoke all on function public.student_class_late_fee_pools(uuid, text, date) from anon;
grant execute on function public.student_class_late_fee_pools(uuid, text, date) to authenticated;

commit;
