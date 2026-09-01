# 班別詳情紀錄頁

| 欄位 | 值 |
| --- | --- |
| 狀態 | `in_progress`（2026-09-02 已拍板並開工） |
| 優先 | 中 |
| 範圍 | 班別管理 → 班別詳情完整頁：與學生同一套紀錄頁殼、分頁、先讀後編、未儲存、`?tab=`；流動裝置 sheet 頂列關閉 |
| 不含 | 預覽側板；排程／加堂／補回業務邏輯；老師詳情 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 立案 | 2026-09-02 |
| 用語 | 本分題以繁體書面語書寫。 |

## 開工閘

共用殼先從學生詳情抽出（見 [`student-detail-record-page.md`](./student-detail-record-page.md)）。無對上未完成工程擋路。

## 已拍板產品句（工程必須跟）

對齊學生詳情紀錄頁，僅業務欄位不同。

1. 通用入口預設「基本資料」。特定動作以 `?tab=` 深連結。
2. 私人課程完整頁保留「預約上堂」（主要）。小組課編輯在基本資料分頁，不放頁首。
3. 基本資料先讀後編；「編輯」才出現「儲存／取消」。私人課程只准改老師／學費。
4. 手機頂列＝班別名稱＋編碼＋關閉圖示。拖柄只是裝飾。
5. 切換分頁、關閉 sheet、返回、瀏覽器返回，同一套「儲存／放棄／取消」。
6. 每次切換用 `replace` 寫入 `?tab=`，保留其他 query。
7. 頁首與內容同一左邊界與 gutter；表單可窄、列表可寬。
8. 第一波頁首與分頁不 sticky。
9. 分頁順序：基本資料 → 學生名單 → 增退紀錄 → 排程。桌面純文字底線。手機 Select 顯示工作名稱。

## 共用殼

| 元件 | 檔 |
| --- | --- |
| 流動裝置頂列 | [`DetailLayerChrome`](../../../src/components/detail/DetailLayerChrome.tsx) |
| 桌面頁首 | [`RecordPageHeader`](../../../src/components/detail/RecordPageHeader.tsx) |
| 分頁列 | [`RecordPageTabs`](../../../src/components/detail/RecordPageTabs.tsx) |
| 先讀後編欄位 | [`RecordField`](../../../src/components/detail/RecordField.tsx) |
| 未儲存對話 | [`UnsavedChangesDialog`](../../../src/components/detail/UnsavedChangesDialog.tsx) |
| `?tab=` | [`classDetailTabs.ts`](../../../src/lib/classDetailTabs.ts)、[`detailTabSearch.ts`](../../../src/lib/detailTabSearch.ts) |

## 實作進度

| 波次 | 狀態 |
| --- | --- |
| 1 抽出共用殼並讓學生頁引用 | 進行中 |
| 2 班別頁首／分頁／`?tab=`／未儲存 | 進行中 |
| 3 基本資料先讀後編（小組全表；私人只老師／學費） | 進行中 |
