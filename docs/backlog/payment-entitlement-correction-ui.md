# 單據／權益更正頁（G2 政策更新）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `in_progress`（核心 UI＋作廢第二人 ✅；阿Po／政策全文同步可跟） |
| 優先 | 高 |
| 範圍 | 按 G2a–G2d 產品定案，補齊前台**更正入口**（新頁／強化作廢）；同步改寫舊「禁改已確認單＝只准作廢」文件與阿Po |
| 不含 | 會計收入認列；硬刪單據；常規退費產品化 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 產品定案 | [`summer-enrollment-roster-consistency.md`](./summer-enrollment-roster-consistency.md) §4.13／G2 |
| 立案 | 2026-08-09 |
| 上次更新 | 2026-08-11 |

## 結論（給 agent／產品）

**2026-08-10 已落地：** `/PaymentCorrection`（admin／manager／alien）；池調動表 `entitlement_pool_adjustments`；作廢 ≤30 分單人／>30 分第二人（manager／alien）已上 edge `void-payment`。  
**2026-08-11：** [`PAYMENT_RECEIPT_VOID_POLICY.md`](../PAYMENT_RECEIPT_VOID_POLICY.md) 已全文改寫為按錯類型分流；2627 §11／§12 已跟。餘：阿Po／`manual/PAYMENT_RECEIPTS.md` 另包。

## 缺口 vs G2 定案

| 定案 | 要嘅前線能力 | 而家有冇 |
| --- | --- | --- |
| G2a 堂數填錯 | 對未耗堂 **clawback**＋寫入**池調動原因表** | ✅ `/PaymentCorrection` 單池調動 |
| G2b 科目／班收錯 | **唔作廢收據**；池調動表搬堂 | ✅ 搬堂（兩池） |
| G2d 金額／優惠錯、堂數啱 | **作廢＋重開**；時間窗／第二人 | ✅ 作廢 dialog＋edge；導去收款重開 |
| 時間窗 | ≤30 分准作廢；>30 分第二人 | ✅ |
| G2c 送親友（B 類） | 搬池／轉讓 | ✅ 搬堂＋原因碼 `g2c_transfer_friend`（未做雙方家長確認） |

→ **要為政策更新整新頁（或明確主入口）**，唔好假設「作廢＝全部更正」。

## 建議產物（開工時再拆 Wave）

1. **權益池調動頁／區**（G2a／G2b 核心）  
   - 選學生／池 → 增減或搬堂數 → 必填原因碼＋備註 → 稽核表可查  
2. **單據更正導引**（可同一路由分步）  
   - 先揀錯類型（G2a–f）→ 分流：池調動／作廢重開／只改支付欄  
3. **強化作廢**（G2d／時間窗）  
   - 密碼＋原因（已有）→ >30 分第二人確認 → 成功後一鍵帶學生去收款登記重開  
4. **文件／阿Po 同步**（見下「舊政策出現位置」）

## 舊政策／舊說法出現位置（開工必改；agent 勿當最終真相）

下列仍寫「禁改已確認／出錯只准作廢」或等價現況。**產品已轉向按錯類型分流**；改系統前請標「待同步」或改寫對齊 §4.13。

| 位置 | 而家寫咩（摘要） | 同步時 |
| --- | --- | --- |
| [`docs/PAYMENT_RECEIPT_VOID_POLICY.md`](../PAYMENT_RECEIPT_VOID_POLICY.md) | ✅ 2026-08-11 已全文改寫按錯類型分流 | 已同步 |
| [`docs/manual/PAYMENT_RECEIPTS.md`](../manual/PAYMENT_RECEIPTS.md) §7 | 已加「政策更新中」橫額；正文仍寫現役作廢 | 定稿後改寫為按類型分流＋更正頁入口（另包） |
| [`docs/OPS_POLICIES.md`](../OPS_POLICIES.md) 作廢列 | ✅ 已跟新摘要 | 已同步 |
| [`docs/manual/2627_REGULAR_YEAR_OPS_GUIDE.md`](../manual/2627_REGULAR_YEAR_OPS_GUIDE.md) §11／§12 | ✅ 2026-08-11 已跟試堂總則＋作廢分流 | 已同步 |
| [`docs/SYSTEM_MANUAL.md`](../SYSTEM_MANUAL.md) 收據列 | 已加更正頁 backlog 連結 | 上線後改簡介 |
| [`supabase/functions/_shared/apoHowtoGuides.ts`](../../supabase/functions/_shared/apoHowtoGuides.ts) `payment` | 「單據出錯不可刪除，須…作廢」「開錯：作廢後另開新單」 | 阿Po 改跟新分流 |
| `src/components/payments/VoidPaymentDialog.tsx` | 文案假設作廢＝唯一更正 | 配合導引／第二人 |
| `src/services/paymentQueries.ts` | 禁硬刪；`updatePaymentRecord` 無明細／堂數 UI | 池調動另 service；唔好誤解「無 UI＝政策永遠禁改」 |

**仍有效、唔因本主題推翻：** 禁**硬刪**單據（保留稽核）。唔等於禁止池調動或禁止按類型更正。

## Agent 防呆

- 讀到上表舊句 → 先開本檔＋母題 §4.13，**唔好**用舊句擋 G2a／G2b 新頁設計。  
- 實作前：payment→池 top_up／clawback 邊界見母題 §5.2（本頁依賴池事件，唔係只改 `payment_details` 畫面）。

## 待做（摘要）

1. 產品確認新頁路由名／側欄（admin／manager／alien）  
2. Schema：池調動事件表（原因碼、操作者、前後 remaining）  
3. UI：調動表＋更正導引＋作廢第二人確認  
4. 同步上表所有舊文件／阿Po  
5. 回寫母題 §5；本列改 `done`

## 相關

- 母題：[`summer-enrollment-roster-consistency.md`](./summer-enrollment-roster-consistency.md)
- 現行作廢（待改）：[`PAYMENT_RECEIPT_VOID_POLICY.md`](../PAYMENT_RECEIPT_VOID_POLICY.md)
