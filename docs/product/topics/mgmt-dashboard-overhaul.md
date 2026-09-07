# 營運總覽重整

| 欄位 | 值 |
| --- | --- |
| 狀態 | `done`（2026-08-23 波次 1–3；**2026-09-06 波次 4 計糧草稿快取已落地**） |
| 優先 | 中 |
| 範圍 | `/MgmtDashboard`：產品 KPI、查詢去重／按需載、手機簡化版；其後刀：計糧未結算 live 重算快取 |
| 不含 | 軟封存／查詢收窄本體（互補另題）；會計收入認列；流動殼層其餘頁（外星人表、FilterSheet、老師 P3） |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 指標表 | [`mgmt-dashboard-kpi-spec.md`](./mgmt-dashboard-kpi-spec.md)（口徑仍喺該檔補列） |
| 診斷 | [`page-load-perf-payroll-mgmt.md`](./page-load-perf-payroll-mgmt.md)（2026-08-06 路徑備查） |
| 手機缺口 | [`mobile-ui.md`](./mobile-ui.md) 08-05 M-1 |
| 技術債 | 2026-08-14 P2-2 併入本題 |

## 開工閘（agent 必讀）

本題已關帳。不要在本檔再開新波。指標 8–14、試堂出單對齊見相關分題。

| 本波 | 對上一個工程 | 完成條件 | 未完成就 |
| --- | --- | --- | --- |
| 波次 1–3（總覽規格／fetch／手機） | 無 | 可開工（**唔好等** [`soft-archive-query-scope.md`](./soft-archive-query-scope.md)） | — |
| 波次 4（計糧未結算快取） | [`payroll-finance-review-ux.md`](./payroll-finance-review-ux.md) | **已滿足**（2026-08-30 關帳；2026-09-06 已實作） | — |

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
| 可選 | payments／attendance／students 改 DB 聚合 RPC；主 bundle 再切 recharts／mgmt | 載入偏慢（**不做**，無體感問題前唔升題） |

## 波次 4 步驟（2026-09-06 模擬後落地）

產品取捨：**快取＋手動重算**，唔係每次進頁最新。

| 情況 | 行為 |
| --- | --- |
| 財務審閱中，`calc_at` 10 分鐘內 | 讀草稿 `snapshot`（調整 overlay 仍即時） |
| 財務審閱中，逾時／無草稿 | live 重算並寫入草稿 `snapshot` |
| 待管理層核實 | **不理 TTL**，固定用草稿，避免管理層見到同財務提交唔同嘅數 |
| 已結算 | 沿用凍結 snapshot，唔覆寫 |
| 「重算」、工時／功輔工時變更 | `force` 重算並遞增版本 |
| 已審／排除／提醒等 | `preferDraft`，唔整頁 loading |

草稿同結算共用 `payroll_runs.snapshot`；結算寫入帶 `settledAt`，persist 用 `.neq(status, 已結算)` 防蓋凍結。

## 現況摘要

- **波次 1–3（2026-08-23）**：首屏 8 卡（消堂價值、毛利／毛利率、純利／純利率、已收款、在讀、上堂人次）；分析區毛／純利率走勢（**窗 2026-07 起**）；summary fetch 一次利潤塊、詳情 fetch 唔重打收入／開支；手機其餘 KPI 預設摺埋。指標 8–14 出席率等本波仍無。
- 導師人工未過帳 → 毛利卡「—」；純利＝消堂價值 − 已確認未作廢開支。
- **波次 4（2026-09-06）**：未結算計糧草稿快取已落；`loadPayrollWorkbench` 快取命中唔再 `UPDATE calc_at`。

## 待做（摘要）

1. ~~波次 1–3 口徑／fetch／手機~~ **已落**  
2. ~~波次 4 計糧快取~~ **已落**  
3. 與 [`frontline-ops-update.md`](./frontline-ops-update.md) 試堂出單原則對齊（無單唔入紙 → 影響試堂人數／消堂統計）——**另題**，唔擋本題關帳

## 相關

- 指標／產品可繼續補列：[`mgmt-dashboard-kpi-spec.md`](./mgmt-dashboard-kpi-spec.md)
- 軟封存（互補；開工見該檔閘）：[`soft-archive-query-scope.md`](./soft-archive-query-scope.md)
- 流動其餘頁：[`mobile-ui.md`](./mobile-ui.md)
- 角色：[`mgmt-manager-role.md`](./mgmt-manager-role.md)
- 試堂 WIP：[`trial-promo-receipt-frontline-wip.md`](./trial-promo-receipt-frontline-wip.md)
