# 軟封存與查詢收窄（負荷／歷史資料）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open`（稍後開工；設計＋對抗已齊） |
| 優先 | 中（增長下先爆全撈頁；非即時擋營運） |
| 範圍 | 列表／報表預設少 load；永不 DELETE；已畢業≠停補 |
| 不含 | 物理搬 `archive_*` 表、停讀自動封存、完整校友／LTV 產品、ORM 全域 scope |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 計劃 | Cursor：[`archive_cold_data_3e9934eb.plan.md`](/Users/hoiyingfan/.cursor/plans/archive_cold_data_3e9934eb.plan.md) |
| 對抗 | [`audits/2026-08-01-soft-archive-adversarial.md`](../audits/2026-08-01-soft-archive-adversarial.md) |
| Canvas | `soft-archive-adversarial.canvas.tsx` · `growth-after-narrowing.canvas.tsx` |
| 相關已做 | 側欄未讀快取、學生詳情分頁懶載、營運總覽 KPI 先出（唔代替本主題） |
| 相關另題 | 計糧／營運總覽載入偏慢（重複查詢／live 重算／按需載）→ [`page-load-perf-payroll-mgmt.md`](./page-load-perf-payroll-mgmt.md)；本主題收窄冷資料，唔代替該題 |

## 業務定界（已確認）

- **封存學生**＝`academic_stage = 已畢業`（中學畢業）。**唔係**非活躍／停補一段（中一→中五再返仍係 `中學階段`）。
- **營運資料**：超過約兩個正規學年（連帶其間 `*SM`）預設唔 load。
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
| 可選 | 結業預覽；舊生／行銷匯出入口 |

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

## 開工前讀

1. 本檔紅線  
2. 對抗報告  
3. 計劃（含審閱回覆 Q1–Q11）  
4. [`STUDENT_STATUS_CLASSIFICATION.md`](../STUDENT_STATUS_CLASSIFICATION.md)、[`ACADEMIC_YEARS.md`](../ACADEMIC_YEARS.md)、[`STUDENT_CODE.md`](../STUDENT_CODE.md)
