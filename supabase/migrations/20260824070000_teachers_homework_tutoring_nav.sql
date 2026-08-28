-- 管理層剔選專科老師後，其側欄顯示功課輔導班。預設全體無入口。

alter table public.teachers
  add column if not exists homework_tutoring_nav boolean not null default false;

comment on column public.teachers.homework_tutoring_nav is
  '功課輔導班側欄入口：true＝該專科老師登入後側欄出現功課輔導班';
