# 年級＋科目班別查詢 SQL

目標庫：**MainHope_production**（`gudmbilboyhouotilrvt`）。

把下方參數換成該次請求：

| 佔位 | 例子 | 說明 |
| --- | --- | --- |
| `:year_label` | `'2627'` | 常規學年；暑期改 `'26SM'` |
| `:grade_code` | `'S4'` | 見 `src/lib/studentGrade.ts`（中四→S4） |
| `:grade_label` | `'中四'` | 中文年級標籤 |
| `:subject_name` | `'中文'` | 科目中文名 |
| `:subject_aliases` | `('中文','中文科','CHI','CHIS','Chinese')` | 別名（按科目調整） |

## 科目別名（常用）

| 使用者說法 | `name_zh`／別名 |
| --- | --- |
| 中文 | 中文、中文科、CHI、CHIS、Chinese |
| 英文 | 英文、英文科、ENG、ENGS、English |
| 數學 | 數學、數學科、MATH、MATHS、Mathematics |
| 物理 | 物理、物理科、PHY、PHYS、Physics |
| 化學 | 化學、化學科、CHEM、Chemistry |
| 生物 | 生物、生物科、BIO、BIOS、Biology |
| 科學（初中） | 科學、綜合科學、SCI、SCIS |
| 企會財 | 企會財、企業、會計、BAFS、企業、會計與財務概論 |

不確定時先查：

```sql
select code, name_zh from subjects order by code;
```

## 主查詢（一組年級＋科目）

回傳每一班一列；agent 再按 `course_code` 分組輸出。

```sql
with params as (
  select
    '2627'::text as year_label,
    'S4'::text as grade_code,
    '中四'::text as grade_label,
    '中文'::text as subject_name
),
subj_match as (
  select s.id, s.code, s.name_zh
  from subjects s, params p
  where s.name_zh = p.subject_name
     or s.name_zh ilike p.subject_name || '%'
     or upper(s.code) in ('CHI', 'CHIS')  -- 按科目改別名
),
target_classes as (
  select
    c.id as class_id,
    c.section_code,
    c.course_code_full,
    regexp_replace(coalesce(c.course_code_full, ''), '-[A-Z0-9]+$', '') as course_code,
    c.day_of_week,
    c.time_slot,
    c.grade as class_grades,
    c.subject as class_subject,
    t.full_name as teacher_name,
    co.grade_code as course_grade_code,
    co.eligible_grade_codes,
    co.course_seq,
    sb.code as subject_code,
    sb.name_zh as subject_name_zh,
    ay.label as year_label
  from classes c
  join params p on true
  left join teachers t on t.id = c.teacher_id
  left join courses co on co.id = c.course_id
  left join subjects sb on sb.id = co.subject_id
  left join academic_years ay on ay.id = c.academic_year_id
  where c.class_kind = 'group'
    and (
      ay.label = (select year_label from params)
      or c.academic_year_label = (select year_label from params)
      or c.course_code_full like (select year_label from params) || '-%'
    )
    and (
      -- 科目：subjects 表或班別 subject 字串
      sb.id in (select id from subj_match)
      or c.subject ilike '%' || (select subject_name from params) || '%'
    )
    and (
      -- 年級：班別 grade 陣列／標籤，或課程 grade_code／eligible
      (c.grade is not null and (
        (select grade_label from params) = any (c.grade)
        or (select grade_code from params) = any (c.grade)
      ))
      or co.grade_code = (select grade_code from params)
      or (
        co.eligible_grade_codes is not null
        and (select grade_code from params) = any (co.eligible_grade_codes)
      )
    )
    and not (
      coalesce(t.full_name, '') ilike '%Test%'
      or coalesce(t.full_name, '') ilike '%HWKP%'
      or coalesce(c.course_code_full, '') ilike '%Test%'
      or coalesce(c.course_code_full, '') ilike '%HWKP%'
    )
)
select
  tc.course_code,
  coalesce(nullif(trim(tc.section_code), ''), right(tc.course_code_full, 1)) as section_code,
  tc.day_of_week,
  tc.time_slot,
  coalesce(tc.teacher_name, '（未指定老師）') as teacher_name,
  (
    select count(*)::int
    from student_class_enrollments e
    where e.class_id = tc.class_id
      and e.status = '就讀中'
  ) as enrolled_count,
  tc.course_code_full,
  tc.class_id,
  tc.course_seq,
  tc.subject_name_zh,
  tc.class_subject
from target_classes tc
order by
  tc.course_code,
  tc.section_code,
  tc.day_of_week,
  tc.time_slot;
```

把 `upper(s.code) in ('CHI', 'CHIS')` 換成該科目別名。一次多組：對每組各跑一次（或用 `union all` 加 `request_key` 欄）。

## 時段顯示轉換（agent 側）

輸入 `time_slot`（如 `16:30-17:45` 或 `16:30–17:45`）：

1. 拆成起、迄 `HH:MM`（可忽略秒）
2. 各轉 12 小時數字（1–12，去掉前導零）＋同一午前午後前綴（以**開始時間**定前綴）
3. 輸出：`下午4:30-5:45`

```text
h < 12 → 上午；h == 12 → 中午；h > 12 → 下午（顯示小時 = h-12）
h == 0 → 上午12
```

## 快速自測

```sql
-- 應回至少 schema 可讀；若 permission denied＝通道未授權
select count(*)::int as class_n
from classes c
where c.class_kind = 'group'
  and c.course_code_full like '2627-%';
```
