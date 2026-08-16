# P0-1 授權架構重評

| 欄位 | 值 |
| --- | --- |
| 狀態 | `in_progress`（kernel wave 1：catalog／profile v2 已寫；未收緊 RLS） |
| 日期 | 2026-08-15 |
| 範圍 | P0-1：DB 權限粗過 UI 角色 |
| 直接相關 | P0-2：前端守衛讀 localStorage，唔係 Auth |
| 上層主題 | [`tech-debt-hardening.md`](./tech-debt-hardening.md) |
| 資料來源 | production `pg_policies`／角色資料、現有 React／service 寫入路徑、Supabase RLS／RBAC 官方文件 |

## 結論

上一版「SELECT 留 `is_mgmt_staff()`、寫入大致改成 admin／alien」應撤回，暫時不可實施。

原因：

1. `manager` 現時確實會寫班別、排程、請假、校曆、老師檔期、成本帳、權益更正及計糧結算，不能粗暴降成 read-only。
2. `finance` 必須寫計糧審閱、排除、調整、工時及提交狀態，不能當純 reader。
3. 同一張表內，不同操作需要不同權限；reader／writer 二分無法表達。
4. 收款、報讀、權益、點名及計糧有多表連續寫入；只拆 RLS 可能令流程半成功。
5. 日後新增角色若仍靠 role literal，仍要修改大量 SQL policy、helper、TypeScript union、nav、頁守衛及 Edge Function。

建議目標為：

> **DB capability 權限核心＋高風險 transactional command；保留低風險 RLS CRUD、現有 active role 切換及老師 row scope。**

最複雜不等於最優。全面 ABAC／動態規則引擎理論上更完整，但現時會增加規則 DSL、除錯、驗證及效能成本。Capability RBAC 加少量 command boundary 已覆蓋目前問題，亦保留日後擴展空間。

---

## 已核實數據

2026-08-15 production 唯讀核對：

- 55 張表有依賴 `is_mgmt_staff()` 的廣泛 mgmt 寫入 policy。
- 相關 `ALL`／`INSERT`／`UPDATE`／`DELETE` policy 共 60 條。
- `is_mgmt_staff()` 現時包含 `admin`／`manager`／`finance`／`alien`。
- 角色授予共 25 項；`mgmt_active_roles` 只有 4 筆，其餘帳戶仍可能經 `app_users.role` fallback。
- production 有 15 筆 `finance_reviewed` payroll teacher state，以及 1 個已結算 payroll run；證明系統已持久化財務／管理層寫入流程，但現有 audit 不足以可靠判斷每筆由哪個角色操作。
- `expense_entries` 是少數已拆開的例子：寫入限 `manager|alien`，finance 已被 DB 拒寫。

現有 `mgmt_audit_log` 亦未可當完整權威：

- 多個 actor／role label 由瀏覽器 localStorage 產生。
- payroll 寫入沒有完整寫進該 audit。
- authenticated 可直接 insert 部分 audit/error 表。

因此本報告分開：

- **程式及 RLS 明確允許的能力**
- **production 已存在的狀態**
- **實際員工是否曾操作**（若 audit 不足，明確標為不能證實）

---

## 歷史原因：當初點解會咁設計

### Phase A–C 原始目標

2026-06 RLS rollout 的首要目標是：

1. 先阻擋 anon。
2. 收窄老師至自己班／排程／學生。
3. 同時維持當時 admin／alien 現有營運流程，避免大規模 permission denied。
4. Phase C 再把用戶、課程、優惠目錄等敏感表拆給 alien。

當時 `is_mgmt_staff()` 只包含 admin／alien。對營運表批量使用 `FOR ALL`，屬漸進 rollout 的兼容策略，而不是為 manager／finance 設計。

### 後來風險如何形成

- 2026-07-21 才加入 `app_user_roles`、`mgmt_active_roles` 及 active role 切換。
- 2026-08-01 加 manager 時，只擴 `is_mgmt_staff()`；migration 明確註明第一期先視同職員讀寫，第二期再拆。
- 2026-08-04 加 finance 時，再次只擴 helper；註解寫 finance 主要可讀職員營運資料、UI 收窄至計糧／核對，但 RLS policy 沒同步拆分。

所以 P0-1 的根因不是 2026-06 原設計完全錯誤，而是：

> 原本只服務 admin／alien 的過渡 helper，後來被當成新角色的永久授權模型；已承諾的第二期拆分沒有完成。

### 有證據及無證據的原因要分開

有證據：

- 快速兼容現有 admin／alien 流程。
- 漸進上線，先處理 anon 及 teacher。
- 批量 policy 較易保持一致。
- Manager 新增時有意延後 reader／writer 拆分。

無足夠證據：

- `FOR ALL` 是為了解決 RLS recursion。
- 2026-06 已預見 manager／finance。
- 原始設計是為多角色切換。

RLS recursion 是靠 `SECURITY DEFINER` helper 解決；它不能解釋為何必須使用廣泛 `FOR ALL`。

---

## 原設計值得保留的好處

修改時不可破壞：

1. **Active role 即時切換**  
   雙身份用戶切換後，DB 權限應即時變更，不應等 JWT refresh。

2. **Manager ≥ admin 的營運讀取與寫入**  
   2026-08-15 公理 1：`alien` ⊇ `manager` ⊇ `admin`（讀＋寫）。報表、embed、join 讀取不可因 UI 分流而消失；admin 有的寫入 manager 不可缺。詳見 [決策稿](./p0-1-authorization-decisions.md)。

3. **老師 row scope**  
   老師只能處理自己的班、排程、學生及點名；不可併入一般職員全表 capability。

4. **前線流程不中斷**  
   Admin 收款、報讀、點名等不可因漏拆一張從表而半途失敗。

5. **簡單 CRUD 保持簡單**  
   不應把每個低風險欄位修改都強制改成 RPC。

6. **角色切換代表降權**  
   用戶即使同時獲授 admin＋teacher，active teacher 時不可暗中繼承 admin capability。

---

## 第一性拆解

| 層 | 要回答的問題 | 現況 | 目標 |
| --- | --- | --- | --- |
| 身份 | 邊個？ | Supabase Auth＋`app_users` | 保留 `auth.uid()`／app user |
| 工作身份 | 今次以咩帽做事？ | `mgmt_active_roles` | 保留即時 active role |
| 能力 | 可以做咩操作？ | `is_mgmt_staff()`／role literal | `has_capability(operation)` |
| 範圍 | 可以對邊啲資料做？ | teacher 有 row scope；mgmt 多數全表 | capability＋row predicate |
| 狀態規則 | 呢個操作此刻是否合法？ | 多數 client 檢查 | transactional command／DB constraint |
| 原子性 | 多表操作可否一齊成功／失敗？ | client 順序寫＋補償 | DB transaction |
| 責任 | 誰在何時做過？ | client actor label；覆蓋不完整 | server audit＋app user id |

目前 `is_mgmt_staff()` 把能力、範圍、操作規則及角色混成一個 boolean。這才是結構性問題。

---

## 方案比較

| 方案 | 複雜度 | 新角色成本 | 業務操作表達 | 結論 |
| --- | --- | --- | --- | --- |
| A. 逐表寫死角色 | 低 | 高：每次改多條 policy／union／guard | 差 | 不採用 |
| B. reader／writer 二分 | 中 | 中高：仍把角色壓成兩群 | 差：finance、manager 無法準確分類 | 不採用 |
| C. Capability-backed RLS | 中 | 低：角色可重用 capability | 中：direct DML 仍可繞狀態機 | 作為地基 |
| D. Capability＋選擇性 command | 中高 | 低 | 高：可表達金錢、結算、核准、第二確認 | **建議** |
| E. 全面 command layer | 高 | 角色低、每項操作高 | 很高 | 一次改寫風險過大 |
| F. 全動態 ABAC／規則引擎 | 很高 | 最低 | 最高 | 現階段過度設計 |

---

## 建議目標架構

### 1. 角色是 persona／capability bundle，不再直接等於表權限

新增非 Data API exposed schema 的授權核心，例如：

- `private.authz_roles`
- `private.authz_capabilities`
- `private.authz_role_capabilities`
- `private.has_capability(capability_key)` — **跟 active role**
- `private.has_account_capability(capability_key)` — **跟已獲授角色聯集**；只畀 catalog 標明嘅雙重確認

`app_user_roles` 保留「用戶獲授角色集合」。Active role 改 session-scoped：`(app_user_id, session_id)`；`current_app_role()` **唔** fallback `app_users.role`。新 session 建立列時先 seed 預設帽（見決策稿）。

角色 CHECK 應逐步改成 FK／catalog，避免每加角色都要 DROP＋ADD constraint。

Active role 一定屬於該用戶已獲授角色。

第一期不建議加入 per-user allow／deny overrides，否則權限來源會再次難以解釋。若日後確有需要，應使用有原因、批核人、期限及 audit 的臨時 grant。

產品矩陣已簽：見 [`p0-1-authorization-decisions.md`](./p0-1-authorization-decisions.md)。本節示例 key **不是**最終 catalog。

### 2. Capability 以業務操作命名，不以資料表命名

最終 catalog 按已簽矩陣拆細後先 seed（決策稿「Catalog」節）。以下僅說明命名風格，**勿當 seed 清單**：

- 讀／寫分開（`students.read` vs `students.create`）
- 同一張表內不同操作分開（`expenses.record` vs `expenses.confirm`）
- 作廢發起 vs 第二確認分開（`payments.void` active；`payments.void.approve` account）
- 計糧按狀態機步驟分開；行政無 payroll 寫入 key
- 權益池直接改只限外星人；申請制之後先加 key

未知 capability fail closed。DB catalog 為唯一真源；P0-2 唔另建 role→key 表。

### 3. DB-backed capability，不以 JWT claim 作唯一真源

Supabase 官方有 custom claim RBAC 方案，但本系統不適合把它當唯一授權真源：

- active role 切換目前即時生效。
- JWT custom claims 只在 token 簽發／refresh 更新。
- 撤權後，舊 token 可在有效期內繼續帶舊 capability。

建議：

- `private.has_capability()` 根據 `auth.uid()`、app user、**呢個 session 的 active role** 及 role mapping 判斷。
- `private.has_account_capability()` 根據已獲授角色聯集；只用於 catalog 標明嘅 key。
- RLS 使用 `(select private.has_capability('...'))`，讓 PostgreSQL 以 InitPlan 每 statement 快取。
- 角色／capability join 欄位加索引。
- Helper 放 private schema，不放 Data API exposed schema。

### 4. UI 從同一 profile 讀 capability

`get_my_mgmt_profile` v2 應回傳：

- `app_user_id`／`email`／`display_name`
- `active_role`
- `teacher_id`
- `available_roles`
- `active_capabilities`
- `account_capabilities`
- `authz_version`

React：

- `RequireMgmtRoles` → `RequireCapabilities`（預設讀 `activeCapabilities`）
- 雙重確認（而家只有作廢第二確認）讀 `accountCapabilities`
- nav／button 授權只跟 profile capabilities，唔另建 role→key
- 側欄展示清單若同 DB 能力唔同，必須獨立命名為 IA，唔當授權
- **已簽：** 結構做完先改 UI 入口；P0-2 唔好因 capabilities 打開管理層日常側欄
- localStorage 不可判斷權限；profile 載入失敗 fail closed
- `switch_my_mgmt_role_v2` 同一 RPC 回完整 profile v2

### 5. 高風險 workflow 用 transactional command

建議逐步 command 化：

- 建立／標記已收／作廢付款
- 報讀／退讀及其權益同步
- 權益池更正／搬堂
- 刪除／更正出席
- payroll submit／return／settle／reopen
- 成本帳 confirm／void
- 發佈系統通知
- 用戶建立／停用／角色授予
- 涉及多表生命週期的其他操作

保留 direct table＋RLS：

- 低風險單表欄位
- 老師檔期等可清楚以 capability＋row scope 表達的 CRUD
- 一般讀取

每個 command 應：

1. 從 DB 推導 app user、active role、capability。
2. 驗證當前狀態及 row scope。
3. 在同一 transaction 更新所有表。
4. 寫 server-side audit。
5. 高風險操作接受 idempotency key。
6. audit 至少記 actor、active role、capability、operation、entity、request id、server time；需要時記 second approver。

Edge Function 只保留密碼再驗證、寄信及外部 API；核心資料改動應交回單一 DB command。

---

## 現有前線寫入事實

### Admin

主要前台日常：

- 學生、報讀、試堂
- 收款、標記已收、作廢
- 班別、排程、代堂
- 點名、請假
- 計糧頁可操作 finance／manager 兩種視角

首波應保持所有現有正式操作。

### Manager

現有程式會實際觸發：

- 學生列表新增學生
- 新增／修改班別
- 排程、代堂、取消、拖曳
- 從排程頁點名
- 請假管理
- 一對一報讀
- 老師檔期
- 校曆休館
- 教學備註
- 權益更正／搬堂
- payroll 退回、核准調整、核實工時、結算
- 成本帳新增、分類、確認、重開、作廢
- Portal 邀請
- 收件匣已讀

所以 manager 不可整體變成 read-only。

### Finance

現有正式需要寫：

- payroll 重算
- 標記財務已審
- 排除／恢復老師
- 建立調整申請
- 提交個別老師／整月
- 填報工時
- 收件匣已讀
- 現碼亦容許 Portal 邀請（是否產品意圖待定）

現有正式應為唯讀：

- 繳費紀錄
- 排程
- 出席紀錄

Finance 不應因廣泛 RLS 而可直接 REST 改 `students`、`classes`、`schedules`、`attendance_details`、`payments`。

### Teacher

必須保留：

- 自己班／排程／學生 row scope
- 自己課堂點名
- 窄排程狀態／教學備註更新
- 約房
- 收件匣已讀

### Alien

負責：

- 系統／用戶／角色
- 課程／優惠目錄
- 系統通知
- 營運支援及緊急處理

建議明列全部 capabilities，不用 wildcard，避免日後新增 capability 自動授予 alien。

若需要繞過正常 workflow，應另設有時限、理由、再次確認及完整 audit 的 break-glass，而不是永久 raw DML。

---

## 前線影響

### 若直接實施舊方案

會壞：

- manager 班別／排程／點名／請假／權益／計糧／成本流程
- finance 計糧全流程
- admin 計糧雙視角
- 多表收款／報讀／權益同步可能中途失敗

### 按建議方案遷移

首波應做到零「產品意圖內」操作影響：

- 不要求重新登入
- 不增加日常步驟
- active role 切換保持即時
- UI 在呼叫前已根據 capability 顯示／隱藏操作
- DB 拒絕非工作範圍的深連結／REST 寫入
- 多表 command 失敗時全部 rollback，反而減少半完成狀態

不能承諾「完全零畫面差異」，因目前存在一些 UI／文件矛盾及 accidental access；這些必須先拍板。

---

## P0-1 與 P0-2 的關係

兩者是同一授權鏈的兩端：

- **P0-1**：DB 現時只知道粗粒度 `is_mgmt_staff()`，所以真正 enforcement 太寬。
- **P0-2**：UI／service 仍讀 localStorage role，並非 DB/Auth profile，所以使用者體感及前端守衛不可信。

只修其中一邊都不足：

### 只修 P0-1

- DB 會正確拒絕，但 UI 仍可能顯示錯頁／錯掣。
- 使用者會遇到「按完先 permission denied」。
- actor label、inbox key、teacher scope 仍可能因 localStorage 被改而錯亂。

### 只修 P0-2

- UI 看似正確，但 manager／finance JWT 仍可直接經 REST 寫大量營運表。
- 側欄隱藏仍被誤當成安全邊界。

### 共同接口

P0-1 應提供：

- `get_my_mgmt_profile` v2
- DB-derived active role
- capabilities
- authz version
- `private.has_capability`
- capability-backed RLS／commands

P0-2 應消費：

- AuthContext profile
- active role
- capabilities
- role switch 後 profile refresh

P0-2 不應另建一套前端 permission mapping，也不應以 JWT claim／localStorage 作最終真源。**P0-2 實作等本檔／決策稿簽收及 profile v2 contract**；未交付前唔改 Auth 共用檔。

### 建議工作分工

| 範圍 | P0-1 agent | P0-2 agent |
| --- | --- | --- |
| Capability schema／mapping | 主責 | 審閱接口 |
| `has_capability`／RLS | 主責 | 不重複實作 |
| 高風險 commands | 主責 | 接 service API |
| `get_my_mgmt_profile` 回傳格式 | 共同定案；P0-1 實作 DB | P0-2 實作 client type／context |
| AuthContext | 提供需求 | 主責 |
| `RequireCapabilities` | 提供 capability naming | 主責 |
| nav／route／button guard | 審閱矩陣 | 主責 |
| localStorage 授權移除 | DB 不依賴 | 主責 |
| server-side audit actor | 主責 | 不再傳可偽造角色 |

### 共同高衝突檔案

兩邊不可同時各自改一版：

- `src/lib/authBootstrap.tsx`
- `src/services/authRoleQueries.ts`
- `src/components/auth/RequireMgmtRoles.tsx`
- `src/lib/mgmtRole.ts`
- `src/lib/navStructure.ts`
- `supabase` 內 `get_my_mgmt_profile` 相關 migration

建議先凍結 profile v2 contract，再分工。

---

## 零中斷遷移波次

### 波 0：矩陣及安全網

- 拍板 capability matrix。
- 建角色 JWT／DB 回歸測試帳戶。
- 使用 staging 或 Supabase branch；不可直接在 production 試錯。
- 凍結新增 `current_app_role() in (...)`／`is_mgmt_staff()` 寫 policy。

### 波 1：Capability kernel，不改行為

- 新增 role／capability tables。
- Seed 映射，先對齊已簽產品行為。
- 新增 `private.has_capability`。
- `get_my_mgmt_profile` v2 回 capabilities。
- 舊 helper 暫作 compatibility wrapper。
- 不改現有 RLS enforcement。

### 波 2：P0-2 接入同一真源

- AuthContext 改讀 profile v2。
- `RequireCapabilities`、nav、button guard 接 capabilities。
- 移除 localStorage 授權 fallback。
- active role 切換後刷新 profile。

### 波 3：Shadow audit

- 記錄每次寫入所需 capability、active role及新模型會否允許。
- 不阻擋操作。
- 找出文件與真實流程落差。

### 波 4：按 domain 垂直完成（RLS 同 command 唔分前後波）

每域一次做完：capability mapping → command 或 RLS → service 接線 → 撤舊 direct write → Data API allow-deny → 回滾驗證。禁止 55 表 big-bang，亦禁止「先收緊多表 RLS、後補 command」。

第一批唔只收緊：`expense_entries` 要按 F4 **放寬** finance 入帳／分類（確認／作廢／重開仍限管理層＋外星人）。

建議順序：

1. 系統通知／用戶／角色
2. 學生／班別
3. 排程／點名
4. 付款（含作廢 command；`void.approve` 用 account capability）
5. 權益池（直接改只限外星人）
6. 計糧（P1–P10 分角色）
7. 成本帳（finance 入帳放寬＋ confirm／void command）

### 波 5：清理

- 移除舊 role literal helper。
- 移除 client-supplied actor／role。
- 移除 `app_users.role` 授權用途同 `current_app_role()` fallback。
- 移除舊 `is_mgmt_staff()` 寫 policy。
- 低風險 CRUD 是否再 command 化，按實際 audit／原子性需要決定。

---

## 驗收要求

- 修改 `localStorage.mgmt_role` 不可改變 nav、route 或 API 權限。
- 同一 JWT 從 admin 切到 teacher 後，立即只剩 teacher scoped capability。
- 獲授 admin 但 active teacher 時，不可取得 admin capability。
- Finance 直接 REST update `students`／`schedules`／`attendance_details` 必須被 DB 拒絕。
- Manager 獲授且 active manager 時，公理 1 允許嘅寫入（含付款）必須成功；finance 寫付款必須拒絕。
- 作廢第二確認：帳戶已獲授 manager 或 alien 即可，唔使切 active role；未獲授則拒絕。
- Admin 正常收款／報讀／點名不可退化。
- Finance 計糧 review／submit 可正常完成。
- Manager payroll settle 可正常完成，並原子過帳成本帳。
- Teacher 自己班／代堂點名保持現有 row scope。
- 高風險 command 中途失敗時，資料及 audit 一併 rollback。
- 同一 idempotency key 重送不可產生重複付款／結算。
- Audit actor／active role 由 DB 推導，不可由 request payload 偽造。
- 新增測試角色且只重用現有 capabilities 時，不需修改既有 table policy。
- Capability helper 在大表 query 以 InitPlan 執行，p95 不高於 baseline 10%。
- 每個 domain 可單獨回滾，不影響其他角色。

---

## 實作前必須拍板

逐項填答見 [`p0-1-authorization-decisions.md`](./p0-1-authorization-decisions.md)。

已收：公理 1；IA1；F1–F5／F4b；計糧整組；M19；V1／V2／V4；A1；U1；U3；R1。  
P0-2 審閱已採納：兩個 predicate、session 表唔 fallback、catalog 按矩陣拆、vertical slice、profile v2 兩組 capabilities。  
U2 逐欄之後。**已簽：** 結構做完先改 UI 入口／側欄。未有 staging 前不可套用收緊 production RLS 的 migration。

