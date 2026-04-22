-- 補強：「報讀班別」在列表為空，不只代表無 enrollment 列，
-- 亦可能為 enrollment 存在但班別已刪、或 classes.subject 無法列出（與 UI 一致）。
-- 僅當至少有一筆「可列出科目」之報讀時，才視為有報讀班別。

update public.students s
set
  enrollment_status = '非在讀',
  status = case
    when s.academic_stage = '中學畢業' then '畢業'
    when s.registration_status = '僅查詢' then '查詢試堂'
    else '非在讀'
  end,
  updated_at = now()
where s.enrollment_status = '在讀'
  and not exists (
    select 1
    from public.student_class_enrollments e
    inner join public.classes c on c.id = e.class_id
    where e.student_id = s.id
      and nullif(trim(c.subject), '') is not null
  );
