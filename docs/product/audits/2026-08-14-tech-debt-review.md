# 全盤技術債檢視（2026-08-14）

| 欄位 | 值 |
| --- | --- |
| 類型 | 已完成調查（代碼庫 + production advisors／表統計） |
| 跟進主題 | [`tech-debt-hardening.md`](../topics/tech-debt-hardening.md)（P0-1／2／P1-4）；[`mainline-quality-gate.md`](../topics/mainline-quality-gate.md)（P0-3／P2-3）；[`auth-leaked-password-protection.md`](../topics/auth-leaked-password-protection.md)（P0-4）；P1–P3 歸屬見下方 |
| Canvas | Cursor Canvas `tech-debt-audit.canvas.tsx` |
| 不含 | 家長 Portal 前端（本 repo 無）；Edge Function 逐支對抗；瀏覽器 E2E |

調查當日：`npm run lint` 37 error；`npm test` 94 pass／1 fail／2 skip；`ui:check` 7 違規。Production `MainHope_production` security advisor 84（73 WARN）、performance 145（55 WARN）。Staging `mainhope-staging` **INACTIVE**。src 115,618 行；測試 2,020 行（約 1.7%）。

## 清單（按嚴重性）

| 級 | ID | 問題 |
| --- | --- | --- |
| P0 | P0-1 | DB 權限粗過 UI 角色（`is_mgmt_staff()` 寫入面含 finance／manager） |
| P0 | P0-2 | 前端守衛讀 `localStorage.mgmt_role`，唔係 Auth |
| P0 | P0-3 | 主線無品質閘（lint／test／ui:check／build 唔擋 PR）→ [討論方案](../topics/mainline-quality-gate.md) |
| P0 | P0-4 | Auth leaked-password protection 關住 → **已拆出** [`auth-leaked-password-protection.md`](../topics/auth-leaked-password-protection.md) |
| P1 | P1-1 | 權益雙路徑；2627 live E2E 未驗 |
| P1 | P1-2 | God files（StudentDetail 3143／ClassDetail 3060／ScheduleManage 2936） |
| P1 | P1-3 | 無 generated Database types |
| P1 | P1-4 | 頁級守衛唔齊；部分頁 Role 型缺 manager／finance |
| P1 | P1-5 | 正式 `/Payroll` 仍掛 `PayrollPrototypeView` → **2026-08-15 已改** `PayrollView`（`src/components/payroll/`） |
| P1 | P1-6 | `queries.listStudents()` 全表 `select *` 仍被請假／試堂頁用 |
| P2 | P2-1 | Production linter 堆積（53 DEFINER 可執行、54 multiple permissive、48 未索引 FK） |
| P2 | P2-2 | 計糧／營運總覽慢（已有主題 [`page-load-perf-payroll-mgmt.md`](../topics/page-load-perf-payroll-mgmt.md)） |
| P2 | P2-3 | 測試覆蓋薄；tsc 排除 `*.test.ts`；Playwright 未接 |
| P2 | P2-4 | 沙盒路由未清（`/prototype/HomeWayfinding` 免登入）；`dead-surface-cleanup` 文件過時 |
| P2 | P2-5 | `TeacherHomeView` 直接打 `trial_sessions`；dashboard 錯誤當 0 |
| P3 | P3-1 | `mingxue-admin` 包名、Base44 `app-params`／`entities.ts` 殘渣、重複 email index |

P0-1／P0-2 見 [tech-debt-hardening.md](../topics/tech-debt-hardening.md)。P0-3 見 [mainline-quality-gate.md](../topics/mainline-quality-gate.md)。P0-4 見 [auth-leaked-password-protection.md](../topics/auth-leaked-password-protection.md)。

## P1–P3 backlog 歸屬（2026-08-15）

| ID | 處置 | Backlog 主題 |
| --- | --- | --- |
| P1-1 | 併既有題 | [報讀包裝與點名權益](../topics/summer-enrollment-roster-consistency.md)：完成 `2627` live E2E／雙路徑日落條件 |
| P1-2 | 與 P2-5 合併 | [前端架構邊界／God files 收斂](../topics/frontend-architecture-boundaries.md) |
| P1-3 | 與 P2-1、P3-1 DB 部分合併 | [Database schema contract／advisor 清理](../topics/database-contract-advisor-hygiene.md) |
| P1-4 | 併 P0-2 | [技術債／工程硬化](../topics/tech-debt-hardening.md)：Auth 真源、route-role 矩陣、頁級守衛、Role 型 |
| P1-5 | 已完成，不留 open 假待辦 | 2026-08-15 `/Payroll` 已改 `PayrollView` 並遷 `src/components/payroll/`；記錄留 [主線品質閘](../topics/mainline-quality-gate.md) |
| P1-6 | 併既有題 | [軟封存與查詢收窄](../topics/soft-archive-query-scope.md)：請假／試堂用途專用學生 option query |
| P2-1 | 與 P1-3 合併 | [Database schema contract／advisor 清理](../topics/database-contract-advisor-hygiene.md) |
| P2-2 | 併既有題 | [計糧／營運總覽載入偏慢](../topics/page-load-perf-payroll-mgmt.md) |
| P2-3 | 併 P0-3 | [主線品質閘](../topics/mainline-quality-gate.md)：test typecheck＋風險導向 regression；不設空泛 coverage 門檻 |
| P2-4 | 與 P3-1 前端殘渣合併 | [死碼／路由表面清理](../topics/dead-surface-cleanup.md) |
| P2-5 | 與 P1-2 合併 | [前端架構邊界／God files 收斂](../topics/frontend-architecture-boundaries.md) |
| P3-1 | 拆到兩個相近主題 | Base44／package／`entities.ts` → [死碼清理](../topics/dead-surface-cleanup.md)；duplicate index／殘留表 → [DB contract／advisor](../topics/database-contract-advisor-hygiene.md) |

以上每項已有 backlog 歸屬；P1-5 因已完成只留證據，不放進「進行中／未完成」。
