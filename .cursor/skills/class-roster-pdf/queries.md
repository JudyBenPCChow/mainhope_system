# 班別名單查庫

專案：**MainHope_production**（`gudmbilboyhouotilrvt`）。

把 `2026-10-23` 換成資料日期，把 `2026-09-01` 換成該常規學年 9 月 1 日。三份結果都存成 `{"rows":[...]}`。`supabase db query --linked -o json` 已是這個形狀。MCP `execute_sql` 要自行包一層 `rows`。

## 班別與就讀學生

```sql
select c.class_kind, c.course_code_full, c.section_code, c.subject, c.grade, c.day_of_week, c.time_slot,
  co.course_name, co.grade_code, t.full_name as teacher,
  coalesce((
    select json_agg(json_build_object(
      'name', btrim(s.full_name),
      'grade', s.grade,
      'plan', e.homework_day_plan,
      'days', e.homework_weekdays
    ) order by btrim(s.full_name))
    from student_class_enrollments e
    join students s on s.id = e.student_id
    where e.class_id = c.id and e.status = '就讀中'
  ), '[]'::json) as students
from classes c
left join academic_years ay on ay.id = c.academic_year_id
left join teachers t on t.id = c.teacher_id
left join courses co on co.id = c.course_id
where c.status = '進行中'
  and (
    (c.class_kind = 'group' and ay.label = '2627')
    or c.class_kind in ('homework', 'private')
  )
order by c.class_kind, co.grade_code nulls last, c.subject, c.section_code;
```

## 各班人數（純文字，不出 PDF）

```sql
select c.class_kind, c.course_code_full, c.section_code, c.subject, c.grade,
  c.day_of_week, c.time_slot,
  case when c.class_kind = 'homework' then null else t.full_name end as teacher,
  (select count(*)::int from student_class_enrollments e
    where e.class_id = c.id and e.status = '就讀中') as enrolled
from classes c
left join academic_years ay on ay.id = c.academic_year_id
left join teachers t on t.id = c.teacher_id
left join courses co on co.id = c.course_id
where c.status = '進行中'
  and (
    (c.class_kind = 'group' and ay.label = '2627')
    or c.class_kind in ('homework', 'private')
  )
order by c.class_kind, co.grade_code nulls last, c.subject, c.section_code;
```

## 私人課程時段（自學年 9 月 1 日起）

```sql
select c.subject,
  extract(dow from s.scheduled_date)::int as dow,
  left(s.start_time::text, 5) as start_time,
  left(s.end_time::text, 5) as end_time,
  count(*)::int as n
from classes c
join schedules s on s.class_id = c.id
where c.class_kind = 'private'
  and c.status = '進行中'
  and s.scheduled_date >= '2026-09-01'
  and coalesce(s.status, '') not like '%取消%'
group by 1, 2, 3, 4
order by 1, 2, 3;
```

## 私人課程最近一堂與下一堂

`next_date` 用資料日期當下限（含當日尚未上完的堂）。

```sql
select c.subject,
  max(s.scheduled_date) filter (where coalesce(s.status, '') not like '%取消%')::text as last_any,
  min(s.scheduled_date) filter (
    where s.scheduled_date >= '2026-10-23'
      and coalesce(s.status, '') not like '%取消%'
  )::text as next_date
from classes c
left join schedules s on s.class_id = c.id
where c.class_kind = 'private'
  and c.status = '進行中'
group by c.subject
order by c.subject;
```
