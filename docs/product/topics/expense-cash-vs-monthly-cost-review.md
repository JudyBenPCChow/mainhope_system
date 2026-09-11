# 現金列帳 vs 月攤成本：顧問審閱

| 欄位 | 值 |
| --- | --- |
| 狀態 | **顧問意見，未改系統、未拍板**（不阻擋分題既有決策） |
| 對象 | [`expense-cash-vs-monthly-cost.md`](./expense-cash-vs-monthly-cost.md) |
| 性質 | 可行性審閱＋範圍建議；不含實作 |
| 日期 | 2026-09-11 |
| 母題 | [`hk-expense-cost-stats.md`](./hk-expense-cost-stats.md) |
| 結論 | 方向正確，**但不可照現行波次開工**；一期工程量被低估 |

---

## 一句

雙視角、查詢時展開、不加金額門檻都是對的；但一期真正的工程量不在「加兩欄＋平攤函式」，而在**「成本月」的查詢窗口必須由「繳費日」改成「服務期與該月重疊」**——文件未提及，而它會改動 `/HkExpenses` 內全部數字（KPI、科目表、老師表、趨勢圖）。另有 3 處必須在 DB 落地、1 個演算法邊界未定義、2 處對外承諾與實況不符。

---

## 一、站得住的部分（不必再討論）

| 項 | 依據 |
| --- | --- |
| D7-A 查詢時展開，不物化 | 成本帳一年百餘筆，計算量可忽略；物化表要 trigger 維護，且與「改服務期即時重算」直接互斥 |
| 不加金額門檻、沿用科目 visibility | 行政只有 `expenses.record`（`supabase/migrations/20260829054300_admin_expense_journal_visibility.sql:27-29`），RLS 按科目 visibility 過濾（同檔 `:104-117`） |
| 計糧列不設服務期 | 過帳 `spent_on = monthKeyLastDay(payroll_runs.month_key)`（`src/services/expenseQueries.ts:837`），已落在計糧月 |
| 避開「Accrual」用語 | 與 QuickBooks 應收應付口徑區隔，正確 |
| 不拆多筆現金列 | 拆筆會令日記帳與銀行月結單對不上，反對理由成立 |

**這題真正的價值，文件沒有寫對。** 收入側（消堂）已按消耗月配比（`src/lib/profitMetrics.ts` 的 `consumedValue`），成本側只有現金月；有大額跨月費用時月毛利率必然失真。把成本側拉近收入側口徑，才是值得做的理由。「給審計」不是理由——審計要的是現金列，而現金列現在已經有。

---

## 二、開工前必須處理（擋路）

### R1（最大工程量）成本月的查詢窗口要重寫

現時 `fetchExpenseMonthDashboard` 以**繳費日**前後 6 個月抓數：`spent_on` gte/lte、`limit(5000)`、**無分頁**，月歸屬在客戶端以 `spentOn.slice(0,7)` 判斷（`src/services/expenseQueries.ts:681-702`）。

月攤模式下「2026-11 的成本」＝**所有服務期覆蓋 11 月的列**，其 `spent_on` 最遠可達 36 個月前（補認過去）或十幾個月後（預付）。現行窗口抓不到；而窗口拉寬後，5000 筆上限更容易**靜默截斷**（現時已有此風險，只是未觸發）。

必須做：

- 明確定義「成本月 M 的候選列集合」＝ `(無服務期 AND spent_on 在窗內) OR (service_month_start ≤ 窗末 AND service_month_end ≥ 窗初)`。
- 此口徑只能有一份，放 service 層單一函式（例如 `fetchExpenseMonthCost(monthKey, view)`），KPI／科目表／圖表／匯出全部經它，禁止各畫面自行 filter。
- 加 partial index：`(service_month_start, service_month_end) where service_month_start is not null`。
- 若窗口拉寬後傳輸量成為問題，改用 RPC 在 server 端聚合——repo 已大量使用 `.rpc(`（10 個 service 檔、24 處），不違反慣例。

### R2「僅全帳角色可填服務期」必須在 trigger 落地

現有 `expense_entries_guard_update`（`supabase/migrations/20260815230459_p0_1_payroll_expenses.sql:334-433`）在 confirmed 狀態鎖住金額／日期／科目／標題／支付，但**服務期不在鎖列內**；voided 分支同樣沒有。若只加兩欄：

- 任何有 `expenses.record` 的角色（含 admin、finance）都可改**已確認列**的服務期，不觸發 reopen 限制；
- 方案 A 聲稱的「僅全帳角色可填」在 DB 層不成立。

作法：新開一支 migration `create or replace function`，加一條「服務期有變更 → 須 `has_capability('expenses.read')`」。該條件剛好等於「非行政」（admin 只有 `record`，manager／alien／finance 都有 `read`），與方案 A 完全對齊。同時擋 `origin = 'payroll_settle'` 的列設服務期（check constraint 比 UI 可靠）。

### R3 改服務期目前不留任何痕跡

全庫沒有 expense audit 表；改一筆已確認列只會動 `updated_at`。`mgmt_audit_log` 存在，且 `logMgmtAuditAction` 已被其他 lib 模組使用（`src/lib/academicYearSoftGuard.ts:4`、`src/lib/graduationGuard.ts:2`），接上去成本很低。

D6 把審計列為「否（不擋路）」——**建議改為擋路**：月攤數字會被管理層引用，事後必須答得出「為何 9 月成本變了」。

### R4 金額可為負，平攤算法未定義

`amount_hkd` 的 check 是 `<> 0`（`supabase/migrations/20260805101837_hk_expense_cost_ledger.sql:57-92`），即**負數合法**（沖正、退款）。D2 的「floor 至仙、餘數歸最後月」對負數會產生 floor 更負、餘數為負的錯誤結果。純函式必須先明確定義負數行為（建議：取絕對值攤分再套符號，或明確拒絕），否則必定變成 bug。

### R5 服務期起月應設下界 2026-07

母題已定「2026-06 及之前不做分析」（[`hk-expense-cost-stats.md`](./hk-expense-cost-stats.md)）。若允許補認到分析窗之前，`/HkExpenses` 會出現分母對不上的份額——該筆有一部分落在永不顯示的月份。建議起月下限＝`2026-07`，並寫入 DB check，與母題政策一致。

---

## 三、方案與實況不符（要改文件）

### R6「現金列帳＝可對銀行」對人工列不成立

方案 B 把現金列帳的用途寫成「審計、對銀行、繳費事實」。但計糧列的 `spent_on` 是**計糧月月尾**，不是銀行付款日（`src/services/expenseQueries.ts:837`；`payroll_runs` 只有 `month_key` 與 `settled_at`，`supabase/migrations/20260804190000_payroll_engine_schema.sql:46-63`）。若 7 月糧在 8 月初過數，日記帳 7 月會出現一筆銀行 7 月結單沒有的支出。

文件應改為「非人工列可對銀行；人工列以計糧月為準」，或另開小題記錄實際付款日（母題範圍）。

### R7 目前系統完全沒有匯出功能

`src/components/hkExpenses/`、`src/components/expenseJournal/`、`src/pages/HkExpenses.tsx` 與 `expenseQueries.ts` 內**沒有任何 CSV／下載程式碼**。D10 說「一期用成本分析現金模式＋日記帳篩選即可」——那等於給審計的是**畫面**，不是檔案。若審計確實要檔案，一期就得做最小 CSV（純前端、工作量小，repo 其他模組已有寫法），否則這題對審計側的產出是零。

---

## 四、先回答「值不值得做」

方案假設跨月費用足夠多、足夠大，值得引入雙口徑。此前提未經驗證。開工前建議先用一條 SQL 量化：過去 12 個月，標題含租金預繳／年費／保險／課程包的列有幾筆、金額佔總成本多少。

| 量化結果 | 建議 |
| --- | --- |
| 每年少於 3 筆，或佔比低於 5% | **不建議做本方案**；改做 rolling 12 個月現金支出（純查詢層、零 schema、零 RLS、零口徑風險），已足夠消除單月大額的誤導 |
| 跨月費用佔比可觀，且管理層要用月毛利率 | 做本方案；rolling 12M 答不出「9 月到底賺不賺錢」，只有攤分能答 |

---

## 五、建議的一期範圍（較現行波次更省、風險更低）

| 決策 | 建議 |
| --- | --- |
| D9 趨勢圖跟隨切換 | **延後至二期**。趨勢圖是「6 個月 × 攤分」，正是 R1 窗口改動風險最高處，而資訊價值最低（KPI 卡與科目表已足夠）。一期趨勢圖保持現金，並在圖上標明 |
| D10 匯出 | **提前至一期**，只做最小 CSV（日記帳現金口徑＋成本分析現金模式），否則對審計零交付 |
| D8 歷史補填 | 保留一期；補認到已過月份時，UI 應顯示「這會改動 N 個已過月份的成本」 |
| D1 預設月攤 | 同意 A；但兩處標籤字面必須不同——營運總覽用「總開支（現金）」、成本分析用「本月成本（月攤）」，並在月攤模式加常駐口徑說明列 |
| D6 改服務期 | 由「否」改為擋路（見 R3） |
| D2、D4、D5、D11、D12、D13 | 建議均同意，無補充 |

---

## 六、若照做，migration 應包含

- 兩欄 `service_month_start`／`service_month_end`，`text` ＋ `~ '^\d{4}-\d{2}$'`（與 `payroll_runs.month_key` 同慣例）。
- check：兩欄同時為 null 或同時有值；迄 ≥ 起；跨度 ≤ 36（以 `年 * 12 + 月` 相減計算）；起月 ≥ `2026-07`；`origin = 'payroll_settle'` 時必須為 null。
- partial index 於 `(service_month_start, service_month_end)`。
- `create or replace` guard trigger：服務期變更須 `expenses.read`；voided 列亦鎖。
- **次序**：先做 R1 的查詢窗口改動與純函式，欄位最後才加——因為窗口改動本身就能以「無服務期＝現況」上線，風險可在有資料前先驗證。

---

## 七、待拍板清單（本審閱新增，非原 D 表）

1. 是否先做第四節的量化，再決定做不做本方案？
2. R1 的查詢口徑是否收斂為 service 層單一函式（或改 RPC）？
3. R3（改服務期要留審計）是否由「否」改為擋路？
4. R4 負數金額的攤分行為：取絕對值攤分再套符號，或拒絕？
5. R5 起月下界 `2026-07` 是否成立？
6. R6／R7 兩處文件修訂是否照改？

---

## 主方案採納紀錄（2026-09-11）

已併入 [`expense-cash-vs-monthly-cost.md`](./expense-cash-vs-monthly-cost.md)。  
**唯一不同意**：R5 硬性 `service_month_start ≥ 2026-07`（改為允許窗前服務月、分析頁不展示、分母仍用完整服務期，避免逼使用者縮短服務期而高估窗內成本）。其餘 R1–R4、R6–R7、量化閘、D9 延後／D10 提前、D6 改擋路均採納。

## 相關

- 分題（主方案）：[`expense-cash-vs-monthly-cost.md`](./expense-cash-vs-monthly-cost.md)
- 成本帳母題：[`hk-expense-cost-stats.md`](./hk-expense-cost-stats.md)
- 政策／實作參考：`src/lib/expenseJournalPolicy.ts`、`src/services/expenseQueries.ts`
- 角色／權限：[`p0-1-authz-catalog.md`](./p0-1-authz-catalog.md)
