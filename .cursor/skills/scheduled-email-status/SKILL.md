---
name: scheduled-email-status
description: >-
  查 production 自動電郵當日是否已寄出，以及明日課堂跳過了誰。
  每月 1 日另查新報讀整體報告。
  Use when the user says 今日自動信寄了沒有、自動信有沒有寄出、明日課堂提醒寄出沒有、
  未點名提醒何時發出、試堂報告發出了沒有、追收學費信寄了沒有、新報讀整體報告寄了沒有、寄出紀錄。
  只查不寄。要重寄或改文案時改走對應寄信 skill。
---

# 自動信是否已寄出

從 **MainHope_production**（`gudmbilboyhouotilrvt`）讀 `scheduled_email_sends`。只讀。未說「寄出」不要補寄、不要觸發 workflow。

無 MCP `execute_sql`、又無 `supabase db query --linked`：**停、通知使用者**。見 `.cursor/rules/no-forced-output-without-access.mdc`。

回覆用繁體中文書面語。回覆寫老師姓名，不要貼電郵地址。

## 四封（固定四行）

香港時間。`target_date` 見 [queries.md](queries.md)。

| 行 | job_key | 應寄時段 | 非該日時段 |
| --- | --- | --- | --- |
| 明日課堂 | `tomorrow-lesson` | 每日 17:30–19:30，寄翌日課堂 | 17:30 前寫「未到寄出時段」 |
| 未點名 | `missing-roll-call` | 每日 07:50–09:30，一封行政總結 | 08:00 前寫「未到寄出時段」 |
| 試堂名單 | `trial-followup-pdf` | 星期二、五 10:00–11:30 | 其他星期寫「今日不寄」 |
| 追收學費 | `tuition-chase-pdf` | 同上 | 其他星期寫「今日不寄」 |

未點名的收件是行政總結，不要把老師逐人當成收件人。試堂與追收的寄出紀錄收件人是 Sophie；副本不另計一列。

## 每月 1 日加一行

發送日是每月 1 日時，四行之後加「新報讀整體報告」：`job_key = monthly-new-enrollment-report`，`target_date`＝該日。Mark 與 Sophie 兩列都是 `sent` 才寫已寄；任一 `failed` 寫未寄。其他日子不要加這行。這封與星期二、五的試堂、追收無關。

## 狀態用字

| 紀錄 | 該行 |
| --- | --- |
| 應寄時段內尚無列 | 未到寄出時段 |
| 時段已過、無列 | 未寄 |
| `status = sent` | 已寄 |
| `status = failed` | 未寄（附 `error` 摘要） |
| `status = sending` 超過數分鐘 | 寄出中（未完成） |
| 非星期二、五的試堂／追收 | 今日不寄 |

## 明日課堂：跳過了誰

用 `teacher_tomorrow_lesson_email_payload(上課日)` 的老師，對照同日 `tomorrow-lesson` 且 `status = sent` 的收件人。

沒有 sent 列的老師寫入「跳過」：`notification_email` 空白、或該列為 failed／sending。有 sent 列不要再寫跳過。

未點名、試堂、追收沒有「跳過老師」這欄；未寄就寫未寄。

## 步驟

1. 發送日＝用戶指定日；無則香港今日。明日課堂的 `target_date`＝發送日的下一日。
2. 跑 [queries.md](queries.md)。
3. 只輸出四行，每行：名稱、狀態、跳過了誰（沒有就寫「無」）。

用戶追問未點名信裡有哪些老師：改讀 `missing-roll-call-reminder`，本表仍只報寄出狀態。

## 勿做

- 不要補寄、不要 `workflow_dispatch`、不要改 cron。
- 不要用 GitHub Actions 畫面代替 `scheduled_email_sends`。無列且時段已過，就是未寄。
