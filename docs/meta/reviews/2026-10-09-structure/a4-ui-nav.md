# A4 畫面與導覽

| 欄位 | 值 |
| --- | --- |
| 工作狀態 | 已完成 |
| 日期 | 2026-10-09 |
| 父檔 | [`../2026-10-09-structure-review.md`](../2026-10-09-structure-review.md) |

## 結論

靜態檢查 `npm run ui:check` 已通過：產品畫面未見 `alert()`、`confirm()`、未登錄的原生 `<select>`，也未見同一 `className` 內淺底配 `text-*-foreground`。已登記的清單與詳情路由都有 `createListDataCache`；收件匣、進行點名、收款登記、報表沒有套這套 TTL 快取。

會直接誤導人數或金額的，是失敗被畫成 0，以及寫入後相關清單在五分鐘內仍當作新鮮。行政首頁今日堂數、換日課堂，以及人數報表在學年清單失敗後，都會以 0 或空列呈現。點名、學生詳情或前台建立請假、已繳堂數調動，都沒有令對應清單失效。

側欄角色清單與路由 capability 仍是兩套，這是既有入口分題的範圍；側欄隱藏不是權限，只在移交記一行。桌面與流動有各自版面，未見兩套會同時矛盾的狀態。未在瀏覽器點選。

## 未查範圍

- 未開瀏覽器，未點選任何畫面。看不到的互動不記成缺陷。
- 未核對正式環境像素、側欄展開、手機抽屜與沙盒是否一致。分題 [`sidebar-hub-ia.md`](../../product/topics/sidebar-hub-ia.md) 已寫「正式畫面待驗」，該項不另立案。
- 未逐頁核對舊稱（例如報足全期）是否只出現在原型。產品 `src/components` 的畫面字串未見「報足全期」「功課班」「單對單」「正規學年」。
- 未逐一核對每一個 `catch` 之後的空陣列。下面只記會把失敗畫成 0、且畫面上沒有留下錯誤的路徑。

## 問題

### A4-01 行政首頁把查詢失敗畫成 0 堂

- 嚴重度：高
- 狀態：新發現
- 分類：錯誤與空狀態呈現
- 觀察：行政首頁的今日堂數與課堂卡，在查詢失敗時仍以 0 堂和空清單顯示，畫面上沒有錯誤。換日檢視失敗時同樣變成空課堂。待收款徽章在筆數不大於 0 時不顯示，失敗與「沒有待收款」外觀相同。
- 依據：`src/services/dashboard.ts` 的 `fetchAdminDashboard`（約 253–274 行）在查詢有 `error` 時只 `console.error`，仍回傳 `todayClassCards.length` 與 `pendingPayCountRes.count ?? 0`；`catch` 回傳全 0 的 `emptyPayload()`。`fetchScheduleBoardForDate`（約 153–172 行）在錯誤時回傳空的 `todayClassCards`。`src/components/home/AdminDashboard.tsx` 的 `load`（約 49–56 行）沒有 `catch`，初始值是 0（約 24–29 行），堂數直接渲染（約 112–113 行）。換日的 effect（約 83–95 行）只在成功回呼裡結束載入。`AdminHomeActionRail.tsx` 的 `PendingBadge`（約 86–88 行）在 `count <= 0` 時不渲染；同檔約 153–158 行的待收款請求也沒有失敗分支。
- 影響：查詢失敗會被看成當日沒有課堂、沒有請假、沒有待收款。行政可能因此不處理當日點名或收款。
- 建議：失敗時保留錯誤文字，不要把 0 或空卡當作當日結果。服務回傳前應讓呼叫端分得開「真的是 0」和「這次沒有查到」。
- 既有分題：無

### A4-02 學年清單失敗後人數報表改顯示 0

- 嚴重度：高
- 狀態：新發現
- 分類：錯誤與空狀態呈現
- 觀察：學年選項載入失敗後，畫面先記下錯誤，隨即被報表載入清掉。學年編號是空的，報讀統計改用空報表（班數、報讀筆數、不重複學生都是 0），下拉顯示「尚無學年」。整體學生分析若成功，畫面上就沒有錯誤。
- 依據：`src/components/reports/EnrollmentReportsView.tsx` 空報表在約 36–41 行。學年載入的 `catch` 約 107–110 行會 `setErr`。`load` 約 129–134 行先 `setErr(null)`，學年編號為空時直接 `Promise.resolve(emptyReport)`。錯誤區塊約 225–228 行；學年下拉在 `years.length === 0` 時顯示「尚無學年」（約 239 行）；報讀筆數約 295–296 行。匯出沒有在錯誤時停用（約 196–204 行）。
- 影響：學年清單失敗會被看成這個學年沒有報讀，並可匯出全是 0 的 CSV。這和資料庫裡真的沒有學年無法從畫面分辨。
- 建議：學年清單失敗時不要清掉錯誤，也不要用空報表充當該學年人數。匯出應在學年沒有成功載入時停用。
- 既有分題：無

### A4-03 點名寫入後出席紀錄在快取期限內不重抓

- 嚴重度：中
- 狀態：已有分題
- 分類：清單快取
- 觀察：進行點名按確定寫入出席後，沒有使出席紀錄快取失效。若該日期範圍的快取仍新鮮，出席紀錄頁直接返回，不打網路。分題只把「刪除出席」寫成這頁的失效點，點名這條寫入還在。
- 依據：`src/components/attendance/RollCallClassPanel.tsx` 約 455–462 行呼叫 `saveAttendanceStatusForStudentScheduleScope`，其後沒有失效呼叫。全庫 `invalidateAttendanceRecordsDataCache` 只出現在 `AttendanceRecordsPage.tsx` 刪除成功（約 213 行）。同檔約 225–228 行：`isAttendanceRecordsCacheFresh` 為真就 `return`。規則見 `docs/meta/UI_DESIGN_INSTRUCTIONS.md` §16.5 與分題「寫入成功後必須失效」。
- 影響：剛點完名，五分鐘內打開出席紀錄，仍可能是點名前的列。資料庫已寫入，畫面人數會落後。尚未在瀏覽器看過實際延遲。
- 建議：點名儲存成功後讓出席紀錄快取失效（保留舊列、下次進入再靜默重抓）。不要為進行點名頁本身加 TTL 快取。
- 既有分題：[`docs/product/topics/list-data-cache.md`](../../product/topics/list-data-cache.md)，表頭狀態 `done`。適用表只列出席紀錄的「刪除出席」。

### A4-04 已繳堂數調動後學費追收快取仍當新鮮

- 嚴重度：中
- 狀態：新發現
- 分類：清單快取
- 觀察：單據／堂數更正的調動與搬堂會改已繳堂數餘額，成功後沒有使學費追收快取失效。學費追收在快取新鮮時整段跳過載入。收款登記與繳費紀錄的寫入有失效，這條更正沒有。
- 依據：`src/components/payments/PaymentCorrectionView.tsx` 的 `submitAdjust`（約 193–206 行）與 `submitTransfer`（約 226–244 行）都沒有呼叫 `invalidateTuitionChaseListDataCache`。`TuitionChaseView.tsx` 約 283–285 行在 `isTuitionChaseListCacheFresh` 時直接返回。對照 `PaymentsPageView.tsx` 約 1307–1308 行與 `PaymentHistoryView.tsx` 約 340–341 行會同時失效繳費紀錄與學費追收。追收列的餘額來自 `remaining_lessons`（`src/services/tuitionChaseQueries.ts` 約 523、895–900 行）。
- 影響：剛改完餘額，五分鐘內回到學費追收，本期應收與餘額仍可能是調動前的數字。尚未證實有人已按這個舊數字出單。
- 建議：調動與搬堂成功後，使學費追收快取失效。學費追收本身可以保留快取，因為離開到收款登記會卸載清單，而收款登記不應再套 TTL。
- 既有分題：無。清單快取分題的適用表沒有學費追收；排除表也沒有把它列為不可快取的即時佇列。

### A4-05 其他頁建立請假後請假清單在快取期限內不重抓

- 嚴重度：中
- 狀態：已有分題
- 分類：清單快取
- 觀察：學生詳情與前台指引都可以新增請假，成功後沒有使請假管理快取失效。請假管理在沒有網址深連結、且快取新鮮時不重抓。失效只發生在請假管理頁自己的重新載入。
- 依據：`src/components/students/StudentLeaveTab.tsx` 約 241 行、`src/components/frontDesk/steps/LeaveStep.tsx` 約 189 行皆呼叫 `insertLeaveMakeupForSchedule`，兩檔都沒有失效呼叫。`invalidateLeaveManagementDataCache` 只在 `LeaveManagementView.tsx` 的 `reload`（非靜默時，約 223 行）。同檔約 256–257 行：無 `recordFromUrl`、無 `studentIdFromUrl` 且快取新鮮則返回。
- 影響：剛登記的請假，五分鐘內打開請假管理，清單可能還沒有該筆。尚未在瀏覽器看過。
- 建議：上述寫入成功後讓請假管理快取失效。深連結優先的現有行為可保留。
- 既有分題：[`docs/product/topics/list-data-cache.md`](../../product/topics/list-data-cache.md)，表頭狀態 `done`。適用表寫請假管理在 `reload` 非靜默時失效，沒有涵蓋學生詳情與前台。

## 低優先

低優先筆數：3。

### A4-06 側欄「清單」與「日視圖」同時高亮

- 嚴重度：低
- 狀態：新發現
- 分類：入口與導覽
- 觀察：判斷側欄是否高亮時，會先去掉路徑裡的查詢字串。`/Schedule` 與 `/Schedule?view=day` 因此都變成 `/Schedule`。人在排程頁（含日視圖或某筆排程詳情）時，兩項會一起亮。`pathIsActive` 本身也不看查詢字串，所以不先去掉的話，日視圖項永遠不會亮。
- 依據：`src/lib/roleMainNav.ts` 約 39–44 行。`src/lib/navStructure.ts` 的 `pathIsActive` 約 391–394 行。日視圖項見 `navStructure.ts` 約 191–192 行、`adminNavigation.ts` 約 74–75 行。釘選比對 `navLeafMatchScore`（`src/lib/pinnedPages.ts` 約 69–83 行）會看查詢字串，側欄高亮沒有沿用。
- 影響：只影響哪一項看起來是目前頁，不改資料。
- 建議：高亮沿用已能分辨 `view=day` 的比對，不要先把查詢字串切掉。本輪不改。
- 既有分題：無

### A4-07 推薦回贈畫面使用「已付」

- 嚴重度：低
- 狀態：新發現
- 分類：控制項與用語
- 觀察：推薦回贈頁的說明與按鈕寫「標記已付」。術語表對學費用已繳，禁用已付。這一頁說的是推薦人現金回贈是否已發出，與學費「已繳」不是同一個動作，畫面上沒有兩套詞並存。
- 依據：`src/components/payments/ReferralRebatesView.tsx` 約 72、131 行。`.cursor/rules/terminology.mdc`「已繳／已扣（禁已付／已上）」。
- 影響：用詞與術語表不一致。不會因此算錯回贈金額。
- 建議：只登記。本輪不改字，除非日後要統一現金回贈的狀態用詞。
- 既有分題：無

### A4-08 同一校曆路徑有兩個名稱

- 嚴重度：低
- 狀態：新發現
- 分類：控制項與用語
- 觀察：`/AcademicCalendar` 在 `NAV_STRUCTURE` 叫「校曆」，行政網站地圖叫「專科校曆」。管理層與外星人的側欄仍走 `NAV_STRUCTURE`。功輔另有「功輔校曆」。
- 依據：`src/lib/navStructure.ts` 約 193 行；`src/lib/adminNavigation.ts` 約 157 行。術語表：專科校曆與功輔校曆成對。管理層選單仍用 `NAV_STRUCTURE`，見 `src/lib/roleMainNav.ts` 約 28–36 行。
- 影響：同一頁兩個名稱，和功輔校曆並排時較難分辨。不影響校曆資料。
- 建議：只登記。管理層側欄名稱待 [`sidebar-hub-ia.md`](../../product/topics/sidebar-hub-ia.md) 定稿時一併對齊，本輪不改。
- 既有分題：[`docs/product/topics/sidebar-hub-ia.md`](../../product/topics/sidebar-hub-ia.md)，表頭狀態 `in_progress`（管理層頂層列未定稿）。

## 移交

- 側欄隱藏不等於路由打不開：`App.tsx` 用 capability，`navStructure` 用角色清單。權限是否越權移交 A2。入口分題 [`nav-capability-entry.md`](../../product/topics/nav-capability-entry.md) 狀態 `open`。
- `fetchAdminDashboard` 與 `fetchScheduleBoardForDate` 在服務層把錯誤收成 0 或空陣列。畫面後果見 A4-01；分層吞錯與是否缺測試可併 A1、A6。

## 已排除

- `npm run ui:check` 通過。`alert()`、`confirm()`、未登錄原生 `<select>`、同一字串內 `bg-warning/10`（及其他語意淺底，透明度不大於 40）配 `text-*-foreground`，在產品 `tsx` 未見。實心 `bg-warning text-warning-foreground` 符合 §9。原生 `<select>` 僅允許 `select.tsx` 與 `PaymentsPageView.tsx`（長名單，§12）。
- 原型目錄不進 `ui:check`。`src/prototypes` 裡的「報足全期」與淺底白字不當正式畫面缺陷。對應 [`ui-guideline-hygiene.md`](../../product/topics/ui-guideline-hygiene.md) 狀態 `open`，其待做（Select 舊 class、桌面列表殼、月費內嵌出單）不在本輪重報。
- 清單快取分題狀態 `done` 的頁（學生、班別、老師、排程、私人課程、功課輔導、繳費紀錄、增退、試堂、請假、出席紀錄、教學紀錄、課程、課室）都有 `createListDataCache`。未見用 `location.key` 當重載條件。
- 收件匣、進行點名、收款登記、人數報表、營運總覽沒有套 `createListDataCache`。學費追收有快取，但離開到收款登記會卸載，且出單路徑有失效，快取本身不單獨立案（失效缺口見 A4-04）。
- 行政、老師、財務的側欄與「所有功能」已改專用清單，與 `App.tsx` 路徑能對上。手機底欄是捷徑，分題寫明維持現況，不把「底欄項目少於側欄」當缺陷。
- 學費追收的桌面預覽與流動詳情用 `previewEnabled` 二擇一，不是兩套同時有效的狀態。排程在窄螢幕改顯示「按日」，儲存的仍是同一個 `viewMode`。只是版面不同。
- 空班、未續報、權益池為 0 仍在點名紙、學期結束仍就讀中、假期當日沒有排程列，不當畫面缺陷。
