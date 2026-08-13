# Supabase migration 歷史對齊（第二段餘項）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `done` |
| 優先 | 中 |
| 範圍 | linked 遠端 `MainHope_production` 的 `schema_migrations` 與本地 `supabase/migrations/` 對齊 |
| 已完成 | 清幽靈；Batch A／B1／B2／C／D；`db push --dry-run` → up to date（2026-07-31） |
| 不含 | 日常新檔套用（繼續 `npm run db:apply`）；禁止無差別 `db push --include-all` |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 建議表 | [`SUPABASE_MIGRATION_PHASE2_RECOMMENDATIONS.md`](../SUPABASE_MIGRATION_PHASE2_RECOMMENDATIONS.md) |
| 單檔流程 | [`SUPABASE_MIGRATION_APPLY.md`](../SUPABASE_MIGRATION_APPLY.md) |
| 更新日期 | 2026-07-31 |

## 結案摘要

| 階段 | 做法 |
| --- | --- |
| 幽靈 | 35 個 remote-only → `repair reverted` |
| A／B1／B2／C／M2 | 多數遠端已有物件 → 只 `repair applied`（唔重跑 SQL） |
| D | `20260717120000` 孤兒試堂清理 UPDATE + `20260730053000` 作廢通告 INSERT → `npm run db:apply` |
| 驗收 | `migration list`：remote-only＝0、local-only＝0；`db push --dry-run`：`Remote database is up to date` |

## 日常（結案後）

新 migration 仍優先：`npm run db:apply -- supabase/migrations/<檔>.sql`  
（歷史已齊時亦可 `supabase db push --linked`，但單檔流程較可控。）

## 相關

- Skill：`.cursor/skills/apply-supabase-migration/SKILL.md`
- Rule：`.cursor/rules/supabase-migrations.mdc`
