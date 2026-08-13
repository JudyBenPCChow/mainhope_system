# 生命週期孤兒方案 — 外部顧問審閱回饋

> 角色：**外部技術顧問**（非團隊成員，審閱方案與源碼後提出風險與建議）  
> 審閱對象：[`2026-07-31-lifecycle-orphans.md`](./2026-07-31-lifecycle-orphans.md)  
> 審閱日期：2026-07-31  
> 狀態：**Cursor 已回應**（定案寫入方案「審閱定案」節）  
> 回應日期：2026-07-31

---

## 審閱方法

閱讀範圍：
1. 方案主檔 `docs/product/plans/2026-07-31-lifecycle-orphans.md`
2. 分題 backlog `docs/product/topics/lifecycle-orphans.md`
3. 相關政策 `docs/policies/attendance/ATTENDANCE_BILLING.md`、`docs/playbooks/frontdesk/LEAVE_MAKEUP_CONSECUTIVE.md`
4. 源碼：`src/services/leaveQueries.ts`、`src/services/attendanceQueries.ts`、`src/lib/attendanceBilling.ts`

審閱重點：**上線後會發生的 bug**，不重複方向性討論（方案方向是正確的）。

---

## 🔴 P0 — 不處理必爆

### P0-1：`updateLeaveMakeupRecord` 改 `makeup_schedule_id` 時完全沒有掃描攔截

**源碼證據**：`src/services/leaveQueries.ts:273-356`（`updateLeaveMakeupRecord`）— 整個函式沒有任何對 `attendance_details` 的查詢或刪除。

**場景**：
- 行政在請假管理把補堂從 A 日改綁到 B 日
- A 日本來已點名（學生已補堂出席）
- 改綁後 A 日的 attendance 變成孤兒，**零提示**

**三種子情況都要處理**（`makeup_schedule_id` 的變更方向）：

| 變更 | 孤兒風險 | 行為 |
| --- | --- | --- |
| `null → 有值` | 無 | 不需攔截 |
| `有值 → null`（清調堂） | 舊宿主出席變孤兒 | 要掃描 + Confirm |
| `有值 → 另一值`（改日） | 舊宿主出席變孤兒 | 要掃描 + Confirm（預設建議刪舊宿主） |

**要求**：不能只在「刪除」按鈕攔截。模擬 2 已經指出這點，但方案正文的 O1 描述聚焦在 `deleteLeaveMakeupRecord`，對 `updateLeaveMakeupRecord` 的攔截條件不夠具體。請在方案中明確寫出上述三種情況的處理邏輯。

---

### P0-2：`schedule_id IS NULL` 的出席紀錄會被 O1 掃描漏掉

**源碼證據**：backlog 第 23 行 — 排程硬刪時 `attendance_details.schedule_id ON DELETE SET NULL`。

**場景**：
- 排程被硬刪 → attendance 的 `schedule_id` 變 NULL
- 該筆 attendance 仍存在、仍計入已上堂數
- O1 掃描以 `makeup_schedule_id` 為 key 去 attendance_details 查 → **找不到這些紀錄**（因為 schedule 已不存在，leave record 的 `makeup_schedule_id` 也已被清或設為 NULL）

**要求**：O1 掃描邏輯必須涵蓋以下情況：
```
attendance_details 存在 且 (schedule_id IS NULL 或 schedule_id 對應的 schedules 已不存在)
且 student_id + class_id + attendance_date 對不上任何當前資格
```
請在方案中補充這條掃描規則。

---

### P0-3：刪除順序錯誤會導致半完成狀態（請假已刪、出席還在）

**背景**：Supabase 每個呼叫是獨立請求，沒有跨表 transaction。

**場景**：用戶在 Confirm 選「一併刪」後：
1. 系統先呼叫 `deleteLeaveMakeupRecord(id)` → 成功
2. 再呼叫 `deleteAttendanceStatusForSchedule(...)` → 失敗（網路中斷、RLS 拒絕等）
3. 結果：請假已刪、出席還在 → 孤兒仍然存在，且**無法再透過取消請假來清理**（因為請假已經沒了）

**要求**：
- **反轉執行順序**：先刪 attendance，全部成功後才刪 leave record
- 如果 attendance 刪除部分失敗，leave record 保留不動
- 請在方案中明確寫出執行順序與錯誤處理策略

**延伸問題**：如果用戶選的是「只改請假、保留出席」，但 `updateLeaveMakeupRecord` 成功後 attendance 仍在——這是預期行為（已寫在 Confirm 文案中），但需確保 O0 上線後這些孤兒能被標記出來。請確認這條路徑的覆蓋。

---

## 🟠 P1 — 高概率發生，後果嚴重

### P1-1：TOCTOU 競態 — 掃描與刪除之間無防護

**場景**：
- Admin A 打開請假管理，點刪除 → 系統掃描到 2 筆 attendance → 彈 Confirm
- 在 A 看 Confirm 的 3 秒內，老師 B 在點名紙把其中一筆從「事假」改成「現場」（因為學生真的補了課）
- A 點「一併刪」→ 系統刪掉了狀態已被改成「現場」的 attendance → 已上堂數被錯誤扣減

**源碼證據**：`saveAttendanceStatus`（`attendanceQueries.ts:637`）是無條件 upsert，任何人打開點名紙就能改任何狀態。

**要求**：
- 刪除前加樂觀鎖：比對 `attendance_details` 當前列的 status 是否與掃描時一致
- 不一致 → 拒絕刪除，重新掃描，重新彈 Confirm
- 如果 `attendance_details` 表沒有 `updated_at` 欄位，請先加 migration（見 P2-2）
- 請在方案中寫出具體的樂觀鎖實作方式

---

### P1-2：連堂補堂的出席可能寫在多個 `schedule_id` 上

**場景**：
- 補堂綁連堂第 1 節，但老師在連堂整組點名紙上把該生兩節都手動標「現場」
- `saveAttendanceStatusForStudentScope`（`attendanceQueries.ts:720`）只在**儲存點名時**清除多餘節——如果老師是分兩次手動點的，就會有兩筆 attendance
- O1 掃描只看 `makeup_schedule_id` 對應的那一節 → 只刪到一筆，另一筆仍在

**要求**：
- O1 掃描時，傳入 `makeup_schedule_id` 後，展開到同 `consecutive_group_id` 的所有 schedule
- 逐一檢查每個 peer schedule 上是否有該生的 attendance
- 在 Confirm 文案中列出所有將被刪除的 schedule（而非只列 makeup_schedule_id）
- 模擬 1 的「問題」已提到「文案必須列出每一 schedule_id」——請把這個展開邏輯寫進 O1 的實作規範，而非只寫在模擬的注意事項裡

---

### P1-3：Audit 寫入失敗時的行為未定義

**場景**：系統嘗試寫 `logMgmtAuditAction` 失敗（表權限不足、網路問題等），但 attendance 的刪除已經執行或將被執行。

**鐵律**：方案寫明「每次刪寫 audit」。如果 audit 失敗但仍刪了 attendance → 違反鐵律。

**要求**：
- 執行順序：**先寫 audit → 成功後才刪 attendance**
- Audit 寫入失敗 → 拋錯，不刪 attendance
- 這個順序與 P0-3 的建議（先刪 attendance 再刪 leave）組合後，完整順序應為：
  1. 掃描孤兒
  2. 用戶 Confirm
  3. 樂觀鎖檢查（P1-1）
  4. 寫 audit
  5. 刪 attendance
  6. 刪 leave record / update leave record
- 請在方案中寫明這個完整執行順序

---

### P1-4：O2 單列刪除的角色安全

**源碼證據**：`AGENTS.md` 鐵則 — `localStorage.mgmt_role` 不等於 Supabase Auth。

**場景**：任何人打開 DevTools 改 `localStorage.mgmt_role = 'admin'` 就能看到刪除按鈕並呼叫刪除 API。

**要求**：
- O2 的刪除 API 不能只依賴前端 role check
- 建議做法：建立一個 Supabase RPC function（`delete_attendance_admin`），在 function 內透過 `auth.uid()` + app role table 做雙重驗證
- 如果 RPC 短期不可行，至少在 service 層的刪除函式上加入 server-side role assertion（但已知 `mgmtRole` 是 client-only）
- 請在方案中寫明 O2 的權限檢查實作方式，不要只寫「前端隱藏不足」

---

## 🟡 P2 — 邊界情況，建議階段 A 一併處理

### P2-1：試堂路徑完全沒在階段 A

**源碼證據**：backlog 盤點 — `updateTrialSession` / `deleteTrialSession` / `rescheduleTrialSession` 三條路徑，嚴重度皆為「高」。

**場景**：階段 A 上線後，行政發現取消請假有 Confirm，但取消試堂沒有 → inconsistent UX，而且試堂 attendance 同樣影響計費。

**要求**：
- 至少在階段 A 為試堂取消加入 lightweight 攔截：如果試堂已有 attendance → 彈單一 Confirm（一鍵刪除即可，不需要三路）
- 試堂的「保留出席」情境極少（試堂是單次事件，不像補堂有「學生真的上了但行政誤取消」的場景）
- 如果確實不做，請在方案中明確寫出「試堂路徑階段 A 刻意不做」的理由和風險接受聲明

---

### P2-2：`attendance_details` 缺少 `created_at` / `updated_at` 欄位

**源碼證據**：`saveAttendanceStatus`（`attendanceQueries.ts:671`）的 insert 沒有寫入 `created_at`；update 分支（`attendanceQueries.ts:663`）手動設 `updated_at: new Date().toISOString()`，暗示表本身可能沒有 `DEFAULT NOW()`。

**影響**：
- P1-1 的樂觀鎖需要 `updated_at` 來比對
- Audit 需要可靠的時序參考（同一天可能有多筆操作）
- O5 健康檢查需要知道「這筆孤兒是甚麼時候產生的」

**要求**：請確認 `attendance_details` 表的實際 schema。如果沒有 `created_at` / `updated_at`，請在階段 A 加入 migration 補上（`ALTER TABLE ... ADD COLUMN IF NOT EXISTS` + `DEFAULT NOW()`）。

---

### P2-3：模擬 5 的衍生 —「無來源的事假／病假」

方案說不刪請假日原班出席（合理）。但衍生問題：

- 用戶刪了請假，補堂出席也清了，但原班那天的 attendance 狀態仍是「事假」
- 這個「事假」對應不到任何 `leave_makeup_records`（因為已被刪除）
- O0 的標籤不會標記它（它看起來像正常請假）
- O5 健康檢查也不會標記它（因為 O5 只查「無對應資格的 attendance」，而事假本身不需要資格）

**要求**：請在 O5 健康檢查中加入：
```
attendance_details.status IN ('事假', '病假')
AND NOT EXISTS (
  SELECT 1 FROM leave_makeup_records
  WHERE leave_makeup_records.student_id = attendance_details.student_id
    AND leave_makeup_records.class_id = attendance_details.class_id
    AND leave_makeup_records.leave_date = attendance_details.attendance_date
)
```
或確認這個檢查項已在 O5 範圍內。

---

### P2-4：老師請假精靈被阻斷後的補救 UX

方案說「有孤兒則失敗並回傳筆數，要求改走請假管理處理」。但：

- 老師可能同時取消整堂課，影響 5-10 個補堂生的請假
- 被擋後要逐個去請假管理處理
- 如果老師先取消了排程，然後才去請假管理處理，`makeup_schedule_id` 指向已取消的排程 → 行政看到的是混亂狀態

**要求**：
- 失敗提示中必須列出**受影響的學生姓名和請假 ID**（不能只寫「有 3 筆孤兒」）
- 請在方案中寫明精靈失敗後的精確錯誤訊息格式
- 如果短期不做精靈內嵌 Confirm，至少要確保錯誤訊息足夠讓行政在請假管理快速定位

---

## 🟢 認同的設計決策（不需回應）

以下決策我完全認同，不需要修改：

- 不靜默刪除計費出席 ✅
- 三路 Confirm（一併刪／保留出席／取消）✅
- 攔截掛在 service 層而非 UI ✅
- 階段 A 先止血、不一次做大 ✅
- 本期不做 soft-delete（`deleted_at`），留待後續評估 ✅
- 不刪請假日原班出席 ✅
- 不做夜間自動 reconcile ✅

---

## 📋 需 Cursor 回應的問題

請在修訂方案時明確回答以下問題：

1. **P0-1**：`updateLeaveMakeupRecord` 的三種 `makeup_schedule_id` 變更情況，各自的攔截邏輯是甚麼？請寫出 pseudo-code 或流程圖。

2. **P0-3**：完整的執行順序是否同意為「寫 audit → 刪 attendance → 刪/改 leave record」？如有不同順序，請說明理由。

3. **P1-1**：`attendance_details` 表目前是否有 `updated_at` 欄位？如果沒有，是否需要新增 migration？

4. **P1-4**：O2 的權限檢查實作方式？是否接受 RPC function 方案，或有其他做法？

5. **P2-1**：試堂路徑是否要在階段 A 做 lightweight 攔截？如果不要，請寫明風險接受聲明。

6. **P2-2**：`attendance_details` 的實際 schema（是否有 `created_at` / `updated_at`）？

---

## 附錄：建議的完整執行順序（供參考）

```
User clicks "Delete Leave" or "Clear/Change Makeup"
  → 1. scanAttendanceOrphans(leaveRecordId)
       → 查 makeup_schedule_id
       → 展開 consecutive_group_id 的所有 peer schedule
       → 查所有 peer schedule 上的 attendance_details（含 schedule_id IS NULL 的情況）
       → Return { orphanCount, orphanDetails: [{studentName, scheduleDate, status, scheduleId}] }

  → 2. if orphanCount === 0 → 直接執行步驟 6（無孤兒，不需 Confirm）

  → 3. 彈三路 Confirm，文案列出每筆 orphan 的 detail

  → 4. 用戶選擇：
       - 取消 → abort
       - 保留出席 → 跳到步驟 6（只改 leave，不刪 attendance）
       - 一併刪 → 繼續步驟 5

  → 5. for each orphan:
       5a. 樂觀鎖檢查：比對當前 status 是否與掃描時一致
       5b. 不一致 → 重新掃描，重新彈 Confirm
       5c. 一致 → 寫 audit、刪 attendance

  → 6. 執行 leave record 的變更（delete 或 update）

  → 7. 完成
```

這個順序的核心原則：
- **Audit 先於 attendance 刪除**（確保有痕跡）
- **Attendance 刪除先於 leave 變更**（確保失敗時 leave 還在，可以重試）
- **樂觀鎖在刪除前**（防止並發覆蓋）
