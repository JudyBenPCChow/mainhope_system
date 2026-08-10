-- 主波：支付→權益池
-- 見 docs/backlog/summer-enrollment-roster-consistency.md §4／§5.2
-- 1) 容許負池 2) top_up／clawback 事件＋payment_detail 冪等鍵

-- ---------------------------------------------------------------------------
-- 容許 remaining 為負（欠費／短暫作廢重開）
-- ---------------------------------------------------------------------------
alter table public.student_entitlement_pools
  drop constraint if exists student_entitlement_pools_remaining_lessons_check;

comment on column public.student_entitlement_pools.remaining_lessons is
  '營運剩餘堂次（可負）；不等於已認列收入。負＝已上超過已繳／短暫作廢重開。';

-- ---------------------------------------------------------------------------
-- 擴充 entitlement_consumption_events：支付抬池／收回
-- ---------------------------------------------------------------------------
alter table public.entitlement_consumption_events
  add column if not exists payment_detail_id uuid
    references public.payment_details (id) on delete set null;

alter table public.entitlement_consumption_events
  drop constraint if exists entitlement_consumption_events_reason_check;

alter table public.entitlement_consumption_events
  add constraint entitlement_consumption_events_reason_check
  check (reason in (
    'entitlement_consumed',
    'entitlement_reinstated',
    'entitlement_top_up',
    'entitlement_clawback'
  ));

create unique index if not exists entitlement_events_payment_detail_reason_uidx
  on public.entitlement_consumption_events (payment_detail_id, reason)
  where payment_detail_id is not null
    and reason in ('entitlement_top_up', 'entitlement_clawback');

create index if not exists entitlement_consumption_events_payment_detail_id_idx
  on public.entitlement_consumption_events (payment_detail_id);

comment on column public.entitlement_consumption_events.payment_detail_id is
  '學費明細抬池／收回嘅冪等鍵；點名消耗事件為 null。';
