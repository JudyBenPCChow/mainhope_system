-- 廣告查詢（/AdInterest）有興趣科目：建檔後寫入學生主檔，學生詳情可看／改。

begin;

alter table public.students
  add column if not exists interested_subjects text[] not null default '{}';

comment on column public.students.interested_subjects is
  '查詢／廣告有興趣科目名稱（非選修代碼）。來源含 leads.interested_subjects。';

-- 已建檔潛在客戶：補回有興趣科目（只填空白，不覆蓋職員已改內容）
update public.students s
set interested_subjects = l.interested_subjects
from public.leads l
where l.converted_student_id = s.id
  and cardinality(coalesce(l.interested_subjects, '{}'::text[])) > 0
  and cardinality(coalesce(s.interested_subjects, '{}'::text[])) = 0;

commit;
