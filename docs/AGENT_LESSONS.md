# Agent 錯題本

可復用教訓。Session 進度見 `docs/handoffs/*-session.md`。長期鐵則見 `AGENTS.md`。

## 教訓

### 2026-08-04 — 大改點名資格先落地基再接事件
- **情境**：報讀包裝／點名權益（池＋宣告）；現役暑期須維持舊路徑，正規學年即將開口報讀。
- **錯在邊**：若 Wave 1 一次捆綁取消／補堂／扣堂／全入口，難驗、易濺現役學年；亦難分「地基錯」定「流程錯」。
- **正確做法**：先 schema＋學年硬閘＋報讀鑄池／自動宣告＋shadow；再開事件寫宣告與消耗。開口前最低營運包另列（改期跟名＋後加排程入紙），唔同手動加名／暑期切換捆綁。
- **若已升格**：未升格（見計劃 `docs/plans/2026-08-04-enrollment-entitlement-roster.md` §3／§8）

### 2026-08-04 — remint 權益池前先刪宣告
- **情境**：`attendance_declarations.pool_id` references pools `ON DELETE restrict`。
- **錯在邊**：只把宣告 `void` 再 `delete` pool → FK 失敗。
- **正確做法**：改包裝重鑄時先 `delete` 該 pool 下宣告（或改 in-place update），再刪／重建池。
- **若已升格**：未升格
