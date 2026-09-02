# 遠端 Migration 套用（單檔流程）

介面用語：**繁體中文**。  
linked 專案：`MainHope_production`（`supabase/.temp/project-ref`）。

## 為何不能用 `db push`

遠端 `supabase_migrations.schema_migrations` 含一批**本地 repo 沒有的版本**（Dashboard／舊分支留下的幽靈版本）；本地也有尚未標為 remote 的檔。  
因此 `supabase db push` 會失敗（`Remote migration versions not found in local migrations directory`）。

**預設做法：只套用本次新增的那一份 SQL**，不要嘗試一次推全部。

## 標準指令（給人／Agent）

```bash
export PATH="$HOME/.local/bin:$PATH"

# 套用單一 migration（含：可選 list 檢查 → 執行 SQL → repair 標記）
npm run db:apply -- supabase/migrations/YYYYMMDDHHMMSS_描述.sql
```

### `db:apply` 失敗／超時時：立刻改手動兩步（勿等使用者提醒）

```bash
export PATH="$HOME/.local/bin:$PATH"

# 1) 只執行該檔
supabase db query --linked -f supabase/migrations/YYYYMMDDHHMMSS_描述.sql

# 2) 標記歷史（版本號＝檔名前綴數字）
supabase migration repair --status applied YYYYMMDDHHMMSS --linked
```

可選診斷（唔好用 `--output-format json`，該 flag 常 timeout）：

```bash
supabase migration list --linked
supabase projects list   # 確認已 login／linked
```

## Agent 約定

1. **新增／改完本功能需要的 migration 後，主動套用**，勿等使用者再說「請執行／請套用」。
2. **禁止**在歷史不一致時對 production 跑全量 `db push`／`db reset --linked`。
3. 一次只套**本任務相關**的檔；不要順便套其他「local 有、remote 無」的舊檔（可能未審核或已用別版幽靈版本涵蓋）。
4. `npm run db:apply` 失敗時**立刻**走上方手動 `db query` + `migration repair`；唔好因為腳本印「Need login」就停——該訊息常見於 list timeout，唔等於未登入。
5. 套用後用簡短 SQL 或功能驗收確認；在回覆交代檔名與結果。
6. 僅當 `db query`／`projects list` **明確**要求 token／login 時，先請使用者 `supabase login` 或 export `SUPABASE_ACCESS_TOKEN`，再繼續；不要假裝已套用。
7. **新增／改 RPC 或 PostgREST 可見函式後**：該 migration（或後續可重播檔）須 `NOTIFY pgrst, 'reload schema'`。資料庫已有函式 ≠ Data API schema cache 已更新。套用後用 Data API smoke test（見下），不可只查 `pg_proc`。

## RPC／函式：Data API smoke test

套用含 `create function`／`create or replace function` 且要給前端 `supabase.rpc()` 呼叫的檔之後：

```bash
# 以空參數呼叫即可；重點是「函式在 schema cache」，不是業務結果。
# PGRST202 ＝ schema cache 找不到函式，須 NOTIFY 後再試。
# 401／JWT／RLS／空陣列＝函式已曝光，屬通過。
curl -sS -o /tmp/rpc-smoke.json -w "%{http_code}" \
  -X POST "$SUPABASE_URL/rest/v1/rpc/<function_name>" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{ }'
```

`<function_name>` 例：`get_class_schedule_summaries`，body 用該函式參數（可傳空陣列）。

## 已知 CLI 坑（2026-08）

- `supabase migration list --linked --output-format json` 常 `LegacyDbConnectError`／連線 timeout；plain `migration list --linked` 通常正常。
- `scripts/apply-one-migration.mjs` 已改為唔用該 flag；list 失敗會 fallback 直接 query + repair。

## 歷史對齊（已結案 2026-07-31）

幽靈已清、本地／遠端版本已對齊（見 [`backlog/supabase-migration-history.md`](backlog/supabase-migration-history.md)）。  
`supabase db push --dry-run` 可顯示 up to date；日常新檔仍建議用上方單檔 `db:apply`（較可控）。過程紀錄：[`SUPABASE_MIGRATION_PHASE2_RECOMMENDATIONS.md`](SUPABASE_MIGRATION_PHASE2_RECOMMENDATIONS.md)。

## 相關

- 目錄／鐵則：`AGENTS.md`
- RLS 上線：`docs/meta/RLS_ROLLOUT.md`
- Skill：`.cursor/skills/apply-supabase-migration/SKILL.md`
