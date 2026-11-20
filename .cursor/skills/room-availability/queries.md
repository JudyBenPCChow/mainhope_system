# 空課室與撞堂查詢

專案：**MainHope_production**（`gudmbilboyhouotilrvt`）。時間把 `16:30:00` 收成 `16:30`。取消：`coalesce(status, '') like '%取消%'`。

## 實體課室

```sql
select id, name
from public.classrooms
where is_online = false
  and name <> '17K'
order by name;
```

## 指定日佔用（專科、私人）

`:d`＝該日。就讀中為 0 不出現。

```sql
select r.name as room,
       left(s.start_time::text, 5) as start_hm,
       left(s.end_time::text, 5) as end_hm,
       c.course_code_full,
       c.class_kind,
       t.full_name as teacher
from public.schedules s
join public.classes c on c.id = s.class_id
join public.classrooms r on r.id = s.classroom_id
left join public.teachers t on t.id = s.teacher_id
where s.scheduled_date = :d
  and coalesce(s.status, '') not like '%取消%'
  and r.is_online = false
  and c.class_kind in ('group', 'private')
  and exists (
    select 1 from public.student_class_enrollments e
    where e.class_id = c.id and e.status = '就讀中'
  )
order by r.name, s.start_time;
```

## 指定日功輔佔室

已開的房整節佔用（含暫時空缺、尚無指派）。

```sql
select d.duty_date::text,
       x.room,
       left(d.session_start::text, 5) as start_hm,
       left(d.session_end::text, 5) as end_hm
from public.homework_tutoring_duty_days d
cross join lateral (values (d.primary_room), (d.secondary_room)) as x(room)
where d.duty_date = :d
  and nullif(btrim(x.room), '') is not null
union
select d.duty_date::text,
       a.room,
       left(a.session_start::text, 5),
       left(a.session_end::text, 5)
from public.homework_tutoring_duty_assignments a
join public.homework_tutoring_duty_days d on d.id = a.duty_day_id
where d.duty_date = :d
  and nullif(btrim(a.room), '') is not null
order by 1, 2, 3;
```

假期當日功輔不佔室：

```sql
select c.closure_date::text, c.name
from public.homework_tutoring_calendar_closures c
join public.academic_years ay on ay.id = c.academic_year_id
where ay.label = '2627'
  and c.closure_date = :d;
```

有假期列則該日功輔不佔室。

## 平日週範本（專科，就讀中 ≥ 1）

```sql
select r.name as room,
       c.day_of_week,
       c.time_slot,
       c.course_code_full,
       t.full_name as teacher,
       (select count(*) from public.student_class_enrollments e
         where e.class_id = c.id and e.status = '就讀中') as enrolled
from public.classes c
join public.classrooms r on r.id = c.classroom_id
left join public.academic_years ay on ay.id = c.academic_year_id
left join public.teachers t on t.id = c.teacher_id
where c.status = '進行中'
  and c.class_kind = 'group'
  and ay.label = '2627'
  and r.is_online = false
  and exists (
    select 1 from public.student_class_enrollments e
    where e.class_id = c.id and e.status = '就讀中'
  )
order by c.day_of_week, c.time_slot, r.name;
```

該月功輔按星期彙總（`:month_start` 為該月 1 日）：

```sql
select extract(dow from d.duty_date)::int as dow,
       x.room,
       left(d.session_start::text, 5) as start_hm,
       left(d.session_end::text, 5) as end_hm,
       count(distinct d.duty_date)::int as days
from public.homework_tutoring_duty_days d
join public.homework_tutoring_roster_months rm on rm.id = d.roster_month_id
cross join lateral (values (d.primary_room), (d.secondary_room)) as x(room)
where rm.roster_month = :month_start
  and nullif(btrim(x.room), '') is not null
group by 1, 2, 3, 4
order by 1, 3, 2;
```

`dow`：0＝星期日 … 6＝星期六。

## 老師撞時

`:from`、`:to` 含首尾。`:names` 為老師姓名（`ilike` 可多個）。同名多於一人時先列出再問，不要合併。

```sql
select s.scheduled_date::text as day,
       left(s.start_time::text, 5) as start_hm,
       left(s.end_time::text, 5) as end_hm,
       t.full_name as teacher,
       r.name as room,
       c.course_code_full,
       '專科或私人'::text as kind
from public.schedules s
join public.classes c on c.id = s.class_id
join public.teachers t on t.id = s.teacher_id
left join public.classrooms r on r.id = s.classroom_id
where s.scheduled_date between :from and :to
  and coalesce(s.status, '') not like '%取消%'
  and c.class_kind in ('group', 'private')
  and t.full_name ilike any (:names)
  and exists (
    select 1 from public.student_class_enrollments e
    where e.class_id = c.id and e.status = '就讀中'
  )
union all
select d.duty_date::text,
       left(a.session_start::text, 5),
       left(a.session_end::text, 5),
       t.full_name,
       a.room,
       cl.course_code_full,
       '功輔當值'
from public.homework_tutoring_duty_assignments a
join public.homework_tutoring_duty_days d on d.id = a.duty_day_id
join public.homework_tutoring_roster_months rm on rm.id = d.roster_month_id
join public.classes cl on cl.id = rm.class_id
join public.teachers t on t.id = a.teacher_id
where d.duty_date between :from and :to
  and t.full_name ilike any (:names)
order by 1, 2, 4;
```
