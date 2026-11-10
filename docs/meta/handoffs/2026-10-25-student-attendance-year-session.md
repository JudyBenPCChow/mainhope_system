# Session HANDOFF：學生詳情上課紀錄只先載入本學年

| 欄位 | 值 |
| --- | --- |
| 日期 | 2026-10-25 |
| 主題／backlog | 無分題。頁面分題 `docs/product/topics/student-detail-record-page.md` 未記這次收窄 |
| 分支／工作樹 | 目前在 `main`。上課紀錄改動**未提交**，只在這四個檔：`src/components/students/StudentAttendanceTab.tsx`、`src/lib/studentAttendanceTab.ts`、`src/lib/studentAttendanceTab.test.ts`、`src/services/studentQueries.ts`。工作樹另有無關改動，不要動、不要還原、不要一併提交 |

## 目標

- 學生詳細頁「上課紀錄」預設只顯示當下學年；其他學年須按「展示非本學年上堂紀錄」，再按學年列出。
- 2026-10-25 用戶已拍板**接受**這套分界，含「只有暑期紀錄時，主列表與上方統計為空」。

## 已完成

- 上述四檔已收窄查詢與畫面：`current` 只查本學年，`other` 才查其餘；查完用 `isAttendanceInCurrentAcademicYear` 收口。專科班、功課輔導班跟班別學年；私人課程跟出席日。無學年標籤的專科／功輔不算本學年，歸「未標學年」。
- 上一則所記驗證：`studentAttendanceTab.test.ts` 與 `studentPaymentYearSummary.test.ts` 共 21 項通過；`tsc -b` 通過；四檔 `eslint` 通過。本則未重跑。未在瀏覽器點選。
- 本則以 MainHope_production、截止 2026-10-25 模擬（未改碼）。庫內上課紀錄只有 `26SM` 與 `2627`。抽樣含蕭馥鎣（專科跨兩年）、楊茵喬與陳柏言（只有暑期，預設為空）、文覺瑩（私人按出席日）、曾穎與張晉愷（專科加私人）、黃逸勉（功輔僅本學年 1 筆）、朱震軒（只有本學年）。缺學年欄的 188 筆全是私人課程，不會出現「未標學年」。沒有更早學年可對。

## 未完成／卡住

- 四檔未提交、未開分支、未開 PR。
- 不要在 `main` 上直接提交。

## 下一步（給新會話）

1. 從目前 `main` 開新分支，**只提交**上面四個檔。提交說明寫明：上課紀錄預設只載入本學年，其餘按按鈕才載入。
2. 用戶未說開 PR 就不要 push。不要夾帶工作樹其他檔。

## 開局必讀（精簡）

- `AGENTS.md`
- `src/lib/studentAttendanceTab.ts` 的 `planStudentAttendanceFetch`、`src/services/studentQueries.ts` 的 `fetchAttendanceForStudent`
- `src/lib/studentPaymentYearSummary.ts` 的 `isAttendanceInCurrentAcademicYear`

## 勿再踩

- 不要改已拍板的分界：10 月預設不含 `26SM`；私人跟出席日；無學年標籤的專科／功輔不進預設。
- 只有暑期紀錄時主列表為空、統計為 0，是已接受的結果。不要改空狀態文案，也不要在按鈕上預先顯示筆數。
- 不要為了對到 `2526` 或「未標學年」而改規則；這次庫內沒有這類上課列。
- 根目錄 `tsc --noEmit` 不檢查 app。要用 `tsc -b`。
- 不要把全部上課紀錄查出後只在畫面藏起。

## 明確唔做

- 不要改請假、繳費、報讀分頁。
- 不要把這四個檔混進其他主題，或連同 `dist/`、`docs/generated/**`、skills、`docs/product/BACKLOG.md` 一併提交。
- 不要在提交對話裡再改分類行為。
