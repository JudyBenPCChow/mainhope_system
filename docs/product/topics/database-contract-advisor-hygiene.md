# Database schema contract／advisor 清理

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open`（2026-08-21 已覆核；未開工） |
| 優先 | 高 |
| 範圍 | P1-3、P2-1、P3-1（DB 部分）：generated Database types、Supabase security／performance advisor、重複 index／殘留表 |
| 不含 | 角色 capability／RLS 權限模型重設（見 [`tech-debt-hardening.md`](./tech-debt-hardening.md)）；Base44 前端殘碼（見 [`dead-surface-cleanup.md`](./dead-surface-cleanup.md)）；Auth leaked password（見 [`auth-leaked-password-protection.md`](./auth-leaked-password-protection.md)）；Edge Function 型別化；計糧／總覽慢查詢（見 [`mgmt-dashboard-overhaul.md`](./mgmt-dashboard-overhaul.md)） |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 稽核 | [`2026-08-14-tech-debt-review.md`](../audits/2026-08-14-tech-debt-review.md) |
| 記錄 | 2026-08-14 盤點；**2026-08-21** production 再掃＋模擬落實後改波次（DDL 先行；禁 `CREATE OR REPLACE` 做今次權限／search_path；token RPC 永不 revoke anon） |

## 點解合併

三項都屬 DB schema 與 client contract 長期失配。合併為一題，但要分波；**唔可以為「清到零警告」盲刪 policy、index 或 SECURITY DEFINER。** Advisor 目標係分類完，唔係 WARN=0。

## 2026-08-21 覆核（對住 08-14 基線）

Production `MainHope_production`。Staging `mainhope-staging` 已 ACTIVE（08-14 為 INACTIVE）；本題仍以 production 為準，staging **唔當** schema 試金石。

| 項目 | 2026-08-14 | 2026-08-21 | 判斷 |
| --- | --- | --- | --- |
| 前端 `Database` 型別 | 無 | 仍無（[`src/lib/supabaseClient.ts`](../../../src/lib/supabaseClient.ts) 裸 `createClient`；無 generate 指令） | **仍在，要修** |
| Security advisor | 84（73 WARN） | **89（76 WARN）** | 未改善 |
| Performance advisor | 145（55 WARN） | **156（72 WARN）** | WARN 升幅幾乎全係 multiple permissive（P0-1 疊政策，預期） |
| authenticated 可 execute 的 SECURITY DEFINER | 53 | **58** | 升：P0-1 加函數；分類帳接受，唔改 INVOKER |
| anon 可 execute 的 SECURITY DEFINER | 9 | **仍 9** | 3 支 trigger 可收；6 支 token／portal **留** |
| DEFINER mutable `search_path` | 10 | **0**（DEFINER 已全部有 `SET search_path`） | 已改善；剩 **8 支 INVOKER** 未釘 |
| multiple permissive policies | 54 | **71** | **接受，唔合併** |
| 未索引 FK | 48 | **48** | 最大表 `schedules` ~1534 行／536 kB；**暫不加** |
| unused index | 38 | **32** | 本輪唔刪 |
| duplicate index | 1 組 | **仍在** `app_users_email_lower_uidx` ≡ `app_users_email_unique` | **要修**：刪前者、留後者 |
| public RLS on／0 policy | 11 張 | **4 張** | 已改善；剩表接受保留 |

### anon DEFINER 9 支分類

| 函數 | 性質 | 處置 |
| --- | --- | --- |
| `classes_backfill_null_schedule_teachers` | trigger（DEFINER，會 `UPDATE schedules`） | **REVOKE** EXECUTE FROM PUBLIC／anon／authenticated |
| `schedules_default_teacher_from_class` | trigger | 同上 REVOKE |
| `teachers_ensure_private_row` | trigger | 同上 REVOKE |
| `contact_update_get`／`contact_update_submit` | 公開 token RPC；本 repo 未登入頁會打 | **禁止 revoke anon** |
| `front_desk_intake_get`／`front_desk_intake_submit` | 同上 | **禁止 revoke anon** |
| `peek_portal_invite` | Portal token（本 repo 無 UI） | **禁止 revoke anon** |
| `list_portal_class_schedules` | 體內已 `is_portal()`；2026-07-12 曾 revoke anon，其後 `CREATE OR REPLACE` 把 PUBLIC execute 整返 | **本輪 REVOKE anon**，只留 authenticated |

### 8 支 INVOKER 未釘 search_path

`academic_year_label_from_date`、`grade_code_to_label`、`normalize_class_grade_label`、`normalize_class_grade_array`、`portal_resolve_unit_price`、`recompute_student_enrollment_state`、`trg_recompute_student_state_from_student_row`、`apo_assistant_is_pending_makeup`。

只准 `ALTER FUNCTION … SET search_path = public`，**唔用 `CREATE OR REPLACE`**（REPLACE 會還原 GRANT，連剛 revoke 嘅 trigger EXECUTE 都會返嚟）。其中 `trg_recompute_student_state_from_student_row` 本身係 trigger：只釘 search_path，**唔擴大 REVOKE 名單**。

### RLS enabled／0 policy（接受）

- `private.authz_*`、`private.mgmt_session_roles`：刻意 deny-all
- `staging.*_import`：匯入暫存
- `public.mgmt_active_roles`（4 行）：P0-2 雙寫後備，留
- `public.tmp_students_import`、`weekday_aliases`、`class_restructure_audit_logs`：0 行 helper；本輪唔刪

## 建議波次（2026-08-21 模擬後修訂）

原 08-14 波次係「型別 → 安全分類 → 效能 → hygiene」。模擬落實後改為：

1. **一條 DDL migration（先做）**：REVOKE 3 支 trigger EXECUTE；REVOKE `list_portal_class_schedules` anon；`ALTER` 8 支 INVOKER `search_path`；`DROP INDEX app_users_email_lower_uidx`。單檔 `db:apply`。套用後只讀 SQL 驗 trigger 仍在、owner 仍有 EXECUTE；**禁止**喺 production 插測試列。Staging 唔當試金石。
2. **Schema contract**：`supabase gen types typescript --linked --schema public` → `src/types/database.ts`；`createClient<Database>`；`db:types` 指令。第一刀**唔**加 CI types drift check（欠 token）。預期 tsc 熱點：insert／upsert／rpc 參數、jsonb `Json`、`Record<string, unknown>` payload。`supabase/functions/` 唔改。
3. **防再漂**：`CREATE OR REPLACE FUNCTION` 會還原 `PUBLIC` EXECUTE；改完 trigger 函數必須再 REVOKE；schema 改完要 regen types。寫入 migration skill／規則。
4. **分類帳**：每個剩餘 security WARN 一行「已修／接受＋理由／不適用」。效能黃燈本輪多數接受；FK index 等表大或 EXPLAIN 證實先加。

逃生艙：若 Relationships 令 `tsc` 過深／過慢，可只提交 types 檔、暫緩 `createClient<Database>` 接線；唔用全域 `as any`。

## 驗收

- 三支 trigger：anon／authenticated 不可 EXECUTE；trigger 定義仍在。
- Token RPC（上表禁止名單）：anon 仍可 EXECUTE。
- duplicate index advisor 消失；8 支 INVOKER 不再報 mutable search_path。
- Client 用 generated `Database`（或逃生艙已記錄）；`npm run build` 過。
- 每個剩餘 security WARN 有分類；新增／刪除 index 有理由（本輪只刪重複 email index）。
- 所有 schema 改動逐檔 migration 套用；無為清零而盲刪 policy／DEFINER。
