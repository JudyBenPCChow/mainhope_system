# Session HANDOFF：試堂轉跳收款後載入過久

| 欄位 | 值 |
| --- | --- |
| 日期 | 2026-10-24 |
| 主題／backlog | 無分題。側欄產品規則見 `docs/product/topics/admin-desktop-context-rail.md`（本任務不改側欄規格） |
| 分支／工作樹 | `main`，未提交。本任務相關：`src/components/payments/PaymentsPageView.tsx`、`src/components/trials/TrialPreviewPanel.tsx`、`src/components/trials/TrialSessionsView.tsx`、`src/components/recordPreview/recordPreviewContext.tsx`、`src/components/recordPreview/RecordPreviewRail.tsx`。工作樹另有無關改動（skills、`dist/`、`docs/generated/**`、WhatsApp、老師查詢），不要動、不要還原、不要一併提交 |

## 目標

- 試堂紀錄右側預覽已可開。未收款時「前往收款」進 `/Payments?studentId&mode=receive&trialPay&classId`，應帶入該學生與該試堂。
- 使用者覺得轉跳後要很久才看到資料，並說加快之後仍然不明顯。本會話量過一次，原因未查完。新會話只繼續查「轉跳後載入久」的原因。

## 已完成

- 試堂列可開預覽（桌面 admin／alien 用右側欄；其餘用對話框）。備註可按「—」再輸入儲存。收款區只留「繳費狀態」：已收款（已在點名紙）／未收款；未收款旁有「前往收款」。沒有「可否上紙」，頁尾沒有第二個收款按鈕。
- 收款頁已有一條未驗證完的快路徑：`getStudentById` 先放入學生；`getClassById` 併入 `trialClasses`；`fillTrialPrefLines` 在班價已在記憶體時先填試堂列；收費區改為 `enrollLoading && lines.length === 0` 才顯示「載入報讀班別中」。`TrialClassPicker` 在所選班已在清單時不再因全庫載入而停用。
- 已用登入中的 `http://localhost:5174` 量過（production `gudmbilboyhouotilrvt`，瀏覽器在香港，庫在東京）。不要把空的 performance buffer 當成沒有請求。
- 單次查詢：一位學生約 0.6–1.8 秒，一班約 0.6–1.9 秒，全部學生約 3 秒（536 列），全部班別約 1.3–2.2 秒（147 班）。資料庫裡 `students select *` 約 29 毫秒。慢在瀏覽器往返與頁面串接，不是單條 SQL。
- 轉跳後：約 8 秒網址已變成 `/Payments?mode=receive`（預填已套用並清掉參數），學生欄已有值，正文仍有「載入」。約 17 秒仍是「載入報讀班別中」，試堂班別輸入框不在畫面上。第一輪約 45 秒那些「載入」才消失。改了 `fillTrialPrefLines` 之後再測，17 秒時仍是「載入報讀班別中」「載入學生收款上下文」，試堂班別欄仍未出現。收尾前分頁已回到 `/TrialSessions`，沒有量到第二輪結束秒數。

## 未完成／卡住

- 未證明 17 秒時班價為何還沒進 `trialClasses`。`fillTrialPrefLines` 只有班已在 `trialClassesRef` 才會 `setLines`，所以這次改動沒有讓試堂列提早出現。
- `loadEnrollments` 先 `await fetchEnrollmentsForStudent`，之後才看班價是否齊全。缺班價的提早返回在這個 await 之後。`enrollLoading` 要等最新一代做完才關掉；`loadEnrollments` 依賴 `students`，先放入一位學生再換上全名單會重跑。
- 學生選定後同時跑 `loadEnrollments`、`loadStudentContext`（近期收款、`fetchStudentCurrentYearLessonStats`，然後 `fetchTuitionChaseForStudent` → `fetchTuitionChaseList`）、逾期罰款、是否新生、親屬。`getClassById` 用完整 `CLASS_ROW_SELECT`。`loadBasics` 一進頁就 `fetchAllStudents()`。
- 抽樣那筆進行中試堂的報讀查詢是 0 列，試堂列只能靠網址預填，不能靠已有報讀。
- 未跑 `build`／`lint`。`tsc -b` 只見過既有錯誤 `src/services/teacherQueries.ts` 第 241 行，不是這次收款改動引入。瀏覽器流程未再驗一輪。

## 下一步（給新會話）

1. 讀本檔，然後只追 `PaymentsPageView` 轉跳後的載入閘：何時 `setLines`、何時 `enrollLoading` 維持 true、`getClassById`／`fetchClassesForOpsList`／`fillTrialPrefLines` 是否在 17 秒內跑完。先解釋畫面為何仍停在「載入報讀班別中」，不要先改 UI。
2. 對照 `loadEnrollments`（約第 651 行起）、選定學生的 effect（約第 922 行）、`loadStudentContext`（約第 849 行）、`loadBasics`（約第 528 行）。確認全名單學生更新會不會把報讀載入重新打開，以及缺班價時是否仍在等 `fetchEnrollmentsForStudent`。
3. 原因寫清楚之後才改。目標是試堂班別與類型在班價回到後就顯示，不等全部學生、全部班別、學費追收。不要為了交差改假資料。

## 開局必讀（精簡）

- `AGENTS.md`
- `src/components/payments/PaymentsPageView.tsx`
- `src/lib/paymentsReceiveHref.ts`、`src/services/classQueries.ts` 的 `getClassById`、`src/services/tuitionChaseQueries.ts` 的 `fetchTuitionChaseForStudent`

## 勿再踩

- 無 service role。`.env` 只有 anon。未帶使用者 JWT 的 REST 會 401，空陣列不代表沒有資料。不要印出 token、學生姓名、收據編號。
- `linkedClassIdsRef` 只在收款頁第一次 render 從 `classId` 讀一次。從試堂用客戶端路由進來會重新掛載，看得到參數；已經在 `/Payments?mode=receive` 時再 `location.assign` 帶參數，若元件沒有卸載，ref 仍是空的。
- 使用者規則預設不要開 Browser MCP。上一則「你可以測試一次嗎」的授權不到新會話。要再量畫面秒數，先等該則訊息明確授權。
- 不要改 plan 檔，不要 commit，不要動 `dist/`、`docs/generated/**`、`BACKLOG.md`。

## 明確唔做

- 不重做試堂預覽、備註、繳費狀態文案。
- 不把空班、未繳仍在點名紙當成缺陷。
- 不在查完原因前再包一層「快取」或假名單。
