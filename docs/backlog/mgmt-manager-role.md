# 管理層角色分流（manager）

狀態：**open**（已規劃，未開工）  
優先：中  
來源計畫：Cursor plan「管理層角色分流」（本機 `.cursor/plans/`；下文保留矩陣摘要）

## 目標

新增角色 `manager`（管理層），與行政 `admin` 分開首頁與側欄：

- **admin**：日常事務（前台、報讀、收款、排程、點名、請假）
- **manager**：少做日常；看收入／營運分析與算堂／人工相關統計（如中學出席統計）
- **teacher**／**alien**：本期不改矩陣

雙角色沿用 `app_user_roles`／`switch_my_mgmt_role`。

## 首頁

| 角色 | `/Home` |
| --- | --- |
| admin | 現有 `AdminDashboard`（管理中心） |
| manager | 重用營運總覽 `MgmtDashboardView` |

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
| 繳費紀錄／優惠折扣 | ✓ | ✓ |
| 阿Po／AI 報表／用戶／系統日志 | —（alien） | — |

## 第一期實作（開工時）

1. `MgmtRole`／`navStructure` 加 `manager`，按矩陣改 `roles`
2. `Home` 分流；`MgmtDashboard` 守衛改 manager（暫留 alien）
3. Migration：role check、`is_mgmt_staff`、profile／switch 支援 manager
4. 收件匣 `audience_roles` 評估加 manager；更新 `AGENTS.md`／角色文件
5. RLS 第一期視同職員可讀寫（靠 UI 隱藏）；第二期再收緊寫入

## 明確不做（第一期）

- 不改 alien／teacher 矩陣
- 不做出糧引擎（仍用中學出席統計作算堂）
- 不做全新管理儀表板設計
