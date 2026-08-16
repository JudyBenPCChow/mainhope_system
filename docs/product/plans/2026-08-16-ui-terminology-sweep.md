# UI 術語一次過更新｜實作準備

| 欄位 | 內容 |
| --- | --- |
| 狀態 | `ready_to_verify` |
| 日期 | 2026-08-16 |
| 目的 | 把現行 UI 舊稱統一為 `docs/meta/TERMINOLOGY.md` 用語 |
| 不改 | Schema、DB 列舉值、程式識別字、路由、營運規則 |
| 前台預告 | [`UI_TERMINOLOGY_CHANGE_REFERENCE.md`](../../playbooks/frontdesk/UI_TERMINOLOGY_CHANGE_REFERENCE.md) |

## 1. 改動原則

1. 只改使用者看得到的標籤、提示、錯誤訊息、PDF 文案及通知文案。
2. 保留內部資料值，例如 `regular`、`class_kind=group`、`enrollment_period=NULL`、`registration_status='非注冊'`、現有 payroll mode。
3. 舊資料值用顯示映射轉成新詞，禁止全域字串取代。
4. 專科班、私人課程、功課輔導班三條產品線分開；一對一／一對二只作私人課程子類。
5. 阿Po 知識庫另作同一波收尾，但不可與 UI 顯示值混為一個改法。

## 2. 共用映射先行

- `src/lib/enrollmentPeriod.ts`
  - 常規 `NULL` 顯示由「全期報讀」改為「報讀」。
  - 暑期第一期／第二期／兩期全報及單堂保持原意。
- `src/services/studentQueries.ts`
  - `registrationStatusLabel()` 顯示「註冊／非註冊」。
  - 內部 union 及 DB 值 `非注冊` 暫時不改。
- 計糧顯示層
  - 保留內部 mode；畫面把 `HC` 顯示為「人頭」。
- 班型顯示層
  - `group` 顯示「專科班」；`private` 顯示「私人課程」，細分一對一／一對二。

## 3. 實作波次

### Wave A｜報讀與班型

重點檔案：

- `src/components/frontDesk/steps/EnrollClassStep.tsx`
- `src/components/trials/TrialConvertDialog.tsx`
- `src/components/students/StudentDetailView.tsx`
- `src/components/classes/ClassDetailView.tsx`
- `src/components/classes/ClassesListPage.tsx`
- `src/components/privateTutoring/PrivateTutoringView.tsx`
- `src/components/promotionMatch/PromotionMatchView.tsx`

改：報足全期／全期報讀、小組課／小組班、把一對一當整類總稱等。

### Wave B｜學生狀態、點名與學費堂數

重點檔案：

- `src/components/students/StudentsListPage.tsx`
- `src/components/frontDesk/StudentIntakeFormFields.tsx`
- `src/components/students/studentsUi.tsx`
- `src/components/privateTutoring/PrivateTutoringStudentDisclosure.tsx`
- `src/components/attendance/AttendanceRecordsPage.tsx`
- `src/components/leaves/LeaveManagementView.tsx`
- `src/components/trials/TrialSessionsView.tsx`
- `src/components/teachers/TeacherDetailView.tsx`

改：注冊／非注冊、已上堂數、已付堂數等；DB 值不動。

### Wave C｜老師、收款、計糧與校曆

重點檔案：

- `src/components/schedule/ScheduleManagePage.tsx`
- `src/components/schedule/ScheduleDetailView.tsx`
- `src/components/inbox/InboxView.tsx`
- `src/components/payments/PaymentsPageView.tsx`
- `src/components/payments/PaymentCorrectionView.tsx`
- `src/components/payroll/payrollShared.tsx`
- `src/components/payroll/FinancePayrollView.tsx`
- `src/components/calendar/AcademicCalendarView.tsx`

改：主責／換主責、權益池／堂數包、HC、全校停課等。

### Wave D｜使用者可見 service 訊息、PDF 與阿Po

- service error／confirm 文案：只改會顯示給使用者的字串。
- `src/components/payroll/mockPayslipPdf.ts`：計薪 HC → 計薪人頭。
- `supabase/functions/_shared/apoKnowledge.ts`
- `supabase/functions/_shared/apoHowtoGuides.ts`

## 4. 驗收

- 常規報讀畫面只顯示「報讀」或「單堂」，不再顯示「報足全期／全期報讀」。
- 班型只用「專科班／私人課程／功課輔導班」。
- 老師用語只用「任教老師／實際授課老師／代堂」。
- 堂數只用「已繳堂數／已扣堂數」；計糧只顯示「人頭」。
- 學生狀態畫面顯示「註冊／非註冊」，舊 DB 值仍可正常讀寫。
- 收款及更正流程功能、提交值與查詢結果不變。
- 完成後執行 `npm run lint`、測試、`npm run ui:check`、`npm run build`，並以 `rg` 重掃使用者可見舊詞。
