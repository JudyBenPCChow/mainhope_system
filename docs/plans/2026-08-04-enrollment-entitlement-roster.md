# 報讀權益池＋到課宣告 — 實作計劃

> 日期：2026-08-04  
> 狀態：**in_progress**（Wave 1 ✅；**下一波 Wave 2**）  
> Backlog：[summer-enrollment-roster-consistency.md](../backlog/summer-enrollment-roster-consistency.md)  
> 性質：開工清單；schema／服務／學年硬閘；**非**會計認列

---

## 0. 定案摘要（承接 backlog §三）

| 項 | 定案 |
| --- | --- |
| 模型 | 權益池 ＋ 到課宣告 ＋ 既有點名結果；消耗 ≠ 收入認列 |
| 上線順序 | **`2627` 先**；`26SM` 維持舊路徑至日落 |
| 生效點 | 開始接受 `2627` 報讀前，新報讀須鑄池；有排程／點名時讀宣告 |
| 雙路徑 | 只准 **`academic_year.label` 硬閘**；禁止同堂混用日期推期數與宣告 |
| 本輪不做 | 收入認列、欠費門禁、計糧、手動加名 UI（服務預留）、`26SM` 切換 |

---

## 1. 學年硬閘

```ts
usesEntitlementRosterModel(label):
  *SM → false（舊）
  regular label orderKey >= 2627 → true（新）
  其餘（如 2526）→ false
```

正式點名紙／roster 入口依班別／排程的 `academic_year_label` 分支；shadow 可對任何學年對照，但**不**改正式名單。

---

## 2. 遷移／回填規則（寫死）

### 2.1 池初始化來源（R1）

| `package_type` | `initial_lessons`／鑄造時 `remaining_lessons` |
| --- | --- |
| `single_lesson` | 選堂數＝`student_enrollment_sessions` 列數（連堂按 `lesson_slots_per_session` 計單位） |
| `regular_full` | 班別自 `enroll_date`（無則今日）起、未取消排程之堂次單位總和；尚無排程則 0，之後新增排程時補宣告並按單位增額 |
| `summer_phase_1`／`_2`／`summer_full` | 對應期內（或兩期）未取消排程堂次單位（`26SM` 本輪不切正式路徑；shadow／工具可算） |

**對帳（切換前必跑）**：`paid_lessons`＝該報讀相關 `payment_details.lesson_count` 加總（不改寫收據）。  
通過標準：`pool.initial_lessons + 已解釋調整` ≥ 合理下限；`remaining + consumed` 與「應有堂數」差異列入報告，**禁止**無解釋少鑄。

不改 `payments`／月費寫入口徑；支付後增額屬後續波次（可用事件補池，非本 Wave 必做）。

### 2.2 `enrollment_period` → `package_type`

| 報讀欄 | package_type |
| --- | --- |
| `第一期` | `summer_phase_1` |
| `第二期` | `summer_phase_2` |
| `兩期全報` | `summer_full` |
| `單堂` | `single_lesson` |
| `null`（正規） | `regular_full` |

### 2.3 歷史宣告回填

| 學年 | 規則 |
| --- | --- |
| `2627` | 就讀中報讀：依舊可見規則產生的每堂 → `active` 宣告綁對應池；單堂依 sessions；試堂**不**入池（名單仍 union 試堂） |
| `26SM` | **本輪不回填正式**；可選 shadow-only 產物 |

補回／調堂：新 `schedule` 建宣告繼承原 `pool_id`（不轉池）。順延才轉池（後續波次）。

### 2.4 Shadow 通過標準

對目標班／排程集合：

- `missing_in_new`＝0（或僅含已標記例外＋reason）
- `extra_in_new` 須逐筆可解釋（試堂／手動 pending 等）
- R1–R5 各有對應查詢／腳本輸出

### 2.5 試堂

試堂維持名單 union；**不**鑄權益池、**不**強制宣告。後續若要稽核可另開。

---

## 3. Wave 切分

| Wave | 內容 | 狀態 |
| --- | --- | --- |
| **0** | 計劃＋遷移／回填寫死（本檔） | ✅ |
| **1** | Schema＋RLS；lib gate／package／reason；entitlement＋eligibility service；roster 硬閘；`insertEnrollment`／改期鑄池＋自動宣告；shadow compare | ✅ 2026-08-04 |
| **2** | 補堂／取消／請假／新增排程寫宣告；消耗／返還對齊 §3.6；入口全面收斂；見 §8 | ⬜ **下一波** |
| **3** | 手動加名 §3.8 UI＋例外；reason code 上紙；對照 UI | ⬜ |
| **4** | `26SM` 日落評估；廢 `makeup_of` 止血 | ⬜ |

---

## 4. Schema（Wave 1）

- `student_entitlement_pools`
- `attendance_declarations`
- `entitlement_consumption_events`（營運消耗；註明非收入認列）
- `attendance_declaration_exceptions`（手動加名 pending；UI 後做）

唯一鍵／狀態見 backlog §3.2／§3.4。RLS：mgmt 全開；teacher 依 class／schedule 讀。

---

## 5. 程式落點（Wave 1）

| 檔 | 職責 |
| --- | --- |
| `src/lib/rosterEligibilityGate.ts` | 學年硬閘 |
| `src/lib/entitlementPackage.ts` | package 對照、優先序常數、reason code |
| `src/services/entitlementQueries.ts` | 鑄池、宣告 CRUD、餘額 |
| `src/services/rosterEligibilityService.ts` | 統一資格＋shadow |
| `src/services/scheduleRosterQueries.ts` | `rosterStudentsForSchedule` 硬閘分支 |
| `src/services/studentQueries.ts` | `insertEnrollment`／period 變更後鑄池 |

---

## 6. 驗證清單（Wave 1）

- [x] Migration 已套用遠端（`20260804010000`）
- [ ] `26SM` 點名紙行為不變（回歸觸發班可抽樣）
- [x] `2627` 新報讀路徑接上鑄池＋自動宣告（尚無現有就讀；prod 目前 0 筆 `2627` 就讀）
- [x] `2627` 點名紙走宣告∪試堂∪（過渡）leave makeup（學年硬閘）
- [x] `npm run build` 通過
- [x] Shadow helper：`compareRosterShadow`

---

## 7. 明確不做（本計劃）

- 改寫收款／`payment_details`／月費／轉結餘
- 收入認列欄位或事件名
- 期數相容矩陣、可設定多池優先序
- 全量 `db push`

---

## 8. Wave 2 詳情（下一波）

目標：讓 `2627` 在真實營運（改期、補堂、請假、加排程、點名）下，宣告／池與前線直覺一致；並收斂「誰應到」入口，避免仍用日期推期數。

### 8.1 事件 → 宣告（對齊 backlog §3.7）

| 事件 | 既有落點（改寫處） | Wave 2 行為 |
| --- | --- | --- |
| 全班取消原堂 | `scheduleLifecycleQueries`／軟取消 | 原堂 `active` 宣告 → `void`；**不扣**池 |
| 全班改期／安排補回加堂 | `scheduleMakeupQueries.arrangeMakeupForCancelledSchedule` | 原 void；新 `schedule` 建 `active`，**繼承原 `pool_id`**（補回≠轉池）；可保留 `makeup_of` 備註作過渡，但 `2627` 正式名單不靠它 |
| 個別請假補堂 | `leaveQueries` 寫 `leave_makeup_records.makeup_schedule_id` | 補回堂建宣告（繼承該生原池）；請假日宣告視政策 void 或保留＋預填不扣 |
| 單堂改掛 | 已有 `syncSingleLessonDeclarations` | 確認所有 remount 路徑都走此函數（含 makeup remount） |
| 班別**新增／批次排程** | `scheduleQueries`／`batchScheduleHelpers` | 對該班所有就讀中＋`usesEntitlementRosterModel` 報讀：`ensureEntitlementPoolAndDeclarations`（抬高尚未消耗池的 initial／remaining，補缺宣告） |
| 順延／轉科 | 報讀變更路徑 | Wave 2 至少：轉科／改班重鑄命名空間；順延批次工具可先 stub／半自動 |

### 8.2 消耗／返還（§3.6；≠ 收入認列）

| 項 | 做法 |
| --- | --- |
| 寫入點 | `attendanceQueries.saveAttendanceStatus*`（及改點名） |
| 扣堂 | `isBillableAttendanceStatus` → 寫 `entitlement_consumption_events`（`entitlement_consumed`，delta 負）＋減 `remaining_lessons`；宣告已指定 `pool_id` 則扣該池，否則 §3.5 優先序 |
| 返還 | 計費→不計費／清列 → `entitlement_reinstated` 加回**原** pool |
| 單位 | 連堂 2／單節補堂 1 等沿用扣堂文件；**不**寫 `revenue_*` 欄名 |
| 閘 | 只對 `usesEntitlementRosterModel` 學年生效；`26SM` 不跑消耗帳 |

### 8.3 入口收斂（§3.9）

盤點並改為最終只經 roster eligibility（或同等）：

| 入口 | 檔 | Wave 2 要求 |
| --- | --- | --- |
| 點名紙 | `RollCallClassPanel`／`attendanceQueries` | 已吃 context；確認 `assertStudentOnScheduleRoster` 與 gated 名單一致 |
| 日視圖／提醒 | `scheduleQueries`／`lessonReminderQueries` | 勿用裸 `scheduleDate` 推期數作正式資格 |
| 班別學生／排程提示 | `classQueries.fetchClassStudents`、`fetchScheduleStudentHintsForClass` | 硬閘分支 |
| 學生應到 slots | `studentQueries.filterSlotsForEnrollmentPeriod` | gated 年改讀宣告 |
| 生命週期 | `attendanceLifecycleQueries` | 對齊，避免誤刪／誤留 |

**禁止**：同一 `2627` 堂正式名單混用「日期→period」與「宣告→池」。

### 8.4 驗證（Wave 2 出門檻）

- [ ] `2627`：報讀 → 加排程 → 點名紙有人；取消再補回 → 同生仍在新堂、池未轉包裝
- [ ] 點名計費狀態 → `remaining` 減；改病假／事假 → 返還
- [ ] `26SM` 抽樣（含觸發班跨期補回）行為不變
- [ ] Shadow：抽樣 `2627` 班 `missing_in_new`＝0（或僅已解釋例外）
- [ ] `npm run build`

### 8.5 Wave 2 明確不做

- 手動加名 UI（→ Wave 3）
- reason code 點名紙展示（→ Wave 3）
- `26SM` 切換／廢 `makeup_of`（→ Wave 4）
- 收款／月費／收入認列

