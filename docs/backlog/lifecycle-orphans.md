# 生命週期孤兒（出席／請假／試堂／排程）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `in_progress`（**A1＋A2a＋A2b O2 已落 code**；B／C 未做） |
| 優先 | 高 |
| 範圍 | 資格撤銷後下游事實列仍留；以 `attendance_details` 為核心，並涵蓋請假調堂、試堂、軟取消排程 |
| 觸發個案 | 林藝涵：取消 7/24 請假＋7/25 補堂後，點名紙無名但出席紀錄仍有 7/25 兩堂 |
| 原則（定案） | **不**靜默刪計費出席；資格變更時攔截＋Confirm；行政可單列刪（admin＋alien＋稽核） |
| 操作方案 | [`plans/2026-07-31-lifecycle-orphans.md`](../plans/2026-07-31-lifecycle-orphans.md) |
| A2 開工 | [`plans/2026-07-31-lifecycle-orphans-a2-kickoff.md`](../plans/2026-07-31-lifecycle-orphans-a2-kickoff.md)（定案版） |
| 暫存實作 | branch `wip/lifecycle-orphans-impl`；[`plans/patches/`](../plans/patches/README.md)（勿當已上線） |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 相關政策 | [`ATTENDANCE_BILLING.md`](../ATTENDANCE_BILLING.md)、[`LEAVE_MAKEUP_CONSECUTIVE.md`](../manual/LEAVE_MAKEUP_CONSECUTIVE.md) |
| 更新日期 | 2026-08-01 |

## 問題定義

**孤兒**＝上游「應到／資格」已不存在，但下游事實列仍在且仍影響已上堂數／對帳。

- 點名紙＝**當前**名冊；出席＝**歷史寫入**（幾乎只 upsert）。
- 請假「不自動寫／覆寫點名」已文件化；**取消也不刪**是同一設計的另一面，缺維護工具。
- 唯一應用層刪出席：`deleteAttendanceStatusForSchedule` — 僅連堂單項補堂重存清多餘節。
- 排程硬刪：`attendance_details.schedule_id` **ON DELETE SET NULL**（列還在、仍可計費）。

## 出席孤兒盤點

| 嚴重度 | 觸發 | 服務函式 | 結果 |
| --- | --- | --- | --- |
| 高 | 刪請假／清調堂／改調堂日 | `deleteLeaveMakeupRecord` / `updateLeaveMakeupRecord` | 補堂宿主／請假日已點名留下 |
| 高 | 取消／刪／改期試堂 | `updateTrialSession` / `deleteTrialSession` / `rescheduleTrialSession` | 舊堂出席留下 |
| 高 | 手誤清除報讀 | `purgeMistakenEnrollment` | 報讀刪了，已點名留下 |
| 高 | 取消排程（軟） | `updateSchedule` 等 | 堂已取消，出席仍可扣堂 |
| 高 | 刪排程（硬） | `deleteSchedule` | `schedule_id=null` 脫鉤列；仍計費 |
| 中 | 軟退讀生效後 | `withdrawStudentFromClass` | 名單沒人，已點名仍在 |
| 中 | 改期數／單堂選堂 | `updateEnrollmentPeriod` / `replaceEnrollmentSessions` | 不再應到的堂若已點 → 孤兒 |
| 中 | 點名紙縮員後重存 | `confirmRollCall` | 只 upsert 當前名單，不刪已離紙學生 |
| 低／已處理 | 連堂單項補堂誤寫兩節 | `saveAttendanceStatusForStudentScheduleScope` | 重存可清多餘節 |

## 非出席生命週期缺口

| 缺口 | 嚴重度 | 說明 |
| --- | --- | --- |
| 軟取消排程不重設請假／調堂 | 高 | 一般 cancel 留死連結；老師請假精靈會改回待安排 — 行為不一致 |
| 軟取消排程不關試堂 | 高 | 試堂可仍「已預約」掛已取消堂 |
| 作廢收據 ≠ 退讀 | 高（已定手動） | 見 `PAYMENT_RECEIPT_VOID_POLICY` |
| Inbox 快照過期 | 低–中 | 設計如此 |
| 代堂 vs 班主責報表 | 高（誤用風險） | 見 `SCHEDULE_SUBSTITUTE_TEACHER.md` |

## 市場做法摘要（已取捨）

| 做法 | 明學採用 |
| --- | --- |
| PowerSchool：會產孤兒則擋／Confirm | **主路徑**：取消補堂／清調堂掃描筆數 → 三路 Confirm |
| SIF：另提供 Deleter | **O2**：admin 單列刪（應急／歷史） |
| Genesis：夜間 reconcile | **O5**：唯讀健康檢查＋手動清；**不**夜間自動刪 |
| 現代 SMS：soft-delete＋稽核 | 本期硬刪＋`logMgmtAuditAction`；不加 `deleted_at` |

鐵律：勿靜默刪計費事實；資格變更會產孤兒 → 擋或強制選項；真上課保留 vs 誤點／取消補堂用顯式清理。詳見操作方案。

## 未做（分階段）

操作細節、Confirm 預設、模擬風險 → [`plans/2026-07-31-lifecycle-orphans.md`](../plans/2026-07-31-lifecycle-orphans.md)。

| ID | 階段 | 狀態 | 項目 | 說明 | 建議 |
| --- | --- | --- | --- | --- | --- |
| O1 | A1 | **已落** | 取消請假／調堂攔截 | 刪請假或清／改 `makeup_schedule_id` 前查已有出席 → Confirm 一併刪；改調堂日問是否刪舊宿主 | 對齊林藝涵；見模擬 S01 |
| O6 | A1 | **已落** | 文件 | `LEAVE_MAKEUP_CONSECUTIVE` §6；`ATTENDANCE_BILLING` 反操作 | 隨 O1 |
| O1-type | A2a | **已落** | disposition 離調堂 | `disposition≠調堂 && schedule≠null`；刪出席先於 credit；强制清 schedule | **P0**；S03；kickoff §3.1 |
| GAP-P0-1 | A2a | **已落** | otherMakeup×已取消 schedule | eligibility 唔 retain 已取消／完成目標堂 | 隨 type；kickoff §3.1b |
| O1-rollcall | A2a | **已落** | 點名唔寫回已無名冊 | Panel 重拉名冊＋`saveAttendanceStatus` 名冊檢查 | **P0**；S15 |
| O1t | A2a | **已落** | 試堂取消／刪／改期 | 强制一併刪；peers；無保留路 | S11 試堂部分 |
| O2 | A2b | **已落** | 行政刪單列點名 | 主：學生詳情；輔：出席紀錄；admin＋alien；audit | **P0**；S13 |
| O0 | B | 未做 | 可見性 | 標「資格已結束（歷史出席仍計）」 | 模擬 S02／S14 |
| O3 | B | 未做 | 軟取消排程對齊 | 調堂改回待安排；試堂提示／取消 | 模擬 S12 |
| O4 | C | 未做 | 退讀／清報讀／試堂取消改期 | 變更前掃出席＋Confirm（退讀預設保留） | 模擬 S11／S13／S14 |
| O5 | C | 未做 | 對帳健康檢查 | 無應到資格（含 `schedule_id` null）唯讀＋一鍵清 | 可後做 |

## 行政邊緣模擬（2026-07-31）

來源：行政視角桌面能力模擬（20 案）；方法＝對齊現況程式／文件，非瀏覽器 UAT。完整矩陣見 Cursor Canvas `admin-edge-case-simulation.canvas.tsx`。

與**本主題**直接相關的案：

| 模擬 ID | 個案 | 判定 | 發現的問題 | 對應分項 |
| --- | --- | --- | --- | --- |
| S01 | 林藝涵型：取消已點名補堂 | 可完成 | A1 Confirm／peers／eligibility 可收尾；手機請假仍難用（→ mobile-ui） | O1（已落） |
| S02 | 學生真有來補堂、行政誤取消 | 可完成但易錯 | 保留路徑有摩擦；選錯一併刪難還原；**O0 未做**則選「保留」後難在 UI 發現孤兒 | O0；Confirm 文案維持 |
| S03 | 只清調堂／改調堂日 | 可完成但易錯 | 主路徑 A1 OK；**列表 disposition→錄影且不清 schedule** 仍旁路產髒狀態 | A2 O1-type |
| S11 | 已點名試堂取消／改期 | 半完成 | 舊出席可留成孤兒；名冊驗收仍人手 | O4；另見 [trial-sessions.md](./trial-sessions.md) T2 |
| S12 | 軟取消整堂（掛調堂／試堂） | 半完成 | cancel 留死連結；與老師請假精靈行為不一致；出席仍可計費 | O3 |
| S13 | 手誤 purge 報讀後出席仍在 | **無法在 UI 收尾** | 無 O2 單列刪；須 SQL runbook | O2；O4 |
| S14 | 退讀後歷史真上課應保留 | 可完成但易錯 | 預設保留正確；無「資格已結束」標易被當 bug | O0；O4 |
| S15 | 行政一併刪＋老師同時重存點名 | 半完成 | A1 期間老師可把已刪出席寫回 | **A2 O1-rollcall（P0）** |
| S20 | 老師精靈撞已點名補堂 | 可完成 | 老師失敗轉行政；依賴行政懂去請假管理 | O1t／O6 SOP |

**接手優先（本主題內）：** A2a（GAP-P0-1 → O1-type → O1-rollcall → O1t）→ A2b O2 → B O0＋O3 → C O4＋O5。詳見 [a2-kickoff](../plans/2026-07-31-lifecycle-orphans-a2-kickoff.md)。

不屬本主題、已另立 backlog：原班連堂分節點名（S06）、連堂請假預設 UX（S04）、逾期入室（S10）、代堂算薪報表（S07）、手機 Inbox／請假（S19）。

## 個案應急（林藝涵）

UI 無刪出席。須以 `student_id` + `class_id` + `attendance_date = 2025-07-25`（核對實際年）及兩筆 `schedule_id` 刪 `attendance_details`（Table Editor／SQL）。**不**自動對 production 執行，另請再做。

```sql
-- 先 SELECT 確認，再 DELETE
SELECT id, student_id, class_id, schedule_id, attendance_date, status
FROM attendance_details
WHERE attendance_date = '2025-07-25'  -- 核對年份
  AND student_id = '<林藝涵 uuid>';
```

## 相關程式

- 請假：[`leaveQueries.ts`](../../src/services/leaveQueries.ts)（`deleteLeaveMakeupRecord`、`updateLeaveMakeupRecord`）
- 出席：[`attendanceQueries.ts`](../../src/services/attendanceQueries.ts)（`deleteAttendanceStatusForSchedule`、`confirmRollCall` 路徑）
- 點名 UI：[`RollCallClassPanel.tsx`](../../src/components/attendance/RollCallClassPanel.tsx)
- 試堂：[`trialQueries.ts`](../../src/services/trialQueries.ts)
- 報讀：[`studentQueries.ts`](../../src/services/studentQueries.ts)（`purgeMistakenEnrollment`、`withdrawStudentFromClass`）
