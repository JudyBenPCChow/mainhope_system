# 計糧引擎 — 設計前置問題

> 日期：2026-08-01  
> 用途：交給 Cursor，請它從現有 codebase 與文檔中回答以下問題。能從 code/docs 判斷的就直接回答；無法判斷的標記「需人手確認」並給出最合理的預設建議。  
> 規則文檔：`~/Desk/計糧系統規則說明.md`（尚未納入 repo，請先閱讀）  
> 回答後，下一輪直接開工。

---

## A. 可從 codebase / 現有文檔判斷（請 Cursor 確認）

### A1. 代堂歸屬的影響範圍

backlog `docs/backlog/substitute-teacher-reporting.md` 指出計薪 query 仍用 `classes.teacher_id` 而非 `schedules.teacher_id`。

- 請 grep 所有使用 `classes.teacher_id` 做「教師課堂統計」的 query/RPC/view（不限於計糧相關，包括出勤報表、中學出席統計等），列出檔案與行號
- 哪些需要改為 `schedules.teacher_id`？哪些需要同時保留兩者（例如「主責老師 vs 當日老師」並列顯示）？
- `schedules` 表的 `teacher_id` 欄位是否等於「當日實際授課老師」？代堂時這個欄位會被更新嗎？請確認 `scheduleSubstitute.ts` 的邏輯

### A2. 1on1 / 1on2 的識別方式

計糧規則中，1on1/1on2 有特殊計算（PT 導師 → 等效 3HC/4HC；Sum/Cyndi → 固定價）。

- `classes` 表有沒有欄位標記班型為 1on1 / 1on2？是什麼欄位？
- `student_class_enrollments` 的 enrollment count 是否可靠地反映班型？（例如：1on1 = 只有 1 個 enrollment？）
- 如果以 enrollment count 判斷，當 3 人班有 2 人請假變成 1 人出席時，會不會誤判為 1on1？
- 建議的判斷邏輯：**以 class 定義為準**（class type / enrollment count），還是**以當日實際出席 HC 為準**？兩者有何 tradeoff？

### A3. 功課班時數的數據來源

你之前說「點名紀錄就是工時證據」。請確認：

- `classes` 表如何區分「功課班」和「專科班」？（用什麼欄位？`class_kind`？值是什麼？）
- 功課班的 schedule 時長是否固定為 75 分鐘（一節）？
- 如果功課班有跨節的情況（例如連續兩節），attendance 紀錄會是一筆還是兩筆？
- 從 attendance 推導功課班工時的公式：`節數 × 1.25 小時` — 這個 1.25 小時是固定常數還是應從 schedule 時長推算？

### A4. 各科目學費收入 per class

Mark、Christine、Cyndi 的薪酬依賴「每班每月學費收入」。

- 現有 query 能否計算 per class per month 的學費收入？請看 `mgmtDashboardQueries.ts` 或相關 payment query
- 學費收入的定義：`payments.status = 'received'` 的金額？還是應收（不論是否已收）？
- 如果一個學生同時報讀多班，payment 能否拆分到個別 class？`payment_details` 表有沒有 `class_id` 欄位？

### A5. `classes.level_group` 區分初中／高中

PT 專科班 HC 費率分初中（中一至中三）和高中（中四至中六）。

- `classes` 表有沒有 `level_group` 或等價欄位？還是要從 `grade` 欄位推導？
- 如果從 grade 推導，grade 的值格式是什麼？（例如 `S1`, `S4`, `F1`, `F4`？）
- 請確認 grade 與 初中／高中 的 mapping

### A6. 現有 `salary_per_lesson` 欄位的處理

`teachers_private.salary_per_lesson` 目前 seed 值全為 $260。新計糧系統引入多模式費率表後：

- 這個欄位在哪些 query／RPC 中被使用？（請 grep）
- 新舊並行期間如何處理？建議：新費率表上線後，此欄位標 deprecated，但保留作 fallback 直到確認所有計薪 query 已遷移

### A7. `sumConsumedLessonValue` 的現狀

`mgmtDashboardQueries.ts` 中已有 `sumConsumedLessonValue()` 函數。

- 它的計算邏輯是什麼？讀取哪些表？
- 它計算的是「已賺取學費」（已上堂 × 每堂價值），還是其他定義？
- 是否可用於 Mark/Christine 的「全公司某科目總學費收入」計算？如果不夠，缺什麼？

### A8. 現有 dashboard filter 的 `subjectIds`

計劃指出 `subjectIds` 在 UI 可選但 query 未實際套用。

- 請確認 `fetchMgmtDashboard()` 或其他 dashboard query 是否有用 `subjectIds` 過濾數據
- 如果未套用，修正範圍有多大？

---

## B. 需從規則文檔推導（請 Cursor 分析）

### B1. 六種模式的 SQL 實作可行嗎？

閱讀 `~/Desk/計糧系統規則說明.md` §3-8。六種模式的計算邏輯是否全部可以用**單一 SQL function** 完成？

- 哪些模式需要 subquery（例如 Mark 需要「全公司數學科總收入」）？
- Christine 功課班抽成的觸發條件（「當月功課班總報名人數 ≥ 12 人」）— 文檔寫「報名人數」，SQL 中應理解為 unique students enrolled in 功課班 還是 attendance 總人次？哪個更合理？
- 跨角色加總（Leo、Judy）— 是否等於兩條獨立模式的結果 sum？

### B2. 規則文檔中的模糊處

以下邊界在規則文檔中沒有明確定義，請先標記「需人手確認」，並給出你認為最合理的預設建議：

| 問題 | 建議預設 |
|---|---|
| Sophie/Katie 月中加薪：用月初費率還是按日 pro-rata？ | 整月用月初有效費率；月中變更下月生效 |
| Mark 某月完全沒教班，仍抽 override 10%？ | 是（文檔寫「任何月份」，與個人教學收入無關） |
| 「其他」功課班教師 $100/hr — 這些人是否已在 `teachers` 表中？如不在，如何處理？ | 需人手確認；暫定 `payroll_rates` 留一個 `teacher_id IS NULL` 的 default rate |
| 費率變更的 effective_date 粒度：只到月份，還是可指定日期？ | 建議只到月份（每月 1 日生效），簡化實現 |

### B3. Golden test 的數據要求

規則文檔 §11 提供了完整計算範例（5 班 × 10 位教師）。

- 要在 SQL 中重現這個 golden test，需要哪些 seed 數據？
- 現有 seed.sql 能否直接產出相同結果？如果不夠，缺哪些數據？
- 建議：寫一個獨立的 `payroll_golden_test.sql`，插入 §11 的精確數據，然後 assert `calculate_payroll('2026-08-01')` 的輸出與文檔表格完全一致

---

## C. 需人手確認（無法從 codebase 判斷，標記後由 Mark/Christine 決定）

### C1. Cody WFH 工時

Cody 在家工作，沒有 attendance record。工時如何進入系統？

- 建議方案 A：`payroll_manual_hours` 表 + 簡單 UI（manager 每月人手輸入 Cody 的 WFH 時數）
- 建議方案 B：如果 Cody 有其他可追蹤的工作證據（例如交付了某份教材），能否用 task completion 代替時數記錄？
- 現階段先用 A，確認是否有其他老師也需要人手輸入（例如未來有新 WFH 角色）

### C2. Christine 功課班 ≥12 人條件

「當月功課班總報名人數 ≥ 12 人」中的「報名人數」：

- 選項 A：當月有報讀任何功課班的 unique student count
- 選項 B：功課班 attendance 總人次
- 建議選 A，因為最接近「報名人數」字面意思。請 Mark/Christine 確認

### C3. 費率機密性

`payroll_rates` 表包含每位老師的具體薪酬數字。

- 誰可以看？建議僅 alien 可編輯、manager 可讀、admin/teacher 不可見
- RLS 是否需要在 row level 也限制？（例如：manager 可看所有老師的費率，還是只能看彙總？）

---

## D. 開工前的決定

以下項目**必須**在本輪確認後才能正確開工。請 Cursor 逐項給出結論（能判斷的）或標記（需人手確認的）：

| # | 決策 | 狀態 |
|---|---|---|
| 1 | 1on1/1on2 以 class type 定義，非當日 HC | 待 Cursor 確認 A2 |
| 2 | 代堂歸屬修復範圍 | 待 Cursor 確認 A1 |
| 3 | 費率 effective_from 為每月 1 日 | 預設採納，除非 Mark/Christine 反對 |
| 4 | Cody WFH 人手輸入 | 預設方案 A，待確認 C1 |
| 5 | 學費收入 = payment status 'received' | 待 Cursor 確認 A4 |
| 6 | 功課班時數 = attendance 節數 × 1.25hr | 待 Cursor 確認 A3 |
| 7 | Christine ≥12 人 = unique enrolled students | 預設選項 A，待確認 C2 |
