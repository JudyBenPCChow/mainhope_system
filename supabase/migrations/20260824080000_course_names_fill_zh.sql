-- Fill Chinese course_name for templates that still stored the code as the name.
-- Pattern follows existing regular-year names: 中X級常規Y班
-- (Chinese omits 級: 中X常規中文班). Homework tutoring uses the short product name 功輔班.

update public.courses as c
set course_name = v.course_name
from (
  values
    ('ENGS1001', '中一級常規英文班'),
    ('ENGS2001', '中二級常規英文班'),
    ('ENGS3001', '中三級常規英文班'),
    ('ENGS4001', '中四級常規英文班'),
    ('ENGS5001', '中五級常規英文班'),
    ('ENGS6001', '中六級常規英文班'),
    ('MATHS4001', '中四級常規數學班'),
    ('MATHS5001', '中五級常規數學班'),
    ('MATHS6001', '中六級常規數學班'),
    ('PHYS4001', '中四級常規物理班'),
    ('PHYS5001', '中五級常規物理班'),
    ('PHYS6001', '中六級常規物理班'),
    ('SCIS1001', '中一級常規科學班'),
    ('SCIS2001', '中二級常規科學班'),
    ('SCIS3001', '中三級常規科學班'),
    ('HWKS1001', '中一級常規功輔班'),
    ('HWKS2001', '中二級常規功輔班'),
    ('HWKS3001', '中三級常規功輔班'),
    ('HWKS4001', '中四級常規功輔班'),
    ('HWKS5001', '中五級常規功輔班'),
    ('HWKS6001', '中六級常規功輔班'),
    ('CHIS2001', '中二常規中文班')
) as v(course_code_base, course_name)
where c.course_code_base = v.course_code_base
  and c.course_name is distinct from v.course_name;
