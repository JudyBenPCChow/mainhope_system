---
name: monthly-new-enrollment-report
description: >-
  查 production 產出一整個曆月的新報讀整體報告 PDF（新增對比已有就讀中、各科圖、逐筆清單），
  並可寄給 Mark Yu、Sophie Yu，副本 Christine Fan。
  Use when the user asks 新報讀整體報告、整月新報讀、十一月新報讀、每月1日新報讀報告、
  重出新報讀整體報告。
  逢星期二、五的試堂及轉正、追收學費不要用這份。問寄出了沒有改走 scheduled-email-status。
---

# 新報讀整體報告（一整個月）

從 **MainHope_production** 即時查一個曆月，產出直式 A4 PDF。這是整月報告，不要併入逢星期二、五的試堂及轉正、追收學費（`.github/workflows/admin-pdf-reports.yml`）。

無查庫權限／無寄信金鑰：**停、通知使用者**。見 `no-forced-output-without-access.mdc`、`agent-mail.mdc`。不要用舊 JSON 充當該月名單。

問這封信寄出了沒有：改走 `scheduled-email-status`（每月 1 日才有這一行）。不要重出 PDF、不要寄。

## 口徑

- 月份：用戶指定 `YYYY-MM`；排程無指定則為香港發送日的**上一個曆月**（12 月 1 日寄 11 月 1 日至 11 月 30 日）。
- 範圍：2627 專科班、功課輔導班，以及進行中私人課程。姓名或任教老師含 test／測試的不計。
- 新增：報讀建立日（香港）落在該月內，含舊生加科、含其後已退讀。一筆報讀一列。
- 已有就讀中：報讀建立於該月 1 日之前，且目前狀態為就讀中。同一範圍。
- 圖表的新增只計仍就讀中，與已有同一狀態。已退讀照列在清單，並在各科表的「期間已退讀」出現。
- 試堂：該筆報讀有對應試堂 `outcome = converted`（`converted_enrollment_id` 或同一 `class_id`）。否則直接報讀。
- 註冊日期＝學生檔建立日。私人課程在清單寫「英國語文（私人課程）」；各科對比併成「私人課程」。

## 步驟

1. 匯出（可加 `--month 2026-11`）：

```bash
python3 scripts/export_monthly_new_enrollment_report.py --month YYYY-MM --pdf
```

產出 `docs/generated/2627/新報讀整體報告_<起日>_<迄日>.json` 與同名 PDF。

2. 回覆先寫月份、新增筆數與人數、仍就讀中、已退讀、已有就讀中、新增佔目前就讀中，再寫 PDF 路徑。

3. **寄電郵**（僅當用戶本則明確要求寄出，或本報告的每月 1 日排程）：
   - To：`markyu@mainhope.edu.hk`（Mark Yu）、`526956762@qq.com`（Sophie Yu）
   - CC：`cfan@mainhope.edu.hk`（Christine Fan）
   - 不要把學生 `sophie@mainhope.edu.hk`（曾穎）當成 Sophie Yu
   - 主旨：`【系統報告】新報讀整體報告（2026年11月）`
   - 發件人固定 `noreply@mainhope.edu.hk`
   - 正文末：

```
下次發送日期：2027年1月1日（星期五）上午10:00
本電郵自動於每月1日產生，涵蓋上一個曆月。

(以上乃系統發出之提醒，切勿回覆本電郵）
```

   下次發送日＝下一個月的 1 日。人手代寄可用：

```bash
node scripts/mcp/resend-mail-server.mjs --status
node scripts/mcp/resend-mail-server.mjs --send \
  --to "markyu@mainhope.edu.hk" \
  --to "526956762@qq.com" \
  --cc "cfan@mainhope.edu.hk" \
  --subject "【系統報告】新報讀整體報告（2026年11月）" \
  --text "（月份、筆數、佔比；末段用上面兩句）" \
  --attach "docs/generated/2627/新報讀整體報告_2026-11-01_2026-11-30.pdf"
```

## 定期

- 每月 1 日香港 10:00（另有 10:10、10:30、11:00 補叫）。已寄出則跳過。
- pg_cron → Edge `monthly-new-enrollment-report` → GitHub Actions `.github/workflows/monthly-new-enrollment-report.yml`。
- 腳本：`python3 scripts/send_monthly_new_enrollment_report.py`（`--dry-run` 不寄；`--month YYYY-MM` 指定月份）。
- 寄出紀錄 `job_key = monthly-new-enrollment-report`，收件人各一列（Mark、Sophie）。副本不另計。
- 排程只在 workflow 與 Edge Function 已在 `main` 並完成部署時才會跑。

## 勿做

- 不要改星期二、五的 `admin-pdf-reports`
- 不要用 `scripts/generate_new_enrollment_report_pdf.py`（那是另一種按日速度的新報讀報告）
- 不要 commit `docs/generated/**`，除非用戶明講要發佈
- 未要求寄出就不要寄
