# P0-1 授權架構重評審閱

> 審閱日期：2026-08-15  
> 審閱對象：[`p0-1-authorization-redesign.md`](../topics/p0-1-authorization-redesign.md)  
> 對照調查：[`2026-08-15-p0-2-browser-role-authority-investigation.md`](./2026-08-15-p0-2-browser-role-authority-investigation.md)  
> 結論：**架構方向通過，但目前仍是草案，不可直接收緊 production RLS。**

P0-1 報告大致回應到 P0-2 提出的架構問題，而且「Capability-backed RLS＋選擇性 transactional command」比簡單 reader／writer 拆分更準確。

未完成部分主要是：

- 產品權限矩陣仍有 13 項待拍板；
- 角色切換、多分頁及 cache 一致性未完整設計；
- shadow audit 可行性未說清楚；
- 遷移波次存在先收緊 RLS、後補 command 的次序風險。

---

## 1. 可以回應的問題

### 1.1 DB 才是最終授權邊界：可以

報告明確採用：

- `private.has_capability()`；
- capability-backed RLS；
- 高風險、多表操作使用 transactional command；
- 不接受前端傳入 role 作最終授權。

這回應了 P0-2 的核心要求：瀏覽器只負責 UX，不能決定資料操作是否允許。

### 1.2 不可以只拆 reader／writer：可以，而且修正合理

報告指出：

- Manager、finance 均有部分合法寫入；
- 同一張表內不同操作需要不同能力；
- 多表流程只拆 RLS 會有半成功風險。

因此，原先簡化的 reader／writer 二分不足。以業務操作 capability 表達權限較準確。

### 1.3 Active role 保持 DB 即時生效：可以

報告保留：

- `app_user_roles` 作已獲授角色集合；
- `mgmt_active_roles` 作目前工作身份；
- DB-backed `current_app_role()`；
- active role 切換後即時降權。

報告亦正確拒絕以 JWT custom claim 作唯一真源，避免角色切換後等候 token refresh。

### 1.4 UI 與 DB 共用能力來源：可以

報告建議 `get_my_mgmt_profile` v2 回傳：

- app user ID；
- active role；
- available roles；
- teacher ID；
- capabilities；
- authz version。

P0-2 只消費 profile capabilities，不另建一套 role→permission mapping。這可避免前端與 DB 各自維護一份矩陣。

### 1.5 Teacher row scope：可以

報告明確保留老師：

- 自己班別；
- 自己／獲授權排程；
- 自己學生；
- 點名及窄排程操作。

Teacher 不會被併入一般職員全表 capability。

### 1.6 多表半成功問題：可以

報告建議把以下高風險流程逐步 command 化：

- 收款建立、標記已收、作廢；
- 報讀／退讀與權益同步；
- 權益更正／搬堂；
- 出席刪除／更正；
- payroll submit／return／settle／reopen；
- 成本 confirm／void；
- 系統通知；
- 用戶及角色管理。

每個 command 包括：

- DB 推導 actor／active role；
- capability 及 row scope 驗證；
- 同一 transaction；
- server-side audit；
- idempotency key；
- 必要時 second approver。

### 1.7 Server-side audit：方向可以

報告正確指出現有 `mgmt_audit_log` 不完整：

- actor／role label 部分由 localStorage 產生；
- payroll 未完整覆蓋；
- authenticated 可直接 insert 部分 audit／error 表。

目標 audit 由 DB 推導 actor、active role、capability、operation、entity、request ID 及 server time，方向正確。

### 1.8 避免 55 表 big-bang：可以

報告建議：

- 先建立 capability kernel；
- 再逐 domain 收緊；
- 每域獨立 migration、驗收及回滾；
- 禁止一次修改全部 55 張表。

這比一次性全面改寫風險低。

---

## 2. 只能部分回應／尚未解決

### 2.1 角色矩陣仍未定

報告列出 13 項實作前必須拍板事項，包括：

- Manager 可否新增學生；
- Manager 可否點名；
- Manager 班別及排程權限粒度；
- Manager 權益更正；
- Finance 學費單及 Portal 邀請；
- Payroll 各狀態操作由哪個角色負責；
- 作廢付款第二確認；
- Alien break-glass；
- Audit 保留及 PII 範圍。

在這些問題未拍板前：

- 可以設計 capability kernel；
- 可以凍結 profile contract；
- 不可以安全 seed 最終 role-capability mapping；
- 不可以收緊 production RLS。

### 2.2 「現有程式會做」不等於「產品應允許」

報告列出 manager 現碼可執行：

- 新增學生；
- 修改班別；
- 排程／代堂／取消；
- 點名；
- 請假；
- 權益更正；
- 計糧；
- 成本帳等。

但現有產品文件同時寫明：

- Manager 入口體感以監督為主；
- 可編範圍有限；
- 收款、點名刪改等敏感主控仍限 admin／alien。

因此必須將證據分成三類：

1. 已有政策／產品簽收；
2. 現碼可操作但未簽收；
3. Production 有資料狀態，但 actor／角色不能證實。

不可因現碼存在 accidental access，就倒推成合法產品需求。

### 2.3 角色切換一致性未完整

報告只寫「切換後刷新 profile」，尚未定義：

- `switch_my_mgmt_role` 是否在同一 RPC 直接回傳 profile v2；
- 舊角色 query cache 如何清除；
- 多分頁如何同步；
- 視窗 focus 時是否覆核 active role；
- role／capability mapping 更新後，已開啟 client 如何察覺。

建議：

1. Role switch RPC 驗證授權並更新 active role。
2. 同一 RPC 直接回傳新 profile。
3. AuthContext 原子更新。
4. 清除舊角色資料 cache。
5. 用 `BroadcastChannel` 通知其他分頁重新抓 profile。
6. 視窗重新 focus 時覆核 profile。

`BroadcastChannel` 只作 invalidation，不傳可信角色。

### 2.4 localStorage 清理未完整列明

報告寫明 localStorage 不可作授權及應移除 fallback，但未完整列出：

- `mgmt_role`
- `teacher_id`
- `mgmt_email`
- `mgmt_display_name`

建議全部身份鍵停止讀寫。Supabase session 已負責持久化，profile 可重新載入。

只保留沒有安全語意的 UI 偏好，例如：

- `mgmt_sidebar_collapsed`

### 2.5 `authz_version` 未定義語意

若 profile v2 包含 `authz_version`，必須定義：

- 何時增加版本；
- 是全域、角色、用戶還是 profile 版本；
- client 何時比較；
- mapping／角色授予更新後如何通知 client；
- 版本不一致時清除哪些 cache。

否則這個欄位只會成為沒有作用的 metadata。

### 2.6 Shadow audit 實作方式不清

報告提出：

> 記錄每次寫入所需 capability、active role 及新模型會否允許，但暫不阻擋。

概念合理，但尚未解釋 direct PostgREST DML 如何統一知道「此寫入需要哪個 capability」。

若為 55 張表新增臨時 trigger：

- 實作成本高；
- 會增加 production 寫入噪音；
- 仍無法 shadow SELECT；
- 日後需要清理大量臨時物件。

建議：

1. 先用 staging／Supabase branch 做角色矩陣 integration test。
2. 以 production 唯讀資料跑 allow-deny 模擬。
3. 只對高風險 domain 加短期 shadow trigger。
4. 明確定義保留期限、採樣及移除條件。

### 2.7 Staging 前提目前未滿足

報告要求：

- 使用 staging 或 Supabase branch；
- 不可直接在 production 試錯。

但現有 `mainhope-staging` 狀態為 INACTIVE。開工前必須決定：

- 恢復 staging；或
- 建立 Supabase branch。

否則波 0 的安全前提未成立。

---

## 3. 對方案的具體意見

### 3.1 目標架構建議採用

同意採用：

- DB-backed capability RBAC；
- active role 即時切換；
- capability-backed RLS；
- 高風險 transactional command；
- profile v2 供 UI 投影；
- 普通低風險 CRUD 保留 direct table＋RLS；
- 不採全面 command layer；
- 不採全面動態 ABAC。

這個方案把以下概念分開：

- 身份；
- 工作角色；
- 能力；
- row scope；
- 狀態規則；
- transaction；
- audit。

因此不是把 localStorage 問題搬到另一層，而是重新劃定信任邊界。

### 3.2 波次應改成 domain vertical slice

目前文件將：

- 波 4：按 domain 收緊；
- 波 5：高風險 command；

分成前後兩波。

這可能出現：

- 先收緊 RLS，現有多表流程中途失敗；
- command 已上但 direct write 長期未撤；
- 同一業務同時維持兩條寫入路徑。

建議每個 domain 一次完成：

1. Capability mapping。
2. Command／RLS 設計。
3. Service 接線。
4. UI capability guard。
5. Direct API allow-deny 測試。
6. 撤銷舊 direct write。
7. Audit及回滾驗證。

例如「系統通知」應在同一 domain 波完成：

- `system_notice.publish`；
- DB command；
- server-side audit；
- UI guard；
- 撤銷舊 `inbox_events` direct insert；
- 非 alien REST／RPC 測試。

### 3.3 先凍結 profile v2 contract

P0-1 與 P0-2 開工前應共同定案：

```ts
type AuthzProfile = {
  appUserId: string
  activeRole: MgmtRole
  availableRoles: MgmtRole[]
  teacherId: string | null
  capabilities: Capability[]
  authzVersion: number
}
```

同時決定：

- role-switch RPC 是否直接回傳此結構；
- capabilities 排序及去重；
- 未知 capability 如何處理；
- profile 載入失敗的錯誤語意；
- student／portal 是否使用同一 contract。

高衝突檔案不可由兩個 agent 各自改一版：

- `src/lib/authBootstrap.tsx`
- `src/services/authRoleQueries.ts`
- `src/components/auth/RequireMgmtRoles.tsx`
- `src/lib/mgmtRole.ts`
- `src/lib/navStructure.ts`
- `get_my_mgmt_profile` 相關 migration

### 3.4 Capability key 必須有唯一 catalog

SQL、profile、TypeScript 都會使用 capability key。若各自手寫，容易出現：

- `payments.mark_received`
- `payment.mark_received`
- `payments.mark-received`

建議：

1. DB capability catalog 為權威。
2. 產生 TypeScript `Capability` union，或用 CI 比對前端常量與 DB catalog。
3. `has_capability()` 對未知 key fail closed。
4. Alien 明列全部 capabilities，不使用 wildcard。
5. Capability rename 必須有 migration／兼容期，不可靜默改字串。

### 3.5 補充 private helper 安全規格

`private.has_capability()` 應明確規定：

- 是否使用 `SECURITY DEFINER`；
- `search_path = ''`；
- 所有 table／function fully qualified；
- revoke `PUBLIC`；
- 只授必要角色 `EXECUTE`；
- private schema 不加入 Data API exposed schemas；
- role／capability join 欄位索引；
- 使用 `EXPLAIN ANALYZE` 驗證 InitPlan；
- mutation 及大表 SELECT 的 p95 不高於 baseline 10%。

若未定義上述細節，capability kernel 本身可能成為新的 security／performance 債。

### 3.6 P0 完成條件應按 domain 計算

以下均不代表 P0-1 已修好：

- Capability tables 建立完成；
- Profile v2 上線；
- UI 改用 capabilities；
- Shadow audit 開始記錄。

某 domain 只有在以下全部完成後才算修正：

1. 新 RLS／command 上線。
2. 舊 write path 撤銷。
3. 各角色 direct API 測試通過。
4. 正式 UI 流程回歸通過。
5. Audit actor／active role 由 server 推導。
6. Migration 可獨立回滾。

55 張表／所有高風險 domain 完成後，P0-1 才可整體標記完成。

---

## 4. 建議的 P0-1／P0-2 配合

### P0-1 提供

- Capability catalog。
- Role-capability mapping。
- `private.has_capability()`。
- `get_my_mgmt_profile` v2 DB contract。
- Role switch DB contract。
- Capability-backed RLS。
- Transactional commands。
- Server-side audit。
- Direct API regression。

### P0-2 提供

- Profile v2 TypeScript type。
- AuthContext。
- `RequireCapabilities`。
- Nav／route／button capability guard。
- 移除 localStorage 身份來源。
- Teacher scope 改用 profile。
- Role switch 後 cache invalidation。
- 多分頁／focus profile refresh。

### 共同簽收

- Capability naming。
- 角色矩陣。
- Profile v2 contract。
- Role switch contract。
- Domain rollout 次序。
- 每域完成條件。

---

## 5. 最終評價

| 項目 | 評價 |
| --- | --- |
| 架構方向 | 通過 |
| 對 P0-2 配合設計 | 大部分完整 |
| 第一性原則 | 合理；沒有把 browser state 當安全邊界 |
| 可否直接實作 | 不可 |
| 最大產品阻塞 | 13 項角色矩陣未拍板 |
| 最大技術缺口 | Role switch／cache／多分頁一致性 |
| 最大遷移風險 | 波 4 收緊與波 5 command 分開 |
| 最大驗證前提 | Staging／Supabase branch 尚未可用 |

建議下一步：

1. 拍板 13 項角色矩陣。
2. 凍結 profile v2／capability catalog。
3. 決定恢復 staging 或建立 Supabase branch。
4. 將波 4＋5 改為逐 domain vertical slice。
5. 補角色切換、多分頁及 cache invalidation 規格。
6. 完成上述事項前，不套用收緊 production RLS 的 migration。
