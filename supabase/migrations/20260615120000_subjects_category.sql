-- 科目分類（主科 / 初中選修 / 高中選修）供優惠資格使用

alter table public.subjects
  add column if not exists category text;

comment on column public.subjects.category is
  'main | junior_elective | senior_elective | other';

update public.subjects set category = 'main'
where code in ('CHI', 'ENG', 'MATH') and (category is null or category = '');

update public.subjects set category = 'junior_elective'
where code = 'SCI' and (category is null or category = '');

update public.subjects set category = 'senior_elective'
where code in (
  'CHIS', 'HIST', 'GEOG', 'ECON', 'CLIT', 'THS', 'PHY', 'CHEM', 'BIO',
  'ICT', 'DAT', 'BAFS', 'VA', 'MUS', 'PE', 'HMSC', 'M1', 'M2'
) and (category is null or category = '');

update public.subjects set category = 'other'
where category is null or category = '';

alter table public.subjects
  drop constraint if exists subjects_category_check;

alter table public.subjects
  add constraint subjects_category_check
  check (category in ('main', 'junior_elective', 'senior_elective', 'other'));
