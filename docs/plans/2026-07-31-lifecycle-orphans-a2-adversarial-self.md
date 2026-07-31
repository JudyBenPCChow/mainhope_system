# 生命週期孤兒 — A2 開工說明：自我對抗模擬

> 日期：2026-07-31  
> 對象：[`2026-07-31-lifecycle-orphans-a2-kickoff.md`](./2026-07-31-lifecycle-orphans-a2-kickoff.md)  
> 性質：作者自審（等 Claude 前）；**非**顧問回覆  
> 後續：審閱 [#06](./2026-07-31-lifecycle-orphans-review-06.md) 全部 Agree；已寫入定案版 [`a2-kickoff.md`](./2026-07-31-lifecycle-orphans-a2-kickoff.md)（2026-08-01）  
> 方法：對照現況 code 搵「計劃寫錯／漏寫／會令實作踩雷」；嚴於對人、鬆於對己則當失敗

---

## 結論（一句）

計劃方向對，但有 **P0 計劃錯誤**（disposition 觸發／credit 序；rollcall 改點假設）同 **P1 漏寫**。~~未修好前唔應開工~~ → **已於 kickoff 定案版修訂**（含 GAP-P0-1、逐筆 `saveAttendanceStatus` 取捨）。

---

## P0（開工前必須改計劃）

### SELF-P0-1 — Q5／O1-type 觸發條件與現況 code 不符

**計劃寫：** `調堂` → 非 `調堂` 且 `makeup_schedule_id IS NOT NULL` 即觸發。

**現況 `setLeaveTuitionDisposition`：**

```ts
const makeupType =
  disposition === "調堂" ? "調堂" : disposition === "錄影" ? "錄影" : undefined
// update 只在 makeupType 有值時改 makeup_type
// **從不**清 makeup_schedule_id / makeup_date
```

| 列表選項 | `tuition_disposition` | `makeup_type` 實際變化 | schedule |
| --- | --- | --- | --- |
| 調堂 → 錄影 | 錄影 | 改成「錄影」 | **仍留** ← ADV-P1-7 |
| 調堂 → 減收 | 減收 | **唔改**（仍「調堂」） | **仍留** ← 計劃 Q5 漏掉 |
| 調堂 → 轉結餘 | 轉結餘 | **唔改**（仍「調堂」） | **仍留** ← 同上＋還可能建 credit |

若只跟 Q5「makeup_type 離調堂」，**減收／轉結餘永不觸發掃描**，旁路仍在，而且轉結餘會先建結餘再留幽靈調堂。

**改寫建議（給 Claude 覆核）：**

觸發＝`prev.makeup_schedule_id != null` 且 `nextDisposition !== "調堂"`（含減收／轉結餘／錄影）。  
成功路徑除刪出席外，**强制** `makeup_schedule_id/date = null`，並令 `makeup_type` 與 disposition 一致（減收／轉結餘應清掉「調堂」語意，唔好只改 disposition）。

---

### SELF-P0-2 — disposition 與 credit／作廢嘅執行序未寫死

`setLeaveTuitionDisposition` 今日順序大致係：

1. 業務校驗（已繳／結餘已抵扣等）  
2. **建立或作廢 `tuition_credit_entries`**  
3. 再 update leave 的 disposition／makeup_type  

若 A2 插入「Confirm → audit → 刪出席」，但唔改上述順序，會出現：

- 用戶 Confirm 後：先建結餘 → 刪出席失敗 → **有結餘、出席仍在、調堂 schedule 仍在**  
- 或：先刪出席 → 建結餘失敗 → **出席沒了、結餘沒建、disposition 未改**（較可接受但要可重試）

**計劃必須寫死：**  
校驗通過 → Confirm（若有可刪）→ lock → audit → 刪出席 → **再**跑現有 credit／update（或整段包成「失敗則唔改 credit」）。  
**禁止** Confirm 前就寫 credit。

---

### SELF-P0-3 — O1-rollcall 改點位置寫錯／過粗

計劃寫：`attendanceQueries` 的 `confirmRollCall` **或** Panel。

**現況：** 無獨立 `confirmRollCall` service。邏輯在 `RollCallClassPanel.confirmRollCall`，逐生呼叫 `saveAttendanceStatusForStudentScheduleScope`。全庫唯此 UI 路徑用 scope helper；`saveAttendanceStatus` 本身仍可被其他入口單寫。

若只在 Panel filter `students` 陣列：

- 開紙當下名冊有生 A → 請假刪掉 A 出席 → 存檔仍寫 A（並發）— **重拉名冊可修**  
- 但若只 filter 本地 state、**唔**重拉 server 名冊，計劃目標落空  

若只在 `saveAttendanceStatus` 加「必須在名冊」：

- 單生手動改狀態路徑可能誤傷／要額外 RPC  
- 調堂生寫 `writeScheduleIds = [makeupScheduleId]` 時，名冊判定要以**該堂**還是**班別當日**為準——計劃未寫  

**改寫建議：**  
存檔前 Panel（或抽出 service）呼叫與開紙相同來源重拉名冊（`fetchScheduleRosterContext`／等同）；`student_id ∈ roster` 先允許 `saveAttendanceStatusForStudentScheduleScope`；名冊外跳過並 Banner 提示幾人被略過。  
**另註：** `fetchScheduleRosterContext` 對無權限會 `SCHEDULE_ACCESS_DENIED`（A1 煙霧遇過）；點名紙通常老師有權，但 admin／alien 代點要驗過。

---

## P1（應寫入已知限制或改 Q）

### SELF-P1-1 — O1t eligibility 寫得太輕

計劃一句「可抽共用…eligibility」。試堂取消後：

- 若該生**已報讀同班**（理論上 insert 禁止，歷史／手動 DB 可能有）→ 同堂出席可能屬報讀，**不可刪**  
- 若該生另有**其他未取消試堂**綁同一 schedule → 可能仍有資格  

缺明確矩陣＝實作易抄 A1 leave eligibility 而誤刪報讀堂。應列為 O1t 驗收必測。

### SELF-P1-2 — O1t 入口矩陣未列齊

| API | 要閘？ | 備註 |
| --- | --- | --- |
| `deleteTrialSession` | 是 | 硬刪列 |
| `updateTrialSession` → status 含「取消」 | 是 | |
| `updateTrialSession` →「完成」／只改 remarks | **否** | 計劃寫「取消類」易被實作成凡 update 都掃 |
| `rescheduleTrialSession` | 是 | 掃**舊** schedule＋peers；新堂唔帶出席 |

### SELF-P1-3 — 連堂 peers 與試堂

`insertTrialSession` 會展開 consecutive；點名對試堂生可能寫多節。O1t 必須用 **A1 同款 peers**，唔好只刪 `trial.schedule_id` 一列。計劃有提 peers，但驗收要寫「連堂兩節都清」。

### SELF-P1-4 — O2 角色：`isAdmin()` 可能過窄

營運應急常係 admin **或** alien。計劃只寫 admin。若 alien 睇得到出席紀錄頁但無刪掣，會逼用 SQL。應問 Claude：**O2 = admin only 定 `isMgmtStaff()`？**

### SELF-P1-5 — O2 入口與「紀錄頁唯讀」產品衝突

A1／手冊曾暗示出席紀錄偏唯讀；O2 在 `AttendanceRecordsPage` 加刪＝改產品邊界。學生詳情出席區可能更合理（上下文有學號）。計劃「或」字太鬆，應定**唯一主入口**，避免兩處半殘。

### SELF-P1-6 — A1 完工清單漏一項實作細節

A1 eligibility 已改為**直接查 enrollments／leave／trial**（唔靠老師名冊 RPC）。§1.1 未列；後人用 RPC 重寫會回歸。建議補勾：`studentEligibleForScheduleAttendance` 用直查。

### SELF-P1-7 — §4 優先序與真實風險不匹配

Disposition／學費 Select **每日用**；並發開住點名紙同時刪請假 **較少**。計劃把 rollcall 放第一合理係「細、防回歸」，但營運 P0 旁路係 **O1-type**。Q6 已問——自我判決：**type 應先於或並列 rollcall**，唔好 rollcall 做完就以為旁路關了。

### SELF-P1-8 — Q8「A2 完成」與 kickoff 標題

若允許 O2 延後，文件應叫「A2a（護欄）／A2b（O2）」免「A2 完成但無刪掣」。自我傾向：**Agree 可分批**，但 kickoff 要改名／拆 milestone。

### SELF-P1-9 — 樂觀鎖覆蓋面

A1 lock 係 leave row。disposition 路徑有 leave id → 可重用。  
試堂／O2 單列刪：**無 leave lock**；並發兩 admin 刪同一 att、或試堂改期同時點名，計劃未提。O2／O1t 至少要 audit detail 含 `attendance_details.id`＋刪前 re-read status（弱鎖）。

### SELF-P1-10 — 單測範圍不足

「rollcall 過濾 mock」好；但缺：

- disposition＝減收且 schedule 仍在 → 必須觸發  
- disposition 路徑 **Confirm 取消則 credit 零寫入**  
- 試堂改期只動舊堂  

---

## P2（記錄即可）

| ID | 內容 |
| --- | --- |
| SELF-P2-1 | 計劃寫 `TrialSessionsView` Confirm；若另有精靈／捷徑取消試堂要一併搜 |
| SELF-P2-2 | 刪「勿開住點名紙」紀律前，rollcall 防護要先上線一版；文件勿提早刪 |
| SELF-P2-3 | Q7 林藝涵毋須刪：Agree；但個案敘事應寫「補堂孤兒已隨請假刪除消失；剩現場＝報讀堂」免日後再被當欠債 |
| SELF-P2-4 | A1 UI Confirm 未人手點：§1.2 仍建議補；唔阻計劃審閱，但阻「A1 完美完工」宣稱 |

---

## 對 Q1–Q8 的自我預答（供 Claude 對照，非定案）

| ID | 自我判決 | 一句 |
| --- | --- | --- |
| Q1 | Agree（輕量） | UI Confirm 建議補；唔使重跑 #01–#04 |
| Q2 | Agree 過渡 UI | 但角色問清 admin vs alien；文件大字非 Auth |
| Q3 | Agree 無保留 | 維持 #01 |
| Q4 | Agree 只防寫回 | 清名冊外舊列交 O2／O5；計劃已對 |
| Q5 | **Disagree 原文** | 改為「有 schedule 且 disposition≠調堂」＋强制清 schedule／對齊 makeup_type（見 P0-1） |
| Q6 | **改寫** | type 优先或與 rollcall 並列第一；trial → O2 |
| Q7 | Agree 毋須刪 | 結案用語見 P2-3 |
| Q8 | Agree 可分批 | 拆 A2a／A2b；唔好叫「A2 完成」若無 O2 |

**開工條件（自我）：** Claude 確認 P0-1～P0-3 改寫後 → **同意開工 A2**；否則先改 kickoff 再動 code。

---

## 修 kickoff 建議（等 Claude 後一次改）

1. 改寫 §3.3／Q5（觸發＋强制清 schedule＋makeup_type 對齊）  
2. §3.3 加執行序：Confirm／刪出席 **先於** credit  
3. §3.1 改為 Panel＋重拉名冊；刪除虛構 `confirmRollCall` service 假設；註 ACCESS_DENIED  
4. §3.2 補 API 矩陣＋eligibility＋連堂  
5. §3.4 定入口＋admin/alien  
6. §4 優先序改 type↔rollcall  
7. §1.1 補 eligibility 直查勾選  

---

*本檔係作者自攻；顧問意見優先。衝突時以 Claude 覆核後寫入 kickoff 修訂版為準。*
