# 操作說明（Playbooks）

給**營運／接待／管理員**：現行功能點用、從邊入、注意事項。
規則真相 → [`../policies/_INDEX.md`](../policies/_INDEX.md)。勿把未做功能寫成已上線。

## 怎麼維護

1. **一篇功能一篇檔**，放對應子櫃（`frontdesk/`／`finance/`／`ops/`）。
2. **寫現況**：使用者能做什麼；規則用連結指回 `policies/`，唔另立法。
3. **改功能時同步改說明**：UI 文案、入口路徑有變，更新篇章與本目錄。

## 篇章目錄

### 前台／接待（`frontdesk/`）

| 篇章 | 簡介 |
| --- | --- |
| [繳費收據](frontdesk/PAYMENT_RECEIPTS.md) | 列印／PDF／WhatsApp；開錯按類型走已繳堂數調動或作廢 |
| [收件匣](frontdesk/INBOX.md) | 營運／系統通知、已讀 |
| [請假與補堂（連堂）](frontdesk/LEAVE_MAKEUP_CONSECUTIVE.md) | 連堂只欠／只補；取消請假 |
| [逾期學費罰款（前線）](frontdesk/TUITION_LATE_FEE_FRONTLINE.md) | 家長解說與執行 |
| [代堂與更換任教老師（前線）](frontdesk/SUBSTITUTE_AND_CLASS_TEACHER_FRONTLINE.md) | 何時代堂／何時更換任教老師 |

### 財務（`finance/`）

| 篇章 | 簡介 |
| --- | --- |
| [Cody 每月薪酬複核](finance/cody-payroll-review-guide.html) | 複核工作指引（另有 PDF） |
| [Cody 用戶感受回報](finance/cody-ux-feedback-guide.html) | 回報指引（另有 PDF） |

### 營運清理（`ops/`）

| 篇章 | 簡介 |
| --- | --- |
| [生命週期孤兒清理](ops/LIFECYCLE_ORPHAN_CLEANUP_RUNBOOK.md) |  orphan 清理 runbook |

## 與其他文件

| 文件 | 用途 |
| --- | --- |
| [`policies/_INDEX.md`](../policies/_INDEX.md) | 營運規則 |
| [`year/2627/ops-guide.md`](../year/2627/ops-guide.md) | 本學年員工讀本 |
| [`meta/TERMINOLOGY.md`](../meta/TERMINOLOGY.md) | 公司術語與定義 |
| `AGENTS.md`／[`meta/AGENT_HANDOFF.md`](../meta/AGENT_HANDOFF.md) | 開發約定 |
