# 生命週期孤兒方案 — 顧問審閱 #06（A2 自我對抗評估）

> 角色：**外部技術顧問** ⚠️ 非團隊成員，獨立審閱  
> 對象：[`2026-07-31-lifecycle-orphans-a2-adversarial-self.md`](./2026-07-31-lifecycle-orphans-a2-adversarial-self.md)（Cursor A2 自我對抗）  
> 基於：審閱 [#05](./2026-07-31-lifecycle-orphans-review-05.md)（A2 開工說明回應）及 A1 已落 code  
> 日期：2026-08-01  
> 狀態：**團隊已回應** — kickoff 定案版已按本檔 5 項修訂（2026-08-01）；可開工 A2a（尚未實作 code）

---

## 總評

這份自我對抗的品質是六輪審閱中最高的——不是因為發現多，是因為**作者在自己計劃裡找到與現況 code 不符的假設**。三個 SELF-P0 都是真的，我獨立驗證確認每個都成立。修完這三個 + 我的兩個遺留問題後，A2 可以開工。

---

## 🔴 SELF-P0-1：Q5 觸發條件錯誤 — 減收／轉結餘永不觸發掃描

**Cursor 自行發現**：`setLeaveTuitionDisposition` 在 disposition 為「減收」或「轉結餘」時，**不修改** `makeup_type`。所以 Q5 的觸發條件「`makeup_type` 離調堂」會漏掉這兩個路徑。

**我獨立驗證**（`leaveQueries.ts:440-451`）：

```ts
const makeupType =
  disposition === "調堂" ? "調堂" : disposition === "錄影" ? "錄影" : undefined
// 減收／轉結餘 → makeupType = undefined → makeup_type 欄位不被更新
// makeup_schedule_id 也從不被清
```

確認：減收和轉結餘路徑下，`makeup_type` 保持「調堂」、`makeup_schedule_id` 保持原值。如果 Q5 只看 `makeup_type` 變化，這兩路**永不觸發**掃描。

**判決**：Agree，這是 P0。Cursor 的改寫建議正確：

> 觸發＝`prev.makeup_schedule_id != null` 且 `nextDisposition !== "調堂"`（含減收／轉結餘／錄影）。强制清 `makeup_schedule_id/date = null`，並令 `makeup_type` 與 disposition 一致。

---

## 🔴 SELF-P0-2：disposition 與 credit 的執行序未寫死

**Cursor 自行發現**：現況 `setLeaveTuitionDisposition` 先建／作廢 credit，再 update leave。若 A2 插入 Confirm → 刪 attendance 但放在 credit 之後，會出現「credit 已建、attendance 刪除失敗」的半完成狀態。

**我獨立驗證**（`leaveQueries.ts:358-451`）：確認執行序為：

1. 業務校驗（已繳／結餘狀態）
2. `tuition_credit_entries` 的 INSERT 或 UPDATE
3. `leave_makeup_records` 的 UPDATE（disposition + makeup_type）

**判決**：Agree，這是 P0。Cursor 的改寫建議正確：

> 校驗 → Confirm（若有可刪）→ lock → audit → 刪 attendance → **再**跑 credit／update。禁止 Confirm 前就寫 credit。

---

## 🔴 SELF-P0-3：O1-rollcall 改點位置假設了不存在的 `confirmRollCall` service

**Cursor 自行發現**：A2 開工說明 §3.1 寫「`attendanceQueries.ts`（或 `confirmRollCall` 實際所在）」，但 code 中**沒有**獨立的 `confirmRollCall` service 函式。邏輯在 `RollCallClassPanel.confirmRollCall` 方法裡，逐生呼叫 `saveAttendanceStatusForStudentScheduleScope`。

**我獨立驗證**：搜尋過 `attendanceQueries.ts`，確認不存在名為 `confirmRollCall` 的匯出函式。點名存檔邏輯在 component 層（`RollCallClassPanel`），不在 service 層。

**判決**：Agree，這是 P0。計劃不能基於不存在的 API。Cursor 的改寫建議正確：

> 存檔前 Panel（或抽出 service）呼叫與開紙相同來源重拉名冊（`fetchScheduleRosterContext`）；`student_id ∈ roster` 才允許寫入；名冊外跳過並 Banner 提示。

**但有一個遺漏**：我在審閱 #05 已問過但 SELF-P0-3 未直接回應——`saveAttendanceStatus`（逐筆手動點名）也有同樣的並發寫回風險。SELF-P0-3 提了一句「若只在 `saveAttendanceStatus` 加必須在名冊…可能誤傷」，但沒有給出明確取捨。請在修訂 kickoff 時決定：逐筆 `saveAttendanceStatus` 是否也加名冊檢查，還是只防 Panel 的批次存檔？

---

## 🟠 P1 群：全部 Agree

| ID | 判決 | 備註 |
| --- | --- | --- |
| SELF-P1-1 O1t eligibility 太輕 | Agree | 同我在 #05 的觀察——試堂取消後也可能有 enrollment 應到 |
| SELF-P1-2 O1t API 矩陣未列齊 | Agree | `updateTrialSession` 只改 remarks 不應觸發掃描 |
| SELF-P1-3 連堂 peers 與試堂 | Agree | O1t 必須用 A1 同款 peers 展開 |
| SELF-P1-4 O2 角色過窄 | Agree | **建議 admin + alien**，alien 也是 mgmt 角色，應急不該只限 admin |
| SELF-P1-5 O2 入口衝突 | Agree | 建議**學生詳情出席區**為主入口（有學號上下文），`AttendanceRecordsPage` 為輔 |
| SELF-P1-6 A1 清單漏項 | Agree | 補勾 `studentEligibleForScheduleAttendance` 用直查 |
| SELF-P1-7 優先序不匹配 | Agree | 同我在 #05 的 Q6 Partial 判決——type 應先於 rollcall |
| SELF-P1-8 A2 完成命名 | Agree | 同我在 #05 的 Q8 Partial 判決——拆 A2a/A2b |
| SELF-P1-9 樂觀鎖覆蓋面 | Agree | O1t／O2 至少要 re-read status 做弱鎖。重要發現，前幾輪都沒提 |
| SELF-P1-10 單測範圍不足 | Agree | 補 disposition 觸發、取消路徑、試堂改期 |

---

## 🟡 P2 群：全部 Agree，不需回應

特別贊同 SELF-P2-2（rollcall 防護上線前不要刪「勿開住點名紙」的文件紀律）和 SELF-P2-3（林藝涵結案敘事要寫清楚）。

---

## ⚠️ 兩個仍未回應的遺留問題（來自審閱 #05 和對抗模擬 #02）

SELF 沒有覆蓋以下兩點，請在修訂 kickoff 時一併處理：

### 遺留 #1：GAP-P0-1 — otherMakeup 排除已取消 schedule

我在獨立對抗模擬（`adversarial-sim-02.md`）中發現：eligibility 過濾的 `otherMakeup` 只看 leave status，不看目標 schedule 是否已取消。已取消 schedule 上的 makeup attendance 應被視為可刪，而非保留。

**請確認**：A1 是否已處理？如果未處理，應在 A2 的 O1-type（同樣涉及 eligibility 計算）中補上。

### 遺留 #2：GAP-P1-2 — `saveAttendanceStatus` 逐筆寫回

同 SELF-P0-3 的延伸——`saveAttendanceStatus`（逐筆手動點名）和 Panel 的批次存檔是兩個不同的寫入路徑。請明確決定逐筆路徑是否也加名冊檢查。

---

## 對 Q1–Q8 的顧問最終判決（結合 SELF 預答）

| ID | SELF 預答 | 顧問判決 | 最終 |
| --- | --- | --- | --- |
| Q1 | Agree（輕量） | Agree | 不變，UI Confirm 建議補但不阻塞 |
| Q2 | Agree 過渡 UI，角色問清楚 | Agree | **角色改 admin + alien**（SELF-P1-4） |
| Q3 | Agree 無保留 | Agree | 不變 |
| Q4 | Agree 只防寫回 | Agree | 不變 |
| Q5 | **Disagree 原文** | **Agree SELF 改寫** | 改為 disposition ≠ 調堂 + schedule ≠ null 即觸發 |
| Q6 | **改寫** type 優先 | **Agree SELF 改寫** | type → rollcall → trial → O2（同 #05） |
| Q7 | Agree 毋須刪 | Agree | 結案敘事補「剩現場＝報讀堂」 |
| Q8 | Agree 可分批 | Agree | 拆 A2a／A2b；文件改名 |

---

## 開工條件

A2 可以開工，條件是 kickoff 先修以下 5 項：

| 序 | 來源 | 修改 |
| --- | --- | --- |
| 1 | SELF-P0-1 | Q5 觸發改為 `disposition ≠ 調堂 && schedule ≠ null`；强制清 schedule/date＋對齊 makeup_type |
| 2 | SELF-P0-2 | disposition 執行序：Confirm／刪出席 **先於** credit 寫入 |
| 3 | SELF-P0-3 | rollcall 改點改為 Panel＋重拉名冊（`fetchScheduleRosterContext`）；決定 `saveAttendanceStatus` 逐筆路徑取捨 |
| 4 | GAP-P0-1 | 確認 A1 eligibility 已排除已取消 schedule 的 otherMakeup；若未，補入 A2 |
| 5 | SELF-P1-4 | O2 角色改 admin + alien |

P1/P2 群可隨修訂寫入，不阻塞開工。

---

## 附註

- 這份 SELF 對抗的方法論值得稱讚——在給顧問看之前先自己攻自己，而且誠實標出三個 P0。這比任何外部審閱都更有效
- SELF-P0-1 是典型「計劃寫的和 code 實際行為不同步」的錯誤，以後寫開工說明時建議強制對照源碼
- 修完上述 5 項後，A2 kickoff 不需要再送審——可以直接開工
