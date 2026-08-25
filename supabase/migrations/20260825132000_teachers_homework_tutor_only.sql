-- 純功輔導師：側欄只保留功輔報更／我的當值（及首頁／收件匣／個人／設定），唔顯示專科項目。
-- 與 homework_tutoring_nav 分開：後者＝有功輔入口；本欄＝收窄成純功輔導航。

alter table public.teachers
  add column if not exists homework_tutor_only boolean not null default false;

comment on column public.teachers.homework_tutor_only is
  'true＝純功輔導師側欄（隱藏專科點名／班別／排程等）；須同時 homework_tutoring_nav=true 先有功輔入口。';

-- 2026-08-25 新建五位純功輔導師（勿用「無專科」自動推斷，以免誤傷 Judy／Phoebe 等）
update public.teachers t
set
  homework_tutor_only = true,
  updated_at = now()
from public.teachers_private p
where p.teacher_id = t.id
  and lower(p.email) in (
    'ken@mainhope.edu.hk',
    'wing@mainhope.edu.hk',
    'annie@mainhope.edu.hk',
    'rain@mainhope.edu.hk',
    'erika@mainhope.edu.hk'
  );
