-- 既有班別：grade 為空時，由課程模板 grade_code 回填年級標籤

update public.classes c
set grade = array[
  case public.courses_normalize_grade_code(co.grade_code)
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
  end
]::text[]
from public.courses co
where c.course_id = co.id
  and co.grade_code is not null
  and trim(co.grade_code) <> ''
  and (c.grade is null or cardinality(c.grade) = 0)
  and case public.courses_normalize_grade_code(co.grade_code)
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
  end is not null;
