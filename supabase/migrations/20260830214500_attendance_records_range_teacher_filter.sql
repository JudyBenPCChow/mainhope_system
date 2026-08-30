-- 老師開出席紀錄／今月：勿對每列呼叫 teacher_can_read_attendance。
-- current_app_role() 已變 plpgsql（session role）；authenticated statement_timeout＝8s。
-- 套用：npm run db:apply -- supabase/migrations/20260830214500_attendance_records_range_teacher_filter.sql

begin;

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
declare
  v_is_staff boolean := public.is_mgmt_staff();
  v_is_teacher boolean := public.is_teacher_role();
  v_teacher_id uuid;
begin
  if p_from_date is null or p_to_date is null then
    raise exception 'DATE_RANGE_REQUIRED';
  end if;
  if p_from_date > p_to_date then
    raise exception 'INVALID_DATE_RANGE';
  end if;
  if not (v_is_staff or v_is_teacher) then
    raise exception 'NOT_AUTHORIZED';
  end if;

  if not v_is_staff then
    v_teacher_id := public.current_teacher_id();
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
      v_is_staff
      or (
        v_teacher_id is not null
        and (
          c.teacher_id = v_teacher_id
          or s.teacher_id = v_teacher_id
          or s.original_teacher_id = v_teacher_id
        )
      )
    )
  order by ad.attendance_date desc, ad.created_at desc;
end;
$$;

revoke all on function public.get_attendance_records_in_range(date, date) from public, anon;
grant execute on function public.get_attendance_records_in_range(date, date) to authenticated;

comment on function public.get_attendance_records_in_range(date, date) is
  '出席紀錄日期範圍列表（瘦 payload；職員全範圍／老師欄位過濾＝teacher_can_read_attendance；角色與 teacher_id 只算一次）';

commit;
