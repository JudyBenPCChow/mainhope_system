# 新生試堂／新報讀 SQL

目標庫：**MainHope_production**（`gudmbilboyhouotilrvt`）。

把 `:start_date`、`:end_date` 換成該次請求的香港日期（`date '2026-09-26'`）。未給迄日時，`:end_date` 用 `(now() at time zone 'Asia/Hong_Kong')::date`。

新生口徑與計法見 [SKILL.md](SKILL.md)。兩段查詢都先限新生，不要改成「試堂日在期間內的所有人」。

## 新報讀名單（以人計）

```sql
with new_students as (
  select s.id,
         btrim(s.full_name) as full_name,
         s.grade,
         (s.created_at at time zone 'Asia/Hong_Kong')::date as registered_on
  from students s
  where nullif(btrim(s.old_student_id), '') is null
    and (s.created_at at time zone 'Asia/Hong_Kong')::date >= :start_date
    and (s.created_at at time zone 'Asia/Hong_Kong')::date <= :end_date
    and coalesce(s.full_name, '') not ilike '%test%'
    and coalesce(s.full_name, '') not ilike '%測試%'
),
enrolled as (
  select ns.id,
         ns.full_name,
         ns.grade,
         ns.registered_on,
         min((e.created_at at time zone 'Asia/Hong_Kong')::date) as enrolled_on
  from new_students ns
  join student_class_enrollments e on e.student_id = ns.id
  group by ns.id, ns.full_name, ns.grade, ns.registered_on
)
select en.enrolled_on,
       en.full_name,
       en.grade,
       en.registered_on,
       e.status,
       c.class_kind,
       c.subject,
       c.course_code_full,
       case
         when exists (
           select 1
           from trial_sessions t
           where t.student_id = en.id
             and t.outcome = 'converted'
             and (t.converted_enrollment_id = e.id or t.class_id = e.class_id)
         ) then '試堂轉化'
         else '即時報讀'
       end as path
from enrolled en
join student_class_enrollments e on e.student_id = en.id
join classes c on c.id = e.class_id
order by en.enrolled_on, en.full_name, c.subject;
```

人數＝`enrolled` 的人數，不是列數。某人任一列途徑為「試堂轉化」，該人歸試堂轉化。

## 試堂成功率（一人一科一筆，只計已上並已點名）

同一學生、同一 `class_kind`、同一科目合併。分母只留該科有實際出席點名的筆。該科任一堂 `converted` 則分子計入。未點名、缺席不入分母。出席狀態對齊 `isActualPresentStatus`（`現場`、`錄影回放`、`zoom實時網課`、`出席`、`網課`、`補課`、`線上`、`即時直播`，以及含「網課」或「線上」且不含「假」）。

```sql
with new_students as (
  select s.id,
         btrim(s.full_name) as full_name,
         s.grade,
         s.registration_status,
         (s.created_at at time zone 'Asia/Hong_Kong')::date as registered_on
  from students s
  where nullif(btrim(s.old_student_id), '') is null
    and (s.created_at at time zone 'Asia/Hong_Kong')::date >= :start_date
    and (s.created_at at time zone 'Asia/Hong_Kong')::date <= :end_date
    and coalesce(s.full_name, '') not ilike '%test%'
    and coalesce(s.full_name, '') not ilike '%測試%'
),
trial_rows as (
  select ns.id as student_id,
         ns.full_name,
         ns.grade,
         ns.registration_status,
         ns.registered_on,
         c.class_kind,
         coalesce(nullif(btrim(c.subject), ''), '(未填科目)') as subject,
         t.outcome,
         a.status as attendance_status
  from new_students ns
  join trial_sessions t on t.student_id = ns.id
  join classes c on c.id = t.class_id
  left join attendance_details a
    on a.schedule_id = t.schedule_id
   and a.student_id = ns.id
),
records as (
  select student_id,
         full_name,
         grade,
         registration_status,
         registered_on,
         class_kind,
         subject,
         bool_or(outcome = 'converted') as converted,
         bool_or(
           attendance_status in (
             '現場', '錄影回放', 'zoom實時網課', '出席', '網課', '補課', '線上', '即時直播'
           )
           or (
             attendance_status is not null
             and (attendance_status like '%網課%' or attendance_status like '%線上%')
             and attendance_status not like '%假%'
           )
         ) as attended
  from trial_rows
  group by student_id, full_name, grade, registration_status, registered_on, class_kind, subject
)
select full_name, grade, registration_status, registered_on, class_kind, subject, converted
from records
where attended
order by class_kind, converted desc, registered_on, full_name, subject;
```

彙總只用 `attended` 的列：

- 全部：行數為分母，`converted` 為真的行數為分子
- 只限專科：加上 `class_kind = 'group'`
- 功輔：`class_kind = 'homework'`（僅在使用者點名時回報）
