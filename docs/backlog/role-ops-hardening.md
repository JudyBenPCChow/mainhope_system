# 角色／權限日常加固（對抗性稽核後）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `done`（2026-08-01：R1／R2／§6 已落 code） |
| 優先 | 高 |
| 範圍 | admin／teacher／alien 後台；RLS + 路由／UI 對齊 |
| 不含 | 家長 Portal；新增 `manager` 角色（見 [mgmt-manager-role.md](./mgmt-manager-role.md)）；學年硬鎖已**撤銷**（見 [academic-year-unlock-soft-guard.md](./academic-year-unlock-soft-guard.md)；舊整固專題 [academic-year-lock.md](./academic-year-lock.md) 已 `cancelled`）；家長電話對老師全面隱藏（仍暫不做） |
| 稽核報告 | [2026-07-30-role-ops-adversarial.md](../audits/2026-07-30-role-ops-adversarial.md) |
| 老師對照 | [2026-07-31-teacher-desktop-mobile-parity.md](../audits/2026-07-31-teacher-desktop-mobile-parity.md) |
| R1／R2 | [暴露報告](../audits/2026-08-01-student-detail-teacher-exposure.md) · [計劃](../plans/2026-08-01-student-detail-teacher-hardening.md) · [審閱](../audits/2026-08-01-student-detail-teacher-review.md) · [審閱回應](../audits/2026-08-01-student-detail-teacher-review-response.md) |
| 索引 | [BACKLOG.md](../BACKLOG.md) |
| 盤點日期 | 2026-07-30；殘項 2026-07-31；定案／實作 2026-08-01 |
| 行政模擬 | 見下方「行政邊緣模擬」 |

## 結論

Production live 對抗性批次（P0／P1）已清；**R1／R2／§6（2026-08-01）已落**：老師學生詳情唔見金錢、唔代請假、唔見假開放寫入掣；仍可 deep-link 睇教學相關資料。家長電話全面隱藏仍暫不做。原 P0-2「學年鎖」已撤硬鎖（見 [academic-year-unlock-soft-guard.md](./academic-year-unlock-soft-guard.md)）。

## 工作項（按建議優先序）

| 狀態 | ID | 優先 | 工作 | 預設方案 | 主要觸點 |
| --- | --- | --- | --- | --- | --- |
| done | P0-1 | 高 | 老師不可取消／亂改課堂狀態；列表與詳情一致 | UI 僅 mgmt staff + trigger 白名單欄 | `ScheduleDetailView`、`ClassDetailView`、`20260731022000_schedules_teacher_update_column_guard` |
| cancelled | P0-2 | 高 | Admin 檔期學年鎖：勿把 `end_date` 當「今天」 | **已取消整固路線**；改撤硬鎖＋confirm＋audit → [academic-year-unlock-soft-guard.md](./academic-year-unlock-soft-guard.md) | （本主題不再跟進） |
| done | P1-3 | 高 | 外星人可指派代堂 | `canAssignSubstitute = isMgmtStaff()` | `ScheduleManagePage`、`ScheduleDetailView` |
| done | P1-2 | 高 | `inbox_reads` 僅自己的 actor | migration 收窄 teacher policy | `20260731024500_inbox_reads_teacher_own_actor`；`current_inbox_actor_key()` |
| done | P1-1 | 高 | 老師不可讀他師 phone／email／薪資 | 敏感欄移 `teachers_private` + view 分流 | `20260731025000_teachers_private_sensitive_fields`、`teacherQueries.ts` |
| done | P1-5 | 中 | 敏感頁 route guard | `RequireMgmtRoles` 對齊 nav roles | Payments／PaymentHistory／Teachers／Leave／Trial／Users |
| done | P1-6 | 中 | 優惠折扣 nav 僅 alien | nav `roles: ["alien"]` | `navStructure.ts` |
| done | P1-7 | 中 | Leave／Trial 老師 deep-link | 與 P1-5 一併導向／守衛 | `LeaveManagement`、`TrialSessions` |
| done | P1-4 | 中 | 隱藏老師一對一「預約上堂」 | 對齊文件（不可新增排程） | `ClassDetailView` `canBookPrivate` |
| done | R1 | 高 | 老師不可見金錢 | 藏 tab＋單價／已繳；reloadSubs 唔打付款；activity `includePayments` | `StudentDetailView` · `studentQueries` |
| done | R2 | 高 | 老師不可代學生請假 | 藏新增請假；一覽唯讀；leave link 唔入 LeaveManagement | `StudentDetailView` |
| done | §6 | 中 | 假開放寫入掣 | `canMutateStudentOps` 藏報讀／待補／基本資料寫入 | `StudentDetailView` |

## 行政邊緣模擬（2026-07-31）

來源：行政桌面能力模擬（Canvas `admin-edge-case-simulation.canvas.tsx`）。與本主題相關／旁證：

| 模擬 ID | 個案 | 判定 | 發現的問題 | 落點 |
| --- | --- | --- | --- | --- |
| S16 | 雙身份切 admin 收款後切回老師 | 可完成 | server 切換與敏感頁 guard 可用；須記得切回免誤改全校 | 維持現況＋操作指引；非新洞 |
| S20 | 老師請假精靈撞已點名補堂 | 可完成 | 老師失敗轉行政 — 角色邊界正確 | 生命週期 O1t／SOP；非本檔 R1 |
| — | （對照殘項） | — | 2026-08-01 R1／R2／§6 **已落 code** | R1／R2 |

## 驗收（全部或分批）

見稽核報告 §4。最低 P0 驗收：

- 老師：詳情頁不能取消課堂；API／RLS 同樣擋取消（或等價）
- ~~Admin：歷史學年（如 2526）檔期唯讀~~ → **已廢止**；非當期寫入改 Confirm＋audit（見 [`ACADEMIC_YEARS.md`](../ACADEMIC_YEARS.md) §1.1）

R1／R2 人手煙霧見 [計劃](../plans/2026-08-01-student-detail-teacher-hardening.md) §2。

## 相關主題

- RLS 總覽進度：[RLS_ROLLOUT.md](../RLS_ROLLOUT.md)（Phase C 仍進行中）
- 代堂語意：[SCHEDULE_SUBSTITUTE_TEACHER.md](../SCHEDULE_SUBSTITUTE_TEACHER.md)
- Mark 雙身份操作：[MARK_YU_ROLE_SWITCH_GUIDE.md](../MARK_YU_ROLE_SWITCH_GUIDE.md)
- 管理層新角色（勿與此混做）：[mgmt-manager-role.md](./mgmt-manager-role.md)

## 明確暫不做（本主題）

- 廣域 count 500 的全面 RLS 效能重寫（先避免無 filter head count）
- 學生聯絡欄對老師全面隱藏（待產品定案）
- 代堂班出現在「我的班別」（已知文件行為）
