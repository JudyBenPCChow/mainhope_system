# 原班連堂分節點名

| 欄位 | 值 |
| --- | --- |
| 狀態 | `cancelled` |
| 優先 | 中 |
| 範圍 | 原班生連堂兩節可設不同出席／請假狀態；不含單項補堂生（已支援只綁一節） |
| 不含 | 連堂單項補堂計費（已上線）；生命週期孤兒攔截 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 政策／說明 | [`LEAVE_MAKEUP_CONSECUTIVE.md`](../playbooks/frontdesk/LEAVE_MAKEUP_CONSECUTIVE.md) §2.3 |
| 盤點日期 | 2026-07-31 |
| 取消日期 | 2026-08-06 |

## 取消原因

產品確認：實務上原班連堂幾乎唔會「只請／只到其中一節」。維持整組同一狀態即可；唔開分節點名。說明書繼續標「未支援」。

補堂生「只綁連堂其中一節」已支援，**不要**與本取消項混做。請假「只請本節」UX 另題（已做），唔等於要做原班分節點名。

## 歷史結論（取消前）

原班連堂點名為**整組同一狀態**。若「第 1 節請假、第 2 節照常到」——UI 無法正確記，只能備註或整組處理。行政模擬 S06 判定產品缺口；因實務頻率不足，決定不做。

## 相關程式（備查）

- [`RollCallClassPanel.tsx`](../../src/components/attendance/RollCallClassPanel.tsx)
- [`attendanceQueries.ts`](../../src/services/attendanceQueries.ts)
- [`ATTENDANCE_BILLING.md`](../policies/attendance/ATTENDANCE_BILLING.md)
