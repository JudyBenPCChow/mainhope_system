# A6 可回歸與負荷

| 欄位 | 值 |
| --- | --- |
| 工作狀態 | 已完成 |
| 日期 | 2026-10-09 |
| 父檔 | [`../2026-10-09-structure-review.md`](../2026-10-09-structure-review.md) |

## 結論

計糧純計算、消堂單價、權益消耗差額、名冊資格、月費與逾期罰款規則已有單元測試；本輪抽樣 26 個測試檔，156 項通過、4 項略過。略過的是未設環境變數的 live 煙霧，不是失敗。沒有跑全庫 `npm test`。

主線 CI 會跑 `npm test`，但暑期期數與點名可見、學費優惠扣減、計糧年級帶、連堂合併、學號下一個號碼，都沒有對應單元測試，綠燈罩不住這些規則。

已證實的高風險在失敗語意：報讀、改期、單堂選堂與加堂之後，鑄池或到課宣告拋錯只寫主控台，呼叫方仍當成功；前台建檔在學生全表失敗時把學號設成 `00000001` 並可提交。堂數對帳的排程與收款查詢在分塊內沒有再分頁，若單次回傳被截斷會少算堂且不拋錯；本輪未查遠端列數上限，故該項為待查。

計糧草稿快取、出席日期範圍專用 RPC、總覽詳情不再重算收入、出席載入失敗會藏起統計，已對照程式，放入已排除。

## 未查範圍

沒有跑全庫 `npm test`，沒有對 production 做壓測，也沒有查遠端 API 列數上限或堂數對帳實際列數。未逐一打開的畫面大檔不因缺少元件測試而立案。`dist/`、`docs/generated/**` 未當真源。

## 問題

### A6-01 報讀、改期與加堂後，鑄池或宣告失敗仍當成功

- 嚴重度：高
- 狀態：新發現
- 分類：靜默失敗
- 觀察：報讀寫入成功後，結束試堂與鑄池／宣告若拋錯，只 `console.warn`，函式仍回傳報讀 id。改期後重鑄池、單堂改選堂後同步宣告，同樣只警告。班別新增排程後，逐筆報讀補宣告的錯誤被吃掉；外層再 catch 一次，排程 id 仍回傳。前線看到的是已報讀或已加堂，點名紙可以因此少人。
- 依據：`src/services/studentQueries.ts` 1668–1687（`closeOpenTrialsAfterEnrollment`、`ensureEntitlementPoolAndDeclarations`）、1744–1754（`remintPoolAfterPeriodChange`）、1783–1792（`syncSingleLessonDeclarations`）；`src/services/entitlementQueries.ts` 1146–1159；`src/services/scheduleWriteQueries.ts` 120–145、304–332；`src/services/batchScheduleHelpers.ts` 284–285（外層不再拋，內層已吞掉單筆失敗）。
- 影響：已繳堂數池或到課宣告沒有寫上，點名名單與扣堂對象會少人，畫面仍像操作完成。
- 建議：這些副作用失敗要讓操作者看到，並留下可重跑的紀錄；不要在回傳成功 id 之後只寫主控台。
- 既有分題：退讀後作廢宣告失敗見 [`docs/product/topics/enrollment-declaration-transfer-and-purge.md`](../../../product/topics/enrollment-declaration-transfer-and-purge.md)（`open`）§3.2。該節只覆蓋退讀。本條是報讀、改期、加堂，不在該節。

### A6-02 前台建檔在學生名單失敗時把學號當成 00000001

- 嚴重度：高
- 狀態：新發現
- 分類：靜默失敗
- 觀察：前台登記步進頁載入時拉全表學生。失敗的 `catch` 沒有錯誤提示，改呼叫空清單的下一個學號，得到 `00000001`。提交時先用畫面上的學號寫入；只有撞上唯一鍵才再拉全表重試。空清單算出的 `00000001` 若尚未占用，會直接建成一名學生。
- 依據：`src/components/frontDesk/steps/RegisterStudentStep.tsx` 136–142、237–241；`src/lib/studentCode.ts` 35–45。對照：學生管理新增對話在計號失敗時把學號清成空字串（`src/components/students/AddStudentDialog.tsx` 146–151），正式計號走 `allocateNextStudentCode`（`src/services/studentQueries.ts` 499–510）。`nextStudentCode` 沒有單元測試；live 煙霧未設環境變數時不跑。
- 影響：載入失敗被顯示成一個可提交的學號。寫入成功後，該生編號不是全庫最大號加一。
- 建議：載入失敗要顯示錯誤並禁止提交；下一個學號維持全庫計號，並為空清單與「忽略非數字」補單元測試。
- 既有分題：無。軟封存要求學號計號必須含已畢業，見 [`docs/product/topics/soft-archive-query-scope.md`](../../../product/topics/soft-archive-query-scope.md)（`done`），該題沒有覆蓋這條失敗語意。

### A6-03 堂數對帳的排程與收款查詢在分塊內沒有分頁

- 嚴重度：高
- 狀態：待查
- 分類：慢查詢與一次拉全表
- 觀察：營運總覽進入詳情階段就呼叫全站堂數對帳，不是等使用者打開該表。就讀中報讀有每頁 1000 列的迴圈；其後已收款、繳費明細、待補堂、排程都先按 id 分成 80 筆一批，批內沒有 `.range()`。排程一批可對上多個班別的全部日期。本輪沒有查遠端單次回傳上限，也沒有數 production 列數，不能確認現況是否已經少列。
- 依據：`src/services/mgmtDashboardQueries.ts` 1184–1196；`src/services/pendingLessonQueries.ts` 409–427、431–473、482–497、541–546；`src/lib/supabaseInChunks.ts` 1。對照同庫已分頁的路徑：計糧月內出席 `src/services/payrollQueries.ts` 143–153。
- 影響：若單次回傳被截斷，少回來的堂或已繳堂數不會拋錯，對帳會把未返回的列當成沒有，堂數與應追堂數會少算。
- 建議：先查 API 列數上限與最忙一批的實際列數。上限低於單批結果時，批內要像報讀查詢那樣分頁，截斷必須當失敗而不是當齊。
- 既有分題：[`docs/product/topics/mgmt-dashboard-overhaul.md`](../../../product/topics/mgmt-dashboard-overhaul.md)（`done`）寫堂數不符改按需。現況仍在詳情階段每次執行。截斷風險不在該題正文。

### A6-04 暑期期數、單堂可見與包裝類型沒有測試

- 嚴重度：中
- 狀態：新發現
- 分類：純規則缺少測試
- 觀察：點名是否看見該報讀、日期落在第幾期、每堂單價，以及報讀形式對應的權益包裝，都在純函式。同目錄沒有 `enrollmentPeriod.test.ts`，其他測試檔也沒有引用這些函式。包裝類型在鑄池時使用。一旦改錯，暑期第一期與第二期會跨期出現，或單堂出現在未選的堂，單價與包裝也會跟著錯。本輪沒有證明現行程式已算錯。
- 依據：`src/lib/enrollmentPeriod.ts` 36–63、84–92、108–128；`src/lib/entitlementPackage.ts` 55–62；`src/services/entitlementQueries.ts` 580。
- 影響：改動這些函式時，CI 不會抓住跨期名單或單價錯誤。
- 建議：為「第一期／第二期／兩期全報／單堂／期數空白」與日期對照、單價回退、包裝類型各補一例。
- 既有分題：無。消堂單價 `unitPriceForConsumedLesson` 已有測試，見已排除，不代替上述函式。

### A6-05 學費優惠資格與扣減沒有測試

- 嚴重度：中
- 狀態：新發現
- 分類：純規則缺少測試
- 觀察：優惠是否適用、固定額與百分比的套用順序、儲存時各步扣減，都是純函式，沒有 `*.test.ts` 引用。規則含科目數、堂數、新生、聯合報讀與階梯。改錯會少收或多收，本輪沒有證明現行程式已算錯。
- 依據：`src/lib/paymentDiscountEligibility.ts` 310–324、327–394、417–437；`src/services/paymentDiscountQueries.ts` 581–636；`src/lib/paymentAmountBreakdown.ts` 24–38、48–68、100–113。
- 影響：主線測試綠燈不保護學費優惠金額。
- 建議：至少鎖百分比先於固定額、門檻不足時不得扣、以及已存扣減與即時重算的差異。
- 既有分題：無。

### A6-06 計糧年級帶與私人課程名額沒有測試

- 嚴重度：中
- 狀態：新發現
- 分類：純規則缺少測試
- 觀察：`computePayrollMonth` 的測試直接傳入已解析的年級帶與名額。把班別年級收成初中／高中／小學，以及把私人課程收成一對一或一對二，在另一個檔，沒有測試。高中優先於初中；私人課程科目沒有標名額時當成一對一。這兩步改錯會用錯時薪，本輪沒有證明現行程式已算錯。
- 依據：`src/lib/payroll/gradeBand.ts` 10–39；呼叫處 `src/services/payrollQueries.ts` 332–334。對照：`src/lib/payroll/computeMonth.test.ts` 29–32 的功課輸入已帶 `gradeBand: "junior"`。
- 影響：費率公式有網，分級與名額沒有網。
- 建議：為混級班別、只有小學、以及私人課程科目含「一對二」或未標名額補測試。
- 既有分題：計糧引擎 [`docs/product/topics/payroll-engine.md`](../../../product/topics/payroll-engine.md)（`done`）已覆蓋計算接線，沒有要求這兩個解析函式的測試。

### A6-07 連堂點名合併沒有測試

- 嚴重度：中
- 狀態：新發現
- 分類：純規則缺少測試
- 觀察：同一 `consecutive_group_id` 會合成一筆點名項，並帶上全部 `scheduleIds`。沒有測試鎖定兩節都在、單節不合併、以及結束時間取最後一節。合併改錯時，連堂兩節會被當成一節寫入，或兩筆不相干的堂被寫成同一狀態。本輪沒有證明現行程式已算錯。
- 依據：`src/lib/consecutiveLesson.ts` 152–224。
- 影響：點名儲存依這份 `scheduleIds` 逐節寫入；缺測試時，連堂扣堂節數容易在改動後走樣。
- 建議：補兩節合併、無組別不合併、缺 `class_id` 略過。
- 既有分題：原班連堂分節點名 [`docs/product/topics/consecutive-half-session-attendance.md`](../../../product/topics/consecutive-half-session-attendance.md)（`cancelled`）。取消的是分節不同狀態，不是這份合併函式的測試。

### A6-08 逾期罰款明細查詢失敗時變成沒有罰款

- 嚴重度：中
- 狀態：新發現
- 分類：靜默失敗
- 觀察：讀取單據時，逾期罰款明細若拋錯，改成空陣列並只 `console.warn`，單據其餘欄位仍回傳。金額分解用單據上的應繳總額，但罰款列來自這份明細。失敗與「沒有罰款」在畫面上相同。註解寫這是為了資料表尚未建立；罰款規則的生效日已是 2026-10-01，查詢仍可能因權限或網路失敗。本輪沒有證明某張單據已經少顯示罰款。
- 依據：`src/services/paymentQueries.ts` 584–613；顯示組裝 `src/lib/paymentAmountBreakdown.ts` 74–92。
- 影響：總額欄位不一定被改成 0，但罰款列會消失，核對的人會以為沒有加罰。
- 建議：表已存在時，查詢失敗要顯示錯誤，不要把明細改成空陣列。
- 既有分題：無。逾期罰款規則本身有 `src/lib/tuitionLateFee.test.ts`，不覆蓋這條讀取失敗。

## 低優先

### 低-01 請假預填扣堂狀態沒有測試

- 嚴重度：低
- 分類：純規則缺少測試
- 觀察：`prefillStatusFromLeave` 把含「不補回」的安排預填為事假（不扣堂），含「錄影」則為錄影回放（扣堂）。函式短。扣堂白名單 `isBillableAttendanceStatus` 已有測試。
- 依據：`src/lib/attendanceBilling.ts` 68–80；白名單測試在 `src/lib/entitlementConsumptionDelta.test.ts`。

### 低-02 實際出席與扣堂白名單分開且沒有測試

- 嚴重度：低
- 分類：純規則缺少測試
- 觀察：`isActualPresentStatus` 把 no show 排除在實際出席之外，邏輯短，只服務報表口徑。
- 依據：`src/lib/attendancePresence.ts` 1–24。

### 低-03 班別詳情主重載拉全表學生再篩可加入名單

- 嚴重度：低
- 分類：慢查詢與一次拉全表
- 觀察：班別詳情每次 `reload` 都 `fetchAllStudents()`（`select("*")`），再在前端去掉已在名單的人，供加入班別。全表失敗會讓整頁 `Promise.all` 失敗並顯示錯誤，不是把班內名單靜默變成 0。老師範圍不拉全表。
- 依據：`src/components/classes/ClassDetailView.tsx` 433–441、1229–1234；`src/services/studentQueries.ts` 402–409。

### 低-04 出席紀錄篩選仍拉全部班別

- 嚴重度：低
- 分類：慢查詢與一次拉全表
- 觀察：出席列表已走日期範圍 RPC。篩選用的班別選項仍 `fetchAllClasses()`。這是選項清單，不是把出席列拉回前端再篩日期。
- 依據：`src/components/attendance/AttendanceRecordsPage.tsx` 244–258。

### 低-05 臨時減免金額只做正數檢查且沒有測試

- 嚴重度：低
- 分類：純規則缺少測試
- 觀察：`normalizeSpecialDiscountAmount` 把非有限或非正數變成 0，其餘四捨五入到分。邏輯薄。
- 依據：`src/lib/paymentSpecialDiscount.ts` 7–10。

### 低-06 學生詳情的親友選擇器失敗時變成空名單

- 嚴重度：低
- 分類：靜默失敗
- 觀察：開啟親友對話時拉全表學生，失敗則 `setAllStudentsForPick([])`，沒有錯誤文案。不影響該生報讀主檔；學生詳情進頁用的是 `getStudentById`。
- 依據：`src/components/students/StudentDetailView.tsx` 1236–1238、380。

低優先筆數：6。

## 移交

- A1：計糧畫面、班別詳情、學生詳情同時擁有多個可獨立失敗的區塊。本軸不因沒有元件測試而逐檔立案。
- A2：`canTeacherEditScheduleRollCall`（`src/lib/scheduleSubstitute.ts` 39–45）決定老師身份能否改該堂點名。
- A3：`PACKAGE_CONSUME_PRIORITY` 只在 `src/lib/entitlementPackage.ts` 15–21 定義，程式內沒有其他引用。扣堂順序是否另有實作，本軸不判斷。

## 已排除

- 點名已寫入但扣堂失敗只寫主控台：[`docs/product/topics/attendance-marked-not-consumed.md`](../../../product/topics/attendance-marked-not-consumed.md)（`open`）§3.1 已覆蓋。程式仍在 `src/services/attendanceQueries.ts` 755–767 與 843–855。沒有超出該題的殘餘，不另立。
- 退讀後作廢宣告失敗仍當退讀完成：[`docs/product/topics/enrollment-declaration-transfer-and-purge.md`](../../../product/topics/enrollment-declaration-transfer-and-purge.md)（`open`）§3.2。行號仍為 `src/services/studentQueries.ts` 1948–1956。
- 出席日期範圍：`fetchAttendanceRecordsInRange` 呼叫 `get_attendance_records_in_range`，不再打名冊 RPC（`src/services/attendanceQueries.ts` 1118–1129）。載入失敗會 `setRows([])`（`src/components/attendance/AttendanceRecordsPage.tsx` 164–166），同時顯示錯誤並寫明統計已隱藏（359–366）。與 [`docs/product/topics/attendance-records-range-query.md`](../../../product/topics/attendance-records-range-query.md)（`done`）相符。
- 計糧未結算不是每次進頁都重算：`shouldReusePayrollDraftSnapshot` 命中則讀草稿（`src/services/payrollQueries.ts` 887–915）；未命中才重算並寫 `calc_at`（917–934）。與 [`docs/product/topics/mgmt-dashboard-overhaul.md`](../../../product/topics/mgmt-dashboard-overhaul.md)（`done`）波次 4 相符。`computePayrollMonth`、費率與強積金有 `src/lib/payroll/computeMonth.test.ts`，本輪通過。
- 營運總覽詳情階段不重打收入：`detailsSkipped`（`src/services/mgmtDashboardQueries.ts` 1308–1324）。KPI 錯誤或未完成顯示「—」（`src/components/mgmtDashboard/MgmtStatCard.tsx` 10）。部分指標失敗會提示（`src/components/mgmtDashboard/MgmtDashboardView.tsx` 79–84）。收入重算重複已收斂；堂數對帳的分頁缺口見 A6-03。
- 消堂單價 `unitPriceForConsumedLesson` 有 `src/services/mgmtDashboardQueries.test.ts`，本輪通過。
- 軟封存：列表專用查詢與 `fetchAllStudents`／`fetchAllClasses` 默認分離，`src/services/softArchiveQueryContracts.test.ts` 本輪通過。學生詳情主檔是 `getStudentById`，不是進頁拉全表。班別詳情仍拉全表只列入低優先。
- 主線品質閘會跑 `npm test`（`.github/workflows/ci.yml`）。2627 權益與生命週期 live 煙霧以環境變數開啟，與 [`docs/product/topics/mainline-quality-gate.md`](../../../product/topics/mainline-quality-gate.md)（`done`）「不做全面 E2E」相符，不把「煙霧未入 CI」再報成缺陷。
- 學生時間衝突、月費、專科期數堂數、功輔收費、權益消耗差額、名冊資格：抽樣測試通過，不因「還可以再加案例」立案。
