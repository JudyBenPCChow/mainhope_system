# 計糧引擎

| 欄位 | 值 |
| --- | --- |
| 狀態 | `in_progress`（**暫等 Mark Yu 回覆**；規格已整理；**UI 預覽已上** `/Payroll`，示範資料不接真實計算） |
| 優先 | 中 |
| 範圍 | **本期**：專科班分成／HC、固定月薪、獨立定價、WFH、MPF、月結明細。**暫緩**：功課班時薪及 Christine Fan 功課班佣金 |
| 不含 | 完整會計／HR 系統、銀行付款執行、未獲營運確認的規則自動化；本期亦不做功課班計糧 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 營運指南（財務／管理層） | [`PAYROLL_GUIDE.md`](../PAYROLL_GUIDE.md)（另有 `.docx`） |
| 最新方法（工程規格） | [`2026-08-01-payroll-method-revised.md`](../plans/2026-08-01-payroll-method-revised.md) |
| 待回覆文件 | [`2026-08-01-payroll-questions-for-response.docx`](../plans/2026-08-01-payroll-questions-for-response.docx) |

## 目前進度（2026-08-01）

### 阻塞／等待

- **暫等 Mark Yu 回覆**。其餘可定案規則已寫入營運指南；**正式計算引擎／schema 待其回覆後再開工**。

### 已完成：規格與文件

1. 已閱讀營運提供的原始計糧規則，完成薪酬模式及現有資料來源盤點。
2. 已完成計糧 UI 初稿、設計前置問題及管理層第二期顧問審查。
3. 已整理 Word 回覆表，並按多輪營運回覆更新修訂版方法。
4. 已撰寫財務／管理層用 [`PAYROLL_GUIDE.md`](../PAYROLL_GUIDE.md) 及 Word 版（書面語、具名同事、例子、出糧流程）。
5. 已定案要點（摘要）：
   - 專科班按實際扣堂計薪，不按收款日期；欠費不影響已完成課堂薪酬；
   - 分成按原價；10% 只計其他教師指定科目，不與本人 60% 重複；
   - 代堂歸當日授課教師；分成制主責代堂時無 60%，但有 10% 佣金；
   - PT HC 按實際扣堂人數；單對單＝一對一；一對二剩一人則改開一對一；
   - MPF 只計 Mark Yu、Christine Fan、Sophie Yu、Katie Lee（含法定上下限）；
   - 退款／已結算後改數屬異常，人手調整並由管理層核准；
   - 功課班本期暫緩；Christine Fan 功課班佣金門檻記下為報讀人數 ≥ 12。

### 已完成：UI 預覽（示範資料）

- 路由 `/Payroll`（側欄「計糧（UI 預覽）」；`admin`／`manager`／`alien` 可開；頁內切換預覽身份）
- 程式：`src/prototypes/payroll/*` + 薄頁 `src/pages/Payroll.tsx`
- **不接** Supabase／點名／學費；狀態只存在本頁
- **財務工作台**：異常待辦（硬阻擋／提醒）、堂數總覽、逐堂明細、人手調整入口、**提交核實**（不可結算）
- **管理層核實台**：待核實卡片摘要、較上月%、抽查明細、**退回財務**／**核實並結算**、結算後正式 CSV
- 流程 mock：`財務審閱中` → `待管理層核實` → `已結算`（或退回）
- **獨立沙盒站**（給 Mark 遠端撳）：`sandbox/payroll-ui/`；建置 `npm run sandbox:payroll:build`；部署 `npm run sandbox:payroll:deploy`（Vercel 專案 `mainhope-payroll-ui-sandbox`，無 Supabase／無登入）
- **財務審核便利性審查**（2026-08-01）：[`../audits/2026-08-01-payroll-finance-ui-review.md`](../audits/2026-08-01-payroll-finance-ui-review.md)
- **Cody 財務孤軍審核模擬**（2026-08-01）：[`../audits/2026-08-01-payroll-cody-finance-audit-simulation.md`](../audits/2026-08-01-payroll-cody-finance-audit-simulation.md)
- 正式 `finance` 角色尚未入 `mgmtRole`／RLS

### 尚未開始：正式程式實作

- payroll schema／migration；
- 計糧 service、純計算引擎及查詢；
- 正式 `/Payroll`（接真實資料）及月結 snapshot；
- 費率或人手工時輸入；
- CSV／糧單匯出；
- golden test；
- linked production migration。

## 仍待回覆（再開工前）

1. **Mark Yu 的回覆**（目前主阻塞）；
2. 異常阻擋結算建議表是否採納（見修訂方法 §13.4／指南 §15.4）；
3. §8.5 過渡期若仍有「其他」做法需書面確認（工程暫按原價）。

已定案／暫緩，不再列為阻塞：

- MPF；
- 分成制代堂；
- 折扣基數一律原價；退款人手處理；
- 功課班整組（本期不做；日後見 [`homework-tutoring.md`](./homework-tutoring.md)）。

## 工程前置（Mark Yu 回覆後）

1. 未回覆項目不得以工程預設取代。
2. 功課班未定案前，功課班計算暫不開工。
3. 更新完整計算範例（原始「本人指定科目 60%+10%」理解已作廢）。
4. 逐節授課以 `schedules.teacher_id` 為準（層 A 前置；老師詳情出勤／禁點名後取消代堂已落一部分，見 [`substitute-teacher-reporting.md`](./substitute-teacher-reporting.md)）。

## 相關文件

- [計糧指南（營運）](../PAYROLL_GUIDE.md)
- [修訂版計糧方法](../plans/2026-08-01-payroll-method-revised.md)
- [設計前置問題](../plans/2026-08-01-payroll-design-questions.md)
- [計糧 UI 設計](../plans/2026-08-01-payroll-ui-design.md)
- [管理層第二期顧問審查](../audits/2026-08-01-mgmt-phase2-review.md)
- [代堂算薪／出勤報表歸屬](./substitute-teacher-reporting.md)
