# 員工績效與盈利能力分析儀表板 — 實作計劃

> 日期：2026-08-02  
> 狀態：**已實作（第一版）** — 路由 `/StaffPerformance`  
> 決策鎖定：manager／alien；預設上月；人工接 `mainhope-07payroll` 2026-07 快照；課時利用率改總授課時數  
> 參考研究：用戶提供的教培行業人效分析研究（四層模型：人效 + 毛利 + 穩定性 + 可持續性）

---

## 0. 目標

建立一個以**員工／導師**為分析單位的盈利能力儀表板，回答：

- 誰最賺錢、誰最穩定、誰最值得加資源
- 不只是「收入 vs 人工」兩個數字，而是「人效 + 毛利 + 穩定性 + 可持續性」四層
- 支援按老師、科目、年級、班型、校區、新生／舊生、月份／學期 drill-down

---

## 1. 技術決策

### 1.1 放在哪裡

| 項目 | 決定 | 原因 |
|------|------|------|
| 路由 | `/StaffPerformance` | 與現有 `/MgmtDashboard`（營運總覽）分開；前者看錢，後者看整體營運 |
| 側欄 | `智能分析` 分組，新增 `員工績效` | 與 `營運總覽`、`AI 報表` 同級 |
| 頁面 | `src/pages/StaffPerformance.tsx` | 薄頁面，只掛 component |
| 組件 | `src/components/staffPerformance/` | 遵循分層；新建 domain 目錄 |
| 服務 | `src/services/staffPerformanceQueries.ts` | 所有 Supabase 查詢集中在此 |
| 類型 | `src/components/staffPerformance/types.ts` | 與 mgmtDashboard 模式一致 |

### 1.2 角色權限

- `manager`、`alien` 可見（與營運總覽一致）
- `admin`、`teacher` 不可見

---

## 2. 重用現有組件與模式（非常重要）

Cursor 應**直接重用**以下現有元件，不要重新造輪子：

### 2.1 UI 基礎元件（`src/components/ui/`）

| 元件 | 路徑 | 用途 |
|------|------|------|
| `Button` | `ui/button.tsx` | 所有按鈕 |
| `Select` | `ui/select.tsx` | 下拉選擇（班型、月份等） |
| `MultiSelect` | `ui/multi-select.tsx` | 多選篩選（老師、科目、校區） |
| `Tag` | `ui/tag.tsx` | 狀態標籤（搭配 `statusToTagTone`） |
| `Tabs` | `ui/tabs.tsx` | 分頁切換（概覽／排行榜／明細） |
| `DateRangeInput` | `ui/date-range-input.tsx` | 日期區間選擇 |
| `Input` | `ui/input.tsx` | 搜尋框 |

### 2.2 儀表板專用組件（可直接複用模式）

| 現有組件 | 路徑 | 如何重用 |
|----------|------|----------|
| `MgmtStatCard` | `mgmtDashboard/MgmtStatCard.tsx` | **直接複用**：KPI 卡片（含 delta、sparkline、breakdown、tone 邊框）。員工績效 KPI 卡片格式完全一致 |
| `MgmtDashboardFilterBar` | `mgmtDashboard/MgmtDashboardFilterBar.tsx` | **參考其結構**：日期＋科目＋老師＋班型＋班別篩選。員工績效需增加「年級」、「新生/舊生」維度 |
| `PanelShell` | `mgmtDashboard/MgmtAnalysisSection.tsx` 內部 | **複用其樣式**：`rounded-xl border border-border bg-card p-4 shadow-sm` |
| `HorizontalBarChart` | `mgmtDashboard/charts/MgmtCharts.tsx` | **直接複用**：員工毛利排行榜、科目分佈 |
| `Sparkline` | `mgmtDashboard/charts/MgmtCharts.tsx` | **直接複用**：KPI 卡內迷你趨勢 |
| `MgmtOpsAlertsSection` | `mgmtDashboard/MgmtOpsAlertsSection.tsx` | **參考其結構**：異常名單卡片列表 |
| `SortHeader` | `mgmtDashboard/MgmtDetailTablesSection.tsx` 內部 | **複用**：表格排序表頭 |

### 2.3 recharts（已安裝，直接用）

專案已依賴 `recharts@^2.15.4`。需新增的圖表類型（recharts 原生支援）：

- **ScatterChart** — 員工收入 vs 人工散點圖（核心圖表）
- **BarChart** — 員工毛利排行榜（`HorizontalBarChart` 已封裝，可複用）
- **LineChart** — 收入／毛利月趨勢圖
- **HeatMap 替代** — 用顏色深淺的表格代替真正的 heatmap（更簡單、更符合現有 UI 風格）

### 2.4 現有服務層函數（可部分複用）

`src/services/mgmtDashboardQueries.ts` 中以下函數可直接複用或參考：

| 函數 | 用途 | 是否需要修改 |
|------|------|------------|
| `sumConsumedLessonValue()` | 計算已完成課堂的收入價值 | 需要按 teacher_id group by |
| `fetchPaidUnitPriceMaps()` | 取得每課時單價 | 可直接複用 |
| `countAttendanceVisits()` | 計算上堂人次 | 需要按 teacher_id group by |
| `coursePricesFromClassEmbed()` | 從班別取得價格 | 可直接複用 |
| `unitPriceForConsumedLesson()` | 計算單堂課價值 | 可直接複用 |

---

## 3. 數據庫考量

### 3.1 現有可用的數據

| 數據 | 來源表 | 計算方式 |
|------|--------|----------|
| 員工收入 | `attendance_details` + `classes` + `courses` | `sumConsumedLessonValue` 邏輯，按 `classes.teacher_id` group by |
| 授課時數 | `attendance_details` | 計數 billable attendance，按 `classes.teacher_id` group by |
| 學生人數 | `student_class_enrollments` | 就讀中人數，按 `classes.teacher_id` group by |
| 續報率 | `enrollment_change_events` | 期內續報人數 ÷ 期初在讀人數 |
| 退讀率 | `enrollment_change_events` | 期內退讀 ÷ 期初在讀 |
| 出席率 | `attendance_details` | 實際出席 ÷ 應出席 |
| 缺課率 | `attendance_details` | no show + 請假 ÷ 總堂數 |

### 3.2 人工成本

**已鎖定（2026-08-03）**：接 Desktop `mainhope-07payroll` 離線引擎產出（`src/data/staffLaborJuly2026.ts`），**僅 2026-07**。人工＝gross＋僱主 MPF。`/Payroll` UI mock **不可**作來源。其他月份標「未有月結」。暫不建 `teacher_labor_config`。

### 3.3 Migration

本版無需新表。日後跨月穩定性可加 `staff_month_teacher_stats` 月結表。

---

## 4. 頁面架構設計

### 4.1 整體佈局

```
┌─────────────────────────────────────────────────────────────┐
│  員工績效分析                                                  │
│  [日期區間] [本月] [本季] [科目▼] [老師▼] [班型▼] [年級▼]      │
│  [新生/舊生▼] [校區/班別▼]           [匯出CSV] [重新整理]       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┬─────────┬─────────┬─────────┬─────────┬────────┐ │
│  │ 總收入   │ 總人工   │ 總毛利   │ 人工佔比  │ 人均收入  │ 人均毛利│ │
│  │ $238K   │ $98K    │ $140K   │ 41.2%   │ $21.6K  │ $12.7K │ │
│  └─────────┴─────────┴─────────┴─────────┴─────────┴────────┘ │
│  ┌─────────┬─────────┐                                        │
│  │ 課時利用率│ 續報率   │                                        │
│  │ 78.5%   │ 72.3%   │                                        │
│  └─────────┴─────────┘                                        │
│                                                                │
│  ⚠ 異常提醒（5 項）                                             │
│  • 陳老師 人工佔比 68%（超標）                                   │
│  • 李老師 收入連續兩月下降                                       │
│  • 王老師 續報率僅 45%                                          │
│  • 張老師 缺課率高於 20%                                        │
│  • 劉老師 上月退讀 3 人                                         │
│                                                                │
│  ┌─ Tab: 排行榜 ──┬── Tab: 趨勢分析 ──┬── Tab: 員工明細 ────┐  │
│  │                │                  │                    │  │
│  │  散點圖        │  月趨勢折線圖     │  可搜尋/排序表格    │  │
│  │  (收入vs人工)   │  (收入/毛利/人工) │  含全部 KPI 欄位   │  │
│  │                │                  │                    │  │
│  │  毛利排行榜     │  人工佔比熱力表   │  點擊展開員工卡片   │  │
│  │  (橫向條形)     │  (老師×月份)     │                    │  │
│  └────────────────┴──────────────────┴────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 KPI 卡片定義（8 張卡）

沿用 `KpiCardModel` 型別（從 `mgmtDashboard/types.ts` import）：

| id | label | format | 計算方式 |
|----|-------|--------|----------|
| `totalRevenue` | 總收入 | hkd | Σ 所有老師已完成課堂收入 |
| `totalLaborCost` | 總人工成本 | hkd | Σ 所有老師人工（底薪+時薪+佣金估算） |
| `totalGrossProfit` | 總毛利 | hkd | 總收入 - 總人工 |
| `laborCostRatio` | 人工佔收入比 | percent | 總人工 ÷ 總收入 × 100 |
| `avgRevenuePerStaff` | 每人平均收入 | hkd | 總收入 ÷ 在職老師數 |
| `avgProfitPerStaff` | 每人平均毛利 | hkd | 總毛利 ÷ 在職老師數 |
| `utilizationRate` | 課時利用率 | percent | Σ 實際上課時數 ÷ Σ 可排課時數 |
| `retentionRate` | 續報率 | percent | 期內續報學生 ÷ 期初在讀學生 |

### 4.3 第一屏：排行榜 + 散點圖

**散點圖（收入 vs 人工）** 是教培業最有用的圖表：

- X 軸：員工帶來收入
- Y 軸：員工人力成本
- 每個點＝一位老師
- 四象限解讀：
  - 右上：高收入高成本 → 看是否值得
  - 右下：高收入低成本 → 核心人員
  - 左上：低收入高成本 → 優先處理
  - 左下：新人或低產出 → 需觀察

用 recharts `ScatterChart`，參考線為 y=x（人工＝收入，即毛利率 0%）。

**毛利排行榜**：用現有的 `HorizontalBarChart`，數據改為每人毛利額。

### 4.4 第二屏：趨勢 + 異常

- **月趨勢折線圖**：可選 1-3 位老師，看收入／毛利／人工走勢
- **人工佔比熱力表**：用 HTML table，cell 背景色深淺表示佔比高低（綠→黃→紅），行＝老師，列＝月份
- **異常名單**：複用 `MgmtOpsAlertsSection` 的卡片模式，列出：
  - 人工佔比 > 60%
  - 收入連續兩月下降
  - 續報率 < 50%
  - 缺勤率 > 20%
  - 毛利率 < 30%

### 4.5 第三屏：員工明細表

可搜尋、可排序的表格，每行一位老師，欄位包括：

| 欄位 | 格式 | 說明 |
|------|------|------|
| 老師名稱 | text | 可點擊連到老師詳情 |
| 本月收入 | hkd | 已完成課堂收入 |
| 本月人工 | hkd | 直接人工成本 |
| 毛利額 | hkd | 收入 - 人工 |
| 毛利率 | percent | 毛利 ÷ 收入 |
| 人工佔比 | percent | 人工 ÷ 收入 |
| 授課時數 | count | 實際授課堂數 |
| 每課時收入 | hkd | 收入 ÷ 時數 |
| 每課時毛利 | hkd | 毛利 ÷ 時數 |
| 續報率 | percent | |
| 缺課率 | percent | |
| 異常標記 | tag | 有異常時顯示 Tag |

---

## 5. 檔案結構

```
src/
├── pages/
│   └── StaffPerformance.tsx          # 薄頁面，掛 StaffPerformanceView
├── components/
│   └── staffPerformance/
│       ├── StaffPerformanceView.tsx   # 主組件（類似 MgmtDashboardView）
│       ├── StaffKpiCards.tsx          # KPI 卡片行（複用 MgmtStatCard）
│       ├── StaffFilterBar.tsx         # 篩選列（參考 MgmtDashboardFilterBar）
│       ├── StaffScatterChart.tsx      # 散點圖：收入 vs 人工
│       ├── StaffProfitRanking.tsx     # 毛利排行榜
│       ├── StaffTrendChart.tsx        # 月趨勢折線圖
│       ├── StaffLaborHeatTable.tsx    # 人工佔比熱力表
│       ├── StaffAnomalyCards.tsx      # 異常名單卡片
│       ├── StaffDetailTable.tsx       # 員工明細表
│       └── types.ts                  # 型別定義
├── services/
│   └── staffPerformanceQueries.ts    # 所有 Supabase 查詢
└── lib/
    └── navStructure.ts               # 新增側欄項目
```

### 5.1 types.ts 關鍵型別

```typescript
// 直接從 mgmtDashboard 複用
import type { KpiCardModel, KpiStatus } from "@/components/mgmtDashboard/types"

export type StaffPerformanceFilters = {
  dateFrom: string
  dateTo: string
  subjectIds: string[]
  teacherIds: string[]
  classKind: "all" | "group" | "private"
  gradeIds: string[]          // 新增：年級
  studentType: "all" | "new" | "returning"  // 新增：新生/舊生
  classIds: string[]          // 校區/班別
}

export type StaffPerformanceRow = {
  teacherId: string
  teacherName: string
  teacherAbbr: string | null
  revenue: number             // 本月帶來收入
  laborCost: number           // 本月人工支出
  grossProfit: number         // 毛利額
  grossMargin: number         // 毛利率 (%)
  laborCostRatio: number      // 人工佔收入比 (%)
  teachingHours: number       // 授課時數
  revenuePerHour: number      // 每課時收入
  laborCostPerHour: number    // 每課時人工
  profitPerHour: number       // 每課時毛利
  studentCount: number        // 在讀學生數
  retentionRate: number | null// 續報率 (%)
  absenceRate: number | null  // 缺課率 (%)
  withdrawalCount: number     // 期內退讀人數
  anomalyTags: string[]       // 異常標記，如 ["人工佔比過高", "收入下跌"]
}

export type StaffKpiSet = {
  kpis: KpiCardModel[]        // 複用既有 KPI card model
}

export type StaffPerformancePayload = {
  asOf: string
  kpis: KpiCardModel[]
  rows: StaffPerformanceRow[]
  monthlyTrend: {
    teacherId: string
    teacherName: string
    months: { month: string; revenue: number; laborCost: number; profit: number }[]
  }[]
  anomalies: AnomalyCard[]
}
```

---

## 6. 實作步驟（給 Cursor 的順序）

### Phase 1：數據層（先確保能拿到正確數據）

1. **新建 `teacher_labor_config` migration**
   - 含 RLS policy
   - 讓 manager/alien 可以 CRUD

2. **建立 `staffPerformanceQueries.ts`**
   - `fetchStaffPerformance(filters)` — 主查詢，回 `StaffPerformancePayload`
   - 內部邏輯：
     a. 從 `attendance_details` 按 `classes.teacher_id` group by，計算每人收入（複用 `sumConsumedLessonValue` 邏輯）
     b. 從 `teacher_labor_config` 讀取每人成本參數，計算人工成本
     c. 從 `student_class_enrollments` + `enrollment_change_events` 計算續報率、退讀率
     d. 從 `attendance_details` 計算出席率、缺課率
   
   **關鍵提醒**：`sumConsumedLessonValue` 現有邏輯是全域加總，需要改造為按 `teacher_id` group by 的版本。建議在 service 層新增 `sumConsumedLessonValueByTeacher()` 函數，參考現有邏輯但加上 `GROUP BY classes.teacher_id`。

### Phase 2：UI 骨架

3. **新建 `types.ts`** — 定義所有型別

4. **新建 `StaffPerformanceView.tsx`** — 主組件骨架
   - 參考 `MgmtDashboardView.tsx` 的結構
   - loading → error → data 三態
   - 使用 `reportUserFacingError` 處理錯誤

5. **新建 `StaffFilterBar.tsx`**
   - 參考 `MgmtDashboardFilterBar.tsx`
   - 新增：年級 multi-select、新生/舊生 select
   - 選項來源：年級從 `classGrade.ts` 的 `resolveClassGradeLabels`；新生/舊生為固定選項

### Phase 3：KPI 與圖表

6. **新建 `StaffKpiCards.tsx`**
   - 直接複用 `MgmtStatCard` 組件（import 即可）
   - 排列 8 張卡（總收入、總人工、總毛利、人工佔比、人均收入、人均毛利、課時利用率、續報率）

7. **新建 `StaffScatterChart.tsx`**
   - 用 recharts `<ScatterChart>`
   - 每個點＝一位老師，hover 顯示名稱＋收入＋人工＋毛利率
   - 加一條 y=x 參考線（recharts `<ReferenceLine>`）

8. **新建 `StaffProfitRanking.tsx`**
   - 直接複用 `HorizontalBarChart`（從 MgmtCharts import）
   - 數據為每人毛利額，按高低排序

9. **新建 `StaffTrendChart.tsx`**
   - 用 recharts `<LineChart>`
   - 可多選老師（最多 5 位），每條線＝一位老師的月度毛利/收入

10. **新建 `StaffLaborHeatTable.tsx`**
    - 原生 HTML table（不依賴 recharts）
    - Cell 背景色：綠色（<40%）→ 黃色（40-60%）→ 紅色（>60%）
    - 使用 Tailwind 動態 class 或 inline style

### Phase 4：異常與明細

11. **新建 `StaffAnomalyCards.tsx`**
    - 參考 `MgmtOpsAlertsSection.tsx` 的卡片模式
    - 自動從數據中偵測異常（人工佔比 > 60%、收入連跌、續報低等）

12. **新建 `StaffDetailTable.tsx`**
    - 參考 `MgmtDetailTablesSection.tsx` 的表格模式
    - 含搜尋框（複用 `Input`）
    - 含排序表頭（複用 `SortHeader` 邏輯）
    - 點擊老師名稱連結到 `/Teachers/:teacherId`

### Phase 5：路由與導航

13. **新建 `StaffPerformance.tsx` 頁面**
    - 薄頁面，只掛 `RequireMgmtRoles` + `StaffPerformanceView`

14. **更新 `App.tsx`**
    - 加入 `<Route path="/StaffPerformance" element={...} />`
    - 使用 lazy load（與 MgmtDashboard 一致）

15. **更新 `navStructure.ts`**
    - 在 `intelligence` 分組加入新項目
    - label: `員工績效`，icon: `UserRound` 或 `TrendingUp`
    - roles: `["manager", "alien"]`（admin 如需也可加）

---

## 7. UI/UX 設計注意事項（給 Cursor）

### 7.1 必須遵守的規則

1. **錯誤處理**：所有 async 操作必須 `try/catch`，catch 內使用 `formatUnknownError` + `reportUserFacingError`（含 `setErr`），畫面有紅字區塊。參考 `docs/UI_DESIGN_INSTRUCTIONS.md`。

2. **按鈕**：所有 button 必須 `type="button"`（除非在 `<form>` 內且真的是 submit）。

3. **原生 `<select>` 禁用**：使用專案的 `Select` 組件（`ui/select.tsx`）。

4. **alert/confirm 禁用**：使用 `appConfirm.tsx`。

5. **數字格式**：金額用 `toLocaleString("en-HK")`，百分比用 `toFixed(1)`。

6. **表格數字右對齊**：使用 `text-right tabular-nums`。

7. **Tailwind class 規範**：
   - 卡片：`rounded-xl border border-border bg-card p-4 shadow-sm`
   - KPI 數值大字：`text-2xl font-semibold tracking-tight tabular-nums`
   - 區塊標題：`text-lg font-semibold tracking-tight`
   - 說明文字：`text-sm text-muted-foreground`
   - Loading：`flex items-center justify-center text-sm text-muted-foreground` + `<Loader2 className="animate-spin" />`

### 7.2 顏色與語義

- 收入/毛利正向 → `success`（綠色）
- 成本/佔比過高 → `warning` 或 `destructive`（黃/紅）
- 使用既有的 CSS 變數：`hsl(var(--chart-1))` 到 `hsl(var(--chart-5))` 做圖表顏色
- 使用既有的 `statusToTagTone` 做 Tag 顏色

### 7.3 手機適配

- KPI 卡片：`grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6`（或類似響應式）
- 圖表區域：小螢幕 stack（`grid-cols-1 lg:grid-cols-2`）
- 表格：`overflow-x-auto` 包住
- 篩選列：小螢幕時折行，`flex-wrap`

### 7.4 現有圖表色板（從 MgmtCharts 參考）

```
chart-1: 藍色（用於收入、主要指標）
chart-2: 綠色（用於轉化、正面指標）
chart-3: 紫色（用於分類）
warning: 黃/橙（用於警示）
destructive: 紅色（用於嚴重問題）
```

---

## 8. 與現有系統的整合點

| 整合點 | 方式 |
|--------|------|
| 點擊老師名稱 | `Link to={`/Teachers/${row.teacherId}`}` |
| 點擊班別 | `Link to={`/Classes/${row.classId}`}` |
| 側欄導航 | 更新 `NAV_STRUCTURE` 在 `intelligence` 分組 |
| 權限控制 | `RequireMgmtRoles roles={["admin", "manager", "alien"]}` |
| 錯誤上報 | `reportUserFacingError(e, { source: "StaffPerformanceView.load", setErr })` |

---

## 9. MVP 建議

第一版先做以下內容（可在一兩天內完成）：

1. ✅ 8 個 KPI 卡片（總收入、總人工、總毛利、人工佔比、人均收入、人均毛利、課時利用率、續報率）
2. ✅ 散點圖（收入 vs 人工） — **這是核心差異化功能**
3. ✅ 員工毛利排行榜（橫向條形圖）
4. ✅ 員工明細表（可搜尋、可排序）
5. ✅ 異常名單卡片（人工佔比過高、收入下跌、續報偏低）
6. ✅ 基本篩選（日期、老師、科目、班型）

第二版再加：
- 月趨勢折線圖
- 人工佔比熱力表
- 年級/新生舊生 drill-down
- CSV 匯出

---

## 10. 注意事項

1. **人工成本是瓶頸**：正式 payroll 引擎未完成前，必須通過 `teacher_labor_config` 表或 mock 值來提供成本數據。要讓管理層知道這是估算值，非正式 payroll 數字。

2. **不要與 MgmtDashboard 功能重疊**：MgmtDashboard 看的是整體營運（收款、招生、流失、欠費），StaffPerformance 看的是每位老師的盈利能力。兩者互補。

3. **續報率計算需小心**：需要定義清楚「續報」的口徑。建議第一版先用簡化版：期內有新增報讀的學生 ÷ 期初在讀學生（排除新生）。

4. **課時利用率需要「可排課時數」**：這個數字需要從老師的 availability 或合約工時取得。第一版如果拿不到，可以先不顯示這個 KPI，或改用「總授課時數」代替。

5. **所有文案用繁體中文**：遵循 `TERMINOLOGY.md` 規範。
