# 計糧引擎

| 欄位 | 值 |
| --- | --- |
| 狀態 | `done`（2026-08-05：本期正式引擎已接線；schema／計算／`/Payroll` 真點名；審閱／核實／結算已持久化。2026-08-07：Sophie Yu 已入冊＋固定月薪。功課班仍暫緩；費率頁／銀行帳號／Cody 入冊屬下一波） |
| 優先 | 中 |
| 範圍 | **本期**：專科班分成／HC、固定月薪、獨立定價、WFH、MPF、月結明細。**暫緩**：功課班時薪及 Christine Fan 功課班佣金 |
| 不含 | 完整會計／HR 系統、銀行付款執行、未獲營運確認的規則自動化；本期亦不做功課班計糧 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 營運指南（財務／管理層） | [`PAYROLL_GUIDE.md`](../policies/staffing/PAYROLL_GUIDE.md)（另有 `.docx`） |
| 最新方法（工程規格） | [`2026-08-01-payroll-method-revised.md`](../plans/2026-08-01-payroll-method-revised.md) |
| 沙盒 UI 下一步（分頁 IA＋首次 UX） | [`2026-08-02-payroll-tabbed-ia.md`](../plans/2026-08-02-payroll-tabbed-ia.md) |
| 待回覆文件 | [`2026-08-01-payroll-questions-for-response.docx`](../plans/2026-08-01-payroll-questions-for-response.docx)（規則項已回覆完） |

## 目前進度（2026-08-04 晚）

### 已完成：正式引擎（端到端第一波）

1. **Schema**（`20260804190000_payroll_engine_schema.sql`，已套用遠端）：
   - `payroll_rates`（Mark／Christine／Katie／Judy／Sum／Cyndi／其餘預設兼職 HC）
   - `payroll_runs`（月份狀態＋結算 `snapshot`）
   - `payroll_teacher_states`（審核／排除／送核）
   - `payroll_manual_hours`（WFH）
   - `payroll_adjustments`
2. **純計算**：`src/lib/payroll/*`＋ golden tests
3. **Service**：`src/services/payrollQueries.ts`（`schedules.teacher_id`＋扣堂白名單）
4. **UI**：`/Payroll` 接真資料；側欄「計糧」；標籤「正式資料 · 點名／排程即時計算」
5. **流程**：財務審閱 → 提交 → 管理層結算 freeze；退回／重算／調整／排除已落 DB

### 已知缺口／跟進

- **Sophie Yu**（2026-08-07）：已入 `teachers`＋`payroll_rates` 固定月薪 $16,000（MPF 前；`mpf: true`）；migration `20260807094500_sophie_yu_payroll_enrollment.sql`
- **Cody Cheong** 不在 `teachers` 表 → WFH 列暫不會出現
- 功課班整組仍暫緩
- 費率管理 UI（`/Payroll/Rates`）未做
- CSV 銀行帳號仍為佔位
- 沙盒站可保留 mock；主系統已接真
- **財務核對 UX**（Cody 08-05 回饋）→ 另題 [`payroll-finance-review-ux.md`](./payroll-finance-review-ux.md)；唔好當引擎未完成而重開本題

### 2026-08-05：未點名改跟點名紙

- **問題**：`buildLessonInputsForMonth` 用班別「而家就讀中」人數判斷未點名 → 第二期先報讀生會令第一期空堂誤擋（例：Liam／朱俊賢）。
- **修正**：改呼叫 `fetchScheduleRosterContext`＋`rosterHeadcountForSchedule`（報讀日／退讀日／暑期期數／單堂／試堂／補堂，與點名紙一致）。
- 離線引擎 `MAINHOPE-07payroll` 同樣補上期數過濾（報讀日原本已正確）。

### 已完成：規格與文件

規則定案、指南、§8.5／§13.4、`finance` 角色等見前版紀錄。

## 工程下一波

1. Cody 入冊＋WFH 費率
2. 費率管理頁
3. 真實銀行帳號欄
4. 功課班（待 backlog）
5. 財務核對 UX → [`payroll-finance-review-ux.md`](./payroll-finance-review-ux.md)

## 相關文件

- [計糧指南（營運）](../policies/staffing/PAYROLL_GUIDE.md)
- [修訂版計糧方法](../plans/2026-08-01-payroll-method-revised.md)
- [代堂算薪／出勤報表歸屬](./substitute-teacher-reporting.md)
