-- 學生／家長各自偏好通訊方式、WeChat ID、第一聯絡人
-- 可重複執行

alter table public.students
  add column if not exists student_preferred_contact_method text,
  add column if not exists parent_preferred_contact_method text,
  add column if not exists student_wechat_id text,
  add column if not exists parent_wechat_id text,
  add column if not exists primary_contact_person text;

-- 舊單一偏好 → 家長偏好（原欄位在「家長聯絡」區）
update public.students
set parent_preferred_contact_method = preferred_contact_method
where parent_preferred_contact_method is null
  and preferred_contact_method in ('WhatsApp', 'WeChat');

update public.students
set student_preferred_contact_method = null
where student_preferred_contact_method is not null
  and student_preferred_contact_method not in ('WhatsApp', 'WeChat');

update public.students
set parent_preferred_contact_method = null
where parent_preferred_contact_method is not null
  and parent_preferred_contact_method not in ('WhatsApp', 'WeChat');

update public.students
set primary_contact_person = null
where primary_contact_person is not null
  and primary_contact_person not in ('學生', '家長');

alter table public.students drop constraint if exists students_student_preferred_contact_chk;
alter table public.students add constraint students_student_preferred_contact_chk
  check (
    student_preferred_contact_method is null
    or student_preferred_contact_method in ('WhatsApp', 'WeChat')
  );

alter table public.students drop constraint if exists students_parent_preferred_contact_chk;
alter table public.students add constraint students_parent_preferred_contact_chk
  check (
    parent_preferred_contact_method is null
    or parent_preferred_contact_method in ('WhatsApp', 'WeChat')
  );

alter table public.students drop constraint if exists students_primary_contact_person_chk;
alter table public.students add constraint students_primary_contact_person_chk
  check (primary_contact_person is null or primary_contact_person in ('學生', '家長'));

comment on column public.students.student_preferred_contact_method is '學生偏好通訊方式：WhatsApp 或 WeChat';
comment on column public.students.parent_preferred_contact_method is '家長偏好通訊方式：WhatsApp 或 WeChat';
comment on column public.students.student_wechat_id is '學生 WeChat ID（偏好為 WeChat 時使用）';
comment on column public.students.parent_wechat_id is '家長 WeChat ID（偏好為 WeChat 時使用）';
comment on column public.students.primary_contact_person is '第一聯絡人：學生 或 家長';
comment on column public.students.preferred_contact_method is '（舊）單一偏好通訊方式；新資料請用 parent／student_preferred_contact_method';
