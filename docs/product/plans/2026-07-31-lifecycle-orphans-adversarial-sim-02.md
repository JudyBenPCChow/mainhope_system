# 生命週期孤兒 — 顧問獨立對抗模擬（不寫 code）

> 角色：**外部技術顧問** ⚠️ 獨立對抗，不重複 Cursor 已覆蓋項  
> 對象：[`2026-07-31-lifecycle-orphans.md`](./2026-07-31-lifecycle-orphans.md)（含 #01–#04 定案 + A1/A2 切分）  
> 日期：2026-07-31  
> 方法：假設 A1（O1-audit → O1 → O6）已按定案落地，用惡意／並發／邊界操作戳洞。  
> 規則：不重複 Cursor 對抗模擬（`adversarial-sim.md`）已標的 ADV-P0-1、ADV-P1-1~8、ADV-P2-1~6；不重複第一性檢查（`first-principles.md`）的 FP-1~7。只報**新洞**。

---

## 總評

方案經過五輪（原始 + #01–#04 + Cursor 對抗 + 第一性）後極其紮實。本次獨立對抗挖出 **1 個 P0、3 個 P1、3 個 P2**，皆為前幾輪未覆蓋的邊界或組合場景。無結構性漏洞——方案的骨架是對的。

---

## 🔴 GAP-P0-1：eligibility 過濾中 `otherMakeup` 的 peers 展開存在邊界漏洞——已取消 schedule 上的 makeup 仍被計入保留列

**定案回顧**（方案第 88–102 行）：

```
otherMakeup = 同生其他 leave_makeup_records
  （排除本筆；makeup_schedule_id IS NOT NULL；status 非放棄／流失等終態）
保留 schedule =
  變更後仍可見之 enrollment 應到
  ∪ active trial
  ∪ otherMakeup.makeup_schedule_id（及其 peers 若該 makeup 綁連堂）
```

**對抗場景**：

1. 學生有 leave A（makeup 綁 S1，活躍）和 leave B（makeup 綁 S2，但 **S2 排程已被軟取消**，status = "取消"）
2. 取消 leave A → otherMakeup 包含 leave B 的 S2
3. S2 及其 peers 被加入保留列 → S2 上的 attendance 被保留（不刪）
4. 但 S2 已取消，該 attendance 本該是孤兒——學生不可能再出席已取消的堂

**根因**：`otherMakeup` 只看 leave record 的 status，不看**目標 schedule 的 status**。軟取消的 schedule 上的 makeup 不應保留。

**補丁建議**：

```
otherMakeup 保留 = otherMakeup
  .filter(leave status 非終態)
  .filter(makeup_schedule_id 對應的 schedule.status 不含「取消」且不含「完成」)
  .flatMap(makeup_schedule_id + its peers)
```

附帶效能注意：`otherMakeup` 的 peers 展開需批量查 `schedules` 表（`WHERE id IN (...)`），不能在 loop 內逐個 `await`（N+1 查詢炸彈）。

**優先級**：P0 — A1 開工前寫入方案。

---

## 🟠 GAP-P1-1：eligibility 中 enrollment 計算必須覆用既有 helper，獨立重寫會漏暑期／單堂邊界

**定案回顧**：eligibility 包含「變更後仍可見之 enrollment 應到」。

**對抗場景**：

現有 `buildStudentRegularAttendanceChecker`（`leaveQueries.ts:1001`）已正確實作暑期兩期（`enrollmentCoversPeriod`）、單堂選堂（`fetchEnrolledScheduleIdsByEnrollmentIds`）的過濾。如果 O1 的 eligibility 實作**獨立重寫**了 enrollment 判斷邏輯，可能漏掉：

- 暑期兩期班：學生只報第 1 期，makeup 綁第 2 期的堂 → 第 2 期不應由 enrollment 保留
- 單堂選堂：學生只選了特定幾堂，makeup 綁了沒選的堂 → 不應保留
- `enrollment_period` 為 null／格式異常 → 應 fallback 到寬鬆模式（視為全期）

**具體風險場景**：

1. 暑期兩期班，學生只報讀第 1 期。Makeup 綁在第 2 期的某堂。
2. 取消請假 → eligibility 自行計算 enrollment 應到，未正確處理 `enrollmentCoversPeriod`
3. 誤判「該生有 enrollment 應到」→ 第 2 期 attendance 被保留（不該保留）

**補丁建議**：O1 的 eligibility 實作**必須直接調用** `buildStudentRegularAttendanceChecker`（或提取其核心邏輯為 shared helper），不可獨立重寫 enrollment 判斷。方案中應明確指定覆用哪個既有函式。

**優先級**：P1 — A1 實作規範寫入方案。

---

## 🟠 GAP-P1-2：A1 期間的並發窗口比已知風險更大——`saveAttendanceStatus` 逐筆寫回

**定案回顧**：方案「已知限制」寫「A1 期間並發點名寫回（待 A2 O1-rollcall）」。但只提了 `confirmRollCall`。

**對抗場景**：

老師在點名紙上**逐個學生手動點名**（呼叫 `saveAttendanceStatus` 逐筆 upsert），同時行政執行 O1 刪除：

1. 老師打開點名紙 → 看到補堂生 Alice（leave 還在，roster 仍有她）
2. 行政執行 O1 刪除 leave → attendance 被刪
3. 老師在 UI 上對 Alice 點「現場」→ `saveAttendanceStatus` upsert
4. Alice 的 attendance **復活**，但 leave 已刪，沒有 makeup_schedule_id 對應

這和 `confirmRollCall` 的批次寫回是同一類問題，但觸發路徑是**逐筆儲存**而非整頁儲存。`saveAttendanceStatus` 沒有任何名冊檢查——只檢查 `student_id + class_id + attendance_date + schedule_id` 是否存在，存在就 update，不存在就 insert。

**補丁建議**：

A2 的 O1-rollcall 防護應同時覆蓋兩個入口：
- `confirmRollCall`（批次存檔前重拉名冊）
- `saveAttendanceStatus`（逐筆 upsert 前檢查 student 是否仍在名冊內）

或 A1 期間在已知限制中明確寫「逐筆點名（`saveAttendanceStatus`）與批次點名（`confirmRollCall`）皆有並發寫回風險」。

**優先級**：P1 — 方案已知限制補上逐筆路徑，或 A2 範圍明確含兩個入口。

---

## 🟠 GAP-P1-3（驗證通過，非漏洞）：連堂兩筆 leave 同綁一個 makeup，刪除順序不影響正確性

**場景**：

連堂整組請假兩筆 leave 都手動綁了同一個 `makeup_schedule_id = S99`。先刪哪一筆？

1. 刪 Leave A → scan peers(S99) → otherMakeup 含 Leave B 的 S99 → 保留 → 0 可刪列 → 不刪出席 ✅
2. Leave A 刪除，Leave B 仍在
3. 再刪 Leave B → scan peers(S99) → otherMakeup 為空 → 可刪列 > 0 → Confirm → 刪除 S99 出席 ✅

**判定**：方案已正確覆蓋（eligibility 過濾處理了 otherMakeup 交集）。**不需修改**。保留此項作為實作測試案例（S13）。

---

## 🟡 GAP-P2-1：`otherMakeup` 查詢時機——`update` 場景下須在修改前查

**場景**：行政**改調堂日**（`updateLeaveMakeupRecord`，`makeup_schedule_id` A→B）。

`otherMakeup` 查詢有兩個可能的時機：
- **修改後**查：本筆的 `makeup_schedule_id` 已是 B。otherMakeup 正確排除了本筆 id，B 不會被錯誤保留。✅
- **修改前**查：本筆的 `makeup_schedule_id` 仍是 A。otherMakeup 正確排除了本筆 id，A 不會被錯誤保留。✅

兩種時機都正確（因為排除條件用的是 record id，不是 schedule_id 的值）。

但方案未明確規範查詢時機。實作時可能直覺寫成「掃描前查 otherMakeup」（修改前），但需確保 forUpdate 路徑在修改前就 fetch 了 otherMakeup。

**補丁建議**：方案 `otherMakeup` 定義補一句：「查詢時機為**修改前**；排除本筆 record id。forDelete 與 forUpdate 邏輯相同。」

**優先級**：P2 — 實作時注意，不阻塞 A1。

---

## 🟡 GAP-P2-2：`active trial` 的定義未指定——需引用既有 helper

**定案回顧**：保留列包含 `active trial`。

**問題**：方案未定義哪些 trial status 算 active。現有程式碼中：
- `fetchTrialStudentsForSchedule`：排除「完成」和「取消」
- `activeTrialsForSchedules`：由 roster context 提供

O1 eligibility 若獨立實作 trial 過濾，可能與現有邏輯不一致。

**補丁建議**：方案明確引用 `scheduleRosterQueries` 中的 `activeTrialsForSchedules` 作為 active trial 定義來源，或寫明過濾條件（status 不含「完成」、不含「取消」）。

**優先級**：P2 — 實作時注意。

---

## 🟡 GAP-P2-3：Confirm 文案應列 formatted label 而非 raw `schedule_id`

**場景**：Confirm 文案列「2025-07-25 現場 · schedule_id: abc-123-def」。行政看到 UUID 無法對應到實際的「星期幾、幾點、哪班」，難以判斷該不該刪。

現有 `formatLeaveScheduleOptionLabel`（`leaveQueries.ts:610`）可產生「2025-07-25 14:00–15:30 · 數學 (MATH-S1) · 陳老師 · 連堂第 1 節」。

**補丁建議**：Confirm 文案規範明確要求列出 `scheduled_date + start_time–end_time + class_label + 節次`，調用既有 formatter。

**優先級**：P2 — UX 改善，不影響正確性。

---

## 模擬劇本（新增，不重複 Cursor S1–S12）

| # | 劇本 | 期望 | 結果 |
| --- | --- | --- | --- |
| S13 | 連堂兩筆 leave 同綁 S99，刪第一筆再刪第二筆 | otherMakeup 依序保護、最終正確清 | ✅ Pass |
| S14 | otherMakeup 的 makeup schedule 已被軟取消 | 已取消 schedule 的 makeup 不保留 | ❌ Fail 除非 GAP-P0-1 |
| S15 | 暑期兩期，學生只報第 1 期，makeup 綁第 2 期 | enrollment 不保留第 2 期 attendance | ⚠️ 依賴 GAP-P1-1 |
| S16 | 老師逐筆點名 Alice 為「現場」，同時 O1 刪 Alice 的 leave+attendance | attendance 被寫回复活 | ❌ A1 已知限制（GAP-P1-2） |
| S17 | `updateLeaveMakeupRecord` A→B，otherMakeup 查詢時機 | 正確排除本筆 | ✅ GAP-P2-1 補規範即可 |
| S18 | Confirm 文案列 raw UUID | 行政看不懂，誤判 | ⚠️ GAP-P2-3 UX 改善 |

---

## A1 開工前建議補入方案的事項

| 優先 | ID | 內容 |
| --- | --- | --- |
| **P0** | GAP-P0-1 | otherMakeup 排除已取消／已完成 schedule；batch 查 peers |
| **P1** | GAP-P1-1 | eligibility 覆用 `buildStudentRegularAttendanceChecker`，不獨立重寫 |
| **P1** | GAP-P1-2 | A1 已知限制補上逐筆 `saveAttendanceStatus` 並發寫回風險 |
| **P2** | GAP-P2-1 | otherMakeup 查詢時機規範（修改前、排除本筆 id） |
| **P2** | GAP-P2-2 | active trial 定義引用既有 helper |
| **P2** | GAP-P2-3 | Confirm 文案用 formatted label 非 raw UUID |

---

## 結論

| 問題 | 答案 |
| --- | --- |
| 方案骨架有結構性漏洞嗎？ | **沒有。** 五輪審閱後的方案骨架是正確的 |
| A1 可以開工嗎？ | **可以。** 補上 GAP-P0-1（otherMakeup 過濾已取消 schedule）即可 |
| 還有沒被任何審閱覆蓋的洞嗎？ | GAP-P0-1 是最後一個正確性漏洞；其餘為規範補強 |
| 和 Cursor 對抗模擬的差異？ | Cursor 挖出 peers 誤刪（ADV-P0-1）、旁路（ADV-P1-7）等**主路徑**洞。我挖出的是 otherMakeup 內部邏輯、enrollment 覆用、逐筆並發等**組合邊界**洞——兩份對抗互補 |
