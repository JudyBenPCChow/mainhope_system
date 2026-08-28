# 管理層角色分流（manager）

狀態：**done**（第一期已落地；RLS 讀寫分離屬第二期）  
優先：中  
來源計畫：[2026-08-01-mgmt-manager-role.md](../plans/2026-08-01-mgmt-manager-role.md)（實作計劃＋市場研究第二期 roadmap）  
顧問審查：[2026-08-01-mgmt-manager-role-review.md](../audits/2026-08-01-mgmt-manager-role-review.md)（有條件通過；紅黃項已全數吸收進計劃）

## 目標

新增角色 `manager`（管理層），與行政 `admin` 分開首頁與側欄：

- **admin**：日常事務（前台、報讀、收款、排程、點名、請假）
- **manager**：工作節奏與行政不同——以決策／營運監督為主（收入、人數、算堂相關統計等），不是第二個行政工作台
- **teacher**／**alien**：本期不改矩陣

雙角色沿用 `app_user_roles`／`switch_my_mgmt_role`。

## 體感 vs 權限（定案原則）

「少做日常」是**用戶體感／資訊架構**，不是把 manager 讀權限收窄過 admin。

| 層 | 原則 |
| --- | --- |
| **入口體感** | 首頁、側欄、預設路徑以決策性功能為主；行政日常（收款、前台、點名等）不推到最前——因為管理層未必天天做這些 |
| **讀取（RLS／資料）** | **manager ≥ admin**：admin 讀得到的營運資料，manager 不應因 RLS 讀不到（含 embed／join，如優惠目錄名、`courses.course_name`）。側欄隱藏 ≠ 資料禁止 |
| **寫入／破壞性** | 仍可窄過 admin：收款、作廢、點名刪改等用 `isAdminOrAlien()` 等守衛；與「入口體感」分開處理 |

改 nav 或 RLS 時：勿把「側欄不顯示」誤做成「manager 讀唔到」；亦勿為了讀權限而把日常入口塞滿管理層側欄。

## 三條硬規則

1. **首頁固定**：`manager` 的 `/Home` 一律為營運總覽（`MgmtDashboardView`）
2. **日常入口不主推**：側欄／預設深連結不含前台精靈、明日提醒、點名、話術庫、家長報讀申請、試堂、宣傳配對、課室、老師請假處理、約房審批、收款登記（體感分流；**不是**讀權限否定）
3. **敏感主控仍限 admin|alien**：用 `isAdminOrAlien()` 保護收款、點名刪改、優惠折扣維護、用戶管理等**寫入／破壞性**操作

## 首頁

| 角色 | `/Home` |
| --- | --- |
| admin | 現有 `AdminDashboard`（管理中心） |
| manager | 重用營運總覽 `MgmtDashboardView` |

## 權限語義

| 層級 | manager 第一期 |
| --- | --- |
| 可看（資料） | 原則上不少於 admin 可讀的營運資料；側欄以監督／分析為主呈現（營運總覽、人數報表、中學出席、收件匣、學生／班別／老師／檔期／排程／校曆／教學紀錄／請假管理／出席一覽、繳費紀錄、堂數對帳、增退等） |
| 可編（有限） | 非金錢／非點名破壞性監督項；無唯讀模式則「可進頁＋藏寫入鈕」 |
| 入口不主推／寫入不可 | 收款登記、前台／試堂日常入口、點名刪改、優惠目錄維護、用戶／系統、角色授予 |

RLS：職員讀取走 `is_mgmt_staff()`（含 manager）。已知債：第一期多數表仍 `FOR ALL`；第二期再拆 reader／writer。

## 可見矩陣（摘要）

| 區塊 | admin | manager |
| --- | --- | --- |
| 前台精靈／明日提醒／點名／話術庫 | ✓ | — |
| 收件匣 | ✓ | ✓ |
| 學生／一對一／增退／堂數對帳 | ✓ | ✓（監督） |
| 家長報讀申請／試堂／宣傳配對 | ✓ | — |
| 人數報表／中學出席統計／營運總覽 | — | ✓ |
| 班別／老師／檔期 | ✓ | ✓ |
| 課室／請假處理精靈／約房審批 | ✓ | — |
| 排程／校曆／教學紀錄／請假管理／出席紀錄 | ✓ | ✓ |
| 收款登記 | ✓ | — |
| 日記帳入帳／查詢 | ✓（前台科目） | ✓（全帳＋可入） |
| 成本分析 | — | ✓ |
| 繳費紀錄 | ✓ | ✓（唯讀監督） |
| 優惠折扣 | ✓ | —（僅 admin＋alien） |
| 阿Po／AI 報表／用戶／系統日志 | —（alien） | — |

## 第一期實作（開工時）

詳見計劃檔；摘要：

1. `MgmtRole`／`navStructure` 加 `manager`，按矩陣改 `roles`（⚠️ `MgmtRole` 與 `Role` 是兩個獨立 union type，都要加）
2. **必須**新增 `isAdminOrAlien()` helper；破壞性操作**不可**用擴張後的 `isMgmtStaff()`
3. `Home` 分流；`MgmtDashboard`／`EnrollmentReports`／`SecondaryAttendanceReport` 守衛改 explicit manager\|alien（**不可**用 `isMgmtStaff()`）
4. Migration：CHECK constraint 用 DROP + ADD（PG 不支援直接 ALTER）；`is_mgmt_staff` 含 manager；所有 `current_app_role() in/not in (...)` 處加 `'manager'`；附 rollback SQL
5. 收件匣 `audience_roles` 加 manager；系統通知預設含 manager；`void-payment` edge 同步
6. RLS 第一期視同職員可讀寫（靠 UI＋守衛＋assert 隔離；標已知債）；第二期再收緊寫入
7. 更新 `AGENTS.md`／`TERMINOLOGY.md`／角色文件

## 明確不做（第一期）

- 不改 alien／teacher 矩陣
- 不做出糧引擎（仍用中學出席統計作算堂）
- 不做全新管理儀表板設計
- 優惠折扣不開給 manager（維持 admin＋alien）
