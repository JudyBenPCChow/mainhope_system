---
name: class-roster-pdf
description: >-
  從 production 產出目前班別、時間、任教老師及就讀學生 PDF（2627 進行中專科班、
  功課輔導班，以及進行中私人課程）。使用者只要人數時改出純文字，不出 PDF。
  Use when the user says 生成班別 PDF、所有班別、班別時間老師學生、班別名單、
  重出班別名單、列出目前各班人數、各班人數、只出人數表，或要重出
  docs/generated/2627/2627_班別及就讀學生_YYYY-MM-DD.pdf。
  交給官網、整份取代公開班表：不要用本 skill。
---

# 班別、時間、任教老師及就讀學生 PDF

從 **MainHope_production**（`gudmbilboyhouotilrvt`）即時查庫，再跑 `scripts/generate_current_class_roster_pdf.py`。不要用舊 JSON 充當今日名單。

無 MCP `execute_sql`、又無 `supabase db query --linked`：**停、通知使用者**。見 `.cursor/rules/no-forced-output-without-access.mdc`。

回覆用繁體中文書面語。術語見 `.cursor/rules/terminology.mdc`。

## 只出人數表

用戶說各班人數、只出人數表、列出目前各班人數，或明講不要 PDF：跑 [queries.md](queries.md)「各班人數」，然後停止。不要寫 JSON、不要出 PDF。

每一班一行：`課程碼　逢星期　時段　老師　N人`。功輔老師寫「按當值編更」。就讀中為 0 仍列出。排序與全名單查詢相同：班型、年級、科目、班號。

指定了年級加科目（例如中四中文）改走 `class-by-grade-subject`，不要用本段。

交給官網或要整份取代公開班表：不要出本 PDF。目前沒有對應 skill，說明後停止。

## 範圍

| 列入 | 不列入 |
| --- | --- |
| `2627`、`class_kind = group`、`status = 進行中` | 已結束、暑期 `26SM`、上一學年 |
| `2627` 功課輔導班（小學部 `HWKP`、中學部 `HWKS`） | 測試班以外的空班仍要列 |
| `class_kind = private` 且進行中 | |

學生只計 `student_class_enrollments.status = 就讀中`。暫無就讀中學生的班別仍列出。專科任教老師用班別主責。功課輔導班沒有固定任教老師，腳本印「按當值編更」。私人課程時間取常規學年 9 月 1 日起未取消排程。

未說「寄出」就不要寄。

## 步驟

1. 資料日期＝香港今日 `YYYY-MM-DD`。2627 的排程起算日＝`2026-09-01`。
2. 用 [queries.md](queries.md) 查三份結果，寫入 `docs/generated/2627/`：
   - `2627_CLASS_ROSTER_<日期>.json`（`{"rows":[...]}`）
   - `2627_CLASS_ROSTER_<日期>_private_slots.json`
   - `2627_CLASS_ROSTER_<日期>_private_bounds.json`
3. 出 PDF：

```bash
python3 scripts/generate_current_class_roster_pdf.py \
  --classes docs/generated/2627/2627_CLASS_ROSTER_<日期>.json \
  --private-slots docs/generated/2627/2627_CLASS_ROSTER_<日期>_private_slots.json \
  --private-bounds docs/generated/2627/2627_CLASS_ROSTER_<日期>_private_bounds.json \
  --output docs/generated/2627/2627_班別及就讀學生_<日期>.pdf \
  --as-of <日期> \
  --term-start 2026-09-01
```

4. 核對腳本印出的專科／功輔／私人班數，以及就讀中報讀筆數，與查庫一致。PDF 首頁資料日期須為該日。

## 勿做

- 不要把班數寫死；進行中班數會變。
- 不要 commit `docs/generated/**`，除非使用者明講要發佈。
- 不要改班別、排程或報讀。本工序只讀。
