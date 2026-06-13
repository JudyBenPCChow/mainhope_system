# RLS 正式上線工作清單

追蹤明學管理系統由「dev 全開 RLS」過渡至「依角色限制」的進度。  
每次交付後請完成對應的 **你的待辦**，再進入下一 Phase。

---

## 總覽

| Phase | 目標 | 狀態 |
|-------|------|------|
| **A** | 阻擋 `anon`；必須 Supabase 登入；前端 session 同步 | ✅ 已交付 |
| **B** | `teacher` 僅能存取與自己 `teacher_id` 相關資料 | 🔄 進行中 |
| **C** | `admin`／`alien` 分工；敏感表（付款、用戶、mgmt）細部權限 | ⬜ 待開始 |
| **收尾** | Dashboard 設定、移除過渡 policy、文件更新 | ⬜ 待開始 |

---

## 受影響資料表（約 40 張）

- **學籍**：`students`, `student_class_enrollments`, `student_relationships`, `student_status_history`, `enrollment_change_events`
- **班務／課程**：`classes`, `courses`, `subjects`, `academic_years`, `academic_year_periods`, `schedules`, `teacher_availability_slots`
- **人事**：`teachers`, `app_users`, `classrooms`
- **出勤／請假／試堂**：`attendance_details`, `leave_makeup_records`, `trial_sessions`
- **財務**：`payments`, `payment_details`, `payment_batches`, `payment_discounts`, `payment_discount_applications`, `referral_records`
- **日曆／待辦**：`calendar_events`, `calendar_event_*`（teachers, students, users, tags, updates）
- **其他**：`classroom_booking_requests`, `admin_todos`
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
- [x] 前端對齊：`ClassDetailView`（老師不可搜尋全校學生加入班別）、`TodoBoardView`／`calendarQueries`（老師僅載入待辦相關學生標籤）

### 涵蓋範圍

| 類別 | 表 | teacher 權限 |
|------|-----|-------------|
| 班務 | `classes`, `schedules`, `student_class_enrollments` | 僅自己班別 |
| 學生 | `students` | 僅自己班／被指派的待辦學生（SELECT） |
| 出勤 | `attendance_details` | 僅自己班別 |
| 請假／試堂 | `leave_makeup_records`, `trial_sessions` | 僅自己班別（SELECT） |
| 約房 | `classroom_booking_requests` | 僅自己提交的申請 |
| 待辦 | `calendar_events`, `calendar_event_*`, `calendar_event_updates` | 可見待辦＋被指派的跟進 INSERT |
| 參考 | `subjects`, `courses`, `academic_years`, `classrooms`, `teachers` | SELECT（老師可更新自己 `teachers` 列） |
| 登入 | `app_users` | 僅讀自己列 |
| 管理 | `payments`, `payment_*`, `mgmt_*`, `admin_todos` 等 | **禁止**（admin／alien only） |

### 你的待辦（Phase B 部署後）

1. **套用 migration**
   ```bash
   supabase db push
   ```

2. **以 teacher 帳號走完整流程**
   - [ ] 我的班別 → 班別詳情 → 排程 → 點名 → 待辦跟進 → 預約空房
   - [ ] 確認無 `permission denied`（若某頁失敗，記錄路徑與操作）

3. **越權測試（可選，用 Supabase SQL 或 REST）**
   - [ ] teacher JWT 無法 `select * from payments`
   - [ ] teacher JWT 無法讀取其他老師的 `classes`

4. **admin／alien 回歸**
   - [ ] 學生管理、繳費、班別新增等與 Phase A 一致

### 決策（Phase B 採用）

- 老師在待辦／點名時僅能看見**自己班**或**待辦指派**的學生
- 老師可讀取**所有老師**基本資料（下拉選單用）；不可改他人資料
- 老師**不可**在班別詳情「增加學生」（需 admin）

### 下一步

Phase B 驗收通过后 → 開始 **Phase C**（admin／alien 分工、付款／用戶細部權限）。

---

## Phase C — admin／alien 分工

### 計劃交付物

- [ ] `payments`, `payment_*`, `referral_records` — admin + alien；teacher 禁止
- [ ] `app_users` — alien 可写；admin 只读或禁止（待決）
- [ ] `mgmt_*` — 僅 alien
- [ ] `payment_discounts`, `courses` — 僅 alien（對齊現有 UI）
- [ ] 移除所有 `rls_phase_a_auth_all_*` 過渡 policy

### 你的待辦（Phase C 部署後）

- [ ] 各角色走 UI 上標示為該角色專屬的頁面
- [ ] 嘗試越權操作（teacher 開 `/Payments`）→ DB 應拒絕
- [ ] Supabase linter `rls_policy_always_true` 應接近清零

---

## 收尾

- [ ] Dashboard：啟用 **Leaked password protection**
- [ ] 確認無 `dev_anon_all_*` / `dev_auth_all_*` 殘留
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
| 2026-06-15 | Phase A code | migration + authBootstrap + Layout 守衛 |
| 2026-06-15 | Phase A hotfix | admin 就讀班別：分批 `.in()` 查詢 + 課程標籤 fallback |
| 2026-06-15 | Phase B hotfix | app_users 登入 bootstrap policy（修復全角色無法登入） |
