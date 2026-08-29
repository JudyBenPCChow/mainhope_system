# 功課輔導班 — 正式實作（H11 後）

> 日期：2026-08-24  
> 狀態：`in_progress`（波次 4b 佔室已落地；4c 用戶管理功輔導師；4d 純功輔側欄已入 main；UI 收斂已做；月費已繳改睇繳費紀錄）  
> 產品：[`homework-tutoring.md`](../topics/homework-tutoring.md)  
> UI：[`2026-08-01-homework-tutoring-ui-design-v2-roles.md`](./2026-08-01-homework-tutoring-ui-design-v2-roles.md)

H11 沙盒 **2026-08-24 通過**。本檔＝分期實作；**唔另建報讀表**。

## 已落地

| 波次 | 內容 | 現況 |
| --- | --- | --- |
| 1 | 正式側欄＋老師入口 `teachers.homework_tutoring_nav` | ✅ |
| 2 | `class_kind=homework`；2627 混級一班 `2627-HWKS1099-A`；報讀日數檔／星期；學生詳細頁可報讀；名冊接 DB | ✅ |
| 3 | 月費：應繳睇價目表；已繳睇繳費紀錄；收款走 `/Payments`（唔開新入口） | ✅ 2026-08-29（8 月暑期實收唔改） |
| 4a | 放假日／報更／月工作表／當值持久化 | ✅ |
| 4b | 確定編更寫入 `schedules` 佔室（15:15 起；17D／17E） | ✅ 2026-08-25 |
| 4c | `/Users`「新增功輔班導師用戶」（綁既有老師＋Auth／app_users＋開功輔側欄） | ✅ 碼已 push（`ed22b38d`）＋**edge deploy 2026-08-29**（v4）；待 merge／實機點一次 |
| 4d | 純功輔導師側欄 `teachers.homework_tutor_only` | ✅ 碼已入 main；待驗收（Rain 等五人）；建帳可一併寫此旗標 |
| 4e | 共用畫面移出 `prototypes`；報讀刪「學部」篩選 | ✅ 2026-08-29 |
| 5 | 2627 指引 §7 編更 | ✅ 守則 §7.4 已寫（發佈見營運指引題） |

### 波次 4c 檔案

- `src/components/users/UserManagementView.tsx` — 第二按鈕／對話框
- `src/services/mgmtUserQueries.ts` — `enableHomeworkTutoringNav`
- `supabase/functions/create-mgmt-user/index.ts` — 建立後設 `homework_tutoring_nav=true`（**production v4 已 deploy**）
- `supabase/functions/_shared/apoKnowledge.ts` — 阿Po 操作提示

收尾：merge `homeworkuser` → main → alien 實機建帳。

## 明確唔做（本期）

- 另建功輔報讀表
- 專科式請假／補堂／扣堂；學生點名紙
- 每日功課進度（Notion）
- 計糧功輔時薪／Christine 佣金（見 [`../topics/homework-tutoring-payroll.md`](../topics/homework-tutoring-payroll.md)）
- 正式側欄用頁內標籤
