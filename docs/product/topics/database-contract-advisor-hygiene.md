# Database schema contract／advisor 清理

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open`（已盤點；未開工） |
| 優先 | 高 |
| 範圍 | P1-3、P2-1、P3-1（DB 部分）：generated Database types、Supabase security／performance advisor、重複 index／殘留表 |
| 不含 | 角色 capability／RLS 權限模型重設（見 [`tech-debt-hardening.md`](./tech-debt-hardening.md)）；Base44 前端殘碼（見 [`dead-surface-cleanup.md`](./dead-surface-cleanup.md)） |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 稽核 | [`2026-08-14-tech-debt-review.md`](../audits/2026-08-14-tech-debt-review.md) |

## 點解合併

三項都屬 DB schema 與 client contract 長期失配：

- 前端用裸 `SupabaseClient`，無 generated `Database` type；欄位／RPC 改名要到 runtime 先爆。
- Production advisor：security 84（73 WARN）、performance 145（55 WARN）。
- 已見重複 `app_users` email index、RLS 開啟但無 policy 的 import／helper 表等 schema 殘渣。

合併為一題，但要分波處理；唔可以為「清到零警告」盲刪 policy、index 或 SECURITY DEFINER。

## 已量度基線（2026-08-14）

- 53 個 authenticated 可 execute 的 SECURITY DEFINER function
- 10 個 mutable `search_path`
- 9 個 anon 可 execute 的 SECURITY DEFINER function（其中部分是 trigger／公開 token RPC，需逐支分類）
- 54 個 multiple permissive policy 提示
- 48 個未索引 foreign key
- 38 個 unused index、1 組 duplicate index
- 11 張 RLS enabled／0 policy 表；部分可能刻意 deny-all 或 staging/import 表

## 建議波次

1. **Schema contract**：由 production schema 產生 `Database` type；`createClient<Database>`；加可重現的 generate／check 指令。
2. **安全分類**：逐支分類 SECURITY DEFINER、anon execute、mutable `search_path`；公開 token RPC 要保留 token／身份驗證，trigger function 撤不需要的直接 EXECUTE。
3. **效能分類**：按真實查詢／DELETE-UPDATE 路徑決定 FK index；先 EXPLAIN／量表大小，唔按 advisor 數量盲加。
4. **Schema hygiene**：確認重複 index、import／tmp 表、deny-all helper 表係保留、搬 staging 定刪除；只用新增 migration。
5. **回歸**：types check、RLS 角色測試、關鍵查詢 EXPLAIN；重新取 production advisors 記錄剩餘接受項。

## 驗收

- Supabase client 使用 generated `Database` 型別；CI 可驗 schema type 未漂移。
- 每個 security WARN 有「已修／接受風險＋理由／不適用」記錄。
- 新增／刪除 index 有查詢路徑及 EXPLAIN 證據。
- duplicate index／無主責殘留表有明確處置。
- 所有 schema 改動逐檔 migration 套用，並檢查 RLS。
