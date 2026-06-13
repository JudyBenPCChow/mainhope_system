# RLS 正式上線工作清單

追蹤明學管理系統由「dev 全開 RLS」過渡至「依角色限制」的進度。  
每次交付後請完成對應的 **你的待辦**，再進入下一 Phase。

---

## 總覽

| Phase | 目標 | 狀態 |
|-------|------|------|
| **A** | 阻擋 `anon`；必須 Supabase 登入；前端 session 同步 | 🔄 進行中 |
| **B** | `teacher` 僅能存取與自己 `teacher_id` 相關資料 | ⬜ 待開始 |
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

Phase A 驗收通过后 → 開始 **Phase B**（teacher 範圍 policy + 前端 query 調整）。

---

## Phase B — 老師範圍限制

### 計劃交付物

- [ ] migration：移除 `rls_phase_a_auth_all_*`，改為依 `current_teacher_id()` 的 SELECT/INSERT/UPDATE/DELETE
- [ ] 涵蓋：`classes`, `schedules`, `student_class_enrollments`, `attendance_details`, `calendar_event_*`, `teacher_availability_slots` 等
- [ ] 前端：日曆參與者選項、列表 query 與 RLS 對齊
- [ ] `students`：teacher 僅能讀取「自己班上就讀」的學生

### 你的待辦（Phase B 部署後）

- [ ] 以 teacher 帳號走完整流程：我的班別 → 排程 → 點名 → 待辦
- [ ] 確認 teacher **無法** 直接 API 讀取其他老師的班／全校付款
- [ ] admin／alien 行為與 Phase A 一致

### 決策待確認（開始 Phase B 前）

- [ ] 老師能否在待辦／點名時看到**其他班**學生姓名？（建議：僅自己班）
- [ ] 老師能否看見其他老師名單（下拉選單）？（建議：只讀 abbr，或僅自己）

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
