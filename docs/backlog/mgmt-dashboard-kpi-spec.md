# 營運總覽 KPI 規格

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open` |
| 優先 | 中 |
| 範圍 | 寫清 `/MgmtDashboard`（營運總覽）**要顯示邊啲 KPI**；先規格、後實作。產品可繼續喺本檔補列，避免忘記 |
| 不含 | 計糧／總覽載入效能優化（見 [`page-load-perf-payroll-mgmt.md`](./page-load-perf-payroll-mgmt.md)）；會計收入認列 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 頁面 | `/MgmtDashboard`（`MgmtDashboardView`）；角色 `manager`／`alien` |
| 立案 | 2026-08-11 |
| 來源 | 試堂／優惠產品回覆（[`trial-promo-receipt-frontline-wip.md`](./trial-promo-receipt-frontline-wip.md) §3b／§3d／§4.3） |

## 結論

而家**冇**「營運總覽要顯示咩」產品規格檔；本檔補上。下列為產品已點名、須列入總覽（或總覽可下鑽報表）嘅指標。實作前可再拆「首屏 KPI」vs「明細 tab」。

## 產品已點名指標（2026-08-11）

期間預設：**本月**（可再定篩選學年／自訂區間）。

| # | KPI | 單位 | 口徑備註（暫定；實作前確認） |
| --- | --- | --- | --- |
| 1 | 本月收取學費 | HKD | 包括試堂及正常；已確認收款 |
| 2 | 本月收取學費對應之堂數 | 堂 | 包括試堂及正常；跟學費單 `lesson_count` |
| 3 | 本月收取的試堂學費 | HKD | 試堂相關明細／標籤 |
| 4 | 本月收取的試堂堂數 | 堂 | 試堂單之堂數（含 $0 但堂數＞0） |
| 5 | 本月的免費堂數 | 堂 | $0 學費單且堂數＞0（免費試堂／贈堂等） |
| 6 | 本月總消堂堂數 | 堂 | 包括試堂及正常（點名計費消耗） |
| 7 | 本月總消堂（試堂）堂數 | 堂 | 僅試堂消耗 |

另由試堂 WIP 同意、宜一併列入規格（分析／報表，唔一定係首屏大數字）：

- **優惠成本**：正價 − 實收（試堂／學費單可計）
- **月消課 ≈ 收學費堂數**對帳視圖（收堂 vs 消堂）

## 現況（工程備註）

- 總覽已有招生漏斗（試堂→報讀→在讀）、堂數異常告警等；**未**以上表 1–7 為產品規格。
- 效能另題；本檔唔規定查詢實作，只鎖「要有邊啲數」。

## 待產品可繼續寫入（防忘記）

> 之後有新 KPI，直接加行到上表或本節，唔使另開 chat。

- （空位）

## 待做（摘要）

1. 產品確認口徑（已收／待收、$0 算唔算「收取」、贈堂歸 5 定另列）  
2. 標首屏 vs 下鑽  
3. 實作查詢＋UI（可另開 plan）  
4. 與 [`frontline-ops-update.md`](./frontline-ops-update.md) 試堂出單原則對齊（無單唔入紙 → 影響試堂人數／消堂統計）

## 相關

- 前台流程更新：[`frontline-ops-update.md`](./frontline-ops-update.md)
- 試堂 WIP：[`trial-promo-receipt-frontline-wip.md`](./trial-promo-receipt-frontline-wip.md)
- 總覽效能：[`page-load-perf-payroll-mgmt.md`](./page-load-perf-payroll-mgmt.md)
- 角色：[`mgmt-manager-role.md`](./mgmt-manager-role.md)
