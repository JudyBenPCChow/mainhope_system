-- 讓 students.enrollment_status / status 與 student_class_enrollments 自動同步
-- 規則：
-- - 只要有任一筆 status='就讀中' 的 enrollment => enrollment_status='在讀'
-- - 否則 enrollment_status='非在讀'
-- - status 依三態顯示：畢業 > 查詢試堂 > 在讀/非在讀

create or replace function public.recompute_student_enrollment_state(p_student_id uuid)
returns void
language plpgsql
as $$
declare
  v_reg text;
  v_stage text;
  v_has_active boolean;
  v_enroll text;
  v_status text;
begin
  if p_student_id is null then
    return;
  end if;

  select registration_status, academic_stage
    into v_reg, v_stage
  from public.students
  where id = p_student_id;

  if not found then
    return;
  end if;

  select exists(
    select 1
    from public.student_class_enrollments e
    where e.student_id = p_student_id
      and e.status = '就讀中'
  )
  into v_has_active;

  v_enroll := case when v_has_active then '在讀' else '非在讀' end;

  if coalesce(v_stage, '中學中') = '中學畢業' then
    v_status := '畢業';
    v_enroll := '非在讀';
  elsif coalesce(v_reg, '已註冊') = '僅查詢' then
    v_status := '查詢試堂';
    v_enroll := '非在讀';
  elsif v_enroll = '在讀' then
    v_status := '在讀';
  else
    v_status := '非在讀';
  end if;

  update public.students
  set enrollment_status = v_enroll,
      status = v_status,
      updated_at = now()
  where id = p_student_id;
end;
$$;

create or replace function public.trg_recompute_student_enrollment_state()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recompute_student_enrollment_state(old.student_id);
  elsif tg_op = 'UPDATE' then
    if old.student_id is distinct from new.student_id then
      perform public.recompute_student_enrollment_state(old.student_id);
    end if;
    perform public.recompute_student_enrollment_state(new.student_id);
  else
    perform public.recompute_student_enrollment_state(new.student_id);
  end if;
  return null;
end;
$$;

drop trigger if exists student_class_enrollments_recompute_student_state on public.student_class_enrollments;

create trigger student_class_enrollments_recompute_student_state
after insert or update or delete on public.student_class_enrollments
for each row
execute function public.trg_recompute_student_enrollment_state();

-- 一次性回填現有資料
do $$
declare
  r record;
begin
  for r in select id from public.students loop
    perform public.recompute_student_enrollment_state(r.id);
  end loop;
end $$;

