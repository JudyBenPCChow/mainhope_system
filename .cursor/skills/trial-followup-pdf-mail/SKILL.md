---
name: trial-followup-pdf-mail
description: >-
  查 production 試堂，按人手定稿版式產出直式 A4 試堂名單 PDF，並可寄到指定電郵。
  Use when the user asks 試堂名單、試堂跟進、未來試堂 PDF、試堂報告寄電郵、
  或重出 docs/generated/2627/2627_TRIAL_FOLLOWUP_*.pdf。
---

# 試堂名單 PDF（跟進轉化）＋寄電郵

版式真源：用戶改過的 Word 稿（直式 A4）。日後產出 **PDF** 必須跟此欄位與標題；不要自行加長說明、不要改回橫式。

無 MCP `execute_sql`／無寄信金鑰：**停、通知使用者**。見 `no-forced-output-without-access.mdc`、`agent-mail.mdc`。

## 版式（不可改）

- 紙張：直式 A4；邊界左右約 1.91cm、上下約 2.54cm
- 標題：`明學教育 · 試堂名單（未來試堂＋跟進轉化）`（14pt 粗、置中）
- 副標：`{年月}　｜　查庫日 YYYY-MM-DD　｜`（9pt、置中；不要寫 production／筆數）
- 表頭底色 `#D9D9D9`；正文約 12pt；字型新細明體／PMingLiU
- **一、待跟進轉化**：欄 `#｜學生｜級別｜聯絡電話｜試堂班別｜試堂日｜跟進狀態`
  - 級別用 `S1`／`P2` 等代碼；班別第二行老師；試堂日第二行時段；跟進狀態＝提示字（如「跟進轉正」）
- **二、未來試堂**：欄 `#｜學生｜級別｜聯絡電話｜試堂班別｜試堂日｜時間`
  - 末欄「時間」實際放 `試堂類型 · 收款狀態`（與人手稿一致，勿擅自改欄名）
- **其他跟進**：標題 14pt；編號列（取消試堂等不入上表者）

## 資料口徑

- 月份：用戶指定；無則當月（香港日）
- 來源：`trial_sessions`；該班尚無「就讀中」報讀、且 `outcome` 非 `converted`
- 待跟進：試堂日 ＜ 查庫日、點名為現場（或等價已試）、狀態非取消
- 未來：試堂日 ≥ 查庫日、非取消
- 其他跟進：取消等需註明但不入兩表者

## 步驟

1. 查庫（Supabase MCP `execute_sql`，production `gudmbilboyhouotilrvt`）。
2. 寫 JSON：`docs/generated/2627/2627_TRIAL_FOLLOWUP_<YYYY-MM>.json`
3. 出 PDF：

```bash
python3 scripts/generate_2627_trial_followup_pdf.py \
  --data docs/generated/2627/2627_TRIAL_FOLLOWUP_<YYYY-MM>.json \
  --output docs/generated/2627/2627_TRIAL_FOLLOWUP_<YYYY-MM>.pdf
```

（若用戶要 Word 編輯稿，另跑 `scripts/generate_2627_trial_followup_docx.py`。）

4. **寄電郵**：用戶本則訊息已寫收件地址，且明確要求寄出 → MCP `mainhope-mail` 的 `send_email`。
   - 發件人固定 `noreply@mainhope.edu.hk`
   - 附件用工作區內剛產出的 PDF
   - 定期報告主旨：`【系統報告】試堂及轉正（D/M)`（香港當日，不補零；全形前括號、半形後括號。例：`【系統報告】試堂及轉正（20/10)`）
   - 定期報告收件：To `526956762@qq.com`（Sophie Yu）；CC `markyu@mainhope.edu.hk`、`cfan@mainhope.edu.hk`
   - 正文末兩句固定，日期換成**下一次**星期二或五的香港日期與星期，時間固定上午 10:00：

```
下次發送日期：2026年10月23日（星期五）上午10:00
本電郵自動逢星期二及五產生。

(以上乃系統發出之提醒，切勿回覆本電郵）
```

   - 未寫地址、或 `mail_status` 未就緒：停下說明，不要改用其他方式硬寄

## 定期

- GitHub Actions `.github/workflows/admin-pdf-reports.yml`：逢星期二、五香港時間 10:00（UTC `0 2 * * 2,5`）。
- 正文「下次發送日期」為下一個星期二或五（當日若星期二，下次為星期五；當日若星期五，下次為下星期二）。
- 腳本：`python3 scripts/send_admin_pdf_reports.py`（`--dry-run` 不寄）。收件 To Sophie Yu，CC Mark Yu、Christine Fan。
- 排程只在 workflow 已在 `main` 時才會跑。

## 勿做

- 不要 commit `docs/generated/**`，除非用戶明講要發佈
- 不要發明示範資料；查不到庫就停
- 不要在未獲明確收件地址時寄信
