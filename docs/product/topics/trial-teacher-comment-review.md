# 試堂後老師評語：審閱與優化建議

| 欄位 | 值 |
| --- | --- |
| 性質 | 設計審閱（基於 `trial-teacher-comment.md` 與現有系統對齊） |
| 狀態 | `done`（2026-10-23 已併入主方案；採納／不採納見主檔） |
| 範圍 | 點名後短頁、老師首頁待辦、`/TrialSessions` 顯示、schema、權限、稽核 |
| 不含 | 改變「本期不做」的銷售工作台、自動寄信、下次聯絡日等範圍 |
| 對照 | [`trial-teacher-comment.md`](./trial-teacher-comment.md)（定案真源）、[`trial-sessions-page-review.md`](./trial-sessions-page-review.md)、[`trial-sessions.md`](./trial-sessions.md) |
| 立案 | 2026-10-23 |

開工以 [`trial-teacher-comment.md`](./trial-teacher-comment.md) 為準。本檔保留審閱理由；與主檔衝突者以主檔「對兩份審閱」為準。

## 總結

原方案方向正確：評語掛在 `trial_sessions`、實際出席才要求、不擋點名、不擋轉正、前台在試堂頁閱讀。但對照現有系統後，有數處需要補強，否則落地時會出現權限漏洞、資料來源不一致、首頁待辦無法實作，以及後續難以追溯誰寫了什麼。以下按主題提出修改與優化建議。

---

## 1. 資料模型：三欄不夠，建議五欄 + 稽核

原方案待做第 1 項只列「評語、撰寫時間、撰寫人」。對照 `TeachingNotesEditor`（`src/components/schedule/TeachingNotesEditor.tsx`）只存一段文字，但試堂評語涉及「老師寫、行政可代貼、之後可能被覆寫」，建議採用更清晰的事件化欄位：

| 欄位 | 型別 | 用途 |
| --- | --- | --- |
| `teacher_comment` | `text` | 最新評語內容 |
| `teacher_comment_at` | `timestamptz` | 最後寫入時間 |
| `teacher_comment_by` | `uuid → teachers.id` | 最後寫入人 |
| `teacher_comment_edited_at` | `timestamptz` | 首次之後若有修改，記錄最後編輯時間 |
| `teacher_comment_edited_by` | `uuid → teachers.id` | 最後編輯人 |

建議保留「建立／修改」兩組時間，因為前線可能會問「這段評語幾時寫的？」以及「後來有冇改過？」。若只有一組，無法區分首次撰寫與事後行政代貼。

另外建議在 `mgmt_audit_log` 寫入一筆 `trial_teacher_comment_saved`，內含 `trial_id`、`student_id`、`class_id`、`old_comment` 摘要、`new_comment` 摘要。做法可參考 `trialQueries.ts` 中 `deleteTrialSession` 呼叫 `logMgmtAuditActionOrThrow` 的模式（`src/services/trialQueries.ts:500-510`）。

---

## 2. 誰能寫、誰能改、誰能讀

原方案說「老師只可寫自己該堂的試堂列，行政可讀可代貼」。這句需要拆細：

| 動作 | 老師（該堂任教） | 行政／管理層 | 備註 |
| --- | --- | --- | --- |
| 首次撰寫 | ✅ | ✅ | 行政可代老師貼入（例如 WhatsApp 收到後） |
| 修改自己寫的 | ✅ | ✅ | 行政可補充；老師只能改自己 `teacher_comment_by` 的列 |
| 修改別人寫的 | ❌ | ✅ | 避免老師 A 覆寫老師 B 的評語 |
| 讀取 | ✅（自己班的試堂列） | ✅ | 老師首頁只列自己班別的待寫評語 |

RLS 需要配合：目前 `trial_sessions` 的寫入政策是 `rls_cap_write_trial_sessions`（`20260816000753_p0_1_remaining_ops.sql`）。新增評語欄位後，要確認該 policy 不會讓所有 authenticated 用戶都能寫任何試堂列。建議在 service 層 `updateTrialTeacherComment` 先檢查身份，再執行 update；RLS 維持現有政策或另開一條僅允許 `admin`/`alien` 與任教老師更新評語欄位的 policy。

實作上可參考 `updateSchedule`（教學紀錄）的權限檢查：`TeachingNotesEditor` 只傳 `scheduleId`，由 service 決定誰能寫。試堂評語同樣應由 service 把關，不要只靠前端藏按鈕。

---

## 3. 「實際出席」的資料來源必須統一

原方案說「沿用現有實際出席判定」。現有判定位於 `src/lib/attendancePresence.ts`，`isActualPresentStatus` 涵蓋「現場、錄影回放、zoom 實時網課、出席、網課、補課、線上、即時直播」。這是對的，但必須注意兩點：

1. **點名儲存後的短頁**：應以剛剛寫入 `attendance_records` 的狀態為準，而不是 `trial_sessions` 的 `status`。因為 `trial_sessions.status` 仍是「已預約」或「已完成」，不會因點名結果而變。
2. **事後改點名**：若老師已寫評語，之後行政把出席改為缺席，評語應保留（因為那是老師當時的觀察），但首頁「待寫試堂評語」應把該列移除。若原本缺席，後來改為出席，則要重新出現在待辦。

因此「待寫試堂評語」的查詢條件應該是：

```text
trial_sessions.outcome = 'open'
AND trial_sessions.status 不含 '取消'
AND 該 schedule_id + student_id 的最新 attendance_records.status 屬於實際出席
AND trial_sessions.teacher_comment IS NULL
AND trial_date <= 今天
```

不要把「是否已寫評語」另外存成一個快取欄位，否則改點名後會不一致。以 `LEFT JOIN attendance_records` 即時計算為準。

---

## 4. 點名後短頁的 UX 細節

原方案說「點名的『確定』先照常儲存出席，不因未寫評語而擋住整班。儲存成功後，若本堂有已出席、尚未寫評語的試堂生，立刻開啟短頁」。

這裡建議補充以下細節：

- **開啟時機**：應在 `RollCallClassPanel.confirmRollCall` 成功後（`src/components/attendance/RollCallClassPanel.tsx:480-520`），`onConfirmed` 回呼之前或之後都可，但必須等 `setSavedMap` 完成、banner 出現後再開，避免畫面同時彈兩個東西。
- **支援代堂**：若該堂已指派代堂（`canEditRollCall` 為 false 時，代堂老師不能編輯），原任教老師的試堂評語待辦應出現在**實際點名的老師**首頁，而不是 `classes.teacher_id` 那位。這與現有「代堂只改 `schedules.teacher_id`」的鐵則一致（`.cursor/rules/terminology.mdc` 與 `docs/policies/scheduling/SCHEDULE_SUBSTITUTE_TEACHER.md`）。
- **可略過**：短頁必須有明確的「稍後再寫」按鈕，不能只有關閉 ×；否則老師會以為一定要填。
- **多個試堂生**：一人一格（原方案）。建議每格顯示學生姓名、班別、試堂類型，以及 30／80 字提示。
- **快速片語**：可參考 `TEACHING_NOTE_QUICK_PHRASES`（`src/components/schedule/TeachingNotesEditor.tsx:12-19`）加入試堂評語常用開頭，例如「基礎：」「進度：」「建議：」。

---

## 5. 老師首頁「待寫試堂評語」的資料來源

`TeacherHomeView`（`src/components/home/TeacherHomeView.tsx`）目前透過 `fetchUpcomingTrialsForClassIds` 載入即將試堂。新增「待寫評語」需要一個新的查詢，因為它要 join `attendance_records` 並篩選實際出席但無評語的列。

建議在 `src/services/trialQueries.ts` 新增：

```ts
export type PendingTrialCommentBrief = {
  id: string
  studentName: string
  classLabel: string
  scheduleId: string
  trialDate: string
  attendanceStatus: string
}

export async function fetchPendingTrialCommentsForTeacher(
  teacherId: string,
  classIds: string[],
  upToYmd?: string
): Promise<PendingTrialCommentBrief[]>
```

查詢邏輯：
1. 只選 `trial_sessions.class_id IN (老師所屬班別)`
2. `outcome = 'open'` 且 `status` 不含取消
3. 連 `attendance_records` 取該 schedule + student 的最新一筆（注意連堂可能有多筆，要取對應 schedule_id）
4. 狀態屬於 `isActualPresentStatus`
5. `teacher_comment IS NULL`
6. `trial_date <= today`（可選 upToYmd 放寬到未來，讓老師預寫？不建議，實際出席才寫）

在 `TeacherHomeView` 的 `loadMetaForSchedules` 中並行載入，與 `trialsLoad`、`pendingRollCallsLoad` 同一批 `Promise.allSettled`，並放在「即將試堂（我的班）」下方或「過去未點名提醒」附近。

顯示方式建議用黃色警示區塊，連結到該堂排程 `/Schedule/${scheduleId}`，並帶參數 `?trialComment=${trialId}` 讓排程頁知道要開評語短頁。

---

## 6. `/TrialSessions` 的評語顯示位置

原方案說「試堂頁主按鈕已是『正式報讀』的列，把評語放在按鈕上方」。這在 `TrialSessionsView`（`src/components/trials/TrialSessionsView.tsx:1420-1440`）的「下一步」欄位實作。

建議細化：

| 狀態 | 顯示 |
| --- | --- |
| 有評語 | 卡片內顯示評語全文（可 `line-clamp-3`），展開後看完整 |
| 評語未到 | 顯示淡色標籤「評語未到」，不擋正式報讀 |
| 實際出席但無評語 | 標籤「老師評語：待補」 |
| 非實際出席 | 不顯示任何評語相關提示 |

注意：評語應該在「待跟進」列表就能看到，而不是點開正式報讀對話才看到。前台同事每天要掃的是列表，不是逐列開對話。

另外建議在 `TrialConvertDialog`（`src/components/trials/TrialConvertDialog.tsx`）把評語帶入 target，讓轉正對話上方顯示：「老師評語：…」或「尚未收到老師評語」。這樣負責轉正的同事不會在不知道學習情況下直接按確認。

---

## 7. 與 `remarks`、`outcome_note`、教學紀錄的界線

原方案已排除把評語寫進教學紀錄或結果備註，但建議在文件與畫面提示中強化區分，避免老師與行政混淆：

| 欄位 | 誰寫 | 什麼時候寫 | 給誰看 |
| --- | --- | --- | --- |
| `teacher_comment` | 老師／行政代貼 | 實際出席後 | 前台回訪用 |
| `remarks`（試堂列備註） | 行政 | 任何時候 | 內部跟進備註（家長考慮中、下次聯絡等） |
| `outcome_note` | 行政 | 登記結果時 | 結果補充 |
| `teaching_notes`（schedule） | 老師 | 下課後 | 該班整體教學紀錄 |

可在試堂列的「下一步」區塊用小標區分：
- 「老師評語」
- 「跟進備註」
- 「結果備註」

---

## 8. 第二期「收件匣催評語」建議提前設計

原方案把收件匣催評語放在第二期，但若本期 schema 與 service 設計得當，第二期只需新增一個定時通知或收件匣事件，不需再改 table。

建議預留：
- `inbox_events.event_type` 目前沒有「試堂評語待補」類型。可在本期於 `src/services/inboxEventWrite.ts:8-17` 的 `InboxWriteEventType` 增加 `trial_comment_pending` 或類似值，但本期不寫入任何事件。
- 第二期觸發條件：昨日或更早的試堂列，實際出席但 `teacher_comment IS NULL`，則向該堂任教老師（以實際點名的 `attendance_records.created_by` 或 `schedules.teacher_id` 為準）發收件匣通知。

---

## 9. Migration 與型別

建議新增單一 migration，只加欄位、不改既有資料：

```sql
alter table public.trial_sessions
  add column if not exists teacher_comment text,
  add column if not exists teacher_comment_at timestamptz,
  add column if not exists teacher_comment_by uuid references public.teachers (id),
  add column if not exists teacher_comment_edited_at timestamptz,
  add column if not exists teacher_comment_edited_by uuid references public.teachers (id);

comment on column public.trial_sessions.teacher_comment is
  '老師對該試堂生的約 30 字學習評語，供前台回訪用。';
```

套用後要記得：
1. 更新 `src/services/trialQueries.ts` 的 `TRIAL_LIST_COLUMNS` 與 `TRIAL_LIST_COLUMNS_INNER_CLASS`（約第 245–250 行），把新欄位加進 select，否則列表讀不到。
2. 更新 `TrialManageRow` 型別（`src/services/trialQueries.ts:95-135`）。
3. 更新 `fetchUpcomingTrialsForClassIds` 若需顯示評語狀態。
4. 重新產生 `src/types/database.ts`（若有自動 generated types）。

---

## 10. 開工順序與相依

本題雖與 `trial-sessions-page-review.md` 獨立，但兩者都會改 `TrialSessionsView.tsx`。建議：

1. 先完成並合併 `trial-sessions-page-review.md` 的主按鈕、結果對話、五欄列表改版。
2. 再在本題新增評語欄與短頁，避免同時重構 UI 與新增資料流。
3. 點名短頁可提前做，因為它主要改 `RollCallClassPanel` 與新增一個獨立 dialog。

---

## 11. 待產品確認事項

1. 評語是否允許行政修改老師寫的內容？還是只能另寫在 `remarks`？
2. 評語超過 80 字時是擋下儲存，還是只提示仍可儲存？原方案說「超過仍可儲存，上限約 80 字」，但資料庫 `text` 沒有硬性上限，需要前端軟性提示。
3. 老師首頁「待寫評語」是否包含今天的試堂？還是只顯示「昨日或更早」以製造輕微催促？建議包含今天，因為老師可能即堂寫。
4. 評語是否需要在「學生詳情」頁顯示歷史？建議第二期再做，本期只顯示在試堂頁。
5. 若試堂生「出席」狀態是「錄影回放」，是否仍要求評語？建議是，因為老師有看回放或學生有上堂。

---

## 建議修改後的待做清單

| # | 項目 | 優先 |
| --- | --- | --- |
| 1 | Schema：新增 `teacher_comment` 等五欄 | 高 |
| 2 | RLS／service：`updateTrialTeacherComment` 限制身份與稽核 | 高 |
| 3 | `fetchPendingTrialCommentsForTeacher`：實際出席 + 無評語查詢 | 高 |
| 4 | `RollCallClassPanel`：點名成功後開啟評語短頁（可略過） | 高 |
| 5 | `TeacherHomeView`：新增「待寫試堂評語」區塊 | 高 |
| 6 | `TrialSessionsView`：列表顯示評語或「評語未到」 | 高 |
| 7 | `TrialConvertDialog`：轉正時顯示評語 | 中 |
| 8 | `InboxWriteEventType` 預留 `trial_comment_pending` | 低（本期只加型別） |
| 9 | 第二期：收件匣催評語通知 | 本期不做 |
