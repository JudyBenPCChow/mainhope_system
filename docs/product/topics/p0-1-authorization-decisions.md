# P0-1 授權決策稿（請在本檔回覆）

| 欄位 | 值 |
| --- | --- |
| 狀態 | 矩陣已簽（U2 逐欄之後，唔擋 RLS） |
| 日期 | 2026-08-15 |
| 主檔 | [`p0-1-authorization-redesign.md`](./p0-1-authorization-redesign.md) |
| 功能 × 角色 | [`p0-1-authz-feature-roles.md`](./p0-1-authz-feature-roles.md) |

未簽收前不會 seed 權限、不會收緊 production RLS。

---

## 已簽公理

### 公理 1 — 職員階層（讀＋寫）

`alien` ⊇ `manager` ⊇ `admin`

- 讀同寫都係呢條鏈。admin 有的，manager 一定有；manager 有的，alien 一定有。
- 反向唔成立：manager 可以有 admin 沒有的。
- `finance`、`teacher` 唔喺呢條鏈。

### 由公理 1 自動定案（M17／M18 已被 M19 覆寫）

Manager（同 alien）可以：新增／改學生、報讀退讀、點名、刪／更正出席、班別（含學費欄）、排程（建立／拖曳／取消／代堂／狀態）、請假（含連帶刪出席／改排程）、Portal 邀請、發起作廢付款。

權益池直接改：**只有外星人**。行政／管理層見 M19。

Manager＋alien 另有、admin 唔使有：成本帳確認／作廢／重開。財務可入帳／改分類（F4／F4b）。老師檔期、校曆：三層都有。

---

## 已收答案

| ID | 你的決定 | 我理解成 |
| --- | --- | --- |
| IA1 | 側欄唔好搞先；結構做完再處理 UI 入口 | P0-1／P0-2 先做 DB／profile；nav 暫維持；另包先改入口 |
| F1 | 同意 | 財務不可建立／改／標記已收／作廢學費單 |
| F2 | 同意 | 財務不可發家長 Portal 邀請 |
| F3 | 同意 | 財務可讀學生／班／排程／出席；不可改 |
| F4 | 可以讀可以寫（入帳記帳） | 財務可讀可寫成本帳入帳／改分類 |
| F4b | 同意 | 確認／作廢／重開限管理層＋外星人 |
| F5 | 可讀不可改 | 財務不可改 students／classes／schedules／attendance_details |
| C 整組 | 全組同意 | 計糧：P1–P6 財務；P7–P9 管理層＋外星人；P10 外星人；行政唔做計糧寫入；外星人可做管理層那些 |
| M19 | 1 yes；2 接受空窗；UI 之後 | 直接改池只限外星人。行政學生詳細／管理層繳費紀錄交申請、外星人批。申請制另包；空窗期行政／管理層改唔到堂數 |
| V1 | B | 第二確認睇帳戶**已獲授**角色，唔使切帽 |
| V2 | 有另一個角色可以自己批；睇有冇 role，唔睇係咪同一人 | 同一人只要帳戶有管理層／外星人就可以批 |
| V4 | 同意 | >30 分：管理層或外星人 |
| A1 | 唔做 | 第一期不做 break-glass |
| A2 | （空） | 跳過 |
| U1 | 兩個學年（26sm、2627 各算一個） | 紀錄保留兩個學年單位（含暑期學期） |
| U2 | 每個欄位都要個別考慮 | 今期唔逐欄拍板 |
| U3 | 外星人及管理層全部可查；行政及財務查自己的過往操作 | alien＋manager 全查；admin／finance 只查自己做過嘅 |
| R1 | 每個登入各自記（session） | Active role session-scoped |

---

## M19 已簽

理解確認。申請制 backlog：[`entitlement-correction-approval.md`](./entitlement-correction-approval.md)。

P0-1 只收緊：直接改堂數池只限外星人。申請掣／批准隊列 UI 之後先設計。

---

## 記錄：U2

你講得對：唔可以只定電話／地址／堂數／金額四樣。

P0-1 今期 audit 最低只記：邊個、以咩角色、做咗咩操作、改邊筆資料、幾時。  
每個欄位記唔記舊值／新值，之後另開一表逐欄拍板，唔擋 RLS。

---

## P0-2 審閱採納（2026-08-15）

架構方向保留：capability kernel＋選擇性 command；唔用 JWT claim 做真源；P0-2 只消費 DB profile。

### 兩個 predicate（已採納）

日常操作同作廢第二確認唔能共用一個 `has_capability()`。

| 名稱 | 意思 | 誰用 |
| --- | --- | --- |
| `activeCapabilities` | 呢個 session 而家戴緊嘅帽 | nav／掣／RLS／command **預設** |
| `accountCapabilities` | 帳戶所有已獲授角色嘅聯集 | **只**已命名雙重確認；而家得 `payments.void.approve` |

- `private.has_capability(key)` = 跟 **active** role。
- `private.has_account_capability(key)` = 跟已獲授角色聯集。
- 要跟 account 必須喺 catalog 逐項標明。唔再開第三種例外。
- 戴 teacher 時 `activeCapabilities` 唔含管理層；`accountCapabilities` 可以含，但只喺 void 第二確認用。

### Session 表（已採納）

- `mgmt_active_roles` 改 `(app_user_id, session_id)`（或等價）。
- `current_app_role()` **唔** fallback `app_users.role`（否則新 session 食帳戶舊帽，R1 廢）。
- 新 session **建立列**時先寫預設帽：若 `app_users.role` 仍喺已獲授清單就用它，否則用授予清單第一個。呢個只係 seed，唔係持續 fallback。
- logout／session 過期刪列。
- JWT 穩定 `session_id` 已核實（2026-08-19）：Supabase Auth access token 必帶；production 11／11 `mgmt_session_roles` 列對應 `auth.sessions`，毋須另造 session 鍵。

### Catalog（已採納）

最終 key 以 DB seed 為準：[`p0-1-authz-catalog.md`](./p0-1-authz-catalog.md)。Client：`src/lib/authzProfile.ts`；RPC `get_my_mgmt_profile_v2`／`switch_my_mgmt_role_v2`。未知 key fail closed。Wave 1 **未**改 `current_app_role()`、**未**收緊 table RLS。

### 遷移（已採納）

每個 domain vertical slice：mapping → command 或 RLS → 撤舊 direct write → allow-deny。禁止先收緊多表 RLS、後補 command。第一批唔只收緊：finance 成本帳入帳要**放寬**。

### IA1（已簽：結構做完先搞 UI 入口）

側欄、nav、按鈕展示 **而家唔改**。P0-1／P0-2 先做完結構（capability kernel、profile v2、session、RLS／command、Auth 改讀 DB profile）。全部結構穩咗，先另包處理 UI 入口（邊啲 capability 出側欄／首頁）。

P0-2 期間：

- 授權只准 `can(profile.activeCapabilities, key)`（雙重確認用 `accountCapabilities`）
- **唔好**為咗對齊 DB 就打開管理層前台／收款／點名側欄
- **唔好**另建一套前端權限表去藏掣當保安
- 現有 `navStructure` 角色清單當暫時展示，直到「UI 入口」包開工

### Profile v2（P0-1 先凍結，交 P0-2）

- 欄位：`appUserId`、`email`、`displayName`、`activeRole`、`availableRoles`、`teacherId`、`activeCapabilities`、`accountCapabilities`、`authzVersion`
- `switch_my_mgmt_role_v2` 同一 RPC 回完整 profile
- `authz_version`：mapping／授予變更時加；client 唔一致就清 domain cache 再拉 profile
- 載入失敗 fail closed，唔回退 localStorage

