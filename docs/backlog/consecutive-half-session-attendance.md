# 原班連堂分節點名

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open` |
| 優先 | 中 |
| 範圍 | 原班生連堂兩節可設不同出席／請假狀態；不含單項補堂生（已支援只綁一節） |
| 不含 | 連堂單項補堂計費（已上線）；生命週期孤兒攔截 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 政策／說明 | [`LEAVE_MAKEUP_CONSECUTIVE.md`](../manual/LEAVE_MAKEUP_CONSECUTIVE.md) §2.3「尚未支援」 |
| 盤點日期 | 2026-07-31 |

## 結論

原班連堂點名仍為**整組同一狀態**。實務若「第 1 節請假、第 2 節照常到」——行政／老師在現有 UI **無法正確記**，只能備註或整組處理（多扣／少扣風險）。

補堂生「只綁連堂其中一節」已支援，**不要**與本缺口混做。

## 行政邊緣模擬（2026-07-31）

| 模擬 ID | 個案 | 判定 | 發現的問題 |
| --- | --- | --- | --- |
| S06 | 原班連堂：第 1 節請假、第 2 節照常 | **無法在 UI 收尾** | 產品缺口；非操作訓練可解；說明書已寫未支援 |

## 待做（建議）

1. 產品確認：原班分節點名是否為正式需求、頻率是否夠高。
2. 若做：點名紙／`confirmRollCall` 對原班連堂 peers 允許每節獨立 status；請假「只請本節」與原班出席狀態對齊。
3. 計費：兩節不同狀態時已上堂數按節計算（與現有連堂＝2 堂模型一致）。
4. 文件：更新 `LEAVE_MAKEUP_CONSECUTIVE` §2.3、點名說明。

## 相關程式

- [`RollCallClassPanel.tsx`](../../src/components/attendance/RollCallClassPanel.tsx)
- [`attendanceQueries.ts`](../../src/services/attendanceQueries.ts)
- [`ATTENDANCE_BILLING.md`](../ATTENDANCE_BILLING.md)
