# 軟封存與查詢收窄（負荷／歷史資料）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `done`（2026-08-29 波次 1–7 關帳。可選：結業預覽、舊生／行銷匯出入口 **不做**） |
| 優先 | 中（增長下先爆全撈頁；非即時擋營運） |
| 範圍 | 列表／報表預設少 load；窄欄位 select；永不 DELETE；已畢業≠停補（含技術債 P1-6） |
| 不含 | 物理搬 `archive_*` 表、停讀自動封存、完整校友／LTV 產品、ORM 全域 scope |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 計劃 | [`2026-08-29-soft-archive-query-scope.md`](../plans/2026-08-29-soft-archive-query-scope.md) · 設計：[`archive_cold_data_3e9934eb.plan.md`](/Users/hoiyingfan/.cursor/plans/archive_cold_data_3e9934eb.plan.md) |
| 政策 | [`SOFT_ARCHIVE.md`](../../policies/academic/SOFT_ARCHIVE.md) |
| 對抗 | [`audits/2026-08-01-soft-archive-adversarial.md`](../audits/2026-08-01-soft-archive-adversarial.md) |
| Canvas | `soft-archive-adversarial.canvas.tsx` · `growth-after-narrowing.canvas.tsx` |
| 相關已做 | 側欄未讀快取、學生詳情分頁懶載、營運總覽 KPI 先出（唔代替本主題） |
| 相關另題 | 營運總覽重整（KPI／fetch／手機；計糧快取後刀）→ [`mgmt-dashboard-overhaul.md`](./mgmt-dashboard-overhaul.md)；本主題收窄冷資料，唔代替該題；`listStudents` shim 刪除交 [`dead-surface-cleanup.md`](./dead-surface-cleanup.md) |

## 開工閘（agent 必讀）

開工前 check 對上一個工程是否完成。**未完成：停；提醒用戶必須完成後先可以開工。唔好當可續做。**

| 本波 | 對上一個工程 | 完成條件 |
| --- | --- | --- |
| 列表／picker／學年窗（含 P1-6、波次 5 對帳 KPI 範圍） | [`mgmt-dashboard-overhaul.md`](./mgmt-dashboard-overhaul.md) | **波次 2 已完成**（2026-08-23：總覽 summary fetch＋已確認 KPI 已落地）。重整**唔等**本題。閘已開。 |

兩邊都唔改共用 `fetchAllStudents()`／`listStudents()` 默認。總覽 fetch 未定稿就做軟封存，會雙重改 students／KPI 查詢。

## 業務定界（已確認）

- **封存學生**＝`academic_stage = 已畢業`（中學畢業）。**唔係**非活躍／停補一段（中一→中五再返仍係 `中學階段`）。
- **營運資料**：超過約兩個常規學年（連帶其間 `*SM`）預設唔 load。
- **永不 DELETE**；深連結／單據 id／「包含封存」仍可讀。
- **雙層窗**：日常營運窗（列表／教務）≠ 合規／財務匯出窗（庫內全量可查）。

## 學號（釐清）

- 學生 **UUID id** 永遠唯一、唔回收。
- **學號 `student_code`** 係 8 位遞增（max+1），見 [`STUDENT_CODE.md`](../STUDENT_CODE.md)。
- 實作時：`nextStudentCode`／max **必須掃全庫（含已畢業）**；唔可以只用過濾後列表。DB 已有唯一索引。

## 實作紅線（P0 · 對抗）

1. **禁止**改 `fetchAllStudents()`／`fetchAllClasses()` 默認＝已過濾；用列表專用 API；共用 picker 顯式傳參。
2. 學號計號全庫（見上）。
3. 深連結／id bypass：`getStudentById`、`Payments?studentId=`、繳費單 id、班別 id、點名舊日。
4. 禁止用非活躍／非在讀／「兩年無紀錄」自動封存。
5. **待處理豁免**：未完成請假／待補、pending 繳費／推薦回贈 — 唔因年份窗從待辦消失。
6. 對帳／Mgmt KPI 必須標示資料範圍（防數字靜默變靚）。

## 建議範圍（開工時）

| 波 | 內容 |
| --- | --- |
| 1 | 政策文＋`listRetainedAcademicYearLabels`（ops／compliance） |
| 2 | 學生列表 query 排除已畢業＋窄 select＋「已隱藏 N」橫幅（唔改共用 fetch 默認） |
| 3 | 班別／排程日常營運窗＋「更舊學年」 |
| 4 | 同類冷資料分層：Inbox 短窗；增退／試堂／請假管理跟 ops 窗；作廢單預設藏 |
| 5 | 營運對帳用 ops 窗；繳費匯出／核數用長窗／全庫 |
| 6 | 畢業 Confirm＋欠費／待補警示；feature flag rollback |
| 7 | 索引／EXPLAIN；回歸測（列表預設帶排除；id 路徑仍通） |
| 可選 | 結業預覽；舊生／行銷匯出入口（本期不做） |

### P1-6 合併範圍（2026-08-15）

全盤技術債檢視發現 `queries.listStudents()` 以 `select("*")` 全表讀學生，請假及試堂頁仍有呼叫。呢項同本題「列表／picker 查詢收窄」係同一工程，故不另開重複題。

實作時：

- 請假／試堂頁改用各自用途的學生 option service，只選必要欄位及必要狀態。
- 唔好直接把共用 `fetchAllStudents()`／`listStudents()` 默認改窄，避免破壞學號、深連結、核數等全庫語意。
- 完成 callers 遷移後，確認 `src/services/queries.ts` 及 `src/api/entities.ts` 無正式依賴；刪除殘 shim 交 [`dead-surface-cleanup.md`](./dead-surface-cleanup.md)。

## 日常運作預期（正確實作下）

| 流程 | 影響 |
| --- | --- |
| 點名／排程／本期收款／今學年報讀 | 低～正面 |
| 學生／班別列表 | 正面（更清） |
| 跨年未清補堂、舊單 dispute | 要「包含更舊」或單據連結；待處理須豁免 |
| Mgmt／對帳數字 | 可能變窄；必須標範圍 |

## 明確唔做

- 刪資料、搬 archive 表  
- 用活躍度自動封存  
- 第一波完整校友模組／GDPR 專案  
- 改共用 fetch 默認語意「圖方便」

## 現況摘要（2026-08-29 關帳）

- 波次 1：政策 [`SOFT_ARCHIVE.md`](../../policies/academic/SOFT_ARCHIVE.md)；`listRetainedAcademicYearLabels`（ops／compliance）。暑期目前學年含下一常規。
- 波次 2：`fetchStudentsForOpsList` 預設排除已畢業；學生管理橫幅；學號 `allocateNextStudentCode` 全庫；請假／試堂 picker 已停用 `listStudents()`。
- 波次 3：`fetchClassesForOpsList`；班別管理 ops 窗＋「顯示」更舊學年；新增排程／試堂／前台報讀／課室落度 picker 跟窗；`fetchAllClasses()` 默認未改（出席紀錄篩選／優惠配對仍全量）。
- 波次 4：Inbox 維持 30 日短窗；增退管理頁／試堂列表／請假管理跟 ops 窗；待處理請假／未完成試堂豁免年份窗；空白生效日／班別學年空白仍顯示；隱藏 count 失敗唔空表；深連結 id／學生仍 bypass。
- 波次 5：堂數對帳跟 ops 窗（待補／請假待安排豁免）；營運總覽 KPI／CSV 標日期＋對帳範圍；繳費紀錄預設 ops 窗＋藏作廢；「匯出全部（核數）」全庫。`fetchLessonBalancesForStudent` 未改。
- 波次 6：標已畢業前 Confirm（未清繳費／待補／請假／就讀中報讀；可強制＋audit）；改回中學階段＝undo；設定頁「日常名單收窄」開關（`localStorage.mgmt_soft_archive_queries`）。
- 波次 7：`students_academic_stage_idx`、`classes_academic_year_id_idx`；EXPLAIN 見計劃；回歸測列表收窄 vs id 全量。
- `fetchAllStudents()`／`getStudentById`／`fetchAllClasses()` 默認未改。
- 回滾：設定頁關閉收窄，或 `localStorage.mgmt_soft_archive_queries = "0"`。

## 待做（摘要）

本期範圍已關。可選（結業預覽、舊生／行銷匯出）不做。`queries.listStudents` shim 交 [`dead-surface-cleanup.md`](./dead-surface-cleanup.md)。

## 開工前讀

1. 本檔紅線  
2. 對抗報告  
3. 計劃（含審閱回覆 Q1–Q11）  
4. [`STUDENT_STATUS_CLASSIFICATION.md`](../../policies/enrollment/STUDENT_STATUS_CLASSIFICATION.md)、[`ACADEMIC_YEARS.md`](../../policies/academic/ACADEMIC_YEARS.md)、[`STUDENT_CODE.md`](../../policies/enrollment/STUDENT_CODE.md)
