# 正規逾期罰款（系統化）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `done`（2026-08-01：收款自動加罰已上線；2026-10-01 起生效） |
| 優先 | 高 |
| 範圍 | 正規小組課：已繳／已扣池判定拖欠 → 收款自動加 HK$50；同一科每曆月最多一次；豁免須原因並可統計 |
| 不含 | 禁止入室警示／門禁；暑期；試堂；一對一；家長 WhatsApp 自動通告（可後做） |
| 施行 | **2026-10-01** 起；此前拖欠不追溯 |
| 前線指引 | [`../manual/TUITION_LATE_FEE_FRONTLINE.md`](../playbooks/frontdesk/TUITION_LATE_FEE_FRONTLINE.md) |
| 政策錨點 | [`../TUITION_TERM_AND_LATE_FEE_POLICY.md`](../policies/payments/TUITION_TERM_AND_LATE_FEE_POLICY.md) |
| 實作計劃 | Cursor plan `late_fee_fifty_63951e4b` |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 盤點／定案 | 2026-07-31 立項；2026-08-01 產品定案＋前線指引＋系統實作 |

## 結論

`/Payments` **已收款**會按池模型自動加入逾期罰款（獨立表 `payment_late_fee_items`）；豁免必填原因；優惠不打罰款。前端以 `localToday()` 曆月做 Rule B；系統化開關日為 **2026-10-01**（`LATE_FEE_EFFECTIVE_DATE`）。

## 已完成

1. Migration：`payment_late_fee_items`＋RPC `student_class_late_fee_pools`（`20260801160000`）
2. 收款金額：學費 → 優惠 → 非豁免罰款＝總額；罰款不入 `payment_details`
3. `/Payments`：自動加罰、豁免對話、本月已處理／其他科拖欠提示；待收款不加罰
4. 收據／金額明細顯示罰款列
5. 系統通知（admin／alien）：`20260801170000`「收款登記：正規課逾期罰款可自動加 $50」

## 已知限制（本階段接受）

- 跨班補堂掛 host class 的扣堂，可能影響該班池（見計劃 adversarial）
- 誤豁免後同月不能再自動加罰（Rule B 設計）
- 作廢單據的罰款列不計「已處理」，可再罰；UI 未特別警示

## 相關

- 收款：`/Payments`；作廢見 `PAYMENT_RECEIPT_VOID_POLICY`
- 點名扣堂：[`ATTENDANCE_BILLING.md`](../policies/attendance/ATTENDANCE_BILLING.md)
- 收件匣：[`manual/INBOX.md`](../playbooks/frontdesk/INBOX.md)
