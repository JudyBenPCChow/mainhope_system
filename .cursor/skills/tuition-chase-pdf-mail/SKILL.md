---
name: tuition-chase-pdf-mail
description: >-
  查 production 產出 2627 未繳學費清單 PDF（專科常規第 N 期＋功輔當月月費），
  並可寄給 Sophie。Use when the user asks 追收學費、未交學費名單、十月學費追收、
  學費追收 PDF、寄 Sophie 學費清單、或重出 2627_PERIOD2_TUITION_CHASE.pdf。
---

# 追收學費清單 PDF ＋寄 Sophie

從 **MainHope_production** 即時查未繳學費，產出橫式 A4 PDF；用戶要求寄出時寄給 Sophie。

無查庫權限／無寄信金鑰：**停、通知使用者**。見 `no-forced-output-without-access.mdc`、`agent-mail.mdc`。不要用舊 JSON／示範資料充當今日名單。

## 口徑

| 部分 | 單位 | 規則 |
| --- | --- | --- |
| 專科 | 常規第 N 期（附件甲） | 與系統「學費追收」相同：`要交＝max(0, 本期還會扣 − 尚餘可扣堂數)`；含已上課未付款（尚餘為負）；不含功輔／試堂 |
| 功輔 | 曆月月費 | 就讀中；已繳＝繳費明細覆蓋該月（`coverage_start_month`＋`lesson_count` 作月數）；休學不計；價目跟日數檔（中學部小學生跟中一價） |

- 學年預設 **2627**。
- 「本期」：仍有上課日 ≥ 查庫日的最早一期。腳本現鎖定**常規第二期**日期表（約 10 月）；進入第三期後須先改 `scripts/export_2627_period2_tuition_chase.py` 的期數日期再跑。
- 功輔月份：預設＝查庫日之 `YYYY-MM`；用戶指定則用指定月。
- 專科金額＝堂數×單價；**尚未計入**逾期罰款（每科每月最高 $50）。功輔不適用該罰款。

## 步驟

1. **匯出 JSON＋PDF**（香港今日為查庫日；可加 `--as-of`／`--billing-month`）：

```bash
python3 scripts/export_2627_period2_tuition_chase.py --pdf
```

產出：

- `docs/generated/2627/2627_PERIOD2_TUITION_CHASE.json`
- `docs/generated/2627/2627_PERIOD2_TUITION_CHASE.pdf`

僅重出 PDF（已有 JSON）：

```bash
python3 scripts/generate_2627_period2_tuition_chase_pdf.py
```

2. **回覆摘要**：專科人數／組別／金額、功輔人數／金額、合計、查庫日、PDF 路徑。

3. **寄電郵**（僅當用戶本則明確要求寄出）：
   - 預設收件（Sophie／admin）：`526956762@qq.com`
   - 主旨預設：`系統報告︰十月追收學費清單`（用戶另寫則用用戶原文）
   - 發件人固定 `noreply@mainhope.edu.hk`
   - 附件：剛產出的 PDF
   - 優先 MCP `mainhope-mail` 的 `send_email`；MCP 未就緒則：

```bash
node scripts/mcp/resend-mail-server.mjs --status
node scripts/mcp/resend-mail-server.mjs --send \
  --to "526956762@qq.com" \
  --subject "系統報告︰十月追收學費清單" \
  --text "（簡短：查庫日、專科／功輔人數與金額合計）" \
  --attach "docs/generated/2627/2627_PERIOD2_TUITION_CHASE.pdf"
```

   - `mail_status` 未就緒：停下說明，不要改用其他方式硬寄。
   - 用戶指定其他收件地址：以本則訊息為準。

## 查庫通道

- 腳本用 `supabase db query --linked`（須 login／token，linked＝production）。
- 亦可 Supabase MCP `execute_sql`，project `gudmbilboyhouotilrvt`。
- 失敗即停，不要編造名單。

## 勿做

- 不要 commit `docs/generated/**`，除非用戶明講要發佈
- 不要把空班、暑期未續常規、學期結束仍「就讀中」當缺陷（見 `ops-data-check.mdc`）
- 不要在用戶未要求寄信時自動寄出
- 不要把學生 `sophie@mainhope.edu.hk`（曾穎）當成 Sophie Yu
