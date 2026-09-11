# 試堂邀請公開連結

| 欄位 | 值 |
| --- | --- |
| 狀態 | `in_progress` |
| 優先 | 中 |
| 範圍 | 既有學生一人一連結；公開選專科班／功課輔導班堂次；職員審核後建試堂 |
| 不含 | 未建檔準學生、私人課程、家長自選試堂類型／人頭、繞過收款上紙 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) 進行中 |
| 盤點日期 | 2026-09-11 |
| 上次更新 | 2026-09-11 |

## 尚餘

- **界面調整**（公開問卷進度／返回、文案與互動細節；職員活動頁體驗）— 後端與主流程已可用，**未關帳**
- 未 commit／未開 PR（工作區另有無關 dirty，勿混入）

## 驗收筆記（2026-09-11）

後端（production SQL）已對測試生 `00000001`（S4）跑通：未勾選修不可交 BIO → 勾 `BIO` 後可交 BIO＋中文 → 核准建 2 筆 `trial_sessions`（`payment_id` 仍 null）。UI 人手驗仍可用既有 S6 開連結 `蕭馥鎣／20261552`（token 仍 `open`）。

## 結論

職員為**既有學生**產生專屬連結（WhatsApp／WeChat 話術），家長免登入瀏覽**同年級**的專科班與功課輔導班、選具體堂次（可多科一次提交）。提交後職員後台核准才寫入 `trial_sessions`。上點名紙仍走既有「收據確認已收款」閘口（雙閘）。

## 已定產品

- **對象**：僅 `students` 既有列
- **目錄**：`class_kind ∈ {group, homework}`；年級相符；不含私人課程
- **家長**：看堂次、每科選一堂（連堂於核准時展開）、多科一次提交
- **高中（S4–S6）**：公開頁先多選「目前選修科目」；其後專科班目錄只顯示主科＋已選選修（功課輔導班仍可選）
- **雙閘**：① 職員核准 → 建 `trial_sessions`（預設免費試堂）；② 收款確認已收款 → 上點名紙
- **職員產連結**：選學生、產／複製連結、第一聯絡人 WhatsApp／WeChat 話術；審核佇列核准／駁回
- **權限**：`students.enroll`（同試堂紀錄）

## 已落（未合入）

- Migration 已套 production（含高中選修多選）
- `/TrialInvite/:token`、`/TrialInviteCampaign`；流程＝S4+ 先選修 → 科目 → 班別 → 排程
- 公開頁進度列／返回上一步／進度預覽（仍可能再調）

## 相關路徑

| 用途 | 路徑 |
| --- | --- |
| 活動／審核頁 | `/TrialInviteCampaign` |
| 公開頁 | `/TrialInvite/:token` |
| Service | `src/services/trialInviteQueries.ts` |
| Migration | `supabase/migrations/20260911023000_trial_invite_tokens.sql`、`20260911044100_trial_invite_senior_electives.sql` |
| 類比 | 聯絡資料更新；家長報讀申請線條 |
