-- 班別列表：勿對每班拉齊全部 schedules 列（authenticated statement_timeout＝8s）。
-- RLS 逐列 has_capability／is_mgmt_staff 會令 80 班 × 全年堂次 timeout。
-- 套用：npm run db:apply -- supabase/migrations/20260901214000_class_schedule_summaries_rpc.sql

begin;

create or replace function public.get_class_schedule_summaries(p_class_ids uuid[])
returns table (
  class_id uuid,
  has_active boolean,
  first_date date,
  last_date date
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_is_staff boolean := public.is_mgmt_staff();
  v_is_teacher boolean := public.is_teacher_role();
  v_teacher_id uuid;
begin
  if p_class_ids is null or cardinality(p_class_ids) = 0 then
    return;
  end if;
  if not (v_is_staff or v_is_teacher) then
    raise exception 'NOT_AUTHORIZED';
  end if;
  if not v_is_staff then
    v_teacher_id := public.current_teacher_id();
  end if;

  return query
  select
    s.class_id,
    bool_or(position('取消' in coalesce(s.status, '')) = 0) as has_active,
    min(s.scheduled_date) filter (where position('取消' in coalesce(s.status, '')) = 0) as first_date,
    max(s.scheduled_date) filter (where position('取消' in coalesce(s.status, '')) = 0) as last_date
  from public.schedules s
  where s.class_id = any(p_class_ids)
    and (
      v_is_staff
      or (
        v_teacher_id is not null
        and (
          s.teacher_id = v_teacher_id
          or s.original_teacher_id = v_teacher_id
          or exists (
            select 1
            from public.classes c
            where c.id = s.class_id
              and c.teacher_id = v_teacher_id
          )
        )
      )
    )
  group by s.class_id;
end;
$$;

revoke all on function public.get_class_schedule_summaries(uuid[]) from public, anon;
grant execute on function public.get_class_schedule_summaries(uuid[]) to authenticated;

comment on function public.get_class_schedule_summaries(uuid[]) is
  '班別列表排程摘要（每班一列：是否有未取消堂、首尾日期）。職員全範圍／老師僅自己班；角色只算一次。';

commit;
