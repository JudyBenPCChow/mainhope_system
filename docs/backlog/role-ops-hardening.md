# 角色／權限日常加固（對抗性稽核後）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open` |
| 優先 | 高 |
| 範圍 | admin／teacher／alien 後台；RLS + 路由／UI 對齊 |
| 不含 | 家長 Portal；新增 `manager` 角色（見 [mgmt-manager-role.md](./mgmt-manager-role.md)） |
| 稽核報告 | [2026-07-30-role-ops-adversarial.md](../audits/2026-07-30-role-ops-adversarial.md) |
| 索引 | [BACKLOG.md](../BACKLOG.md) |
| 盤點日期 | 2026-07-30 |

## 結論

Production live 探測確認：老師／行政日常讀取與付款封鎖大致正常；**課堂取消權限過寬、老師通訊錄／inbox 已讀外洩、外星人不能代堂、學年鎖誤用**需優先修。完整現象與方案取捨見稽核報告；本檔只跟進**採用預設方案**的勾選。

## 工作項（按建議優先序）

| 狀態 | ID | 優先 | 工作 | 預設方案 | 主要觸點 |
| --- | --- | --- | --- | --- | --- |
| open | P0-1 | 高 | 老師不可取消／亂改課堂狀態；列表與詳情一致 | UI 僅 mgmt staff + RLS／RPC 白名單欄 | `ScheduleDetailView`、`ClassDetailView`、schedules UPDATE policy |
| open | P0-2 | 高 | Admin 檔期學年鎖：勿把 `end_date` 當「今天」 | 修正 `isAcademicYearReadOnly`／呼叫點 | `mgmtRole.ts`、`academicYearEditGuard.ts`、`TeacherAvailabilityPage` |
| open | P1-3 | 高 | 外星人可指派代堂 | `canAssignSubstitute = isMgmtStaff()` | `ScheduleManagePage`、`ScheduleDetailView` |
| open | P1-2 | 高 | `inbox_reads` 僅自己的 actor | migration 收窄 policy | `inbox_reads` RLS；對齊 `getInboxActorKey` |
| open | P1-1 | 高 | 老師不可讀他師 phone／email／薪資 | teacher SELECT 目錄欄位；query 分流 | `teachers` RLS、`teacherQueries.ts`；可選擋 `/Teachers` |
| open | P1-5 | 中 | 敏感頁 route guard | 先高風險頁，再 `RequireRoles` | `App.tsx`、Payments／Teachers／Leave／Trial／Users |
| open | P1-6 | 中 | 優惠折扣 nav 僅 alien | nav `roles: ["alien"]` | `navStructure.ts` |
| open | P1-7 | 中 | Leave／Trial 老師 deep-link | 與 P1-5 一併導向／守衛 | `LeaveManagement`、`TrialSessions` |
| open | P1-4 | 中 | 隱藏老師一對一「預約上堂」 | 對齊文件（不可新增排程） | `ClassDetailView` `canBookPrivate` |

## 驗收（全部或分批）

見稽核報告 §4。最低 P0 驗收：

- 老師：詳情頁不能取消課堂；API／RLS 同樣擋取消（或等價）
- Admin：歷史學年（如 2526）檔期唯讀

## 相關主題

- RLS 總覽進度：[RLS_ROLLOUT.md](../RLS_ROLLOUT.md)（Phase C 仍進行中）
- 代堂語意：[SCHEDULE_SUBSTITUTE_TEACHER.md](../SCHEDULE_SUBSTITUTE_TEACHER.md)
- Mark 雙身份操作：[MARK_YU_ROLE_SWITCH_GUIDE.md](../MARK_YU_ROLE_SWITCH_GUIDE.md)
- 管理層新角色（勿與此混做）：[mgmt-manager-role.md](./mgmt-manager-role.md)

## 明確暫不做（本主題）

- 廣域 count 500 的全面 RLS 效能重寫（先避免無 filter head count）
- 學生聯絡欄對老師全面隱藏（待產品定案）
- 代堂班出現在「我的班別」（已知文件行為）
