# 功輔當值改動通知：查庫與基準

專案：**MainHope_production**（`gudmbilboyhouotilrvt`）。把 `2026-10-01`／`2026-10-13` 換成目標月 1 日與香港查庫當日。

## 現況＋通訊電郵

每人一列當值（放假日無指派則不會出現）。`division`＝中學部／小學部。

```sql
with params as (
  select date '2026-10-01' as month_start,
         (date '2026-10-01' + interval '1 month')::date as month_end,
         date '2026-10-13' as today,
         time '21:50' as now_hm  -- 香港現在時間 HH:MM:SS；用於當日是否已完成
),
ay as (
  select id from public.academic_years where label = '2627' limit 1
)
select
  t.id as teacher_id,
  coalesce(nullif(btrim(t.english_name), ''), nullif(btrim(t.full_name), ''), '老師') as display_name,
  t.full_name,
  t.english_name,
  tp.notification_email,
  case when cl.course_code_full like '%HWKP%' then '小學部' else '中學部' end as division,
  d.duty_date::text as duty_date,
  to_char(a.session_start, 'HH24:MI') as start_hm,
  to_char(a.session_end, 'HH24:MI') as end_hm,
  a.room,
  (
    d.duty_date < (select today from params)
    or (
      d.duty_date = (select today from params)
      and a.session_end <= (select now_hm from params)
    )
  ) as done
from public.homework_tutoring_duty_assignments a
join public.homework_tutoring_duty_days d on d.id = a.duty_day_id
join public.homework_tutoring_roster_months rm on rm.id = d.roster_month_id
join ay on ay.id = rm.academic_year_id
join public.classes cl on cl.id = rm.class_id
join public.teachers t on t.id = a.teacher_id
left join public.teachers_private tp on tp.teacher_id = t.id
where rm.roster_month = (select month_start from params)
  and cl.course_code_full in ('2627-HWKS1099-A', '2627-HWKP1099-A')
  and d.holiday_label is null
order by display_name, d.duty_date, a.session_start, division;
```

## 基準快照格式

`docs/generated/2627/2627_HOMEWORK_DUTY_<YYYY-MM>_notify_baseline.json`：

```json
{
  "yearMonth": "2026-10",
  "savedAt": "2026-10-13T13:50:00+08:00",
  "source": "production",
  "assignments": [
    {
      "teacherId": "uuid",
      "displayName": "Rain Kwok",
      "division": "中學部",
      "dutyDate": "2026-10-05",
      "start": "15:30",
      "end": "20:00"
    }
  ]
}
```

由 HWKS／HWKP 月曆 JSON 合併時：遍歷兩檔 `days[].assignments[]`，`divisionLabel` 作 `division`；老師以姓名對 `teachers.full_name`／`english_name` 解 `teacherId`（解不到則暫用姓名當鍵，diff 仍可做，但寄信前必須對到 `teachers.id`）。

## Diff 規則（實作）

鍵（現況與基準同一套）：`teacherId|dutyDate|division|start|end`。

1. 現況有、基準無 → 該現況行 `*新增`（若同日同學部僅時間不同，改標 `*修改`）。
2. 基準有、現況無 → 輸出 `*取消` 行（用基準時段）。
3. 同日同學部、一人一節時段從 A 變 B → 現況行標 `*修改︰由{A} 修改至 {B}`（`A`／`B` 寫 `HH:MM-HH:MM`）。
4. 同日同學部多人交接：逐節用時間對齊；對唔上先取消舊再新增。

課室不入 diff 鍵。

## 由現況列組 baseline

寄出成功後，把今次查庫結果寫成上列 JSON（`assignments` 只保留 `teacherId`／`displayName`／`division`／`dutyDate`／`start`／`end`）。
