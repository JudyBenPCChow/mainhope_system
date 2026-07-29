-- 系統通知：收款單據改為「作廢」（僅行政／外星人）
insert into public.inbox_events (
  event_type,
  category,
  title,
  body,
  action_path,
  audience_teacher_ids,
  audience_roles,
  payload
)
select
  'system_update',
  'system',
  '收款單據改為「作廢」（不可刪除）',
  E'即日起，繳費／收款單據不可直接刪除，開錯請用「作廢」。\n\n點樣做\n· 入口：繳費紀錄，或學生詳情 → 繳費\n· 按「作廢」→ 填原因 → 再輸入你的登入密碼確認\n\n作廢後請留意\n· 舊收據無效，單號不會重用；要收款請另開正確新單\n· 系統不會自動退班（學生可能仍就讀中，對帳會顯示欠費）\n· 每次作廢，行政／外星人會收到收件匣系統通知；已收款另會電郵管理層\n\n詳情見收件匣相關通知，或問阿Po「單據點樣作廢」。',
  '/PaymentHistory',
  '{}'::uuid[],
  array['admin', 'alien']::text[],
  jsonb_build_object('kind', 'feature_release', 'topic', 'payment_void')
where not exists (
  select 1
  from public.inbox_events e
  where e.event_type = 'system_update'
    and e.title = '收款單據改為「作廢」（不可刪除）'
);
