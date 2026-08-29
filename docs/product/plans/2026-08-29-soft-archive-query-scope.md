# 軟封存與查詢收窄（2026-08-29）

> 狀態：**波次 1–7 已落地並關帳**（2026-08-29）  
> 分題：[`soft-archive-query-scope.md`](../topics/soft-archive-query-scope.md)  
> 政策：[`SOFT_ARCHIVE.md`](../../policies/academic/SOFT_ARCHIVE.md)

## 本波

| 波 | 內容 | 本輪 |
| --- | --- | --- |
| 1 | 政策文＋`listRetainedAcademicYearLabels`（ops／compliance） | 已落 |
| 2 | 學生列表專用 query 排除已畢業＋窄 select＋橫幅；學號全庫；P1-6 請假／試堂 picker | 已落 |
| 3 | 班別／排程日常營運窗＋「更舊學年」 | 已落 |
| 4 | Inbox 短窗；增退／試堂／請假管理跟 ops 窗；待處理請假／待補豁免年份窗 | 已落 |
| 5 | 對帳標範圍；堂數對帳跟 ops 窗；繳費列表預設窗＋作廢隱藏；匯出／核數全庫 | 已落 |
| 6 | 畢業 Confirm＋欠費／待補警示；設定頁 feature flag | 已落 |
| 7 | 索引／EXPLAIN；回歸測 | 已落 |

可選（結業預覽、舊生／行銷匯出入口）本期不做。`listStudents` shim 交 dead-surface-cleanup。

## 紅線（不可破）

- 唔改 `fetchAllStudents()`／`fetchAllClasses()` 默認
- 學號 `nextStudentCode` 必須掃全庫（含已畢業）
- `getStudentById`／單據 id／點名舊日 bypass 列表窗
- 禁止用非活躍／非在讀自動封存
- 待處理請假／待補唔因年份窗消失

## 波次 6 產品預設

- 學生詳情儲存：學業階段改為「已畢業」前查未清繳費（待繳費／待收款）、待補／已安排補堂、未處理請假、就讀中報讀。無警示＝一次確認；有警示＝須輸入「強制畢業」＋稽核（非硬擋）
- 改回「中學階段」＝undo，一次確認＋稽核
- 新增學生直接標已畢業：一次確認
- 設定頁（行政／管理層／財務／外星人）：「日常名單收窄」開關；關閉須確認並重整本機。`localStorage.mgmt_soft_archive_queries`：缺省／`"1"`＝開；`"0"`／`"false"`＝關＝全量

## 波次 7 索引／EXPLAIN（production 2026-08-29）

Migration `20260829092032_soft_archive_list_indexes.sql`：

- `students_academic_stage_idx` on `students(academic_stage)`
- `classes_academic_year_id_idx` on `classes(academic_year_id)`

| Query | Plan（現況） |
| --- | --- |
| `students.academic_stage = '已畢業'`（隱藏人數） | **Index Scan** `students_academic_stage_idx` |
| `students.academic_stage <> '已畢業'` 列表 | Seq Scan（大多數列符合，合理） |
| `classes.academic_year_id IN (ops窗) OR IS NULL` | Seq Scan（表細；`OR NULL` 不利用索引） |
| `classes.academic_year_id IN (ops窗)`（無 NULL） | Hash Join；表細時 Seq Scan 班別主表 |

回歸測：`src/services/softArchiveQueryContracts.test.ts`（列表 API 用 flag／排除；`getStudentById`／`getClassById`／`fetchAll*` 唔套窗）。

## 波次 5 產品預設

- 堂數對帳：預設班別學年 ∈ ops 窗或空白；待補／請假待安排豁免年份窗；已畢業無待辦則隱藏；橫幅「顯示」後全量就讀中報讀。學生詳情報讀對帳唔套列表窗
- 營運總覽：KPI／走勢跟所選日期（毛利分析自 2026-07）；堂數不符跟 ops 窗；畫面＋CSV 標資料範圍。**唔**用日常窗做年結
- 繳費紀錄：未自選日期／學生時預設收款日 ∈ ops 窗（空白收款日＋待收款／待繳費一併保留）；作廢單預設藏；`?studentId=` bypass 日期窗。橫幅「顯示」後含更舊同作廢
- 匯出：本頁篩選 CSV；「匯出全部（核數）」唔受日常窗硬上限（可含作廢）
- `fetchAllStudents()`／`fetchAllClasses()` 默認不改；出席紀錄／優惠配對仍全量

## 波次 4 產品預設

- Inbox：維持約 30 日 lookback（`INBOX_LOOKBACK_DAYS`）；唔套 ops 窗；與增退管理頁分開
- 增退管理頁：未自選生效日起日時，預設 `effective_date` ≥ ops 窗最早 start（空白生效日一併保留）；橫幅「顯示」後全量（仍受 500 筆上限）
- 試堂列表：未完成豁免年份窗；已完成／取消跟班別學年 ∈ ops 窗（班別學年空白仍顯示）
- 請假管理：待處理／待補豁免年份窗；已完成／放棄跟班別學年 ∈ ops 窗（班別學年空白仍顯示）；`?record=`／`?studentId=` bypass
- 隱藏筆數：相減得出；count 失敗當 0，唔因 PostgREST 拒 query 而空表
- ops 窗：暑期目前學年含下一常規（例 `26SM` → 含 `2627`）
- Rollback：`localStorage.mgmt_soft_archive_queries = "0"`

## 波次 3 產品預設

- 班別管理：預設 `academic_year_id` ∈ ops 窗或空白；橫幅「顯示」後全量並切到「已載入學年」；學年下拉選到窗外學年時自動載入更舊
- 新增排程／試堂／前台報讀／課室落度／收款試堂班別 picker：跟 ops 窗
- 排程日曆：維持按所選日期範圍（舊日點名深連結仍通）；唔用班別學年窗藏舊日
- `fetchAllClasses()` 默認不改；出席紀錄班別篩選、優惠配對仍全量
- 課室預訂「我的班」改 `fetchClassesByTeacherId`（老師自己嘅班，含舊年）
