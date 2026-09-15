# 試堂邀請公開連結

| 欄位 | 值 |
| --- | --- |
| 狀態 | `in_progress` |
| 優先 | 中 |
| 範圍 | 既有學生一人一連結；公開選專科班／功課輔導班堂次；職員審核後建試堂；後台控管公開名單 |
| 不含 | 未建檔準學生、私人課程、家長自選試堂類型／人頭、繞過收款上紙 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) 進行中 |
| 盤點日期 | 2026-09-11 |
| 上次更新 | 2026-09-15 |

## 尚餘

- **界面調整**（職員活動頁體驗；公開問卷細節）— 公開頁選班改為展開最近堂次（每科最近 4 班、每班最近 4 堂），獨立選排程步已併入，**未關帳**

## 驗收筆記（2026-09-11）

後端（production SQL）已對測試生 `00000001`（S4）跑通：未勾選修不可交 BIO → 勾 `BIO` 後可交 BIO＋中文 → 核准建 2 筆 `trial_sessions`（`payment_id` 仍 null）。UI 人手驗仍可用既有 S6 開連結 `蕭馥鎣／20261552`（token 仍 `open`）。

## 結論

職員為**既有學生**產生專屬連結（WhatsApp／WeChat 話術），家長免登入瀏覽**同年級**的專科班與功課輔導班、選具體堂次（可多科一次提交）。提交後職員後台核准才寫入 `trial_sessions`。上點名紙仍走既有「收據確認已收款」閘口（雙閘）。

## 已定產品

- **對象**：僅 `students` 既有列
- **目錄**：`class_kind ∈ {group, homework}`；年級相符；不含私人課程
- **公開頁自動隱藏（在控管名單之上）**：
  - 就讀中人數 **超過 5 人**（≥ 6）的班別不出現
  - 該排程已有 **未取消** 試堂紀錄（`trial_sessions`）則該堂次不出現；班別因此沒有可選堂次則整班不出現
  - 學生在本學年（`academic_years.is_current`，現為 2627）**就讀中已報讀**的科目：同一產品線（專科班／功課輔導班）不再出現該科
- **公開名單控管（預設全部可出現）**：
  - 某一班可不納入（`classes.trial_invite_listed`，預設 true）
  - 某一堂排程可剔除（`schedules.trial_invite_excluded`，預設 false）
  - 職員頁 `/TrialInviteCatalog`；權限同 `students.enroll`
  - 控管頁只列出目前學年（`academic_years.is_current`）的專科班／功課輔導班
  - 清單欄：老師、班別、就讀中人數、學生名單、逢星期／時段；點姓名／班／老師開預覽
  - 每班可剔選納入；可多選後批量納入或剔走試堂資格；未來堂次在「堂次控管」對話框剔除
- **家長**：看堂次、一次勾選多科、各科選班時展開最近 4 堂、每科只顯示最近 4 個班別（每科一堂；連堂於核准時展開）、一次提交
- **高中（S4–S6）**：公開頁先多選「目前選修科目」；「本社有開設」＝目前學年有專科班（不問家長年級、不問該班是否納入試堂名單）；其後專科班目錄只顯示主科＋已選選修（功課輔導班仍可選）
- **雙閘**：① 職員核准 → 建 `trial_sessions`（預設免費試堂）；② 收款確認已收款 → 上點名紙
- **職員產連結**：選學生、產／複製連結、第一聯絡人 WhatsApp／WeChat 話術；審核佇列核准／駁回
- **權限**：`students.enroll`（同試堂紀錄）

## 已落（未合入）

- Migration 已套 production（含高中選修多選）
- 名單控管 migration：`20260911120000_trial_invite_catalog_controls.sql`、`20260911155300_trial_invite_catalog_class_only.sql`（公開目錄改為只看班別 listed）
- `/TrialInvite/:token`、`/TrialInviteCampaign`、`/TrialInviteCatalog`；流程＝S4+ 先選修 → 一次多選科目 → 各科選班並展開堂次 → 提交
- 選修「本社有開設」改為目前學年有專科班（物理／M2 不因家長年級或未納入試堂名單而落到「其他選修」）
- 公開目錄額外隱藏：就讀中 > 5 人的班別；該堂已有未取消試堂的排程；本學年已報讀同科
- 公開頁進度列／返回上一步／進度預覽（仍可能再調）
- WhatsApp／WeChat 話術改為免費試堂活動文案（名字／名字家長；專屬連結；完成試堂內三天內報讀減免 HKD100）

## 相關路徑

| 用途 | 路徑 |
| --- | --- |
| 活動／審核頁 | `/TrialInviteCampaign` |
| 公開名單控管 | `/TrialInviteCatalog` |
| 公開頁 | `/TrialInvite/:token` |
| Service | `src/services/trialInviteQueries.ts` |
| 公開流程 | `src/lib/trialInvitePublicFlow.ts` |
| Migration | `supabase/migrations/20260911023000_trial_invite_tokens.sql`、`20260911044100_trial_invite_senior_electives.sql`、`20260911120000_trial_invite_catalog_controls.sql`、`20260911155300_trial_invite_catalog_class_only.sql`、`20260911160000_trial_invite_set_classes_listed.sql`、`20260911163200_trial_invite_class_meeting_label.sql`、`20260912031200_trial_invite_elective_offered.sql`、`20260915143000_trial_invite_hide_full_and_occupied.sql`、`20260915143600_trial_invite_hide_enrolled_subjects.sql` |
| 類比 | 聯絡資料更新；家長報讀申請線條 |
