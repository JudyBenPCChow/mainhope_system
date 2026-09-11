# 日記帳／成本帳：現金審計 vs 內部月攤

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open`（主方案已按顧問審閱修訂；量化閘＋細節拍板前不開工實作） |
| 優先 | 中 |
| 範圍 | 同一套 `expense_entries`：日記帳現金列帳；成本分析可選月攤；前台大額靠科目 visibility |
| 不含 | 複式／預付資產／每月攤提傳票、學費現金↔消堂對帳、改前台科目／金額門檻、純利頁、AI 猜服務期、一期不做趨勢圖跟月攤切換 |
| 索引 | 合入 `main` 後再搬 [`BACKLOG.md`](../BACKLOG.md) |
| 盤點日期 | 2026-09-11 |
| 上次更新 | 2026-09-11（併入第一份顧問審閱；新增「UI／元件設計」節；併入第二份獨立顧問意見 N1–N5，D17 決議採 (b) 升級儀表板月攤，見「對第二份獨立顧問意見」） |
| 相關路由 | `/ExpenseJournal`、`/ExpenseJournalRecords`、`/HkExpenses` |
| 顧問審閱 | [`expense-cash-vs-monthly-cost-review.md`](./expense-cash-vs-monthly-cost-review.md) |

## 對顧問意見（本輪採納）

**總評：同意「方向正確、不可照舊波次開工、一期工程量在成本月查詢窗口」；下列已併入方案。**

| 審閱項 | 採納？ | 說明 |
| --- | --- | --- |
| 真正價值＝成本側對齊消堂月配比，而非「給審計」 | **同意** | 目標句已改。現金列日記帳已有；本方案主價值是月毛利／月成本不失真 |
| R1 成本月候選集＋單一 service 函式 | **同意** | 已定為一期核心；見「已定方案 G」 |
| R2 服務期變更須 `expenses.read`（trigger） | **同意** | 併 migration 清單 |
| R3 改服務期寫 mgmt audit；D6 改擋路 | **同意** | |
| R4 負數金額須定義 | **同意** | 採「絕對值攤分再套原符號」 |
| R5 起月硬下限 `2026-07` 寫入 DB check | **不同意（改採較優作法）** | 見下 |
| R6 現金≠銀行（計糧列） | **同意** | 已改正用途文案 |
| R7 無匯出；CSV 提前一期 | **同意** | |
| 先量化再決定做不做 | **同意** | 見「開工閘」量化閘 |
| D9 趨勢圖延後；D10 CSV 提前；補填警告；口徑標籤 | **同意** | |

### 不同意：R5 硬性 `service_month_start ≥ 2026-07`

**顧問擔心**：服務期伸進分析窗之前，可見月份份額加總 ≠ 整筆現金，易誤解。

**不同意硬 DB 下限的原因**：若使用者服務實際是 2026-05–10、金額整筆 $6,000，卻被逼把起月改成 `2026-07`，系統會用 **4 個月**做分母 → 7–10 月各 $1,500，**高估**分析窗內成本。這比「可見月加總少於現金」更糟。

**改採**：

- DB **允許**起月早於 `2026-07`（仍受跨度 ≤36、迄≥起約束）。
- `/HkExpenses` 分析窗仍由 2026-07 起；月攤只把 **落在所選成本月** 的份額計入；分母永遠是**完整服務月數**（5–10 月共 6 個月 → 每月 $1,000；7 月顯示 $1,000，5–6 月份額存在但不在分析頁出現）。
- UI：服務期含分析窗前月份時，常駐提示「有 N 個月早於成本分析窗（2026-07），不會出現在成本分析；各月仍按完整服務期平攤」。
- 與母題「2026-06 及之前不做分析」一致：**不展示**那些月，而非扭曲分母。

---

## 對第二份獨立顧問意見（本輪採納）

| 審閱項 | 採納？ | 說明 |
| --- | --- | --- |
| N1 儀表板淨利仍現金，目標句過度承諾 | **採納 (b)，升級 D13** | 已核實：`mgmtDashboardQueries.ts:1047-1048` 取 `periodExpense.ok.totalConfirmed`（現金），`profitMetrics.ts:78` `netProfit = consumed − expenses`。**D17 決議採 (b)**：儀表板 `totalExpenses` 改月攤，`mgmtDashboardQueries` 須改走 `fetchExpenseMonthCost(monthKey, "amortized")`，令管理層盯的淨利也月攤。D20 因同口徑而消失。 |
| N2 服務期知識／權限錯位 | **同意，新增開工閘 5（D18，擋路）** | 行政最清楚收據涵蓋月份卻無權填；有權者事後補。料源流程不存在則月攤退化回現金。 |
| N3 41 月查詢窗 | **部分同意** | 放大效應屬實，但一期趨勢已固定現金（D9），仍 6 月窗；41 月窗為**二期**趨勢跟切換時才出現。一期**單月月攤**候選集確需拉寬至 ~36 月（R1 已涵蓋）。二期趨勢應直接 RPC server 端聚合，記入 D9／實作波次。 |
| N4 confirm／void 改月攤卻不留痕 | **同意，新增 D19（擋路）** | R3 審計與 D8 警告只掛服務期欄位，漏 pending→confirmed 與 void。觸發條件應改為「任何令月攤數字變動的寫入」。 |
| N5 兩個總開支並存信任風險 | **同意，新增 D20** | 若 D17 採 (b) 則消失；若採 (a) 則兩頁間加交叉說明。 |
| R5 支持主方案否決硬下限 | **同意** | 會計正確，與主方案一致。 |
| 量化閘補點 pending＋疑似跨月未填 | **同意，併入開工閘 1** | 否則量到接近零誤導成「不用做」。 |
| 直線攤分可接受，「不含」明寫非直線 | **同意，併入 F** | 低成本澄清，避免日後被當缺陷。 |

詳見 [`expense-cash-vs-monthly-cost-second-opinion.md`](./expense-cash-vs-monthly-cost-second-opinion.md)。

## 開工閘（agent 必讀）

1. **量化閘（顧問第四節＋第二意見補充）**：開工 schema／UI 前，先查 production（或用戶明示跳過）：過去約 12 個月，疑似跨月費用（租金預繳／年費／保險／廣告位等）筆數與佔 confirmed 成本比例。**同時點 pending 列與「標題／金額疑似跨月但未填服務期」的列**（現況根本無法記錄服務期，只量 confirmed 會量到接近零而誤導）。  
   - 每年 &lt; 3 筆或佔比 &lt; 5% → **停、建議改 rolling 12 個月現金支出**（零 schema），本方案降級或取消。  
   - 佔比可觀且管理層要月毛利 → 繼續本方案。
2. **細節討論表**標「擋路」且「決議」空白者，未拍板前不要改 production schema／上線 UI。
3. 按金 void、非老師人工等仍跟 [`hk-expense-cost-stats.md`](./hk-expense-cost-stats.md)。
4. 量化通過且擋路項拍板後：可先做 R1 查詢重構（無服務期時行為＝現況）＋純函式測試，**再**加欄位。
5. **服務期料源閘（N2，擋路）**：開工前必須答「服務期由誰、何時填」（D18）。未答則上線後料填不齊，月攤退化回現金。

## 目標（一句）

讓成本分析的「月」能與收入消堂月一樣做配比：大額跨月費用可按服務期平攤；日記帳維持一筆現金事實。前台大額續靠科目 visibility。**D17 採 (b)**：管理層儀表板淨利亦改月攤（`mgmtDashboardQueries` 改走 `fetchExpenseMonthCost`），月毛利／月淨利不失真。

---

## 已定方案

### A. 前台大額隔離

- **維持科目 `visibility` 分層**，不加金額門檻。
- 行政只見／只入前台科目；服務期／月攤 UI **不出現在行政表單**。
- DB：服務期變更須 `expenses.read`（非行政）；見 G／migration。

### B. 雙視角（核心）

| 視角 | 用途 | 口徑 | 主畫面 |
| --- | --- | --- | --- |
| **現金列帳** | 繳費／入帳事實；非人工列可對銀行；人工列見下 | 整筆歸 `spent_on` 所在曆月；金額永不拆 | 日記帳（永遠）；成本分析可切回；**一期 CSV 現金口徑** |
| **月攤成本** | 內部每月成本／月毛利配比 | 有服務期則直線平攤到服務各月；無服務期＝同現金月 | 成本分析 `/HkExpenses`（預設） |

**現金列帳與銀行（R6）**：

- **非** `payroll_settle`：用途含對銀行、繳費事實。
- **`payroll_settle`**：`spent_on`＝計糧月月尾，**不是**銀行過數日；標示為「計糧月」，不承諾對銀行月結單。

**禁止**：入帳時拆成多個月多筆現金列。

**用語**：「現金列帳｜月攤成本」；不用「權責／Accrual」。  
畫面標籤須可區分：營運總覽「總開支（月攤）」（D17 採 b，淨利以月攤為準）；成本分析月攤時「本月成本（月攤）」＋常駐口徑說明列。

### C. 資料模型

- 真源：一筆 `expense_entries`。
- 可選 `service_month_start`／`service_month_end`（`YYYY-MM` text，與 `payroll_runs.month_key` 同慣例）。
- 兩欄同時 null 或同時有值；迄 ≥ 起；跨度 ≤ 36 月；**允許起月 &lt; 2026-07**（見上對 R5）。
- `origin = 'payroll_settle'` → 服務期必須 null（check）。
- 不建預付資產；不每月自動寫攤提日記帳列。
- **D7**：一期查詢時純函式展開，不物化攤分表。

### D. 平攤算法

- 月數＝起迄含兩端之曆月數（完整服務期，含分析窗之前的月）。
- **正數**：各月 floor 至仙，餘數歸最後一個服務月。
- **負數（R4）**：對絕對值做同上攤分，再套回原符號（沖正／退款與正數對稱）。
- 只計 `confirmed` 且未 void。
- 作廢／改服務期 → 即時重算；改服務期須寫 **mgmt audit**（R3）。

### E. 各畫面行為

| 畫面 | 行為 |
| --- | --- |
| 日記帳入帳（有 `expenses.read`） | 可選「此筆涵蓋多個月」→ 起迄月 → 即時預覽各月份額。行政無此塊。 |
| 日記帳紀錄 | 主列整筆＋`spent_on`；服務期標籤；詳情攤分表。計糧列可標「計糧月」。 |
| 成本分析 | 頂欄切換；**預設月攤**。KPI／科目／老師下鑽／（二期）趨勢圖經**同一** `fetchExpenseMonthCost(monthKey, view)`。一期趨勢圖**固定現金**並標明（D9 延後）。月攤明細可追溯原入帳。補填／改已過月服務期：警告「會改動 N 個已過月份的成本」。 |
| 營運總覽總開支 | **D17 採 (b)：改月攤**。`mgmtDashboardQueries` 的 `totalExpenses` 改走 `fetchExpenseMonthCost(monthKey, "amortized")`，淨利 `netProfit = consumed − amortizedExpenses`。KPI 標「總開支（月攤）」；現金總開支若仍需展示，另列次要指標，但**淨利以月攤為準**。 |
| 匯出（一期） | 最小 CSV：日記帳現金口徑，及／或成本分析現金模式（R7）。 |

### F. 不含

- 複式、預付資產、每月攤提傳票、學費現金對帳、前台科目／金額門檻、純利、OCR、報銷、AI
- **非直線攤分**（集中在前期的廣告、階梯式合約等價值不均費用）：一期只做直線；非直線令純函式與 UI 預覽複雜度跳升，日後另題。本題範圍以均勻消耗（租金、保險、訂閱、年費）為主。
- 一期：趨勢圖跟月攤、進行中服務期餘額條（D11 二期）

### G. 成本月查詢（R1，一期核心）

**成本月 M、視角＝月攤**的候選列：

```text
(confirmed ∧ ¬voided) ∧ (
  (服務期為空 ∧ spent_on 落在查詢窗) ∨
  (服務期非空 ∧ service_month_start ≤ M ∧ service_month_end ≥ M)
)
```

現金視角：維持以 `spent_on` 歸月（可保留合理 spent_on 窗，但須防靜默 `limit` 截斷；必要時 RPC 聚合）。

- 口徑只准一份，放 service（例：`fetchExpenseMonthCost`）；禁止各畫面自 filter。
- partial index：`(service_month_start, service_month_end) WHERE service_month_start IS NOT NULL`。
- 傳輸／截斷成問題 → RPC server 端聚合（repo 已有 rpc 慣例）。

### H. Migration 應包含（拍板後）

- 兩欄＋check（同時有無、迄≥起、跨度≤36、payroll 必 null）。**不起** `start ≥ 2026-07` check。
- partial index。
- `create or replace` guard：服務期變更須 `expenses.read`；voided 亦鎖。
- 改服務期 → `logMgmtAuditAction`（應用層；trigger 擋權限）。**審計與警告觸發範圍依 D19 擴至「任何令月攤變動的寫入」**（改服務期、pending→confirmed、void），不止服務期欄位（N4）。
- **次序**：先 R1 查詢重構＋純函式（無欄＝現況）驗證 → 再加欄。

---

## 細節討論（待決／已建議）

| ID | 題目 | 建議 | 擋路？ | 決議 |
| --- | --- | --- | --- | --- |
| Q0 | 量化後是否仍做本方案？ | 見開工閘；&lt;5% 改 rolling 12M | **是** | |
| D1 | 成本分析預設 | **A 月攤**；常駐口徑說明 | 是 | |
| D2 | 仙位 | **A floor＋餘數末日** | 是 | |
| D3 | 服務期相對繳費月 | 預付未來、補認過去**皆可** | 是 | |
| D4 | 跨度上限 | **36 月** | 是 | |
| D5 | pending 入月攤？ | **否** | 是 | |
| D6 | 確認後改服務期 | **A** 有 read 者可改＋**mgmt audit 必做** | **是**（改擋路） | |
| D7 | 展開存放 | **一期 A 查詢展開** | 是 | |
| D8 | 歷史補填 | **允許**＋改已過月警告 | 否 | |
| D9 | 趨勢圖跟切換 | **二期**；一期圖現金並標明。二期趨勢若跟月攤，查詢窗放大至 ~41 月（6 點 × 補認過去 36 月），**須改 RPC server 端聚合**，否則 `limit(5000)` 靜默截斷幾乎必發（N3） | 否 | |
| D10 | CSV | **一期**最小現金 CSV | **是** | |
| D11 | 進行中服務期餘額 | 二期 | 否 | |
| D12 | finance 側欄 | 本檔不修；掛 nav 題；finance 可填服務期 | 否 | |
| D13 | 總覽將來月攤 | **D17 決議採 (b)：儀表板改月攤**。`mgmtDashboardQueries` 改走 `fetchExpenseMonthCost`；本題範圍擴大 | **是**（改） | 採 (b) |
| D14 | 負數攤分 | **絕對值攤再套符號** | **是** | |
| D15 | 分析窗前服務月 | **允許入庫**；分析頁不展示；分母用完整期（否決 R5 硬下限） | **是** | |
| D16 | R1 單一函式或 RPC | 先單一 service 函式；不足再 RPC | **是** | |
| D17 | 儀表板淨利是否改月攤（N1） | (a) 收窄目標句為「`/HkExpenses` 可月攤」；或 (b) 升級 D13 把儀表板 `totalExpenses` 改月攤（擴大本題範圍）。未答則方案價值錨點不明 | **是** | **採 (b)** |
| D18 | 服務期由誰、何時填（N2） | 例如 (a) 放寬行政對前台科目列可填服務期；(b) 入帳留「待補服務期」旗標，manager 收件匣處理；(c) 月攤只覆蓋 manager 自入的管理層科目列 | **是** | |
| D19 | 審計與警告觸發條件（N4） | 改為「任何令月攤數字變動的寫入」：改服務期、pending→confirmed、void，皆寫 mgmt audit；改服務期與 confirm 已過月服務期列另觸發 D8 警告 | **是** | |
| D20 | 兩個總開支並存說明（N5） | 若 D17 採 (b) 則消失；若採 (a) 則儀表板與 `/HkExpenses` 間加交叉說明（現金含跨月全額；月攤只計本月份額） | 否 | **D17 採 (b)，同口徑，消失** |

### 例子

**Banner（窗內）**  
2026-09-15 繳 $6,000，服務 2026-09–2027-02 → 現金 9 月 $6,000；月攤六個月各 $1,000。

**跨分析窗下界（D15）**  
服務 2026-05–2026-10，$6,000 → 每月 $1,000。成本分析自 2026-07 起只見 7–10 月各 $1,000；5–6 月不展示；**不要**改成四個月分母。

**預付未來**  
2026-09 繳費，服務 2026-10–2027-03 → 現金在 9 月；月攤 9 月此筆 0。

---

## 現況基線

| 能力 | 現況 | 方案後 |
| --- | --- | --- |
| 行政大額 | 科目 visibility | 不變＋DB 擋行政改服務期 |
| 日記帳 | `spent_on` 整筆 | ＋服務期標籤／預覽；計糧不承諾對銀行 |
| 成本分析查詢 | `spent_on` 窗 | 月攤改重疊服務期（R1） |
| 匯出 | 無 | 一期最小 CSV |
| 營運總覽 | 現金 | 維持現金並標明 |

---

## 實作波次（Q0 通過且擋路拍板後）

1. 量化 SQL／結論寫回本檔 Q0（含 pending＋疑似跨月未填，N3 補充）。  
2. 平攤純函式＋負數測試（D2／D14）。  
3. R1：`fetchExpenseMonthCost`（無服務期＝現況行為可先上）。  
4. Migration：欄位、check、index、guard trigger；審計觸發依 D19 擴至 confirm／void。  
5. 入帳／詳情服務期＋預覽＋audit；補填警告（D8／D19）。  
6. `/HkExpenses` 雙模式＋口徑文案；趨勢圖一期現金。  
7. **儀表板改道（D17 採 b）**：`mgmtDashboardQueries` 的 `totalExpenses` 改走 `fetchExpenseMonthCost(monthKey, "amortized")`，淨利改月攤；KPI 標「總開支（月攤）」。  
8. 一期現金 CSV。  
9. 二期：D9 趨勢跟切換（須 RPC 聚合，N3）、D11 餘額條。

---

## UI／元件設計（一期，未實作）

本節只定畫面線框、用邊啲現有元件、文案與狀態；**不含碼改**。所有引用之共用元件與互動條款以 [`docs/meta/UI_DESIGN_INSTRUCTIONS.md`](../../meta/UI_DESIGN_INSTRUCTIONS.md) 為準。對象路由：`/ExpenseJournal`（入帳）、`/ExpenseJournalRecords`（紀錄）、`/HkExpenses`（成本分析）。

### 通用：角色與服務期可見性

| 角色 | `expenses.read` | 入帳服務期區塊 | 紀錄服務期標籤 | 詳情改服務期 | 成本分析頂欄切換 |
| --- | --- | --- | --- | --- | --- |
| admin（行政） | 否 | **不顯示** | 不顯示（只見前台科目列） | 不可 | 不顯示（沿用現金） |
| manager／alien／finance | 是 | 顯示 | 顯示 | 可（寫 mgmt audit） | 顯示 |

判斷來源沿用現有 `canReadFullLedger`（`can(caps, "expenses.read")`），與 `ExpenseJournalForm`／`ExpenseJournalList` 既有分流一致；**不新增角色判斷**。行政表單維持現況（科目 visibility 過濾），服務期 UI 整塊不出現，DB guard trigger 為最後防線（見方案 G／H）。

<!-- UI-DESIGN-CONTINUE -->

### 1. 入帳服務期區塊（`ExpenseJournalForm`）

在現有 `ExpenseJournalForm`（`src/components/expenseJournal/ExpenseJournalForm.tsx`）「備註」與「附件」之間插入一塊，僅 `canReadFullLedger` 為真時渲染。行政沿用原表單，完全不見此塊。

線框：

```
□ 此筆涵蓋多個月（服務期）        ← Checkbox，預設不勾
  ┌─ 勾選後展開 ─────────────────────────────┐
  │ 服務起月 [YYYY-MM ▾]   服務迄月 [YYYY-MM ▾] │  ← 共用 Input type="month"
  │ 跨度：N 個月                              │
  │ 預覽各月份額：                            │
  │   2026-09  HK$ 1,000.00                   │  ← 純函式即時計算
  │   2026-10  HK$ 1,000.00                   │
  │   ...                                     │
  │   2027-02  HK$ 1,000.30  ← 餘數歸末日      │
  │ ⚠ 有 2 個月早於成本分析窗（2026-07），     │  ← 僅起月 < 2026-07 時
  │   不會出現在成本分析；各月仍按完整服務期平攤 │
  └───────────────────────────────────────────┘
```

元件與規則：

- 展開開關用原生 `<input type="checkbox">`（表單內控制項，非狀態標籤）；勾選狀態以 React state 存，不寫庫。
- 起迄月用共用 `Input type="month"`（轉接 `MonthInput` Select，§8）；**禁止**原生 `<input type="month">`。
- 預覽區為純展示，呼叫平攤純函式（D2／D14：絕對值攤分再套符號、floor 至仙、餘數歸最後服務月）；**不**在入帳時物化攤分表（D7）。
- 送出時：勾選且兩月皆有值 → 寫 `service_month_start`／`service_month_end`；未勾選或任一空 → 兩欄皆 null（與 check constraint 對齊）。
- `origin = 'payroll_settle'` 的列不會經此表單入帳（計糧過帳路徑），故此塊不須特別擋 payroll；DB check 仍兜底。
- 跨度 > 36 月或迄 < 起：在 `onCreate` 前端驗證階段以內嵌紅字（`setErr`）擋下，不寫庫、不上報（§2.4）。
- 「分析窗前服務月」提示用 `text-warning` 淺底條（§9：禁 `bg-warning/10 text-warning-foreground`）；文案見線框。
- 入帳按鈕沿用現有 `Button`，加 `loading` prop（§2.1）：`<Button loading={saving} loadingText="儲存中…">入帳</Button>`。

文案：區塊標題「服務期（選填）」；Checkbox 標籤「此筆涵蓋多個月」；預覽標題「各月份額預覽」；窗前提示「有 N 個月早於成本分析窗（2026-07），不會出現在成本分析；各月仍按完整服務期平攤。」

### 2. 紀錄主列標籤與詳情攤分表

#### 2a. `ExpenseJournalList` 主列

在現有 `ExpenseJournalList`（`src/components/expenseJournal/ExpenseJournalList.tsx`）表格「標題」欄下方副標行追加服務期標籤；其餘欄位（付款日、金額、分類、負責人、狀態、操作）不動。金額欄**永遠**顯示整筆現金金額（不拆）。

線框（標題欄副標）：

```
買垃圾袋
  [附件迴紋針]                    ← 現有
  [服務 2026-09–2027-02]          ← 新增 Tag，僅有服務期時
  [計糧月]                        ← 新增 Tag，僅 origin=payroll_settle
  suggestionHint（現有）
```

元件與規則：

- 服務期標籤用共用 `Tag`（`src/components/ui/tag.tsx`），tone=`info`；文案 `服務 {start}–{end}`。
- 計糧月標籤用 `Tag` tone=`default`；文案「計糧月」。對應 R6：`spent_on` 為計糧月月尾，不承諾對銀行月結單。
- 標籤僅 `canReadFullLedger` 可見；行政不見服務期標籤（與服務期區塊同分流）。計糧月標籤對行政亦隱藏（行政只見前台科目列）。
- 主列金額不變；**不**在主列展開攤分。

#### 2b. `HkExpenseEntryDetailDialog` 詳情攤分表

在現有詳情對話框（`src/components/hkExpenses/HkExpenseEntryDetailDialog.tsx`）「金額」欄下方、標題編輯之前，加服務期顯示／編輯與攤分表。僅 `canReadFullLedger` 可見服務期區塊與攤分表。

線框：

```
日期 2026-09-15        金額 HK$ 6,000.00
服務期 2026-09 至 2027-02（6 個月）   [編輯服務期]
  攤分表：
    2026-09  HK$ 1,000.00
    2026-10  HK$ 1,000.00
    ...
    2027-02  HK$ 1,000.30  ← 餘數
  ⚠ 有 2 個月早於成本分析窗（2026-07）...   ← 僅適用時
標題 [____]
分類 [____]
...
```

元件與規則：

- 服務期顯示為純文字；點「編輯服務期」切換為兩個 `Input type="month"`（§8）＋預覽，模式同入帳區塊。
- 攤分表為唯讀 `<table>`，沿用對話框內既有表格樣式（`text-sm`、`tabular-nums`）；呼叫同一平攤純函式。
- 改服務期（含補填歷史）見 §4 補填警告。
- 已確認列改服務期：須 `expenses.read`（DB guard trigger 擋非全帳）；成功後寫 `logMgmtAuditAction`（R3）。UI 不須另開 reopen 流程——服務期不在 `expense_entries_guard_update` 既有鎖列內，方案 H 會把服務期納入 guard 但允許 read 角色改。
- `origin = 'payroll_settle'`：服務期欄顯示「—（計糧過帳，不適用）」，不可編輯。
- 對話框沿用現有 `Dialog`／`DialogFooter`；儲存按鈕用 `Button loading`（§2.1）。

### 3. `HkExpenses` 頂欄切換與口徑文案

在現有 `HkExpensesView`（`src/components/hkExpenses/HkExpensesView.tsx`）頁頭「月份」選擇器旁加視角切換；`HkExpenseDashboardPanel`（`src/components/hkExpenses/HkExpenseDashboardPanel.tsx`）依視角調 KPI 標籤與口徑說明。

線框（頁頭）：

```
🥧 成本分析          [現金列帳｜月攤成本]  月份 [2026-09 ▾]  [匯出 CSV]
                      ↑預設月攤
本月成本（月攤）：依服務期平攤；無服務期同現金月。   ← 常駐口徑說明列（月攤時）
```

視角與文案對應（D1）：

| 視角 | KPI 主標 | 常駐說明 | 趨勢圖（一期） |
| --- | --- | --- | --- |
| 月攤成本（預設） | 「本月成本（月攤）」 | 「依服務期平攤；無服務期同現金月。含分析窗前服務月之分母但不展示那些月。」 | **固定現金**並標明（D9 延後） |
| 現金列帳 | 「本月已確認總成本（現金）」 | 「按 spent_on 歸月，整筆不拆。」 | 同上 |

元件與規則：

- 視角切換用共用 `Select`（§12；兩個選項即可，不必 MultiSelect）或兩段式 toggle；選擇以 `useState` 存，**不**入 URL query（一期不做深連結）。
- 切換後呼叫同一 `fetchExpenseMonthCost(monthKey, view)`（R1 單一函式）；KPI／科目表／老師下鑽／趨勢圖全部經它，**禁止各畫面自 filter**。
- KPI 卡沿用 `MgmtStatCard`（`src/components/mgmtDashboard/MgmtStatCard.tsx`）；只改 `label` 文案，不新增卡片。
- 科目表（`byAccount`）副標「按本月 spent_on／計糧月歸屬」於月攤時改為「按服務期平攤到本月」。
- 趨勢圖（`monthlyTrend`）一期**固定現金**，標題加註「（現金口徑，一期）」，副標維持「近 6 月已確認成本」；月攤趨勢延後二期（D9）。
- 營運總覽總開支（`MgmtDashboardView`）**D17 採 (b)：改月攤**，標「總開支（月攤）」，淨利以月攤為準；現金總開支若仍展示為次要指標。
- 常駐口徑說明列用 `text-muted-foreground` 淺底條（非警示），置於頁頭下方、KPI 卡之上。

### 4. 補填／改已過月服務期警告（D8）

適用：詳情對話框編輯服務期時，若新服務期涵蓋**已過月份**（相對當前月），送出前須警告。

線框（對話框內，儲存按鈕上方）：

```
⚠ 此變更會改動 N 個已過月份的成本（2026-07、2026-08...）。
  月攤成本分析將即時重算；日記帳現金列不受影響。
```

元件與規則：

- 警告條用 `text-warning` 淺底（§9），`role="status"`；非錯誤，不上報 `mgmt_system_errors`。
- N 與月份清單由純函式計算（新服務期 ∩ 已過月集合）；已過月以「當前月」為基準，不取分析窗下界（D15 已允許窗前服務月入庫，故只警告「已過」而非「窗前」）。
- 警告為提示，**不擋送出**；使用者確認後照常寫庫＋`logMgmtAuditAction`（R3）。
- 入帳區塊（§1）新增時不適用（新筆無「改動已過月」語意）；只在新服務期涵蓋已過月時顯示窗前提示（§1 已列）。

### 5. 一期 CSV 匯出掣（D10）

在 `HkExpensesView` 頁頭「月份」選擇器旁加「匯出 CSV」按鈕（見 §3 線框）。一期只做**現金口徑**最小 CSV；月攤 CSV 延後。

元件與規則：

- 按鈕用共用 `Button` variant=`outline` size=`sm`，`type="button"`；匯出中 `loading`（§2.1）。
- 匯出範圍：當前所選月份之**已確認且未作廢**列，現金口徑（按 `spent_on` 歸月）。視角切換**不影響** CSV 內容（一期固定現金）；按鈕 tooltip 註明「匯出現金口徑」。
- 檔案產生沿用 repo 既有寫法（`StudentsListPage` 之 `Blob([csv], { type: "text/csv;charset=utf-8" })` + `URL.createObjectURL` + `a.download`）；檔名 `expense-journal-{monthKey}-cash.csv`。
- 欄位（最小集）：`spent_on,title,amount_hkd,pay_method,ledger_account,owner,teacher,origin,service_month_start,service_month_end,notes`。服務期兩欄可空。
- 純前端組 CSV；不新增後端端點。失敗走 `reportUserFacingError`（§1.2）。
- 行政（無 `expenses.read`）不見此按鈕（與頂欄切換同分流）。

### 6. 一期狀態摘要

| 畫面 | 行政（無 read） | 全帳角色（有 read） |
| --- | --- | --- |
| 入帳 | 現況表單，無服務期區塊 | ＋服務期區塊＋預覽 |
| 紀錄主列 | 現況，無服務期／計糧月標籤 | ＋服務期 Tag＋計糧月 Tag |
| 詳情 | 現況 | ＋服務期顯示／編輯＋攤分表＋補填警告 |
| 成本分析 | 不見頂欄切換、不見 CSV 掣（沿用現金） | 預設月攤＋切換＋口徑文案＋CSV 掣 |
| 趨勢圖 | 固定現金 | 固定現金（一期） |
| 營運總覽 | **改月攤**「總開支（月攤）」，淨利月攤（D17 b） | 同左 |

## 相關

- 顧問審閱：[`expense-cash-vs-monthly-cost-review.md`](./expense-cash-vs-monthly-cost-review.md)
- 第二份獨立顧問意見：[`expense-cash-vs-monthly-cost-second-opinion.md`](./expense-cash-vs-monthly-cost-second-opinion.md)
- 成本帳母題：[`hk-expense-cost-stats.md`](./hk-expense-cost-stats.md)
- 智能分析 IA：[`intelligence-analytics-ia-review.md`](./intelligence-analytics-ia-review.md)
- 側欄／finance：[`nav-capability-entry.md`](./nav-capability-entry.md)
- 角色：[`mgmt-manager-role.md`](./mgmt-manager-role.md)、[`p0-1-authz-feature-roles.md`](./p0-1-authz-feature-roles.md)
- KPI：[`mgmt-dashboard-kpi-spec.md`](./mgmt-dashboard-kpi-spec.md)
- 實作：`src/lib/expenseJournalPolicy.ts`、`src/services/expenseQueries.ts`
