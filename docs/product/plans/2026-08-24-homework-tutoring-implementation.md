# 功課輔導班 — 正式實作（H11 後）

> 日期：2026-08-24  
> 狀態：`in_progress`（波次 4b 佔室已落地；用戶管理功輔導師本地碼；月費對賬／§7 編更／UI 收斂待做）  
> 產品：[`homework-tutoring.md`](../topics/homework-tutoring.md)  
> UI：[`2026-08-01-homework-tutoring-ui-design-v2-roles.md`](./2026-08-01-homework-tutoring-ui-design-v2-roles.md)

H11 沙盒 **2026-08-24 通過**。本檔＝分期實作；**唔另建報讀表**。

## 已落地

| 波次 | 內容 | 現況 |
| --- | --- | --- |
| 1 | 正式側欄＋老師入口 `teachers.homework_tutoring_nav` | ✅ |
| 2 | `class_kind=homework`；2627 混級一班 `2627-HWKS1099-A`；報讀日數檔／星期；學生詳細頁可報讀；名冊接 DB | ✅ |
| 3 | `homework_tutoring_monthly_charges`；價目對齊政策；月費頁 ensure 應收 | ✅（收款連 payments 可再收細） |
| 4a | 放假日／報更／月工作表／當值持久化 | ✅ |
| 4b | 確定編更寫入 `schedules` 佔室（15:15 起；17D／17E） | ✅ 2026-08-25 |
| 4c | `/Users`「新增功輔班導師用戶」（綁既有老師＋Auth／app_users＋開功輔側欄） | ✅ 碼＋**edge deploy 2026-08-29**（v4）；待 merge／實機點一次 |
| 5 | 2627 指引 §7 編更 | 閘已開；待寫 |

### 波次 4c 檔案

- `src/components/users/UserManagementView.tsx` — 第二按鈕／對話框
- `src/services/mgmtUserQueries.ts` — `enableHomeworkTutoringNav`
- `supabase/functions/create-mgmt-user/index.ts` — 建立後設 `homework_tutoring_nav=true`（**production v4 已 deploy**）
- `supabase/functions/_shared/apoKnowledge.ts` — 阿Po 操作提示

收尾：commit／merge `homeworkuser` → alien 實機建帳。

## 明確唔做（本期）

- 另建功輔報讀表
- 專科式請假／補堂／扣堂；學生點名紙
- 每日功課進度（Notion）
- 計糧功輔時薪
- 正式側欄用頁內標籤
