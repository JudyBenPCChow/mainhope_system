# Database schema contract／advisor 清理

| 欄位 | 值 |
| --- | --- |
| 狀態 | `done`（2026-10-20：`src/types/database.ts` 已接 `createClient<Database>`；同日 security advisor 剩餘 111 項已逐項分類。效能黃燈整組接受，沒有為清零而刪政策或索引） |
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

### 其後再做（2026-10-20 已做；分類見文末）

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

其後再做（2026-10-20）：

- Client 已用 generated `Database`；`npm run build` 已過。`listTable` 的表名是全部 public 表聯集，帶 Relationships 的 `from()` 會令 instantiation 過深，該函式單獨改用不帶 `Database` 的客戶端。
- 每個剩餘 security 警告已分類（見下節）。沒有新增或刪除 index。

## 2026-10-20 security 分類

來源：Supabase security advisor，`MainHope_production`，`observed_at` 2026-10-19T17:24:15Z。共 111 項（WARN 97、INFO 14）。效能 advisor 整組接受，不在下表。沒有為了清零而刪政策、索引或 SECURITY DEFINER。

下列項目顧問已不再列出，分類為**已修**（`20261020004500`）：

- `function_search_path_mutable`：八支 INVOKER 與 `leads_set_updated_at` 已釘 `search_path`
- 重複索引 `app_users_email_lower_uidx` 已刪，留 `app_users_email_unique`
- 五支 trigger 的 anon／authenticated EXECUTE 已收回：`classes_backfill_null_schedule_teachers`、`schedules_default_teacher_from_class`、`teachers_ensure_private_row`、`forbid_grade_scope_pool_on_mixed_class`、`leads_sync_interested_subjects_on_convert`
- `list_portal_class_schedules` 的 anon EXECUTE 已收回（authenticated 仍在下表）

| 級別 | 警告 | 對象 | 分類 | 原因 |
| --- | --- | --- | --- | --- |
| INFO | RLS 已開、無政策 | `private.authz_capabilities` | 接受 | 刻意不設政策，等同拒絕全部直讀。 |
| INFO | RLS 已開、無政策 | `private.authz_meta` | 接受 | 刻意不設政策，等同拒絕全部直讀。 |
| INFO | RLS 已開、無政策 | `private.authz_role_capabilities` | 接受 | 刻意不設政策，等同拒絕全部直讀。 |
| INFO | RLS 已開、無政策 | `private.mgmt_session_roles` | 接受 | 刻意不設政策，等同拒絕全部直讀。 |
| INFO | RLS 已開、無政策 | `public.ad_public_rate_events` | 接受 | `20260925151000` 已撤銷表權限，刻意拒絕直讀。 |
| INFO | RLS 已開、無政策 | `public.class_restructure_audit_logs` | 接受 | helper 或暫存表；本輪不刪表、不加政策。 |
| INFO | RLS 已開、無政策 | `public.mgmt_active_roles` | 接受 | P0-2 雙寫後備，保留空政策。 |
| INFO | RLS 已開、無政策 | `public.tmp_students_import` | 接受 | helper 或暫存表；本輪不刪表、不加政策。 |
| INFO | RLS 已開、無政策 | `public.weekday_aliases` | 接受 | helper 或暫存表；本輪不刪表、不加政策。 |
| INFO | RLS 已開、無政策 | `staging.attendance_import` | 接受 | 匯入暫存表，刻意無政策。 |
| INFO | RLS 已開、無政策 | `staging.classes_import` | 接受 | 匯入暫存表，刻意無政策。 |
| INFO | RLS 已開、無政策 | `staging.enrollments_import` | 接受 | 匯入暫存表，刻意無政策。 |
| INFO | RLS 已開、無政策 | `staging.schedules_import` | 接受 | 匯入暫存表，刻意無政策。 |
| INFO | RLS 已開、無政策 | `staging.students_import` | 接受 | 匯入暫存表，刻意無政策。 |
| WARN | extension 在 public | `public.pg_net` | 接受 | `20261020001500` 裝在 public，排程電郵使用 `net.http_post`；搬 schema 要重建 extension，本輪不搬。 |
| WARN | anon 可執行 DEFINER | `ad_homework_catalog_get`（anon） | 接受 | 公開頁直接呼叫目錄（`adTrialQueries`），須保留未登入執行權。 |
| WARN | anon 可執行 DEFINER | `ad_trial_catalog_get`（anon） | 接受 | 公開頁直接呼叫目錄（`adTrialQueries`），須保留未登入執行權。 |
| WARN | anon 可執行 DEFINER | `ad_trial_interest_submit`（anon） | 不適用 | 結構審查 A2-01：畫面已走 Edge，是否收回不在本題。 |
| WARN | anon 可執行 DEFINER | `ad_trial_submit`（anon） | 不適用 | 結構審查 A2-01：畫面已走 Edge，是否收回不在本題。 |
| WARN | anon 可執行 DEFINER | `contact_update_get`（anon） | 接受 | 憑 token 的公開頁，禁止收回未登入執行權。 |
| WARN | anon 可執行 DEFINER | `contact_update_submit`（anon） | 接受 | 憑 token 的公開頁，禁止收回未登入執行權。 |
| WARN | anon 可執行 DEFINER | `front_desk_intake_get`（anon） | 接受 | 憑 token 的公開頁，禁止收回未登入執行權。 |
| WARN | anon 可執行 DEFINER | `front_desk_intake_submit`（anon） | 接受 | 憑 token 的公開頁，禁止收回未登入執行權。 |
| WARN | anon 可執行 DEFINER | `peek_portal_invite`（anon） | 接受 | 憑 token 的公開頁，禁止收回未登入執行權。 |
| WARN | anon 可執行 DEFINER | `trial_invite_get`（anon） | 接受 | 憑 token 的公開頁，禁止收回未登入執行權。 |
| WARN | anon 可執行 DEFINER | `trial_invite_submit`（anon） | 接受 | 憑 token 的公開頁，禁止收回未登入執行權。 |
| WARN | authenticated 可執行 DEFINER | `ad_homework_catalog_get`（authenticated） | 接受 | 公開目錄，已登入亦可呼叫。 |
| WARN | authenticated 可執行 DEFINER | `ad_public_abuse_stats`（authenticated） | 接受 | 函式內檢查 `is_mgmt_staff` 與 `students.enroll`，維持 DEFINER。 |
| WARN | authenticated 可執行 DEFINER | `ad_trial_catalog_get`（authenticated） | 接受 | 公開目錄，已登入亦可呼叫。 |
| WARN | authenticated 可執行 DEFINER | `ad_trial_interest_submit`（authenticated） | 不適用 | 結構審查 A2-01：與 anon 同一對提交函式，本題不收回。 |
| WARN | authenticated 可執行 DEFINER | `ad_trial_set_classes_listed`（authenticated） | 接受 | 應用 RPC，維持 SECURITY DEFINER；本輪不改 INVOKER、不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `ad_trial_set_schedules_excluded`（authenticated） | 接受 | 應用 RPC，維持 SECURITY DEFINER；本輪不改 INVOKER、不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `ad_trial_submit`（authenticated） | 不適用 | 結構審查 A2-01：與 anon 同一對提交函式，本題不收回。 |
| WARN | authenticated 可執行 DEFINER | `apply_attendance_entitlement_delta`（authenticated） | 接受 | 函式內檢查 `attendance.take`，維持 DEFINER。 |
| WARN | authenticated 可執行 DEFINER | `can_access_homework_day_logs`（authenticated） | 接受 | 身分或資格判斷，供 RLS 或其他 RPC 使用；不改 INVOKER。 |
| WARN | authenticated 可執行 DEFINER | `cancel_portal_enrollment_request`（authenticated） | 接受 | 應用 RPC，維持 SECURITY DEFINER；本輪不改 INVOKER、不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `clear_my_mgmt_session_role`（authenticated） | 接受 | 應用 RPC，維持 SECURITY DEFINER；本輪不改 INVOKER、不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `contact_update_approve`（authenticated） | 接受 | 應用 RPC，維持 SECURITY DEFINER；本輪不改 INVOKER、不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `contact_update_create`（authenticated） | 接受 | 應用 RPC，維持 SECURITY DEFINER；本輪不改 INVOKER、不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `contact_update_get`（authenticated） | 接受 | 與未登入同一套 token 流程，已登入身份亦須能呼叫。 |
| WARN | authenticated 可執行 DEFINER | `contact_update_submit`（authenticated） | 接受 | 與未登入同一套 token 流程，已登入身份亦須能呼叫。 |
| WARN | authenticated 可執行 DEFINER | `contact_update_void`（authenticated） | 接受 | 應用 RPC，維持 SECURITY DEFINER；本輪不改 INVOKER、不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `current_app_role`（authenticated） | 接受 | 身分或資格判斷，供 RLS 或其他 RPC 使用；不改 INVOKER。 |
| WARN | authenticated 可執行 DEFINER | `current_app_user_id`（authenticated） | 接受 | 身分或資格判斷，供 RLS 或其他 RPC 使用；不改 INVOKER。 |
| WARN | authenticated 可執行 DEFINER | `current_inbox_actor_key`（authenticated） | 接受 | 身分或資格判斷，供 RLS 或其他 RPC 使用；不改 INVOKER。 |
| WARN | authenticated 可執行 DEFINER | `current_portal_student_id`（authenticated） | 接受 | 身分或資格判斷，供 RLS 或其他 RPC 使用；不改 INVOKER。 |
| WARN | authenticated 可執行 DEFINER | `current_portal_view_as_student_id`（authenticated） | 接受 | 身分或資格判斷，供 RLS 或其他 RPC 使用；不改 INVOKER。 |
| WARN | authenticated 可執行 DEFINER | `current_teacher_id`（authenticated） | 接受 | 身分或資格判斷，供 RLS 或其他 RPC 使用；不改 INVOKER。 |
| WARN | authenticated 可執行 DEFINER | `front_desk_intake_consume`（authenticated） | 接受 | 應用 RPC，維持 SECURITY DEFINER；本輪不改 INVOKER、不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `front_desk_intake_create`（authenticated） | 接受 | 應用 RPC，維持 SECURITY DEFINER；本輪不改 INVOKER、不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `front_desk_intake_get`（authenticated） | 接受 | 與未登入同一套 token 流程，已登入身份亦須能呼叫。 |
| WARN | authenticated 可執行 DEFINER | `front_desk_intake_submit`（authenticated） | 接受 | 與未登入同一套 token 流程，已登入身份亦須能呼叫。 |
| WARN | authenticated 可執行 DEFINER | `get_attendance_records_in_range`（authenticated） | 接受 | 應用 RPC，維持 SECURITY DEFINER；本輪不改 INVOKER、不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `get_class_schedule_summaries`（authenticated） | 接受 | 應用 RPC，維持 SECURITY DEFINER；本輪不改 INVOKER、不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `get_enrollment_effective_dates`（authenticated） | 接受 | 應用 RPC，維持 SECURITY DEFINER；本輪不改 INVOKER、不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `get_my_mgmt_profile`（authenticated） | 接受 | 應用 RPC，維持 SECURITY DEFINER；本輪不改 INVOKER、不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `get_my_mgmt_profile_v2`（authenticated） | 接受 | 應用 RPC，維持 SECURITY DEFINER；本輪不改 INVOKER、不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `get_portal_view_as`（authenticated） | 接受 | 應用 RPC，維持 SECURITY DEFINER；本輪不改 INVOKER、不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `get_schedule_manage_stats`（authenticated） | 接受 | 應用 RPC，維持 SECURITY DEFINER；本輪不改 INVOKER、不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `get_teacher_schedule_roster_context`（authenticated） | 接受 | 應用 RPC，維持 SECURITY DEFINER；本輪不改 INVOKER、不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `is_admin`（authenticated） | 接受 | 身分或資格判斷，供 RLS 或其他 RPC 使用；不改 INVOKER。 |
| WARN | authenticated 可執行 DEFINER | `is_alien`（authenticated） | 接受 | 身分或資格判斷，供 RLS 或其他 RPC 使用；不改 INVOKER。 |
| WARN | authenticated 可執行 DEFINER | `is_portal`（authenticated） | 接受 | 身分或資格判斷，供 RLS 或其他 RPC 使用；不改 INVOKER。 |
| WARN | authenticated 可執行 DEFINER | `list_homework_tutoring_enrollments`（authenticated） | 接受 | 應用 RPC，維持 SECURITY DEFINER；本輪不改 INVOKER、不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `list_pending_room_booking_occupancy`（authenticated） | 接受 | 應用 RPC，維持 SECURITY DEFINER；本輪不改 INVOKER、不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `list_portal_class_schedules`（authenticated） | 接受 | 2026-08-29 已收回 anon；體內有 `is_portal()`，authenticated 保留。 |
| WARN | authenticated 可執行 DEFINER | `list_portal_enrollable_class_ids`（authenticated） | 接受 | 應用 RPC，維持 SECURITY DEFINER；本輪不改 INVOKER、不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `list_portal_my_trial_schedules`（authenticated） | 接受 | 應用 RPC，維持 SECURITY DEFINER；本輪不改 INVOKER、不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `list_room_schedule_occupancy`（authenticated） | 接受 | 應用 RPC，維持 SECURITY DEFINER；本輪不改 INVOKER、不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `peek_portal_invite`（authenticated） | 接受 | 與未登入同一套 token 流程，已登入身份亦須能呼叫。 |
| WARN | authenticated 可執行 DEFINER | `portal_allocate_invoice_number`（authenticated） | 接受 | 已收回 anon 與 public；已登入仍可呼叫。本輪不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `portal_build_quote_from_lines`（authenticated） | 接受 | 應用 RPC，維持 SECURITY DEFINER；本輪不改 INVOKER、不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `portal_can_access_class`（authenticated） | 接受 | 身分或資格判斷，供 RLS 或其他 RPC 使用；不改 INVOKER。 |
| WARN | authenticated 可執行 DEFINER | `portal_class_matches_current_student_grade`（authenticated） | 接受 | 身分或資格判斷，供 RLS 或其他 RPC 使用；不改 INVOKER。 |
| WARN | authenticated 可執行 DEFINER | `portal_class_matches_student_grade`（authenticated） | 接受 | 身分或資格判斷，供 RLS 或其他 RPC 使用；不改 INVOKER。 |
| WARN | authenticated 可執行 DEFINER | `portal_count_lessons_for_period`（authenticated） | 接受 | 應用 RPC，維持 SECURITY DEFINER；本輪不改 INVOKER、不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `portal_student_grade_label`（authenticated） | 接受 | 應用 RPC，維持 SECURITY DEFINER；本輪不改 INVOKER、不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `preview_portal_enrollment_quote`（authenticated） | 接受 | 應用 RPC，維持 SECURITY DEFINER；本輪不改 INVOKER、不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `redeem_portal_invite`（authenticated） | 接受 | 應用 RPC，維持 SECURITY DEFINER；本輪不改 INVOKER、不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `review_portal_enrollment_request`（authenticated） | 接受 | 應用 RPC，維持 SECURITY DEFINER；本輪不改 INVOKER、不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `start_portal_view_as`（authenticated） | 接受 | 應用 RPC，維持 SECURITY DEFINER；本輪不改 INVOKER、不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `stop_portal_view_as`（authenticated） | 接受 | 應用 RPC，維持 SECURITY DEFINER；本輪不改 INVOKER、不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `submit_portal_enrollment_request`（authenticated） | 接受 | 應用 RPC，維持 SECURITY DEFINER；本輪不改 INVOKER、不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `switch_my_mgmt_role`（authenticated） | 接受 | 應用 RPC，維持 SECURITY DEFINER；本輪不改 INVOKER、不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `switch_my_mgmt_role_v2`（authenticated） | 接受 | 應用 RPC，維持 SECURITY DEFINER；本輪不改 INVOKER、不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `teacher_can_access_calendar_event`（authenticated） | 接受 | 身分或資格判斷，供 RLS 或其他 RPC 使用；不改 INVOKER。 |
| WARN | authenticated 可執行 DEFINER | `teacher_can_access_class`（authenticated） | 接受 | 身分或資格判斷，供 RLS 或其他 RPC 使用；不改 INVOKER。 |
| WARN | authenticated 可執行 DEFINER | `teacher_can_access_schedule`（authenticated） | 接受 | 身分或資格判斷，供 RLS 或其他 RPC 使用；不改 INVOKER。 |
| WARN | authenticated 可執行 DEFINER | `teacher_can_access_student`（authenticated） | 接受 | 身分或資格判斷，供 RLS 或其他 RPC 使用；不改 INVOKER。 |
| WARN | authenticated 可執行 DEFINER | `teacher_can_read_attendance`（authenticated） | 接受 | 身分或資格判斷，供 RLS 或其他 RPC 使用；不改 INVOKER。 |
| WARN | authenticated 可執行 DEFINER | `teacher_can_write_attendance`（authenticated） | 接受 | 身分或資格判斷，供 RLS 或其他 RPC 使用；不改 INVOKER。 |
| WARN | authenticated 可執行 DEFINER | `teacher_has_homework_tutoring_nav`（authenticated） | 接受 | 身分或資格判斷，供 RLS 或其他 RPC 使用；不改 INVOKER。 |
| WARN | authenticated 可執行 DEFINER | `teacher_owns_schedule_row`（authenticated） | 接受 | 身分或資格判斷，供 RLS 或其他 RPC 使用；不改 INVOKER。 |
| WARN | authenticated 可執行 DEFINER | `trial_invite_catalog_allows_class`（authenticated） | 接受 | 身分或資格判斷，供 RLS 或其他 RPC 使用；不改 INVOKER。 |
| WARN | authenticated 可執行 DEFINER | `trial_invite_class_matches_student`（authenticated） | 接受 | 身分或資格判斷，供 RLS 或其他 RPC 使用；不改 INVOKER。 |
| WARN | authenticated 可執行 DEFINER | `trial_invite_class_under_enrolled_cap`（authenticated） | 接受 | 身分或資格判斷，供 RLS 或其他 RPC 使用；不改 INVOKER。 |
| WARN | authenticated 可執行 DEFINER | `trial_invite_create`（authenticated） | 接受 | 應用 RPC，維持 SECURITY DEFINER；本輪不改 INVOKER、不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `trial_invite_get`（authenticated） | 接受 | 與未登入同一套 token 流程，已登入身份亦須能呼叫。 |
| WARN | authenticated 可執行 DEFINER | `trial_invite_review`（authenticated） | 接受 | 應用 RPC，維持 SECURITY DEFINER；本輪不改 INVOKER、不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `trial_invite_schedule_open_for_parent`（authenticated） | 接受 | 身分或資格判斷，供 RLS 或其他 RPC 使用；不改 INVOKER。 |
| WARN | authenticated 可執行 DEFINER | `trial_invite_set_class_listed`（authenticated） | 接受 | 應用 RPC，維持 SECURITY DEFINER；本輪不改 INVOKER、不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `trial_invite_set_classes_listed`（authenticated） | 接受 | 應用 RPC，維持 SECURITY DEFINER；本輪不改 INVOKER、不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `trial_invite_set_schedule_excluded`（authenticated） | 接受 | 應用 RPC，維持 SECURITY DEFINER；本輪不改 INVOKER、不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `trial_invite_set_schedules_excluded`（authenticated） | 接受 | 應用 RPC，維持 SECURITY DEFINER；本輪不改 INVOKER、不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `trial_invite_set_teacher_participating`（authenticated） | 接受 | 應用 RPC，維持 SECURITY DEFINER；本輪不改 INVOKER、不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `trial_invite_subject_open_for_student`（authenticated） | 接受 | 身分或資格判斷，供 RLS 或其他 RPC 使用；不改 INVOKER。 |
| WARN | authenticated 可執行 DEFINER | `trial_invite_subject_recent_trial_open_for_student`（authenticated） | 接受 | 身分或資格判斷，供 RLS 或其他 RPC 使用；不改 INVOKER。 |
| WARN | authenticated 可執行 DEFINER | `trial_invite_submit`（authenticated） | 接受 | 與未登入同一套 token 流程，已登入身份亦須能呼叫。 |
| WARN | authenticated 可執行 DEFINER | `trial_invite_void`（authenticated） | 接受 | 應用 RPC，維持 SECURITY DEFINER；本輪不改 INVOKER、不收執行權。 |
| WARN | authenticated 可執行 DEFINER | `void_payment_command`（authenticated） | 接受 | 函式內檢查 `payments.void`，維持 DEFINER。 |
| WARN | Auth | 洩露密碼保護 | 不適用 | Auth 設定，見 [`auth-leaked-password-protection.md`](./auth-leaked-password-protection.md)。 |
