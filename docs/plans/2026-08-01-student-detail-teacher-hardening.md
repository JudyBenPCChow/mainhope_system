# 學生詳情老師加固 — 實作計劃（R1／R2／§6）

> 日期：2026-08-01  
> 狀態：**已落 code**  
> 報告：[2026-08-01-student-detail-teacher-exposure.md](../audits/2026-08-01-student-detail-teacher-exposure.md)  
> 審閱：[2026-08-01-student-detail-teacher-review.md](../audits/2026-08-01-student-detail-teacher-review.md)  
> 審閱回應（含回覆）：[2026-08-01-student-detail-teacher-review-response.md](../audits/2026-08-01-student-detail-teacher-review-response.md)  
> Backlog：[role-ops-hardening.md](../backlog/role-ops-hardening.md) R1／R2  

---

## 0. 定案摘要

| ID | 判決 |
| --- | --- |
| R1 | 老師唔見金錢：藏繳費 tab、單價、已繳／已綁；唔打付款／總繳堂數 API；更動紀錄唔含付款 |
| R2 | 老師唔代學生請假：藏「新增請假」＋ dialog；**保留**請假一覽唯讀 |
| §6 | **選 A**：本票一併藏假開放寫入掣（`canMutateStudentOps`） |
| 餘額 | 老師**仍** `fetchLessonBalancesForStudent`；UI 精簡；gap tag 唔用 `paidLessons` |
| 請假 link | 老師 balance → `setTab("leave")`；leave list 靜態卡（唔 link LeaveManagement） |
| 路由 | **保留**老師可開 `/Students/:id` |
| 除外 | 老師請假精靈、家長電話隱藏、migration／RLS |

### 旗標

```ts
const isStaff = isMgmtStaff()
const canViewMoney = isStaff                    // admin|manager|alien 可睇繳費
const canMutateLeave = isAdminOrAlien()         // 學生詳情新增請假
const canMutateStudentOps = isAdminOrAlien()    // 報讀／待補／基本寫入
const canOpenLeaveManagement = isStaff          // 深連結請假管理
const canRegisterPayment = isAdminOrAlien()
const canDeleteAttendance = isAdminOrAlien()
const canVoidPayment = isAdminOrAlien()
```

老師：`fetchLessonBalancesForStudent(sid, { includePaidLessons: false })`。  
對抗模擬 P1 修補見 [adversarial](../audits/2026-08-01-student-detail-teacher-adversarial.md)。

---

## 1. 改動檔案

| 檔 | 改動 |
| --- | --- |
| `src/services/studentQueries.ts` | `fetchStudentActivity(id, { includePayments? })` |
| `src/components/students/StudentDetailView.tsx` | 旗標、`reloadSubs`、tabs、UI |
| `src/services/inboxQueries.ts` | 順手補 `ROLE_LABEL.manager`（`tsc`） |

---

## 2. 已完成清單

- [x] `reloadSubs` 按角色分支（balances 仍拉）
- [x] `includePayments` on activity
- [x] R1 UI（tab／單價／已繳已綁／VoidDialog／banner）
- [x] R2 UI（新增請假／dialog／leave links）
- [x] §6 寫入掣隱藏
- [x] `npm run build` 通過

### 人手驗收（建議）

- [ ] Teacher deep-link：無繳費 tab、Network 無 payments、無寫入掣、有請假一覽
- [ ] Admin 對照：全功能仍在
- [ ] TeacherLeaveWizard 不受影響
