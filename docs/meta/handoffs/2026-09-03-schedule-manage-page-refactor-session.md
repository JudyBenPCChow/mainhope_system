# Session HANDOFF：排程管理頁重整已合入，待人工營運驗收

| 欄位 | 值 |
| --- | --- |
| 日期 | 2026-09-03 |
| 主題／backlog | [`docs/product/topics/schedule-manage-page-refactor.md`](../../product/topics/schedule-manage-page-refactor.md)（`in_progress`：波次 3–4 已落地；人工營運驗收尚未完成） |
| 分支／工作樹 | 已合入 `main`（PR [#106](https://github.com/JudyBenPCChow/mainhope_system/pull/106)，`438167dc`）。本工作樹 `/Users/hoiyingfan/Desktop/mainhope_schedule-manage` 現在就在 `main`，與 `origin/main` 一致。`feat/schedule-manage-page-refactor` 已刪。 |

## 目標

- 把 `/Schedule` 由單一大元件拆成清單／篩選／日視圖／預覽模組，首屏基本列、完整名單按需、KPI 獨立、桌面列表右側預覽、詳情兩分頁。
- 本會話負責查核是否已合入，並 commit 至 merge。

## 已完成

- PR [#106](https://github.com/JudyBenPCChow/mainhope_system/pull/106) 已 merge；CI（lint／typecheck:test／test／ui:check／build）通過。
- 波次 0–4 程式已在 `main`：`ScheduleOverview`、`ScheduleFilters`、`ScheduleByDateList`、`ScheduleListTable`、`ScheduleDayViewPanel`、`SchedulePreviewPanel`、`useScheduleListData`、`useOpenScheduleRecord`、`scheduleManageDateState` 等。
- 完整詳情 `/Schedule/:scheduleId`：分頁「概覽與操作」「名單與出席」；返回還原日期、視圖、篩選及選定排程。
- 更新日志 SU-20260903-03～08；錯題本 2026-09-03 兩條（本地 `main`，**尚未 commit**）。

## 未完成／卡住

- **人工營運驗收未做**（分題 §13.6）。未用瀏覽器實機操作；不以 CI 代替。
- 14 日摘要仍呼叫既有 `get_teacher_schedule_roster_context` 再丟棄學生列。真要不下載學生資料，需另抽資料庫 eligibility helper（超出本題已合入範圍）。
- 分題仍 `in_progress`；未在 `main` 搬 `BACKLOG.md` 索引。
- 本工作區另有過期未追蹤檔：`docs/meta/handoffs/2026-09-02-student-payment-year-summary-session.md`（該題已合 PR #97，稿已過時）、`scripts/__pycache__/import_hk_expense_history.cpython-314.pyc`。

## 下一步（給新會話）

1. 按分題 §13.6 做人工營運驗收（桌面／手機；行政／管理層／財務／老師／外星人），並寫入分題。
2. 驗收通過後才把分題改 `done`，並在 **`main`** 搬 `BACKLOG.md` 索引。
3. 若要發布更新日志與錯題本：把本工作樹未提交的 `SYSTEM_UPDATES.md`、`AGENT_LESSONS.md`、本 HANDOFF 在 `main` 開文件 PR。

## 開局必讀（精簡）

- `AGENTS.md`
- `docs/product/topics/schedule-manage-page-refactor.md`（尤其 §11 操作保留、§13.6 人工驗收）
- `src/components/schedule/ScheduleManagePage.tsx`

## 勿再踩

- 唔好把 feature commit 做到本地 `main`；PR 唔帶 `dist/`。
- 未知人數唔好顯示 0；摘要完成前停用「未有學生報讀」同含人數匯出。
- 過期 `2026-09-02-student-payment-year-summary-session.md` 唔好當未做（繳費分頁已合 PR #97）。
- 校舍假期唔當取消堂；`makeup_of=` 唔好刪。

## 明確唔做

- 不新增取消堂結案生命週期、不新增完整週視圖。
- 不 bump 2627 時間表方案、不出 md／docx／pdf。
- 不改排程／點名／補堂／代堂／功輔佔室規則。
- 不在未完成人工驗收前把分題改 `done` 或搬 `BACKLOG.md`。
