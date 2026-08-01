# 聯絡資料自助更新（一次性活動）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open` |
| 優先 | 中 |
| 範圍 | 現有學生一次性資料清理；admin／alien 營運 |
| 不含 | 前台指引精靈新生流程、家長 Portal 自助改、長期催促自動化 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 盤點日期 | 2026-07-30 |
| 上次更新 | 2026-08-01 |
| 執行窗 | **2026-08 下旬**（與 9 月課程招生及收費同步進行） |

## 結論

系統啟用約一個月，需**一次性**糾正家長／學生電話調亂與聯絡偏好。做法：為每位**既有學生**產生專屬連結（紙本 QR 或 WhatsApp 發 link），家長預填舊值核對後提交，**職員審核**再寫入。主入口做**短期批量活動頁**（建議 `/ContactUpdateCampaign`）；活動完結可收埋側欄。不放 FrontDeskWizard。

**營運節奏（2026-08-01 定）**：活動執行日期列為 **8 月下旬**；準備在招收 9 月課程學生及收費時**同步**派發／催交／審核，趁家長到場或繳費窗口一次核對聯絡資料。工程需在該窗前就緒（token／公開頁／批量活動頁）。

通知按鈕改跟「第一聯絡人」：偏好 WeChat → WeChat（複製 ID），否則 WhatsApp（該人電話）。不再使用獨立「WhatsApp 號碼」欄作為發送優先。

## 已定產品

- **對象**：僅 `students` 既有列；不產生給未建檔人士
- **派發**：紙本 QR／列印連結，或 WhatsApp 發 link（號碼可能錯時以紙本／堂上為主）
- **公開表單可改**：第一聯絡人（學生／家長）；學生／家長電話＋區號；各自偏好通訊（WhatsApp／WeChat）；選 WeChat 時填對應 WeChat ID
- **公開表單不改**：WhatsApp 號碼欄、就讀學校；身份區只讀：姓名、學號、年級、學校
- **寫入**：提交 → 待審核 → 職員對照舊新核准 → `updateStudent` 指定欄
- **防呆**：高熵 token、有效期、提交後失效；anon 不可直接 update `students`

## 已完成

- UI 沙盒：原 [`/prototype/ContactUpdate`](../../src/pages/PrototypeContactUpdate.tsx) **路由已下線**；原始碼**暫緩勿刪**（欄位／流程藍本；見 [dead-surface-cleanup](./dead-surface-cleanup.md) D2a）
- Schema：`student_preferred_contact_method`、`parent_preferred_contact_method`、`student_wechat_id`、`parent_wechat_id`、`primary_contact_person`（migration `20260729233000_students_dual_contact_preference`，已套 production）
- 學生詳情／新增學生／前台 intake 表單已對齊新欄；已移除「WhatsApp 號碼」編輯欄
- 聯絡解析：[`whatsappReminder.ts`](../../src/lib/whatsappReminder.ts) `resolvePrimaryMessagingTarget`；列表／提醒按鈕跟第一聯絡人

## 待做

1. 表 `contact_update_tokens` + RPC：`create`（職員）／`get`／`submit`（anon）／`approve`／`void`（職員）
2. 正式公開頁 `/ContactUpdate/:token`（對齊沙盒欄位；預填舊值）
3. 批量活動頁：篩選現有學生、批量產生連結、CSV 匯出、狀態（未交／待審核／已核准／過期）、審核 diff 寫入
4. （可選尾巴）學生詳情單人「產生／複製連結」
5. 活動結束：側欄入口收埋或標已結束

## 不做首版

- 家長 Portal 內自助改聯絡
- 自動催促未回覆
- 塞入前台指引精靈
- 公開表單改學校／親屬關係等擴欄

## 風險

- 連結外洩可改該生草稿（審核可擋寫入）
- 用錯電話發 WhatsApp 會發錯人
- 家長仍可能把兩支電話填反 → 審核列表要顯示 diff
- 核准後通知改去新號碼／WeChat

## 相關路徑

| 用途 | 路徑 |
| --- | --- |
| 沙盒 UI | `src/prototypes/contactUpdate/`、`src/pages/PrototypeContactUpdate.tsx` |
| Migration | `supabase/migrations/20260729233000_students_dual_contact_preference.sql` |
| 學生表單 | `StudentDetailView`、`StudentsListPage`、`StudentIntakeFormFields` |
| 通知解析 | `src/lib/whatsappReminder.ts` |
| 類比 token 模式 | `front_desk_intake_sessions`／`/FrontDeskIntake/:token` |
