# 學生詳情老師加固 — 獨立審閱（2026-08-01）

| 欄位 | 值 |
| --- | --- |
| 審閱日期 | 2026-08-01 |
| 審閱範圍 | [審計報告](./2026-08-01-student-detail-teacher-exposure.md) ＋ [實作計劃](../plans/2026-08-01-student-detail-teacher-hardening.md) |
| 審閱人 | Claude Code（獨立審閱，非原報告作者） |
| 審閱方法 | 程式碼盤點（`StudentDetailView.tsx`、`studentQueries.ts`、`mgmtRole.ts`）＋文檔對照 |
| 性質 | 審閱意見，供 Cursor 實作時參考；**非**替代原計劃 |
| 回應 | [2026-08-01-student-detail-teacher-review-response.md](./2026-08-01-student-detail-teacher-review-response.md)（待審閱再答） |

---

## 總評

審計報告到達路徑、暴露面、RLS 對照都盤點得清楚。實作計劃方向正確——單一旗標 `isMgmtStaff()`、先停 fetch 再藏 UI、保留路由策略唔鎖死整頁。以下係審閱發現既 **8 個潛在問題／gap**，按風險排序。

---

## 1. `reloadSubs` 係 monolithic function —— 拆唔乾淨會持續漏 data

**檔案**：`src/components/students/StudentDetailView.tsx` line 371-383

```ts
const reloadSubs = useCallback(async () => {
  if (!sid) return
  const settled = await Promise.allSettled([
    fetchEnrollmentsForStudent(sid),   // [0]
    fetchPaymentsForStudent(sid),       // [1] ⚠️ 老師唔應該 call
    fetchAttendanceForStudent(sid),     // [2]
    fetchLeaveForStudent(sid),          // [3]
    fetchUpcomingSchedulesForStudent(sid, localTodayYmd()), // [4]
    fetchStudentActivity(sid),          // [5] ⚠️ 內含 payment 查詢
    fetchRelativesForStudent(sid),      // [6]
    fetchTotalPaidLessonsForStudent(sid), // [7] ⚠️ 老師唔應該 call
    fetchLessonBalancesForStudent(sid), // [8] ⚠️ 含已繳堂數等金錢衍生
  ])
  // ...
  setPayments(pick(1, []))             // ⚠️ 寫入 payment state
  setTotalPaidLessons(pick(7, null))   // ⚠️ 寫入 totalPaidLessons state
  // ...
}, [sid])
```

**問題**：`reloadSubs` 被大量操作呼叫（delete attendance、update enrollment、withdraw、update pending lesson 等）。即使 initial load 停咗 payment fetch，每次操作後 `reloadSubs` 都會重新打晒 9 個 API，包括 3 個老師唔應該 call 既 fetch。

**建議**：

```ts
const isStaff = isMgmtStaff()

const reloadSubs = useCallback(async () => {
  if (!sid) return
  const fetchers: Promise<unknown>[] = [
    fetchEnrollmentsForStudent(sid),
    isStaff ? fetchPaymentsForStudent(sid) : Promise.resolve([]),
    fetchAttendanceForStudent(sid),
    fetchLeaveForStudent(sid),
    fetchUpcomingSchedulesForStudent(sid, localTodayYmd()),
    fetchStudentActivity(sid, { includePayments: isStaff }), // 見 §2
    fetchRelativesForStudent(sid),
    isStaff ? fetchTotalPaidLessonsForStudent(sid) : Promise.resolve(null),
    isStaff ? fetchLessonBalancesForStudent(sid) : Promise.resolve([]),
  ]
  // ... 其餘不變
}, [sid, isStaff])
```

**風險**：若唔改 `reloadSubs`，老師每次操作（如睇 attendance）都會觸發 payment API call，違反 R1-c「老師角色唔呼叫付款相關 fetch」。

---

## 2. `fetchStudentActivity` 內嵌 payment 查詢 —— 更動紀錄會漏金額

**檔案**：`src/services/studentQueries.ts` line 1803-1897

```ts
export async function fetchStudentActivity(studentId: string): Promise<HistoryRow[]> {
  // ...
  const [hist, pays, enrs, evWithdraw] = await Promise.all([
    // status history
    supabase.from("student_status_history")...,
    // ⚠️ 直接 query payments table
    supabase.from("payments")
      .select("id, total_amount, payment_method, status, payment_date, created_at")
      .eq("student_id", studentId)...,
    // enrollments
    supabase.from("student_class_enrollments")...,
    // withdrawals
    supabase.from("enrollment_change_events")...,
  ])
  // ⚠️ 組出 kind: "payment" 既 row，標題含金額
  if (!pays.error && pays.data) {
    for (const r of pays.data) {
      items.push({
        kind: "payment",
        title: `繳費 HKD $${amt.toLocaleString("zh-Hant-TW")}`, // ⚠️ 金額曝光
        // ...
      })
    }
  }
}
```

**問題**：即使 `reloadSubs` 唔 call `fetchPaymentsForStudent`，`fetchStudentActivity` 自己會 query `payments` table 並組出含金額既 history row。老師睇「更動紀錄」tab 會見到 `繳費 HKD $XXX`。

**建議**：加 optional parameter：

```ts
export async function fetchStudentActivity(
  studentId: string,
  opts?: { includePayments?: boolean }
): Promise<HistoryRow[]> {
  const includePayments = opts?.includePayments ?? true
  // ...
  const fetchers: Promise<unknown>[] = [
    supabase.from("student_status_history")...,
    includePayments
      ? supabase.from("payments")...
      : Promise.resolve({ data: [], error: null }),
    // ...
  ]
}
```

然後 UI 層：`fetchStudentActivity(sid, { includePayments: isStaff })`。

**風險**：若唔改，更動紀錄 tab 對老師仍然顯示付款金額（違反 R1-g）。

---

## 3. `fetchLessonBalancesForStudent` 既「已繳」欄位 —— 金錢衍生但混雜教學資訊

**檔案**：`StudentDetailView.tsx` line 1877-1985（balance card 渲染）

```tsx
{bal ? (
  <div className={cn(...)}>
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span>已繳 <strong>{bal.paidLessons}</strong> 堂</span>        {/* ⚠️ 金錢 */}
      <span>已綁排程 <strong>{bal.boundLessons}</strong> 堂</span>   {/* ⚠️ 金錢衍生 */}
      <span>待補 <strong>{bal.pendingLessons}</strong> 堂</span>       {/* 教學資訊 */}
      <span>請假待安排 <strong>{bal.leaveAwaitingMakeupCount}</strong> 堂</span> {/* 教學資訊 */}
    </div>
    {/* ... gap analysis tag 亦依賴 paidLessons > 0 */}
  </div>
) : null}
```

**問題**：`paidLessons`（已繳）、`boundLessons`（已綁排程）屬於金錢衍生，但 `pendingLessons`（待補）、`leaveAwaitingMakeupCount`（請假待安排）係教學資訊。如果成個 balance card 隱藏，老師會損失「請假待安排幾多堂」呢個有用訊號。

**建議**：對非 staff 顯示精簡版 balance card——只出教學資訊 row：

```tsx
{bal ? (
  <div className={cn(...)}>
    {isStaff ? (
      // 完整版：已繳、已綁、待補、請假待安排
      <>
        <span>已繳 <strong>{bal.paidLessons}</strong> 堂</span>
        <span>已綁排程 <strong>{bal.boundLessons}</strong> 堂</span>
        <span>待補 <strong>{bal.pendingLessons}</strong> 堂</span>
        <span>請假待安排 <strong>{bal.leaveAwaitingMakeupCount}</strong> 堂</span>
      </>
    ) : (
      // 老師版：只出教學資訊
      <>
        <span>待補 <strong>{bal.pendingLessons}</strong> 堂</span>
        <span>請假待安排 <strong>{bal.leaveAwaitingMakeupCount}</strong> 堂</span>
      </>
    )}
    {/* gap analysis tag 對老師只基於 leaveAwaitingMakeupCount */}
  </div>
) : null}
```

同埋確認：老師版既 `fetchLessonBalancesForStudent` 如果 RLS 擋咗 `paidLessons` / `boundLessons` 既數據源，呢兩個 field 會自然係 0／null，UI 層仍要攔截顯示。

---

## 4. 「前往請假管理」link 有兩處 —— R2-d 要兩邊都改

**檔案**：`StudentDetailView.tsx`

| 位置 | Line | 而家 | 建議老師行為 |
| --- | --- | --- | --- |
| Balance card 內 | 1939-1941 | `<Link to={/LeaveManagement?studentId=...}>` | 改為 `onClick={() => setTab("leave")}` |
| Leave list item | 2709-2711 | `<Link to={/LeaveManagement?...}>` | 保留 link 但可能需評估：老師 click 入去會撞 `RequireMgmtRoles` guard → placeholder。**建議同樣改為切去本頁 leave tab** |

兩處都要檢查，否則老師 click link 會撞 guard / placeholder。

---

## 5. `VoidPaymentDialog` unconditional render —— 防呆不足

**檔案**：`StudentDetailView.tsx` line 2265-2273

```tsx
{/* ⚠️ 唔係包喺 tab === "payments" 內，係 component root level */}
<VoidPaymentDialog
  open={voidPayOpen}
  target={voidPayTarget}
  onOpenChange={(open) => {
    setVoidPayOpen(open)
    if (!open) setVoidPayTarget(null)
  }}
  onVoided={() => void reloadSubs()}
/>
```

**問題**：trigger（「作廢」button）喺 payments tab 內，老師正常唔會見到。但如果 state `voidPayOpen` 因為任何殘餘邏輯變 `true`，dialog 會照彈。屬低風險但防呆不足。

**建議**：加 `canViewMoney` guard：

```tsx
{canViewMoney && (
  <VoidPaymentDialog ... />
)}
```

---

## 6. 未列入計劃但老師可見既 write-action button

審閱時發現以下 button 對老師顯示，但原計劃歸入「刻意延後」或未提及。下表整理供 Cursor 判斷是否需要本票一併處理：

| Button | Line | 功能 | RLS 現況 | 建議 |
| --- | --- | --- | --- | --- |
| 「記錄待補堂」 | 1822 | `openPendingDialog(e)` → `insertPendingLesson` | 待確認 | 若 RLS 已擋 write → 本票可藏 button；否則必須藏 |
| 「更改報讀形式」 | 1830 | `openEditEnrollmentForm(e)` → `updateEnrollmentPeriod` | 待確認 | 同上 |
| 「標為已安排」 | 1960 | `updatePendingLessonStatus(p.id, "已安排")` | 待確認 | 同上 |
| 「新增報讀」 | 1194 | `setEnrollKindOpen(true)` | Phase C enrollment write mgmt only | 原計劃 deferred；RLS 已擋，優先級低 |
| 「退讀」 | 1846 | `setWithdrawOpen(true)` | mgmt only | 原計劃 deferred |
| 「手誤清除」 | 1864 | `onPurgeMistakenEnrollment(e)` | mgmt only | 原計劃 deferred |
| 「儲存變更」（基本資料） | 基本資料 tab | `updateStudent` | RLS 老師通常無法 UPDATE | 原計劃 deferred |

**建議**：至少「記錄待補堂」同「更改報讀形式」要確認 RLS 狀態。如果 RLS 已擋 write，可以本票藏 button（避免老師以為做到）；如果 RLS 未擋，就係 P0 要即刻收。

---

## 7. 驗收標準缺少具體 regression test case

原計劃 §4 同報告 §5 既驗收係人手對照 checklist，但冇列具體 test scenario。建議最少補以下：

- [ ] Teacher deep-link `/Students/:id` → 無「繳費紀錄」tab
- [ ] Teacher 手動改 URL `?tab=payments` → redirect 到 `basic` 或 `attendance`
- [ ] Teacher browser DevTools Network tab → 無任何對 `payments` table 既 API call
- [ ] Teacher 睇 enrollment card → 無 `每節 HKD $XXX`
- [ ] Teacher 睇 balance card → 有「請假待安排」「待補」，無「已繳」「已綁」
- [ ] Teacher 睇 leave tab → 有請假列表，無「新增請假」button
- [ ] Teacher 睇更動紀錄 → 無 `繳費 HKD $XXX` 類 entry
- [ ] Admin 開同一學生 → 所有 tab／button 仍然存在（對照組）
- [ ] Teacher 開 `TeacherLeaveWizard` → 功能正常，不受影響
- [ ] Mobile 同 Desktop 兩個 view 都生效

---

## 8. 其他 minor notes

### 8.1 `canDeleteAttendance` 已存在 —— 命名可能混淆

`StudentDetailView.tsx` line 308 已有 `const canDeleteAttendance = isMgmtStaff()`。新增既 `isStaff` / `canViewMoney` / `canMutateLeave` 會同佢並列。建議統一命名風格：

```ts
const isStaff = isMgmtStaff()              // admin | alien
const canDeleteAttendance = isStaff        // 保留相容
const canViewMoney = isStaff               // R1
const canMutateLeave = isStaff             // R2
```

### 8.2 Tab state from URL parameter 要加 guard

Line 220-233 既 `useEffect` 會從 `?tab=` query param 設定 initial tab。G-1 話要加 `activeTab === "payments" && !canViewMoney` 重置，但要確保呢個 check 喺 `useEffect` 內（initial load）同 `setTab` 時（runtime switch）都生效。

### 8.3 `totalPaidLessons` state 對老師永遠 null

如果 `reloadSubs` 對老師 skip `fetchTotalPaidLessonsForStudent`，`totalPaidLessons` state 會保持 null。呢個本身 safe（line 2281 已有 `!= null` guard），但要確保冇其他 code path 依賴佢非 null。

---

## 改動檔案 summary

| 檔案 | 改動 |
| --- | --- |
| `src/components/students/StudentDetailView.tsx` | 主力：加 `isStaff`、filter TABS、conditional fetch、藏 UI element |
| `src/services/studentQueries.ts` | `fetchStudentActivity` 加 `includePayments` optional param |
| （可選）`src/services/pendingLessonQueries.ts` | 若「記錄待補堂」要 service-layer guard |

無需 migration、無需改 RLS、無需改路由。

---

## 審閱結論

實作計劃方向正確，但 **§1（`reloadSubs`）同 §2（`fetchStudentActivity`）係必須處理既 gap**——如果只跟原計劃逐點改而忽略呢兩個 data flow，老師仍然可以透過操作 reload 同更動紀錄 tab 見到金錢資料。其餘 §3–§6 係改善建議，可按 priority 決定是否本票一併處理。
