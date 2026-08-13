# 試堂紀錄收尾方案 — 對抗檢查補充（code 對讀後）

> 日期：2026-08-01  
> 對象：[`2026-08-01-trial-sessions-wrapup-adversarial.md`](./2026-08-01-trial-sessions-wrapup-adversarial.md)（原始對抗檢查）  
> 性質：對讀實際 code 後，補充原 audit 未覆蓋或可深化嘅風險點  
> 方法：對照 `src/services/trialQueries.ts`、`src/components/trials/TrialSessionsView.tsx`、`src/components/frontDesk/steps/PaymentStep.tsx`、`src/services/paymentQueries.ts`、`supabase/functions/void-payment/index.ts`、`supabase/migrations/`

---

## 總評

原 audit 嘅 P0/P1/P2 判斷**全部成立**，模擬劇本 S1-S9 對應嘅 code path 都搵到實證。以下係 code 對讀後發現原 audit **未提及或可深化**嘅點。

---

## A. 原 audit 未提及嘅風險

### ADV-SUP-1 — `deleteTrialSession` 係 hard delete，比 void 更危險（P1）

**現況：** `trialQueries.ts:170-174`

```ts
export async function deleteTrialSession(id: string): Promise<void> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { error } = await supabase.from("trial_sessions").delete().eq("id", id)
  if (error) throw error
}
```

- migration `20260718031000` 設定咗 `payment_id ... references public.payments (id) on delete set null`，所以 hard delete trial 唔會 cascade 刪 payment。
- **但係**：hard delete 冇 audit trail、冇得還原、冇 confirm 文案提及「會遺留孤兒 payment」。
- UI 層（`TrialSessionsView.tsx:999-1014`）有 `confirmDialog`，但文案只係「確定刪除此筆試堂？」，冇警告如果有 `payment_id` 關聯，delete 後個 payment 會變孤兒（冇 trial 可對）。
- 對比 void payment（`PAYMENT_RECEIPT_VOID_POLICY.md` §7），void 有密碼確認、audit、通知、電郵；但 delete trial 只得一個簡單 confirm。

**建議：**
- 有 `payment_id` 嘅 trial，delete confirm 文案要加警告：「此試堂有關聯收據（編號 XXX），刪除後收據仍在但無法從試堂列表對帳。確定刪除？」
- 或者：有 `payment_id` 嘅 trial 唔畀 hard delete，要先 void payment 再處理 trial。
- 起碼加個 `mgmt_audit_log` 寫入（delete trial 目前冇 audit）。

---

### ADV-SUP-2 — `insertPaidTrialSession` 有事務不一致風險（P1）

**現況：** `trialQueries.ts:370-432`

```ts
// Step 1: 先 create payment
const paymentId = await insertPaymentRecord({...})

// Step 2: 再 create trial session with payment_id
await insertTrialSession({...payment_id: paymentId})
```

兩個操作唔在同一個 transaction 內：
- 如果 step 1 成功、step 2 失敗（例如 unique constraint `trial_sessions_student_schedule_open_uidx` 撞），payment 已 committed，無法 rollback → **孤兒 payment**（有單、無 trial）。
- 相反方向：step 2 冇可能喺 step 1 失敗後執行（因為要先有 paymentId）。

**現況緩解：** `insertTrialSession` 內有重複檢查（line 260-271），會 throw error 阻止 insert。但 race condition 仍然存在（兩次 concurrent call）。

**建議：**
- Step 2 fail 時，嘗試 void 返個 payment（或標註「待清理」）。
- 或者改以 DB function / RPC 包成一個 transaction。
- 最輕量：catch block 內加 `reportUserFacingError` 時註明「payment 可能已建立但 trial 失敗，請檢查繳費紀錄」。

---

### ADV-SUP-3 — `PaymentStep` 收試堂費時唔會 create `trial_sessions` row（加深 ADV-P1-3）

**現況：** `PaymentStep.tsx:248-298`

`PaymentStep.onSubmit` → `insertPaymentRecord` 出單。即使 detail 係 trial line（`kind === "trial"`），佢**唔會** create 任何 `trial_sessions` row。

結果：
- 繳費紀錄有單、有金額、有班別 reference。
- `trial_sessions` 完全冇呢筆。
- 即使將來 implement 咗 `linkPaymentToOpenTrialSession`，都冇 trial 可以掛 → 永久孤兒 payment。

原 audit ADV-P1-3 關注 `/Payments` 頁「純試堂 line、從未建試堂」，但 `PaymentStep` 係另一個產生同一問題嘅入口。

**建議：**
- 短期：`PaymentStep` 嘅 trial line 送出前，檢查有冇對應嘅 open trial；冇就警告（同 ADV-P1-3 策略）。
- 長期：精靈收錢步收斂至 `/Payments`（原 audit 已提），到時 PaymentStep 消失，呢個風險自然消失。

---

### ADV-SUP-4 — 試堂頁 status dropdown 改「取消」冇 confirm（實證 ADV-P1-5）

**現況：** `TrialSessionsView.tsx:918-930`

```tsx
<Select
  value={r.status}
  onChange={async (e) => {
    await updateTrialSession(r.id, { status: e.target.value })
    await reload()
  }}
>
  <option value="已預約">已預約</option>
  <option value="已完成">已完成</option>
  <option value="取消">取消</option>
</Select>
```

改去「取消」**完全冇 confirm**、冇 preview、冇檢查 `roll_call_done`、冇檢查 `payment_id`。
- 即使已點名（`roll_call_done = true`），都可以 inline 改「取消」→ 同 ADV-P1-6 疊加：已點名 + 取消 = 出席孤兒 + 無警告。
- 即使有 `payment_id`，都可以改「取消」→ 收據仍在，trial 已取消，對帳更混亂。

原 audit ADV-P1-5 描述正確。Code 確認：呢個係**最直接嘅旁路**。

**建議（強化）：**
- 改去「取消」前：必須彈 confirm dialog，內容包含：
  - 如果 `roll_call_done`：「此試堂已點名，取消將使出席紀錄失去試堂關聯。」
  - 如果有 `payment_id`：「此試堂有關聯收據（XXX），取消不影響收據。」
  - 姓氏確認（跟 leave cancel 慣例）。
- 又或者：有 `roll_call_done` 或 `payment_id` 時，禁用 inline status change，強制行 O1t preview flow。

---

### ADV-SUP-5 — `void-payment` Edge Function 完全唔理 `trial_sessions`（實證 ADV-P1-4）

**確認：** `supabase/functions/void-payment/index.ts` 冇任何 reference to `trial_sessions`。

Void 後：
- `payments.status` → 作廢
- `trial_sessions.payment_id` 仍然指向已作廢嘅 payment
- 試堂列表嘅 `receipt_number`（經 `payments!payment_id` join）仍然顯示
- 對帳橫幅「已關聯 payment_id 筆數」唔會減

原 audit ADV-P1-4 建議「文件註明／另票清 payment_id」。Code 確認呢個係**必須 fix** 嘅 gap，唔係 nice-to-have。

**建議：**
- 至少：void-payment Edge Function 成功後，`update trial_sessions set payment_id = null where payment_id = $1`。
- 或者：void-payment 成功後回傳 affected payment_id，前端再 call 一個新嘅 `unlinkPaymentFromTrials`。

---

## B. 原 audit 判斷可強化嘅點

### ADV-SUP-6 — P1-2 連堂節數：`PaymentStep` 比 `insertPaidTrialSession` 更差

| Path | 連堂處理 |
| --- | --- |
| `insertPaidTrialSession`（試堂頁內嵌收費） | ✅ 會 call `fetchConsecutiveScheduleIds`，按實際節數計 `lessons = scheduleIds.length`（`trialQueries.ts:384-386`） |
| `PaymentStep`（前台精靈） | ❌ 預設 `DEFAULT_TRIAL_LESSON_COUNT = "1"`，冇連堂感知（`paymentsUi.tsx:14`） |
| `/Payments`（收款登記） | ❌ 同樣預設 `DEFAULT_TRIAL_LESSON_COUNT = "1"`（`paymentsUi.tsx:51`） |

結論：**試堂頁內嵌收費反而係三個 path 中最正確處理連堂嗰個**。Audit 寫 P1-2 時假設 `/Payments` 係主要 path，但 code 確認 `/Payments` path 同樣有 DEFAULT 1 堂嘅問題。

**建議：** P1-2 嘅「寫死」範圍應覆蓋 `/Payments` 試堂 line 同 `PaymentStep` 兩處；唔好只假設改走試堂頁收費就解決。

---

### ADV-SUP-7 — P0-1「payment_id 回寫掛喺 insertPaymentRecord 成功後」嘅架構考量

原 audit 建議：

> `payment_id` 回寫：掛喺 `insertPaymentRecord` 成功後、且 detail 含試堂 line 嘅 service 層

**Code 現實：**
- `insertPaymentRecord` 係 general-purpose function，被以下地方 call：
  - `/Payments`（`PaymentsPageView`）
  - `PaymentStep`（前台精靈）
  - `insertPaidTrialSession`（試堂頁內嵌）
  - 可能未來更多（API、batch）
- 將 trial-specific back-link logic 放入 `insertPaymentRecord` 會令 payment service 同 trial domain 耦合。

**建議（refine 架構）：**
- 與其改 `insertPaymentRecord`，不如做一個 **輕量 event/hook**：
  - `insertPaymentRecord` return `paymentId` + `details`。
  - caller（`PaymentsPageView`、`PaymentStep`、`insertPaidTrialSession`）自己判斷有冇 trial line，有就 call `linkOpenTrialsToPayment(paymentId, studentId, details)`。
  - `linkOpenTrialsToPayment` 係新嘅 trial service function，做 ADV-P1-1 嘅 matching logic。
- 咁樣 payment service 保持 generic，trial coupling 留喺 caller 層。

---

### ADV-SUP-8 — Audit 冇提及 RLS／route guard 嘅安全考量

背景：角色營運 audit（[`2026-07-30-role-ops-adversarial.md`](./2026-07-30-role-ops-adversarial.md)）P1-5 指出 Trial deep-link 無 route guard。

試堂收尾方案包括：
- 修改 `/TrialSessions` 頁
- 新增 back-link logic（write path）
- 修改 status change flow

如果老師 role 可以 deep-link `/TrialSessions` 並見到半殘 UI（原 audit P1-5 描述），咁佢哋**可唔可以改 status**？可唔可以 trigger back-link logic？

**建議：**
- 喺階段 1 一併補 route guard：`/TrialSessions` 限 `admin` + `alien`（同 `/Payments`）。
- 試堂 back-link write path（`linkOpenTrialsToPayment`）加 server-side role check 或 RLS 確保只有 mgmt staff 可 trigger。

---

## C. 模擬劇本補充

原 audit 有 S1-S9，以下係 code 對讀後建議追加嘅劇本：

| # | 劇本 | 風險 | 建議 |
| --- | --- | --- | --- |
| S10 | 試堂頁收費 → insertPaymentRecord 成功 → insertTrialSession 撞 unique 失敗 | 孤兒 payment（有單無 trial） | catch block 內 warn + 建議 check 繳費紀錄（ADV-SUP-2） |
| S11 | 有 payment_id 嘅 trial 被 hard delete | payment 變孤兒、無 audit | confirm 文案警告；或禁止 delete 有 payment_id 嘅 trial（ADV-SUP-1） |
| S12 | PaymentStep 收試堂費 → 無 trial_sessions row → 之後想 back-link | 永遠掛唔到 | PaymentStep trial line 警告「無試堂紀錄」（ADV-SUP-3） |
| S13 | 老師 deep-link `/TrialSessions` → 改 status → trigger back-link | 越權寫入 | 補 route guard + RLS（ADV-SUP-8） |
| S14 | 連堂試堂經 `/Payments` 收費 → 預設 1 堂 → 少收 | DEFAULT_TRIAL_LESSON_COUNT 無連堂感知 | `/Payments` trial line 都要檢查連堂數（同 P1-2，ADV-SUP-6） |

---

## D. 修訂後建議優先序

| 優先 | 項目 | 說明 |
| --- | --- | --- |
| **P0** | ADV-P0-1（原）| 收款單一入口 `/Payments`；試堂頁拆走內嵌收費；PaymentStep 標例外 |
| **P0** | ADV-SUP-1 | Hard delete trial 有 payment_id 時要警告或禁止 |
| **P1** | ADV-P1-5（原）+ ADV-SUP-4 | Status dropdown 改「取消」必須 confirm；含點名/收據檢查 |
| **P1** | ADV-SUP-5 | void-payment 成功後清 `trial_sessions.payment_id` |
| **P1** | ADV-P1-1（原）+ ADV-SUP-7 | `linkOpenTrialsToPayment` 新 function，喺 caller 層呼叫而唔係改 `insertPaymentRecord` |
| **P1** | ADV-P1-2（原）+ ADV-SUP-6 | `/Payments` trial line 都要處理連堂節數（唔只試堂頁） |
| **P1** | ADV-SUP-2 | `insertPaidTrialSession` fail 時清理孤兒 payment |
| **P1** | ADV-SUP-8 | `/TrialSessions` route guard + RLS |
| **P2** | ADV-SUP-3 | PaymentStep trial line 警告「無試堂紀錄」（短期，長期收斂後消失） |
| **P2** | ADV-P1-3（原）| `/Payments` trial line 無對應 trial 時警告 |
| **P2** | ADV-P1-4（原）| Void 後人手核對（短期，ADV-SUP-5 做咗就解決） |
| **P2** | ADV-P1-6（原）| 取消已點名試堂嘅 confirm 文案 |

---

## E. Code 位置速查（畀 Cursor 改 code 用）

| 項目 | 位置 |
| --- | --- |
| 試堂頁內嵌收費 Dialog | `src/components/trials/TrialSessionsView.tsx:1182-1245`（payOpen Dialog） |
| 試堂頁 confirmTrialCharge | `src/components/trials/TrialSessionsView.tsx:676-733` |
| Status dropdown（無 confirm 旁路） | `src/components/trials/TrialSessionsView.tsx:918-930` |
| Delete trial confirm | `src/components/trials/TrialSessionsView.tsx:996-1014` |
| insertPaidTrialSession | `src/services/trialQueries.ts:370-432` |
| insertTrialSession（含連堂 check） | `src/services/trialQueries.ts:197-348` |
| deleteTrialSession（hard delete） | `src/services/trialQueries.ts:170-174` |
| updateTrialSession（無 attendance cleanup） | `src/services/trialQueries.ts:161-168` |
| insertPaymentRecord | `src/services/paymentQueries.ts:347-466+` |
| PaymentStep（前台精靈第二扇門） | `src/components/frontDesk/steps/PaymentStep.tsx` |
| DEFAULT_TRIAL_LESSON_COUNT = "1" | `src/components/payments/paymentsUi.tsx:14` |
| Void payment Edge Function | `supabase/functions/void-payment/index.ts` |
| payment_id FK migration | `supabase/migrations/20260718031000_trial_sessions_payment_id.sql` |
| Outcome/conversion migration | `supabase/migrations/20260727025051_trial_outcome_conversion.sql` |
| 收款單一入口鐵則 | `docs/meta/UI_DESIGN_INSTRUCTIONS.md` §15 |
| 繳費收據操作手冊 | `docs/playbooks/frontdesk/PAYMENT_RECEIPTS.md` |
| 角色營運 audit（RLS gap） | `docs/product/audits/2026-07-30-role-ops-adversarial.md` P1-5 |

---

*本補充應與原對抗檢查一併畀 Cursor，作為修改 Cursor plan 同開工前嘅完整風險清單。*
