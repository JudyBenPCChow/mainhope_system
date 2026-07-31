# 老師角色 · 桌面 vs 手機模擬測試（2026-07-31）

| 欄位 | 值 |
| --- | --- |
| 日期 | 2026-07-31 |
| 範圍 | `mgmt_role=teacher`；桌面 Layout vs 手機 MobileLayout（`<768px`） |
| 方法 | 程式碼層面模擬（條件渲染／breakpoint／角色守衛）；非真機瀏覽器操作 |
| 產物 Canvas | Cursor canvases `teacher-desktop-mobile-parity.canvas.tsx` |
| 跟進 | [mobile-ui.md](../backlog/mobile-ui.md) · [role-ops-hardening.md](../backlog/role-ops-hardening.md) 殘項 |

## 總評

核心教學流程（點名、班別、教學紀錄、出席）手機大致可用甚至更好。真正落差：

1. **功能缺口**：老師手機不能用排程日視圖（`allowMobileDayView = isMgmtStaff()`）
2. **體驗降級**：一對一／時間表／收件匣寬表橫滑；底欄無排程捷徑
3. **權限旁路（裝置無關）**：`/Students` 列表 redirect 老師，但詳情 `/Students/:id` 仍可見繳費／新增請假

## 工作流摘要

| ID | 場景 | 對等性 |
| --- | --- | --- |
| W1 | 今日課表／排程 | 手機缺日視圖 |
| W2 | 進行點名 | 對等（手機卡片較佳） |
| W3 | 一對一預約 | 功能在、橫滑摩擦高 |
| W4 | 班別詳情／代堂 | 權限一致；版面可接受 |
| W5 | 點進學生詳情 | 裝置對等，角色過度開放 |
| W6 | 預約空房 | 能預約；找空檔較慢 |
| W7 | 教學紀錄／出席 | 大致對等 |

## 建議優先序

| 優先 | 項 | 歸屬 |
| --- | --- | --- |
| P0 | 學生詳情依角色隱藏繳費／作廢／（視政策）新增請假 | role-ops 殘項 |
| P1 | 老師手機排程可視化（日視圖或今日課室摘要） | mobile-ui |
| P2 | 一對一／收件匣手機卡片化 | mobile-ui |
| P3 | 底欄／首頁排程捷徑微調 | mobile-ui |
