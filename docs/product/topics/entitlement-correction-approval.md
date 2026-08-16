# 堂數池更正申請制

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open`（等 P0-1 收緊直接改之後；UI 未開工） |
| 優先 | 中 |
| 來源 | 2026-08-15 P0-1 決策 M19 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 相關 | [`p0-1-authorization-decisions.md`](./p0-1-authorization-decisions.md)、[`payment-entitlement-correction-ui.md`](./payment-entitlement-correction-ui.md)（現有直接改頁） |

## 已定產品

- `/PaymentCorrection` **只有外星人**可入、可即刻改堂數池。
- 行政：學生詳細頁「修正」→ 交申請，唔即刻入數。
- 管理層：繳費紀錄「修正」→ 交申請，唔即刻入數。
- 外星人批准之後先改池。
- P0-1 收緊 RLS 時，行政／管理層會暫時改唔到堂數（**接受空窗**），直到本主題做好。

## 明確唔做（今題開工前）

- 唔改 P0-1 RLS 範圍（直接改只限外星人已屬 P0-1）。
- 唔喺本檔未開工時改現有更正頁當申請制。
- UI／UX（掣位、申請表、批准隊列、通知）**之後先設計**，未定稿。

## 待做（開工時）

1. 申請／批准資料模型與 audit
2. 行政學生詳細、管理層繳費紀錄的「修正」入口
3. 外星人批准／拒絕
4. 空窗結束後，確認 admin／manager 不能再 direct write 池
