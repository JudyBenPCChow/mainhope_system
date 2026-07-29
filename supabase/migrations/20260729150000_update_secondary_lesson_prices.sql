-- 單堂標準價更新：初中 250→275；高中 275→300
-- 只改「等於舊標準價」的列，保留 625／825／950 等特殊價。
-- 先更新高中（275→300），再更新初中（250→275），避免誤把新初中價再抬成高中價。

-- 1) 課程模板 courses
update public.courses
set
  price_per_lesson = 300,
  updated_at = now()
where grade_code in ('S4', 'S5', 'S6')
  and price_per_lesson = 275;

update public.courses
set
  price_per_lesson_period_2 = 300,
  updated_at = now()
where grade_code in ('S4', 'S5', 'S6')
  and price_per_lesson_period_2 = 275;

update public.courses
set
  price_per_lesson = 275,
  updated_at = now()
where grade_code in ('S1', 'S2', 'S3')
  and price_per_lesson = 250;

update public.courses
set
  price_per_lesson_period_2 = 275,
  updated_at = now()
where grade_code in ('S1', 'S2', 'S3')
  and price_per_lesson_period_2 = 250;

-- 2) 班別 override classes（純高中／純初中；跨學段或特殊價不動）
update public.classes
set
  price_per_lesson = 300,
  updated_at = now()
where price_per_lesson = 275
  and grade is not null
  and grade && array['中四', '中五', '中六']::text[]
  and not (grade && array['中一', '中二', '中三']::text[]);

update public.classes
set
  price_per_lesson = 275,
  updated_at = now()
where price_per_lesson = 250
  and grade is not null
  and grade && array['中一', '中二', '中三']::text[]
  and not (grade && array['中四', '中五', '中六']::text[]);

comment on column public.courses.price_per_lesson is
  '每節學費（HKD）；標準單堂：初中 275、高中 300（2026-07 起）';
