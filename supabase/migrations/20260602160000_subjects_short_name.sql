-- 科目字典：新增簡稱 short_name（顯示與匯入比對用）
-- 標準 23 科見 supabase/import/00_reset_for_rebuild.sql

alter table public.subjects add column if not exists short_name text;

create unique index if not exists subjects_short_name_unique_idx
  on public.subjects (short_name)
  where short_name is not null;

comment on column public.subjects.short_name is
  '科目簡稱；匯入時 subject_name 可匹配 name_zh 或 short_name';

insert into public.subjects (code, name_zh, short_name)
values
  ('CHI',  '中國語文', '中文'),
  ('ENG',  '英國語文', '英文'),
  ('MATH', '數學（必修部份）', '數學'),
  ('SCI',  '綜合科學', '科學'),
  ('CHIS', '中國歷史', '中史'),
  ('HIST', '歷史', '歷史'),
  ('GEOG', '地理', '地理'),
  ('ECON', '經濟', '經濟'),
  ('CLIT', '中國文學', '文學'),
  ('THS',  '旅遊與款待', '旅款'),
  ('PHY',  '物理', '物理'),
  ('CHEM', '化學', '化學'),
  ('BIO',  '生物', '生物'),
  ('ICT',  '資訊及通訊科技 (ICT)', 'ICT'),
  ('DAT',  '設計與應用科技', '設計'),
  ('BAFS', '企業、會計與財務概論', '企會財'),
  ('VA',   '視覺藝術', '視藝'),
  ('MUS',  '音樂', '音樂'),
  ('PE',   '體育', '體育'),
  ('HMSC', '健康管理與社會關懷', '健管'),
  ('M1',   '數學延伸部分（單元一 M1）', 'M1'),
  ('M2',   '數學延伸部分（單元二 M2）', 'M2'),
  ('HWK',  '功課輔導', '功輔')
on conflict (code) do update
  set name_zh = excluded.name_zh,
      short_name = excluded.short_name,
      updated_at = now();
