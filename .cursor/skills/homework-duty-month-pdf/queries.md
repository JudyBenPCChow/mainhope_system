# 查 2627 功輔當月編更

專案：**MainHope_production**（`gudmbilboyhouotilrvt`）。把 `2026-10-01` 換成目標月 1 日。

結果每一行的 `payload` 就是腳本 `--data`／`--with` 要的 JSON（須含 `yearMonth`、`classCode`、`divisionLabel`、`rosterStatus`、`closures`、`days`）。`days[]` 含 `isoDate`、`holiday`、`secondaryRoom`、`primaryRoom`、`assignments`（`teacher`、`start`、`end`、`room`、`sortOrder`）。

```sql
with params as (
  select date '2026-10-01' as month_start,
         (date '2026-10-01' + interval '1 month')::date as month_end
),
ay as (
  select id from public.academic_years where label = '2627' limit 1
),
closures as (
  select c.closure_date::text as iso_date, coalesce(c.name, '放假') as label
  from public.homework_tutoring_calendar_closures c
  join ay on ay.id = c.academic_year_id
  where c.closure_date >= (select month_start from params)
    and c.closure_date < (select month_end from params)
),
roster as (
  select rm.id, rm.status, rm.published_at, cl.course_code_full
  from public.homework_tutoring_roster_months rm
  join ay on ay.id = rm.academic_year_id
  join public.classes cl on cl.id = rm.class_id
  where rm.roster_month = (select month_start from params)
    and cl.course_code_full in ('2627-HWKS1099-A', '2627-HWKP1099-A')
),
assign_json as (
  select a.duty_day_id,
    jsonb_agg(jsonb_build_object(
      'teacher', coalesce(nullif(btrim(t.full_name), ''), '—'),
      'start', to_char(a.session_start, 'HH24:MI'),
      'end', to_char(a.session_end, 'HH24:MI'),
      'room', a.room,
      'sortOrder', a.sort_order
    ) order by a.sort_order, a.session_start, a.room, t.full_name) as assignments
  from public.homework_tutoring_duty_assignments a
  left join public.teachers t on t.id = a.teacher_id
  group by a.duty_day_id
)
select r.course_code_full,
  jsonb_build_object(
    'yearMonth', to_char((select month_start from params), 'YYYY-MM'),
    'academicYearLabel', '2627',
    'classCode', r.course_code_full,
    'divisionLabel', case when r.course_code_full like '%HWKP%' then '小學部' else '中學部' end,
    'rosterStatus', r.status,
    'publishedAt', r.published_at,
    'closures', coalesce((
      select jsonb_agg(jsonb_build_object('isoDate', iso_date, 'label', label) order by iso_date)
      from closures
    ), '[]'::jsonb),
    'days', coalesce((
      select jsonb_agg(jsonb_build_object(
        'isoDate', d.duty_date::text,
        'holiday', d.holiday_label,
        'secondaryRoom', d.secondary_room,
        'primaryRoom', d.primary_room,
        'start', to_char(d.session_start, 'HH24:MI'),
        'end', to_char(d.session_end, 'HH24:MI'),
        'assignments', coalesce(aj.assignments, '[]'::jsonb)
      ) order by d.duty_date)
      from public.homework_tutoring_duty_days d
      left join assign_json aj on aj.duty_day_id = d.id
      where d.roster_month_id = r.id
    ), '[]'::jsonb)
  ) as payload
from roster r
order by r.course_code_full;
```

## 字型

```bash
mkdir -p scripts/.fonts
curl -fsSL -o scripts/.fonts/NotoSansTC-Variable.ttf \
  "https://github.com/google/fonts/raw/main/ofl/notosanstc/NotoSansTC%5Bwght%5D.ttf"
```

需要本機 Google Chrome：`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`。
