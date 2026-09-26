# 功輔學生每日紀錄（系統＋家長 Portal）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open` |
| 優先 | 中 |
| 範圍 | 功輔導師在系統填寫各生當日情況；家長於家長 Portal 唯讀查看；Schema／RLS／Storage；後台填寫 UI；Portal 列表頁 |
| 不含 | **匯入 Notion 歷史**；專科式點名紙／扣堂／補堂；紙本指示檔全文自動公開；練習資源庫遷移；計糧；改 `makeup_of=` |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 母題 | [`homework-tutoring.md`](./homework-tutoring.md)（產品已關帳；本題另開） |
| Portal | 前端在 `mainhope_portal`（見該 repo [`docs/BACKLOG.md`](../../../../mainhope_portal/docs/BACKLOG.md)） |
| 參考 | Notion 現行形式（每位學生一頁＋按日範本）；例：區智珩日誌頁 |
| 立案 | 2026-09-26：營運要系統內紀錄；不遷舊 Notion；家長 Portal 可見 |

## 一句

取代 Notion 的功輔「按日學生日誌」：老師在後台寫當日情況（上線日起新寫），家長在 Portal 只讀自己子女的紀錄。

## 開工閘

- 母題功輔產品已關帳；**本題不重開**報讀／月費／編更範圍。
- **未拍板「家長可見欄位」前不開工寫庫**（見下方待決）。
- Portal 前端與後台可同波或分 PR，但 **RLS 必須先於 Portal 上線**（家長只能讀自己 `student_id`）。
- 不擋：專科點名、非常規排程、計糧。

---

## 已定

| # | 決定 |
| --- | --- |
| D1 | **不匯入** Notion／紙本歷史；系統只保留上線後新寫紀錄。 |
| D2 | 寫入：功輔班導師（行政／管理層可代填／改正）。 |
| D3 | 讀取：已綁定該生的家長 Portal（`role=student`／`current_portal_student_id()`）。 |
| D4 | **不是**專科點名紙；不做扣堂／補堂；與 Portal「出席紀錄」分開入口與文案。 |
| D5 | 對齊 Notion 當日範本欄位（見下表）；名冊來源＝功輔在籍＋慣常到校星期（沿用現有「今日情況」邏輯）。 |
| D6 | 儲存即對該生 Portal 可見（首版不做「草稿／發佈」）。 |

### Notion → 系統欄位對照（當日）

| Notion | 建議欄位 | 家長可見（待決見下） |
| --- | --- | --- |
| 負責老師 | `teacher_id`（可預填當日編更） | 是（顯示姓名） |
| 到達／離開時間 | `arrived_at`／`left_at` | 是 |
| 已上足 2 小時＋原因 | `full_two_hours`＋`hours_note` | 是 |
| 已完成功課＋欠什麼 | `homework_done`＋`homework_owed` | 是 |
| 默測／溫習狀態 | `has_dictation`＋`revision_note` | 是 |
| 手冊相片／無手冊／無功課 | Storage 路徑＋`handbook_status` | 是（圖） |
| 備註 | `remarks` 及／或 `staff_only_note` | **待決** |

唯一鍵：`(student_id, log_date)`。

---

## 待決（擋開工）

| # | 問題 | 選項 |
| --- | --- | --- |
| O1 | 備註／欠功課字句 | **(A)** 老師所填全文家長可見；**(B)** 「家長可見」＋「僅職員」兩欄（SEN／家長敏感指示走職員欄） |
| O2 | 常設「指示檔」正文 | 首波 **不做**／另欄僅職員／另題 |

預設建議：**O1＝B**（安全）；**O2＝首波不做**（紙本／Notion 指示檔暫留，直到職員欄夠用再遷）。

---

## 工程波次（計畫；未開工）

### 波次 1 — Schema（`mainhope_system`）

1. 新表 `homework_student_day_logs`（上表欄位＋`created_by`／`updated_at`）。
2. Storage bucket（手冊圖）；路徑綁 `student_id`＋日期。
3. RLS：職員寫；Portal **只 SELECT 自己學生**；職員內部欄位不對 Portal 暴露（view 或欄位級政策）。
4. 單檔 migration 套用；唔做 Notion import script。

### 波次 2 — 後台填寫 UI

1. 功輔側欄「今日情況」：今日應到名冊 → 每位快捷表單／儲存。
2. 學生時間軸（行政／老師回看該生）。
3. 更新設定頁文案：每日進度改由系統，不再寫「繼續用 Notion」。

### 波次 3 — 家長 Portal（`mainhope_portal`）

1. 新頁「功輔紀錄」（名稱可再定）；與「出席」並列、文案分開。
2. 只列該生、上線後有列的日子；空狀態說明「老師填寫後會顯示」。
3. 顯示家長可見欄位與手冊圖；不顯示職員欄。

### 波次 4 — 文件收尾（發佈時）

1. 改 `docs/year/2627/ops-guide.md`：每日進度改系統（只 md）。
2. 母題 [`homework-tutoring.md`](./homework-tutoring.md)「每日功課進度」改指向本題已上線。
3. Portal README／HANDOFF 補一頁說明。

---

## 驗收（上線後）

- [ ] 老師為今日應到生寫一列 → Portal 同日可見。
- [ ] 家長 A 看不到學生 B 的列。
- [ ] 職員欄（若 O1＝B）Portal 讀不到。
- [ ] 庫內無 Notion 匯入列；舊 Notion 可繼續唯讀封存、系統不鏡像。
- [ ] 文案無「點名／扣堂」誤導。

---

## 不做

- 遷移或同步舊 Notion 頁、相片、checkbox 曆。
- 功輔專科式點名紙、請假五步驟、補堂。
- WhatsApp 自動推送當日紀錄（可後補）。
- 多子女 Portal 綁定（另題 `multi-child-portal`）。
