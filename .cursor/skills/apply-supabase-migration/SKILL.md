---
name: apply-supabase-migration
description: >-
  Applies a single Supabase migration SQL file to the linked remote
  (MainHope_production) when history diverges and db push fails. Use when
  creating or finishing a supabase/migrations/*.sql change, when the user asks
  to run/apply/push a migration, or when a feature needs schema on production.
  Always apply proactively after writing the migration — do not wait for the user.
---

# Apply one Supabase migration (linked remote)

## Default behavior

After writing or completing a migration needed by the current task:

1. **Apply it yourself immediately** — do **not** wait for the user to say「請套用」.
2. **Never** run full `supabase db push` / `db reset --linked` on production while histories diverge.
3. Apply **only** the migration(s) for this task, not every local-only version.

Playbook: `docs/SUPABASE_MIGRATION_APPLY.md`.

## Preferred command

```bash
export PATH="$HOME/.local/bin:$PATH"
npm run db:apply -- supabase/migrations/YYYYMMDDHHMMSS_描述.sql
```

The script runs: optional `migration list` → `db query --linked -f` → `migration repair --status applied`.  
If list flakes/timeouts, it still continues with query + repair.

## Reliable fallback（`npm run db:apply` 失敗時立刻用）

Do **not** stop and ask the user first. Run:

```bash
export PATH="$HOME/.local/bin:$PATH"
supabase db query --linked -f supabase/migrations/YYYYMMDDHHMMSS_描述.sql
supabase migration repair --status applied YYYYMMDDHHMMSS --linked
```

Then verify with a short `supabase db query --linked "…"`.

### Known CLI pitfalls

- Prefer `supabase migration list --linked`（不加 `--output-format json`）。帶該 flag 常會 `LegacyDbConnectError`／timeout，**即使已 login**。
- `projects list` 成功 ≠ `db:apply` 一定過；list 失敗時仍可直接 `db query` + `repair`。
- 腳本舊版會把 list 失敗誤報成「Need supabase login」——先試 fallback，再判定真係 auth。

## Auth failures（真係未登入時）

Only after `db query`／`projects list` 明確要 token／login：請使用者在同一終端 `supabase login` 或 export `SUPABASE_ACCESS_TOKEN`，再重試。Do not claim the migration was applied.

## After apply

- Confirm with a short `supabase db query --linked "…"` or feature check.
- In the reply: file name, version, applied OK (or blocked on real auth).
