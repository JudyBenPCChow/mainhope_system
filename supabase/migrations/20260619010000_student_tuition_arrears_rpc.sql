-- 學生列表「追收學費」聚合改由資料庫計算，取代前端把 payment_details / attendance_details 全量下載。
-- 回傳每位學生的：已繳堂數（已收款收據之 payment_details.lesson_count 加總）與
-- 計費出席堂數（點名狀態非缺席/請假；「假」但非「補」者不計）。
-- security invoker：完全沿用呼叫者既有 RLS 可見範圍，語意與原前端查詢一致。

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
      and coalesce(a.status, '') not like '%缺席%'
      and not (coalesce(a.status, '') like '%假%' and coalesce(a.status, '') not like '%補%')
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
  '學生列表追收學費聚合：回傳 (student_id, paid_lessons, attended_lessons)。security invoker，沿用呼叫者 RLS。';

revoke all on function public.student_tuition_arrears(uuid[]) from public;
revoke all on function public.student_tuition_arrears(uuid[]) from anon;
grant execute on function public.student_tuition_arrears(uuid[]) to authenticated;

-- 聚合所依賴的外鍵/篩選欄位索引（若不存在才建立）
create index if not exists idx_payments_student_id on public.payments (student_id);
create index if not exists idx_payment_details_payment_id on public.payment_details (payment_id);
create index if not exists idx_attendance_details_student_id on public.attendance_details (student_id);

commit;
