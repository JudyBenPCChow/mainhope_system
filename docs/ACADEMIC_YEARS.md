# 學年與報讀形式（正規／暑期）

介面用語：**繁體中文**。  
性質：**營運政策 + 系統資料模型**。索引見 [`OPS_POLICIES.md`](OPS_POLICIES.md)。

程式錨點：`academic_years`、`academic_year_periods`、`courses.course_mode`、`student_class_enrollments.enrollment_period`；  
`src/lib/courseCode.ts`（`academicYearLabelFromStartDate`）、`src/lib/enrollmentPeriod.ts`、`src/lib/academicYearAccess.ts`；  
migration `20260612120000_summer_two_period_enrollment.sql`；cutover 學年種子見 `supabase/cutover/2026-07-fresh-start-reset.sql`。

---

## 1. 兩種學年

| | 正規學年（常規） | 暑期學年 |
| --- | --- | --- |
| **約略時段** | 9 月 1 日 → 翌年 6 月 30 日 | 7 月 1 日 → 8 月 31 日 |
| **label 形態** | `YYZZ`（四年數字） | `YYSM`（兩位年＋`SM`） |
| **例子** | `2526`、`2627` | `25SM`、`26SM` |
| **課程模式** | `courses.course_mode = regular` | `summer_two_period` |
| **期數字典** | **不使用** `academic_year_periods` | 使用兩期（見第 3 節） |

**label 由開課／學年起始月推導**（`academicYearLabelFromStartDate`）：

- 7–8 月 → `YYSM`（例：2026-07-15 → `26SM`）
- 9 月–翌年 6 月 → `YYZZ`（例：2025-09-01 → `2526`）

**時間順序**（同「年段」內）：正規結束 → 暑期 → 下一正規。例：`2526` &lt; `26SM` &lt; `2627`（見 `academicYearOrderKey`）。

**可編輯門檻**：自 `26SM`（2026-07-01）起前台可編輯；`2526` 及更早對部分角色唯讀（`ACADEMIC_YEAR_EDITABLE_FROM_YMD`）。

---

## 2. 種子學年一覽（cutover／字典常見列）

實際環境以 DB `academic_years` 為準；下列為 fresh-start 種子慣例：

| label | start_date | end_date | 類型 |
| --- | --- | --- | --- |
| `2425` | 2024-09-01 | 2025-06-30 | 正規 |
| `25SM` | 2025-07-01 | 2025-08-31 | 暑期 |
| `2526` | 2025-09-01 | 2026-06-30 | 正規 |
| `26SM` | 2026-07-01 | 2026-08-31 | 暑期 |
| `2627` | 2026-09-01 | 2027-06-30 | 正規 |
| `27SM` | 2027-07-01 | 2027-08-31 | 暑期 |
| … | 依同規律延伸 | … | … |

`is_current`：由「今日是否落在該學年 start–end」標記（種子腳本會重算）。

---

## 3. 暑期兩期（僅 \*SM）

表：`academic_year_periods`（**正規學年不寫入此表**）。

預設種子規則（相對該 SM 的 `start_date`／`end_date`）：

| period_code | label | 日期（以 7/1–8/31 暑期為例） |
| --- | --- | --- |
| 1 | 第一期 | 學年開始日 → 開始日 + 14 天（例：7/1–7/15） |
| 2 | 第二期 | 開始日 + 15 天 → 學年結束日（例：7/16–8/31） |

個別學年若營運改期，以 DB 該列為準，唔好寫死喺 UI。

---

## 4. 報讀形式

| 形式 | 適用 | `enrollment_period` | 說明 |
| --- | --- | --- | --- |
| 報足全期 | 正規 | `NULL` | 整段正規學年 |
| 第一期 | 暑期 | `第一期` | 只涵蓋 period 1 |
| 第二期 | 暑期 | `第二期` | 只涵蓋 period 2 |
| 兩期全報 | 暑期 | `兩期全報` | 兩期都涵蓋 |
| 單堂 | 正規或暑期 | `單堂` | 與上列互斥；綁定所選 `schedule_id` |

- 點名名冊：暑期依期數過濾；單堂只出現已選堂；正規全期基本上學年內可見（仍受報讀／退讀生效日約束）。
- 定價：暑期可有第一期／第二期／兩期全報不同每堂價；正規多用 `price_per_lesson`。
- UI 文案：「全期報讀」＝正規 `NULL`；暑期對應「兩期全報」等（見 `formatEnrollmentFormLabel`）。

詳見阿Po 知識表與 `src/lib/enrollmentPeriod.ts`。

---

## 5. 與學費節奏的關係（摘要）

完整收費／罰款政策見 [`TUITION_TERM_AND_LATE_FEE_POLICY.md`](TUITION_TERM_AND_LATE_FEE_POLICY.md)。

| 學年類型 | 收費節奏（營運） |
| --- | --- |
| 正規 | 報讀可為全期，但學費常**按月**交（約每月 4 堂） |
| 暑期 | 開課前按所報期數／單堂**一次收齊**；理論上較少「月中遲交」 |

**點名扣堂規則全年同一套**（見 [`ATTENDANCE_BILLING.md`](ATTENDANCE_BILLING.md)）；季節差異主要在報讀範圍與收費節奏，唔係另一套出席狀態。
