-- 學生四維業務分類：
-- 1) registration_status: 已註冊 / 非注冊（試堂／查詢）
-- 2) enrollment_status: 在讀 / 非在讀（本學年有無就讀中報讀，自動計算）
-- 3) activity_status: 活躍生 / 非活躍生（過去三個月有無報讀，含跨學年，自動計算）
-- 4) academic_stage: 中學階段 / 已畢業

-- 與 src/lib/courseCode.ts academicYearLabelFromStartDate 一致
create or replace function public.academic_year_label_from_date(p_date date default current_date)
returns text
language plpgsql
immutable
as $$
declare
  v_year int := extract(year from p_date)::int;
  v_month int := extract(month from p_date)::int;
  v_yy text;
begin
  if v_month in (7, 8) then
    v_yy := lpad((v_year % 100)::text, 2, '0');
    return v_yy || 'SM';
  elsif v_month >= 9 then
    v_yy := lpad((v_year % 100)::text, 2, '0');
    return v_yy || lpad(((v_year + 1) % 100)::text, 2, '0');
  else
    v_yy := lpad(((v_year - 1) % 100)::text, 2, '0');
    return v_yy || lpad((v_year % 100)::text, 2, '0');
  end if;
end;
$$;

comment on function public.academic_year_label_from_date(date) is
  '由日期推算學年 label（7–8 月 → YYSM；9 月–翌年 6 月 → YYZZ）';

alter table public.students
add column if not exists activity_status text;

-- 先移除舊約束，再遷移列舉值（否則 中學中→中學階段、僅查詢→非注冊 會觸發舊 CHECK）
alter table public.students
drop constraint if exists students_registration_status_check,
drop constraint if exists students_enrollment_status_check,
drop constraint if exists students_academic_stage_check,
drop constraint if exists students_state_consistency_check,
drop constraint if exists students_state_cross_rules_check,
drop constraint if exists students_activity_status_check;

-- 舊值遷移
update public.students
set registration_status = '非注冊'
where registration_status = '僅查詢';

update public.students
set academic_stage = '中學階段'
where academic_stage = '中學中';

update public.students
set academic_stage = '已畢業'
where academic_stage = '中學畢業';

update public.students
set activity_status = '非活躍生'
where activity_status is null;

alter table public.students
alter column activity_status set default '非活躍生';

update public.students
set activity_status = coalesce(activity_status, '非活躍生')
where activity_status is null;

alter table public.students
alter column activity_status set not null;

alter table public.students
add constraint students_registration_status_check
check (registration_status in ('已註冊', '非注冊')),
add constraint students_enrollment_status_check
check (enrollment_status in ('在讀', '非在讀')),
add constraint students_activity_status_check
check (activity_status in ('活躍生', '非活躍生')),
add constraint students_academic_stage_check
check (academic_stage in ('中學階段', '已畢業')),
add constraint students_state_consistency_check
check (
  registration_status = '已註冊'
  or enrollment_status = '非在讀'
);

alter table public.students
alter column registration_status set default '已註冊',
alter column enrollment_status set default '非在讀',
alter column academic_stage set default '中學階段';

create or replace function public.recompute_student_enrollment_state(p_student_id uuid)
returns void
language plpgsql
as $$
declare
  v_reg text;
  v_stage text;
  v_current_year text;
  v_has_current_year_enrollment boolean;
  v_has_recent_enrollment boolean;
  v_enroll text;
  v_activity text;
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

  v_current_year := public.academic_year_label_from_date(current_date);

  select exists(
    select 1
    from public.student_class_enrollments e
    join public.classes c on c.id = e.class_id
    left join public.academic_years ay on ay.id = c.academic_year_id
    where e.student_id = p_student_id
      and e.status = '就讀中'
      and coalesce(
        ay.label,
        public.academic_year_label_from_date(c.start_date)
      ) = v_current_year
  )
  into v_has_current_year_enrollment;

  select exists(
    select 1
    from public.student_class_enrollments e
    where e.student_id = p_student_id
      and coalesce(e.enroll_date, (e.created_at at time zone 'Asia/Hong_Kong')::date)
        >= (current_date - interval '3 months')::date
  )
  into v_has_recent_enrollment;

  v_enroll := case when v_has_current_year_enrollment then '在讀' else '非在讀' end;
  v_activity := case when v_has_recent_enrollment then '活躍生' else '非活躍生' end;

  if coalesce(v_stage, '中學階段') = '已畢業' then
    v_status := '已畢業';
  elsif coalesce(v_reg, '已註冊') = '非注冊' then
    v_status := '非注冊';
  elsif v_enroll = '在讀' then
    v_status := '在讀';
  else
    v_status := '非在讀';
  end if;

  if coalesce(v_reg, '已註冊') = '非注冊' then
    v_enroll := '非在讀';
  end if;

  update public.students
  set enrollment_status = v_enroll,
      activity_status = v_activity,
      status = v_status,
      updated_at = now()
  where id = p_student_id;
end;
$$;

comment on function public.recompute_student_enrollment_state(uuid) is
  '依報讀紀錄重算 enrollment_status（本學年就讀中）、activity_status（近三個月報讀）與 legacy status';

-- 一次性回填
do $$
declare
  r record;
begin
  for r in select id from public.students loop
    perform public.recompute_student_enrollment_state(r.id);
  end loop;
end $$;

create or replace function public.trg_recompute_student_state_from_student_row()
returns trigger
language plpgsql
as $$
begin
  perform public.recompute_student_enrollment_state(new.id);
  return new;
end;
$$;

drop trigger if exists students_recompute_state_on_manual_fields on public.students;

create trigger students_recompute_state_on_manual_fields
after update of registration_status, academic_stage on public.students
for each row
when (
  old.registration_status is distinct from new.registration_status
  or old.academic_stage is distinct from new.academic_stage
)
execute function public.trg_recompute_student_state_from_student_row();
