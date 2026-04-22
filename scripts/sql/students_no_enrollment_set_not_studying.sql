-- 將「報讀班別」在學生列表為空，但 enrollment_status 仍為在讀者改為非在讀。
-- 條件：沒有任何一筆 enrollment 能 join 到班別且班別有非空 subject（與 UI 顯示標籤一致）。
-- 若已跑過舊版（僅判斷無 enrollment 列），請再執行本檔或 migration 20260423103000。

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
