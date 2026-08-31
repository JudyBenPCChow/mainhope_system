# Session HANDOFF：P0-1／P0-2 授權協作

| 欄位 | 值 |
| --- | --- |
| 日期 | 2026-08-15 |
| 主題／backlog | [`p0-1-authorization-redesign.md`](../../product/topics/p0-1-authorization-redesign.md) |
| 分支／工作樹 | `main`；有大量其他未提交程式改動，兩個授權 agent 不可擅自 stage／commit／覆蓋 |
| 驗證 | 本輪只做調查及文件；未跑 build／lint／test |

## 本資料夾約定

`docs/meta/handoffs/` 是 P0-1／P0-2 agent 的固定交接資料夾。

- 往後用戶只需說「讀最新 `p0-authz` handoff」，毋須再貼完整路徑。
- 授權相關交接檔一律用 `YYYY-MM-DD-p0-authz-<scope>-session.md`。
- 新 agent 先 glob `docs/meta/handoffs/*p0-authz*`，再讀日期最新一份。
- 主題規格仍以 `docs/product/topics/` 為準；handoff 只記狀態、分工及下一步。

## 目標與次序

工作次序已確定：

1. **先完成 P0-1：DB 真正授權邊界。**
2. **再開始 P0-2：前端角色／capability 投影。**

P0-1 要確保即使完全繞過 UI，RLS／command 仍正確允許或拒絕。P0-2 其後令 AuthContext、route、nav、button及 teacher scope 使用同一 DB profile，消除 localStorage authority。

## 已完成

- 完成 P0-1 歷史、production policy、前線寫入及可擴展授權架構調查。
- 推翻舊「reader／writer 二分」方案。
- 目標架構定為：DB capability kernel＋低風險 capability-backed RLS＋高風險 transactional command。
- 完成 P0-2 localStorage／AuthProvider／頁面及 service guard 調查。
- 互相審閱兩份報告，架構方向一致。
- 2026-08-15 晚：P0-2 agent 已接；過夜續見 [`2026-08-15-p0-authz-p0-2-session.md`](./2026-08-15-p0-authz-p0-2-session.md)。
- 已確認必須補充：
  - active role 是 account-scoped 還是 session-scoped；
  - profile／role-switch v2 contract；
  - domain vertical-slice rollout；
  - capability catalog 唯一真源；
  - staging／Supabase branch；
  - cache／多分頁／跨裝置一致性。

## P0-1 agent 接下來負責

1. 將未定角色權限整理成產品決策清單，取得用戶拍板。
2. 決定 active role scope；目前優先評估以 JWT `session_id` 作 session-scoped active role，避免同帳戶不同裝置互相改角色。
3. 定案 capability catalog及命名；DB catalog 為唯一權威。
4. 定義：
   - role catalog；
   - role-capability mapping；
   - `private.has_capability()`；
   - `authz_version` 語意。
5. 建立版本化 DB contract：
   - `get_my_mgmt_profile_v2()`；
   - `switch_my_mgmt_role_v2()`，直接回傳 profile v2。
6. 處理 `app_users.role` fallback、active-role backfill及角色 FK／約束。
7. 使用 staging 或 Supabase branch 驗證。
8. 按 domain vertical slice 完成：
   - capability mapping；
   - command／RLS；
   - server-side audit；
   - domain service 接線；
   - 撤銷舊 direct write；
   - 各角色 Data API／RPC allow-deny；
   - 正式流程及 rollback 驗證。
9. 不做全域 55 表 shadow trigger；以 integration test 為主，只在高風險 domain 按需要短期 shadow。
10. P0-1 完成後交付固定 profile／role-switch／capability contract及舊 guard 清單給 P0-2。

## P0-2 agent 現階段應做

P0-1 完成前保持調查／審閱狀態：

- 可補 localStorage、teacher scope、cache、route guard callsite inventory。
- 可準備 UI／聯合驗收案例。
- 可審閱 P0-1 提出的 profile v2、role-switch及 capability naming。
- 不可另建 role→capability mapping。
- 不可自行改 capability key。
- 不可開始修改下列共用檔案：
  - `src/lib/authBootstrap.tsx`
  - `src/lib/authSession.ts`
  - `src/services/authRoleQueries.ts`
  - `src/components/auth/RequireMgmtRoles.tsx`
  - `src/lib/mgmtRole.ts`
  - `src/lib/teacherScope.ts`
  - `src/lib/navStructure.ts`

## P0-1 完成後，P0-2 agent 負責

1. 建立 profile v2 TypeScript client type。
2. AuthContext 改成唯一 UI profile 來源。
3. 區分 `loading`／`authenticated`／`signed_out`／`profile_error`／`access_denied`。
4. `RequireMgmtRoles` 改為 `RequireCapabilities`。
5. Nav、route、button及唯讀體感改用 server-returned capabilities。
6. 停止讀寫身份 localStorage：
   - `mgmt_role`
   - `teacher_id`
   - `mgmt_email`
   - `mgmt_display_name`
7. Teacher scope 改用 `profile.teacherId`。
8. Role switch 使用 P0-1 提供的 v2 RPC及回傳 profile。
9. 切換後 remount／清除舊角色 domain cache。
10. 處理同瀏覽器分頁 invalidation及 focus profile refresh。
11. 移除 service 對瀏覽器角色的授權判斷；前端檢查只保留 UX。
12. 驗證 localStorage 偽造、deep link及舊角色 cache 不可改變 UI 身份。

Capability 判斷必須使用 DB profile：

```ts
can(profile.capabilities, "payments.void")
```

不可重新建立前端角色矩陣：

```ts
hasCapability(profile.role, "payments.void")
```

## P0-1 交給 P0-2 的完成物

- 已簽收角色 × capability matrix。
- Capability key catalog。
- Profile v2 schema。
- Role-switch v2 contract。
- Active-role scope 定案。
- `authz_version` 語意。
- 每個 command／RLS 操作契約。
- 已撤銷 direct write 清單。
- Data API allow-deny 測試結果。
- 前端要替換的舊 role guard 清單。

## 未完成／卡住

- 角色權限產品矩陣尚未全簽；決策稿填答中（公理 1／B／C／IA1／V2／V4 已收）。
- Active role scope 尚未定案。
- `mainhope-staging` inactive；未決定恢復 staging 或建立 Supabase branch。
- Profile v2／role-switch v2／authz-version 仍未凍結。
- 尚未建立或套用任何 P0-1 migration。
- P0-2 callsite inventory／驗收案例尚未補寫。

## 下一步（P0-1）

1. 將待拍板權限濃縮成用戶可逐項回答的決策表。
2. 先處理 active role account-scoped vs session-scoped 的技術及操作取捨。
3. 取得決策後定稿 P0-1 實作計劃；未簽收前不收緊 production RLS。

## 開局必讀

- [`p0-1-authorization-redesign.md`](../../product/topics/p0-1-authorization-redesign.md)

## 勿再踩

- 不把現碼 accidental access 當作已簽收產品權限。
- 不以 localStorage／React Context／JWT custom claim 作唯一授權真源。
- 不用 `hasCapability(role, key)` 在前端重建權限矩陣。
- 不分開「先收緊多表 RLS、後補 command」；每個 domain 要垂直完成。
- 不改現有 RPC return type；用 v2 function 避免 drop／同步部署風險。
- 不假設 `mgmt_active_roles` 是唯一真源；目前 `current_app_role()` 仍 fallback `app_users.role`。

## 明確唔做

- P0-2 agent 現階段不實作前端 Auth 改造。
- 未拍板角色矩陣前不 seed 最終 role-capability mapping。
- 未有 staging／branch 回歸前不在 production 試 migration。
- 不 commit／push；工作樹含大量其他未提交改動。

