# 生命週期孤兒方案 — 顧問審閱 #03（對抗模擬評估）

> 角色：**外部技術顧問** ⚠️ 非團隊成員，獨立審閱  
> 對象：[`2026-07-31-lifecycle-orphans-adversarial-sim.md`](./2026-07-31-lifecycle-orphans-adversarial-sim.md)（Cursor 實作前對抗模擬）  
> 基於：審閱 [#01](./2026-07-31-lifecycle-orphans-review.md) · [#02](./2026-07-31-lifecycle-orphans-review-02.md) 及兩輪定案  
> 日期：2026-07-31  
> 狀態：**Cursor 已回應**（三題全採納；已寫入方案定案／階段 A）  
> 回應日期：2026-07-31

---

## 總評

對抗模擬品質高。ADV-P0-1 是真實的資料損毀漏洞，我獨立驗證確認成立。ADV-P1-7 我認為應升至 P0。以下逐項評估。

---

## 🔴 ADV-P0-1：確認 P0，補丁方向正確但需補一個邊界

**Cursor 的診斷**：Peers 展開假設「該生在 peer 上的出席＝補堂誤寫」，未檢查該生是否仍有應到資格。若學生同時有 enrollment 和 makeup 重疊在同一連堂組，取消請假後 enrollment 的合法出席會被一併刪除。

**我獨立驗證**：確認場景成立。這是審閱 #01/#02 都沒覆蓋到的漏洞。

**Cursor 的補丁**：
```
候選列 = attendance on peers(oldMakeupScheduleId) for this student
保留列 = 變更後仍 eligible 的 schedule（enrollment ∪ active trial ∪ other makeup）
可刪列 = 候選列 − 保留列
```

**我認同這個方向**，但有一個邊界需補：

跨班補堂生可能同時有**兩筆獨立的 leave_makeup_records**，各綁同連堂組不同節（例如兩次不同日期的請假，都調到同一天的不同節）。取消其中一筆時，另一筆的 `makeup_schedule_id` 對應的那節 attendance 應在「保留列」中。

請確認補丁中 eligibility 的 `other makeup` 來源為：

> 同生所有 `leave_makeup_records`（排除本筆正在取消的），其 `makeup_schedule_id` 不為 null 且狀態非放棄

否則跨班多調堂場景仍有誤刪風險。

---

## 🔴 ADV-P1-7：建議升至 P0

**Cursor 的診斷**：`setLeaveTuitionDisposition` 可將 `makeup_type` 從「調堂」改為「錄影」或「減收」，但不清 `makeup_schedule_id`。結果是 makeup roster 仍掛著該生、老師可點名、計費出席被寫入，但 leave record 已不是調堂——形成另一種孤兒。

**我同意這是漏洞，且應升至 P0**。理由：

- 這和 O1 變更矩陣中「清調堂（`有值→null`）」是**同一類問題**，只是觸發路徑不同
- 後果相同：attendance 失去對應的調堂資格，仍計入已上堂數
- 發生概率不低：行政在學費處理時改 disposition 是常規操作

**要求的補丁**：在 O1 變更矩陣中加入觸發條件：

```
if patch.makeup_type 從「調堂」變非「調堂」且 leave.makeup_schedule_id 仍非 null:
  等同「有值→null」（清調堂）→ scan peers(prev) → Confirm
```

同時應强制清 `makeup_schedule_id = null` 和 `makeup_date = null`，避免殘留髒資料。

---

## 🟠 ADV-P1-6：同意階段 A 搭車處理

**Cursor 的診斷**：並發點名寫回（模擬 9）在階段 A 未關門。A 開點名紙含補堂生、B 一併刪出席、A 再存 → upsert 寫回已刪的出席。

**我同意應在階段 A 搭車**。技術建議：

`confirmRollCall` 存檔前調用 `fetchScheduleRosterContext` 重拉當前 server 端名冊，只對名冊內的 `student_id` 做 upsert。已在名冊外的學生（剛被 O1 刪除資格）跳過不寫。

不做的話，O1 刪除出席的價值會被並發寫回完全抵消。

---

## 🟠 其他 P1：同意 Cursor 的級別與規範

| ID | 顧問評估 |
| --- | --- |
| P1-1 部分成功 | 規範正確。idempotent 是必須的：「0 rows deleted」≠ 失敗；audit 宜含全清單＋每筆結果 |
| P1-2 audit 後 leave 失敗 | 同意 UI 紅字提示「出席已刪、請假未改，請重試」，不靜默當成功 |
| P1-3 樂觀鎖格式 | 實作細節正確。用 DB 回傳 `updated_at` 原字串；禁 JS `new Date` 再 format |
| P1-4 文案嚇過火 | 好的 UX 補強。僅計費列強調已上堂數影響 |
| P1-5 O1t 強制刪 | 已 Accept，與審閱 #01 一致。文件寫明「要留出席就不要取消試堂」 |
| P1-8 硬刪排程 | 已 Accept。O6 文件加「勿硬刪已點名排程；應軟取消」 |

---

## 🟡 P2：無異議

全部同意 Cursor 的判斷，不需逐項回應。特別贊同 ADV-P2-5（禁止直接 cherry-pick `wip/lifecycle-orphans-impl` 當完工）。

---

## 📋 開工前必須寫入方案的事項

按優先級排序：

| 優先 | ID | 必須寫入方案的內容 |
| --- | --- | --- |
| **P0** | ADV-P0-1 | eligibility 過濾規則（含 enrollment ∪ activeTrial ∪ otherMakeup；otherMakeup 排除本筆）；Confirm 只列「可刪列」；可刪為空時只改 leave 不刪出席 |
| **P0** | ADV-P1-7 | O1 變更矩陣加入「`makeup_type` 從調堂變非調堂」觸發條件；强制同步清 `makeup_schedule_id` + `makeup_date` |
| **P1** | ADV-P1-6 | 點名寫回防護：`confirmRollCall` 存檔前重拉名冊，排除已不在名冊的 student_id |
| **P1** | ADV-P1-1~4 | 作為實作規範寫入（idempotent、leave 失敗紅字、樂觀鎖格式、文案依計費狀態） |
| **Accept** | ADV-P1-5, P1-8 | 風險接受聲明寫入「刻意不做／已知限制」 |

---

## 📊 模擬劇本判定：顧問複審

| # | Cursor 判定 | 顧問複審 | 備註 |
| --- | --- | --- | --- |
| S1 | Pass | ✅ Pass | |
| S2 | Pass | ✅ Pass | |
| S3 | Pass | ✅ Pass | |
| S4 | Fail 除非補丁 | ✅ 確認 Fail | ADV-P0-1 補丁後應變 Pass |
| S5 | 需 P1-1 | ✅ 確認 | |
| S6 | Pass | ✅ Pass | |
| S7 | Accept | ✅ Accept | |
| S8 | Pass | ✅ Pass | |
| S9 | Fail/Accept | ⚠️ 建議修而非 Accept | ADV-P1-6 |
| S10 | Accept | ✅ Accept | |
| S11 | Pass | ✅ Pass | |
| S12 | Pass | ✅ Pass | |

---

## 📋 需 Cursor 回應 → 已答

1. **ADV-P0-1**：是否同意補上 `otherMakeup` 邊界？ → **同意**（保留列含同生其他 leave 的 `makeup_schedule_id`，排除本筆、非放棄）。

2. **ADV-P1-7**：是否同意升至 P0？ → **同意升 P0**；矩陣加入 type 離調堂；强制清 schedule／date；`setLeaveTuitionDisposition` 同路。

3. **ADV-P1-6**：點名寫回防護？ → **重拉名冊**（階段 A `O1-rollcall`）：存檔前 `fetchScheduleRosterContext`，只 upsert 名冊內。

全文定案見主方案「審閱定案（#03）」。

---

## 附註

- 本檔為審閱 #03。連同 #01（12 項）、#02（3 項），三輪審閱加一輪對抗模擬後，方案已覆蓋主路徑、邊界、並發、旁路
- 補上 ADV-P0-1 和 ADV-P1-7 後，顧問認為可開工；**仍待你明確說「開始實作」才寫功能 code**
- Cursor 這輪對抗模擬的方法論值得保留——「假裝實作找會炸的縫」比靜態審閱更有效
