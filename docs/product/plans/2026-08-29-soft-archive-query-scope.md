# 軟封存與查詢收窄（2026-08-29）

> 狀態：**波次 1–2 已落地**（2026-08-29）；波次 3–7 未做  
> 分題：[`soft-archive-query-scope.md`](../topics/soft-archive-query-scope.md)  
> 政策：[`SOFT_ARCHIVE.md`](../../policies/academic/SOFT_ARCHIVE.md)

## 本波

| 波 | 內容 | 本輪 |
| --- | --- | --- |
| 1 | 政策文＋`listRetainedAcademicYearLabels`（ops／compliance） | 做 |
| 2 | 學生列表專用 query 排除已畢業＋窄 select＋橫幅；學號全庫；P1-6 請假／試堂 picker | 做 |
| 3–7 | 班別／排程窗、Inbox 分層、對帳標範圍、畢業 Confirm、索引 | 不做 |

## 紅線（不可破）

- 唔改 `fetchAllStudents()`／`fetchAllClasses()` 默認
- 學號 `nextStudentCode` 必須掃全庫（含已畢業）
- `getStudentById`／單據 id／點名舊日 bypass 列表窗
- 禁止用非活躍／非在讀自動封存
- 待處理請假／待補唔因年份窗消失（波次 4 先套窗）

## 波次 2 產品預設

- 學生管理：`fetchStudentsForOpsList({ includeGraduated })`；關「顯示已畢業生」時 SQL 排除
- 頂欄：「已隱藏 N 位已畢業生（資料仍在）｜顯示」
- 新增學號：`fetchNumericStudentCodes()`，唔用已過濾列表
- 請假／試堂新增 picker：窄欄 option API，預設排除已畢業
- Rollback：`localStorage.mgmt_soft_archive_queries = "0"`（波次 6 先做 UI）
