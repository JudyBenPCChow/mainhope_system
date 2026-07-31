# 學生詳情老師加固 — 對抗性日常運作模擬（2026-08-01）

| 欄位 | 值 |
| --- | --- |
| 日期 | 2026-08-01 |
| 範圍 | R1／R2／§6 落 code 後嘅 `StudentDetailView`＋相關 fetch／入口 |
| 方法 | 程式碼層面場景模擬（非真機瀏覽器） |
| 前序 | [暴露報告](./2026-08-01-student-detail-teacher-exposure.md) · [審閱](./2026-08-01-student-detail-teacher-review.md) · [計劃](../plans/2026-08-01-student-detail-teacher-hardening.md) |
| 總評 | **大致安全** — 老師側無 P0；P1 殘留已於同日跟進修補 |

---

## 總評

主目標已達：老師 deep-link 入學生詳情唔見繳費、唔代請假、唔見假開放寫入掣；行政路徑大致不變。  
日常點名→睇學生、收款（老師）、行政改報讀**唔會斷**。

### 旗標實況（修補後）

| 旗標 | 定義 |
| --- | --- |
| `canViewMoney` | `isMgmtStaff()`（admin／manager／alien 可睇繳費） |
| `canMutateLeave` | `isAdminOrAlien()`（學生詳情新增請假） |
| `canMutateStudentOps` | `isAdminOrAlien()`（報讀／待補／基本寫入） |
| `canOpenLeaveManagement` | `isMgmtStaff()`（深連結請假管理；manager 可） |
| `canRegisterPayment`／`canVoidPayment`／`canDeleteAttendance` | `isAdminOrAlien()` |

---

## P1 修補紀錄（同日）

| 項 | 處理 |
| --- | --- |
| 請假／待補死胡同 | 老師 banner／leave 區加「補堂安排請交行政處理」 |
| balances 打 payments | `fetchLessonBalancesForStudent(sid, { includePaidLessons: staff })`；老師 skip |
| manager 假開放 | 拆旗標：可睇錢、唔新增繳費／唔代請假／唔寫報讀；仍可開 LeaveManagement |
| 「管理報讀」文案 | 非 mutate 角色顯示「查看報讀／查看一對一」 |

---

## 日常運作會否有問題？

| 場景 | 結論 |
| --- | --- |
| 點名 → 睇學生 | **唔阻業務** |
| 請假跟進 | 老師可睇＋有交行政提示；行政／manager 可入請假管理 |
| 代堂 | **與本票無關／唔壞** |
| 收款 | 老師無；manager 唯讀；admin／alien 可登記 |
| 行政改報讀／記待補 | **無回歸** |

---

## 仍延後（非本票）

- 家長電話對老師全面隱藏
- Enrollment select 仍可能帶 `price_per_lesson`（UI 已藏）
- 寫入 handler 二次 assert（靠 UI＋RLS）
