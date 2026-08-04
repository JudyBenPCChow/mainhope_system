# Session HANDOFF：報讀權益池／點名宣告 Wave 1

| 欄位 | 值 |
| --- | --- |
| 日期 | 2026-08-04 |
| 主題／backlog | `docs/backlog/summer-enrollment-roster-consistency.md` |
| 分支／工作樹 | `main`；**未 commit**。關鍵未追蹤／已改：見下 |

**未提交（勿漏）**

- 新：`supabase/migrations/20260804010000_entitlement_pools_and_declarations.sql`（**遠端已 apply**）
- 新：`docs/plans/2026-08-04-enrollment-entitlement-roster.md`
- 新：`src/lib/rosterEligibilityGate.ts`、`src/lib/entitlementPackage.ts`
- 新：`src/services/entitlementQueries.ts`、`src/services/rosterEligibilityService.ts`
- 改：`src/services/scheduleRosterQueries.ts`、`src/services/studentQueries.ts`
- 改：`docs/BACKLOG.md`、`docs/backlog/summer-enrollment-roster-consistency.md`
- 勿提交：`.DS_Store`、`dist/`、`node_modules/`

## 目標

- 按已拍板 §三開工：Wave 1 基盤（schema、學年硬閘、報讀鑄池、roster 分支、shadow）
- 寫死遷移／回填規則；更新 backlog／計劃指下一波 Wave 2

## 已完成

- 計劃 Wave 0–1 ✅；計劃 §8 寫死 Wave 2 詳情
- Migration `20260804010000` 已套用 linked remote（四表＋RLS）
- 硬閘：`*SM`／`<2627` 舊路徑；`2627+` 正規 → 宣告∪試堂∪（過渡）leave makeup
- 報讀／改期／單堂選堂：`ensureEntitlementPoolAndDeclarations`／`remint`／`syncSingleLessonDeclarations`
- Shadow：`compareRosterShadow`
- `npm run build` 通過（本會話）；prod 當時 **0** 筆 `2627` 就讀
- 產品優先度已用人話釐清：開口前最低包＝改期跟名＋後加排程入紙（計劃 A＋B）；C 個別補堂高；D 扣堂可稍後；F／G／會計可遲

## 未完成／卡住

- **Wave 2 未開工**（事件寫宣告、消耗／返還、入口收斂）
- 未做 `26SM` 回歸抽樣（計劃驗證清單仍有一格未勾）
- 工作樹未 commit／未 push
- 用戶未要求改「開口前最低包」節奏（仍按計劃分 Wave；若改一氣做 A–D 須先改計劃）

## 下一步（給新會話）

1. **先 commit Wave 1**（用戶明確要求先做；否則先問）— 只 stage 上列關鍵路徑，勿 `.DS_Store`／`dist`／`node_modules`
2. 開 **Wave 2**：讀計劃 §8 — 優先 **A 取消／全班補回繼承 pool 宣告**＋**B 新增／批次排程後 ensure 宣告**（開口死線）
3. 接 **C** 個別請假補堂宣告；再 **D** `saveAttendanceStatus*` 消耗／返還；再收斂日視圖／提醒／`fetchClassStudents` 等入口
4. 驗證：`2627` 報讀→加排程→有人；取消再補回仍出名；`26SM` 抽樣不變

## 開局必讀（精簡）

- `AGENTS.md`
- `docs/backlog/summer-enrollment-roster-consistency.md`（§三定案＋§四待辦）
- `docs/plans/2026-08-04-enrollment-entitlement-roster.md`（§8 Wave 2）
- 關鍵碼：`src/services/entitlementQueries.ts`、`src/services/scheduleRosterQueries.ts`、`src/lib/rosterEligibilityGate.ts`

## 勿再踩

- `attendance_declarations.pool_id` → pools 係 **ON DELETE restrict**：remint 前須 **刪**宣告，唔好只 void 再刪池
- `schedules` **無** `is_cancelled`；取消靠 `status` 含「取消」；堂次單位多從 **class** `lesson_slots_per_session`
- 正式名單雙路徑只准 **學年 label 硬閘**；禁止同堂混用日期推期數＋宣告
- 消耗事件禁用 `revenue_*`／認列語義；會計另案不擋、亦唔做
- `26SM` 本輪不切；唔好為正規功能改壞暑期舊路徑

## 明確唔做

- Wave 3 手動加名 UI／reason 上紙；Wave 4 `26SM` 日落／廢 `makeup_of`
- 改寫收款／月費／收入認列
- 行政完工摘要（用 `mainhope-release-handoff`，非本檔）
