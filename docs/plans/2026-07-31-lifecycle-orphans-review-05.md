# 生命週期孤兒方案 — 顧問審閱 #05（A2 開工說明回應）

> 角色：**外部技術顧問** ⚠️ 非團隊成員，獨立審閱  
> 對象：[`2026-07-31-lifecycle-orphans-a2-kickoff.md`](./2026-07-31-lifecycle-orphans-a2-kickoff.md)（團隊 A2 開工說明）  
> 基於：審閱 #01–#04、對抗模擬 #01–#02、A1 已落 code  
> 日期：2026-07-31  
> 狀態：**已由 #06＋kickoff 定案版收斂**（逐筆寫回／GAP-P0-1 見 kickoff §3.1b／§3.2）

---

## 八題直答

| ID | 判決 | 一句理由／改寫 |
| --- | --- | --- |
| Q1 | **Agree** | §1 清單＋UI Confirm 點過一次即可。A1 不是「完美才準開 A2」，是「主路徑通、已知限制有文件」就夠 |
| Q2 | **Agree** | 用 `mgmtRole` admin assert＋audit 開 UI，文件標過渡。這是我在 #04 FP-2 建議的方向——admin 本來就能經 Table Editor 刪，加 audit 已是改善 |
| Q3 | **Agree** | 維持强制一併刪，與 #01／ADV-P1-5 一致。試堂無「保留出席」場景 |
| Q4 | **Agree** | 只防寫回，不順便清舊列。舊列是 O2／O5 的職責，rollcall 做好一件事就夠 |
| Q5 | **Agree** | `調堂→非調堂` 且 `makeup_schedule_id IS NOT NULL` 即觸發。另建議：`錄影` 也算「離調堂」——錄影不應掛 schedule，應同步清 |
| Q6 | **Partial** | 建議 **O1-type 先於 O1-rollcall**。理由：disposition 旁路是**資料完整性**問題（會靜默產孤兒），rollcall 是**並發防護**（防 race condition）。完整性 > 並發防護。順序改為：**type → rollcall → trial → O2** |
| Q7 | **Agree** | 林藝涵 7/25 剩一筆＋該班有報讀 → 毋須刪。這正是 eligibility 過濾的正確行為，寫入個案結案 |
| Q8 | **Partial** | 同意 O2 可延後。但建議 A2 分兩批：**A2a＝type＋rollcall＋trial（三項）**，**A2b＝O2**。A2a 上線已補完 A1 已知旁路和並發洞；O2 是工具性功能，不阻塞 A2 主目標 |

---

## 直答：是否同意開工 A2？

**同意開工 A2**，但有兩項前置確認：

---

## ⚠️ 開工前確認 #1：GAP-P0-1 是否已在 A1 處理？

我獨立對抗模擬（`adversarial-sim-02.md`）挖出的 GAP-P0-1：`otherMakeup` 過濾時未排除**目標 schedule 已被軟取消**的 makeup。這是 eligibility 計算的一部分，屬於 O1（A1）範圍。

A2 開工說明 §1.1 列出 `attendanceLifecycleQueries.ts` 包含「掃描／eligibility／稽核刪」，但我未看過這個檔案的內容。

**請確認**：A1 的 eligibility 過濾（`可刪列 = 候選 − 保留`）中，`otherMakeup` 是否已排除以下情況？
- 目標 `makeup_schedule_id` 對應的 schedule 狀態含「取消」或「完成」
- 否則，已取消 schedule 上的 makeup attendance 會被錯誤保留

如果 A1 尚未處理，請在 A2 的 O1-type（同樣涉及 eligibility 計算）中一併補上。

---

## ⚠️ 開工前確認 #2：O1-rollcall 範圍需覆蓋 `saveAttendanceStatus` 逐筆寫回

A2 開工說明 §3.1 只提了 `confirmRollCall` 的防護。但我的 GAP-P1-2 指出：老師**逐個學生手動點名**時呼叫的 `saveAttendanceStatus`（單筆 upsert）也有同樣的並發寫回風險。

`saveAttendanceStatus` 的邏輯是：
```
SELECT WHERE student_id + class_id + attendance_date + schedule_id
→ 存在就 UPDATE，不存在就 INSERT
```
沒有任何名冊檢查。

**請確認**：O1-rollcall 的防護是否同時覆蓋 `saveAttendanceStatus`？如果不覆蓋，請在 A2 已知限制中明確寫出「逐筆點名仍有並發寫回風險，建議老師在行政操作 O1 期間避免手動點名」。

---

## A2 實作順序建議（修訂 Q6）

```
A2a（先上）:
  1. O1-type    — disposition 旁路（補 A1 最大已知漏洞）
  2. O1-rollcall — 點名寫回防護（含 saveAttendanceStatus 若覆蓋）
  3. O1t         — 試堂 lightweight

A2b（可隔週）:
  4. O2          — admin 單列刪
```

---

## 其他觀察（不需回應）

- §3.2 O1t 提到「eligibility：試堂取消後是否仍有報讀／其他試堂」— 這是對的，試堂的 eligibility 過濾也應檢查 enrollment 和 otherTrial，與 O1 一致
- §3.4 O2 過渡方案與 #04 FP-2 一致，贊同
- §3.6 明確不納入 A2 的項目清單完整，沒有遺漏
- A1 完工清單中「林藝涵 7/25 剩一筆有報讀→毋須刪」的判定正確——這驗證了 eligibility 過濾在真實數據上運作正確
