# 技術債／工程硬化

| 欄位 | 值 |
| --- | --- |
| 狀態 | `done`（2026-08-20；`authz_version=11`） |
| 優先 | 高 |
| 範圍 | 權限真源、RLS 讀寫分離（P0-1／P0-2）＋頁級守衛／Role 型收斂（P1-4） |
| 阻塞 | 無 |
| 不含 | **阿Po Edge session 帽**（本期不做，維持帳戶層 `mgmt_active_roles`）；**側欄／入口 IA1** [`nav-capability-entry.md`](./nav-capability-entry.md)；**主線品質閘（P0-3）** [`mainline-quality-gate.md`](./mainline-quality-gate.md)；**洩露密碼（P0-4）** [`auth-leaked-password-protection.md`](./auth-leaked-password-protection.md)；God files、計糧／總覽 perf、死碼清理、家長 Portal 前端 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 稽核 | [`2026-08-14-tech-debt-review.md`](../audits/2026-08-14-tech-debt-review.md) |
| Canvas | `tech-debt-audit.canvas.tsx` · `p0-1-authz-feature-roles.canvas.tsx` |
| 相關 | [`p0-1-authz-feature-roles.md`](./p0-1-authz-feature-roles.md)、[`nav-capability-entry.md`](./nav-capability-entry.md)（IA1）、[`mgmt-manager-role.md`](./mgmt-manager-role.md)、[`role-ops-hardening.md`](./role-ops-hardening.md)、[`RLS_ROLLOUT.md`](../../meta/RLS_ROLLOUT.md) |
| 記錄 | 2026-08-14 全盤檢視；2026-08-15 P0-2 agent 已接；2026-08-18 前端 actor 回退入 `main`；**2026-08-19 production 套 domain 1–7／session／波 5／stamp_actor（authz_version 10）**；同日 JWT 模擬煙霧；**同日 P0-2 前端實作清線**（service／`can()`／`RequireCapabilities`／老師 scope）及 production session row 核實；**2026-08-20 P0-2 入 main（PR #21）**；**同日合入 capability-only 頁守衛、session 清列、inbox／學號 counter／portal view-as（authz_version 11）**；**同日關帳**（阿Po Edge 本期不做；IA1 另題） |

## 目標（一句）

令「邊個可以改資料」以資料庫為準；唔再靠 localStorage 同側欄隱藏當權限。品質閘見 [`mainline-quality-gate.md`](./mainline-quality-gate.md)。

## 與既有主題關係

- manager 第一期已寫明：RLS 多數表仍 `FOR ALL`，**靠 UI＋守衛**；第二期再拆 reader／writer。finance 其後加入 `is_mgmt_staff()`，寫入面一併擴大。本主題承接該第二期，並補 finance。
- 頁守衛只 `RequireCapabilities`（2026-08-20 合入 `feat/p0-2-capability-only-pages`）。服務層寫入不再用 `getMgmtRole()`／`isSuperAdmin()` 當授權。側欄仍跟 `navStructure` 角色 → [`nav-capability-entry.md`](./nav-capability-entry.md)。
- 原稽核 P1-4（頁級守衛唔齊、舊 `Role` 型缺 manager／finance）同 P0-2 係同一角色真源問題，**併入本主題**，唔另開重複工程。
- 計糧慢、死碼、軟封存、2627 權益 live、**主線品質閘（P0-3）**：**唔併入本主題**。
- 原稽核 P0-4（Auth leaked password）：**已拆出** [`auth-leaked-password-protection.md`](./auth-leaked-password-protection.md)，唔再屬本主題波次。

## 開工前須拍板

1. 寫入矩陣：[`p0-1-authorization-decisions.md`](./p0-1-authorization-decisions.md)（已簽；U2 之後）。產品視圖（功能主欄）：[`p0-1-authz-feature-roles.md`](./p0-1-authz-feature-roles.md)。**2026-08-19 production 已套收緊 RLS**（domain 1–7＋延後表／session／波 5／stamp_actor；`authz_version` 10）。堂數池申請制另見 [`entitlement-correction-approval.md`](./entitlement-correction-approval.md)。
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

**前端實作已清並入 main（2026-08-20 PR #21）；頁內角色門已拆（同日合入 capability-only）。** Contract 已交（`get_my_mgmt_profile_v2`／`switch_my_mgmt_role_v2`／`src/lib/authzProfile.ts`）。Auth bootstrap／頁守衛讀 DB profile，失敗唔回退 localStorage。Service 寫入不再以 storage 角色作授權；寫入掣改 `can(profile.activeCapabilities, key)`；敏感路由只 `RequireCapabilities`。登出打 `clear_my_mgmt_session_role`；`auth.sessions` DELETE 同 profile ensure 會清過期列。計糧／讓房／排程／`teacherScope` 顯示及查詢範圍亦已改讀 `useAuth().profile`。**唔改 nav**（IA1 另題）。阿Po Edge 跟帳戶層 `mgmt_active_roles`：**本期不做**。

### 成因

角色有兩份：

- **真源（DB）**：`get_my_mgmt_profile_v2`／`current_app_role()` ← `mgmt_session_roles` + `app_user_roles`（無 `session_id` 的合成／舊測試 JWT 先走 legacy fallback）。
- **快取（瀏覽器）**：登入／切角色時 `applyProfileToStorage` 寫 `mgmt_role`、`teacher_id`。

`AuthProvider.role` 已係 `profile?.activeRole`（唔回退 storage）。頁面深連結改由 `RequireCapabilities` 守。服務層寫入已唔再 assert storage 角色（2026-08-19）：`publishSystemNotice`、刪點名、`updateAppUser`、新增老師、系統通知發佈改由 RLS／RPC 決定成敗。Inbox `actor_key` 改只打 `current_inbox_actor_key()`；feed／未讀數用 Auth `activeRole`＋`teacherId`。畫面寫入掣改 `can(activeCapabilities, key)`（學生詳情、點名紀錄、班／老師列表、用戶、優惠目錄、家長 Portal 邀請等）。

`PayrollView`、讓房兩頁、排程及所有 `teacherScope` caller 已改讀 Auth profile。`getMgmtRole()` 及舊角色 helper 僅留喺 `mgmtRole.ts` 作顯示快取／兼容，無 production caller 以此決定頁面、範圍或寫入。

呢套由 Base44 遷移期「前端角色即權限」留下來；RLS 上線後 UI 未改讀真源。

### 影響

單獨改 `localStorage.mgmt_role`：

- 可開 nav／頁守衛以外嘅畫面（外星人頁、收款頁）。
- **若 P0-1 未修**：部分寫入（系統通知、刪點名、改 `app_users`）只靠前端 assert，RLS 仍 `is_mgmt_staff()` 就會成功。
- **若 P0-1 已修**：多數變成半殘畫面＋API denied，仍困擾支援同稽核（inbox 已讀鍵錯亂；老師 `teacher_id` 可被改，查詢條件錯，RLS 會濾空或報錯）。

`Layout` 未登入閘用 `useAuth().role`（較好），同頁守衛不一致。

### 改善方案

P0-1 同 P0-2 要同一真源，否則只修一邊唔夠。實作順序：**先 P0-1，P0-2 等 contract**；唔好而家用角色守衛頂住，之後再拆。

1. `RequireMgmtRoles` 改讀 `useAuth().role`（bootstrap `ready` 前顯示載入，唔讀 storage）。**已做。**
2. 刪服務層授權用嘅 `getMgmtRole()`／`isAdminOrAlien()`；寫入失敗必須來自 RLS／RPC。前端旗標只藏掣。**已做**（2026-08-19）。
3. `AuthProvider.role` 唔回退 `getMgmtRole()`；session 無 profile 當未登入。**已做。**
4. 舊頁手寫 `localStorage.getItem("mgmt_role")` 收斂到同一守衛。`Role` 型補 manager／finance。**已做**：寫入掣用 `can()`；顯示／老師範圍用 Auth profile。
5. 對照 `App.tsx`、`NAV_STRUCTURE` 做 route-role 矩陣；所有敏感 deep-link 用同一 Auth-context 守衛，補 `/Courses`、`/Classes`、`/Students/:id`、`/EnrollmentChanges`、`/LessonBalanceMismatch` 等缺口。**已做**（2026-08-20：只 `RequireCapabilities`；過寬讀權改寫入／管理 key；**無改 nav**，IA1）。學生列表仍可把老師導去班別（產品分流，唔係雙重守衛）。
6. Inbox actor 改用 `app_users.id`（或現有 `current_inbox_actor_key()` DB 函式），唔用角色字串。**已做**（只打 RPC，唔 fallback storage）。
7. 保留 storage 只作顯示名／側欄摺疊；文件寫明「localStorage ≠ 權限」。**已做**（`mgmtRole.ts` 僅留顯示快取／兼容；production caller 已清）。
8. JWT 帶 `session_id`，令 `current_app_role()` 跟 `mgmt_session_roles`（雙角色如 Mark 預設帽）。**已確認**（2026-08-19）。登出／過期刪列：**已做**（2026-08-20；`clear_my_mgmt_session_role`＋`auth.sessions` DELETE trigger＋ensure 時 purge）。

---

## P0-3　主線無品質閘

**已拆出獨立討論方案：** [`mainline-quality-gate.md`](./mainline-quality-gate.md)。成因、沙盒清單、阿Po／GitHub 兩層、改善方案同待決唔再寫喺本檔。

---

## 建議波次

| 波 | 做 | 依賴 |
| --- | --- | --- |
| A | P0-1 capability kernel＋按域收緊 RLS／command | **production 已套**（2026-08-19；`authz_version` 10） |
| B | P0-2＋P1-4 Auth 真源、頁級守衛、Role 型收斂 | **已入 main**（2026-08-20 PR #21）＋頁守衛收斂。JWT `session_id` 已核實。nav 另包（IA1）。阿Po Edge 本期不做 |

---

## P0-1 production 上線檢查（2026-08-19 已套）

Production 而家：`authz_version = 11`（2026-08-20 closeout）。財務 JWT 改學生／排程／點名應 denied。側欄仍未改（IA1 另題）。

### 套之前

- [x] 產品確認可以收緊 production RLS（2026-08-19）
- [x] 前端 actor 回退已上 production（使用者確認無未 pull 之 request）
- [x] 禁 `supabase db push`；一次一檔 `npm run db:apply -- <檔>`（見 [`SUPABASE_MIGRATION_APPLY.md`](../../meta/SUPABASE_MIGRATION_APPLY.md)）
- [x] JWT 模擬煙霧（2026-08-19；production impersonation，非真人畫面）：見下方結果
- [ ] 真人畫面走一輪（可選；側欄仍未改 IA1）

### 套用順序（一次一檔）

| 序 | 檔 | 內容 |
| --- | --- | --- |
| 1 | `20260815102532_p0_1_system_users_roles.sql` | 系統通知／用戶／角色 |
| 2 | `20260815104533_p0_1_students_classes.sql` | 學生／班／報讀 |
| 3 | `20260815225314_p0_1_schedule_attendance_leave.sql` | 排程／出席／請假 |
| 4 | `20260815230456_p0_1_payments_entitlements.sql` | 付款／作廢 command／堂數池 |
| 5 | `20260815230459_p0_1_payroll_expenses.sql` | 計糧／成本帳 |
| 6 | `20260816000753_p0_1_remaining_ops.sql` | 校曆／檔期／課程／老師目錄 |
| 7 | `20260816000756_p0_1_session_role.sql` | JWT 有 `session_id` 走 session role；Supabase Auth token 原生必帶，production 已核實 |
| 8 | `20260816084500_p0_1_wave5_cleanup.sql` | 其餘表 |
| 9 | `20260816090000_p0_1_stamp_actor.sql` | 稽核／報錯／收件匣 actor 蓋印 → `authz_version` 10 |

每檔之後：該域一個成功寫入＋一個應 denied（至少財務改 `students`）。出事就停，唔好繼續下一檔。

### 套完煙霧（前線）

2026-08-19 production JWT 模擬（`SET ROLE authenticated`＋JWT `sub`；寫入列已刪）。能力鍵 58／58。無獨立管理層登入；Mark 預設帽 `teacher`，測試時短暫切 `manager` 已還原。

| 清單 | 結果 |
| --- | --- |
| 行政：開學生、排程、出單／確認收款 | 開學生（8 位學號，同畫面）可 INSERT；26SM 加一節遠期額外堂可 INSERT 已刪。`payments.create`／`mark_received` 有；財務出單 denied。未實開學費單。 |
| 管理層：同上＋成本帳確認 | 可讀成本帳；確認一筆財務剛入帳之測試列成功，已刪。 |
| 財務：計糧寫入、入帳；不可改學生／排程／點名 | `payroll.prepare`／`review` 有；行政開計糧月份 denied。入帳（pending）可；確認 denied。UPDATE／INSERT 學生、排程、點名、付款全 denied。請假 0 列。 |
| 老師：自己班點名、收件匣 | `attendance.take` 有；老師 INSERT 出席政策仍在。26SM 排程 25／718。收件匣 3 則。改排程 `remarks` → `TEACHER_SCHEDULE_UPDATE_DENIED`。未實點名（避免扣堂）。 |
| 外星人：系統通知、用戶 | `system_notice.publish`／`users.manage` 有；`app_users` 可讀 25 列。 |
| 收件匣職員開得；新報錯有用戶／角色 | 行政／管理層／財務／外星人收件匣 151；老師 3。報錯 INSERT（無 RETURNING）行政／財務／老師可寫；stamp 蓋角色＋稱呼（客戶端假 role 會被蓋掉）。報錯 SELECT 仍僅 `audit.read_all`（管理層／外星人）。 |
| `26SM` 點名紙／請假／收款仍可用 | 58 班、718 堂。行政／財務／管理層／外星人全見；老師範圍 25。請假 64（財務 0，符合無 `leaves.read`）。付款 68（老師 0）。 |

未做：真人登入畫面；財務未開新計糧月份；老師未實寫出席。

發現（已收，2026-08-20）：`student_code_counters` 補 `students.create` 的 SELECT／INSERT／UPDATE 政策；空白學號 autocode 可過。

### 刻意未做／已拆出

- 老師目錄無獨立 capability（暫跟 `classes.update`）
- 真人畫面走一輪；真人雙裝置不同帽尚未驗收（可選；session 列及 JWT `session_id` 已核實）
- **阿Po Edge 跟帳戶層 `mgmt_active_roles`：本期不做**（唔另開題）
- 側欄／入口（IA1）→ [`nav-capability-entry.md`](./nav-capability-entry.md)

已收（2026-08-20）：inbox ops／已讀／portal view-as；頁內角色雙重門；登出／過期清 `mgmt_session_roles`；`student_code_counters` 政策。

P0-3 見 [`mainline-quality-gate.md`](./mainline-quality-gate.md)。  
原 P0-4 見 [`auth-leaked-password-protection.md`](./auth-leaked-password-protection.md)。  
P1-4 已併入本主題；其餘 P1–P3 見 [稽核清單](../audits/2026-08-14-tech-debt-review.md) 的 backlog 歸屬。
