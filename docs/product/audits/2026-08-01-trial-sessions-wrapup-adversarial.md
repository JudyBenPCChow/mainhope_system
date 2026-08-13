# 試堂紀錄收尾方案 — 對抗式檢查（開工前）

> 日期：2026-08-01  
> 對象：[`試堂紀錄收尾方案`](../../.cursor/plans/試堂紀錄收尾方案_0bba82e4.plan.md)（Cursor plan）  
> 定案補充：收款單一入口 — [`UI_DESIGN_INSTRUCTIONS.md` §15](../UI_DESIGN_INSTRUCTIONS.md)、[`PAYMENT_RECEIPTS.md` §1.1](../manual/PAYMENT_RECEIPTS.md)  
> 後續補充（code 對讀）：[`2026-08-01-trial-sessions-wrapup-adversarial-supplement.md`](./2026-08-01-trial-sessions-wrapup-adversarial-supplement.md)（hard delete／void 解掛／連堂／回寫架構／status 旁路實證）

---

## 結論（一句）

方向啱（試堂唔收錢、錢入繳費紀錄、取消／改期要清點名），但原方案有 **1 個 P0 計劃錯誤**（仍允前台精靈當第二收款門）同若干 **P1 實作雷**；**修好計劃前唔好當階段 1 已可照抄開工**。

---

## 前台語言：方案做完前台會見到咩

| 動作 | 預期 |
| --- | --- |
| 新增試堂 | 試堂頁／前台只「掛人落堂」；半價／原價要收錢 → 去**收款登記** |
| 收咗錢 | **繳費紀錄**一定有單；試堂列表最好有收據號（新單靠回寫） |
| 改期／取消（已點名） | 系統問清唔清點名；要改就要清，唔清就唔好改 |
| 對帳 | 只睇繳費紀錄＋試堂列表收據；唔使記第三個收費畫面 |

---

## P0（開工前必須改計劃）

### ADV-P0-1 — 「前台 PaymentStep **或** `/Payments`」違反剛定嘅單一入口

**計劃寫：** 收費走「前台 PaymentStep **或** Payments」。

**鐵則（剛寫入 §15）：** 錢只經 `/Payments`；業務頁唔好再開／再留平行收款 UI；**唔好再開新元件／頁面**。

**現況：**

| 入口 | 入唔入 `payments`（繳費紀錄） | 算唔算平行收款 UI |
| --- | --- | --- |
| `/Payments` | ✅ | 正門 |
| 試堂頁 `insertPaidTrialSession` | ✅（其實都有單） | ❌ 要拆——前台以為「喺試堂頁收」易漏對 |
| 前台精靈 `PaymentStep` | ✅ | ❌ **第二扇門**（表單幾乎抄收款頁） |
| 學生詳情「新增繳費」 | ✅（navigate `/Payments`） | ✅ 正確 |

**澄清：** 試堂頁內嵌收費嘅痛點**唔係**「錢唔入繳費紀錄」（而家會入），而係**入口亂**＋試堂列 `payment_id` 常空，列表對唔到收據。

**改寫計劃（定案）：**

1. 階段 1：**只**保留 `/Payments` 做出單 UI；試堂半價／原價建立後 Banner／按鈕 → `/Payments?studentId=…`（可選 `mode=receive`）。  
2. **唔**把「補齊 PaymentStep 回寫」當主路徑；PaymentStep 標為 **已知例外／另票收斂**（精靈收錢步改導向 `/Payments`，或共用同一收款表單，仍一個入口體驗）。  
3. `payment_id` 回寫：掛喺 **`insertPaymentRecord` 成功後、且 detail 含試堂 line** 嘅 service 層（收款頁出單必經），唔好只改 PaymentStep。

---

## P1（計劃要寫死，否則實作易踩）

### ADV-P1-1 — 回寫配錯試堂

規則「同生＋同班、開著、`payment_id` 空、取最近一筆」——若同班兩個待跟進試堂（兩個日期），收一筆錢可能掛錯日。

**寫死：** 優先 match `payment_details.class_id`；多筆時取 `trial_date` 最近且 ≥ 今日或最接近付款日；仍多筆 → **唔自動掛**，Banner 叫人手喺試堂頁核對（或後期加「關聯收據」）。禁止 silently 亂配。

### ADV-P1-2 — 連堂節數金額不一致

舊 `insertPaidTrialSession` 會按連堂 peer 加總堂數；`/Payments` 試堂 line 預設 `DEFAULT_TRIAL_LESSON_COUNT`（多為 1）。改走收款頁後，連堂試堂可能**少收**。

**寫死：** 試堂建立成功 Banner 註明「請核對堂數」；或收款頁選試堂班時，若該生該班有開著試堂，預填 `lesson_count`＝該排程連堂節數（可選本期／下期）。

### ADV-P1-3 — 無試堂先收費

收款頁而家容許「純試堂 line、從未建試堂」→ 繳費紀錄有單、試堂列表無列、無 `payment_id` 可掛。對帳「有錢無人」。

**寫死（營運＋輕提示）：** 收款試堂 line 送出前，若該生該班無開著試堂 → 警告「尚未有試堂紀錄，仍要出單？」；**唔阻擋**（家長可能先交訂），但警告要有。回寫自然 skip。

### ADV-P1-4 — 作廢收據唔解掛

作廢後 `trial_sessions.payment_id` 仍指舊單 → 列表仲顯示收據號，繳費紀錄已作廢。

**寫死：** 本期可文件註明「作廢後請人手核對試堂」；理想：`void-payment` 成功後清相關試堂 `payment_id`（可另票，唔阻塞階段 1，但 O6／文件要講）。

### ADV-P1-5 — O1t 狀態下拉漏掛

試堂列表 status Select 而家直接 `updateTrialSession`；若只改「刪除／改期」Confirm、**漏咗改「取消」**，旁路仍在。

**寫死：** 凡 `status` → 含「取消」必須走 preview＋options；UI 唔好 inline 無確認 update。

### ADV-P1-6 — 强制刪出席 vs 真上過堂

已點名再取消＝强制刪。若行政誤點「取消」而學生其實上過試堂、之後要轉正對堂數——出席沒了。

**寫死：** Confirm 文案用前台語言：「會刪除此生喺該堂嘅點名；若已經上過堂而要留紀錄，請勿取消，改標已完成／轉正。」姓氏確認跟 leave。接受營運風險＝誤取消要人手補點（或日後 O2 行政刪／補）。

### ADV-P1-7 — 歷史單不回填

計劃已寫唔做自動 migration——正確。但對帳橫幅「已關聯 payment_id」會長期少於實收試堂費（舊前台／舊試堂頁單）。

**寫死：** 橫幅文案：「僅列出已關聯收據嘅試堂；完整金額請以繳費紀錄為準（篩試堂項目／學生）。」避免前台以為系統少收。

---

## P2（知悉即可）

| ID | 說明 |
| --- | --- |
| ADV-P2-1 | `converted_payment_id` 仍空——轉正學費另單，對帳靠繳費紀錄即可 |
| ADV-P2-2 | T5 手機卡片 defer——試堂對帳主戰場係桌面繳費紀錄，可接受 |
| ADV-P2-3 | T4 快速登記暫不做——前台精靈「只登記試堂」後應導 `/Payments`，唔係再開快捷收款 |

---

## 模擬劇本（對抗）

| # | 劇本 | 原方案風險 | 修後預期 |
| --- | --- | --- | --- |
| S1 | 試堂頁半價當場收 | 入口亂（錢其實有入紀錄） | 頁面無收款；導向 `/Payments` |
| S2 | 前台精靈收試堂費 | 第二扇門仍在 | 標例外／另票；階段 1 主路徑只 `/Payments` |
| S3 | 同班兩個開著試堂收一筆 | 掛錯日 | 多筆則拒自動掛＋提示 |
| S4 | 連堂 2 節試堂去收款頁 | 預設 1 堂少收 | 文案／預填節數 |
| S5 | 只收款唔建試堂 | 有單無名冊 | 警告；回寫 skip |
| S6 | 已點名改期 | 舊出席孤兒 | O1t 一併刪舊堂出席 |
| S7 | 列表改「取消」無 Confirm | 旁路 | 必須掛 preview |
| S8 | 作廢試堂費收據 | 試堂仍顯示收據 | 文件／另票清 `payment_id` |
| S9 | 前台只睇繳費紀錄對試堂費 | 舊單＋未掛 `payment_id` 以為少 | 橫幅聲明以繳費紀錄為準 |

---

## 修訂後階段 1（取代原「PaymentStep 或 Payments」）

1. 試堂頁：只 `insertTrialSession`；半價／原價 → 連 `/Payments?studentId=…`。  
2. `insertPaymentRecord`（或收款頁送出後單一 hook）：試堂 detail → `linkPaymentToOpenTrialSession`（含 ADV-P1-1 拒掛規則）。  
3. 前台 `PaymentStep`：**本期不擴大**；另開 backlog「精靈收款收斂至 `/Payments`」。  
4. 橫幅／文件：對帳信繳費紀錄（ADV-P1-7）。  
5. 階段 2 O1t、階段 3 人手驗——維持；補 ADV-P1-5／P1-6 文案。

---

## 判決

| 項 | 判決 |
| --- | --- |
| 試堂唔內嵌收費 | Agree — 開工 |
| 錢必須入繳費紀錄 | Agree — 現況正門已係；拆平行入口係體感＋關聯，唔係「救冇單」 |
| 原方案「PaymentStep 或 Payments」 | **Reject** — 改為只主推 `/Payments` |
| O1t 强制刪 | Agree — 文案要嚇得醒（P1-6） |
| 自動回填歷史 `payment_id` | Agree 不做 |

**下一步：** 更新 Cursor plan／`trial-sessions.md` 對齊本檔 ADV-P0-1；用戶確認後先做階段 1（收款單一入口＋回寫），再 O1t。
