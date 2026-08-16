# 未完成補堂 SQL

MCP `execute_sql` 打 **MainHope_production**。把 `'26SM'` 換成目標 `academic_years.label`。

扣堂白名單：

```sql
unnest(array[
  '現場','錄影回放','zoom實時網課','no show','請假而不需補回',
  '出席','網課','補課','線上','即時直播','不用補回'
])
```

## 1. 學生請假（未完成）

`leave_makeup_records` 班屬該學年；`leave_reason` 不含老師／導師；排除已補課／已完成／放棄／錄影／不補回；再喺結果剔除補堂已扣堂。

連堂會出兩行（同人同日）——agent 合併，`lessons`＝行數。

```sql
with ay as (
  select id from academic_years where label = '26SM'
),
billable as (
  select unnest(array[
    '現場','錄影回放','zoom實時網課','no show','請假而不需補回',
    '出席','網課','補課','線上','即時直播','不用補回'
  ]) as status
)
select
  c.course_code_full as class_code,
  coalesce(ct.full_name, '—') as teacher_name,
  trim(st.full_name) as student_name,
  coalesce(lm.leave_reason, '—') as leave_reason,
  lm.leave_date::text as leave_date,
  lm.makeup_type,
  coalesce(lm.makeup_date::text, ms.scheduled_date::text) as makeup_date,
  lm.status as rec_status,
  (lm.makeup_date is not null or lm.makeup_schedule_id is not null) as arranged,
  exists (
    select 1 from attendance_details ad
    where ad.student_id = lm.student_id
      and ad.status in (select status from billable)
      and (
        (lm.makeup_schedule_id is not null and ad.schedule_id = lm.makeup_schedule_id)
        or (
          coalesce(lm.makeup_date, ms.scheduled_date) is not null
          and ad.class_id = lm.class_id
          and ad.attendance_date = coalesce(lm.makeup_date, ms.scheduled_date)
        )
      )
  ) as makeup_attended,
  coalesce(lm.remarks, '') as remarks
from leave_makeup_records lm
join classes c on c.id = lm.class_id
join students st on st.id = lm.student_id
left join teachers ct on ct.id = c.teacher_id
left join schedules ms on ms.id = lm.makeup_schedule_id
where c.academic_year_id = (select id from ay)
  and coalesce(lm.leave_reason,'') not ilike '%老師%'
  and coalesce(lm.leave_reason,'') not ilike '%導師%'
  and coalesce(lm.status,'') not ilike '%已補課%'
  and coalesce(lm.status,'') not ilike '%已完成%'
  and coalesce(lm.status,'') not ilike '%放棄%'
  and coalesce(lm.makeup_type,'') not ilike '%錄影%'
  and coalesce(lm.makeup_type,'') not ilike '%錄像%'
  and coalesce(lm.makeup_type,'') not ilike '%不補回%'
order by arranged, class_code, leave_date, student_name;
```

只用 `makeup_attended = false`。`arranged = false` → `s_none`；`true` → `s_pending`。

## 2. 老師請假（取消堂）

```sql
with ay as (
  select id from academic_years where label = '26SM'
),
billable as (
  select unnest(array[
    '現場','錄影回放','zoom實時網課','no show','請假而不需補回',
    '出席','網課','補課','線上','即時直播','不用補回'
  ]) as status
),
periods as (
  select period_code::int as period_code, start_date, end_date
  from academic_year_periods
  where academic_year_id = (select id from ay)
),
cancelled as (
  select
    s.id as schedule_id,
    s.class_id,
    s.scheduled_date,
    left(coalesce(s.start_time,''),5) as start_hm,
    s.cancel_reason,
    c.course_code_full as class_code,
    coalesce(ct.full_name, stch.full_name, '—') as teacher_name,
    case
      when s.scheduled_date < (select min(start_date) from periods) then 1
      else coalesce((
        select p.period_code from periods p
        where s.scheduled_date between p.start_date and p.end_date
        limit 1
      ), 1)
    end as period_code
  from schedules s
  join classes c on c.id = s.class_id
  left join teachers ct on ct.id = c.teacher_id
  left join teachers stch on stch.id = s.teacher_id
  where c.academic_year_id = (select id from ay)
    and s.status ilike '%取消%'
    and (
      coalesce(s.cancel_reason,'') ilike '%老師%'
      or coalesce(s.cancel_reason,'') ilike '%導師%'
    )
),
makeup as (
  select c.schedule_id as cancelled_id,
    string_agg(ms.scheduled_date::text, '、' order by ms.scheduled_date, ms.start_time) as makeup_dates,
    (array_agg(ms.id order by ms.scheduled_date, ms.start_time))[1] as makeup_schedule_id
  from cancelled c
  join schedules ms on ms.class_id = c.class_id
    and ms.status not ilike '%取消%'
    and coalesce(ms.remarks,'') like '%makeup_of=' || c.schedule_id::text || '%'
  group by c.schedule_id
),
enrolled as (
  select c.schedule_id, c.class_id, e.student_id, st.full_name as student_name
  from cancelled c
  join student_class_enrollments e on e.class_id = c.class_id
  join students st on st.id = e.student_id
  where (e.enroll_date is null or e.enroll_date <= c.scheduled_date)
    and (e.withdraw_effective_date is null or e.withdraw_effective_date > c.scheduled_date)
    and (
      case
        when coalesce(e.enrollment_period,'') = '單堂' then exists (
          select 1 from student_enrollment_sessions ses
          where ses.enrollment_id = e.id and ses.schedule_id = c.schedule_id
        )
        when coalesce(e.enrollment_period,'') in ('', '兩期全報') then true
        when c.period_code = 1 then e.enrollment_period = '第一期'
        when c.period_code = 2 then e.enrollment_period = '第二期'
        else true
      end
    )
),
personal_leave as (
  select distinct lm.student_id, lm.schedule_id
  from leave_makeup_records lm
  join classes c on c.id = lm.class_id
  where c.academic_year_id = (select id from ay)
    and coalesce(lm.leave_reason,'') not ilike '%老師%'
    and coalesce(lm.leave_reason,'') not ilike '%導師%'
    and lm.schedule_id is not null
)
select
  c.class_code,
  c.teacher_name,
  trim(en.student_name) as student_name,
  c.cancel_reason as leave_reason,
  c.scheduled_date::text as leave_date,
  c.start_hm,
  (m.cancelled_id is not null) as arranged,
  m.makeup_dates,
  exists (
    select 1 from attendance_details ad
    where ad.student_id = en.student_id
      and ad.status in (select status from billable)
      and (
        (m.makeup_schedule_id is not null and ad.schedule_id = m.makeup_schedule_id)
        or (
          m.makeup_dates is not null
          and ad.class_id = c.class_id
          and ad.attendance_date::text = split_part(m.makeup_dates, '、', 1)
        )
      )
  ) as makeup_attended,
  (pl.student_id is not null) as had_personal_leave
from cancelled c
join enrolled en on en.schedule_id = c.schedule_id
left join makeup m on m.cancelled_id = c.schedule_id
left join personal_leave pl on pl.student_id = en.student_id and pl.schedule_id = c.schedule_id
order by arranged, c.class_code, c.scheduled_date, student_name;
```

剔除 `makeup_attended` 或 `had_personal_leave`。其餘：`arranged = false` → `t_none`；`true` → `t_pending`。按班＋請假日＋原因＋補堂日合併學生名單；連堂 `lessons`＝該組合列數。

無 `academic_year_periods` 時：非單堂報讀當全日可見（`period_code` 當 1）。
