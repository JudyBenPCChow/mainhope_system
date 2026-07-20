-- 每堂排程的老師教學紀錄（與營運用 remarks 分開）

alter table public.schedules
  add column if not exists teaching_notes text;

comment on column public.schedules.teaching_notes is
  '老師填寫的教學紀錄（進度、內容、備忘）；與 schedules.remarks 營運備註分開。';
