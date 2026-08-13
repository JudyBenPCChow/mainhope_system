# 生命週期孤兒 — A2 開工說明（定案版）

> 日期：2026-07-31（初稿）／2026-08-01（依審閱 #05／#06＋SELF 對抗修訂）  
> 狀態：**A2a＋A2b（O2）已落 code**（B／C 未做）  
> 主方案：[`2026-07-31-lifecycle-orphans.md`](./2026-07-31-lifecycle-orphans.md)  
> 前序：審閱 #01–#06、對抗模擬 #01–#02、SELF 對抗、A1 已落 code  
> 性質：A2 範圍與擬改清單；**非**實作 patch  
> 顧問 #06：修完本檔 5 項後**唔使再送審**，可直接實作

---

## 0. 定案來源（#05／#06）

| 來源 | 採納 |
| --- | --- |
| #05 Q1–Q8 | 見 §5 最終判決表 |
| SELF-P0-1～3 | 全部寫入 §3 |
| #06 開工 5 項 | 全部寫入下文；本檔＝已修 |
| GAP-P0-1 | A1 **未**處理 → **納入 A2a**（eligibility 共用） |
| 逐筆 `saveAttendanceStatus` | **一併加名冊檢查**（見 §3.2） |

---

## 1. A1 完工清單（開工 A2 前）

### 1.1 Code／合併

- [ ] `attendanceLifecycleQueries.ts`（掃描／eligibility／稽核刪）在目標 branch  
- [ ] eligibility 用**直查** enrollments／leave／trial（唔靠老師名冊 RPC）  
- [ ] `leaveQueries`：`previewLeaveMakeupAttendanceImpact`、delete／update 閘門（`attendanceAction`）  
- [ ] `LeaveManagementView`：三路 Confirm（預設一併刪、保留二次確認）  
- [ ] `logMgmtAuditActionOrThrow` 存在且刪出席前會用  
- [ ] 老師精靈清調堂遇可刪出席會失敗（轉行政 SOP）  
- [ ] O6 文件：`LEAVE_MAKEUP_CONSECUTIVE` §6、`ATTENDANCE_BILLING` 反操作、現況清 runbook  

### 1.2 驗證

- [x] 離線單測（`attendanceLifecycleQueries.test.ts`）  
- [x] 測試生 `20261973` 服務層煙霧  
- [ ] **建議補**：本機 UI Confirm（一併刪＋保留）— **唔阻塞**開工（#05／#06）  
- [x] 林藝涵 `2026-07-25`：剩 1 筆「現場」＋該班有報讀 → **毋須刪**（補堂孤兒已隨請假消失；剩現場＝報讀堂）  

### 1.3 A1 刻意未做 → A2

- disposition 旁路、點名寫回、試堂、mgmt 單列刪、otherMakeup×已取消 schedule  

---

## 2. A2 範圍（拆 A2a／A2b）

| 批次 | ID | 一句 |
| --- | --- | --- |
| **A2a（先上）** | **O1-type** | disposition ≠ 調堂且仍有 makeup schedule → 清調堂路徑 |
| **A2a** | **eligibility 補丁（GAP-P0-1）** | `otherMakeup` 排除目標 schedule 已取消／完成 |
| **A2a** | **O1-rollcall** | Panel 重拉名冊＋`saveAttendanceStatus` 名冊檢查；只防寫回 |
| **A2a** | **O1t** | 試堂取消／刪／改期：强制一併刪出席（無保留路） |
| **A2b（可隔週）** | **O2** | admin **＋ alien** 單列刪＋audit（過渡 mgmtRole） |

**不做（B／C／其他）：** O0／O3／O4／O5、soft-delete、夜間 reconcile、改計費白名單睇資格。

---

## 3. 實作清單（定案）

### 3.1 O1-type — disposition 離調堂（A2a 第一項）

**觸發（定案，取代舊 Q5）：**

```
prev.makeup_schedule_id != null
&& nextDisposition !== "調堂"
```

含：**減收、轉結餘、錄影**（及日後任何非「調堂」）。  
**唔**用「`makeup_type` 是否離調堂」做唯一條件——現況減收／轉結餘**唔改** `makeup_type`，會漏掃（SELF-P0-1）。

**成功路徑强制：**

- `makeup_schedule_id`／`makeup_date` = null  
- `makeup_type` 與 disposition 語意對齊（減收／轉結餘唔好繼續留「調堂」；錄影＝錄影且無 schedule）

**執行序（定案，SELF-P0-2）：**

1. 業務校驗（已繳／結餘已抵扣等）— **可讀、未寫 credit**  
2. 有可刪出席 → UI Confirm（同 A1 三路：預設一併刪、保留二次確認）  
3. optimistic lock（leave row）→ audit → **刪出席**  
4. **然後**現有 credit 建立／作廢 → update leave（disposition＋清 schedule＋對齊 type）  

**禁止：** Confirm 前或刪出席失敗後仍寫入 `tuition_credit_entries`。

| 位置 | 改動 |
| --- | --- |
| `leaveQueries.ts` → `setLeaveTuitionDisposition` | 上列觸發＋執行序；`attendanceAction` 閘門 |
| `LeaveManagementView` 學費 Select | 有可刪列則三路 Confirm |

**不做：** 改計費引擎睇資格。

---

### 3.1b GAP-P0-1 — otherMakeup × 已取消 schedule（隨 A2a／與 type 同用 eligibility）

**事實：** A1 `fetchRetainScheduleIdsForStudent` 的 `otherMakeup` 只跳過 leave「放棄」，**未**查目標 `schedules.status`。

**定案：** A2a 補：若 makeup 目標 schedule 狀態含「取消」或「完成」，**唔**因 otherMakeup 而 retain（該堂出席視為可刪，除非仍有 enrollment／active trial 等其他 retain 理由）。

| 位置 | 改動 |
| --- | --- |
| `attendanceLifecycleQueries.ts` | otherMakeup 展開後（或前）過濾已取消／完成 schedule |

單測：other leave 指向已取消 schedule → 唔 retain。

---

### 3.2 O1-rollcall — 點名寫回防護

**現況（勿再寫錯）：** 無獨立 `confirmRollCall` service。批次存檔在 `RollCallClassPanel.confirmRollCall` → `saveAttendanceStatusForStudentScheduleScope` → `saveAttendanceStatus`。

**定案（SELF-P0-3＋#06 遺留 #2）：**

1. **Panel：** 存檔前用與開紙相同來源**重拉**名冊（`fetchScheduleRosterContext` 或同等）；只對 `student_id ∈ roster` 呼叫 save；名冊外跳過＋Banner 提示略過人數。注意 `SCHEDULE_ACCESS_DENIED`（admin／alien 代點要可測）。  
2. **`saveAttendanceStatus`（逐筆路徑）一併加名冊檢查**：唔在名冊則**拒絕寫入**（throw 明確錯誤，唔 upsert）。避免只防 Panel、底層 API 仍可並發寫回。  
3. O2 刪列走刪除 API，**唔**經此 upsert 路徑。  
4. **不做：** 主動刪名冊外既有出席列（清舊列交 O2／O5）。  
5. **文件：** rollcall 防護上線前**保留**「勿開住點名紙」紀律；上線後改為「已有寫回防護」。

| 位置 | 改動 |
| --- | --- |
| `RollCallClassPanel.tsx` | 重拉名冊＋filter＋Banner |
| `attendanceQueries.ts` → `saveAttendanceStatus` | 名冊資格檢查（可抽共用 helper） |

---

### 3.3 O1t — 試堂

**目標：** 取消／刪／改期時，舊 `schedule_id`＋**peers** 有可刪出席 → Confirm **强制一併刪**（**無**「保留出席」；要留就唔好取消）。

**API 矩陣：**

| API | 閘門？ | 備註 |
| --- | --- | --- |
| `deleteTrialSession` | 是 | |
| `updateTrialSession` → status 含「取消」 | 是 | |
| `updateTrialSession` →「完成」／只改 remarks | **否** | |
| `rescheduleTrialSession` | 是 | 只掃**舊**堂＋peers；新堂唔帶出席 |

**Eligibility：** 與 O1 一致——取消／改期後若仍有**報讀應到**或**其他未結試堂**綁同 schedule，該列**保留**（SELF-P1-1）。  
**弱鎖：** 刪前 re-read attendance status／id（無 leave lock 時）。

| 位置 | 改動 |
| --- | --- |
| `trialQueries.ts` | 上列閘門；執行序 scan→Confirm→audit→刪 att→改試堂 |
| `TrialSessionsView.tsx` | 單路 Confirm（一併刪 vs 取消操作） |
| 文件 | 「要留出席就勿取消試堂」 |

**驗收：** 已點名 → 取消 → 出席刪；連堂兩節都清；改期只動舊堂；有報讀則唔誤刪報讀堂。

---

### 3.4 O2 — 單列刪（A2b）

**定案：**

- 角色：**admin ＋ alien**（`mgmtRole`；**非** Auth；RPC 後替換）  
- **主入口：** 學生詳情出席區  
- **輔入口（可選）：** `AttendanceRecordsPage`  
- teacher 無入口  
- Confirm＋計費列文案強化；`deleteAttendanceHitsWithAuditOrThrow`；弱鎖 re-read  

| 位置 | 改動 |
| --- | --- |
| `attendanceLifecycleQueries.ts` | `deleteAttendanceDetailAsMgmt(hit, reason)`：assert admin\|alien |
| 學生詳情出席區（主） | 刪除掣 |
| `AttendanceRecordsPage.tsx`（輔） | 可選 |

---

### 3.5 測試／文件（隨批次）

- 單測：disposition＝減收且 schedule 仍在 → 觸發；Confirm 取消 → **零 credit 寫入**；otherMakeup×已取消 schedule；rollcall／`saveAttendanceStatus` 拒名冊外；試堂改期只動舊堂  
- 可選煙霧：試堂路徑  
- 更新 backlog／主方案 A2 勾選；O6 覆蓋表  

---

## 4. 實作順序（定案）

```
A2a:
  1. GAP-P0-1 eligibility 補丁（otherMakeup × 取消／完成 schedule）
  2. O1-type（disposition；依賴掃描／Confirm／執行序）
  3. O1-rollcall（Panel＋saveAttendanceStatus）
  4. O1t

A2b（可隔週）:
  5. O2
```

可一個 PR（A2a）＋後續 PR（A2b），或 A2a 內再拆 type／rollcall。

---

## 5. Q1–Q8 最終判決（#05＋#06＋SELF）

| ID | 最終 |
| --- | --- |
| Q1 | Agree：§1＋建議 UI Confirm；唔阻塞 |
| Q2 | Agree 過渡 UI；角色 **admin＋alien** |
| Q3 | Agree：試堂强制一併刪、無保留 |
| Q4 | Agree：只防寫回、唔清舊列 |
| Q5 | **改寫：** `disposition ≠ 調堂 && makeup_schedule_id ≠ null`；强制清 schedule／對齊 type |
| Q6 | **type → rollcall → trial → O2**（eligibility 補丁置 type 前或同 PR 最先） |
| Q7 | Agree 毋須刪；結案敘事見 §1.2 |
| Q8 | **A2a／A2b**；O2 可延後 |

**開工：** 本檔已按 #06 五項修訂 → **可實作 A2a**（無需再送審）。

---

## 6. 相關路徑

```
docs/product/plans/2026-07-31-lifecycle-orphans.md
docs/product/plans/2026-07-31-lifecycle-orphans-a2-adversarial-self.md
docs/product/plans/2026-07-31-lifecycle-orphans-review-05.md
docs/product/plans/2026-07-31-lifecycle-orphans-review-06.md
docs/product/topics/lifecycle-orphans.md
src/services/attendanceLifecycleQueries.ts   ← eligibility（GAP-P0-1）＋O2
src/services/leaveQueries.ts                 ← O1-type
src/components/leaves/LeaveManagementView.tsx
src/components/attendance/RollCallClassPanel.tsx
src/services/attendanceQueries.ts            ← saveAttendanceStatus 名冊檢查
src/services/trialQueries.ts                 ← O1t
src/components/trials/TrialSessionsView.tsx
學生詳情出席區 / AttendanceRecordsPage.tsx   ← O2
```
