-- 功輔月費：payment_details 記覆蓋起始月；已繳堂數聚合排除功輔月數。

begin;

alter table public.payment_details
  add column if not exists coverage_start_month date;

comment on column public.payment_details.coverage_start_month is
  '功輔月費覆蓋起始月（該月1日）；lesson_count＝月數。專科／試堂為 null。';

create index if not exists payment_details_coverage_start_month_idx
  on public.payment_details (class_id, coverage_start_month)
  where coverage_start_month is not null;

-- 既有功輔月費行：以收款日所屬月為覆蓋起始（當時表單用收款日當月）
update public.payment_details pd
set coverage_start_month = date_trunc('month', p.payment_date)::date
from public.payments p
where pd.payment_id = p.id
  and pd.coverage_start_month is null
  and coalesce(pd.description, '') ~ '月費';

create or replace function public.student_tuition_arrears(p_student_ids uuid[])
returns table (
  student_id uuid,
  paid_lessons numeric,
  attended_lessons bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  with ids as (
    select distinct unnest(coalesce(p_student_ids, array[]::uuid[])) as student_id
  ),
  paid as (
    select p.student_id, coalesce(sum(pd.lesson_count), 0)::numeric as paid_lessons
    from public.payments p
    join public.payment_details pd on pd.payment_id = p.id
    left join public.classes c on c.id = pd.class_id
    where p.status = '已收款'
      and p.student_id = any (p_student_ids)
      and pd.lesson_count > 0
      and pd.coverage_start_month is null
      and coalesce(c.class_kind, '') is distinct from 'homework'
      and coalesce(pd.description, '') !~ '月費'
    group by p.student_id
  ),
  attended as (
    select a.student_id, count(*)::bigint as attended_lessons
    from public.attendance_details a
    where a.student_id = any (p_student_ids)
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
    group by a.student_id
  )
  select
    i.student_id,
    coalesce(paid.paid_lessons, 0)::numeric as paid_lessons,
    coalesce(attended.attended_lessons, 0)::bigint as attended_lessons
  from ids i
  left join paid on paid.student_id = i.student_id
  left join attended on attended.student_id = i.student_id;
$$;

comment on function public.student_tuition_arrears(uuid[]) is
  '學生列表追收學費：已繳堂數（排除功輔月費）與計費出席（嚴格白名單狀態）。security invoker。';

commit;
