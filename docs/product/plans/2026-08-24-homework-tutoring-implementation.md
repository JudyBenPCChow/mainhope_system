# 功課輔導班 — 正式實作（H11 後）

> 日期：2026-08-24  
> 狀態：`in_progress`（波次 1）  
> 產品：[`homework-tutoring.md`](../topics/homework-tutoring.md)  
> UI：[`2026-08-01-homework-tutoring-ui-design-v2-roles.md`](./2026-08-01-homework-tutoring-ui-design-v2-roles.md)

H11 沙盒 **2026-08-24 通過**。本檔＝分期實作；**唔另建報讀表**。

## 波次 1（本輪）— 側欄入口

正式側欄一級 **「功課輔導」**（打開後見二級副頁），各副頁獨立路由；畫面暫重用沙盒工作台（假資料）。

| 角色 | 側欄項 | 路由 |
| --- | --- | --- |
| admin／alien | 概覽、報讀學生、月費、當值編更、功輔校曆、設定 | `/HomeworkTutoring/Overview` 等 |
| manager／alien | 監督首屏、本月當值、報更進度、月費異常、老師入口 | `/HomeworkTutoring/Supervise` 等 |
| teacher | 功輔報更、我的當值 | `/HomeworkTutoring/Submit`、`/MyDuty` |

老師項只在管理層／外星人於「老師入口」剔選後顯示。預設全體專科老師**無**入口。

不含：`class_kind` 功輔班、報讀月費、編更寫入排程、計糧。

## 其後

| 波次 | 內容 |
| --- | --- |
| 2 | `class_kind` 加功輔（或等價）；學生詳細頁「報讀班別」加入功課輔導班；報讀學生頁接真名冊 |
| 3 | 月費登記（價曆已簽）；接現有繳費入口 |
| 4 | 報更／月工作表持久化；確定編更寫佔用＋當值；放假日接 `homework_tutoring_calendar_closures` |
| 5 | 補 2627 指引 §7 編更（本波閘已開，可與 4 並行） |
| — | 計糧功輔時薪：交計糧引擎，本期唔做 |

## 明確唔做

- 另建功輔報讀表
- 專科式請假／補堂／扣堂；學生點名紙
- 每日功課進度（Notion）
- 正式側欄用頁內標籤
