# Database schema contract／advisor 清理

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open`（2026-10-20：下一刀 migration `20261020004500` 已落。其後仍是 generated types 與警告分類） |
| 優先 | 中 |
| 範圍 | P1-3、P2-1、P3-1（DB 部分）：generated Database types、Supabase security／performance advisor、重複 index／殘留表 |
| 不含 | 角色 capability／RLS 權限模型重設（見 [`tech-debt-hardening.md`](./tech-debt-hardening.md)）；Base44 前端殘碼（見 [`dead-surface-cleanup.md`](./dead-surface-cleanup.md)）；Auth leaked password（見 [`auth-leaked-password-protection.md`](./auth-leaked-password-protection.md)）；Edge Function 型別化；計糧／總覽慢查詢（見 [`mgmt-dashboard-overhaul.md`](./mgmt-dashboard-overhaul.md)） |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 記錄 | 2026-08-14 盤點；**2026-08-21** production 再掃＋模擬落實後改波次；**2026-08-29** 再掃：Wave 1 目標態已在 production，但本 repo 無單檔 migration；**2026-10-15** 討論後降為中優先，下一刀收窄為一條 migration；**2026-10-20** 該檔已落 `20261020004500_database_contract_privilege_snapshot.sql` |

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

## 2026-08-29 覆核（對住 08-21 基線）

Production `MainHope_production`。Staging `mainhope-staging` 仍 INACTIVE。

| 項目 | 2026-08-21 | 2026-08-29 | 判斷 |
| --- | --- | --- | --- |
| 前端 `Database` 型別 | 無 | 仍無 | **Wave 2 未做** |
| Security advisor | 89（76 WARN） | **75（62 WARN）** | 跌幅對應 Wave 1 項 |
| Performance advisor | 156（72 WARN） | **164（76 WARN）** | WARN 微升；仍以 multiple permissive 為主 |
| 3 支 trigger EXECUTE | 要 REVOKE | **anon／authenticated 均不可 EXECUTE** | Wave 1 已生效 |
| `list_portal_class_schedules` anon | 要 REVOKE | **anon 不可；authenticated 可** | Wave 1 已生效 |
| Token RPC anon | 禁止 revoke | 5 支仍可 EXECUTE | 正確，勿動 |
| 8 支 INVOKER `search_path` | 未釘 | **全部 `search_path=public`** | Wave 1 已生效 |
| duplicate email index | `app_users_email_lower_uidx` 仍在 | **只剩 `app_users_email_unique`** | Wave 1 已生效 |
| Leaked password | 關 | **仍關** | 另題 [`auth-leaked-password-protection.md`](./auth-leaked-password-protection.md) |

**2026-10-20：** 對齊檔是 [`20261020004500_database_contract_privilege_snapshot.sql`](../../../supabase/migrations/20261020004500_database_contract_privilege_snapshot.sql)。新環境重跑該檔即可，不必再靠人手在正式環境補權限。

## 2026-10-15 討論

維持 `open`。優先由高改為中。Wave 1 的執行權、`search_path` 與重複 email index 已在正式環境生效（2026-08-29；2026-10-09 結構審查未見退回）。現有收費與點名不依賴本題。

Git 仍沒有對齊那批狀態的 migration。10 月審查另見兩處後來漂回的警告，併入同一條 migration，不另開題：

| 項目 | 依據 | 處置 |
| --- | --- | --- |
| `forbid_grade_scope_pool_on_mixed_class` | `20261007044500_forbid_mixed_class_grade_scope_pools.sql`；審查 A2-07 | trigger。`REVOKE EXECUTE` FROM PUBLIC、anon、authenticated。不要用 `CREATE OR REPLACE` |
| `leads_sync_interested_subjects_on_convert` | `20260927032100_leads_sync_interested_subjects_trigger.sql`；審查 A2-07 | 同上 |
| `leads_set_updated_at` | 審查 A2-08。當時唯一的 `function_search_path_mutable` | 只 `ALTER FUNCTION … SET search_path = public` |

不放入本題：廣告提交函式仍可由未登入身分執行（A2-01）、對話回饋表對已登入身分全開（A2-05）、洩露密碼保護（見 [`auth-leaked-password-protection.md`](./auth-leaked-password-protection.md)）。

### 下一刀（只此一件）

一條 idempotent migration：

- 8 月 29 日已在正式環境生效、repo 沒有的 `REVOKE`、八支 INVOKER 的 `ALTER … SET search_path`、`DROP INDEX IF EXISTS app_users_email_lower_uidx`
- 上表兩支 trigger 的 `REVOKE`，以及 `leads_set_updated_at` 的 `search_path`
- 不用 `CREATE OR REPLACE`
- 套用後只讀驗證 trigger 仍在、擁有者仍可 EXECUTE。禁止在正式環境插入測試列

同一輪把「`CREATE OR REPLACE FUNCTION` 會還原 `PUBLIC` EXECUTE，改完 trigger 必須再 `REVOKE`」寫入 migration skill。10 月的兩支 trigger 就是這條沒寫下來而再次發生。

### 其後再做（不與上一條綁在同一輪）

- generated `Database` 型別：`src/types/database.ts`、`createClient<Database>`、`db:types`。第一刀仍不加 CI types drift check。
- 每個剩餘 security 警告一行分類（已修／接受並寫理由／不適用）。效能黃燈維持接受；外鍵 index 等表變大或 EXPLAIN 證實再加。

## 建議波次（2026-08-21 模擬後修訂；08-29 註；2026-10-15 起順序以上一節為準）

原 08-14 波次係「型別 → 安全分類 → 效能 → hygiene」。模擬落實後改為：

1. **一條 DDL migration（先做；08-29：production 已係目標態）**：補 **idempotent** 單檔（`REVOKE`／`ALTER … SET search_path`／`DROP INDEX IF EXISTS app_users_email_lower_uidx`）對齊 git 歷史。唔用 `CREATE OR REPLACE`。套用後只讀 SQL 驗 trigger 仍在、owner 仍有 EXECUTE；**禁止**喺 production 插測試列。Staging 唔當試金石。
2. **Schema contract**：`supabase gen types typescript --linked --schema public` → `src/types/database.ts`；`createClient<Database>`；`db:types` 指令。第一刀**唔**加 CI types drift check（欠 token）。預期 tsc 熱點：insert／upsert／rpc 參數、jsonb `Json`、`Record<string, unknown>` payload。`supabase/functions/` 唔改。
3. **防再漂**：`CREATE OR REPLACE FUNCTION` 會還原 `PUBLIC` EXECUTE；改完 trigger 函數必須再 REVOKE；schema 改完要 regen types。寫入 migration skill／規則。
4. **分類帳**：每個剩餘 security WARN 一行「已修／接受＋理由／不適用」。效能黃燈本輪多數接受；FK index 等表大或 EXPLAIN 證實先加。

逃生艙：若 Relationships 令 `tsc` 過深／過慢，可只提交 types 檔、暫緩 `createClient<Database>` 接線；唔用全域 `as any`。

## 驗收

下一刀（migration）：

- 三支原 trigger，加上 `forbid_grade_scope_pool_on_mixed_class`、`leads_sync_interested_subjects_on_convert`：anon／authenticated 不可 EXECUTE；trigger 定義仍在。
- Token RPC（禁止名單）：anon 仍可 EXECUTE。
- duplicate index advisor 消失；八支 INVOKER 與 `leads_set_updated_at` 不再報 mutable search_path。
- 上述改動在單檔 migration；無為清零而盲刪 policy／DEFINER。

其後再做：

- Client 用 generated `Database`（或逃生艙已記錄）；`npm run build` 過。
- 每個剩餘 security 警告有分類；新增或刪除 index 有理由。
