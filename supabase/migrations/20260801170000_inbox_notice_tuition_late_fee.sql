-- 系統通知：正規課程逾期罰款自動加收（僅行政／外星人可見）
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
  '收款登記：正規課逾期罰款可自動加 $50',
  E'由 2026 年 10 月 1 日起，「收款登記」對正規小組課拖欠會自動加收逾期罰款 $50。\n\n【重點】\n· 同一學生、同一科，每一個曆月最多一次\n· 試堂、一對一、暑期課不加罰\n· 學費優惠不會扣減罰款；豁免必須填寫原因\n· 只在「已收款」時加罰；「待收款」單不會自動加\n\n【點試】\n收件匣開啟後 → 收款登記選學生及學費科目；若該科拖欠，畫面會顯示罰款（可豁免）。\n前線詳細規則見營運文件《正規課程逾期學費罰款指引》。',
  '/Payments',
  '{}'::uuid[],
  array['admin', 'alien']::text[],
  '{}'::jsonb
where not exists (
  select 1 from public.inbox_events e
  where e.event_type = 'system_update'
    and e.title = '收款登記：正規課逾期罰款可自動加 $50'
);
