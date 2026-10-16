# 專科班導師群發 — 查庫 SQL

`project_ref`／linked：`gudmbilboyhouotilrvt`（MainHope_production）。

預設學年標籤：`2627`。換年時把下方 `'2627'` 與 `like '2627-%'` 一併替換。

## 收件名單（主責＋通知電郵）

```sql
with specialist_teachers as (
  select distinct c.teacher_id
  from public.classes c
  join public.academic_years ay on ay.id = c.academic_year_id
  where c.class_kind = 'group'
    and c.teacher_id is not null
    and (
      ay.label = '2627'
      or c.course_code_full like '2627-%'
    )
)
select
  t.id as teacher_id,
  t.full_name,
  t.english_name,
  t.honorific,
  t.status,
  t.homework_tutor_only,
  tp.notification_email,
  (
    select count(*)::int
    from public.classes c2
    join public.academic_years ay2 on ay2.id = c2.academic_year_id
    where c2.teacher_id = t.id
      and c2.class_kind = 'group'
      and (
        ay2.label = '2627'
        or c2.course_code_full like '2627-%'
      )
  ) as specialist_class_count
from public.teachers t
join specialist_teachers st on st.teacher_id = t.id
left join public.teachers_private tp on tp.teacher_id = t.id
where coalesce(t.homework_tutor_only, false) = false
  and t.full_name not ilike '%Test%'
  and t.full_name not ilike '%HWKP%'
  and coalesce(t.english_name, '') not ilike '%Test%'
order by t.full_name;
```

## 行政 To（固定，不必查庫）

| 角色 | 地址 |
| --- | --- |
| Christine Fan | `cfan@mainhope.edu.hk` |
| Mark Yu | `markyu@mainhope.edu.hk` |
| Sophie Yu | `526956762@qq.com` |
