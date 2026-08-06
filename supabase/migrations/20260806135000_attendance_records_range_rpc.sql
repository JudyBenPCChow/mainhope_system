-- 出席紀錄列表：日期索引 + 專用瘦 RPC（唔經深 embed／roster）
-- 套用：npm run db:apply -- supabase/migrations/20260806135000_attendance_records_range_rpc.sql
--
-- 授權：職員 is_mgmt_staff()；老師 teacher_can_read_attendance（與 SELECT 政策對齊）
-- 回傳白名單：列表標籤所需欄位 only（禁止 enrollments／leaves／trials 等名冊負載）

begin;

create index if not exists attendance_details_attendance_date_idx
  on public.attendance_details (attendance_date);

create or replace function public.get_attendance_records_in_range(
  p_from_date date,
  p_to_date date
)
returns table (
  id uuid,
  student_id uuid,
  class_id uuid,
  schedule_id uuid,
  attendance_date date,
  status text,
  remarks text,
  updated_at timestamptz,
  full_name text,
  english_name text,
  grade text,
  subject text,
  course_code_full text,
  course_name text,
  teacher_id uuid,
  teacher_name text,
  original_teacher_id uuid,
  original_teacher_name text,
  class_teacher_id uuid
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_from_date is null or p_to_date is null then
    raise exception 'DATE_RANGE_REQUIRED';
  end if;
  if p_from_date > p_to_date then
    raise exception 'INVALID_DATE_RANGE';
  end if;
  if not (public.is_mgmt_staff() or public.is_teacher_role()) then
    raise exception 'NOT_AUTHORIZED';
  end if;

  return query
  select
    ad.id,
    ad.student_id,
    ad.class_id,
    ad.schedule_id,
    ad.attendance_date,
    ad.status,
    ad.remarks,
    ad.updated_at,
    st.full_name,
    st.english_name,
    st.grade,
    c.subject,
    c.course_code_full,
    co.course_name,
    coalesce(s.teacher_id, c.teacher_id) as teacher_id,
    coalesce(tt.full_name, ct.full_name) as teacher_name,
    s.original_teacher_id,
    ot.full_name as original_teacher_name,
    c.teacher_id as class_teacher_id
  from public.attendance_details ad
  left join public.students st on st.id = ad.student_id
  left join public.classes c on c.id = ad.class_id
  left join public.courses co on co.id = c.course_id
  left join public.teachers ct on ct.id = c.teacher_id
  left join public.schedules s on s.id = ad.schedule_id
  left join public.teachers tt on tt.id = s.teacher_id
  left join public.teachers ot on ot.id = s.original_teacher_id
  where ad.attendance_date >= p_from_date
    and ad.attendance_date <= p_to_date
    and (
      public.is_mgmt_staff()
      or (
        public.is_teacher_role()
        and public.teacher_can_read_attendance(ad.class_id, ad.schedule_id)
      )
    )
  order by ad.attendance_date desc, ad.created_at desc;
end;
$$;

revoke all on function public.get_attendance_records_in_range(date, date) from public, anon;
grant execute on function public.get_attendance_records_in_range(date, date) to authenticated;

comment on function public.get_attendance_records_in_range(date, date) is
  '出席紀錄日期範圍列表（瘦 payload；職員全範圍／老師 teacher_can_read_attendance；security definer 補代堂可見姓名／班標）';

commit;
