# 明學管理系統 — 系統說明書

本目錄是**營運／接待／管理員**日常操作與功能現況的參考說明（繁體中文）。  
技術實作細節（目錄分層、RLS、Agent 接手）仍以 [`AGENTS.md`](../AGENTS.md)、[`AGENT_HANDOFF.md`](AGENT_HANDOFF.md) 為準。

## 怎麼維護

1. **一篇功能一篇檔**：放在 [`docs/manual/`](manual/)，檔名用大寫蛇形或清楚英文主題（例：`PAYMENT_RECEIPTS.md`）。
2. **寫「現況已完成」**：說明使用者能做什麼、從哪裡進、注意事項；勿把未做功能寫成已上線。
3. **改功能時同步改說明**：UI 文案、入口路徑、收據欄位有變，請更新對應篇章與下方目錄。
4. **本檔只做目錄**：新增篇章後，在「篇章目錄」加一列連結與一句簡介。

## 篇章目錄

| 篇章 | 簡介 |
| --- | --- |
| [繳費收據：列印／下載／傳送／作廢](manual/PAYMENT_RECEIPTS.md) | 收款登記與繳費紀錄的收據預覽、列印、PDF、WhatsApp；作廢流程（禁刪、密碼確認、管理層電郵、收件匣通知） |
| [收件匣](manual/INBOX.md) | 營運／系統兩分頁、詳情自動已讀、外星人發佈系統通知、側欄未讀火圖示 |
| [請假與補堂：連堂單項處理](manual/LEAVE_MAKEUP_CONSECUTIVE.md) | 連堂只欠／只補一堂；**§6 取消請假／清調堂與出席** |

## 與其他文件的關係

| 文件 | 讀者／用途 |
| --- | --- |
| 本說明書（`SYSTEM_MANUAL` + `manual/*`） | 人讀：功能怎麼用、已上線行為 |
| [`OPS_POLICIES.md`](OPS_POLICIES.md) | 營運政策索引（院方規條／正確做法；可含尚未系統強制條款） |
| [`ACADEMIC_YEARS.md`](ACADEMIC_YEARS.md) | 正規／暑期學年與報讀形式 |
| [`TUITION_TERM_AND_LATE_FEE_POLICY.md`](TUITION_TERM_AND_LATE_FEE_POLICY.md) | 學費學期節奏與逾期罰款政策 |
| `AGENTS.md` / `AGENT_HANDOFF.md` | 開發／AI：架構與改碼約定 |
| `apoHowtoGuides.ts` 等 | 阿Po 口語回覆；應與說明書現況一致 |
| `UI_DESIGN_INSTRUCTIONS.md` 等 | 設計／實作規範，非操作手冊 |
