# mgmt-manager-role 計劃顧問審查報告

> 審查日期：2026-08-01  
> 審查對象：[`docs/product/plans/2026-08-01-mgmt-manager-role.md`](../plans/2026-08-01-mgmt-manager-role.md)  
> 審查方式：對照計劃文檔與實際原始碼（`src/lib/mgmtRole.ts`、`navStructure.ts`、`mobileNav.ts`、各 page guard、SQL migration、edge function 等），逐項驗證改動清單的完整性與正確性  
> 審查結論：**有條件通過** — 方向與架構正確，覆蓋面足夠，但需修正 3 個紅色問題後方可開工

---

## 整體評價

計劃的架構設計是合理的：新增 `manager` 角色，以現有 `MgmtDashboardView`（營運總覽）為其首頁，透過側欄矩陣控制可見項目。scope 控制清晰（第一期不做什麼寫得很明確），RLS 風險有自覺記錄，與 `role-ops-hardening` 的邊界也正確分開。主要問題集中在具體實作細節：PostgreSQL 語法、helper function 的必要性、以及少數邊界行為的明確度。

---

## 🔴 必須修正（3 項）

### 1. PostgreSQL 不支援直接 ALTER CHECK constraint

**計劃位置**：§2.5 DB migration

**問題**：計劃寫「`app_users.role`／`app_user_roles.role`／`mgmt_active_roles.active_role` check 加 `'manager'`」，但 PostgreSQL 不能直接 `ALTER TABLE ... ALTER CONSTRAINT` 來改 CHECK 內容。

**當前 migration 中的 constraint 定義**（`20260721161817_mark_yu_dual_mgmt_roles.sql`）：

```sql
-- line 21
role text not null check (role in ('admin', 'teacher', 'alien'))

-- line 33
active_role text not null check (active_role in ('admin', 'teacher', 'alien'))
```

**必須改用 DROP + ADD**：

```sql
-- app_user_roles.role
alter table public.app_user_roles
  drop constraint if exists app_user_roles_role_check;

alter table public.app_user_roles
  add constraint app_user_roles_role_check
  check (role in ('admin', 'teacher', 'alien', 'manager'));

-- mgmt_active_roles.active_role
alter table public.mgmt_active_roles
  drop constraint if exists mgmt_active_roles_active_role_check;

alter table public.mgmt_active_roles
  add constraint mgmt_active_roles_active_role_check
  check (active_role in ('admin', 'teacher', 'alien', 'manager'));
```

⚠️ 注意：constraint 名稱需對照實際 migration 檔確認，上述名稱是推測。如果名稱不對會報錯，建議先在 local 跑一次確認。

**同時檢查 `app_users.role` 欄位**：如果該欄位也有 CHECK constraint（可能定義在更早的 migration），需一併處理。

---

### 2. `isAdminOrAlien` 必須做，不是「可加」

**計劃位置**：T1「可加 `isManager`／`isAdminOrAlien`」

**問題**：T3 已明確指出破壞性操作（刪點名等）必須維持 `admin || alien`。但 T1 同時會把 `isMgmtStaff()` 改成包含 manager。如果沒有 `isAdminOrAlien` 這個 helper，未來開發者必然誤用 `isMgmtStaff()` 來保護破壞性操作，manager 將意外獲得刪除權限。

**當前 `isMgmtStaff()` 定義**（`src/lib/mgmtRole.ts:49`）：

```ts
// 目前
export function isMgmtStaff(): boolean {
  const r = getMgmtRole()
  return r === "admin" || r === "alien"
}

// 計劃改為
export function isMgmtStaff(): boolean {
  const r = getMgmtRole()
  return r === "admin" || r === "manager" || r === "alien"
}
```

**建議**：將 `isAdminOrAlien` 從「可加」改為**必須新增**，並在 T3 明確列出需要用 `isAdminOrAlien()` 的頁面：

```ts
/** 破壞性操作守衛：僅 admin 與 alien（不含 manager） */
export function isAdminOrAlien(): boolean {
  const r = getMgmtRole()
  return r === "admin" || r === "alien"
}
```

受影響頁面（需用 `isAdminOrAlien` 而非 `isMgmtStaff`）：
- `src/pages/Payments.tsx` — 收款登記
- `src/pages/TrialSessions.tsx` — 試堂（含前台相關操作）
- `src/pages/FrontDeskWizard.tsx` — 前台精靈
- `src/pages/TeacherLeaveWizard.tsx` — 請假處理精靈
- `src/pages/UserManagement.tsx` — 用戶管理
- 各頁內的刪除／作廢等破壞性按鈕

---

### 3. MgmtDashboard 守衛不可依賴 `isMgmtStaff()`

**計劃位置**：H2「守衛改 `manager`＋**暫留 alien**；admin 深連結應被擋」

**問題**：計劃要求 admin **不能** deep link 進入 MgmtDashboard。但如果 MgmtDashboard 守衛用了更新後的 `isMgmtStaff()`（含 admin + manager + alien），admin 仍然可以進入。計劃意識到這點但沒有給出具體實作方式。

**當前狀況**：`src/pages/MgmtDashboard.tsx` 使用 `isMgmtStaff()` 作守衛。

**建議寫法**：MgmtDashboard 守衛**不可**用 `isMgmtStaff()`，必須 explicit：

```tsx
// MgmtDashboard.tsx
const role = getMgmtRole()
if (role !== "manager" && role !== "alien") {
  return <Navigate to="/Home" replace />
}
```

或在 `mgmtRole.ts` 新增專用 helper：

```ts
/** 可否查看營運總覽：manager + alien（刻意排除 admin） */
export function canAccessMgmtDashboard(): boolean {
  const r = getMgmtRole()
  return r === "manager" || r === "alien"
}
```

---

## 🟡 建議補強（5 項）

### 4. `Role` 與 `MgmtRole` 是兩個獨立的 type

**實際程式碼中有兩個 role union type：**

| 檔案 | Type 名稱 | 定義 |
|---|---|---|
| `src/lib/mgmtRole.ts:6` | `MgmtRole` | `"admin" \| "teacher" \| "alien"` |
| `src/lib/navStructure.ts:40` | `Role` | `"admin" \| "teacher" \| "alien"` |

兩者**必須同步**更新為包含 `"manager"`。計劃沒有明確指出這點，建議在 T1 加一條提醒：

> ⚠️ `MgmtRole`（mgmtRole.ts）與 `Role`（navStructure.ts）是兩個獨立的 union type，兩者都要加 `"manager"`。

---

### 5. 用戶管理頁面的角色排序

`src/components/users/UserManagementView.tsx:171-177` 硬編碼排序：

```ts
const order = (r: string) => {
  const x = r.toLowerCase()
  if (x === "alien") return 0
  if (x === "admin") return 1
  if (x === "teacher") return 2
  return 9   // 未知角色排最後
}
```

新增 `manager` 後它會落入 `return 9`（排最後）。建議決定排序位置並明確加入，例如 `manager` 排 `2`、teacher 退到 `3`。

同檔的 `ROLE_OPTIONS`（line 87）與 `roleMeta()`（line 60）也要補上 manager。

---

### 6. Inbox 預設 audience 與 void-payment edge function

**目前狀況**：

| 位置 | 預設 audience |
|---|---|
| `InboxView.tsx:97` — 新建通知預設 | `["admin", "alien"]` |
| `supabase/functions/void-payment/index.ts:405` — 作廢付款通知 | `["admin", "alien"]` |

計劃 I1/I3 說「加 manager」，但**未明確是否加入預設值**。

**建議區分兩種情況**：

- **作廢付款等系統通知**：應預設推送給 manager（manager 需要看到金流異常），所以預設與 edge function 都要加 `"manager"`
- **Inbox 手動建立通知的 UI 預設**：可由營運自行決定，建議預設也加 manager 讓管理層預設收到通知，但 UI 下拉可取消勾選

---

### 7. SQL 函數中 `not in ('admin', 'alien', 'teacher')` 的處理

有兩個 migration 檔案用了 `current_app_role() not in ('admin', 'alien', 'teacher')` 來判斷「非職員」：

| Migration 檔案 | 用途 |
|---|---|
| `20260722110000_fix_enrollment_dates_and_schedule_rls_perf.sql:178` | 排程相關 RLS |
| `20260721172118_teacher_schedule_roster_context.sql:18` | roster RPC |

加上 manager 後，這些 `in` 列表需同步加上 `'manager'`。計劃 §2.5 寫「評估 `current_app_role() in ('admin','teacher','alien')` 且應含職員的 RPC（如 roster）」，用詞是「評估」，但這是**必須做**的，否則 manager 會被當成非職員而觸發不正確的邏輯分支。

**建議**：把「評估」改成「確認並修改以下 RPC」，並 grep 所有 `current_app_role()` 出現處一併檢查（不限於上述兩檔，因為未來可能有新的 migration 也用了這個 pattern）。

---

### 8. 缺少 migration rollback 指引

新 migration 涉及 DROP constraint + re-ADD。如果 deploy 後發現問題需要回滾，直接 revert migration 會遺失 constraint。建議在 migration 文件或計劃中附一段 rollback SQL：

```sql
-- rollback
alter table public.app_user_roles
  drop constraint if exists app_user_roles_role_check;
alter table public.app_user_roles
  add constraint app_user_roles_role_check
  check (role in ('admin', 'teacher', 'alien'));

alter table public.mgmt_active_roles
  drop constraint if exists mgmt_active_roles_active_role_check;
alter table public.mgmt_active_roles
  add constraint mgmt_active_roles_active_role_check
  check (active_role in ('admin', 'teacher', 'alien'));

-- is_mgmt_staff() 改回原樣
create or replace function public.is_mgmt_staff()
returns boolean language sql stable security invoker set search_path = public
as $$
  select coalesce(public.current_app_role(), '') in ('admin', 'alien');
$$;
```

---

## 🟢 做得好的地方（6 點）

1. **Scope 控制清晰**：第一期明確不做什麼（出糧引擎、全新 dashboard、WhatsApp 推送、成績知識點、招生 CRM、alien/teacher 矩陣），避免 scope creep
2. **RLS 風險有記錄**：§5 明確指出「前端隱藏 ≠ RLS」，第一期 manager 視同 `is_mgmt_staff` 可寫，第二期再收緊收款／前台寫入。知道自己做的是 UI 層隔離而非真正的權限控制
3. **Tradeoff 透明**：admin 失去營運總覽側欄是刻意的，§5 記錄了這個決定及後續調整路徑
4. **與 `role-ops-hardening` 邊界清楚**：兩個 backlog 互相引用但不混做，`role-ops-hardening.md` 明確寫「不含 manager 角色」
5. **Migration 使用單檔 apply**：`npm run db:apply -- <檔>` 而非 `db push`，避免全量 migration 意外執行
6. **雙角色切換沿用現有機制**：不重複造輪子，直接複用 `app_user_roles`／`switch_my_mgmt_role`

---

## 📊 改動觸及檔案完整清單（對照驗證結果）

以下清單是從實際原始碼驗證得出，比計劃 §2 中的清單更完整。建議用作最終開工 checklist。

### Type / Helper（計劃 T1）

| # | 檔案 | 改動 |
|---|---|---|
| T1.1 | `src/lib/mgmtRole.ts` | `MgmtRole` union 加 `"manager"`；所有 guard/label 函數補 manager 分支；新增 `isManager()`、`isAdminOrAlien()`；`isMgmtStaff()` 改為 `admin \| manager \| alien` |
| T1.2 | `src/lib/navStructure.ts` | `Role` union 加 `"manager"`（獨立於 MgmtRole！）；按矩陣改各 nav item 的 `roles` 陣列 |
| T1.3 | `src/lib/mobileNav.ts` | `getMobileBottomTabs()` switch 加 manager case；`resolveMobilePageTitle()` 自動跟隨 navStructure 不需改 |
| T1.4 | `src/components/auth/RequireMgmtRoles.tsx` | `ROLE_LABEL` Record 加 `manager: "管理層"` |

### 首頁與營運總覽（計劃 H1-H2）

| # | 檔案 | 改動 |
|---|---|---|
| H1 | `src/pages/Home.tsx` | 加 `if (role === "manager") return <MgmtDashboardView />` |
| H2 | `src/pages/MgmtDashboard.tsx` | 守衛改為 `role === "manager" \|\| role === "alien"`（不可用 `isMgmtStaff()`） |

### 側欄矩陣（計劃 N1-N2，按矩陣逐項）

| # | navStructure 項目 | 原 roles | 新 roles |
|---|---|---|---|
| N1.1 | 營運總覽 | `["admin", "alien"]` | `["manager", "alien"]` |
| N1.2 | 人數報表 | `["admin", "alien"]` | `["manager", "alien"]` |
| N1.3 | 中學出席統計 | `["admin", "alien"]` | `["manager", "alien"]` |
| N1.4 | 優惠折扣 | `["alien"]` | `["admin", "manager", "alien"]` |
| N2 | `src/lib/mobileNav.ts` | — | manager 底欄：首頁／排程／收件匣／所有功能 |

### 頁級守衛（計劃 §2.4）

| # | 檔案 | 改動 |
|---|---|---|
| G1 | `src/pages/PaymentHistory.tsx` | `RequireMgmtRoles` 加 `"manager"` |
| G2 | `src/pages/LeaveManagement.tsx` | `RequireMgmtRoles` 加 `"manager"` |
| G3 | `src/pages/Teachers.tsx` | `RequireMgmtRoles` 加 `"manager"` |
| G4 | `src/pages/Students.tsx` | teacher redirect 不變；manager 可進，不需改（目前無 RequireMgmtRoles） |

### 服務層（計劃 T2）

| # | 檔案 | 改動 |
|---|---|---|
| S1 | `src/services/authRoleQueries.ts` | `normalizeRole()` 驗證加 `"manager"` |
| S2 | `src/services/inboxQueries.ts` | `parseAudienceRoles()` 加 `"manager"` |
| S3 | `src/services/inboxEventWrite.ts` | `normalizeAudienceRoles()` 加 `"manager"` |
| S4 | `src/services/mgmtGodViewQueries.ts` | actor label 補 manager 分支（若需要） |

### UI 組件（計劃 T2 + I1）

| # | 檔案 | 改動 |
|---|---|---|
| U1 | `src/components/inbox/InboxView.tsx` | `AUDIENCE_ROLE_OPTIONS` 加 manager；預設 audience 加 manager；`canPublish` 維持 alien only 不變 |
| U2 | `src/components/users/UserManagementView.tsx` | `ROLE_OPTIONS` 加 `{ value: "manager", label: "管理層" }`；`roleMeta()` 加 manager 分支；`sortedRows` 排序加 manager |
| U3 | `src/pages/Login.tsx` | 不需改（無 manager-specific guard），但需驗證 manager 可正常登入 |

### 收件匣／通知（計劃 I1-I3）

| # | 位置 | 改動 |
|---|---|---|
| I1 | `src/services/inboxQueries.ts` | `parseAudienceRoles()` 加 manager |
| I2 | `src/services/inboxEventWrite.ts` | `normalizeAudienceRoles()` 加 manager；系統通知 audience 加 manager |
| I3 | `supabase/functions/void-payment/index.ts:405` | `audience_roles: ["admin", "manager", "alien"]` |

### DB Migration（計劃 §2.5，1 個新檔）

| # | 操作 |
|---|---|
| DB1 | `app_user_roles.role` CHECK constraint → DROP + ADD 含 manager |
| DB2 | `mgmt_active_roles.active_role` CHECK constraint → DROP + ADD 含 manager |
| DB3 | `app_users.role` CHECK constraint → 確認是否存在，若存在一併處理 |
| DB4 | `is_mgmt_staff()` → REPLACE，`in ('admin','manager','alien')` |
| DB5 | `get_my_mgmt_profile()` 內 `in ('admin','teacher','alien')` → 加 `'manager'` |
| DB6 | 所有 `current_app_role() in/not in ('admin','teacher','alien')` → grep 全部 migration，逐個加 `'manager'` |
| DB7 | 確認 `switch_my_mgmt_role` 不需改（僅依賴 CHECK constraint） |

### Edge Function（計劃 I3）

| # | 檔案 | 改動 |
|---|---|---|
| E1 | `supabase/functions/void-payment/index.ts` | `audience_roles` 加 `"manager"` |

### 文件（計劃 §2.7）

| # | 檔案 | 改動 |
|---|---|---|
| D1 | `docs/meta/TERMINOLOGY.md` | 三角色 → 四角色；加 manager／管理層 |
| D2 | `AGENTS.md`（根目錄） | 鐵則 § 與 checklist § 加 manager |
| D3 | `docs/meta/AGENT_HANDOFF.md` §6 | 加 manager（若有的話） |
| D4 | `docs/product/BACKLOG.md` | 開工時改 status；完成後移已完成 |
| D5 | `docs/product/topics/mgmt-manager-role.md` | 開工時改 status |

---

## 📋 驗收建議補充

計劃原有驗收項目（`npm run build` + `npm run ui:check` + 行為驗證）之外，建議新增：

- [ ] migration 在 local 執行成功，確認 CHECK constraint 變更無誤
- [ ] `switch_my_mgmt_role` 可正常切換到 manager（確認 RPC 與前端 localStorage 都通）
- [ ] manager 嘗試 deep link `/Payments`、`/TrialSessions` 被 `RequireMgmtRoles` 擋下
- [ ] admin 嘗試 deep link `/MgmtDashboard` 被守衛擋下（而非看到營運總覽）
- [ ] 雙角色用戶（admin + manager）可在兩角色間切換，各自首頁／側欄正確
- [ ] manager 收件匣可收到作廢付款等系統通知
- [ ] `isMgmtStaff()` 變更後，所有受影響的 RLS policy 行為正確（至少抽樣測試）

---

## 總結

| 類別 | 數量 | 關鍵項 |
|---|---|---|
| 🔴 必須修正 | 3 | CHECK constraint ALTER 語法、`isAdminOrAlien` 從可加改為必做、MgmtDashboard 守衛 explicit check |
| 🟡 建議補強 | 5 | 雙 type 同步提醒、排序位置、inbox 預設、SQL not-in 邏輯、rollback 指引 |
| 🟢 做得好 | 6 | scope 控制、RLS 記錄、tradeoff 透明、不相關項目隔離、migration 單檔 apply、複用現有機制 |

**結論**：計劃方向與架構正確，覆蓋面足夠全面。修正上述 3 個紅色問題後即可開工。
