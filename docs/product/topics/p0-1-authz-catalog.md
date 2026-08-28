# P0-1 capability catalog

| 欄位 | 值 |
| --- | --- |
| 權威 | DB `private.authz_capabilities`／`private.authz_role_capabilities` |
| Migration | [`20260814230815_p0_1_authz_kernel.sql`](../../supabase/migrations/20260814230815_p0_1_authz_kernel.sql) |
| 產品矩陣 | [`p0-1-authorization-decisions.md`](./p0-1-authorization-decisions.md) |
| 功能 × 角色 | [`p0-1-authz-feature-roles.md`](./p0-1-authz-feature-roles.md)（功能主欄；本檔維持 key 列） |
| Client | `src/lib/authzProfile.ts`（`can()`；唔好寫 `hasCapability(role, key)`） |

P0-2 只消費 profile 回傳的 lists。未知 key fail closed。

## Check mode

| mode | predicate | 而家邊啲 key |
| --- | --- | --- |
| `active` | `private.has_capability`／`activeCapabilities` | 除以下以外全部 |
| `account` | `private.has_account_capability`／`accountCapabilities` | `payments.void.approve` |

## 角色映射（wave 1 seed）

`alien` ⊇ `manager` ⊇ `admin`。`finance`／`teacher` 喺鏈外。

| key | admin | manager | finance | teacher | alien |
| --- | --- | --- | --- | --- | --- |
| `students.read` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `students.create`／`update`／`enroll` | ✓ | ✓ | — | — | ✓ |
| `portal.invite` | ✓ | ✓ | — | — | ✓ |
| `classes.read` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `classes.create`／`update` | ✓ | ✓ | — | — | ✓ |
| `schedule.read` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `schedule.create`／`reschedule`／`cancel`／`substitute` | ✓ | ✓ | — | — | ✓ |
| `schedule.update_status` | ✓ | ✓ | — | — | ✓ |
| `attendance.read` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `attendance.take`／`correct`／`delete` | ✓ | ✓ | — | take | ✓ |
| `leaves.read` | ✓ | ✓ | — | ✓ | ✓ |
| `leaves.manage` | ✓ | ✓ | — | — | ✓ |
| `payments.read` | ✓ | ✓ | ✓ | — | ✓ |
| `payments.create`／`mark_received`／`void` | ✓ | ✓ | — | — | ✓ |
| `payments.void.approve`（account） | — | ✓ | — | — | ✓ |
| `entitlements.read` | ✓ | ✓ | ✓ | — | ✓ |
| `entitlements.correct` | — | — | — | — | ✓ |
| `calendar.manage`／`teacher_availability.manage` | ✓ | ✓ | — | — | ✓ |
| `inbox.read` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `payroll.read` | ✓ | ✓ | ✓ | — | ✓ |
| `payroll.prepare`／`review`／`exclude`／`adjust.request`／`hours`／`submit` | — | — | ✓ | — | — |
| `payroll.return`／`verify`／`settle` | — | ✓ | — | — | ✓ |
| `payroll.reopen` | — | — | — | — | ✓ |
| `expenses.read` | — | ✓ | ✓ | — | ✓ |
| `expenses.record` | ✓ | ✓ | ✓ | — | ✓ |
| `expenses.confirm`／`void`／`reopen` | — | ✓ | — | — | ✓ |
| `system_notice.publish`／`users.manage`／`roles.grant`／`catalog.manage` | — | — | — | — | ✓ |
| `audit.read_all` | — | ✓ | — | — | ✓ |
| `audit.read_own` | ✓ | — | ✓ | — | — |

Teacher 嘅寫入仍受現有 row-scope RLS 限制。老師排程只可改 `teaching_notes`（2026-08-15 產品覆寫；唔跟舊 catalog `schedule.update_status`）。老師點名＝出席 INSERT／UPDATE，唔包括 DELETE。老師可改權益池 `remaining_lessons`（點名消耗）；G2 調動表只 `entitlements.correct`。

作廢唔准 Data API 直改 `status='作廢'`；走 `public.void_payment_command`。開單 >30 分查帳戶 `payments.void.approve`（同一人可以）。計糧費率寫入暫 `catalog.manage`（無獨立 key／無費率 UI）。

Domain 1（系統通知／用戶／角色）已改用 `has_capability`：`20260815102532_p0_1_system_users_roles.sql`（staging＋production 2026-08-19）。  
Domain 2（學生／班別／報讀／Portal 邀請）同樣：`20260815104533_p0_1_students_classes.sql`。老師／家長 SELECT 範圍不變。  
Domain 3（排程／出席／請假）：`20260815225314_p0_1_schedule_attendance_leave.sql`。  
Domain 4–5（付款／作廢 command／堂數池）：`20260815230456_p0_1_payments_entitlements.sql`。  
Domain 6–7（計糧／成本帳）：`20260815230459_p0_1_payroll_expenses.sql`。財務可入帳，不可 confirm／void／reopen。  
**2026-08-29**：行政加 `expenses.record`（`authz_version` 12）；科目 `visibility=front_desk` 日記帳可讀寫；`expenses.read` 仍無 → 睇唔到人工／租金／成本分析。  
延後表／校曆／檔期／課程主檔／老師目錄：`20260816000753_p0_1_remaining_ops.sql`。`review_portal_enrollment_request` 改查 `students.enroll`；核准仍只建報讀、唔自動開待繳費單。  
Session 角色（JWT 有 `session_id` 先唔 fallback `app_users.role`）：`20260816000756_p0_1_session_role.sql`。  
波 5 其餘表：`20260816084500_p0_1_wave5_cleanup.sql`。話術庫暫跟 `calendar.manage`；明日提醒寫入 `students.update`；已廢待辦寫入 `catalog.manage`；舊匯入寫入 `students.enroll`。  
**2026-08-20 closeout**（`authz_version` 11）：inbox 職員 SELECT／已讀改 `inbox.read`（已讀只自己 `actor_key`）；ops INSERT 跟營運寫入 capability；portal view-as 改 `portal.invite`；`student_code_counters` 補 `students.create` 政策；登出／`auth.sessions` DELETE 清 `mgmt_session_roles`。  
稽核 actor 蓋印：`20260816090000_p0_1_stamp_actor.sql`。JWT 有 user 就蓋 `actor_label`／`role`／收件匣 `actor_key`；service_role 保留原值。  
**以上收緊 RLS 已於 2026-08-19 套 production**（當時 `authz_version = 10`）；closeout 見上（11）。前端 actor 自行寫入仍作 stamp_actor 未蓋到時嘅後備；收件匣 RPC 無 key 時職員 fallback `staff:{role}:{name}`。老師目錄寫入暫跟 `classes.update`（catalog 無獨立 teachers key）。

## Profile v2

`get_my_mgmt_profile_v2()`／`switch_my_mgmt_role_v2(p_role)` 回：

`app_user_id`、`email`、`display_name`、`active_role`、`available_roles`、`teacher_id`、`active_capabilities`、`account_capabilities`、`authz_version`

Wave 1：`switch_v2` 雙寫舊 `mgmt_active_roles`。`current_app_role()`：JWT **有** `session_id` 跟 `private.mgmt_session_roles`（未有列用 `default_mgmt_role` seed，唔持續 fallback `app_users.role`）；**無** `session_id` 的合成／舊測試 JWT 先走 legacy 路。Supabase Auth access token 原生必帶 `session_id`；2026-08-19 production 11／11 session role 列已核實對應 `auth.sessions`。
