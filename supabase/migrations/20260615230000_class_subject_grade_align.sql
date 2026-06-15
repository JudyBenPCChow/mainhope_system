-- 班別 subject / grade 對齊與標準化

begin;

-- grade_code（P1–P6、S1–S6）→ 班別年級中文標籤
create or replace function public.grade_code_to_label(p_code text)
returns text
language sql
immutable
as $$
  select case public.courses_normalize_grade_code(p_code)
    when 'P1' then '小一'
    when 'P2' then '小二'
    when 'P3' then '小三'
    when 'P4' then '小四'
    when 'P5' then '小五'
    when 'P6' then '小六'
    when 'S1' then '中一'
    when 'S2' then '中二'
    when 'S3' then '中三'
    when 'S4' then '中四'
    when 'S5' then '中五'
    when 'S6' then '中六'
    else null
  end;
$$;

comment on function public.grade_code_to_label(text) is
  '課程模板 grade_code → classes.grade 用中文標籤（小一–中六）';

-- 單一年級字串標準化（中四級、S4、中四 → 中四）
create or replace function public.normalize_class_grade_label(raw text)
returns text
language plpgsql
immutable
as $$
declare
  t text := trim(coalesce(raw, ''));
  m text[];
  lbl text;
begin
  if t = '' or t = '其他' then
    return null;
  end if;
  t := regexp_replace(t, '級$', '');
  lbl := public.grade_code_to_label(t);
  if lbl is not null then
    return lbl;
  end if;
  m := regexp_match(t, '^(小|中)(一|二|三|四|五|六)$');
  if m is not null then
    return m[1] || m[2];
  end if;
  return null;
end;
$$;

comment on function public.normalize_class_grade_label(text) is
  '將班別年級字串標準化為小一–中六；無法辨識回傳 null';

-- 年級陣列去重、排序、標準化
create or replace function public.normalize_class_grade_array(grades text[])
returns text[]
language sql
immutable
as $$
  select coalesce(
    array(
      select distinct lbl
      from (
        select public.normalize_class_grade_label(g) as lbl
        from unnest(coalesce(grades, array[]::text[])) as g
      ) s
      where lbl is not null
      order by lbl
    ),
    array[]::text[]
  );
$$;

comment on function public.normalize_class_grade_array(text[]) is
  '班別 grade 陣列標準化；空結果為 {}';

-- 1) 有 course_id：subject 對齊 subjects.name_zh
update public.classes c
set
  subject = s.name_zh,
  updated_at = now()
from public.courses co
join public.subjects s on s.id = co.subject_id
where c.course_id = co.id
  and c.subject is distinct from s.name_zh;

-- 2) 有 course_id：grade 對齊課程模板（單一年級）
update public.classes c
set
  grade = array[public.grade_code_to_label(co.grade_code)]::text[],
  updated_at = now()
from public.courses co
where c.course_id = co.id
  and public.grade_code_to_label(co.grade_code) is not null
  and c.grade is distinct from array[public.grade_code_to_label(co.grade_code)]::text[];

-- 3) 無 course_id：僅標準化 grade 寫法（保留多選）
update public.classes c
set
  grade = sub.new_grade,
  updated_at = now()
from (
  select
    id,
    case
      when cardinality(public.normalize_class_grade_array(grade)) = 0 then null::text[]
      else public.normalize_class_grade_array(grade)
    end as new_grade
  from public.classes
  where course_id is null
    and grade is not null
    and cardinality(grade) > 0
) sub
where c.id = sub.id
  and c.grade is distinct from sub.new_grade;

-- 4) 無 course_id：subject 若可映射到標準科目，改為 name_zh
update public.classes c
set
  subject = s.name_zh,
  updated_at = now()
from public.subjects s
where c.course_id is null
  and public.map_subject_code(c.subject) is not null
  and s.code = public.map_subject_code(c.subject)
  and c.subject is distinct from s.name_zh;

commit;
