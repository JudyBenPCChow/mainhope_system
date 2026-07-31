# 連堂請假預設 UX

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open` |
| 優先 | 中 |
| 範圍 | 新建請假／前台勾選連堂時的預設與 Confirm 文案 |
| 不含 | 連堂單項補堂綁節（已有標籤）；原班分節點名（見 [consecutive-half-session-attendance.md](./consecutive-half-session-attendance.md)） |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 說明書 | [`LEAVE_MAKEUP_CONSECUTIVE.md`](../manual/LEAVE_MAKEUP_CONSECUTIVE.md) §5 常見錯誤 |
| 盤點日期 | 2026-07-31 |

## 結論

能力上可選「只請本節」或「兩節一併」，但**預設＝兩節一併**。行政糊塗時會把只欠 1 堂記成欠 2，待補膨脹。屬 UX／防呆，非資料模型洞。

## 行政邊緣模擬（2026-07-31）

| 模擬 ID | 個案 | 判定 | 發現的問題 |
| --- | --- | --- | --- |
| S04 | 連堂只欠 1 堂：錯選兩節一併請假 | 可完成但易錯 | UI 有「連堂第 N 節」標示與前台勾選提示；預設不利於「只欠一節」；需訓練或改預設／加強 Confirm |

## 待做（建議，擇一或組合）

1. 選到連堂時：預設改「只請本節」，或強制二次 Confirm「將欠補 2 堂」。
2. 前台精靈：只勾一節時文案更醒目；兩節都勾才整組。
3. 列表／詳情顯示「欠補堂數」一眼可見，方便事後發現多欠。
4. 更新說明書 §5 與阿Po 話術（若有）。

## 相關程式

- 請假管理／前台請假步驟（`LeaveManagement`、FrontDesk 請假）
- [`leaveQueries.ts`](../../src/services/leaveQueries.ts)
