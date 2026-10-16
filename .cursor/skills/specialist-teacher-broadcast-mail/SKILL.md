---
name: specialist-teacher-broadcast-mail
description: >-
  向 2627 專科班導師群發電郵：先查 production 名單與用戶確認，正式發出前不寄；
  一封信 To 行政、BCC 全體導師。Use when the user says 群發專科老師、通知所有專科班導師、
  專科假期通知、廣播電郵給專科老師、寄給全部專科班導師, or asks to email all specialist teachers.
---

# 專科班導師群發電郵

用戶提供主旨與正文，向 **2627 專科班**主責導師群發。文案用繁體中文書面語；術語跟 `.cursor/rules/terminology.mdc`。正文以用戶定稿為準（不要擅自改寫）。

**預設：先確認、後寄。** 用戶未明說「正式發出」／「寄出」前，**不要寄**。見 `agent-mail.mdc`。

無查庫通道／寄信金鑰未就緒：**停、通知**。見 `no-forced-output-without-access.mdc`。不要用對話舊名單充當今日收件人。

## 何時用

用戶說：群發專科老師、通知所有專科班導師、專科假期／校曆安排電郵、廣播給專科班導師。

只預覽、未說正式發出 → 列出收件方案與正文，**不要寄**。

## 收件口徑（預設）

| 欄位 | 地址 |
| --- | --- |
| **To** | `cfan@mainhope.edu.hk`、`markyu@mainhope.edu.hk`、`526956762@qq.com`（Sophie Yu） |
| **BCC** | 查庫所得全體專科班導師的 `teachers_private.notification_email` |
| **發件人** | 明學教育 `<noreply@mainhope.edu.hk>`（不可改） |

- 一封群發（不要每人一封），除非用戶另定。
- Mark／Sophie 可同時在 To；若與 BCC 重複可保留（用戶未要求去重則不去重）。
- **不要**把學生 `sophie@mainhope.edu.hk`（曾穎）當成 Sophie Yu。
- 用戶本則另指定 To／BCC／測試信箱 → 以本則為準；測試時不要寄老師本人。

## 誰算「專科班導師」

預設學年 **2627**（用戶另指 `26SM` 等才改）：

1. `classes.class_kind = 'group'` 且學年 `academic_years.label` 對應目標年（或 `course_code_full like '2627-%'`）
2. 取該班 `classes.teacher_id`（主責），去重
3. 排除 `teachers.homework_tutor_only = true`
4. 排除老師名或 course code 含 `Test`／`HWKP`
5. 收件用 `teachers_private.notification_email`；缺則列入「跳過」並在確認稿註明，不要改用 `email` 硬寄

SQL 見 [queries.md](queries.md)。每次重查，不要沿用上一則名單。

## 步驟

1. **讀用戶主旨與正文**（用戶未給齊 → 問清楚，不要自撰營運內容）。
2. **查庫**（擇一）：
   - `supabase db query --linked`（linked＝MainHope_production）
   - 或 Supabase MCP `execute_sql`，project `gudmbilboyhouotilrvt`
3. **確認稿**（未寄前必回）：
   - 主旨、正文全文（或註明「照用戶原文」）
   - To／BCC 名單（姓名＋通知電郵；可遮掩中段）
   - 缺 `notification_email` 者
   - 寄法一句：一封；To＝行政三址；BCC＝導師
4. 等用戶回覆 **「正式發出」**（或同等明確指示）。
5. **寄信**（優先 CLI，不要等 MCP discovery）：

```bash
node scripts/mcp/resend-mail-server.mjs --status
node scripts/mcp/resend-mail-server.mjs --send \
  --to "cfan@mainhope.edu.hk" \
  --to "markyu@mainhope.edu.hk" \
  --to "526956762@qq.com" \
  --bcc "<notification_email_1>" \
  --bcc "<notification_email_2>" \
  --subject "<用戶主旨>" \
  --text "<用戶正文>"
```

   `--status` 未就緒：停，不要改通道硬寄。可加 `--attach`（附件須在工作區內）。

6. **回覆摘要**：已寄／Resend id、To、BCC 人數、跳過名單。不要重貼全文，除非用戶要。

## 確認稿範例（對話）

```
尚未寄出。請確認後回覆「正式發出」。

主旨：…
To：cfan@…、markyu@…、526956762@qq.com
BCC：N 位專科班導師（列姓名；電郵可遮掩）
跳過：…（無 notification_email）
```

## 勿做

- 未說正式發出就寄
- 用舊對話／snapshot 當今日 BCC 名單
- 預設改成每人一封或把導師放進 To（暴露互見）
- 讀出或提交 `.env.mail` 金鑰
- commit `docs/generated/**`
- 把純功輔導師、測試班老師混入預設 BCC
