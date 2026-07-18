-- 清理：同班已就讀中、試堂仍未結案（已預約等）→ 標為已完成
-- 對應報讀後自動結案邏輯；僅處理歷史殘留，不改已取消／已完成。

update public.trial_sessions t
set
  status = '已完成',
  remarks = case
    when nullif(btrim(coalesce(t.remarks, '')), '') is null then '報讀後自動結案（歷史清理）'
    when position('報讀後自動結案' in t.remarks) > 0 then t.remarks
    else t.remarks || '；報讀後自動結案（歷史清理）'
  end,
  updated_at = now()
where exists (
  select 1
  from public.student_class_enrollments e
  where e.student_id = t.student_id
    and e.class_id = t.class_id
    and e.status = '就讀中'
)
  and coalesce(t.status, '') not like '%完成%'
  and coalesce(t.status, '') not like '%取消%';
