# 連堂請假預設 UX

| 欄位 | 值 |
| --- | --- |
| 狀態 | `done` |
| 優先 | 中 |
| 範圍 | 新建請假／前台勾選連堂時的預設與 Confirm 文案 |
| 不含 | 連堂單項補堂綁節（已有標籤）；原班分節點名（見 [consecutive-half-session-attendance.md](./consecutive-half-session-attendance.md)）；列表「欠補堂數」一眼可見（未做，可另開） |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 說明書 | [`LEAVE_MAKEUP_CONSECUTIVE.md`](../manual/LEAVE_MAKEUP_CONSECUTIVE.md) §2.1／§2.2／§5 |
| 盤點日期 | 2026-07-31 |
| 完成日期 | 2026-08-06 |

## 結論

能力上可選「只請本節」或「兩節一併」。**已改**：預設＝「只請本節」；選／勾兩節一併時二次 Confirm「將欠補 2 堂」。屬 UX／防呆，非資料模型洞。

## 行政邊緣模擬（2026-07-31）

| 模擬 ID | 個案 | 判定 | 發現的問題 |
| --- | --- | --- | --- |
| S04 | 連堂只欠 1 堂：錯選兩節一併請假 | 可完成但易錯 | 已改預設＋Confirm 降低誤選 |

## 已做

1. 請假管理／學生詳情：預設 `this_slot`；選「兩節一併」有警告文案；提交時 Confirm。
2. `insertLeaveMakeupForSchedule` 未傳 scope 時預設 `this_slot`。
3. 前台精靈：只勾一節提示欠 1；兩節都勾警告＋提交 Confirm。
4. 更新說明書 §2.1／§2.2／§5。

## 相關程式

- 請假管理／前台請假步驟（`LeaveManagementView`、`LeaveStep`、`StudentDetailView`）
- [`leaveQueries.ts`](../../src/services/leaveQueries.ts)
