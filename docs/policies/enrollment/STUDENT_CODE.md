# 學生編號（student_code / 學號）生成指南

本檔說明「學號」的格式與**新學生編號的生成方法**，作為全專案的單一規範。
程式上的唯一真實來源為 `src/lib/studentCode.ts`，UI 與腳本一律呼叫該檔，不要各自重寫。

## 一、結論（TL;DR）

- 學號（`students.student_code`）是**純數字**字串，目前固定 **8 位**。
- **新學號 = 現有所有「純數字」學號的最大值 + 1**，並補零至 8 位。
- 舊資料庫的 `SNFNL****` 學號**不再使用**，僅保留在 `students.old_student_id` 供歷史對照。
- 新增學生時學號由系統**自動生成、唯讀**，使用者不可手動輸入。

## 二、現況資料（production，截至撰寫時）

- 學生總數 474 筆，`student_code` **全部為 8 位純數字**（0 筆 SNFNL）。
- 取值範圍：`20261483` ～ `20261956`（皆以 `2026` 起頭）。
- 463 筆有 `old_student_id`（對應舊 `SNFNL****`）。
- `2026` 為當初匯入批次的年份，屬**歷史前綴**；目前規則**不會**因年度重置，學號只是單純往上遞增（例如下一個為 `20261957`）。

## 三、生成方法（程式規則）

由 `src/lib/studentCode.ts` 提供：

- `nextStudentCode(existing)`：掃描傳入清單中所有**純數字**學號，取最大值 +1，補零至 `STUDENT_CODE_WIDTH`（8）位。清單為空時從 `00000001` 起算。
- `isNumericStudentCode(code)`：判斷是否為合法純數字學號。
- `STUDENT_CODE_WIDTH`：固定位數常數（目前 8）。

非數字／空值／任何舊格式（如 `SNFNL0123`）在計算最大值時一律忽略，因此舊碼不會干擾新號。

## 四、使用方式

1. 取得目前完整學生清單的學號（**必須含已畢業／軟封存學生**；勿用已過濾的日常列表）。
2. 呼叫 `nextStudentCode(rows)` 取得新號。
3. 寫入 `students.student_code`。
4. **務必處理唯一鍵衝突重試**：`student_code` 在 DB 有唯一索引（見下），多端同時新增可能撞號；撞號時重新抓最新全庫學號再算一次。

實作參考：`src/services/studentQueries.ts` 的 `allocateNextStudentCode`／`fetchNumericStudentCodes`——只選 `student_code`，唔經學生管理列表的已畢業過濾。

```ts
import { nextStudentCode } from "@/lib/studentCode"

const code = nextStudentCode(rows)
```

## 五、相關既有規則（供參考）

| 項目 | 位置 | 說明 |
| --- | --- | --- |
| 學號唯一索引 | `supabase/migrations/20260423113000_students_student_code_unique.sql` | 非空 `student_code` 必須唯一；空字串會被轉成 `null`。 |
| 舊學號欄位 | `supabase/migrations/20260602190000_students_old_student_id.sql` | 新增 `old_student_id`，保存舊系統 `SNFNL****`，**不參與**新編號。 |
| 重號／重複清理 | `supabase/migrations/20260422143000_cleanup_student_duplicates_and_codes.sql` | 早期針對 SNFNL 重號的一次性修正紀錄。 |
| 列表排序 | `src/components/students/StudentsListPage.tsx` 的 `studentCodeRank` | 以學號末段數字排序「最新學號」。 |

> 註：歷史匯入腳本（`scripts/import_2526_roster.py`）曾用過 `S-2526-IMP-*****` 暫時碼，僅為匯入過渡，**非**現行規則，勿沿用。

## 六、未來若要改規則

- **改變位數**：調整 `STUDENT_CODE_WIDTH`（注意與既有 8 位資料的相容性）。
- **改為年度前綴／年度重置**（例如每年從 `YYYY0001` 起算）：只需改 `nextStudentCode` 一處，UI 與腳本無需改動。
- 切勿在頁面或腳本內各自硬寫學號格式，務必集中於 `src/lib/studentCode.ts`。
