# 生命週期孤兒（出席／請假／試堂／排程）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `in_progress`（**A1 實作中／已落 code**；A2 未做） |
| 優先 | 高 |
| 範圍 | 資格撤銷後下游事實列仍留；以 `attendance_details` 為核心，並涵蓋請假調堂、試堂、軟取消排程 |
| 觸發個案 | 林藝涵：取消 7/24 請假＋7/25 補堂後，點名紙無名但出席紀錄仍有 7/25 兩堂 |
| 原則（定案） | **不**靜默刪計費出席；資格變更時攔截＋Confirm；行政可單列刪（admin＋稽核） |
| 操作方案 | [`plans/2026-07-31-lifecycle-orphans.md`](../plans/2026-07-31-lifecycle-orphans.md)（市場組合＋分階段 A／B／C＋操作模擬） |
| 暫存實作 | branch `wip/lifecycle-orphans-impl`；[`plans/patches/`](../plans/patches/README.md)（勿當已上線） |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 相關政策 | [`ATTENDANCE_BILLING.md`](../ATTENDANCE_BILLING.md)、[`LEAVE_MAKEUP_CONSECUTIVE.md`](../manual/LEAVE_MAKEUP_CONSECUTIVE.md) |
| 更新日期 | 2026-07-31 |

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

| ID | 階段 | 項目 | 說明 | 建議 |
| --- | --- | --- | --- | --- |
| O1 | A | 取消請假／調堂攔截 | 刪請假或清／改 `makeup_schedule_id` 前查已有出席 → Confirm 一併刪；改調堂日問是否刪舊宿主 | **對齊林藝涵案，優先** |
| O6 | A | 文件 | `LEAVE_MAKEUP_CONSECUTIVE` 加「取消請假」；`ATTENDANCE_BILLING` 寫反操作 | 隨 O1 一併 |
| O2 | A | 行政刪單列點名 | `/AttendanceRecords` 或學生詳情；僅 admin；呼叫既有 delete helper；簡單稽核 | 應急／歷史案 |
| O0 | B | 可見性 | 出席紀錄／排程詳情標「資格已結束（歷史出席仍計）」類（對照報讀＋試堂＋補堂） | 資訊標籤，非一鍵刪 |
| O3 | B | 軟取消排程對齊 | 掛該堂的調堂改回待安排（比照老師請假精靈）；開著試堂提示／改取消 | 消死連結 |
| O4 | C | 退讀／清報讀／試堂取消改期 | 同一套「變更前掃描出席＋Confirm」；預設偏向保留已點名 | 與 O1 共用掃描 API |
| O5 | C | 對帳健康檢查 | 列出無對應應到資格的 `attendance_details`（唯讀＋一鍵清，admin） | 可後做 |

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
