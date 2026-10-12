# A2 資料與權限

| 欄位 | 值 |
| --- | --- |
| 工作狀態 | 已完成 |
| 日期 | 2026-10-09 |
| 父檔 | [`../2026-10-09-structure-review.md`](../2026-10-09-structure-review.md) |

## 結論

瀏覽器只建立 anon key 客戶端。敏感頁由 `RequireCapabilities` 讀登入後的 capability，服務層寫入不再用 `getMgmtRole()` 或 `isSuperAdmin()` 決定成敗。production 公開表都已啟用 RLS，沒有 anon 政策；抽樣的作廢與點名扣堂函式在函式內檢查 capability。

殘餘集中在兩處。加堂名單查詢失敗會被畫成空陣列，儲存時會把這份空名單寫進排程。廣告試堂與查詢科目的提交函式仍授予 `anon`，可繞過 Edge 的人機驗證；限速鍵由呼叫者傳入，可輪換。AI 對話回饋表對所有已登入身份使用 `using (true)`。家長自填、試堂邀請與前台填表連結仍是憑 token 的公開寫入，與後台審批函式分開，這次沒有發現公開頁呼叫後台寫入函式。

## 未查範圍

已用 Supabase MCP 對 `MainHope_production`（`gudmbilboyhouotilrvt`）做唯讀對照：security advisors、公開表 RLS、上述函式的執行權、`private.authz_meta.authz_version`（14，更新時間 2026-10-06 18:28 UTC）、計糧 capability、`apo_chat_feedback` 欄位與表權限。沒有冒充 JWT，沒有讀取學生、繳費或對話列內容。

未讀 Edge 環境變數，因此不能判斷 `TURNSTILE_SECRET_KEY` 是否已設定（見 A2-06）。Staging `mainhope-staging` 為 INACTIVE，未查。沒有逐支檢查全部 `SECURITY DEFINER` 函式本體，只抽作廢、點名扣堂與公開提交。未在瀏覽器走公開表單。

## 問題

### A2-01 廣告提交函式仍可由未登入身分直接呼叫

- 嚴重度：中
- 狀態：新發現
- 分類：公開寫入
- 觀察：畫面提交已改走 Edge `ad-public-submit`。資料庫裡 `ad_trial_submit` 與 `ad_trial_interest_submit` 仍授予 `anon` 與 `authenticated`。函式把呼叫者傳入的 `p_rate_client_key` 當成限速鍵；鍵為空才改用請求來源。換一把新鍵即可避開個別限速，全站每小時接受上限仍是 200。人機驗證只在 Edge。migration 註明正式只走 Edge 後應撤銷這兩支的 `anon` 執行權，工作樹尚未有後續撤銷。功輔寫入函式（`ad_homework_details_submit`、`ad_homework_attach_date`、`ad_homework_trial_submit`）在 production 不授予 `anon`，不在此條。
- 依據：`src/services/adTrialQueries.ts` 第 143–145 行只呼叫 Edge；`supabase/migrations/20260925151000_ad_public_forms_hardening.sql` 第 347、378–380、685–695 行仍 `grant execute … to anon`；同檔第 89–90 行採用呼叫者提供的限速鍵；第 123–129 行全站上限 200。production advisors（2026-10-09）仍列出這兩支可由 `anon` 執行。
- 影響：知道 anon key 的人可以不經人機驗證寫入廣告來源的潛在客戶。這不是學費或點名表的直寫，但收件佇列可被灌入。
- 建議：確認畫面已全部改走 Edge 後，撤銷 `anon` 與 `authenticated` 對這兩支提交函式的執行權，只留 `service_role`。限速鍵改由伺服器決定，不要接受呼叫者傳入。
- 既有分題：無。`docs/product/topics/database-contract-advisor-hygiene.md` 表頭 `open`，該題寫明 token 類 RPC 禁止撤銷 `anon`；此條是 Edge 上線後仍未收的提交函式，不是該題禁止名單。

### A2-02 加堂名單查詢失敗會被當成沒有學生

- 嚴重度：高
- 狀態：新發現
- 分類：失敗被顯示成零或空陣列
- 觀察：勾選加堂後，就讀生名單查詢若失敗，畫面把候選與已選都設成空陣列，並把載入狀態設為完成。儲存時把這份 `addRosterIds` 傳給新增排程。按鈕在名單仍在載入時也可以按，此時已選同樣是空陣列。
- 依據：`src/components/schedule/ScheduleManagePage.tsx` 第 757–768 行（失敗分支）、第 1283–1289 行（`rosterStudentIds: addExtra ? addRosterIds : undefined`）。儲存按鈕在第 2793 行，只在 `addSaving` 時停用。
- 影響：網路或權限錯誤會變成「這班加堂沒有學生」。儲存後點名紙可能少人，其後出席與扣堂跟著這份空名單。
- 建議：失敗時顯示錯誤並禁止儲存；名單未載入完成時停用儲存。不要把 catch 結果當成空名單。
- 既有分題：無。

### A2-03 老師時段衝突查詢失敗會被當成沒有衝突

- 嚴重度：中
- 狀態：新發現
- 分類：失敗被顯示成零或空陣列
- 觀察：新增排程時，老師同時段衝突查詢失敗會把衝突列表設成空陣列。畫面上只有列表長度大於 0 才顯示提示，而且提示寫明仍可繼續儲存。失敗與「確實沒有衝突」看起來一樣。
- 依據：`src/components/schedule/ScheduleManagePage.tsx` 第 740–741 行；提示在第 2767–2786 行。
- 影響：這次不會直接改堂數或金額。職員可能在查詢失敗時看不到已有排程，仍儲存重疊課堂。產品原本就允許在看見衝突後繼續儲存，所以尚未證實已經寫錯。
- 建議：失敗時顯示錯誤，不要顯示成零筆衝突。
- 既有分題：無。

### A2-04 前台建立學生時，學號查詢失敗會被當成空清單

- 嚴重度：中
- 狀態：新發現
- 分類：失敗被顯示成零或空陣列
- 觀察：前台精靈載入全部學生以計算下一個學號。查詢失敗時不顯示錯誤，改以空陣列計算。空清單的規則是從 `00000001` 起算。學生編號有唯一索引，正式寫入應被拒絕，但畫面已把錯誤學號填進表單。新增學生對話框在同一類失敗時改填空白，兩邊不一致。
- 依據：`src/components/frontDesk/steps/RegisterStudentStep.tsx` 第 136–142 行；`src/lib/studentCode.ts` 第 30–31、35–45 行；`supabase/migrations/20260423113000_students_student_code_unique.sql` 第 9 行。對照 `src/components/students/AddStudentDialog.tsx` 第 146–151 行（失敗時設成空字串）。
- 影響：職員可能依錯誤學號繼續建立學生。唯一索引應擋住與現有編號衝突的寫入，所以尚未證實已經寫入重複學號。錯誤被吞掉，職員看不到查詢失敗。
- 建議：失敗時不要計算學號，並顯示錯誤。與新增學生對話框同一套失敗處理。
- 既有分題：無。

### A2-05 已登入用戶可讀寫全部 AI 對話回饋

- 嚴重度：中
- 狀態：新發現
- 分類：RLS 與 migration
- 觀察：`apo_chat_feedback` 對 `authenticated` 的政策是 `for all`、`using (true)`、`with check (true)`。production 上 `anon` 與 `authenticated` 都有 SELECT、INSERT、UPDATE、DELETE、TRUNCATE。沒有 anon 政策，未登入走 RLS 預設拒絕。已登入的任何身份，包括專科班老師，可以讀取、修改、刪除全部列。客戶端只做插入，且失敗只寫主控台。列裡有 `user_message` 與 `assistant_message`。這次沒有讀取列內容。
- 依據：`supabase/migrations/20260708130000_apo_chat_feedback.sql` 第 16–24 行；`src/services/apoChatQueries.ts` 第 160–172 行。production `pg_policies` 與 `information_schema.role_table_grants`（2026-10-09 唯讀）與上述政策、以及超出 migration GRANT 的表權限相符。
- 影響：對話文字可被其他已登入身份讀走或刪掉。這不是學費或點名表。PostgREST 不提供 TRUNCATE，實際缺口是 select／insert／update／delete。
- 建議：改成只允許插入自己的回饋；不要用 `using (true)` 開放全部列。收斂表權限，不要留 TRUNCATE。
- 既有分題：無。

### A2-06 Edge 未設定人機驗證密鑰時會直接通過

- 嚴重度：高
- 狀態：待查
- 分類：公開寫入
- 觀察：`verifyTurnstile` 在讀不到 `TURNSTILE_SECRET_KEY` 時回傳成功。廣告試堂、查詢科目與功輔第一步都靠這個結果擋提交。功輔第二步 `homework_date` 本身略過驗證。這次沒有讀取 Edge 環境變數，不能判斷密鑰是否已設定。
- 依據：`supabase/functions/ad-public-submit/index.ts` 第 54–58 行（無密鑰則通過）、第 182–186 行（`homework_date` 不驗證）。
- 影響：若正式環境沒有密鑰，公開提交只剩資料庫限速與蜜罐。與 A2-01 疊加時，直接呼叫提交函式本來就不經這段驗證。
- 建議：向負責部署的人確認 production Edge 已設定密鑰。未設定前不要把「已有人機驗證」當成公開寫入的屏障。
- 既有分題：無。

## 低優先

### A2-07 新 trigger 函式仍可由 anon 執行

- 嚴重度：低
- 狀態：已有分題
- 分類：RLS 與 migration
- 觀察：`forbid_grade_scope_pool_on_mixed_class` 與 `leads_sync_interested_subjects_on_convert` 使用 `CREATE OR REPLACE`，沒有再 `REVOKE`。production 上 `anon` 與 `authenticated` 都可執行。兩者都是 trigger，本體使用 `NEW`；經 RPC 直接呼叫時沒有列資料，預期會失敗，不是一條可寫入學籍的路徑。
- 依據：`supabase/migrations/20261007044500_forbid_mixed_class_grade_scope_pools.sql` 第 7–46 行；`supabase/migrations/20260927032100_leads_sync_interested_subjects_trigger.sql` 第 7–28 行。advisors（2026-10-09）兩支皆在 `anon_security_definer_function_executable`。
- 影響：多兩則 advisor 警告。未見可繞過權益池檢查去改餘額。
- 建議：沿既有分題補 idempotent `REVOKE EXECUTE`，不要用 `CREATE OR REPLACE` 把執行權還原。
- 既有分題：`docs/product/topics/database-contract-advisor-hygiene.md` 表頭 `open`。該題已寫明 `CREATE OR REPLACE` 會還原 `PUBLIC` 執行權；這兩支是其後新增的殘餘。

### A2-08 `leads_set_updated_at` 未固定 search_path

- 嚴重度：低
- 狀態：已有分題
- 分類：RLS 與 migration
- 觀察：security advisor 仍有一則 `function_search_path_mutable`，對象是 `public.leads_set_updated_at`。該題先前點名的八支 invoker 已在 2026-08-29 覆核時釘上 `search_path`。
- 依據：advisors（2026-10-09）`function_search_path_mutable` 僅餘此函式。分題對照見 `docs/product/topics/database-contract-advisor-hygiene.md`「8 支 INVOKER 未釘 search_path」。
- 影響：搜尋路徑可被呼叫者影響的面很窄，這次沒有看到它改寫學費或出席。
- 建議：併入該題下一條 idempotent migration，只 `ALTER FUNCTION … SET search_path`。
- 既有分題：`docs/product/topics/database-contract-advisor-hygiene.md` 表頭 `open`。

### A2-09 洩露密碼保護仍關閉

- 嚴重度：低
- 狀態：已有分題
- 分類：角色真源
- 觀察：security advisor 仍報 `auth_leaked_password_protection`。這項是 Auth 設定，不是表政策。
- 依據：advisors（2026-10-09）；`docs/meta/RLS_ROLLOUT.md` 收尾第 172 行仍未勾選。
- 影響：弱密碼或已外洩密碼仍可通過註冊檢查。不改變現有 RLS。
- 建議：維持該題，在 Dashboard 開啟，不要在這次結構檢視改設定。
- 既有分題：`docs/product/topics/auth-leaked-password-protection.md` 表頭 `open`。

### A2-10 最近繳費學生查詢失敗會被當成沒有人

- 嚴重度：低
- 狀態：新發現
- 分類：失敗被顯示成零或空陣列
- 觀察：收款頁載入最近繳費學生失敗時，改成空陣列。這份清單只用於搜尋學生時的排序，不參與金額計算。同一段的學生與優惠查詢失敗仍會顯示錯誤。
- 依據：`src/components/payments/PaymentsPageView.tsx` 第 508–515 行；用途在 `src/components/students/StudentSearchableSelect.tsx` 第 93 行。
- 影響：最近繳過費的學生可能不排到前面。不會把學費算成 0。
- 建議：這一段失敗時保持上一次結果或顯示錯誤，不要當成空清單。
- 既有分題：無。

### A2-11 已無呼叫者的學年函式仍讀瀏覽器角色旗標

- 嚴重度：低
- 狀態：新發現
- 分類：角色真源
- 觀察：`isHistoryYearReadOnly` 仍用 `getMgmtRole()`，工作樹沒有其他呼叫者。開班用的 `filterAcademicYearOptionsForEdit` 已不再依角色過濾。服務層寫入沒有呼叫 `getMgmtRole()` 或 `isSuperAdmin()`。
- 依據：`src/lib/mgmtRole.ts` 第 147–148 行。全庫搜尋僅此定義。
- 影響：目前不會改任何寫入結果。留下「瀏覽器旗標仍能擋歷史學年」的錯覺。
- 建議：刪除或改成不再讀 `localStorage`。不要把這個旗標補回授權路徑。
- 既有分題：`docs/product/topics/tech-debt-hardening.md` 表頭 `done`（2026-08-20）。該題寫服務層已不再用 storage 授權；此函式是沒有呼叫者的殘餘，不構成該題未關閉。

低優先筆數：5。

## 移交

- A1：`ScheduleManagePage` 同時擁有衝突檢查、加堂名單與儲存；A2-02、A2-03 的失敗語意在本軸，檔案是否應拆開由 A1 判斷。
- A5：`docs/meta/RLS_ROLLOUT.md` 仍寫 Phase C 進行中；`docs/product/topics/tech-debt-hardening.md` 寫 `authz_version=11`。production 唯讀結果是 14。工作樹未追蹤的 `supabase/migrations/20261006182706_manager_payroll_p1_p6.sql` 會把版本設為 14，與遠端一致，但文件未跟上。
- A4：`/AdminOps` 在 capability 之外再用 `useAuth().role === "admin"` 收窄（`src/pages/AdminOpsAssistant.tsx` 第 10 行）。這是畫面閘，不是資料庫授權。

## 已排除

- 服務層授權不再讀瀏覽器角色旗標。`getMgmtRole`／`isSuperAdmin` 的生產呼叫只剩 `src/lib/mgmtRole.ts` 自身；煙霧測試的 mock 在 `src/services/enrollmentEntitlement2627.smoke.test.ts`、`src/services/lifecycleOrphanA1.smoke.test.ts`。頁面守衛讀 `profile.activeCapabilities`（`src/components/auth/RequireCapabilities.tsx` 第 12–17 行；`src/lib/authBootstrap.tsx` 第 92 行 `role` 來自 profile）。對照 `docs/product/topics/tech-debt-hardening.md` 表頭 `done`、`docs/product/topics/p0-1-authorization-redesign.md` 表頭 `done`。
- 瀏覽器客戶端只用 anon key：`src/lib/supabaseClient.ts` 第 4–10 行。`service_role` 出現在 Edge 與 Node 煙霧測試，沒有打進瀏覽器客戶端。
- 公開表 RLS 已啟用。production 沒有 `anon` 政策。RLS 開啟且沒有政策的公開表為 `ad_public_rate_events`、`class_restructure_audit_logs`、`mgmt_active_roles`、`tmp_students_import`、`weekday_aliases`，與 `docs/product/topics/database-contract-advisor-hygiene.md` 接受清單一致；`ad_public_rate_events` 在 `supabase/migrations/20260925151000_ad_public_forms_hardening.sql` 第 25 行撤銷表權限，刻意拒絕直讀。
- 憑 token 的公開寫入仍應留給 `anon`：`contact_update_get`／`contact_update_submit`、`front_desk_intake_get`／`front_desk_intake_submit`、`trial_invite_get`／`trial_invite_submit`、`peek_portal_invite`。`contact_update_submit` 會拒絕過短 token（`supabase/migrations/20260804120000_contact_update_tokens.sql` 第 242–244 行）。advisor 對這些函式的警告是預期，不要撤銷。
- 公開頁與後台共用模組，但公開元件沒有呼叫後台寫入。`ContactUpdatePublicForm` 從 `studentQueries` 只引入電話與聯絡常數（`src/components/contactUpdate/ContactUpdatePublicForm.tsx` 第 16–20 行），提交走 `submitContactUpdateSession`。`TrialInvitePublicForm` 只呼叫 `getTrialInviteSession` 與 `submitTrialInviteSession`（`src/components/trialInvite/TrialInvitePublicForm.tsx` 第 25–32 行）；同檔的 `setTrialInviteClassListed` 等由後台目錄使用。`AdTrialPublicForm` 提交走 `submitAdTrial`／`submitAdTrialInterest`（Edge），從 `trialInviteQueries` 只引入型別。
- `void_payment_command` 先檢查 `payments.void`（`supabase/migrations/20260815230456_p0_1_payments_entitlements.sql` 第 85–88 行）。production 的 `apply_attendance_entitlement_delta` 先檢查 `attendance.take`。兩者雖授予 `authenticated`，函式內拒絕沒有 capability 的呼叫。
- 管理層計糧 P1–P6 與工作樹 migration 註解的產品覆寫一致：`supabase/migrations/20261006182706_manager_payroll_p1_p6.sql` 第 1–17 行授予 `payroll.prepare` 等六個鍵，不收回原有的 `payroll.settle`／`payroll.verify`／`payroll.return`。production `authz_role_capabilities` 與這份覆寫相符。`docs/product/topics/mgmt-manager-role.md` 表頭寫第一期 RLS 讀寫分離屬第二期；其後 capability 模型已由已關閉的 `tech-debt-hardening` 承接，這次不把「manager 可寫計糧預備」再報成新洞。
- `docs/product/topics/role-ops-hardening.md` 表頭 `done`。這次沒有看到老師路徑改回可刪排程或可讀付款；未再冒充老師 JWT 重跑該題的對抗清單。
