---
name: 2627-timetable-patch
description: >-
  2627 班別／時間表。4.0 方案工程已完：新增或改班預設只入系統（班別＋排程），
  唔 regenerate、唔 bump 4.x。僅當用戶明講 patch only／改方案 md 時先改方案檔。
  真源見 .cursor/rules/2627-timetable-doc.mdc。
---

# 2627 時間表（4.0 後）

**唔重複寫流程。** 開工前讀 `.cursor/rules/2627-timetable-doc.mdc`。

- **預設：** 用戶要加班／改班／排程 → 只寫 production，**唔**當繼續做 4.0 方案、**唔**出 md／docx／pdf。
- 專科堂次跟附件甲：每個星期幾 40 堂；**唔好**排 2027-06-28 之後（6/29、6/30 專科無堂）。
- 用戶明講 patch only、只改方案段落、唔 regenerate → **PATCH**（或用户 confirm 的 **SYNC**）。
- 用戶明確要求重開方案工程／bump 版／generate → **FULL**（極少）。

用戶開局模板（只適用 PATCH）：`.cursor/rules/2627-timetable-patch-prompt.md`
