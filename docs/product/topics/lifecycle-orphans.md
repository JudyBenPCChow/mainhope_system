# 生命週期孤兒（出席／請假／試堂／排程）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `done`（2026-08-01：A1／A2／O3／O4 已落；**O0／O5 本期不做**，需要時另開主題） |
| 優先 | 高 |
| 範圍 | 資格撤銷後下游事實列仍留；以 `attendance_details` 為核心，並涵蓋請假調堂、試堂、軟取消排程 |
| 觸發個案 | 林藝涵：取消 7/24 請假＋7/25 補堂後，點名紙無名但出席紀錄仍有 7/25 兩堂（個案結案：剩現場＝報讀堂，毋須刪） |
| 原則（定案） | **不**靜默刪計費出席；資格變更時攔截＋Confirm；行政可單列刪（admin＋alien＋稽核） |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 相關政策 | [`ATTENDANCE_BILLING.md`](../policies/attendance/ATTENDANCE_BILLING.md)、[`LEAVE_MAKEUP_CONSECUTIVE.md`](../playbooks/frontdesk/LEAVE_MAKEUP_CONSECUTIVE.md) §6 |
| 更新日期 | 2026-08-01 |

## 問題定義

**孤兒**＝上游「應到／資格」已不存在，但下游事實列仍在且仍影響已上堂數／對帳。

- 點名紙＝**當前**名冊；出席＝**歷史寫入**（幾乎只 upsert）。
- 請假「不自動寫／覆寫點名」已文件化；取消路徑已由 **A1／A2** 攔截＋Confirm／單列刪補上。
- 排程硬刪：`attendance_details.schedule_id` **ON DELETE SET NULL**（列還在、仍可計費）→ 仍待 **O5**。

## 出席孤兒盤點

| 嚴重度 | 觸發 | 現況（2026-08-01） |
| --- | --- | --- |
| 高 | 刪請假／清調堂／改調堂日 | **A1 已覆蓋**（Confirm＋peers＋eligibility） |
| 高 | 列表 disposition 離調堂 | **A2a O1-type 已覆蓋** |
| 高 | 取消／刪／改期試堂 | **A2a O1t 已覆蓋**（强制一併刪） |
| 高 | 點名紙縮員後重存寫回 | **A2a O1-rollcall 已覆蓋** |
| 高 | 歷史／應急單列 | **A2b O2 已覆蓋**（學生詳情主＋出席紀錄輔） |
| 高 | 手誤清除報讀 | **O4 已覆蓋**（預設一併刪；可保留） |
| 高 | 軟取消排程 | **O3 已覆蓋**（清調堂＋試堂／出席 Confirm；預設保留出席） |
| 高 | 硬刪已點名排程 → `schedule_id` null | 仍待 **O5**（勿硬刪；應軟取消） |
| 中 | 軟退讀可見性／標籤 | 退讀掃出席 **O4 已覆蓋**；標籤仍待 **O0** |

## 非出席生命週期缺口

| 缺口 | 嚴重度 | 說明 |
| --- | --- | --- |
| 軟取消排程不重設請假／調堂 | 高 | → **O3 已落** |
| 軟取消排程不關試堂 | 高 | → **O3 已落** |
| 作廢收據 ≠ 退讀 | 高（已定手動） | 見 `PAYMENT_RECEIPT_VOID_POLICY` |
| Inbox 快照過期 | 低–中 | 設計如此 |
| 代堂 vs 班主責報表 | 高（誤用風險） | 見 `SCHEDULE_SUBSTITUTE_TEACHER.md` |

## 市場做法摘要（已取捨）

| 做法 | 明學採用 |
| --- | --- |
| PowerSchool：會產孤兒則擋／Confirm | **已落**：取消補堂／清調堂／disposition／試堂／軟取消／退讀 |
| SIF：另提供 Deleter | **已落 O2**：admin＋alien 單列刪＋audit（過渡 mgmtRole） |
| Genesis：夜間 reconcile | **O5**：唯讀健康檢查＋手動清；**不**夜間自動刪 |
| 現代 SMS：soft-delete＋稽核 | 本期硬刪＋`logMgmtAuditAction`；不加 `deleted_at` |

## 分階段狀態

過程稿已刪；階段表以下為準。舊 parked 實作曾在 `docs/product/plans/patches/`，完整快照仍可自 git 歷史或 branch `wip/lifecycle-orphans-impl` 取回。

### 階段 A（止血）— 完成

| ID | 階段 | 狀態 | 項目 | 說明 |
| --- | --- | --- | --- | --- |
| O1 | A1 | **已落** | 取消請假／調堂攔截 | Confirm 一併刪／保留；peers＋eligibility |
| O6 | A1 | **已落** | 文件 | `LEAVE_MAKEUP_CONSECUTIVE` §6；runbook |
| O1-type | A2a | **已落** | disposition 離調堂 | 刪出席先於 credit；强制清 schedule |
| GAP-P0-1 | A2a | **已落** | otherMakeup×已取消 schedule | eligibility 補丁 |
| O1-rollcall | A2a | **已落** | 點名唔寫回已無名冊 | Panel 重拉＋`saveAttendanceStatus` 檢查 |
| O1t | A2a | **已落** | 試堂取消／刪／改期 | 强制一併刪；無保留路 |
| O2 | A2b | **已落** | 行政刪單列點名 | 主：學生詳情；輔：`/AttendanceRecords`；admin＋alien＋audit |

### 階段 B／C — 本期結案範圍

| ID | 階段 | 狀態 | 項目 | 說明 | 建議 |
| --- | --- | --- | --- | --- | --- |
| O0 | B | **本期不做** | 可見性 | 標「資格已結束（歷史出席仍計）」 | 需要時另開 |
| O3 | B | **已落** | 軟取消排程對齊 | 調堂改回待安排；試堂一併取消；出席預設保留 | S12 |
| O4 | C | **已落** | 退讀／清報讀掃出席 | 退讀預設保留；purge 預設刪 | S13／S14 |
| O5 | C | **本期不做** | 對帳健康檢查 | 無應到資格（含 `schedule_id` null）唯讀＋一鍵清 | 需要時另開 |

**本主題已結案。** O0／O5 非 blocker；日後有批量清庫／標籤需求再新開 backlog。

## 行政邊緣模擬（結案對齊）

| 模擬 ID | 個案 | 現況判定 | 對應 |
| --- | --- | --- | --- |
| S01 | 林藝涵型：取消已點名補堂 | **可完成**（A1） | O1 |
| S02 | 真有來補堂、誤取消 | 可完成但易錯；標籤 O0 本期不做 | O0（另開） |
| S03 | disposition→錄影等 | **可完成**（O1-type） | O1-type |
| S11 | 試堂取消／改期出席 | **已結**（O1t；trial 收尾 done） | O1t |
| S12 | 軟取消整堂 | **可完成**（O3） | O3 |
| S13 | purge 報讀後出席 | **可完成**（O4） | O4 |
| S14 | 退讀後真上課保留 | **可完成**（O4 預設保留） | O4 |
| S15 | 一併刪＋同時重存點名 | **已防寫回**（O1-rollcall） | O1-rollcall |
| S20 | 老師精靈撞已點名補堂 | 可完成（轉行政） | O6 SOP |

## 個案應急（林藝涵）

- 補堂孤兒敘事：請假已刪；庫內 `2026-07-25` 剩「現場」且該班有報讀 → **毋須刪**。  
- 日後同類應急：優先用 **學生詳情／出席紀錄「刪除」**（O2）；無 UI 權限時仍可用 SQL runbook（見 [`LIFECYCLE_ORPHAN_CLEANUP_RUNBOOK.md`](../playbooks/frontdesk/LIFECYCLE_ORPHAN_CLEANUP_RUNBOOK.md)）。

## 相關程式

- 生命週期核心：[`attendanceLifecycleQueries.ts`](../../src/services/attendanceLifecycleQueries.ts)（掃描／eligibility／稽核刪／`deleteAttendanceDetailAsMgmt`）
- 軟取消：[`scheduleLifecycleQueries.ts`](../../src/services/scheduleLifecycleQueries.ts)、[`scheduleSoftCancelConfirm.ts`](../../src/lib/scheduleSoftCancelConfirm.ts)
- 退讀／清報讀：[`studentQueries.ts`](../../src/services/studentQueries.ts)、[`enrollmentAttendanceConfirm.ts`](../../src/lib/enrollmentAttendanceConfirm.ts)
- 請假：[`leaveQueries.ts`](../../src/services/leaveQueries.ts)（含 disposition 閘門）
- 請假 UI：[`LeaveManagementView.tsx`](../../src/components/leaves/LeaveManagementView.tsx)
- 點名：[`RollCallClassPanel.tsx`](../../src/components/attendance/RollCallClassPanel.tsx)、[`attendanceQueries.ts`](../../src/services/attendanceQueries.ts)
- 試堂：[`trialQueries.ts`](../../src/services/trialQueries.ts)、[`TrialSessionsView.tsx`](../../src/components/trials/TrialSessionsView.tsx)
- O2 UI：[`StudentDetailView.tsx`](../../src/components/students/StudentDetailView.tsx)（主）、[`AttendanceRecordsPage.tsx`](../../src/components/attendance/AttendanceRecordsPage.tsx)（輔）
