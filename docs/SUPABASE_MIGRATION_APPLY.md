# 遠端 Migration 套用（單檔流程）

介面用語：**繁體中文**。  
linked 專案：`MainHope_production`（`supabase/.temp/project-ref`）。

## 為何不能用 `db push`

遠端 `supabase_migrations.schema_migrations` 含一批**本地 repo 沒有的版本**（Dashboard／舊分支留下的幽靈版本）；本地也有尚未標為 remote 的檔。  
因此 `supabase db push` 會失敗（`Remote migration versions not found in local migrations directory`）。

**預設做法：只套用本次新增的那一份 SQL**，不要嘗試一次推全部。

## 標準指令（給人／Agent）

```bash
# 套用單一 migration（含：檢查是否已套用 → 執行 SQL → repair 標記）
npm run db:apply -- supabase/migrations/YYYYMMDDHHMMSS_描述.sql
```

等價手動步驟：

```bash
export PATH="$HOME/.local/bin:$PATH"

# 1) 看本地 vs 遠端（找出 local 有、remote 空的版本）
supabase migration list --linked

# 2) 只執行該檔
supabase db query --linked -f supabase/migrations/YYYYMMDDHHMMSS_描述.sql

# 3) 標記歷史（版本號＝檔名前綴數字）
supabase migration repair --status applied YYYYMMDDHHMMSS --linked
```

## Agent 約定

1. **新增／改完本功能需要的 migration 後，主動套用**，勿等使用者再說「請執行」。
2. **禁止**在歷史不一致時對 production 跑全量 `db push`／`db reset --linked`。
3. 一次只套**本任務相關**的檔；不要順便套其他「local 有、remote 無」的舊檔（可能未審核或已用別版幽靈版本涵蓋）。
4. 套用後用簡短 SQL 或功能驗收確認；在回覆交代檔名與結果。
5. 缺 `SUPABASE_ACCESS_TOKEN`／未 login 時：請使用者在同一終端 `supabase login` 或 export token，再繼續；不要假裝已套用。

## 長期（另開任務，勿夾帶日常功能）

幽靈版本（遠端獨有）若已清完，仍可能有一批「本地有、遠端未標記」。第二段建議表（只分析、預設未執行）：[`SUPABASE_MIGRATION_PHASE2_RECOMMENDATIONS.md`](SUPABASE_MIGRATION_PHASE2_RECOMMENDATIONS.md)。完成對齊前繼續用單檔流程。

## 相關

- 目錄／鐵則：`AGENTS.md`
- RLS 上線：`docs/RLS_ROLLOUT.md`
- Skill：`.cursor/skills/apply-supabase-migration/SKILL.md`
