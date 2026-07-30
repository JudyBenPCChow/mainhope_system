# 工程待跟進（Backlog）

本檔＝未完成／進行中的**工程主題目錄**，不是產品「待辦看板」（`/Calendar`），也不是 UI／營運規範正文。

| 想找… | 去邊 |
| --- | --- |
| 手機該點做（規範） | [`UI_DESIGN_INSTRUCTIONS.md`](./UI_DESIGN_INSTRUCTIONS.md) §14 |
| 進行中實作步驟 | [`docs/plans/`](./plans/) |
| 未規劃功能構想 | [`FUTURE_*.md`](./FUTURE_BANNER_PUSH_NOTIFICATIONS.md) 等 |
| 架構習慣 | [`AGENT_HANDOFF.md`](./AGENT_HANDOFF.md) |
| 營運操作／政策 | [`SYSTEM_MANUAL.md`](./SYSTEM_MANUAL.md)、[`OPS_POLICIES.md`](./OPS_POLICIES.md) |

**Agent**：使用者問「有咩未做」／list backlog 時，讀本檔，只列出狀態為 **open**／**in_progress** 的列；細節見「詳情」連結。

## 維護約定

- 新主題：加一列 + 可選 `docs/backlog/<topic>.md`
- 開始做：狀態改 `in_progress`；若有實作計畫，連到 `docs/plans/…`
- 完成：狀態改 `done`（可留檔備查，勿默默刪）
- 本索引只放一句摘要；長表／方案放分題檔

## 主題一覽

| 狀態 | 優先 | 主題 | 摘要 | 詳情 |
| --- | --- | --- | --- | --- |
| open | 高 | 生命週期孤兒 | 取消請假／補堂／試堂／退讀後點名紙無名但出席仍在；分階段可見性→攔截→行政刪→健康檢查 | [lifecycle-orphans.md](./backlog/lifecycle-orphans.md) |
| open | 高 | 流動裝置介面 | 後台三角色（行政／老師／外星人）手機版面；底欄高頻頁多為橫滑表格，少數殼層遮擋 | [mobile-ui.md](./backlog/mobile-ui.md) |
| open | 中 | 聯絡資料自助更新（一次性活動） | 批量派發專屬連結／QR，家長核對電話與偏好後職員審核寫入；活動完可收埋 | [contact-update-campaign.md](./backlog/contact-update-campaign.md) |
| open | 中 | 試堂紀錄收尾 | 新增收費是否脫鉤、點名人頭／改期名單驗收、收費對帳；快速登記暫不做；手機卡片可選 | [trial-sessions.md](./backlog/trial-sessions.md) |
| open | 中 | Migration 歷史對齊 | 幽靈已清、A／B1 已標記；餘 B2 煙霧測、C 成對對照、D 通告／函式、可選恢復 db push | [supabase-migration-history.md](./backlog/supabase-migration-history.md) |
| open | 中 | 管理層角色分流 | 新增 `manager`；與行政分開首頁（營運總覽 vs 管理中心）及側欄；外星人／老師本期不改 | [mgmt-manager-role.md](./backlog/mgmt-manager-role.md) |
