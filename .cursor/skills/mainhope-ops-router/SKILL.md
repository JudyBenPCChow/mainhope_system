---
name: mainhope-ops-router
description: >-
  把明學日常營運對話分到正確的專案 skill（查班、未點名、明日課堂、試堂 PDF、學費追收、
  功輔月曆／當值通知、補堂表、班別名單 PDF、自動信是否已寄、空課室、前台寫庫、
  營運異常檢查、工資單、產品方案模擬、把總結寄給 Mark Yu 或 Sophie Yu）。
  Use when the user says 今早營運、該用哪份 skill、查人數出PDF寄信改庫, or combines several of
  未點名、明日課堂、試堂名單、學費追收、功輔月曆、某人當值、可否報更、查班、調堂、退讀、工資單、有沒有異常 in one message.
---

# 明學營運分流

本 skill **只做分流**：對上表之後，讀並遵守該份 skill。不要在這裡發明查詢或文案。

查人數、出 PDF、寄信、改庫：只用本機 Agent（這部電腦的 Cursor 對話）。Cloud Agent 缺 `execute_sql`／`.env.mail` 就停，見 `no-forced-output-without-access.mdc`。

回覆用語：繁體中文書面語。術語見 `.cursor/rules/terminology.mdc`。

## 表

| 用戶在說 | 讀 |
| --- | --- |
| 中四中文、年級＋科目、查班、有幾班幾多人 | `class-by-grade-subject` |
| 列出目前各班人數、各班人數、只出人數表 | `class-roster-pdf`（只出人數表，不出 PDF） |
| 未點名提醒、各人一段、寄老師補點名 | `missing-roll-call-reminder` |
| 專科點名檢查、奇怪宣告、點名異常報告 | `specialist-rollcall-followup` |
| 明日課堂、今晚寄老師明天堂 | `tomorrow-teacher-lesson-reminder` |
| 試堂名單 PDF、試堂跟進寄電郵、明天及後天試堂名單 | `trial-followup-pdf-mail` |
| 今日自動信寄了沒有、試堂報告或追收或明日課堂有沒有寄出 | `scheduled-email-status`（只查不寄） |
| 追收學費、未交學費名單、寄 Sophie | `tuition-chase-pdf-mail` |
| 整月新報讀、新報讀整體報告、十一月新報讀 | `monthly-new-enrollment-report` |
| 功輔月曆、當值表 PDF、某人某月當值 | `homework-duty-month-pdf`（點名老師則純文字，不出 PDF） |
| 空課室、可開新班、兩位老師撞堂 | `room-availability` |
| 所有班別 PDF、班別時間老師學生、重出班別名單 | `class-roster-pdf` |
| 執行功輔當值通知、寄當值更新 | `homework-duty-change-notify` |
| 未完成補堂、請假未安排 PDF、已排未上 | `leave-makeup-followup` |
| 未安排請假是否不補回、減收沒選不補回、已點現場卻有請假、老師請假未補回核對 PDF | `leave-unarranged-check` |
| 調堂、補堂、試堂、半價／正價出單、停退、退讀、改為正價、作廢這張單 | `frontdesk-makeup-trial-ops` |
| 出工資單、上月工資單、計糧、記為已結算、過帳人工 | `payroll-month-payslip` |
| 模擬檢查、會否有新問題、方案不要實作 | `product-change-simulate` |
| 檢查一段日期的點名、補堂、試堂、排程有沒有異常 | `ops-exception-scan` |
| 本月新增報讀一個月學費、新增學生涉及學費 | 個人 skill `enrollment-monthly-revenue-runrate`（新增報讀模式） |
| 預算收入、典型月均、維持現況一個月收多少 | 同上（就讀中全量；不含私人課程） |
| 官網時間表、交給網站更新公開班表 | 沒有 skill。不要用 `class-roster-pdf`。說明後停止 |
| 可否報某月功輔更 | `homework-duty-month-pdf`（只答可否，不出 PDF） |
| 把總結發給 Mark Yu、Sophie Yu、總結寄管理層 | `system-change-summary-mail`（主旨【系統修改】；文末無須回覆句）。該 skill 目錄不要 commit、不要 push |

一句含多項：按上表逐項跑，不要合併成一份自訂報告。

## 不是本表

權限稽核 → `mainhope-adversarial-audit`（須 `@` 或明示；不會自動載入）。畫面巡檢、全專案找未知界面問題 → `mainhope-operational-audit`。改 schema → `apply-supabase-migration`。時間表改班 → `2627-timetable-patch`。

載入變慢、任何分頁很慢：當工程問題，不要查這張表。讀方案文件給意見、而不是模擬上線後果：不要走 `product-change-simulate`。

## 開場不夠時

缺學生／班／日期／是否寄出，先問缺的那一項，不要猜。未說「寄出」就不要寄。未說「寫入／退讀／作廢」就不要改庫。
