---
name: tomorrow-teacher-lesson-reminder
description: >-
  查 production 香港「明日」各老師課堂，組電郵正文（含學生／錄影 Zoom／事假病假／備註）。
  Use when the user says 明日課堂提醒、明天課堂電郵、老師明日排程通知、每晚課堂提醒、
  生成各老師明天課堂, or asks to email teachers tomorrow's lessons.
---

# 老師明日課堂提醒（電郵）

以各老師為單位，每人一封。文案用繁體中文書面語，用詞跟 `.cursor/rules/terminology.mdc`。

無 MCP `execute_sql`：**停、通知使用者**。不要用對話舊名單。見 `.cursor/rules/no-forced-output-without-access.mdc`。不要代寄；用戶另給收件地址並明講寄出，才用 `mainhope-mail`。正式自動寄老師本人時，用 `teachers_private.notification_email`（無則跳過並在行政總結註明）。

系統畫面「明日課堂提醒」是 WhatsApp 簡版（無完整名單）；**本 skill 是電郵完整版**，名單口徑對齊點名紙。

## 何時用

用戶說：**明日課堂提醒**、明天課堂電郵、老師明日排程通知、每晚課堂提醒、生成各老師明天課堂。

## 步驟

1. 目標日：用戶指定用該日；無指定＝香港今日的**翌日**（`Asia/Hong_Kong`）。
2. `project_id` 取專案 `.mcp.json` 的 `project_ref`。讀 [queries.md](queries.md)，代入目標日後 `execute_sql`。每次重查。
3. 只計該日、未取消、已指派 `schedules.teacher_id` 的堂。含**專科／功輔／私人（一對一等）**；僅排除測試（名或班號含 Test）。空班、全員僅事假／病假（無現場應到、無錄影／Zoom）的堂**仍列入**，並加一行 `狀態︰不用上堂`。
4. 老師用該堂 `schedules.teacher_id`（代堂後實授老師）。同一老師多堂合併一封，按 `start_time` 排序。每封正式／模擬信 **BCC** `cfan@mainhope.edu.hk`。
5. 每堂組四類名單（互斥優先序）：
   - **錄影／zoom名單**：該堂 `leave_makeup_records` 且 `makeup_type` 含錄影／網課／線上／zoom／即時直播／錄影回放（對齊 `isOnlineLeaveMakeup`／`isRecordLeaveMakeup`）。
   - **事假／病假名單**：該堂請假、但不屬上一類；`leave_reason` 含病→歸病假側，其餘事假側，名單合併寫在同一欄（頓號分隔）。
   - **學生名單**：專科＝宣告∩就讀／試堂／補堂目標；**功輔／私人＝就讀中報讀**（＋試堂／補堂目標）；再扣走上述兩類。
6. **課堂**欄＝`classrooms.name`（使用者範本寫「課堂︰17d」；系統即課室名，例如 `17D`／`17d` 照庫內寫法）。
7. **備註（如有）**：
   - 有錄影／zoom 生：`請錄影給{姓名頓號分隔}`（可與其他備註並列）。
   - 請假且已有補回安排：用該列 `remarks`；若空則組「{姓名}因{leave_reason}請假，將於{makeup 日／說明}補回此堂」；無補回日則只寫已知理由，不要捏造日期。
   - 代堂：可附「代堂（原：{原老師}）」；加堂可附「加堂」。無則該行仍保留「備註（如有）︰」留空。
8. 對話預覽先一行寫範圍（明日哪一日、幾位老師、幾堂），再貼各則。無人有堂則只寫一句。測試寄信只寄用戶指定信箱，不要寄老師本人。

## 電郵正文

每人一封。

- 主旨：`【明學教育】明日(D/M）課堂提醒（{english_name}）`——日期不補零（例 `16/10`）；括號為半形開、全形關；姓名用 `english_name`（缺則 `full_name`），**主旨不加** Mr./Ms.
- 正文稱呼：讀 `teachers.honorific`（`Ms.`／`Mr.`）；空則 `Mr./Ms.`。後接姓名，無逗號。可在老師詳情維護。
- 首句：`明天(YYYY年M月D日星期X），閣下有{中文節數}節排程紀錄。`（括號同樣半形開、全形關）
- 不用上堂：班別行末加 ` 【不用上堂】`，並另起一行 `狀態︰不用上堂`
- 節數用中文（一、兩、三…）。時間 `HH:mm-HH:mm`。班別行：`{course_code_full} {course_name}`（無 `course_name` 則用 `subject`）。結語不要改寫。

```
主旨：【明學教育】明日(16/10）課堂提醒（Rain Kwok）

Ms. Rain Kwok

明天(2026年10月16日星期五），閣下有兩節排程紀錄。

1. 2627-CHI4008-A 中五級中文班
時間︰11:30-12:45
課堂︰17d
學生名單︰陳大文、李小明
錄影／zoom名單︰王美麗
事假／病假名單︰
備註（如有）︰請錄影給王美麗

2. 2627-CHI5008-B 中四級中文班 【不用上堂】
時間︰12:45-14:00
課堂︰17d
狀態︰不用上堂
學生名單︰
錄影／zoom名單︰
事假／病假名單︰朱曉晴
備註（如有）︰朱曉晴因學校活動請假，將於x月x日補回此堂

煩請上堂後及時點名，方便前台同事跟進。如有問題，請聯絡Christine Fan
（此乃系統自動生成提醒，請勿回覆本電郵）
```

只有一節時首句改為「……有一節排程紀錄。」，課堂仍用 `1.` 編號。時間寫成 `HH:mm-HH:mm`（不要多一個多餘連字號）。空名單欄位標題仍要寫出，值可留空。

## 行政總結（可選）

用戶要求給行政時另成一封。主旨：`系統報告︰明日課堂提醒寄出摘要`。列出已組文的老師與堂數；若自動寄出，註明已寄／缺 `notification_email` 而跳過者。未寄老師則不要寫成已寄出。

## 自動化

- Edge Function：`tomorrow-teacher-lesson-reminder`
- 排程：GitHub Actions 每天 **香港時間 20:00**（UTC `0 12 * * *`）
- 自動真寄由香港曆日 **2026-10-13** 起每晚 20:00（函式閘；10/12 已人手寄過，當晚不再自動）
- 人手真寄：`{"force":true,"target_date":"YYYY-MM-DD"}`（可略 `target_date`＝翌日）
- 正式寄出：各老師 `teachers_private.notification_email`（無則跳過）；每封 BCC `cfan@mainhope.edu.hk`
- 模擬：`{"simulate_to":"someone@example.com"}`；dry_run：`{"dry_run":true}`
- Secret：`TOMORROW_LESSON_CRON_SECRET`（Supabase 與 GitHub 同值）
