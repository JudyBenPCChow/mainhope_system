---
name: apply-supabase-migration
description: >-
  Applies a single Supabase migration SQL file to the linked remote
  (MainHope_production) when history diverges and db push fails. Use when
  creating or finishing a supabase/migrations/*.sql change, when the user asks
  to run/apply/push a migration, or when a feature needs schema on production.
---

# Apply one Supabase migration (linked remote)

## Default behavior

After writing or completing a migration needed by the current task:

1. **Apply it yourself** with `npm run db:apply -- <file>` — do not wait for the user to ask.
2. **Never** run full `supabase db push` / `db reset --linked` on production while histories diverge.
3. Apply **only** the migration(s) for this task, not every local-only version.

Playbook: `docs/SUPABASE_MIGRATION_APPLY.md`.

## Commands

```bash
export PATH="$HOME/.local/bin:$PATH"
npm run db:apply -- supabase/migrations/YYYYMMDDHHMMSS_描述.sql
# dry status:
npm run db:apply -- --check YYYYMMDDHHMMSS
```

Manual equivalent if the script fails:

```bash
supabase db query --linked -f supabase/migrations/YYYYMMDDHHMMSS_描述.sql
supabase migration repair --status applied YYYYMMDDHHMMSS --linked
```

## Auth failures

If CLI says login / token required: tell the user to `supabase login` or set `SUPABASE_ACCESS_TOKEN` in the **same** terminal the agent uses, then retry. Do not claim the migration was applied.

## After apply

- Confirm with a short `supabase db query --linked "…"` or feature check.
- In the reply: file name, version, applied OK (or blocked on auth).
