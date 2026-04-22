-- 將 grade = NA 的學生狀態收斂為「畢業」
update public.students
set status = '畢業',
    updated_at = now()
where upper(trim(coalesce(grade, ''))) = 'NA'
  and coalesce(status, '') <> '畢業';
