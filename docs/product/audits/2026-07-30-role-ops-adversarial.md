# 角色與日常營運對抗性稽核（2026-07-30）

| 欄位 | 值 |
| --- | --- |
| 日期 | 2026-07-30 |
| 範圍 | MainHope_production（Supabase）真實帳號 session + 當時 repo 角色／RLS 程式 |
| 探測帳號 | alien（Hoi Ying）、admin（Carol）、teacher（Judy／Mark／Leo）、雙身份（Mark／Katie） |
| 限制 | 未找到管理後台公開 URL，無完整瀏覽器 UI 點擊；本地未 commit 前端未必已上線 |
| 工程追蹤 | [`../backlog/role-ops-hardening.md`](../backlog/role-ops-hardening.md) · [`../BACKLOG.md`](../BACKLOG.md) |

## 總評

老師／行政 happy path（自己班排程、全校行政、付款封鎖、Mark 雙身份切換）大致可用。主要風險在老師可取消課堂、同事通訊錄與收件匣已讀外洩、外星人不能指派代堂、少數 nav／頁面角色不一致。

## 1. 環境與探測摘要

| 項目 | 結果 |
| --- | --- |
| 全校基準 | ~491 學生／65 班／781 排程／51 付款／21 老師 |
| 未登入 anon | students／payments／classes 被拒 |
| 老師讀付款 | 0 列 |
| 老師讀別人班 | 被擋 |
| Mark 老師日常查詢 | 自己週排程／報讀可讀（有 filter 時） |
| Mark 切 admin | 即時 491 學生、51 付款；切回後恢復 |
| Carol admin | 全校可讀；`mgmt_audit_log` 為 0（應限 alien） |
| Alien | 全開含 audit／app_users |
| Judy | 當時 0 班（暑假可能正常） |

雙身份：`app_user_roles` + `mgmt_active_roles` + `switch_my_mgmt_role` 正常；稽核當日 Mark／Katie active 均為 teacher。

廣域 `count(*)` 對 students／schedules／attendance 偶發 HTTP 500；**有 filter 的日常查詢正常**（較像 RLS 重查逾時）。

## 2. 問題清單與建議方案

### P0-1 老師可取消／變更課堂狀態

- **現象：** 排程列表隱藏管理操作（`canManageSchedules = isMgmtStaff()`），詳情頁仍有「變更狀態／取消」；RLS `rls_phase_b_teacher_update_schedules` 允許 teacher UPDATE。live 已驗證 Mark 可 `正常→取消→恢復`。
- **影響：** 誤取消課堂、與行政排程管控不一致。
- **相關：** [`ScheduleDetailView.tsx`](../../src/components/schedule/ScheduleDetailView.tsx)、[`ClassDetailView.tsx`](../../src/components/classes/ClassDetailView.tsx)、migration `20260722110000_…`

| 方案 | 做法 | 優點 | 缺點 |
| --- | --- | --- | --- |
| **A（建議）前端對齊 + RLS 收緊** | 詳情頁取消／狀態變更僅 `isMgmtStaff()`；RLS UPDATE 限教學備註等白名單欄，或 RPC | 列表與詳情一致；防 API 繞過 | 需 migration；要列清老師仍可寫哪些欄 |
| **B 僅藏 UI** | 詳情頁隱藏取消／狀態，不改 RLS | 改動小 | 懂 API 仍可改 |
| **C 產品允許老師改狀態** | 列表也開放；文件寫明 | 與 Mark 指引「可更新獲准課堂狀態」一致 | 誤取消風險；取消仍應限 admin／alien |

**採用預設：A**（禁止老師「取消」；若保留「完成」等，用白名單／RPC）。

### P0-2 Admin 學年鎖在「老師檔期」失效

> **結案（2026-07-31）**：不再「修好硬鎖」；產品改**撤硬鎖＋confirm＋audit**。見 [`ACADEMIC_YEARS.md`](../ACADEMIC_YEARS.md) §1.1、[`academic-year-unlock-soft-guard.md`](../backlog/academic-year-unlock-soft-guard.md)。下文為當日發現。

- **現象：** `canEditAcademicYear(label, endDate)` → `isAcademicYearReadOnly(endDate, label)` 把學年 `end_date` 當成 admin 的 referenceYmd（「今天」）。選 2526 時誤判可編輯。
- **相關：** [`academicYearEditGuard.ts`](../../src/lib/academicYearEditGuard.ts)、[`mgmtRole.ts`](../../src/lib/mgmtRole.ts)、[`TeacherAvailabilityPage.tsx`](../../src/components/teacherAvailability/TeacherAvailabilityPage.tsx)

| 方案 | 做法 |
| --- | --- |
| **A（當日建議）** | 檔期頁／assert 只傳 label；admin reference 永遠用真實今天；`end_date` 只供「已過學年」判斷 |
| **B** | 第二參數改名／註解防誤用；呼叫點全面 audit |
| **最終** | **撤硬鎖**；非當期寫入 Confirm＋audit（不再驗「歷史檔期唯讀」） |

**當日採用預設：A+B。最終：撤鎖路線（見上）。**

### P1-1 老師可讀全校老師電話／email

- **現象：** live 老師可讀 21 位老師含 phone／email；`/Teachers` 無 route guard；RLS teacher read all。
- **相關：** [`teacherQueries.ts`](../../src/services/teacherQueries.ts)、Phase B `rls_phase_b_teacher_select_teachers`

| 方案 | 做法 |
| --- | --- |
| **A（建議）** | teacher SELECT 僅 id／abbr／full_name；電話／email／薪資僅 self 或 mgmt staff；query 分流 |
| **B** | 僅前端擋 `/Teachers` | 快但不防 API |
| **C** | 維持互看電話（營運需要），但薪資必須排除 |

**採用預設：A**（除非營運明確要 C）。

### P1-2 `inbox_reads` 老師可看／改全部已讀

- **現象：** `rls_teacher_all_inbox_reads` = `is_teacher_role()`；live Judy 可見 Christine／alien 的 `actor_key`。
- **建議 A：** USING／WITH CHECK 限目前使用者的 inbox actor key（最好 DB `current_inbox_actor_key()`）。

### P1-3 外星人不能指派代堂

- **現象：** `canAssignSubstitute = isAdmin()`；RLS 仍允許 alien 寫排程。
- **建議：** 改 `isMgmtStaff()`（admin + alien）。

### P1-4 老師一對一「預約上堂」UI vs 不可 INSERT

| 方案 | 做法 |
| --- | --- |
| **A（建議，對齊文件）** | 老師隱藏／停用預約；僅 admin／alien |
| **B** | 加 teacher INSERT policy + 改文件 |

### P1-5／P1-7 敏感頁無 route guard；Leave／Trial deep-link

- 多數靠 nav 隱藏；老師 deep-link 半殘 UI。
- **建議：** 先補高風險頁（Payments、Users、Teachers、Leave、Trial），再收斂成依 `NAV_STRUCTURE.roles` 的共用 `RequireRoles`。

### P1-6 優惠折扣 nav 與頁面不一致

- nav：admin+alien；頁面僅 alien。
- **建議：** nav 改為僅 `alien`。

### P2（較低／維持）

| 項 | 建議 |
| --- | --- |
| 排程篩選依角色 | 已對齊 handoff §6.2，維持 |
| 代堂看不到「我的班別」 | 文件已述；可選之後做代堂班視圖 |
| 學生聯絡老師可見 | 產品定案後再收窄 |
| 廣域 count 500 | 避免無 filter head count |
| localStorage alien 閘 | 長期改讀 server role；寫入靠 RLS |

## 3. 修復優先序

1. P0-1 課堂取消／狀態（UI + RLS）
2. ~~P0-2 學年鎖誤用 end_date~~ → **已改撤硬鎖**（非修 L1）
3. P1-3 代堂 `isMgmtStaff()`
4. P1-2 inbox_reads 收窄（migration）
5. P1-1 teachers SELECT 收窄（migration + query）
6. P1-5／6／7 nav／route guard／優惠折扣
7. P1-4 隱藏老師一對一預約

含 migration 者：`npm run db:apply -- <單檔>`；禁止歷史不一致時全量 `db push`。

## 4. 驗收清單

- 老師：不可取消課堂；可點名／睇自己排程；不可讀他師 phone／email；inbox 已讀僅自己
- Admin：~~歷史檔期（如 2526）唯讀；當前／下一學年可編~~ → **已廢止硬鎖**；非當期寫入 Confirm＋audit（[`ACADEMIC_YEARS.md`](../ACADEMIC_YEARS.md) §1.1）
- Alien：可指派代堂；優惠折扣可進；audit 仍可讀
- Mark：teacher↔admin 切換後學生／付款範圍正確
- 老師 deep-link `/Payments`、`/LeaveManagement` → 導走或明確無權限

## 5. 已確認正常（當日）

1. Teacher schedule fetch 有 `teacherId` 範圍 + RLS（非僅 UI）
2. 雙身份 server 驗證；admin 模式清 `teacher_id`
3. `/Students`、FrontDesk、TeacherLeaveWizard 有導向
4. Payments 老師 RLS 封鎖
5. 排程篩選依角色符合 §6.2
6. Apo 角色來自 JWT／`mgmt_active_roles`
