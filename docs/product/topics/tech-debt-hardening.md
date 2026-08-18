# 技術債／工程硬化

| 欄位 | 值 |
| --- | --- |
| 狀態 | `in_progress`（P0-1 kernel 已喺 production；**P0-2 Auth 改讀 profile v2**；未收緊 production RLS） |
| 優先 | 高 |
| 範圍 | 權限真源、RLS 讀寫分離（P0-1／P0-2）＋頁級守衛／Role 型收斂（P1-4） |
| 阻塞 | **P0-2＋P1-4**：profile v2／catalog／switch RPC 已喺 production；Auth 改讀 DB profile（進行中）。**唔改 nav**（IA1）。未收緊 production RLS 前，前端守衛仍只係 UX。P0-3（CI）唔等 P0-1。 |
| 不含 | **主線品質閘（P0-3）** [`mainline-quality-gate.md`](./mainline-quality-gate.md)；**洩露密碼（P0-4）** [`auth-leaked-password-protection.md`](./auth-leaked-password-protection.md)；God files、計糧／總覽 perf、死碼清理、家長 Portal 前端 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 稽核 | [`2026-08-14-tech-debt-review.md`](../audits/2026-08-14-tech-debt-review.md) |
| Canvas | `tech-debt-audit.canvas.tsx` |
| 相關 | [`mgmt-manager-role.md`](./mgmt-manager-role.md)（RLS 第二期已知債）、[`role-ops-hardening.md`](./role-ops-hardening.md)（UI 守衛已做、DB 寫入未拆）、[`RLS_ROLLOUT.md`](../../meta/RLS_ROLLOUT.md) |
| 記錄 | 2026-08-14 全盤檢視；2026-08-15 P0-2 agent 已接、等 P0-1 contract；2026-08-18 production 未套 stamp_actor，前端報錯／稽核／收件匣改回自行寫入 actor |

## 目標（一句）

令「邊個可以改資料」以資料庫為準；唔再靠 localStorage 同側欄隱藏當權限。品質閘見 [`mainline-quality-gate.md`](./mainline-quality-gate.md)。

## 與既有主題關係

- manager 第一期已寫明：RLS 多數表仍 `FOR ALL`，**靠 UI＋守衛**；第二期再拆 reader／writer。finance 其後加入 `is_mgmt_staff()`，寫入面一併擴大。本主題承接該第二期，並補 finance。
- `RequireMgmtRoles`（role-ops P1-5）已改讀 `useAuth().role`；服務層仍有 `getMgmtRole()` 當授權（P0-2 未清）。
- 原稽核 P1-4（頁級守衛唔齊、舊 `Role` 型缺 manager／finance）同 P0-2 係同一角色真源問題，**併入本主題**，唔另開重複工程。
- 計糧慢、死碼、軟封存、2627 權益 live、**主線品質閘（P0-3）**：**唔併入本主題**。
- 原稽核 P0-4（Auth leaked password）：**已拆出** [`auth-leaked-password-protection.md`](./auth-leaked-password-protection.md)，唔再屬本主題波次。

## 開工前須拍板

1. 寫入矩陣：[`p0-1-authorization-decisions.md`](./p0-1-authorization-decisions.md)（已簽；U2 之後）。kernel 已喺 production；**收緊 RLS 只喺 mainhope-staging**（domain 1–7＋延後表／session／波 5 其餘表／actor 蓋印已過 allow-deny；authz_version 10）。未確認前勿 `db:apply` 去 production。前端報錯／稽核／收件匣喺 trigger 未上線前自行寫入 actor（RPC 無 key 時職員 fallback `staff:{role}:{name}`）。堂數池申請制另見 [`entitlement-correction-approval.md`](./entitlement-correction-approval.md)。
2. 家長 Portal 前端是否另開調查（本 repo 無 Portal UI）。
3. P1-4 已併入；其餘 P1–P3 按 backlog 分題處理。

---

## P0-1　DB 權限粗過 UI 角色

### 成因

Phase B／C 用 `is_mgmt_staff()` 當「後台職員」一把刀：多數營運表 `FOR ALL` 或 INSERT+UPDATE。當時職員只有 admin／alien（另加 teacher 窄政策）。

之後兩次擴角色**只改 helper、唔拆政策**：

- `20260801020000`：`is_mgmt_staff` 加入 manager。文件寫第一期「視同職員可讀寫；第二期再收緊」。
- `20260804183000`：再加入 finance。註解寫 finance 可**讀**職員營運資料、UI 收窄至計糧／繳費核對。RLS 政策仍係 `is_mgmt_staff()`，所以 finance 拿到同一把寫入刀。

前端破壞性改用 `isAdminOrAlien()`（正確方向），但只擋畫面。Anon 已被 Phase A 擋住；老師寫入已收窄。洞喺 **已登入嘅 manager／finance JWT**。

2026-08-14 production `pg_policies` 實測：`students`、`classes`、`schedules`、`attendance_details` 對 mgmt 係 ALL；`payments`／`payment_details` 係 SELECT+INSERT+UPDATE。`qual`／`with_check` 皆 `is_mgmt_staff()`。

### 影響

需要有效 finance 或 manager 登入（唔係公開漏洞）。該 JWT 可經 REST／SQL 繞過 UI：

- 改／刪學生、班別、排程
- 寫付款同明細（finance 產品意圖可能只核對）
- 寫點名（finance 產品：只核對、不點名）
- 寫 `inbox_events`（系統通知前端標「僅外星人」，RLS 准所有 mgmt insert）

風險形態：誤操作、離職員工、被盜嘅職員 session、之後有人以為「側欄冇掣＝API 唔得」。`void-payment` 等 edge 有獨立檢查，但表級 RLS 無跟。

### 改善方案

**先簽收寫入矩陣，再 migration。** 產品階層已改：`alien` ⊇ `manager` ⊇ `admin`（讀＋寫）；下表「manager 破壞性否」作廢，以 [決策稿](./p0-1-authorization-decisions.md) 為準。歷史建議預設（僅備查）：

| 表／操作 | admin | manager | finance | alien | teacher |
| --- | --- | --- | --- | --- | --- |
| 營運表 SELECT | ✓ | ✓（≥ admin） | ✓（核對所需） | ✓ | 現有窄政策 |
| 學生／班／排程／點名 寫入 | ✓ | 監督項另列；破壞性否 | 否 | ✓ | 現有窄政策 |
| 付款 INSERT／UPDATE | ✓ | 否（繳費紀錄唯讀） | **待決**：計糧過帳 vs 學費單 | ✓ | 否 |
| 系統通知／用戶／優惠目錄 | 否或只讀 | 否 | 否 | ✓ | 否 |

技術步驟（簽收後）：

1. 新增 `is_mgmt_writer_*` 或按表 `is_admin() OR is_alien()`；SELECT 留 `is_mgmt_staff()`。
2. 把 `rls_phase_b_mgmt_all_*` 拆成 SELECT policy + 寫入 policy。一次一組表，先付款／學生／點名／排程。
3. 用 finance JWT 回歸：UI 核對頁仍可讀；直接 `from('students').update` 應 denied。
4. 唔好用擴張 `is_mgmt_staff()` 去擋寫入——呢個就係而家嘅錯。

---

## P0-2　前端守衛讀 localStorage，唔係 Auth

**進行中。** Contract 已交（`get_my_mgmt_profile_v2`／`switch_my_mgmt_role_v2`／`src/lib/authzProfile.ts`）。第一刀：Auth bootstrap／頁守衛改讀 DB profile，失敗唔回退 localStorage；**唔改 nav**。`RequireCapabilities`、清晒 service 層 `getMgmtRole()` 授權檢查、JWT `session_id` 其後。過夜續：[`2026-08-15-p0-authz-p0-2-session.md`](../../meta/handoffs/2026-08-15-p0-authz-p0-2-session.md)（開局仍有效；「未交 contract 唔改 Auth」已過時）。

### 成因

角色有兩份：

- **真源（DB）**：`get_my_mgmt_profile`／`current_app_role()` ← `mgmt_active_roles` + `app_user_roles`。
- **快取（瀏覽器）**：登入／切角色時 `applyProfileToStorage` 寫 `mgmt_role`、`teacher_id`。

`AuthProvider.role` 已係 `profile?.activeRole`（唔回退 storage）。`RequireMgmtRoles` 已讀 AuthContext。服務層同部分畫面仍用 `getMgmtRole()`／storage 當授權旗標。

服務層把 storage 當授權：`publishSystemNotice`、`deleteAttendanceDetailAsMgmt`（註明「非 Auth」）、`updateAppUser` 的 `isSuperAdmin()`。Inbox `actor_key` 用 `staff:{role}:{name}`，改 storage 會寫錯已讀。

呢套由 Base44 遷移期「前端角色即權限」留下來；RLS 上線後 UI 未改讀真源。

### 影響

單獨改 `localStorage.mgmt_role`：

- 可開 nav／頁守衛以外嘅畫面（外星人頁、收款頁）。
- **若 P0-1 未修**：部分寫入（系統通知、刪點名、改 `app_users`）只靠前端 assert，RLS 仍 `is_mgmt_staff()` 就會成功。
- **若 P0-1 已修**：多數變成半殘畫面＋API denied，仍困擾支援同稽核（inbox 已讀鍵錯亂；老師 `teacher_id` 可被改，查詢條件錯，RLS 會濾空或報錯）。

`Layout` 未登入閘用 `useAuth().role`（較好），同頁守衛不一致。

### 改善方案

P0-1 同 P0-2 要同一真源，否則只修一邊唔夠。實作順序：**先 P0-1，P0-2 等 contract**；唔好而家用角色守衛頂住，之後再拆。

1. `RequireMgmtRoles` 改讀 `useAuth().role`（bootstrap `ready` 前顯示載入，唔讀 storage）。
2. 刪服務層授權用嘅 `getMgmtRole()`／`isAdminOrAlien()`；寫入失敗必須來自 RLS／RPC。前端旗標只藏掣。
3. `AuthProvider.role` 唔回退 `getMgmtRole()`；session 無 profile 當未登入。
4. 舊頁手寫 `localStorage.getItem("mgmt_role")` 收斂到同一守衛。`Role` 型補 manager／finance。
5. 對照 `App.tsx`、`NAV_STRUCTURE` 做 route-role 矩陣；所有敏感 deep-link 用同一 Auth-context 守衛，補 `/Courses`、`/Classes`、`/Students/:id`、`/EnrollmentChanges`、`/LessonBalanceMismatch` 等缺口。
6. Inbox actor 改用 `app_users.id`（或現有 `current_inbox_actor_key()` DB 函式），唔用角色字串。
7. 保留 storage 只作顯示名／側欄摺疊；文件寫明「localStorage ≠ 權限」。

---

## P0-3　主線無品質閘

**已拆出獨立討論方案：** [`mainline-quality-gate.md`](./mainline-quality-gate.md)。成因、沙盒清單、阿Po／GitHub 兩層、改善方案同待決唔再寫喺本檔。

---

## 建議波次

| 波 | 做 | 依賴 |
| --- | --- | --- |
| A | P0-1 capability kernel＋按域收緊 RLS／command | 寫入矩陣已簽。**kernel 已喺 production**；收緊 RLS／蓋印見下方「production 上線檢查」，未確認唔套 |
| B | P0-2＋P1-4 Auth 真源、頁級守衛、Role 型收斂 | profile v2 已交；Auth 已讀 DB profile；其餘（清 service `getMgmtRole`、`RequireCapabilities`、JWT `session_id`）進行中。nav 另包（IA1） |

---

## P0-1 production 上線檢查（未確認＝唔套）

Production 而家：`authz_version = 1`；已套 `20260814230815` kernel。**未套** domain 1–7／延後表／session 角色／波 5／stamp_actor。  
`26SM` 報讀／點名／學費路徑唔改；改嘅係「邊個角色可以寫邊張表」。財務而家 JWT 仍可經 API 改學生／排程／點名；套咗就會 denied。

### 套之前

- [ ] 產品確認可以收緊 production RLS（本閘未解除＝停）
- [ ] 前端 actor 回退已上 production（報錯／稽核寫入用戶角色；收件匣 RPC 無 key 時 `staff:{role}:{name}`）。已入 main，**未 deploy 就套 stamp_actor，職員收件匣會再爆**
- [ ] 禁 `supabase db push`；一次一檔 `npm run db:apply -- <檔>`（見 [`SUPABASE_MIGRATION_APPLY.md`](../../meta/SUPABASE_MIGRATION_APPLY.md)）
- [ ] 預備角色帳號做 allow-deny：行政、管理層、財務、老師、外星人

### 套用順序（一次一檔）

| 序 | 檔 | 內容 |
| --- | --- | --- |
| 1 | `20260815102532_p0_1_system_users_roles.sql` | 系統通知／用戶／角色 |
| 2 | `20260815104533_p0_1_students_classes.sql` | 學生／班／報讀 |
| 3 | `20260815225314_p0_1_schedule_attendance_leave.sql` | 排程／出席／請假 |
| 4 | `20260815230456_p0_1_payments_entitlements.sql` | 付款／作廢 command／堂數池 |
| 5 | `20260815230459_p0_1_payroll_expenses.sql` | 計糧／成本帳 |
| 6 | `20260816000753_p0_1_remaining_ops.sql` | 校曆／檔期／課程／老師目錄 |
| 7 | `20260816000756_p0_1_session_role.sql` | JWT 有 `session_id` 先唔 fallback；**而家 App 無 claim 仍走舊路** |
| 8 | `20260816084500_p0_1_wave5_cleanup.sql` | 其餘表 |
| 9 | `20260816090000_p0_1_stamp_actor.sql` | 稽核／報錯／收件匣 actor 蓋印 → `authz_version` 10 |

每檔之後：該域一個成功寫入＋一個應 denied（至少財務改 `students`）。出事就停，唔好繼續下一檔。

### 套完煙霧（前線）

- 行政：開學生、排程、出單／確認收款
- 管理層：同上＋成本帳確認
- 財務：計糧寫入、入帳；**唔可以**改學生／排程／點名
- 老師：自己班點名、收件匣
- 外星人：系統通知、用戶
- 收件匣職員開得；新報錯有用戶／角色
- `26SM` 點名紙／請假／收款仍可用（舊路徑）

### 刻意未做（唔當漏套）

- inbox 營運／已讀／portal view-as 仍 `is_mgmt_staff`（staging 都未收）
- 老師目錄無獨立 capability（暫跟 `classes.update`）
- JWT 未帶 `session_id`（P0-2）
- 側欄／入口（IA1）

P0-3 見 [`mainline-quality-gate.md`](./mainline-quality-gate.md)。  
原 P0-4 見 [`auth-leaked-password-protection.md`](./auth-leaked-password-protection.md)。  
P1-4 已併入本主題；其餘 P1–P3 見 [稽核清單](../audits/2026-08-14-tech-debt-review.md) 的 backlog 歸屬。
