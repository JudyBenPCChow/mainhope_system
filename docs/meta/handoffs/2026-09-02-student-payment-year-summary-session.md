# Session HANDOFF：學生詳情繳費紀錄改本學年＋三線分列

| 欄位 | 值 |
| --- | --- |
| 日期 | 2026-09-02 |
| 主題／backlog | **無分題。** 不要把本題塞進 [`student-detail-record-page.md`](../../product/topics/student-detail-record-page.md)（該題「不含」收款業務邏輯，且仍 `in_progress`）。Feature 分支不要改 `BACKLOG.md` 索引。 |
| 分支／工作樹 | 尚未開 branch、**未改 code**。從最新 `origin/main` 開 feature 分支再做。 |

## 目標

學生詳情「繳費紀錄」分頁：標題數字改為**本學年**、專科／私人／功輔**分開展示**；單據預設只列本學年（新至舊），下方「顯示全部」才展開過往。不改入帳、schema、全站繳費紀錄頁。

## 已完成

- 產品與 UI 已在會話拍板（見下方規格）。現況研究已完成。
- **未改任何程式、未開 PR、未驗證。**

## 未完成／卡住

- 整題未實作。無環境卡住。

## 現況（改之前）

繳費分頁標題：`共 N 筆繳費紀錄 · 已收款 {x} 總繳堂數`。

| 數字 | 函式 | 範圍 |
| --- | --- | --- |
| N 筆 | `fetchPaymentsForStudent`（`src/services/studentQueries.ts`） | 該生全部單據（所有狀態、所有學年）。select **只有單頭**，無明細／學年／班型。 |
| 總繳堂數 x | `fetchTotalPaidLessonsForStudent`（`src/services/paymentQueries.ts`） | 全部「已收款」明細 `lesson_count` 加總；已跳過功輔月費行；**無學年、無專科／私人拆開**。數字用 `text-warning`。 |

報讀分頁「已繳 N 堂」是**該班 `class_id`**，與這個全庫合計不是同一數字。報讀已有「本學年報讀／過往學年報讀」分區，見 `src/lib/enrollmentYearDisplay.ts`。

`fetchTotalPaidLessonsForStudent` **另被收款登記** `PaymentsPageView` 側欄使用。本題**不要改它的 `number` 回傳**；學生詳情另開分組查詢或從加寬後的單據列衍生摘要。

## 已拍板：資料規則

文案用**本學年**（常規 9–6，今日＝**2627**）。禁止寫「本學期」（那會變成只計 9–1）。

單據學年歸屬跟既有防呆：`academicYearLabelsForPaymentGuard`（**跟明細班別，不跟收款日**）。私人班無學年欄時不要用收款日硬套班別學年；本年清單／私人數字改用**收款日是否落在目前常規學年起迄**。

| 產品線 | 本年怎麼認 | 摘要單位 | 可否併入專科「共收 N 堂」 |
| --- | --- | --- | --- |
| 專科班 | 明細班別 `academic_years.label`＝目前學年（2627）。9 月起 26SM 不算本年。 | 堂（已收款、`lesson_count>0`） | 這就是主數字 |
| 私人課程 | 班無學年。本年清單＋本年數字：`payment_date` 落在目前學年起迄。剩餘跨年、年終不歸零。 | 堂 | **不可**。另列，並加說明 |
| 功輔 | 覆蓋月份落在 2627（約 2026-09 至 2027-06）。已有 `isHomeworkPaymentDetailSkipLessons`。 | **月份**（列出哪幾月） | **不可**。不進堂數 |

- 只計 `payments.status = 已收款`；作廢／待收款不進摘要堂數／月數，但仍可出現在單據清單（維持現況狀態 Tag）。
- 一張單跨線或跨年：**整張單不要拆成兩張卡**。任一明細屬本年（或私人收款日落在本年窗）→ 預設清單收錄。摘要則**按明細分行加**：專科堂、私人堂、功輔月分開累加。
- 26SM 單據進「過往學年」，不進 2627 預設列。

學年窗可重用 `listCurrentEnrollmentYearLabels`／`academicYearLabelFromStartDate`（9 月起只 `2627`；暑期才含下一常規）。私人「本年」日期窗用該學年 `start_date`–`end_date`，不要用 `is_current` 旗標代替日期（點名鐵則：旗標可先切年）。

## 已拍板：UI（必須跟）

對齊報讀分頁區塊，**不要做成營運總覽 KPI**。指南：`docs/meta/UI_DESIGN_INSTRUCTIONS.md` §9（色）、§15（新增繳費仍去 `/Payments`）。紀錄頁不是儀表板。

### 版面（上至下）

1. **列頭**：左「本學年繳費」；右「新增繳費」仍 `goExternal(/Payments?studentId=…)`。無權限維持現有一句說明。
2. **摘要一張卡**：`rounded-xl border border-border bg-card p-4`。內文是定義列（左標籤、右 `tabular-nums`），**不是**三欄同等大卡。
   - 有該產品線本年已收款才顯示該列；多數學生只有專科，畫面應接近現況那麼短。
   - 專科：`專科班`　`本學年共收 N 堂`（數字 `text-foreground`，**不要** `text-warning`）。
   - 私人：`私人課程`　`本學年已繳 N 堂`；下一行 `text-xs text-muted-foreground`：`關係內累計，不隨學年歸零`。不要警告底色。
   - 功輔：`功課輔導班`　`本學年已繳 N 個月（9 月）`（月份列出；多月用頓號）。不要寫「堂」。
3. **筆數**：`N 筆本學年單據`（只計預設清單）。全庫總筆數可在展開過往後再出現，不要在預設標題把舊年筆數加進去。
4. **預設清單**：本學年單據，**新至舊**。卡片結構維持現有（金額、日期、支付、收據、狀態 Tag、列印、作廢）。加產品線識別：共用 `Tag tone="default" size="sm"` 或副標文字（專科班／私人課程／功輔）。一張單多線可多個 default Tag。狀態 Tag 仍走 `statusToTagTone`。
5. **過往學年**：僅當有非本年單據。樣式對齊報讀「過往學年報讀」：`rounded-xl border border-dashed border-border bg-muted/20 p-4`。預設摺起，按鈕「顯示全部」才展開。展開後按學年分組（新學年在上），組內新至舊。私人無年、但收款日不在本年窗的單據，歸「過往」或「未標學年」一組，不要丟。
6. **空狀態**：完全無單→維持「尚無繳費紀錄。」；有舊無新→本年清單空一句「目前沒有本學年繳費紀錄。」＋仍可顯示過往摺疊。
7. **手機**：單欄；禁止 `grid-cols-3`。詳情仍是紀錄頁／bottom sheet，不要 sticky 摘要。

### 禁止的 UI

- 三張同等 KPI 卡；用 success／info／warning 當產品線色（那些 token 是狀態）。
- 已繳數字用 `text-warning`。
- 淺底＋`text-*-foreground`（§9）。
- 在此分頁內嵌出單（§15）。
- 以「專科／私人／功輔」chips **篩掉**清單當主互動（流水按日；分線只在摘要）。可選 chips 不要做第一波。
- 另開路由／另開繳費頁。

市場對照（拍板時用過，實作不必再查）：Jackrabbit／Stripe portal／大學帳單都把「權益數字」與「收據流水」分開；單位不同就分列，不合成一個大數。本頁前台任務是對帳，不是店級 KPI。

## 建議改哪些檔

| 檔 | 做什麼 |
| --- | --- |
| `src/services/studentQueries.ts` | 加寬 `fetchPaymentsForStudent`（或新函式）：embed `payment_details`＋`classes ( class_kind, academic_years ( label, start_date, end_date ) )`＋`coverage_start_month`。 |
| `src/lib/` 新純函式（建議） | 依上表把單據列分成本年／過往，並算出三線摘要。單測：2627 vs 26SM、私人無年、功輔覆蓋月、混單不拆卡。 |
| `src/components/students/StudentDetailView.tsx` | 繳費 tab 改版面；`ensureTabData("payments")` 改打加寬查詢，摘要由列衍生，可不再呼叫 `fetchTotalPaidLessonsForStudent`。報讀 tab 若仍為載入而呼叫該函式、畫面卻沒用到，順手拿掉多餘請求。 |
| 測試 | `src/lib/*.test.ts` 覆蓋分組。 |

對齊報讀分區實作：`StudentDetailView` 約 2073–2100 行（本學年報讀／過往虛線框）；`partitionEnrollmentsByAcademicYear`。功輔跳過堂數：`isHomeworkPaymentDetailSkipLessons`（`paymentQueries.ts`，可抽到 lib 供新分組用，避免 component 抄一份）。

## 下一步（給新會話）

1. `git fetch`；從 `origin/main` 開 feature 分支（不要在髒的 `main` 上改）。
2. 先寫 `lib` 分組純函式＋測試（學年／三線／混單），再加寬 service，最後改 `StudentDetailView` 繳費 tab。
3. `npm run lint`、相關 test、`npm run ui:check`、`npm run build`。用戶未要求瀏覽器 MCP 則不要開。收工註明未親手在瀏覽器驗繳費分頁。
4. 未叫 commit／PR 就不要做。

## 開局必讀

- `AGENTS.md`（書面語、分層、熱檔、術語：功輔≠功課班）
- 本檔（產品＋UI 以本檔為準）
- `src/components/students/StudentDetailView.tsx` 繳費 tab 與報讀「過往學年」區塊
- `src/lib/enrollmentYearDisplay.ts`
- `docs/meta/UI_DESIGN_INSTRUCTIONS.md` §9、§15

## 勿再踩

- 短 handoff 刪掉排版＝下一個 agent 會做成三張 KPI 卡。UI 以本檔「已拍板：UI」為準。
- 學年跟班別，不跟收款日（私人例外：清單／本年數字用收款日窗，不要因此給私人班填上學年）。
- 改 `fetchTotalPaidLessonsForStudent` 回傳結構會連累收款登記側欄。
- Feature 分支不要 commit `BACKLOG.md`、`dist/`、`docs/generated/`。
- 不要把本題當 `student-detail-record-page` 的延續去改 chrome／分頁序。

## 明確唔做

- 無 migration、無 RLS、無 Edge Function、無改 `insertPaymentRecord`／作廢。
- 不改 `/PaymentHistory`、堂數對帳、權益池、收款登記側欄「已繳堂數」。
- 不 regenerate 2627 時間表、不出 docx／pdf。
- 不開 Browser MCP（除非用戶明講）。
- 不另開學生繳費路由。
