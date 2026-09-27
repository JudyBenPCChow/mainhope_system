-- 補回：建檔時前端尚未寫入 interested_subjects 的已轉換潛在客戶。

begin;

update public.students s
set interested_subjects = l.interested_subjects,
    updated_at = now()
from public.leads l
where l.converted_student_id = s.id
  and cardinality(coalesce(l.interested_subjects, '{}'::text[])) > 0
  and cardinality(coalesce(s.interested_subjects, '{}'::text[])) = 0;

commit;
