# UI 指引收斂（餘項）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open` |
| 優先 | 低 |
| 範圍 | 對齊 [`UI_DESIGN_INSTRUCTIONS.md`](../../meta/UI_DESIGN_INSTRUCTIONS.md) 其餘未改項；**唔改**收款／點名／報讀業務邏輯 |
| 不含 | 已落地之衛生修（`role="alert"`、token 色、專長科目共用常數、狀態 Tag 字典、失敗上報）；登入失敗不上報（刻意） |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 來源 | 2026-08-31 UI 指引盤點；安全項已先改 |

## 開工閘

無對上工程。各項可獨立做；**月費入口**未拍板唔改流程。

## 已落（今輪，備查）

- 錯誤區塊補 `role="alert"`；失敗補 `reportUserFacingError`（登入除外）
- 老師專長科目抽 [`teacherSubjectSpeciality.ts`](../../src/lib/teacherSubjectSpeciality.ts)；個人資料已選科目改 `Tag`
- 點名「未點名／已點名」、老師首頁請假／補堂／試堂走 `statusToTagTone`；字典補「請假」「補堂」
- 業務頁 teal／rose／emerald／slate 改 token（課室、收件匣、增退、約房圖示、老師詳情卡等）
- 學生詳情改報讀狀態加 `try/catch`；若干儲存鈕改 `Button loading`

## 待做

| 優先 | 項 | 說明 | 風險 |
| --- | --- | --- | --- |
| 中 | Select 清掉舊 `h-9 rounded-md border…` | 共用 Select 已 `min-h-10`／`rounded-xl`；多頁仍傳原生 select 殘 class | 篩選列可能提早換行；**唔改選中值** |
| 中 | 桌面列表殼 §16 | 試堂／請假／繳費紀錄／課程／老師尚未用 `SortableColumnHeader`／`HeaderFilterButton`／`BulkSelectionBar` | 等於重做列表互動；須保留 chips／FilterSheet |
| 中 | 月費頁 vs 收款單一入口 §15 | `/MonthlyTuition` 內嵌出單表單；錢已入 `payments` | **改流程要產品拍板**；唔好當 UI 修拆表單 |
| 低 | 其餘 `disabled={saving}` 改 `loading` | 今輪只改老師／月費／設定 | 等價行為 |
| 低 | 印刷／收據／阿Po hex | 聯絡單 CSS、收據紙底、聊天氣泡品牌藍 | 印刷色準／品牌；勿盲換 token |
| 低 | 班別卡裝飾漸層 | `ClassesListPage` 多彩 gradient 用來分班，唔係語意色 | 改 token 會令班卡撞色 |
| 低 | Overlay `bg-slate-950/45` | `DetailLayerShell`／點名紙遮罩 | 共用殼；可改 `black/35` 但非必須 |
| 低 | 原型頁 | `src/prototypes/` 唔入 `ui:check` | 正式 Layout 未拍板前唔跟 |

## 相關

- 規範：[`UI_DESIGN_INSTRUCTIONS.md`](../../meta/UI_DESIGN_INSTRUCTIONS.md) §1–2、§9、§12、§14–16
- 流動觸控：[`mobile-ui.md`](./mobile-ui.md)
