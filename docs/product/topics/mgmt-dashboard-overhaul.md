# 營運總覽重整

| 欄位 | 值 |
| --- | --- |
| 狀態 | `in_progress`（2026-08-23 **波次 1–3 已落地**；計劃 [`2026-08-23-mgmt-dashboard-profit-kpis.md`](../plans/2026-08-23-mgmt-dashboard-profit-kpis.md)；**只餘波次 4** 計糧快取） |
| 優先 | 中 |
| 範圍 | `/MgmtDashboard`：產品 KPI、查詢去重／按需載、手機簡化版；其後刀：計糧未結算 live 重算快取 |
| 不含 | 軟封存／查詢收窄本體（互補另題）；會計收入認列；流動殼層其餘頁（外星人表、FilterSheet、老師 P3） |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 指標表 | [`mgmt-dashboard-kpi-spec.md`](./mgmt-dashboard-kpi-spec.md)（口徑仍喺該檔補列） |
| 診斷 | [`page-load-perf-payroll-mgmt.md`](./page-load-perf-payroll-mgmt.md)（2026-08-06 路徑備查） |
| 手機缺口 | [`mobile-ui.md`](./mobile-ui.md) 08-05 M-1 |
| 技術債 | 2026-08-14 P2-2 併入本題 |

## 開工閘（agent 必讀）

開工前 check 對上一個工程是否完成。**未完成：停；提醒用戶必須完成後先可以開工。唔好當可續做。**

| 本波 | 對上一個工程 | 完成條件 | 未完成就 |
| --- | --- | --- | --- |
| 波次 1–3（總覽規格／fetch／手機） | 無 | 可開工（**唔好等** [`soft-archive-query-scope.md`](./soft-archive-query-scope.md)） | — |
| 波次 4（計糧未結算快取） | [`payroll-finance-review-ux.md`](./payroll-finance-review-ux.md) | 財務核對 UX 關帳（合計拆欄＋未點名＋真跳轉／提醒；出席紀錄老師篩選已跟當日授課） | 提醒用戶：核對流程未定，快取會令緊數數字再變 |

軟封存可略減總覽全表掃體積，**解決唔到** summary／full 重複、堂數不符熱路徑、計糧當月 live 重算。兩邊都唔改共用 `fetchAllStudents()` 默認。

## 目標（一句）

鎖清營運總覽要顯示邊啲數，用一次查詢落地，並有可用嘅手機簡化版；計糧未結算唔好每次進頁都 live 重算。

## 點解合併

分開做會互相踩：先加 14 個 KPI 唔改 fetch 會更慢；先優化舊查詢再換指標，優化會作廢。手機總覽應對住新首屏，唔好另開一版舊表。

## 波次

| 波 | 內容 | 來源 |
| --- | --- | --- |
| 1 | 產品確認口徑（1–7、8–14、15–20）；標首屏 vs 下鑽 | KPI 規格 |
| 2 | 單次 fetch（KPI 先 paint 可留，唔好重打同一輪）；堂數不符／大表按需；實作已確認 KPI | 載入偏慢＋規格 |
| 3 | `/MgmtDashboard` 手機簡化版（唔再用多表橫滑＋圖表擠壓當主畫面） | 流動介面 M-1 |
| 4 | 計糧未結算：上次計算＋「重新計算」；短 TTL；避免每次無謂 `UPDATE calc_at` | 載入偏慢／Payroll |
| 可選 | payments／attendance／students 改 DB 聚合 RPC；主 bundle 再切 recharts／mgmt | 載入偏慢 |

開工前寫實作 plan（`docs/product/plans/`）後改狀態 `in_progress`。波次 4 另確認產品：計糧可接受「快取＋手動刷新」定必須每次最新。

## 現況摘要

- **波次 1–3（2026-08-23）**：首屏 8 卡（消堂價值、毛利／毛利率、純利／純利率、已收款、在讀、上堂人次）；分析區毛／純利率走勢（**窗 2026-07 起**）；summary fetch 一次利潤塊、詳情 fetch 唔重打收入／開支；手機其餘 KPI 預設摺埋。指標 8–14 出席率等本波仍無。
- 導師人工未過帳 → 毛利卡「—」；純利＝消堂價值 − 已確認未作廢開支。7 月綠悠軒按金仍要成本頁人手作廢。
- 未結算計糧：每次 `loadPayrollWorkbench` live 重算並 `UPDATE calc_at`（**波次 4**）。

## 待做（摘要）

1. ~~波次 1–3 口徑／fetch／手機~~ **已落**  
2. 波次 4 計糧快取（過閘後：[`payroll-finance-review-ux.md`](./payroll-finance-review-ux.md) 關帳）  
3. 與 [`frontline-ops-update.md`](./frontline-ops-update.md) 試堂出單原則對齊（無單唔入紙 → 影響試堂人數／消堂統計）

## 相關

- 指標／產品可繼續補列：[`mgmt-dashboard-kpi-spec.md`](./mgmt-dashboard-kpi-spec.md)
- 軟封存（互補；開工見該檔閘）：[`soft-archive-query-scope.md`](./soft-archive-query-scope.md)
- 流動其餘頁：[`mobile-ui.md`](./mobile-ui.md)
- 角色：[`mgmt-manager-role.md`](./mgmt-manager-role.md)
- 試堂 WIP：[`trial-promo-receipt-frontline-wip.md`](./trial-promo-receipt-frontline-wip.md)
