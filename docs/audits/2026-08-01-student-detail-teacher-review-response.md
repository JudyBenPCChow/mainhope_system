# 學生詳情老師加固 — 審閱回應（2026-08-01）

| 欄位 | 值 |
| --- | --- |
| 日期 | 2026-08-01 |
| 性質 | 原報告／計劃側對獨立審閱嘅**回應建議**；供審閱再答 |
| 對象 | [獨立審閱](./2026-08-01-student-detail-teacher-review.md) |
| 前序 | [暴露報告](./2026-08-01-student-detail-teacher-exposure.md) · [實作計劃](../plans/2026-08-01-student-detail-teacher-hardening.md) |
| 跟進 | [role-ops-hardening.md](../backlog/role-ops-hardening.md) R1／R2 |
| 狀態 | **待審閱回覆**；本檔**唔**直接改 code／計劃正文 |

---

## 總評

獨立審閱有用：指出原計劃若只「藏 UI／停初載」而忽略 `reloadSubs` 與 `fetchStudentActivity` 內嵌付款查詢，R1 會漏。  
**§1、§2 必須併入實作**；§3–§5、§7–§8 多數採納。  
有一處內部矛盾要修正（§1 skip 成個 lesson balances vs §3 要老師見待補／請假待安排）——見下方「關鍵修正」。

---

## 逐點回應

| 審閱 | 判決 | 回應 |
| --- | --- | --- |
| **§1** `reloadSubs` 一體打 9 API | **修正採納** | 同意必須喺 `reloadSubs`（唔止初載）按角色分支。**但**唔採納「老師整段 skip `fetchLessonBalancesForStudent`」——見關鍵修正 |
| **§2** `fetchStudentActivity` 內嵌 payments | **採納** | 加 `opts?: { includePayments?: boolean }`；老師傳 `includePayments: false`；預設 `true` 保 admin／alien |
| **§3** 餘額卡精簡版 | **採納** | 老師只顯示「待補」「請假待安排」；藏「已繳」「已綁」；gap tag 對老師唔用 `paidLessons` |
| **§4** 「前往請假管理」兩處 | **採納** | Balance card（~1939）同 leave list item（~2709）兩邊都改：老師 `setTab("leave")`，唔再 `Link` 去 `/LeaveManagement` |
| **§5** `VoidPaymentDialog` 根層 render | **採納** | `canViewMoney && <VoidPaymentDialog … />` |
| **§6** 未列計劃嘅寫入掣 | **部分採納 → 擴大本票** | RLS 已核：pending／enrollment 老師僅 SELECT。建議本票一併藏假開放寫入掣；電話仍延後。見 §「§6 定調」 |
| **§7** 具體驗收 scenario | **採納** | 審閱列出嘅 checklist 併入計劃驗收（含 Network 無 payments、`?tab=payments` fallback、手機／桌面） |
| **§8** 命名／URL tab／null 安全 | **採納** | 統一 `isStaff` → `canViewMoney`／`canMutateLeave`／`canDeleteAttendance`；`?tab=` 初載同 runtime 都要擋 `payments` |

---

## 關鍵修正：§1 建議碼 vs §3

審閱 §1 示例：

```ts
isStaff ? fetchLessonBalancesForStudent(sid) : Promise.resolve([]),
```

同 §3「老師要見待補／請假待安排」**互相矛盾**——skip 成個 fetch 會令精簡餘額卡無資料。

### 回應定調（請審閱確認）

| Fetch | 老師 | Staff |
| --- | --- | --- |
| `fetchPaymentsForStudent` | **唔 call**（`Promise.resolve([])`） | call |
| `fetchTotalPaidLessonsForStudent` | **唔 call**（`Promise.resolve(null)`） | call |
| `fetchStudentActivity` | `includePayments: false` | `includePayments: true`（或預設） |
| `fetchLessonBalancesForStudent` | **仍 call** | call |
| 其餘（enrollments／attendance／leave／schedules／relatives） | 仍 call | call |

金錢唔見靠：**停付款相關 fetch ＋ UI 唔 render 已繳／已綁／單價／繳費 tab**；唔靠「唔拉餘額」。

建議 `reloadSubs` 形狀（示意）：

```ts
const isStaff = isMgmtStaff()

const fetchers: Promise<unknown>[] = [
  fetchEnrollmentsForStudent(sid),
  isStaff ? fetchPaymentsForStudent(sid) : Promise.resolve([]),
  fetchAttendanceForStudent(sid),
  fetchLeaveForStudent(sid),
  fetchUpcomingSchedulesForStudent(sid, localTodayYmd()),
  fetchStudentActivity(sid, { includePayments: isStaff }),
  fetchRelativesForStudent(sid),
  isStaff ? fetchTotalPaidLessonsForStudent(sid) : Promise.resolve(null),
  fetchLessonBalancesForStudent(sid), // 老師仍拉；UI 精簡顯示
]
```

---

## §6 寫入掣定調

### RLS 核實（回應撰寫時）

| 表／動作 | 老師 | 依據 |
| --- | --- | --- |
| `student_pending_lessons` | **SELECT only**；INSERT／UPDATE／DELETE 僅 `is_mgmt_staff()` | `20260716120000_student_pending_lessons.sql` |
| `student_class_enrollments` | Phase C **SELECT only** | `20260615190000_rls_phase_c_admin_alien_split.sql` |
| `students` UPDATE | 通常 mgmt only | Phase B／C 既有政策 |

→ 審閱表內寫入掣對老師屬**假開放**（UI 有、DB 會失敗），同類於 R1／R2 誤導問題；**唔係**未擋寫入嘅 P0 洞。

### 建議本票一併藏（同一 `isStaff`）

| Button | 老師 |
| --- | --- |
| 記錄待補堂 | 藏 |
| 更改報讀形式 | 藏 |
| 標為已安排 | 藏 |
| 新增報讀（含 header／dialog） | 藏 |
| 退讀 | 藏 |
| 手誤清除 | 藏 |
| 基本資料「儲存變更」／親友增刪 | 藏（唯讀瀏覽） |

旗標命名建議：`canMutateStudentOps = isStaff`（或沿用計劃草稿 `canManageEnrollmentWrites`，涵蓋基本資料寫入）。

### 仍延後（本票唔做）

- 家長電話／地址／備註**欄位**對老師全面隱藏（原 backlog「暫不做」）
- 改 RLS、整頁 `RequireMgmtRoles`、動老師請假精靈

### 請審閱二選一（回覆用）

- **A（回應建議）**：本票一併藏上表寫入掣  
- **B**：§6 全部下一票；本票只做金錢＋請假（§1–§5／§7／§8＋餘額精簡）

---

## 建議修訂後實作範圍（待審閱打勾）

實作前會把以下寫入計劃修訂版（**審閱回覆後**先改計劃，再改 code）：

- [ ] §1 修正版 `reloadSubs`（付款／總繳堂數按角色；**balances 仍拉**）
- [ ] §2 `fetchStudentActivity(..., { includePayments })`
- [ ] R1：藏 payments tab、單價、已繳／已綁；VoidDialog guard
- [ ] R2：藏新增請假；兩處 LeaveManagement link → 本頁 leave tab
- [ ] §3 餘額精簡卡
- [ ] §7 驗收 scenario 全文
- [ ] §8 `isStaff` 命名＋`?tab=payments` 雙重 guard
- [ ] §6：**待審閱選 A 或 B**

檔案預期仍係：`StudentDetailView.tsx` ＋ `studentQueries.ts`（`fetchStudentActivity`）；無 migration。

---

## 請審閱回覆

請直接答下列項（同意／反對／改寫均可）：

1. **§1 vs §3**：同意「老師仍 `fetchLessonBalancesForStudent`，只 UI 精簡」？  
2. **§6**：選 **A**（本票藏寫入掣）定 **B**（延後）？  
3. **§4**：兩邊請假 link 都改 `setTab("leave")`——同意？  
4. 有無其他要加／要刪先至開工？

回覆可寫喺本檔下方「審閱回覆」節，或另開 `…-review-02.md`。

---

## 審閱回覆

### 1. §1 vs §3：同意「老師仍 `fetchLessonBalancesForStudent`，只 UI 精簡」

**同意**。回應正確指出我 §1 sample code 有矛盾——skip 成個 `fetchLessonBalancesForStudent` 會令精簡餘額卡無資料。修正方案合理：老師照拉 balances，金錢防護靠 UI 層唔 render `paidLessons`／`boundLessons`。

**一點補充**：`fetchLessonBalancesForStudent` 底層如果 RLS 已擋 `paidLessons`／`boundLessons` 既數據源（payment_details 等），呢兩個 field 會自然歸 0／null。咁 gap analysis tag 既邏輯 `bal.paidLessons > 0 ? ... : ...` 對老師會永遠跌入 else branch（「尚未有該班已收款堂數」）。建議 gap tag 都跟角色精簡——老師只顯示 `leaveAwaitingMakeupCount > 0` 既 warning，唔出「堂數一致／尚差 X 堂」等依賴 `paidLessons` 既判斷。

### 2. §6：選 A（本票一併藏寫入掣）

**選 A**。理由：

- RLS 已核實擋晒呢啲 write——同 R1/R2 一樣係「假開放」UI 問題，唔係新洞
- 全部都係同一個 pattern（加 `isStaff` condition），實作成本低
- 同 R1/R2 一齊做避免遺漏，減少後續 audit round-trip
- 新增既 `canMutateStudentOps`（或 `canManageEnrollmentWrites`）語意清晰，唔會混淆

旗標命名我建議用 **`canMutateStudentOps`**，因為佢涵蓋 enrollment writes + basic info writes + pending lesson writes，比 `canManageEnrollmentWrites` 更準確。最終三個旗標：

```ts
const isStaff = isMgmtStaff()
const canViewMoney = isStaff          // R1: payments tab、單價、已繳/已綁顯示
const canMutateLeave = isStaff        // R2: 新增請假 button/dialog
const canMutateStudentOps = isStaff   // §6: 記錄待補堂、更改報讀、標為已安排、新增報讀、退讀、手誤清除、儲存基本資料
```

### 3. §4：同意兩邊請假 link 都改 `setTab("leave")`

**同意**。對於老師：

| 位置 | 原行為 | 新建議 |
| --- | --- | --- |
| Balance card「前往請假管理」（~1939） | `<Link to=/LeaveManagement>` | `onClick={() => setTab("leave")}` |
| Leave list item（~2709） | `<Link to=/LeaveManagement>` | `onClick={() => setTab("leave")}` |

Admin／alien 保持原 `<Link>` 行為不變。兩個 link 都要包 `isStaff` condition。

### 4. 有無其他要加／要刪先至開工？

**無其他追加**。回應已經 cover 晒我審閱既 8 點，修正咗 §1/§3 矛盾，擴大 §6 範圍合理。以下係開工前最終確認：

- 改動範圍：`StudentDetailView.tsx`（主力）＋ `studentQueries.ts`（`fetchStudentActivity` 加 `includePayments` param）
- 無 migration、無 RLS 改動、無路由改動
- 三個旗標：`canViewMoney` / `canMutateLeave` / `canMutateStudentOps`，全部 derive 自 `isStaff`
- 老師仍拉 `fetchLessonBalancesForStudent`，UI 精簡顯示
- Gap analysis tag 跟角色精簡（上文 §1 補充）
- 驗收 checklist 跟 §7，加埋 Network tab 檢查

**可以開工。**

### 實作備註（2026-08-01 Cursor）

已按本回覆落 code：`StudentDetailView.tsx`＋`studentQueries.ts`；計劃狀態改「已落 code」；backlog 主題移已完成。
