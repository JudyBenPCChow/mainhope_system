# Session HANDOFF：OneDrive 歷年科目回填（26SM 之前）

| 欄位 | 值 |
| --- | --- |
| 日期 | 2026-09-19 |
| 主題／backlog | `docs/product/topics/student-enrollment-history-sales.md`（`open`；回填是該題「冷層」的前置資料工程） |
| 分支／工作樹 | **未開分支、未 commit**。產物在 `/tmp/backfill/out/`（**會被清除**，見下） |
| 狀態 | 抽取 + 報告 + SQL 已生成；**dry-run 未跑、未寫入 production** |

## 目標

系統 26SM 才啟用，26SM 之前的報讀紀錄不在系統內。宣傳配對的「冷層」（曾讀本科）
需要這些歷史科目事實。用戶要求：**盡量有幾多填幾多**，接受來源不完整。

## 已完成

### 1. 來源盤點（五年）

`~/Library/CloudStorage/OneDrive-共用文件庫－MainHopeEducation/Main Hope Education - 文件/`

| 學年 | 檔案 | 可用？ |
| --- | --- | --- |
| 2021-22 | `過往學年資料/2021-22 Regular/Student & Class Info 2021-2022.xlsx` | ✗ 無科目欄 |
| 2022-23 | `過往學年資料/2022-23 Regular/Student & Class Info 2022-2023.xlsx` | ✗ 無科目欄 |
| 2023-24 | `過往學年資料/2023-24 Regular/Student & Class Info 2023-2024.xlsx` | ✓ |
| 2024-25 | `24-25 學年/Student & Class Info 2024-2025 (20241207）.xlsx` | ✓ |
| 2025-26 | `25-26學年/Student & Class Info 2025-2026 (20250801）.xlsx` | ✓ |

**用戶已拍板：只做 2023-26 三個乾淨年份**（2021-23 科目藏在每月繳費自由文字，唔做）。

已排除的來源（查證過，唔使再試）：
- `上堂紀錄`、`學費堂數紀錄` 分頁 = **空模板**（229 人得 5 格同 19 格有數）。
- `Enrollment` 分頁 = 同 `Student List` 同一批人，無新增覆蓋。
- `24-25 常規課程/`、`2526 功課輔導班/` 等資料夾 = 校歷／單張／行政，無學生科目名單。
- `25-26學年/【2526】課程及班別  學生名單.xlsx` = 有班別對學生，但**只有姓名無編號**，品質較低，未採用。

### 2. 抽取腳本

`scripts/import_onedrive_student_subjects.py`

產生四份產物（`--out-dir`，預設 `/tmp/mainhope-onedrive-import`）：

| 檔案 | 用途 |
| --- | --- |
| `onedrive_student_subjects_report.md` | 抽取報告（覆蓋率、科目分佈、未入表嘅嘢） |
| `onedrive_student_subjects_facts.csv` | 455 條事實，可直接開嚟核 |
| `onedrive_student_subjects_dry_run.sql` | **只核對，結尾 `rollback`** |
| `onedrive_student_subjects_import.sql` | 核完才跑，結尾 `commit` |

重建指令：

```bash
cd ~/Desktop/mainhope_system
python3 scripts/import_onedrive_student_subjects.py --out-dir /tmp/backfill/out
```

### 3. 抽取結果（未對 production）

**208 名學生、455 條事實**，106 名跨多個學年。

| 學年 | 真學生 | 有科目 | 事實 |
| --- | ---: | ---: | ---: |
| 2324 | 268 | 85 | 149 |
| 2425 | 370 | 139 | 208 |
| 2526 | 408 | 65 | 98 |

科目分佈：數學 149、英文 119、中文 96、功輔 31、生物 19、物理 18、綜合科學 11、化學 6、M2 5、企會財 1。

「有科目」偏低係**來源檔本身**限制（其餘多為 `inactive` 且科目格空白），唔係抽漏。

### 4. 用戶已拍板嘅三項

1. `Biochem`（4 人，2324）＝ **綜合科學（SCI）**
2. `百人`／`北區百人`（2526）＝ **英文科（ENG）**
3. `SNFNL0268` 跨年換人（2324 鄭蘊倩／2425 李卓楠）→ **整個人跳過**，已入 `EXCLUDED_STUDENT_CODES`

### 5. 資料模型（已定）

沿用 `public.legacy_student_subject_enrollments`（計劃書拍板句 9「不新建資料表」）：

- `period_start`／`period_end` ＝ 學年期間（例：`2023-09-01`–`2024-08-31`），因為兩欄皆 `not null`
- `source_system` ＝ `'onedrive_xlsx'`
- `source_student_ref` ＝ SNFNL 編號
- `source_subject_label` ＝ 原始格值（審計用）
- 逐學年一個 `legacy_import_batches`，可獨立退場

## 未完成／卡住

**dry-run 未跑。** 本機 `.env` 只有 anon key，而 production 對 anon 拒絕 `students`
（實測 HTTP 401 / `42501 permission denied for table students`）。所以配對率**未知**，
必須用 linked CLI 跑（見下一步）。

**未寫入任何嘢。** 未 commit、未開分支、未改 `BACKLOG.md`。

## 下一步（給新會話）

```bash
cd ~/Desktop/mainhope_system
python3 scripts/import_onedrive_student_subjects.py --out-dir /tmp/backfill/out   # 重建產物

npx supabase db query --linked --file /tmp/backfill/out/onedrive_student_subjects_dry_run.sql
```

睇 dry-run 回報的五個數：

| 欄位 | 期望 | 如果唔係 |
| --- | --- | --- |
| `old_student_id_coverage` | `with_old_student_id` 接近 474 | — |
| `duplicate_old_student_ids` | `[]` | 有重號就要人手決定 |
| `status_counts.matched` | 接近 455 | — |
| `status_counts.name_mismatch` | 少量 | **唔可以當 0 就衝**——逐條睇係邊個 |
| `status_counts.unmatched_old_student_id` | 少量 | 多過 ~10% 就要查係咪配對鍵又錯 |
| `will_skip_already_present` | 2526 有幾多條同 Notion 重疊 | — |

**核完、確認冇問題，才跑：**

```bash
npx supabase db query --linked --file /tmp/backfill/out/onedrive_student_subjects_import.sql
```

匯入 SQL 內建護欄：同學年內同一 `(student_id, subject_id)` 已存在就跳過
（避免同 2526 Notion 既有資料重複）。跑完會 select 返 `legacy_import_batches`。

## 開局必讀（精簡）

- `docs/policies/enrollment/STUDENT_CODE.md` ← **最緊要**，解釋點解唔可以用 `student_code`
- `docs/product/topics/student-enrollment-history-sales.md`（冷層要呢批資料嘅原因）
  - 註：同日的 [`2026-09-19-sales-scheme-merge-session.md`](./2026-09-19-sales-scheme-merge-session.md)
    在處理「新舊銷售回流方案衝突」（另有工作樹 `~/Desktop/mainhope_sales-followup`）。
    本回填只負責**資料**；方案最後用邊個口徑，以該會話結論為準。
- `docs/product/topics/student-enrollment-history-sales-consulting-review.md`
- `scripts/import_onedrive_student_subjects.py`
- `supabase/migrations/20260721163734_legacy_student_subject_enrollments.sql`（表結構）
- `scripts/import_legacy_student_subjects.py`（2526 Notion 匯入，**姓名配對**嘅前例）

## 勿再踩

1. **`SNFNL****` 唔係 `students.student_code`。** 後者而家係 8 位純數字
   （例：`20261483`）。SNFNL 在 **`students.old_student_id`**。
   一開始就係差啲 join 錯欄，整個 dry-run 會 100% 配唔到。
2. **`old_student_id` 無唯一索引。** SQL 用 lateral 聚合 `match_count`，
   `>1` 當 `ambiguous_old_student_id` 唔入。
3. **`Student No` 欄係位置公式**，跑滿 Excel 104 萬行，每行都有 `SNFNL####`。
   真學生要用「有無中文名」過濾。最初誤判為「1,048,575 名學生」。
4. **SNFNL 會漂。** 因為係位置公式，row 次序改過就換號——實測 2023-24 尾二兩位
   （0268/0269）下年換咗人。所以 SQL 除配對 code 外**同時核對姓名**，唔夾就唔入。
   五年重疊部分 99.3% 穩定。
5. **`openpyxl` 讀唔到**其中 4 個檔（stylesheet 驗證失敗）。腳本用 zip +
   ElementTree 自寫寬容讀取器，唔好改用 openpyxl。
6. **`/tmp` 產物會被清除。** 任何時候都可以用上面條 python 指令重建，
   唔好當 `/tmp/backfill/out/` 係長期存放。
7. **2526 有兩個來源。** production 已有 Notion 匯入（142 列、102 人，**姓名配對**），
   同本批（**編號配對**）互補——實測 Notion 缺 27 人。
   2526 唔可以照抄 Notion 期間（本檔快照日 2025-08-01，早過 Notion 期間起點）。

## 明確唔做

- **唔做 2021-22／2022-23**（無科目欄，用戶已拍板唔挖自由文字）。
- **唔做老師、報讀日期**——來源檔無，唔好造假欄位。
- **唔改** `students`、`subjects`、`isCollectableEnrollment`，**唔新建表**。
- **未經用戶確認唔好 commit／開 PR。**
- **唔好喺 feature 分支改** `docs/product/BACKLOG.md` 索引表。
- 唔好順手改 `scripts/import_legacy_student_subjects.py`（2526 Notion 前例，另有用途）。

## 相關決定（2026-09-19，用戶口頭拍板）

| 項 | 決定 |
| --- | --- |
| 來源範圍 | 只做 2023-26 三個乾淨年份 |
| 產出流程 | 先出報告表 → 用戶核 → 才出／跑 SQL |
| `Biochem` | ＝ 綜合科學 SCI |
| `百人`／`北區百人` | ＝ 英文 ENG |
| `SNFNL0268` | 跳過 |
| 資料表 | 沿用 `legacy_student_subject_enrollments` |
