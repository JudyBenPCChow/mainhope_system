# 專科班點名跟進 SQL

MCP `execute_sql` → **MainHope_production**（`gudmbilboyhouotilrvt`）。

把 `'2026-10-01'`／`'2026-10-07'` 換成目標日期（含首尾）。可選把 `c.course_code_full like '2627-%'` 改成該學年前綴；若要含全部專科班可刪該行。

測試班過濾（概覽／欠點名建議加上）：

```sql
and not (
  coalesce(tt.full_name, ct.full_name) ilike '%Test%'
  or coalesce(tt.full_name, ct.full_name) ilike '%HWKP%'
  or coalesce(c.course_code_full, '') ilike '%Test%'
)
```

## 1. 按日概覽

```sql
with sched as (
  select
    s.id,
    s.scheduled_date,
    s.status as schedule_status,
    coalesce(tt.full_name, ct.full_name) as teacher_name,
    (select count(*)::int from attendance_declarations d
      where d.schedule_id = s.id and d.status = 'active') as active_decls,
    (select count(*)::int from attendance_details ad
      where ad.schedule_id = s.id) as attendance_rows,
    (select count(distinct ad.student_id)::int from attendance_details ad
      where ad.schedule_id = s.id) as attendance_students
  from schedules s
  join classes c on c.id = s.class_id
  left join teachers ct on ct.id = c.teacher_id
  left join teachers tt on tt.id = s.teacher_id
  where s.scheduled_date between '2026-10-01' and '2026-10-07'
    and c.class_kind = 'group'
    and c.course_code_full like '2627-%'
)
select
  scheduled_date,
  count(*) as schedule_count,
  count(*) filter (where schedule_status = '取消') as cancelled,
  count(*) filter (
    where schedule_status is distinct from '取消' and active_decls = 0
  ) as empty_roster,
  count(*) filter (
    where schedule_status is distinct from '取消'
      and active_decls > 0 and attendance_rows = 0
  ) as unmarked_with_roster,
  count(*) filter (
    where schedule_status is distinct from '取消'
      and active_decls > 0 and attendance_rows > 0
      and attendance_students < active_decls
  ) as partial_marked,
  count(*) filter (
    where schedule_status is distinct from '取消'
      and active_decls > 0 and attendance_students >= active_decls
  ) as marked_ok
from sched
group by scheduled_date
order by scheduled_date;
```

## 2. 欠點名／部分點名明細（出 WhatsApp 前重跑）

```sql
select
  coalesce(tt.full_name, ct.full_name) as teacher_name,
  s.scheduled_date,
  s.start_time,
  s.end_time,
  c.course_code_full,
  c.subject,
  (select count(*)::int from attendance_declarations d
    where d.schedule_id = s.id and d.status = 'active') as active_decls,
  (select count(distinct ad.student_id)::int from attendance_details ad
    where ad.schedule_id = s.id) as att,
  (select string_agg(st.full_name, '、' order by st.full_name)
     from attendance_declarations d
     join students st on st.id = d.student_id
    where d.schedule_id = s.id and d.status = 'active'
      and not exists (
        select 1 from attendance_details ad
        where ad.schedule_id = s.id and ad.student_id = d.student_id
      )
  ) as unmarked_names,
  case
    when (select count(distinct ad.student_id) from attendance_details ad
          where ad.schedule_id = s.id) = 0 then '未點名'
    else '部分點名'
  end as issue
from schedules s
join classes c on c.id = s.class_id
left join teachers ct on ct.id = c.teacher_id
left join teachers tt on tt.id = s.teacher_id
where s.scheduled_date between '2026-10-01' and '2026-10-07'
  and c.class_kind = 'group'
  and c.course_code_full like '2627-%'
  and s.status is distinct from '取消'
  and (select count(*) from attendance_declarations d
        where d.schedule_id = s.id and d.status = 'active') > 0
  and (select count(distinct ad.student_id) from attendance_details ad
        where ad.schedule_id = s.id)
      < (select count(*) from attendance_declarations d
          where d.schedule_id = s.id and d.status = 'active')
order by teacher_name, s.scheduled_date, s.start_time;
```

催點時可再加：只取 `scheduled_date < current_date`（香港），或 `scheduled_date = current_date and start_time::time < (now() at time zone 'Asia/Hong_Kong')::time`。

## 3. 出席無有效宣告

```sql
select
  s.scheduled_date,
  s.start_time,
  s.end_time,
  c.course_code_full,
  c.subject,
  coalesce(tt.full_name, ct.full_name) as teacher_name,
  st.full_name as student_name,
  ad.status as att_status,
  (select count(*) from attendance_declarations d0
    where d0.schedule_id = ad.schedule_id and d0.student_id = ad.student_id
  ) as decl_row_count,
  e.status as enroll_status,
  e.enroll_date,
  (select string_agg(c2.course_code_full || '(' || e2.status || ')', ', '
                     order by c2.course_code_full)
     from student_class_enrollments e2
     join classes c2 on c2.id = e2.class_id
    where e2.student_id = ad.student_id
      and c2.class_kind = 'group'
      and e2.status = '就讀中'
  ) as active_group_enrollments,
  (select string_agg(
      coalesce(lm.leave_date::text, '') || '/' || coalesce(lm.makeup_date::text, '')
      || ' type=' || coalesce(lm.makeup_type, '')
      || ' st=' || coalesce(lm.status, ''),
      ' | ')
     from leave_makeup_records lm
    where lm.student_id = ad.student_id
      and (lm.makeup_schedule_id = ad.schedule_id
           or lm.schedule_id = ad.schedule_id
           or lm.makeup_date = s.scheduled_date)
  ) as leave_makeup,
  (select string_agg(ece.reason || ':' || ece.delta_lessons::text, ', ')
     from entitlement_consumption_events ece
    where ece.attendance_detail_id = ad.id
       or (ece.schedule_id = ad.schedule_id and ece.student_id = ad.student_id)
  ) as consumption
from attendance_details ad
join schedules s on s.id = ad.schedule_id
join classes c on c.id = coalesce(ad.class_id, s.class_id)
join students st on st.id = ad.student_id
left join teachers ct on ct.id = c.teacher_id
left join teachers tt on tt.id = s.teacher_id
left join student_class_enrollments e
  on e.student_id = ad.student_id and e.class_id = c.id
where s.scheduled_date between '2026-10-01' and '2026-10-07'
  and c.class_kind = 'group'
  and c.course_code_full like '2627-%'
  and not exists (
    select 1 from attendance_declarations ax
    where ax.schedule_id = ad.schedule_id
      and ax.student_id = ad.student_id
      and ax.status = 'active'
  )
order by s.scheduled_date, s.start_time, c.course_code_full, st.full_name;
```

## 4. 取消堂（可選）

```sql
select
  s.scheduled_date,
  s.start_time,
  c.course_code_full,
  c.subject,
  coalesce(tt.full_name, ct.full_name) as teacher_name,
  s.cancel_reason,
  left(coalesce(s.remarks, ''), 80) as remarks
from schedules s
join classes c on c.id = s.class_id
left join teachers ct on ct.id = c.teacher_id
left join teachers tt on tt.id = s.teacher_id
where s.scheduled_date between '2026-10-01' and '2026-10-07'
  and c.class_kind = 'group'
  and c.course_code_full like '2627-%'
  and s.status = '取消'
order by 1, 2, 3;
```

## 5. 出席狀態分布（可選）

```sql
select ad.status, count(*)::int as n
from attendance_details ad
join schedules s on s.id = ad.schedule_id
join classes c on c.id = s.class_id
where s.scheduled_date between '2026-10-01' and '2026-10-07'
  and c.class_kind = 'group'
  and c.course_code_full like '2627-%'
group by 1
order by n desc;
```

## 6. 按老師匯總欠點（可選；催點用）

把 `:today` 換成香港今日 `YYYY-MM-DD`，`:now_time` 換成現在 `HH:MM:SS`。

```sql
with sched as (
  select
    s.id,
    s.scheduled_date,
    s.start_time,
    c.course_code_full,
    coalesce(tt.full_name, ct.full_name) as teacher_name,
    (select count(*) from attendance_declarations d
      where d.schedule_id = s.id and d.status = 'active') as active_decls,
    (select count(*) from attendance_details ad
      where ad.schedule_id = s.id) as attendance_rows,
    (select count(distinct ad.student_id) from attendance_details ad
      where ad.schedule_id = s.id) as attendance_students
  from schedules s
  join classes c on c.id = s.class_id
  left join teachers ct on ct.id = c.teacher_id
  left join teachers tt on tt.id = s.teacher_id
  where s.scheduled_date between '2026-10-01' and '2026-10-07'
    and c.class_kind = 'group'
    and c.course_code_full like '2627-%'
    and s.status is distinct from '取消'
)
select
  teacher_name,
  count(*) filter (
    where active_decls > 0 and attendance_rows = 0
      and (
        scheduled_date < date '2026-10-07'
        or (scheduled_date = date '2026-10-07' and start_time::time < time '14:00')
      )
  ) as past_unmarked_sessions,
  count(*) filter (
    where active_decls > 0 and attendance_rows = 0
      and scheduled_date = date '2026-10-07'
      and start_time::time >= time '14:00'
  ) as today_upcoming_unmarked,
  count(*) filter (
    where active_decls > 0 and attendance_rows > 0
      and attendance_students < active_decls
  ) as partial_sessions
from sched
group by teacher_name
having count(*) filter (where active_decls > 0 and attendance_rows = 0) > 0
    or count(*) filter (
         where active_decls > 0 and attendance_rows > 0
           and attendance_students < active_decls
       ) > 0
order by past_unmarked_sessions desc, teacher_name;
```
