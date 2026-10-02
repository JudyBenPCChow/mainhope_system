---
name: homework-duty-month-pdf
description: >-
  從 production 已編更產出功輔當值月曆 PDF（中學部與小學部同一頁）。
  Use when the user asks 功輔月曆、當值 roster、當值表 PDF、某月功輔當值、
  或要重出 docs/generated/2627/2627_HOMEWORK_DUTY_YYYY-MM.pdf。
---

# 功輔當值月曆 PDF

從 **MainHope_production** 當月已編更產出一頁月曆。中學部在上、小學部在下。唔好用舊 JSON 當今日編更。

無 MCP `execute_sql`、又無 `supabase db query --linked`：**停、通知使用者**。見 `.cursor/rules/no-forced-output-without-access.mdc`。

## 步驟

1. 月份：用戶指定的 `YYYY-MM`；無指定則用今日，並夾在 `2026-09`～`2027-06`。
2. 查庫用 [queries.md](queries.md)。班別：`2627-HWKS1099-A`（中學）、`2627-HWKP1099-A`（小學）。
3. 各寫一份 JSON 到 `docs/generated/2627/`：
   - `2627_HOMEWORK_DUTY_<YYYY-MM>_HWKS.json`
   - `2627_HOMEWORK_DUTY_<YYYY-MM>_HWKP.json`
4. 字型：`scripts/.fonts/NotoSansTC-Variable.ttf`。沒有就下載（見 queries.md）。
5. 出 PDF 並打開：

```bash
python3 scripts/generate_homework_duty_month_pdf.py \
  --data docs/generated/2627/2627_HOMEWORK_DUTY_<YYYY-MM>_HWKS.json \
  --with docs/generated/2627/2627_HOMEWORK_DUTY_<YYYY-MM>_HWKP.json \
  --output docs/generated/2627/2627_HOMEWORK_DUTY_<YYYY-MM>.pdf
```

6. 核對：仍是一頁；姓名明顯大於、粗過時間；課室標籤細；最後一週沒有被裁走；週末灰、假期寫名稱。

## 版面與字級（不可改）

跟老師「我的當值」月曆，經 Chrome 列印，唔好改用 reportlab 縮字。

| 元素 | 規格 |
| --- | --- |
| 格子底字 | `0.75rem` |
| 姓名 | `1.3em`、`font-weight: 700` |
| 時間 | 沿用格子字級，顏色 `hsl(240 16% 8% / 0.55)` |
| 課室標籤 | `9px`、`font-weight: 600`；17D 綠、其餘藍 |
| 日期數字 | `0.875rem` |
| 交接 | 同房第二人起，左對齊下箭 |
| 字型 | Noto Sans TC |

一格只畫**已開**的房。中學部開了但無人＝「暫時空缺」。合併頁不要再畫「不啟用此課室」。

放不下時加高 `@page`，維持一頁。唔好把姓名縮到低過 `1.3em`。

## 勿做

- 唔好代填當值、唔好改課室或重寫佔室。
- 唔好 commit `docs/generated/**` 或字型檔，除非用戶明講要發佈。
- 週末不開功輔。假期跟 `homework_tutoring_calendar_closures`，唔好當空缺。
