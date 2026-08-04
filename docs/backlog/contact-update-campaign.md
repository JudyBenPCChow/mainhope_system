# 聯絡資料自助更新（一次性活動）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `done` |
| 優先 | 中 |
| 範圍 | 現有學生一次性資料清理；admin／alien 營運 |
| 不含 | 前台指引精靈新生流程、家長 Portal 自助改、長期催促自動化 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 盤點日期 | 2026-07-30 |
| 上次更新 | 2026-08-04 |
| 執行窗 | **2026-08 下旬**（與 9 月課程招生及收費同步進行） |

## 結論

系統啟用約一個月，需**一次性**糾正家長／學生電話調亂與聯絡偏好。做法：為每位**既有學生**產生專屬連結（紙本 QR 或 WhatsApp 發 link），家長預填舊值核對後提交，**職員審核**再寫入。主入口：`/ContactUpdateCampaign`（admin／alien）；活動完結可收埋側欄。不放 FrontDeskWizard。

**營運節奏（2026-08-01 定）**：活動執行日期列為 **8 月下旬**；準備在招收 9 月課程學生及收費時**同步**派發／催交／審核，趁家長到場或繳費窗口一次核對聯絡資料。

通知按鈕跟「第一聯絡人」：偏好 WeChat → WeChat（複製文案），否則 WhatsApp（該人電話）。

## 已定產品

- **對象**：僅 `students` 既有列；不產生給未建檔人士
- **派發**：紙本 QR／列印連結，或 WhatsApp 發 link（號碼可能錯時以紙本／堂上為主）
- **公開表單可改**：第一聯絡人（學生／家長）；學生／家長電話＋區號；各自偏好通訊（WhatsApp／WeChat）；選 WeChat 時填對應 WeChat ID
- **公開表單不改**：WhatsApp 號碼欄、就讀學校；身份區只讀：姓名、學號、年級、學校
- **寫入**：提交 → 待審核 → 職員對照舊新核准 → RPC 更新 `students` 指定欄
- **防呆**：高熵 token、有效期 30 日、提交後鎖定；anon 不可直接 update `students`

## 已完成

- Schema／RPC：`contact_update_tokens` + `create`／`get`／`submit`／`approve`／`void`（migration `20260804120000_contact_update_tokens`，已套 production）
- 公開頁 `/ContactUpdate/:token`（Layout 外）
- 活動頁 `/ContactUpdateCampaign`（admin／alien）：篩選、批量產連結、打印一人一頁、CSV、WhatsApp／WeChat 通知、審核 diff
- 側欄「聯絡資料更新」
- 雙聯絡偏好欄位／表單／`resolvePrimaryMessagingTarget`（先前已完成）
- UI 沙盒保留：公開表單 prototype（路由下線）、`/prototype/ContactUpdateCampaign`

## 可選尾巴（未做）

- 學生詳情單人「產生／複製連結」
- 活動結束：側欄入口收埋或標已結束

## 不做首版

- 家長 Portal 內自助改聯絡
- 自動催促未回覆
- 塞入前台指引精靈
- 公開表單改學校／親屬關係等擴欄

## 相關路徑

| 用途 | 路徑 |
| --- | --- |
| 活動頁 | `/ContactUpdateCampaign` · `ContactUpdateCampaignView` |
| 公開頁 | `/ContactUpdate/:token` · `ContactUpdatePublicForm` |
| Service | `src/services/contactUpdateQueries.ts` |
| Migration | `supabase/migrations/20260804120000_contact_update_tokens.sql` |
| 沙盒 | `src/prototypes/contactUpdate/` |
| 類比 token 模式 | `front_desk_intake_sessions`／`/FrontDeskIntake/:token` |
