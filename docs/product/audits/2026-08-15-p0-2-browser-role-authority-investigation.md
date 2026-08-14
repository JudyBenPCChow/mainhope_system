# P0-2：瀏覽器角色狀態作權限守衛調查

> 調查日期：2026-08-15  
> 目的：交予 P0-1（RLS 讀寫權限過闊）負責 agent，協調前端身份狀態與資料庫授權邊界  
> 範圍：`localStorage.mgmt_role`／`teacher_id`、`AuthProvider`、頁面與操作守衛、與 P0-1 的交界  
> 不含：本文件不直接修改 RLS、不定稿各角色最終操作矩陣、不實作修正  
> 結論：**P0-2 單獨主要是前端完整性／一致性問題；與 P0-1 組合後才構成 P0 級越權風險。**

---

## 1. 問題定性

瀏覽器完全由使用者控制；`localStorage`、React state、隱藏按鈕及頁面 redirect 均不可作安全邊界。

目前系統同時存在兩套角色來源：

1. **資料庫權威角色**：`mgmt_active_roles.active_role`，由 `current_app_role()`／RLS／RPC 使用。
2. **瀏覽器角色副本**：`localStorage.mgmt_role`，由多個頁面、component、service helper 使用。

單純把 `localStorage.mgmt_role` 改成 `alien`：

- 可以改變頁面、按鈕及部分 service 前置檢查；
- 不應該自行突破正確的 RLS；
- 但目前 P0-1 已確認部分敏感表使用過闊的 `is_mgmt_staff()` 寫入 policy，因此偽造前端角色可以引導 UI 執行 DB 本身亦容許的敏感寫入。

所以：

- **P0-2 不能取代 P0-1 修正**；
- 只改 React Context、不改 DB 授權，並非安全修復；
- P0-1 必須先把真正授權放回 RLS／窄 RPC／Edge Function；
- P0-2 再令 UI 使用同一個 server profile 投影，消除錯誤入口、殘留角色及前後端不一致。

---

## 2. 已驗證證據

### 2.1 AuthProvider 已有 server profile，但仍 fallback 到 localStorage

`src/lib/authBootstrap.tsx`：

```ts
const role = profile?.role ?? getMgmtRole()
```

`profile` 由 `get_my_mgmt_profile()` 取得，已包含：

- `role`
- `availableRoles`
- `teacherId`
- `displayName`
- `email`

因此 localStorage fallback 並非維持現有功能所必需；它主要帶來失敗時沿用舊角色的風險。

### 2.2 登入 profile 被複製到 localStorage

`src/lib/authSession.ts` 的 `applyProfileToStorage()` 寫入：

- `mgmt_role`
- `mgmt_email`
- `mgmt_display_name`
- `teacher_id`

Supabase session 本身已持久化；重新載入時可重新呼叫 `get_my_mgmt_profile()`，不需要以這些鍵恢復授權狀態。

### 2.3 頁面守衛直接信任 localStorage

`src/components/auth/RequireMgmtRoles.tsx`：

```ts
const role = getMgmtRole()
if (role && roles.includes(role)) return <>{children}</>
```

以下頁面亦直接讀取 `localStorage.mgmt_role`：

- `src/pages/AiReports.tsx`
- `src/pages/ReferralRebates.tsx`
- `src/pages/ApoPo.tsx`
- `src/pages/SystemIssues.tsx`
- `src/pages/SystemLogs.tsx`

這些守衛只能控制 UI，不可被視為資料授權。

### 2.4 Component 及 service 廣泛依賴瀏覽器角色

已找到的主要類別：

- 頁面／導向：`Home.tsx`、`Students.tsx`、`AllFeaturesView.tsx`
- Component 可見／可按：收款、學生、老師、班別、點名、房間預約等
- Service 前置檢查：
  - `src/services/inboxEventWrite.ts`
  - `src/services/queries.ts`
  - `src/services/attendanceLifecycleQueries.ts`
  - `src/services/teacherQueries.ts`
  - `src/services/mgmtGodViewQueries.ts`
  - `src/services/inboxQueries.ts`

例：`publishSystemNotice()` 先檢查 `getMgmtRole() === "alien"`，之後直接對 `inbox_events` insert。  
例：`deleteAttendanceDetailAsMgmt()` 明確註明其檢查是「過渡權限＝mgmtRole，非 Auth」。

這些檢查可保留作 UX，但不可負責最終允許／拒絕。

### 2.5 teacher scope 亦由 localStorage 決定

`src/lib/teacherScope.ts`：

```ts
if (getMgmtRole() !== "teacher") return null
const id = localStorage.getItem("teacher_id")
```

前端 teacher scope 應改用 server profile 的 `teacherId`。  
資料庫仍必須以 `current_teacher_id()`／JWT 對應用戶判斷，不可信任前端傳入或保存的 teacher ID。

### 2.6 現有產品文件已承認 RLS 讀寫未拆

`docs/product/topics/mgmt-manager-role.md` 已寫明：

- `manager ≥ admin` 是讀取原則；
- 敏感／破壞性寫入仍應窄過 admin；
- 第一期多數表仍 `FOR ALL`；
- RLS reader／writer 分拆屬第二期已知債。

因此 P0-1 並非新增產品方向，而是完成已記錄但未落地的安全邊界。

---

## 3. 第一性原則下的目標架構

### 3.1 信任邊界

| 層 | 職責 | 是否可信 |
| --- | --- | --- |
| Supabase Auth session | 證明登入者身份 | 是 |
| DB active role／角色授予 | 目前角色與可切換角色 | 是 |
| RLS／RPC／Edge Function | 最終允許或拒絕資料操作 | 是 |
| AuthContext profile | server profile 的 UI 投影 | 否，只供 UX |
| 頁面／按鈕守衛 | 隱藏無權入口、顯示正確體感 | 否 |
| localStorage | 純 UI 偏好，例如側欄收合 | 否 |

核心原則：

1. 瀏覽器不可信。
2. 每次跨越資料／命令邊界時，由 DB 或受控 server function 授權。
3. 角色是人員分類；實際 policy 應按「角色 × 動作 × 資源」判斷。
4. UI 可以預判結果，但不可成為唯一守衛。

### 3.2 不建議的替代方案

#### 只把 localStorage 換成 React Context

不是安全修復。React state 同樣存在瀏覽器內，只改善一致性及可維護性。

#### 把 active role 全部放入 JWT custom claim

不適合目前需要即時切換 active role 的模型。JWT claim 會在 token refresh 前保持舊值，增加 stale-role 視窗及刷新流程。現有 DB-backed `current_app_role()` 可即時生效。

#### 所有 CRUD 都包 Edge Function／RPC

過度工程。一般單表讀寫適合 RLS；高風險、多表、需 audit／transaction 的命令才使用窄 RPC／Edge Function。

---

## 4. 建議共同方案

### 階段 A：先由 P0-1 定義並落地 DB 權限矩陣

先以「操作」列矩陣，而非只列頁面：

- `student.read`／`student.update`／`student.delete`
- `schedule.read`／`schedule.update`／`schedule.cancel`
- `attendance.read`／`attendance.take`／`attendance.delete`
- `payment.read`／`payment.create`／`payment.void`
- `system_notice.publish`
- `user.manage`
- 其他敏感業務操作

原因：`is_mgmt_staff()` 只適合作一般職員分類，不能同時代表所有讀寫能力。

P0-1 建議：

1. 分拆 reader／writer policy。
2. 普通單表操作由 RLS 按角色及 action 控制。
3. 高風險、多表及需 audit 操作改用窄 RPC／Edge Function。
4. RPC 內部讀 `current_app_role()`；不接受 caller 傳 `role`、`isAdmin` 等授權參數。
5. 對已改成 RPC 的高風險操作，按需要撤銷直接 table mutation 權限。

### 階段 B：P0-2 將 AuthProvider 變成 UI 唯一角色來源

1. `AuthProvider` 改為 `role = profile?.role ?? null`。
2. Profile 讀取失敗時 fail closed，不 fallback 舊角色。
3. Component 使用 `useAuth()` 取得 role、teacherId、displayName、email。
4. `RequireMgmtRoles` 改用 AuthContext；可進一步升級為 `RequireCapability`。
5. `mgmtRole.ts` 改為純函數，不再自行讀 browser state。

原因：消除 localStorage 偽造、舊角色殘留及 DB／UI active role 不一致。

### 階段 C：把 UI role helpers 改成 capability helpers

建議使用明確 capability：

```ts
hasCapability(role, "payment.void")
hasCapability(role, "attendance.delete")
```

用途：

- 頁面入口
- 按鈕顯示
- 唯讀／可編體感
- 前置 UX 提示

限制：這些 helper 不取代 RLS／RPC。

### 階段 D：移除身份 localStorage

停止寫入及讀取：

- `mgmt_role`
- `teacher_id`
- `mgmt_email`
- `mgmt_display_name`

保留無安全語意的 UI 偏好，例如 `mgmt_sidebar_collapsed`。

### 階段 E：令角色切換一致

建議 `switch_my_mgmt_role` 在同一 RPC：

1. 驗證角色已授予該用戶。
2. 更新 active role。
3. 直接回傳更新後 profile。

前端收到後：

1. 更新 AuthContext。
2. 清除／重新載入舊角色資料 cache。
3. 以 `BroadcastChannel` 通知其他分頁重新抓 profile。
4. 視窗 focus 時再次覆核 profile。

`BroadcastChannel` 只作 invalidation 通知，不傳可信角色。

---

## 5. P0-1 與 P0-2 的責任邊界

### P0-1 agent 負責

- 最終角色／操作矩陣的 DB 表達。
- RLS reader／writer 拆分。
- 高風險 RPC／Edge Function。
- direct API／JWT allow-deny 測試。
- 確保即使 UI 全部被繞過，資料操作仍正確拒絕。

### P0-2 agent 負責

- AuthContext 唯一 UI profile。
- 移除 localStorage 身份 authority。
- 頁面／按鈕／導向改用 context + capability。
- teacher scope 改用 `profile.teacherId`。
- 角色切換後 cache／多分頁一致。
- 確保 UI 不提供 DB 最終會拒絕的入口。

### 必須共同決定

- capability 名稱及語意。
- manager 可否修改排程、點名、學生資料。
- finance 除繳費／計糧核對外，精確可讀資料範圍。
- 哪些操作屬普通 RLS CRUD，哪些必須用 command RPC。
- rollout 期間舊 service 前置 guard 何時移除。

---

## 6. 建議 rollout 次序

1. 簽收角色 × 操作 × 資源矩陣。
2. P0-1 先收緊 RLS／加入敏感 RPC。
3. 用各角色真實 JWT 直接呼叫 Data API／RPC，驗證 allow-deny。
4. P0-2 改 AuthProvider 及頁面守衛。
5. 遷移 component／service callsite。
6. 移除 localStorage 身份鍵及 fallback。
7. 加 CI：build、lint、unit test、角色 RLS regression。
8. 移除過渡 helper 及過時文件。

DB 必須先行。若先改 UI，過渡期間仍可繞過前端直接呼叫過闊 API。

---

## 7. 必要驗收

### DB／P0-1

- Finance JWT 直接 UPDATE schedule／student／attendance，非授權操作被拒。
- Manager 可讀監督資料，但不可做未授權寫入。
- Teacher 不可傳入他人 `teacher_id` 取得資料。
- 非 alien 直接呼叫發系統通知／管理用戶命令被拒。
- 作廢收款、刪除點名等敏感命令有 DB 授權及 audit。

### UI／P0-2

- 手動設定 `localStorage.mgmt_role = "alien"` 不改變 UI 身份。
- 手動設定 `teacher_id` 不改變 teacher scope。
- Profile 載入失敗時不顯示舊角色頁面。
- Deep link 守衛與側欄 capability 一致。
- 切換角色後舊角色資料 cache 被清除。
- 其他分頁能重新抓取 active role。

### 聯合驗收

- UI 顯示允許但 DB 拒絕的 mismatch 為 0。
- UI 隱藏但 DB 本應允許的必要操作有明確產品決定。
- 所有敏感操作即使從 browser console／REST 直接呼叫，結果仍符合矩陣。

---

## 8. 最終判斷

最合理方案不是「把 localStorage 搬去 Context」，而是：

- Supabase session 負責認證；
- DB active role 負責目前角色；
- RLS 負責普通資料授權；
- 窄 RPC／Edge Function 負責敏感命令；
- AuthContext 只負責 UI 投影；
- capability matrix 作各層共同規格。

這個方案符合目前 Vite + Supabase 及 active-role 即時切換模型，沒有額外建立完整 backend，也沒有錯把 JWT／React state 當成唯一授權來源。主要成本是 RLS policy 增加及遷移期間的權限回歸風險；應以矩陣測試、DB-first rollout 及直接 API 驗收控制。
