# 軟封存與查詢收窄（2026-08-29）

> 狀態：**波次 1–2、4 已落地**（2026-08-29）；**下一波＝3** 班別／排程 picker；波次 5–7 未做  
> 分題：[`soft-archive-query-scope.md`](../topics/soft-archive-query-scope.md)  
> 政策：[`SOFT_ARCHIVE.md`](../../policies/academic/SOFT_ARCHIVE.md)

## 本波

| 波 | 內容 | 本輪 |
| --- | --- | --- |
| 1 | 政策文＋`listRetainedAcademicYearLabels`（ops／compliance） | 已落 |
| 2 | 學生列表專用 query 排除已畢業＋窄 select＋橫幅；學號全庫；P1-6 請假／試堂 picker | 已落 |
| 3 | 班別／排程日常營運窗＋「更舊學年」 | 未做 |
| 4 | Inbox 短窗；增退／試堂／請假管理跟 ops 窗；待處理請假／待補豁免年份窗 | 已落 |
| 5–7 | 對帳標範圍、畢業 Confirm、索引 | 不做 |

## 紅線（不可破）

- 唔改 `fetchAllStudents()`／`fetchAllClasses()` 默認
- 學號 `nextStudentCode` 必須掃全庫（含已畢業）
- `getStudentById`／單據 id／點名舊日 bypass 列表窗
- 禁止用非活躍／非在讀自動封存
- 待處理請假／待補唔因年份窗消失

## 波次 4 產品預設

- Inbox：維持約 30 日 lookback（`INBOX_LOOKBACK_DAYS`）；唔套 ops 窗；與增退管理頁分開
- 增退管理頁：未自選生效日起日時，預設 `effective_date` ≥ ops 窗最早 start；橫幅「顯示」後全量（仍受 500 筆上限）
- 試堂列表：未完成豁免年份窗；已完成／取消跟班別學年 ∈ ops 窗
- 請假管理：待處理／待補豁免年份窗；已完成／放棄跟班別學年 ∈ ops 窗；`?record=`／`?studentId=` bypass
- ops 窗：暑期目前學年含下一常規（例 `26SM` → 含 `2627`）
- Rollback：`localStorage.mgmt_soft_archive_queries = "0"`
