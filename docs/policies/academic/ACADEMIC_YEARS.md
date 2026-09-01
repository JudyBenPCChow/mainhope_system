# 學年與報讀形式（常規／暑期）

介面用語：**繁體中文**。  
性質：**營運政策 + 系統資料模型**。索引見 [`OPS_POLICIES.md`](../_INDEX.md)。

程式錨點：`academic_years`、`academic_year_periods`、`courses.course_mode`、`student_class_enrollments.enrollment_period`；  
`src/lib/courseCode.ts`（`academicYearLabelFromStartDate`）、`src/lib/enrollmentPeriod.ts`、`src/lib/academicYearAccess.ts`、`src/lib/softArchiveWindow.ts`（日常營運窗／合規窗）；  
migration `20260612120000_summer_two_period_enrollment.sql`；cutover 學年種子見 `supabase/cutover/2026-07-fresh-start-reset.sql`。

---

## 1. 兩種學年

| | 常規學年 | 暑期學年 |
| --- | --- | --- |
| **約略時段** | 9 月 1 日 → 翌年 6 月 30 日 | 7 月 1 日 → 8 月 31 日 |
| **label 形態** | `YYZZ`（四年數字） | `YYSM`（兩位年＋`SM`） |
| **例子** | `2526`、`2627` | `25SM`、`26SM` |
| **課程模式** | `courses.course_mode = regular` | `summer_two_period` |
| **期數字典** | **不使用** `academic_year_periods` | 使用兩期（見第 3 節） |

**label 由開課／學年起始月推導**（`academicYearLabelFromStartDate`）：

- 7–8 月 → `YYSM`（例：2026-07-15 → `26SM`）
- 9 月–翌年 6 月 → `YYZZ`（例：2025-09-01 → `2526`）

**時間順序**（同「年段」內）：常規結束 → 暑期 → 下一常規。例：`2526` &lt; `26SM` &lt; `2627`（見 `academicYearOrderKey`）。

日常名單預設只載入近兩個常規學年（連帶其間暑期）；不是刪除。見 [`SOFT_ARCHIVE.md`](SOFT_ARCHIVE.md)。

---

## 1.1 後台寫入與學年防呆（現行政策）

**系統現況（2026-07-31 起）：不採「歷史學年硬鎖／唯讀」。**

| 情況 | 行為 |
| --- | --- |
| **目前學年**或**下一學年** | 可直接新增／修改（點名、請假、繳費、排程、班別、檔期、校曆等） |
| **其他學年**（較早或更遠） | 仍可修改；儲存前會出現 **Confirm Dialog**（顯示學年 label），確認後才寫入，並留下稽核 |
| **瀏覽舊資料** | 可開可睇；不再顯示「僅供查閱／學年已鎖」黃橫幅，也不再灰掉整頁寫入控件 |

**繳費單據**：防呆學年以明細**班別所屬學年**為準；班別無學年時才用功輔覆蓋起始月份。**不以收款日推算**。因此 8 月收取 `2627` 常規學費或 9 月功輔月費，不會當成修改 `26SM`。

**稽核 action**（`mgmt_audit_log`）：

- `non_current_academic_year_write` — 服務層偵測到非當期寫入（不擋流程）
- `non_current_academic_year_write_confirmed` — 使用者在 UI 確認後

**程式錨點**：`src/lib/academicYearSoftGuard.ts`；舊閘 `assertAcademicYearEditable*`／`canEditAcademicYear*` 已改為 audit-only／恒可編（見 [`backlog/academic-year-unlock-soft-guard.md`](./backlog/academic-year-unlock-soft-guard.md)）。

**歷史參考**：cutover 常數 `ACADEMIC_YEAR_EDITABLE_FROM_YMD`（`26SM`／2026-07-01）及舊「admin／teacher 硬鎖」敘述**不再是現行規則**；決策見 [`academic-year-unlock-soft-guard.md`](../../product/topics/academic-year-unlock-soft-guard.md)。

**營運注意**：改舊年資料前請確認學年／日期無誤；Confirm 只係防呆，唔等於禁止。角色權限（admin／teacher／alien）同 RLS 仍照常。

---

## 2. 種子學年一覽（cutover／字典常見列）

實際環境以 DB `academic_years` 為準；下列為 fresh-start 種子慣例：

| label | start_date | end_date | 類型 |
| --- | --- | --- | --- |
| `2425` | 2024-09-01 | 2025-06-30 | 常規 |
| `25SM` | 2025-07-01 | 2025-08-31 | 暑期 |
| `2526` | 2025-09-01 | 2026-06-30 | 常規 |
| `26SM` | 2026-07-01 | 2026-08-31 | 暑期 |
| `2627` | 2026-09-01 | 2027-06-30 | 常規 |
| `27SM` | 2027-07-01 | 2027-08-31 | 暑期 |
| … | 依同規律延伸 | … | … |

`is_current`：由「今日是否落在該學年 start–end」標記（種子腳本會重算）。

---

## 3. 暑期兩期（僅 \*SM）

表：`academic_year_periods`（**常規學年不寫入此表**）。

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
| 報讀 | 常規 | `NULL` | 默認讀至常規學年結束 |
| 第一期 | 暑期 | `第一期` | 只涵蓋 period 1 |
| 第二期 | 暑期 | `第二期` | 只涵蓋 period 2 |
| 兩期全報 | 暑期 | `兩期全報` | 兩期都涵蓋 |
| 單堂 | 常規或暑期 | `單堂` | 與上列互斥；綁定所選 `schedule_id` |

- 點名名冊：暑期依期數過濾；單堂只出現已選堂；常規報讀基本上在學年內可見（仍受報讀／退讀生效日約束）。**`26SM` 永遠沿用此舊路徑**，不遷已繳堂數／到課宣告（2026-08-31 拍板）。
- 定價：暑期可有第一期／第二期／兩期全報不同每堂價；常規多用 `price_per_lesson`。
- 現行 UI 舊稱：「全期報讀」＝常規 `NULL`；暑期對應「兩期全報」等（見 `formatEnrollmentFormLabel`）。
- **新增報讀班別名單**（學生詳細頁／前台精靈）：只列出**目前學年**的班別。目前為暑期（`*SM`）時，另含緊接的下一常規學年（暑假已開的下學年班）。不沿用日常營運窗，因此常規學年期間不會出現剛結束的暑期班（例：目前 `2627` 時不列出 `26SM`）。已有報讀紀錄仍可在學生詳情查閱，不因此隱藏。
- **學生管理清單「報讀班別」／右側預覽「進行中報讀」**：只顯示目前學年的就讀中報讀（以今天推算；常規學年期間不含剛結束的暑期）。私人課程不受學年影響。已結束學年的報讀改在學生詳情與本學年分開列出。

詳見阿Po 知識表與 `src/lib/enrollmentPeriod.ts`。

---

## 5. 與學費節奏的關係（摘要）

完整收費／罰款政策見 [`TUITION_TERM_AND_LATE_FEE_POLICY.md`](../payments/TUITION_TERM_AND_LATE_FEE_POLICY.md)。

| 學年類型 | 收費節奏（營運） |
| --- | --- |
| 常規 | 報讀默認至學年結束，但學費常**按月**交（約每月 4 堂） |
| 暑期 | 開課前按所報期數／單堂**一次收齊**；理論上較少「月中遲交」 |

**點名扣堂規則全年同一套**（見 [`ATTENDANCE_BILLING.md`](../attendance/ATTENDANCE_BILLING.md)）；季節差異主要在報讀範圍與收費節奏，唔係另一套出席狀態。

專科班**實際上課日／校舍假期**見 [`ACADEMIC_CALENDAR.md`](ACADEMIC_CALENDAR.md)（與本檔學年 `start_date`／`end_date` 分開；9/1 起算 ≠ 每班首堂日）。
