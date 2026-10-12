# A1 分層邊界

| 欄位 | 值 |
| --- | --- |
| 工作狀態 | 已完成 |
| 日期 | 2026-10-09 |
| 父檔 | [`../2026-10-09-structure-review.md`](../2026-10-09-structure-review.md) |

## 結論

`src/components/`、`src/pages/`、`src/lib/` 已沒有 `supabase.from`；`src/services/` 也沒有 import `components/`。`frontend-architecture-boundaries` 波次 1–4 所稱的直打表、營運總覽假 0、學生詳情部分 island、排程寫入遷出，抽樣核對屬實，放在「已排除」。

尚未收斂的是該題自己寫明的單向分層與大檔。學生詳情、班別詳情、排程管理、收款登記、私人課程仍各擁有多個可獨立失敗的區塊；`studentQueries` 與 `classQueries` 仍跨多個業務出口；`lib` 在執行期呼叫 service。

另外有三條畫面會把查詢失敗畫成 0 或空清單，不在該題驗收句之內，列為新發現：行政首頁 `dashboard.ts`、學生清單的近期報讀與科目標籤、學生更動紀錄，以及私人課程預約對話。

低優先 5 項，不進問題編號。未查資料庫；本軸以工作樹程式為準。

## 未查範圍

未逐函式拆開 `LeaveManagementView`、`TrialSessionsView`、`FinancePayrollView` 內部哪些寫入可以獨立失敗（只計了 `useState` 次數）。未把 `src/api/` 納入本軸範圍。未查遠端資料庫。

## 問題

### A1-01 行政首頁查詢失敗顯示為 0 堂與空名單

- 嚴重度：高
- 狀態：新發現
- 分類：分層造成的錯誤被吞掉
- 觀察：`fetchAdminDashboard` 在任一查詢出錯時仍回傳數字與陣列，外層 `catch` 則回傳全 0、空課堂、空請假。`AdminDashboard` 載入沒有錯誤狀態，直接把回傳值畫上「今日排程 N 堂」與待收款筆數。換日看板 `fetchScheduleBoardForDate` 失敗時回傳空陣列。報讀姓名對照失敗時回傳空 Map，課堂卡片的學生姓名變成「—」。
- 依據：`src/services/dashboard.ts` 第 46–52、93–95、153–172、253–274 行；`src/components/home/AdminDashboard.tsx` 第 49–56、112–113、190 行；`src/components/home/AdminHomeActionRail.tsx` 第 150–156 行。
- 影響：排程或繳費查詢逾時、權限或欄位錯誤時，行政首頁仍顯示 0 堂、0 筆待收款或沒有學生姓名，與當日沒有堂、沒有待收款無法區分。
- 建議：這三個查詢改為帶錯誤的結果，首頁對失敗群組顯示「未能載入」，不要把 `count ?? 0` 或空陣列當成成功。
- 既有分題：無。`docs/product/topics/frontend-architecture-boundaries.md` 表頭 `done`，波次 2 只驗收營運總覽 `fetchMgmtDashboard*` 與排程統計，不含 `src/services/dashboard.ts`。

### A1-02 學生查詢失敗回傳空集合，清單與更動紀錄當成成功

- 嚴重度：高
- 狀態：新發現
- 分類：分層造成的錯誤被吞掉
- 觀察：`fetchRecentClassEnrollments` 與 `fetchEnrollmentSubjectsByStudentIds` 在 `catch` 後回傳 `[]` 或空 Map，不拋出。學生清單把空結果寫進近期報讀與科目標籤，外層 `catch` 不會跑到。`fetchStudentActivity` 對狀態、繳費、報讀、退讀四段查詢各自略過錯誤，仍回傳陣列；更動紀錄 island 於是設成 `ready`，全失敗時顯示「尚無紀錄」，部分失敗時少一整類紀錄仍像完整成功。
- 依據：`src/services/studentQueries.ts` 第 934–938、981–984、2293–2356 行；`src/components/students/StudentsListPage.tsx` 第 324–325、468–473 行；`src/components/students/StudentHistoryTab.tsx` 第 36–38、67 行。
- 影響：近期報讀橫額會消失；科目標籤被寫成空陣列，篩選與排序會把查詢失敗看成沒有目前學年報讀科目。更動紀錄可漏掉繳費或退讀，畫面仍寫「尚無紀錄」或一份不完整的時間序。
- 建議：這三個函式改為失敗即拋出，或回傳 `{ ok } | { error }`；清單與更動紀錄只在成功且真的沒有列時顯示空狀態。
- 既有分題：無。同一分題波次 3 已讓學生詳情的報讀、繳費、親友在拋出時顯示「未能載入」，但上述三個函式在 service 內把錯誤吞掉，island 的 `try/catch` 收不到。

### A1-03 私人課程預約在查詢失敗時清成空清單並繼續

- 嚴重度：高
- 狀態：新發現
- 分類：分層造成的錯誤被吞掉
- 觀察：開啟預約時，該班排程與課室日曆若失敗，即將即將上課的排程設成 `[]`，不設定錯誤。改預約日期或進入改期時，課室日曆失敗被 `catch` 略過，對話仍可繼續選房、選時段。
- 依據：`src/components/privateTutoring/PrivateTutoringView.tsx` 第 817–829、838–845、866–874 行。
- 影響：職員看到沒有既有排程或沿用上一個日期的課室佔用，仍可建立預約，有機會與已有課堂重疊。
- 建議：這兩段失敗要留在對話上的錯誤，並停用確認；不要把空排程當成該班當日沒有堂。
- 既有分題：無。

### A1-04 多個畫面仍各擁有可獨立失敗的業務區塊

- 嚴重度：中
- 狀態：已有分題
- 分類：一個檔案擁有多個可獨立失敗的業務區塊
- 觀察：行數不是問題。下列檔案仍在同一個元件裡擁有可分開載入、分開寫入的區塊。學生詳情父層仍有基本資料、報讀（新增、退讀、改形式）、繳費、親友；請假、上課紀錄、未來排程、更動紀錄、學費追收已是子元件。班別詳情仍含基本資料、學生名單與加報讀、增退紀錄、排程（加堂、取消、補回、私人課程預約）。排程管理仍含列表、日視圖、加堂、搬課室、取消、代堂與名冊。收款登記仍含選學生與報讀、優惠、逾期、學費追收與出單。私人課程仍含名單、退讀、預約與新增報讀。未找到獨立的 `ClassScheduleTab`。
- 依據：`StudentDetailView.tsx` 約 2878 行、`useState(` 23 次（報讀、繳費、親友狀態見第 314–316、359 行；子頁 import 見第 13–20 行）。`ClassDetailView.tsx` 約 3184 行、`useState(` 32 次；分頁定義見 `src/lib/classDetailTabs.ts` 第 1–9 行；私人課程預約與加堂、補回狀態見 `ClassDetailView.tsx` 第 286–294、314–321、327–343 行。`ScheduleManagePage.tsx` 約 2814 行、`useState(` 23 次（第 258、340–377 行）。`PaymentsPageView.tsx` 約 2549 行、`useState(` 17 次（第 163–213 行）。`PrivateTutoringView.tsx` 約 2166 行、`useState(` 28 次（第 170–234 行）。`src/components/classes/` 沒有 `ClassScheduleTab` 檔。
- 影響：下一次只改退讀文案、只改補回或只改優惠，仍要動到同一檔的其他寫入與狀態，回歸範圍跨區塊。尚未在本輪證實這些檔案已經算錯金額或出席。
- 建議：沿該分題的合格線，只在區塊自己擁有載入與錯誤、或已有第二個畫面共用時才抽出。優先仍是該題點名未切的收款精靈與班別排程分頁。
- 既有分題：`docs/product/topics/frontend-architecture-boundaries.md`，表頭 `done`（波次 1–4 已落地；不聲稱完整單向分層）。殘餘是該題寫明未切的收款精靈、`ClassScheduleTab`，以及未拆的三大畫面；私人課程在該題稽核表已列為同一類，仍未抽出。

### A1-05 studentQueries 與 classQueries 仍跨多個業務出口

- 嚴重度：中
- 狀態：已有分題
- 分類：一個檔案擁有多個可獨立失敗的業務區塊
- 觀察：`studentQueries.ts`（約 2402 行）同時有學生讀寫、報讀與退讀、學生繳費、學生出席、學生請假、更動紀錄。`classQueries.ts`（約 1424 行）同時有班別讀寫、班別排程讀取、科目／課程／學年／老師選項，並 re-export 排程寫入與排程詳情。排程畫面已改 import `scheduleWriteQueries`／`scheduleDetailQueries`，但 `privateTutoringQueries.ts` 仍從 `classQueries` 取 `insertScheduleForClass`、`insertScheduleRow`、`updateSchedule`。
- 依據：`src/services/studentQueries.ts` 第 402、1461、1894、2126、2167、2221、2257 行；`src/services/classQueries.ts` 第 564、950、1088–1110、1149 行；`src/services/privateTutoringQueries.ts` 第 24–29 行。
- 影響：改排程寫入簽名或改繳費列形狀時，要同時猜 `classQueries` 轉出口與專用檔。私人課程與排程管理走不同 import，下一次容易只改到其中一條。尚未證實兩條出口的寫入結果已經分歧。
- 建議：私人課程改直接 import `scheduleWriteQueries`；`classQueries` 的 re-export 在沒有呼叫者後刪除。學生繳費、出席、請假的讀取遷到既有的 payment／attendance／leave service，學生檔只留學生與報讀。
- 既有分題：`docs/product/topics/frontend-architecture-boundaries.md`，表頭 `done`。殘餘是該題波次 4 寫明的 `classQueries` 暫時 re-export，以及仍留在學生查詢檔的繳費、出席、請假讀取（`insertPaymentForStudent` 已不在程式庫）。

### A1-06 lib 在執行期呼叫 service

- 嚴重度：中
- 狀態：已有分題
- 分類：service 反向依賴 components
- 觀察：資料流約定是 component → service → lib。下列 `lib` 檔在執行期呼叫 service，不是只引用型別：取消排程確認會呼叫排程生命週期預覽；非目前學年寫入與畢業確認會寫管理稽核；登入角色會讀授權 profile；錯誤上報會寫系統錯誤。`services/` 沒有 import `components/`，這一側已清掉；剩下的是 `lib` → `service`。
- 依據：`src/lib/scheduleSoftCancelConfirm.ts` 第 2–7、28 行；`src/lib/academicYearSoftGuard.ts` 第 4、109 行；`src/lib/graduationGuard.ts` 第 2 行；`src/lib/authSession.ts` 第 4、36 行；`src/lib/authBootstrap.tsx` 第 21 行；`src/lib/mgmtErrorReporting.ts` 第 1 行。分題原文：「唔聲稱完整單向分層」（`docs/product/topics/frontend-architecture-boundaries.md` 表頭）。
- 影響：改排程取消預覽或授權 profile 的回傳形狀時，會同時打破 `lib` 與呼叫它的畫面。本輪沒有證實這些呼叫已經算錯堂數或金額。
- 建議：確認對話留在元件；預覽與稽核寫入留在 service。`lib` 只保留純判斷。授權真源本身見移交 A2。
- 既有分題：`docs/product/topics/frontend-architecture-boundaries.md`，表頭 `done`。殘餘是該題明確不納入關閉條件的單向分層。分類用「service 反向依賴 components」是最接近的指定分類：service → component 已不存在，方向反了的是 `lib` 依賴 service。

## 低優先

1. `src/lib/appBanner.tsx`、`src/lib/appConfirm.tsx` 含 React，並 import `@/components/ui`。該分題驗收已寫明仍留，不升為中。
2. `lib` 有多個檔只為型別 import `services/`（例如 `paymentReceiptPdf.ts`、`scheduleDayView.ts`、`trialInvitePublicFlow.ts`）。不影響運算，但搬型別時容易形成循環。
3. `isDiscountInEffect`（`paymentDiscountQueries.ts` 第 178 行）與 `parseTimeSlotBounds`（由 `src/lib/promotionMatch.ts` 第 5 行引入）是純函式，卻住在 service 檔。
4. `src/pages/TeacherProfile.tsx`、`TeacherTimetable.tsx`、`FrontDeskIntake.tsx` 自己載入並畫表單，不是只轉交 View。各是單一畫面，不因為行數立案為中。
5. `fetchStudentTuitionArrearsByStudentIds`（`studentQueries.ts` 第 2374–2388 行）在 RPC 失敗時回傳已填 0 的 Map，且 `showArrears` 為 false。工作樹內沒有呼叫者，目前沒有畫面把這次失敗畫成 0。

低優先筆數：5。

## 移交

- A2：`lib/authSession.ts`、`lib/authBootstrap.tsx` 讀寫角色；授權真源與 RLS 不在本軸展開。
- A3／A6：`attendanceQueries.ts` 約第 756–767 行，出席已寫入後 `applyEntitlementConsumptionDelta` 失敗只 `console.error`。是否算錯扣堂屬領域與靜默失敗，本軸不展開。
- A5：`frontend-architecture-boundaries.md` 表頭為 `done`，同時寫明未完成單向分層；文件與程式對照不在本軸展開。
- A6：A1-01、A1-02 的失敗語意若要補測試，由可回歸軸處理。

## 已排除

- 元件、頁面、`lib` 沒有 `supabase.from`。唯一 `.rpc(` 在 `src/lib/supabaseAuth.ts` 第 11 行 `clear_my_mgmt_session_role`，屬 Auth。`eslint.config.js` 第 32–48 行禁止 UI／page／lib 匯入 raw `supabase`，`isSupabaseConfigured` 仍可直接用。
- `src/services/` 沒有 `from "@/components/"` 或相對路徑 `components/`。
- `src/lib/enrollmentPeriod.ts` 沒有 `supabase`；期數查詢在 `src/services/enrollmentPeriodQueries.ts`。
- 營運總覽卡面在失敗時有「資料未能載入」（`src/components/mgmtDashboard/MgmtStatCard.tsx` 第 83 行）。排程統計失敗走 `status: "error"`（`ScheduleManagePage.tsx` 第 410–416 行）。老師首頁試堂／請假失敗有「未能載入」（`TeacherHomeView.tsx` 第 182–218、984 行）。
- 學生詳情的報讀、繳費、親友失敗顯示「未能載入」（`StudentDetailView.tsx` 第 2074、2453、2726 行），不是把失敗畫成空清單。請假、上課紀錄、未來排程、更動紀錄、學費追收已是獨立元件；更動紀錄的 service 內吞錯誤另見 A1-02。
- `insertPaymentForStudent` 已不在 `src/`。排程管理、班別詳情、排程詳情的寫入 import `scheduleWriteQueries`／`scheduleDetailQueries`。`classQueries` 的 re-export 仍被私人課程使用，見 A1-05，不放本節。
