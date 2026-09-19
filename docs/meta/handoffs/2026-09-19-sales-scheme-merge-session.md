# Session HANDOFF：銷售回流新舊方案衝突

| 欄位 | 值 |
| --- | --- |
| 日期 | 2026-09-19 |
| 主題／backlog | 新方案 [`docs/product/topics/student-enrollment-history-sales.md`](../../product/topics/student-enrollment-history-sales.md)（`open`，未入 git）。舊方案在另一工作樹 [`docs/product/topics/sales-followup.md`](/Users/hoiyingfan/Desktop/mainhope_sales-followup/docs/product/topics/sales-followup.md)（`in_progress`，未 commit）。兩邊都未進 `BACKLOG.md` |
| 分支／工作樹 | 本檔在 `main`（`/Users/hoiyingfan/Desktop/mainhope_system`）。舊方案在 `/Users/hoiyingfan/Desktop/mainhope_sales-followup`，分支 `feature/sales-followup`，比 `origin/main` 落後 34 個提交 |

## 目標

- 找回使用者所稱「流失率」未完成 backlog，並與 2026-09-19 的歷年科目方案對照，判斷能否合併、衝突在哪。
- 本會話只做找回、對照與判斷。沒有改程式、沒有 commit、沒有查庫覆核 migration。

## 事件經過

1. 使用者要找回「流失率」backlog，記得當時拆到另一個 worktree、尚未完成。
2. 全庫、所有分支、舊對話都沒有「流失率」這四個字，也沒有同名分題。最接近且確實未完成的，是 2026-09-09 立案的「前台銷售跟進」。當日原話是篩「已流失」學生；拍板後畫面不標「已流失」（該詞留給試堂），改為未續報／今學年退讀／今學年在讀。
3. 該題在桌面工作樹 `mainhope_sales-followup`，分題與程式都未 commit。專頁、歸類、報讀後改階段已寫完，待驗收。分題寫 migration `20260909043000_sales_followup_tables.sql` 已套用 production；本會話沒有再查庫，不可當成已核對。
4. 同日稍早，`main` 上另立未提交的「歷年科目（銷售回流）」。使用者約定：這份是**新方案**，銷售跟進工作樹是**舊方案**。
5. 對照結論（分析，尚未經使用者拍板）：可以合成兩層，不能把兩套「未續」定義一起上線。新方案負責找誰、缺哪一科；舊方案的活動、階段、接觸、主責、下次聯絡日可以留下，但產生名單的規則必須改寫。

## 已完成

- 已定位舊方案工作樹與分題，並在編輯器打開該分題。
- 已對照兩份分題與舊方案歸類函式 `classifySalesFollowupStudent`。衝突見下，不在此重抄規格。

## 未完成／卡住

兩套定義若並存，同一人會被講成相反的話。必須先改舊方案名單規則，不能把 `feature/sales-followup` 原樣合入。

- **按科 vs 按人。** 新方案：2627 已讀英文、未讀中文，中文仍算未續。舊方案：今學年只要有任何就讀中（含功輔、私人），就不再是未續報，改歸在讀加科。
- **學年窗。** 新方案寫死目標年 `2627`、熱層 `26SM`，7–8 月仍以 2627 為現已讀，並禁止用日曆 `isCollectableEnrollment`。舊方案「今學年」走 `listCurrentEnrollmentYearLabels`（`src/lib/enrollmentYearDisplay.ts`）：暑假今學年是暑期，並另含下一常規年。
- **曾讀門檻。** 新方案排除單堂與 HWK／HWKP，熱層預設只計 `26SM`，legacy 放冷層且按需載入。舊方案上一常規加上一暑期都算，單堂未排除，legacy 一有科目即曾讀，並會在開頁時納入預設活動。
- **入口。** 新方案寫「專科銷售跟進只走宣傳配對」。舊方案新開 `/SalesFollowUp`，不以宣傳配對替代跟進佇列。
- **學生詳情。** 新方案要在「報讀班別」之後加「歷年科目」分頁。舊方案明文不新開分頁，摘要掛在基本資料（`StudentSalesFollowupPanel`）。
- **舊方案多出的名單。** 退讀挽回，以及「今學年任何就讀中都進加科」。新方案不把增退／退讀當回流名單；加科只限缺了以前讀過的那科。
- **資料表。** 新方案寫不建表。舊方案四表分題稱已在 production。若保留跟進層，這句要改；若放棄舊方案，表會留在庫裡。
- **程式。** 舊分支落後 34 個提交，並改過新方案也會動的 `StudentDetailView.tsx`、`StudentPreviewPanel.tsx`、`studentQueries.ts`，以及 `App.tsx`、`navStructure.ts`、`academicYearAccess.ts`、`statusTag.ts`。宣傳配對本身舊方案沒改。

## 下一步（給新會話）

1. 先讀下面兩份分題，不要開工改碼。合併形狀仍是分析，不是已簽收產品句。
2. 請使用者拍板：宣傳配對是否為找人真源；`/SalesFollowUp` 是否只記活動與接觸；退讀挽回與全體在讀加科要留、要改名，還是刪除。
3. 拍板後才在最新 `main` 上搬跟進層，並改寫 `classifySalesFollowupStudent`，使「未續」呼叫新方案 predicate。不要把落後 34 個提交的分支原樣合併。
4. 若要核對四表是否已在 production，先查庫；本會話沒有查。

## 開局必讀（精簡）

- `AGENTS.md`
- [`docs/product/topics/student-enrollment-history-sales.md`](../../product/topics/student-enrollment-history-sales.md)（新方案；同目錄有顧問評審，非定案）
- [`/Users/hoiyingfan/Desktop/mainhope_sales-followup/docs/product/topics/sales-followup.md`](/Users/hoiyingfan/Desktop/mainhope_sales-followup/docs/product/topics/sales-followup.md) 與該樹 `src/lib/salesFollowupClassify.ts`

## 勿再踩

- 不要再搜一份名叫「流失率」的分題。使用者當日要找的就是這份舊方案。
- 不要把空班、暑期未續常規、學期完仍就讀中當成缺陷。舊方案「非在讀 ≠ 未續報」這點仍然成立。
- `main` 上另有未追蹤的 `scripts/import_onedrive_student_subjects.py` 與 `__pycache__`，與本題無關，不要納入。

## 明確唔做

- 本檔不複製兩份分題的產品句與驗收。
- 不改 `BACKLOG.md`。
- 不實作合併、不 commit、不開 PR、不套 migration。
