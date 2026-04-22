-- 將「報讀班別」為空（student_class_enrollments 無任何列）且目前標為在讀之學生，
-- 設為非在讀；並同步 legacy status 欄（與 deriveDisplayStatus 一致）。

update public.students s
set
  enrollment_status = '非在讀',
  status = case
    when s.academic_stage = '中學畢業' then '畢業'
    when s.registration_status = '僅查詢' then '查詢試堂'
    else '非在讀'
  end,
  updated_at = now()
where not exists (
  select 1
  from public.student_class_enrollments e
  where e.student_id = s.id
)
  and s.enrollment_status = '在讀';
