-- 計費出席（已上堂數）改嚴格白名單，對齊 src/lib/attendanceBilling.ts
-- 扣堂：現場／錄影回放／即時直播／no show／不用補回＋舊相容出席／網課／補課／線上
-- 不扣：事假／病假／請假／缺席／空字串等
-- 歷史「缺席」不遷移。

begin;

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
    where p.status = '已收款'
      and p.student_id = any (p_student_ids)
      and pd.lesson_count > 0
    group by p.student_id
  ),
  attended as (
    select a.student_id, count(*)::bigint as attended_lessons
    from public.attendance_details a
    where a.student_id = any (p_student_ids)
      and (
        coalesce(a.status, '') in (
          '現場', '錄影回放', '即時直播', 'no show', '不用補回',
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
  '學生列表追收學費：已繳堂數與計費出席（嚴格白名單狀態）。security invoker。';

commit;
