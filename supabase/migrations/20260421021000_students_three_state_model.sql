-- 學生三維狀態模型：
-- 1) registration_status: 已註冊 / 僅查詢
-- 2) enrollment_status: 在讀 / 非在讀
-- 3) academic_stage: 中學中 / 中學畢業

alter table public.students
add column if not exists registration_status text,
add column if not exists enrollment_status text,
add column if not exists academic_stage text;

-- 先依舊欄位回填（grade=NA 視為中學畢業）
update public.students
set
  registration_status = case
    when coalesce(trim(status), '') ~ '查詢|試堂' then '僅查詢'
    else '已註冊'
  end,
  enrollment_status = case
    when upper(trim(coalesce(grade, ''))) = 'NA' then '非在讀'
    when coalesce(trim(status), '') ~ '在讀|就讀' and coalesce(trim(status), '') !~ '非在讀|休學|退學|退選|離校' then '在讀'
    else '非在讀'
  end,
  academic_stage = case
    when upper(trim(coalesce(grade, ''))) = 'NA' then '中學畢業'
    when coalesce(trim(status), '') ~ '畢業' then '中學畢業'
    else '中學中'
  end
where registration_status is null
   or enrollment_status is null
   or academic_stage is null;

-- 補齊 default/not null
alter table public.students
alter column registration_status set default '已註冊',
alter column enrollment_status set default '非在讀',
alter column academic_stage set default '中學中';

update public.students
set registration_status = coalesce(registration_status, '已註冊'),
    enrollment_status = coalesce(enrollment_status, '非在讀'),
    academic_stage = coalesce(academic_stage, '中學中')
where registration_status is null
   or enrollment_status is null
   or academic_stage is null;

alter table public.students
alter column registration_status set not null,
alter column enrollment_status set not null,
alter column academic_stage set not null;

-- 規則約束
alter table public.students
drop constraint if exists students_registration_status_check,
drop constraint if exists students_enrollment_status_check,
drop constraint if exists students_academic_stage_check,
drop constraint if exists students_state_consistency_check;

alter table public.students
add constraint students_registration_status_check
check (registration_status in ('已註冊', '僅查詢')),
add constraint students_enrollment_status_check
check (enrollment_status in ('在讀', '非在讀')),
add constraint students_academic_stage_check
check (academic_stage in ('中學中', '中學畢業')),
add constraint students_state_consistency_check
check (
  (registration_status = '僅查詢' and enrollment_status = '非在讀')
  or registration_status = '已註冊'
)
;

-- 中學畢業必須非在讀；在讀必須為已註冊且中學中
alter table public.students
drop constraint if exists students_state_cross_rules_check;

alter table public.students
add constraint students_state_cross_rules_check
check (
  (academic_stage <> '中學畢業' or enrollment_status = '非在讀')
  and (enrollment_status <> '在讀' or (registration_status = '已註冊' and academic_stage = '中學中'))
);
