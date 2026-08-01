# 功課輔導班（功輔）產品功能

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open`（規格＋v2 全角色沙盒**已落地**；**待營運審閱**；未開始正式產品／DB） |
| 優先 | 中 |
| 範圍 | 一班制、按月繳費報讀（無請假、無補堂）、課室佔用、導師月度編更、獨立功輔校曆；三角色畫面 |
| 不含 | 正式產品頁／DB；計糧功輔時薪；末節自動讓房；暑期功輔；**每日功課進度（留 Notion）** |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 盤點／定案 | 2026-08-01 |
| 上次更新 | 2026-08-01（全角色沙盒落地後） |
| 相關 | [`payroll-engine.md`](./payroll-engine.md)、[`SCHEDULING_RULES.md`](../SCHEDULING_RULES.md) §4 |
| UI 設計 v1 | [`2026-08-01-homework-tutoring-ui-design.md`](../plans/2026-08-01-homework-tutoring-ui-design.md)（首輪備查） |
| UI 設計 v2 | [`2026-08-01-homework-tutoring-ui-design-v2-roles.md`](../plans/2026-08-01-homework-tutoring-ui-design-v2-roles.md)（**現行：全角色**） |
| 沙盒 | `/prototype/HomeworkTutoring`（頂部切行政／管理層／老師；不掛側欄；假資料） |

## 目前進度（2026-08-01）

### 已完成

1. 營運首輪說明與問答定案已寫入「已定產品」（含 D1 老師自助報更、D3 暫定 17:30）。
2. 排課規則 §2／§4 已對齊；文件書面語。
3. UI 設計首輪＋**v2 全角色**；每日功課進度明確留 Notion、不進本系統。
4. **UI 沙盒已落地**（假資料、不接 DB）：
   - 殼層：`HomeworkTutoringPrototypeView.tsx`（角色切換）
   - 行政：`AdminHomeworkWorkbench.tsx`（概覽／報讀含逢星期幾／月費／報更進度＋可上班＋月工作表／校曆／設定）
   - 管理層：`ManagerHomeworkWorkbench.tsx`（監督首屏／當值／報更進度／月費異常）
   - 老師：`TeacherHomeworkWorkbench.tsx`（報更提交／我的當值／放假日）
   - 共用：`mockData.ts`、`sharedUi.tsx`
   - 聯動可驗：老師提交十月報更 → 行政見進度 → 發布後老師端鎖定

### 下一步（本主題）

1. **營運審閱** v2 設計稿＋沙盒（`npm run dev` 後開 `/prototype/HomeworkTutoring`；若 `127.0.0.1` 連唔到可試 `localhost`）。
2. 審閱後再補：價錢表、部分月份計費、九月校曆、報更正式截止日、末節讓房（可後補）。
3. 以上齊備後再開正式實作計畫（Schema／RLS／側欄入口）。

### 尚未開始：正式產品實作

- Schema／RLS、正式報讀月費、課室編更、獨立月曆
- 計糧功輔時薪（交計糧引擎）
- 正式側欄入口

### 阻塞正式開工（待營運補齊）

價錢表、部分月份計費表、功輔九月校曆、末節讓房規則、報更正式截止日。

---

## 角色畫面索引（v2）

| 角色 | 沙盒視角 | 主畫面 |
| --- | --- | --- |
| admin／alien | 行政 | 概覽、報讀、月費、當值編更（進度＋匯總＋發布）、校曆、設定 |
| manager | 管理層 | 監督首屏、本月當值、報更進度、月費異常 |
| teacher | 老師 | 功輔報更、我的當值、放假日 |

詳見 [v2 UI 設計](../plans/2026-08-01-homework-tutoring-ui-design-v2-roles.md)。

---

## 現況對照（系統）

| 項目 | 現況 |
| --- | --- |
| 科目 | `subjects` 已有 `HWK` |
| 班型 | `class_kind` 僅 `group`／`private` |
| 排課規則 | §4 已對齊；末節讓房待定 |
| 計糧 | 功輔暫不開工 |
| 產品功能 | 僅 UI 沙盒；正式未實作 |

---

## 已定產品（2026-08-01 營運回覆）

### 班別與報讀

- **全體學生歸於同一班**（混級共用同一當值場次）。
- **每週三日、四日或五日為固定價目檔次**。
- **可紀錄慣常到校星期**（與價目檔日數一致）；**不限制**實際到校；不扣堂、不補堂。
- 按月繳費報讀；不設請假／補堂流程。

### 時間與課室

- 一至五 **15:30–19:30**；課室佔用自 **15:15**；房號非固定。
- **不適用**專科逾期罰款／禁止入室。

### 日曆

- 功輔校曆與專科校曆分開；九月表待補。

### 導師編更

- 每月前收集可上班 → 月工作表；盡量全日同一人；可分上下節。

### 每日功課進度

- **不進本系統**；繼續 Notion（每生一頁、影相＋打字）。日後若需入口，最多報讀列外開連結。

### 薪酬

- 本期不處理；見計糧引擎。

---

## 導師編更 — 工程建議（D1–D3）

| # | 建議 |
| --- | --- |
| **D1** | **老師自助報更為主**（每平日 → 全日／上節／下節／不可）。admin／alien 可代填與覆寫；manager 以看齊交進度為主。 |
| **D2** | 月工作表發布後寫入佔用＋當值老師；不做學生點名紙。發布後該月老師報更鎖定。 |
| **D3** | 上下節兩段排程；暫定分界 **17:30**。與專科／課室同時段硬性禁止。 |

---

## 暫緩／後補

| # | 項目 | 狀態 |
| --- | --- | --- |
| B2 | 部分月份計費表 | 後補 |
| B3 | 價錢表 | 後補 |
| C2 | 末節讓房 | 稍後再議 |
| C3 | 功輔九月校曆 | 尚未公布 |
| E | 時薪／佣金 | 待計糧 |
| D3 分界 | 17:30 | 暫定 |
| 報更截止日 | 沙盒示範「上月 25 日」 | 正式日後補 |

---

## 工程備註

1. 價錢／計費／校曆未齊前，不開始正式收費與獨立月曆 DB 實作。
2. 排課政策見 `SCHEDULING_RULES.md` §4。
3. UI 以 v2 全角色為準；沙盒驗收後再開正式 `docs/plans/…` 實作計畫。

## 待做

- [x] 營運回覆主幹；D 建議入檔
- [x] 排課 §4；書面語
- [x] UI v1＋v2 全角色；Notion 功課進度範圍決定
- [x] D1 改老師自助報更；三角色沙盒落地
- [ ] 營運審閱 v2／沙盒
- [ ] B2／B3／C2／C3／報更截止日
- [ ] 正式實作計畫與 Schema（分期後）

## 相關路徑

| 用途 | 路徑 |
| --- | --- |
| 沙盒入口 | `/prototype/HomeworkTutoring`（`src/pages/PrototypeHomeworkTutoring.tsx`） |
| 沙盒程式 | `src/prototypes/homeworkTutoring/`（Admin／Manager／Teacher workbench） |
| UI v2 | [`docs/plans/2026-08-01-homework-tutoring-ui-design-v2-roles.md`](../plans/2026-08-01-homework-tutoring-ui-design-v2-roles.md) |
| 排課 §4 | [`SCHEDULING_RULES.md`](../SCHEDULING_RULES.md) |
| 計糧 | [`payroll-engine.md`](./payroll-engine.md) |
| 正規月費（功輔不適用） | [`TUITION_TERM_AND_LATE_FEE_POLICY.md`](../TUITION_TERM_AND_LATE_FEE_POLICY.md) |
