# 課堂／排程教材庫

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open`（idea；未開工） |
| 優先 | 低 |
| 範圍 | 教材與機密文件存 **Supabase Storage**；掛科目／班別／某一堂排程；老師可把指定教材推給另一位老師喺指定堂次使用 |
| 角色（暫定） | 上載／指派：老師＋行政以上；機密檔只限 admin／manager／finance／alien。權限跟當堂 `schedules.teacher_id`（含代堂） |
| 不含 | 另起一套獨立文件站、取代 OneDrive 做 Word 同版草稿、營運政策閱讀頁（見 [ops-docs-viewer.md](./ops-docs-viewer.md)）、家長／學生端派發 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 立案 | 2026-08-24：OneDrive 無法按班／科／堂劃權限；主管（例：Mark Yu）無法指定下屬（例：Liam Lai）某日教某份教材 |

## 結論

OneDrive 權限係資料夾／連結，對唔上系統已有嘅班、科目、排程。要做到「扣緊課堂」同「老師互推某日要用嘅教材」，**指派紀錄必須喺 Postgres**；檔案本體建議 **Supabase Storage**（private bucket + RLS），草稿可暫留 OneDrive，發佈先入系統。

**僅 idea；優先低，先不實作。** 而家未有科主任／下屬欄位；第一期可用「指派到某堂排程」而不必先建組織架構。

## 待決（開工前）

1. 第一期只做教材（老師可見）還是連行政機密櫃（分開 bucket）
2. 誰可指派：任何老師 vs 只限該班／該科任教 vs 日後先加主管關係
3. 指派生命週期：已讀／已用、代堂是否自動繼承、可否收回
4. 現有 OneDrive 遷移範圍（唔一次 dump 無掛鈎檔）
5. Storage 用量：Free 1 GB 多半唔夠，開工前確認是否已升 Pro

## 待做（摘要）

1. 產品拍板掛鈎層級（科／班／堂）與機密 vs 教材分界
2. Schema：檔案 metadata、掛鈎、指派（from／to／`schedule_id`／狀態）＋ Storage RLS
3. UI：上載、掛排程、推送；老師當日堂次同收件箱見到要教嘅檔
4. 唔做：獨立雲碟產品、老師互推機密人事檔

## 相關

- 營運文件閱讀（另一題，唔合併）：[ops-docs-viewer.md](./ops-docs-viewer.md)
- 排程／代堂：`schedules.teacher_id`、[`scheduleQueries.ts`](../../src/services/scheduleQueries.ts)
- 老師範圍：[`teacherScope.ts`](../../src/lib/teacherScope.ts)
- 角色：[`mgmtRole.ts`](../../src/lib/mgmtRole.ts)
