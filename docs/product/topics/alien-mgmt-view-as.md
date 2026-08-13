# Alien 模擬職員身份（view-as）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open`（idea；未開工） |
| 優先 | 中 |
| 範圍 | **alien** 可暫時以另一位職員（admin／manager／finance／teacher）視角檢視後台畫面，用於對方報「畫面有問題」時支援排查 |
| 角色 | 僅 **alien** 可啟動；模擬對象為任意已有 `app_users`／`app_user_roles` 嘅職員 |
| 不含 | 真登入對方帳密、改對方密碼、雙角色（自己帳戶加多個 role——已有 `RoleSwitcher`／`switch_my_mgmt_role`）、家長 Portal view-as（已有） |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 靈感來源 | 2026-08-05：對方報畫面問題時，要用佢角色睇實際畫面 |

## 結論

現有「目前操作身份」只切換**本帳戶已獲授予**嘅角色，唔等於扮成另一位老師／行政。支援排查需要 **view-as／impersonation**：揀目標用戶 → 以對方 `role`＋`teacher_id` 驅動畫面 → 明顯橫幅＋一掣還原。

**僅 idea；先不實作。**

## 建議分期（開工時）

| 期 | 內容 | 粗估 | 備註 |
| --- | --- | --- | --- |
| **A. 前端-only** | 覆寫 auth context／`localStorage`（role、teacher_id、顯示名）；頂部橫幅；建議禁 UI 寫入 | 0.5–1 日 | 殼層／`teacherScope` 列表接近對方；**RLS 仍係 alien**，資料可能比對方多 |
| **B. DB view-as** | 跟家長 Portal `portal_staff_view_as` 模式：session 表 + start／stop RPC；覆寫 `current_app_role()`／`current_teacher_id()`；稽核 start／stop；寫入用真實 alien 或硬禁寫 | 2–4 日 | 讀過濾接近對方；動安全核心函式，要回歸老師／行政分流 |
| **C. 全保真** | Edge／操作紀錄行為人都變成對方 | 再 +2–4 日 | 支援排查通常過剩，不做為預設 |

務實順序：**先 A 解決多數 UI 排查 → 真撞資料落差再上 B。C 預設不做。**

## 待決（開工前）

1. 模擬範圍：任意職員 vs 只限 teacher／只限某批帳號  
2. 模擬期間寫入：硬禁 vs 仍以 alien 寫（稽核記 alien）  
3. 逾時自動停止、同 Session 多裝置行為  
4. 入口位置（側欄帳號區／用戶管理旁／隱藏指令）

## 待做（摘要）

1. 產品拍板期別（A 或 A→B）與寫入政策  
2. UI：揀人、橫幅「正在以某某視角檢視」、還原  
3. （A）前端 effective profile 覆寫  
4. （B）migration：`mgmt_staff_view_as`＋覆寫兩個 getter＋RPC；回歸 RLS／老師範圍頁  
5. 文件：`SYSTEM_MANUAL`／角色說明加一句「僅 alien、支援用」

## 相關

- 現有雙角色切換：[`RoleSwitcher.tsx`](../../src/components/account/RoleSwitcher.tsx)、`switch_my_mgmt_role`  
- 老師前端範圍：[`teacherScope.ts`](../../src/lib/teacherScope.ts)  
- 家長 Portal 藍本：`supabase/migrations/20260721030000_portal_staff_view_as.sql`  
- 角色：[`mgmtRole.ts`](../../src/lib/mgmtRole.ts)
