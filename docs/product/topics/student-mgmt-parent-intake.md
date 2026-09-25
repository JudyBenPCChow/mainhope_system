# 學生管理：家長連結自填＋收件匣確認

| 欄位 | 值 |
| --- | --- |
| 狀態 | `done` |
| 優先 | 中 |
| 範圍 | 學生管理「新增學生」家長連結；提交進收件匣；前台核對後建檔 |
| 不含 | 廣告潛在客戶／試堂邀請連結、聯絡資料自助更新（既有學生） |
| 索引 | [`BACKLOG.md`](../BACKLOG.md)（合入 `main` 後搬列） |
| 上次更新 | 2026-09-25 |

## 開工閘

無阻擋。沿用既有 `front_desk_intake_sessions`／`/FrontDeskIntake/:token`；前台指引精靈已有同模家長連結，本題把同一能力接到「學生管理 → 新增學生」，並在家長提交時寫入收件匣。

## 產品

1. **學生管理 → 新增學生**：可選「前台填寫」或「家長連結填寫」（與前台指引精靈同模）。
2. 職員產生連結 → 家長於公開頁自填 → 提交後狀態 `submitted`。
3. **收件匣（營運）**出現「家長已提交新生資料」；動作路徑開學生管理並帶 `intakeToken`，前台核對後建立學生並 `consume`。
4. 老師收件匣看不到（無 `class_id`／無 `audience_teacher_ids`）。

## 工程步驟

- [x] Migration：inbox 類型 `student_intake_submitted`；`front_desk_intake_submit` 首次提交寫入收件匣（`20260925132000`，已套 production）
- [x] UI：新增學生對話框家長連結模式；URL `?intakeToken=` 還原審核
- [x] 收件匣類型標籤／篩選
- [x] build 通過

## 真源

- Session／RPC：`front_desk_intake_*`（`supabase/migrations/20260719120000_…`；inbox 寫入見 `20260925132000_student_intake_inbox.sql`）
- 公開頁：`/FrontDeskIntake/:token`
- 學生管理：`AddStudentDialog`／`ParentIntakeLinkPanel`
- 前台精靈：`RegisterStudentStep`（共用連結面板）
