# 全站微交互設計指引

> 骨架流光 · 分佈入場 · 按鈕加載態 · 無窮滾動  
> 元件位置：`src/components/ui/`；hooks：`src/hooks/`、`src/lib/`  
> 與 [`UI_DESIGN_INSTRUCTIONS.md`](./UI_DESIGN_INSTRUCTIONS.md) §2（按鈕送出）互補。

---

## 1. 設計原則

| 原則 | 說明 |
|------|------|
| 不引入 framer-motion | 以 Tailwind keyframes + CSS transition 為主 |
| 尊重 `prefers-reduced-motion` | 流光／分佈入場降級為 pulse 或靜態佔位 |
| 骨架 = 未知 | roster 未齊時禁止顯示「0 人」；沿用排程 skeleton 決策 |
| 可重用優先 | 新頁／改 loading 必用本指引元件，勿 ad hoc `animate-pulse` |
| 分層不變 | component → service → lib；loading 元件不含 DB 邏輯 |

---

## 2. 可重用元件

### 2.1 骨架屏流光 — `Skeleton`

```tsx
import { Skeleton, SkeletonStatGrid, SkeletonCardGrid, SkeletonTableRows } from "@/components/ui/skeleton"

// 單行／區塊
<Skeleton className="h-4 w-32" />

// KPI 儀表板（4–8 格）
<SkeletonStatGrid count={4} />

// 卡片畫廊
<SkeletonCardGrid count={6} />

// 表格首屏
<SkeletonTableRows rows={8} columns={5} />

// 排程 inline 人數／badge
<SkeletonInlineBadge className="h-4 w-14" />

// 詳情頁標題
<SkeletonDetailHeader />
```

- `variant="shimmer"`（預設）：流光動畫；reduced-motion 時改 pulse。
- `variant="pulse"`：小 inline 佔位（Schedule 人數等）。

**整合 `ListLoad<T>`：**

```tsx
import { ListLoadBoundary } from "@/components/ui/list-load-boundary"

<ListLoadBoundary
  load={studentsLoad}
  skeleton={<SkeletonTableRows rows={10} columns={6} />}
>
  {(rows) => <StudentsTable rows={rows} />}
</ListLoadBoundary>
```

### 2.2 分佈入場 — `StaggerList`

**全站預設（2026-08）：** 單項 `600ms`、位移 `16px`、項間 `90ms`、最多延遲 `1080ms`（約 12 項）。常數見 `STAGGER_DEFAULT_MS`／`STAGGER_MAX_DELAY_MS`。

```tsx
import {
 StaggerList,
 StaggerItem,
 StaggerTableBody,
 StaggerStack,
 StaggerUl,
 StaggerRows,
} from "@/components/ui/stagger-list"

// 卡片／畫廊／手機列表
<StaggerList as="ul">
 {items.map((item) => (
  <StaggerItem key={item.id} as="li">
   <StudentCard student={item} />
  </StaggerItem>
 ))}
</StaggerList>

// 桌面表格（共用 StudentsListTable / ClassesListTable 已內建）
<StaggerList as="tbody">
 {rows.map((r) => (
  <StaggerItem key={r.id} as="tr" className="...">
   ...
  </StaggerItem>
 ))}
</StaggerList>

// shorthand：`StaggerTableBody`｜`StaggerStack`｜`StaggerUl`
// 陣列 helper：`StaggerRows`（listAs=tbody + itemAs=tr 預設）
```

- 僅在資料 **ready**（非 skeleton）時播放；`prefers-reduced-motion` 自動關閉。
- ✅ **全站資料列表**：表格 tbody、卡片 grid、ul 堆疊、accordion 列、聊天訊息。
- ❌ 日曆／時間表 **格子**（RoomBooking 週視圖、DayView 時段格）、靜態 nav／選項 chip。
- 高密度列表仍套用，但 `maxDelayMs` 會 cap 後段項目不會無限延遲。

### 2.3 按鈕加載態 — `Button loading`

```tsx
<Button loading={saving} loadingText="儲存中…" onClick={() => void submit()}>
  儲存
</Button>
```

- `loading=true` → 自動 `disabled` + `aria-busy="true"`。
- 左側 `Loader2` 淡入；文案 crossfade，避免寬度跳動。
- 詳見 [`UI_DESIGN_INSTRUCTIONS.md`](./UI_DESIGN_INSTRUCTIONS.md) §2。

### 2.4 無窮滾動 — `useInfiniteScroll`

```tsx
const { sentinelRef, loadingMore } = useInfiniteScroll({
  onLoadMore: () => load(offset + PAGE_SIZE, true),
  hasMore: rows.length >= PAGE_SIZE,
  disabled: loading,
})

<LoadMoreFooter
  ref={sentinelRef}
  hasMore={hasMore}
  loadingMore={loadingMore}
  totalShown={rows.length}
  onManualLoad={loadMore}
/>
```

- 模式 A：已有 offset 分頁，升級 sentinel（SystemLogs、SystemIssues）。
- 模式 B：服務層新增 `limit/offset`（Students、PaymentHistory、Inbox）。

---

## 3. 頁面適用矩陣

圖例：**高** = 第一批 · **中** = 第二批 · **低** = 可選 · **—** = 不建議 · **已有** = 部分實作

### 首頁與導覽

| 路由 | 骨架流光 | 分佈入場 | 按鈕 loading | 無窮滾動 |
|------|---------|---------|-------------|---------|
| `/Home` | **高** | **中** | **高** | 低 |
| `/AllFeatures` | — | **中** | — | — |
| `/Login` | 低 | — | **高** | — |
| `/Settings` | 低 | — | **中** | — |

### 日常工作

| 路由 | 骨架 | 入場 | 按鈕 | 無窮 |
|------|------|------|------|------|
| `/FrontDeskWizard` | 低 | 低 | **高** | — |
| `/TomorrowReminders` | **高** | **高** | **中** | 低 |
| `/Attendance` | **中** | **中** | **高** | — |
| `/Inbox` | **高** | **高** | **高** | **高** |
| `/ScriptLibrary` | **中** | **高** | **中** | 低 |

### 學生與報讀

| 路由 | 骨架 | 入場 | 按鈕 | 無窮 |
|------|------|------|------|------|
| `/Students` | **高** | **高** | **高** | **高** |
| `/Students/:id` | **高** | 低 | **高** | — |
| `/PortalEnrollmentRequests` | **高** | 低 | **中** | **中** |
| `/EnrollmentChanges` | **高** | 低 | **中** | **中** |
| `/TrialSessions` | **高** | 低 | **中** | **中** |
| `/PrivateTutoring` | **高** | **高** | **高** | **中** |
| `/EnrollmentReports` | **中** | 低 | **中** | — |
| `/SecondaryAttendanceReport` | **中** | 低 | **中** | — |
| `/LessonBalanceMismatch` | **高** | 低 | **中** | **中** |
| `/PromotionMatch` | **中** | **高** | **中** | — |
| `/ContactUpdateCampaign` | **高** | **中** | **高** | **高** |

### 班別與老師

| 路由 | 骨架 | 入場 | 按鈕 | 無窮 |
|------|------|------|------|------|
| `/Classes` | **高** | **高** | **高** | **中** |
| `/Classes/:id` | **高** | 低 | **高** | — |
| `/Teachers` | **高** | **高** | **中** | 低 |
| `/Teachers/:id` | **中** | 低 | **高** | — |
| `/TeacherAvailability` | **高** | 低 | **中** | — |
| `/Courses` | **高** | 低 | **中** | — |
| `/Classrooms` | **中** | 低 | **中** | — |

### 排程與出席

| 路由 | 骨架 | 入場 | 按鈕 | 無窮 |
|------|------|------|------|------|
| `/Schedule` | **高** | **中** | **高** | **中** |
| `/Schedule/:id` | **中** | — | **高** | — |
| `/AcademicCalendar` | **中** | 低 | **中** | — |
| `/TeacherTimetable` | **已有** | 低 | **中** | **高** |
| `/TeachingRecords` | **中** | **高** | **中** | 低 |
| `/LeaveManagement` | **高** | **高** | **高** | **中** |
| `/RoomBooking` | **中** | 低 | **高** | — |
| `/RoomBookingAdmin` | **高** | 低 | **中** | — |
| `/AttendanceRecords` | **高** | 低 | **中** | **中** |

### 財務與計糧

| 路由 | 骨架 | 入場 | 按鈕 | 無窮 |
|------|------|------|------|------|
| `/Payments` | **中** | — | **高** | — |
| `/PaymentHistory` | **高** | 低 | **中** | **高** |
| `/PaymentCorrection` | **中** | — | **高** | — |
| `/PaymentDiscounts` | **高** | 低 | **中** | 低 |
| `/ReferralRebates` | **高** | 低 | **中** | 低 |
| `/Payroll` | **高** | 低 | **高** | 低 |

### 分析與系統

| 路由 | 骨架 | 入場 | 按鈕 | 無窮 |
|------|------|------|------|------|
| `/MgmtDashboard` | **高** | 低 | **高** | — |
| `/StaffPerformance` | **高** | 低 | **高** | — |
| `/HkExpenses` | **中** | 低 | **中** | — |
| `/Apo` | 低 | **中** | **高** | **高** |
| `/AiReports` | 低 | — | **高** | — |
| `/Users` | **中** | **medium** | **高** | — |
| `/SystemIssues` | **高** | 低 | **中** | **高** |
| `/SystemLogs` | **高** | 低 | **中** | **高** |

---

## 4. 分階段落地

### Phase 0 — 元件地基
- `Skeleton` 系列、`StaggerList`、`Button loading`、`useInfiniteScroll`
- Tailwind `skeleton-shimmer` keyframes
- 本文件 + `UI_DESIGN_INSTRUCTIONS.md` §2 補充

### Phase 1 — 高感知頁
Students、Classes、Schedule、PaymentHistory、LeaveManagement、PrivateTutoring、Inbox、SystemLogs、SystemIssues、Login

### Phase 2 — 儀表板與老師端
TeacherHome、TeacherTimetable、MgmtDashboard、StaffPerformance、HkExpenses

### Phase 3 — 服務層分頁
`fetchStudentsPage`、`fetchPaymentsPage`、`fetchInboxFeedPage`

---

## 5. 驗收清單

- [ ] `npm run build` 通過
- [ ] `npm run lint` 通過
- [ ] `npm run ui:check` 通過
- [ ] macOS／iOS `prefers-reduced-motion: reduce` 下骨架為 pulse、入場無 stagger
- [ ] 按鈕 loading 時不可重複送出；`aria-busy` 正確
- [ ] 無窮滾動到底顯示「已顯示全部 N 筆」
- [ ] 排程人數欄 roster 未齊仍為 skeleton，非 0

---

## 6. 相關文件

| 用途 | 路徑 |
|------|------|
| 按鈕／錯誤互動 | `docs/meta/UI_DESIGN_INSTRUCTIONS.md` |
| 老師端 skeleton P0 | `docs/product/plans/2026-07-22-teacher-schedule-load-skeleton.md` |
| List 狀態契約 | `src/lib/listLoad.ts` |
