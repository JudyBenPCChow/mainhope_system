---
name: ops-exception-scan
description: >-
  查 production 一段日期內的點名、未完成補堂、已出席仍待跟進的試堂，以及校舍假期被標成取消的排程。只輸出異常與應跟進。
  Use when the user says 檢查點名有沒有問題、排程點名請假補堂異常、學費試堂有沒有不正常、
  營運異常、找出應該注意的紀錄、某日起至今有沒有問題。
  未點名提醒文案改走 missing-roll-call-reminder。追收名單 PDF 改走 tuition-chase-pdf-mail。
  畫面巡檢改走 mainhope-operational-audit。權限稽核改走 mainhope-adversarial-audit。
  方案模擬改走 product-change-simulate。
---

# 營運異常檢查

從 **MainHope_production**（`gudmbilboyhouotilrvt`）即時查。只讀。不要改程式、不要出 PDF、不要寄信、不要派子代理。

無 MCP `execute_sql`、又無 `supabase db query --linked`：**停、通知使用者**。見 `.cursor/rules/no-forced-output-without-access.mdc`。不要用舊名單充當今次結果。

回覆用繁體中文書面語。判斷先對齊 `.cursor/rules/ops-data-check.mdc`。

## 範圍

用戶指定起迄就用該段（含首尾，香港日期）。無指定則由香港本月 1 日至今日。回覆第一句寫明範圍。

今日尚未下課的堂不計入未點名。

## 步驟

1. 跑 [queries.md](queries.md) 的校舍假期查詢，以及試堂待跟進查詢。
2. 讀 `specialist-rollcall-followup` 的 [queries.md](../specialist-rollcall-followup/queries.md)，只跑「欠點名／部分點名」與「出席無有效宣告」。不要出 WhatsApp，不要把空班算未點名。
3. 讀 `leave-makeup-followup` 的 [queries.md](../leave-makeup-followup/queries.md)，只跑學生請假與老師請假。留下請假日或原堂日落在範圍內、且屬於未安排或已排未上的列。不要跑「已繳未完成」，不要出 PDF。
4. 不要執行追收 PDF 腳本，不要把未繳學生寫進表。用戶要名單時另走 `tuition-chase-pdf-mail`。

## 怎樣歸類

| 放入 | 條件 |
| --- | --- |
| 異常 | 排程 `status` 含「取消」且 `cancel_reason` 以「校舍假期」開頭（應刪列，不當取消堂） |
| 異常 | 出席無有效宣告；出席狀態不在白名單（口徑跟專科點名跟進） |
| 應跟進 | 已下課、有人可點、整堂沒有點名列；部分點名 |
| 應跟進 | 學生或老師請假尚未安排補堂，或已排但範圍內尚未上 |
| 應跟進 | 試堂結果仍是 `open`、未取消、未待改期，而且該堂出席是實際出席 |

## 不要列入

- 空班、就讀中為 0
- 暑期有報讀、常規未報
- 學年或暑期結束後報讀仍是就讀中
- 已報讀但權益池餘額為 0，點名紙仍有名字
- 校舍假期當日沒有排程；假期當日的補堂或人手排程（不是「校舍假期」取消列）
- 功輔少於 7 人、第二課室沒有主責
- 未繳學費、追收名單上的人
- 專科點名跟進裡標成不當異常的項目

## 回覆

先寫範圍與兩句結論：異常幾項、應跟進幾項。沒有就寫 0。然後只出有列的表。

```
| 類別 | 日期 | 對象 | 說明 |
| --- | --- | --- | --- |
| 異常或應跟進 | YYYY-MM-DD | 學生或班別 | 一句 |
```

末行固定：未繳名單、空班、學期結束仍就讀中，本次不列。不要附上這些人的名單。
