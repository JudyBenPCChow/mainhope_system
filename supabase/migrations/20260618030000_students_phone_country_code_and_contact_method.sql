-- 學生／家長電話新增區號欄位，並新增偏好通訊方式欄位
-- 區號選項：+852（香港）或 +86（中國大陸）；偏好通訊方式：WhatsApp 或 WeChat
-- 全部使用純單句 SQL（不含 CASE / DO 區塊），可重複執行

alter table public.students
  add column if not exists student_phone_country_code text default '+852',
  add column if not exists parent_phone_country_code text default '+852',
  add column if not exists preferred_contact_method text;

-- 正規化既有區號：數字為 86 → +86，其餘（含 NULL、852、空白）→ +852
update public.students set student_phone_country_code = '+86'
where regexp_replace(coalesce(student_phone_country_code, ''), '\D', '', 'g') = '86';

update public.students set student_phone_country_code = '+852'
where student_phone_country_code is null or student_phone_country_code <> '+86';

update public.students set parent_phone_country_code = '+86'
where regexp_replace(coalesce(parent_phone_country_code, ''), '\D', '', 'g') = '86';

update public.students set parent_phone_country_code = '+852'
where parent_phone_country_code is null or parent_phone_country_code <> '+86';

-- 正規化既有偏好通訊方式：非合法值一律設為 NULL
update public.students set preferred_contact_method = null
where preferred_contact_method is not null
  and preferred_contact_method not in ('WhatsApp', 'WeChat');

-- 以 check constraint 限制為固定選項（允許 NULL）；先 drop 再 add 以利重複執行
alter table public.students drop constraint if exists students_student_phone_cc_chk;
alter table public.students add constraint students_student_phone_cc_chk
  check (student_phone_country_code is null or student_phone_country_code in ('+852', '+86'));

alter table public.students drop constraint if exists students_parent_phone_cc_chk;
alter table public.students add constraint students_parent_phone_cc_chk
  check (parent_phone_country_code is null or parent_phone_country_code in ('+852', '+86'));

alter table public.students drop constraint if exists students_preferred_contact_chk;
alter table public.students add constraint students_preferred_contact_chk
  check (preferred_contact_method is null or preferred_contact_method in ('WhatsApp', 'WeChat'));

comment on column public.students.student_phone is '學生本人電話（本地號碼，不含區號）';
comment on column public.students.parent_phone is '家長電話（本地號碼，不含區號）';
comment on column public.students.student_phone_country_code is '學生電話區號：+852 或 +86';
comment on column public.students.parent_phone_country_code is '家長電話區號：+852 或 +86';
comment on column public.students.whatsapp is 'WhatsApp 聯絡號碼（本地號碼；wa.me 取號時優先於 student_phone／parent_phone）';
comment on column public.students.preferred_contact_method is '偏好通訊方式：WhatsApp 或 WeChat';
