-- 班別：報讀須知（文字說明）

alter table public.classes
  add column if not exists enrollment_notice text;

comment on column public.classes.enrollment_notice is
  '報讀須知（供管理員填寫此班報讀注意事項，不影響計算）';
