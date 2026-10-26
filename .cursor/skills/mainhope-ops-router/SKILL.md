---
name: mainhope-ops-router
description: >-
  把明學日常營運對話分到正確的專案 skill（查班、未點名、明日課堂、試堂 PDF、學費追收、
  功輔月曆／當值通知、補堂表、前台寫庫、產品方案模擬）。Use when the user says
  今早營運、該用哪份 skill、查人數出PDF寄信改庫, or combines several of
  未點名、明日課堂、試堂名單、學費追收、功輔月曆、某人當值、可否報更、查班、調堂、退讀 in one message.
---

# 明學營運分流

本 skill **只做分流**：對上表之後，讀並遵守該份 skill。不要在這裡發明查詢或文案。

查人數、出 PDF、寄信、改庫：只用本機 Agent（這部電腦的 Cursor 對話）。Cloud Agent 缺 `execute_sql`／`.env.mail` 就停，見 `no-forced-output-without-access.mdc`。

回覆用語：繁體中文書面語。術語見 `.cursor/rules/terminology.mdc`。

## 表

| 用戶在說 | 讀 |
| --- | --- |
| 中四中文、年級＋科目、查班、有幾班幾多人 | `class-by-grade-subject` |
| 未點名提醒、各人一段、寄老師補點名 | `missing-roll-call-reminder` |
| 專科點名檢查、奇怪宣告、點名異常報告 | `specialist-rollcall-followup` |
| 明日課堂、今晚寄老師明天堂 | `tomorrow-teacher-lesson-reminder` |
| 試堂名單 PDF、試堂跟進寄電郵 | `trial-followup-pdf-mail` |
| 追收學費、未交學費名單、寄 Sophie | `tuition-chase-pdf-mail` |
| 功輔月曆、當值表 PDF、某人某月當值 | `homework-duty-month-pdf`（點名老師則純文字，不出 PDF） |
| 可否報某月功輔更 | `homework-duty-month-pdf`（只答可否，不出 PDF） |
| 執行功輔當值通知、寄當值更新 | `homework-duty-change-notify` |
| 未完成補堂、請假未安排 PDF | `leave-makeup-followup` |
| 調堂、補堂、試堂、半價／正價出單、停退、退讀、改為正價、作廢這張單 | `frontdesk-makeup-trial-ops` |
| 模擬檢查、會否有新問題、方案不要實作 | `product-change-simulate` |

一句含多項：按上表逐項跑，不要合併成一份自訂報告。

## 不是本表

權限稽核 → `mainhope-adversarial-audit`（須 `@` 或明示；不會自動載入）。畫面巡檢 → `mainhope-operational-audit`。改 schema → `apply-supabase-migration`。時間表改班 → `2627-timetable-patch`。

## 開場不夠時

缺學生／班／日期／是否寄出，先問缺的那一項，不要猜。未說「寄出」就不要寄。未說「寫入／退讀／作廢」就不要改庫。
