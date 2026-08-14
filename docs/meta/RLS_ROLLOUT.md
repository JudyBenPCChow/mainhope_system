# RLS 正式上線工作清單

追蹤明學管理系統由「dev 全開 RLS」過渡至「依角色限制」的進度。  
每次交付後請完成對應的 **你的待辦**，再進入下一 Phase。

---

## 總覽

| Phase | 目標 | 狀態 |
|-------|------|------|
| **A** | 阻擋 `anon`；必須 Supabase 登入；前端 session 同步 | ✅ 已交付 |
| **B** | `teacher` 僅能存取與自己 `teacher_id` 相關資料 | ✅ 已交付 |
| **C** | `admin`／`alien` 分工；敏感表（付款、用戶、mgmt）細部權限 | 🔄 進行中 |
| **收尾** | Dashboard 設定、移除過渡 policy、文件更新 | ⬜ 待開始 |

---

## 受影響資料表（約 40 張）

- **學籍**：`students`, `student_class_enrollments`, `student_relationships`, `student_status_history`, `enrollment_change_events`
- **班務／課程**：`classes`, `courses`, `subjects`, `academic_years`, `academic_year_periods`, `schedules`, `teacher_availability_slots`
- **人事**：`teachers`, `app_users`, `classrooms`
- **出勤／請假／試堂**：`attendance_details`, `leave_makeup_records`, `trial_sessions`
- **財務**：`payments`, `payment_details`, `payment_batches`, `payment_discounts`, `payment_discount_applications`, `referral_records`
- **日曆／通告（行政待辦看板已廢除；表保留供 Portal／RLS）**：`calendar_events`, `calendar_event_*`（teachers, students, users, tags, updates）；歷史列已清空
- **其他**：`classroom_booking_requests`, `admin_todos`（行政舊待辦表；列已清空，後台無 UI）
- **系統**：`mgmt_audit_log`, `mgmt_system_errors`

---

## Phase A — 必須登入（過渡期：已登入用戶仍全表可读写）

### 交付物

- [x] `supabase/migrations/20260615170000_rls_phase_a_require_auth.sql`
- [x] `src/lib/authBootstrap.tsx` — session 恢復、`onAuthStateChange`
- [x] `Layout` — 未登入導向 `/Login`；登出呼叫 `signOut`
- [x] DB helper：`current_app_user_email()`, `current_teacher_id()`（供 Phase B 使用）

### 你的待辦（Phase A 部署後）

1. **在 staging／dev 套用 migration**
   ```bash
   supabase db push
   ```
   或於 Supabase Dashboard → SQL，執行 migration 檔內容。

2. **三種帳號各測一次**
   - [ ] 未登入：直接開 `/Students` → 應被導向 Login；API 應 `permission denied`
   - [ ] admin 登入 → 學生／班別／付款可正常載入
   - [ ] teacher 登入 → 現階段仍應可正常使用（Phase A 尚未限制 teacher 範圍）
   - [ ] alien 登入 → 系統日志／優惠折扣可開

3. **重新整理頁面（F5）**
   - [ ] 登入狀態應保持，不需重新輸入密碼（session 有效時）

4. **確認 Supabase Linter**
   - [ ] `rls_policy_always_true` 中 **anon** 相關警告應明显减少
   - [ ] `authenticated` 全開警告仍会存在（Phase B/C 才收）

5. **問題回報**
   - 若某頁 `permission denied`，記錄：角色、路徑、操作、錯誤訊息

### 下一步

Phase A 驗收通过后 → 部署 **Phase B**（見下方）。

---

## Phase B — 老師範圍限制

### 交付物

- [x] `supabase/migrations/20260615180000_rls_phase_b_teacher_scope.sql`
- [x] DB helper：`is_mgmt_staff()`, `is_teacher_role()`, `teacher_can_access_*()`
- [x] 前端對齊：`ClassDetailView`（老師不可搜尋全校學生加入班別）；原 `TodoBoardView`／行政待辦看板 **已廢除**（2026-07-31）

### 涵蓋範圍

| 類別 | 表 | teacher 權限 |
|------|-----|-------------|
| 班務 | `classes`, `schedules`, `student_class_enrollments` | 僅自己班別 |
| 代堂名單 | `get_teacher_schedule_roster_context(uuid[])` | 班別主責／當日老師／原任僅按獲授權排程讀取最小名單資料；不擴闊基礎表 RLS |
| 學生 | `students` | 僅自己班／被指派的待辦學生（SELECT） |
| 出勤 | `attendance_details` | 僅自己班別 |
| 請假／試堂 | `leave_makeup_records`, `trial_sessions` | 僅自己班別（SELECT） |
| 約房 | `classroom_booking_requests` | 僅自己提交的申請 |
| 通告／舊待辦表（後台已廢除看板） | `calendar_events`, `calendar_event_*`, `calendar_event_updates` | 老師 RLS 路徑仍在；後台無寫入 UI；Portal 可讀通告 |
| 參考 | `subjects`, `courses`, `academic_years`, `classrooms`, `teachers` | SELECT（老師可更新自己 `teachers` 列） |
| 登入 | `app_users` | 僅讀自己列 |
| 管理 | `payments`, `payment_*`, `mgmt_*`, `admin_todos` 等 | **禁止**（admin／alien only） |

### 你的待辦（Phase B 部署後）

1. **套用 migration**
   ```bash
   supabase db push
   ```

2. **以 teacher 帳號走完整流程**
   - [ ] 我的班別 → 班別詳情 → 排程 → 點名 → 收件匣 → 預約空房
   - [ ] 確認無 `permission denied`（若某頁失敗，記錄路徑與操作）

3. **越權測試（可選，用 Supabase SQL 或 REST）**
   - [ ] teacher JWT 無法 `select * from payments`
   - [ ] teacher JWT 無法讀取其他老師的 `classes`
   - [ ] 代堂 teacher 可讀獲指派排程的 roster RPC，但混入其他老師 schedule_id 時整次拒絕
   - [ ] 代堂 teacher 仍無法直接枚舉 `students`／`student_class_enrollments`
   - [ ] 僅 `schedules.teacher_id` 可寫該堂 `attendance_details`；`original_teacher_id` 只讀

4. **admin／alien 回歸**
   - [ ] 學生管理、繳費、班別新增等與 Phase A 一致

### 決策（Phase B 採用）

- 老師在點名時僅能看見**自己班**的學生（舊待辦指派路徑仍在 RLS，後台已無指派 UI）
- 代堂屬排程級授權：用 schedule-scoped RPC 回傳最小名單，不授予永久整班學生權限
- 老師可讀取**所有老師**基本資料（下拉選單用）；不可改他人資料
- 老師**不可**在班別詳情「增加學生」（需 admin）

### 下一步

Phase B 驗收通过后 → 部署 **Phase C**（見下方）。

---

## Phase C — admin／alien 分工

### 交付物

- [x] `supabase/migrations/20260615190000_rls_phase_c_admin_alien_split.sql`
- [x] DB helper：`is_admin()`, `is_alien()`
- [x] 老師 DB 收緊：`classes`／`student_class_enrollments` 僅 SELECT；`schedules` 可 SELECT+UPDATE（改狀態），不可 INSERT／DELETE
- [x] **alien only**：`app_users`（CRUD）、`referral_records`、`payment_discounts`（寫）、`courses`（寫）、`mgmt_*`（讀）
- [x] **admin 只讀**：`courses`、`payment_discounts`（供班別／繳費頁 embed／收款勾選目錄）；老師仍可 SELECT `courses`
- [x] **admin + alien**（沿用 Phase B `is_mgmt_staff()`）：`payments`、`payment_discount_applications`（收款套用優惠）、`students`、`classes`、請假試堂等營運表
- [x] **mgmt 寫入**：任何已登入角色可 INSERT audit／system_errors（前端錯誤回報）；僅 alien 可讀
- [x] Hotfix：`20260723180000_admin_payment_discount_applications_write.sql`（admin 收款勾選優惠需可寫 applications；目錄維護仍僅 alien）

### 你的待辦（Phase C 部署後）

1. **套用 migration**
   ```bash
   supabase db push
   ```

2. **admin 帳號**
   - [ ] 學生／班別／繳費／請假／試堂正常
   - [ ] 無法開「用戶管理」「優惠折扣」「課程管理」「系統日志」（UI 本已隱藏；API 應拒絕寫入）
   - [ ] 新增班別時仍可選課程（courses SELECT）

3. **alien 帳號**
   - [ ] 用戶管理、優惠、課程、推薦回贈、系統日志可正常使用
   - [ ] 其餘 admin 功能仍正常

4. **teacher 帳號**
   - [ ] 點名、出席仍可寫入（`attendance_details` 未收緊）
   - [ ] 無法透過 API 新增／刪除排程、修改班別、新增就讀（即使繞過 UI）；可更新排程狀態

5. **Supabase Linter**
   - [ ] `rls_policy_always_true` 應進一步減少（mgmt INSERT 仍為 `true`，可接受）

### 下一步

Phase C 驗收通过后 → **收尾**（Dashboard、清除 dev policy 殘留、文件）。

---

## 收尾

- [ ] Dashboard：啟用 **Leaked password protection**（工程跟進：[`auth-leaked-password-protection.md`](../product/topics/auth-leaked-password-protection.md)）
- [ ] 確認無 `dev_anon_all_*` / `dev_auth_all_*` 殘留
- [x] 移除 production 人手加嘅 `temp_frontend_read_*`（`20260711180500_drop_temp_frontend_read_policies.sql`，2026-07-11）
- [ ] 更新 baseline 註解或新增 production RLS 說明
- [ ] （可選）staging 定期 regression checklist

---

## 回滾

若 Phase A 出問題，可執行：

```sql
-- 僅緊急回滾 Phase A anon 封鎖（恢復 dev 全開，不建議長期使用）
-- 見 migration 檔末尾註解或聯繫開發還原 20260615170000
```

---

## 變更紀錄

| 日期 | 交付 | 備註 |
|------|------|------|
| 2026-07-23 | admin 收款套用優惠 | `payment_discount_applications` 改 `is_mgmt_staff()` 可寫；`payment_discounts` 目錄寫入仍僅 alien |
| 2026-07-22 | Portal 試堂 + 安全加固 | `list_portal_my_trial_schedules`（不擴 schedules RLS）；`redeem_portal_invite` 拒覆寫 admin/teacher/alien；grade helpers 僅本人／mgmt |
| 2026-06-15 | Phase A code | migration + authBootstrap + Layout 守衛 |
| 2026-06-15 | Phase A hotfix | admin 就讀班別：分批 `.in()` 查詢 + 課程標籤 fallback |
| 2026-06-15 | Phase B hotfix | helper functions 改 SECURITY DEFINER（修 stack depth limit exceeded） |
| 2026-06-15 | Phase C code | admin／alien 分工 + 老師班務 DB 收緊 |
