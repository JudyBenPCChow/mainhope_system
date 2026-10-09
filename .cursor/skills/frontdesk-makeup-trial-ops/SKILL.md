---
name: frontdesk-makeup-trial-ops
description: >-
  前台對話直接寫入 production：個別學生調堂／補堂、試堂排程／改期、半價試堂出單與確認收款。
  Use when the user asks 安排補堂、調堂、補回取消堂、試堂、改期試堂、半價試堂、確認收款、
  改付款方式, or names students + date/time for makeup or trial on MainHope_production.
  Not for 未完成補堂 PDF (leave-makeup-followup) or schema migrations.
---

# 前台補堂／試堂寫入（production）

用戶講完學生、科／班、日時後，**自己查 production、自己寫入**。不要只教人手點掣。

真源：**MainHope_production**（project ref `gudmbilboyhouotilrvt`）。優先 Supabase MCP `execute_sql`；MCP 不可用則 CLI `projects api-keys` 取 **service_role** + REST。anon／RLS 空陣列 ≠ 庫真係空。缺權限：**停、通知**，不要假資料交差。

回覆用語：繁體中文書面語。術語見 `.cursor/rules/terminology.mdc`。

---

## 分流

| 用戶意圖 | 做什麼 | 唔好做 |
| --- | --- | --- |
| 某生請假／取消堂 → 約補堂日時 | 調堂：綁 `leave_makeup_records.makeup_schedule_id` | 當全班改期；喺原班加堂（除非原班就讀＝全部補堂生） |
| 未完成補堂總表／PDF | skill `leave-makeup-followup` | 本 skill |
| 試堂新排／改期／出單／確認收款 | 試堂流程（下） | 當補堂請假處理 |
| 全班取消堂改日 | 班別詳情「安排補堂」（`makeup_of=`） | 逐個當個別調堂（除非用戶只要部分學生） |

---

## A. 個別調堂／補堂

### 硬閘（先查再開寫）

1. **對應請假**：每位學生、每一節都要有可綁請假。  
   - 用戶已講請假日／取消堂日 → 用該日。  
   - 未講：待補筆數＝要補節數 → 按日期先後；多過要補節數 → **停**，列候選請用戶揀。  
   - 完全無待補：  
     - 用戶明講「補回取消堂／導師請假」且該生原班當日確有取消排程 → **可補建**請假後綁。  
     - 否則 **停**：`沒有請假紀錄可綁`。  
2. **核對取消堂屬該生原班**：姓名＋科目對上 `student_class_enrollments`（就讀中）後，確認 `schedules` 取消列在**該** `class_id`。用戶口頭日期若對唔上該班（例如講 9/12、該班無堂）→ **停、列實際欠堂／待補**，不要硬綁錯日。  
3. **唔好喺原班開／掛加堂**（`roster_policy=class_all` 會拉齊就讀生）。例外：原班就讀名單＝今次全部補堂生（可沿用原班已有 `makeup_of=` 加堂）。

### 揀宿主

優先序：

1. 該日時已有**同老師＋同年級＋同科**、目標生**未**就讀中之現成堂 → 直接綁（唔重複開）。  
2. 否則開加堂（`is_extra_lesson=true`）掛：**同老師、同學年、同年級、同科、未報讀**；優先 **0 人就讀**。  
3. 同年級空宿主冇：可用同老師同科 **0 人**其他年級空班（點名紙只見調堂生）；回覆要講明。  
4. 只有有人就讀的宿主 → **先問**「原班生會一同上紙」；用戶同意先綁。  
5. 課室：跟宿主；該時段課室被佔 → 改空課室（查同日同時段 `classroom_id` 撞期）。矩尺座常滿，可改英仙座／17D 等。

`teaching_notes` 必寫：`補堂（{原班代碼}）：{姓名…}`（多人用頓號；多個原班可分號並列）。

### 已有全班補回格（`remarks` 含 `makeup_of=`）

- 用戶要安排的學生若＝該取消堂應補對象（或原班全數）→ **綁現有格**，更新 `teaching_notes`，不要再開第二格。  
- 若現有格錯掛在原班、且只要部分學生 → **把該 schedule 的 `class_id` 改去 0 人宿主**（保留時間／老師／`makeup_of=`），再綁請假。唔好留喺原班令其他就讀生上紙。

### 改期（補堂已綁、改日時）

1. 更新請假：`makeup_schedule_id`、`makeup_date`。  
2. 新格加／改 `teaching_notes`；舊格若只得該生補堂備註 → 清走或改寫。  
3. 舊格若係常規堂（有就讀生）→ **唔好刪排程**。

### 寫入欄位（常見）

`leave_makeup_records`：`schedule_id`＝原堂（取消／請假堂）；`makeup_schedule_id`＝補堂；`leave_reason`／`makeup_type=調堂`／`tuition_disposition=調堂`／`status=已批核`；取消堂補建可 `remarks=補回取消堂`。

綁／改 `makeup_schedule_id` 後，系統會為該生該補堂格寫入到課宣告（`student_makeup`，池跟**請假原班**年級）。直寫 SQL 不必另插宣告，但完成後須核對該格有 active 宣告；不要只改請假表就當完成。跨年級調堂扣原班已繳堂數，不扣宿主班年級。

`schedules`：日期欄係 **`scheduled_date`**（不是 `date`）。時間存 `HH:MM` 或 `HH:MM:SS` 皆見，查詢用 `in.(17:45,17:45:00)`。

### 完成回覆表

| 排程 | 學生 | 日期時間 | 課室 | 對應請假紀錄 |
| --- | --- | --- | --- | --- |
| `{宿主代碼}` | `{姓名}` | `{YYYY-MM-DD HH:MM-HH:MM}` | `{課室}` | `{原班} {請假日}`（事由） |

註明：宿主就讀人數、點名紙會見到邊啲原班生（如有）。

---

## B. 試堂

表：`trial_sessions`（`schedule_id`＋`trial_date`＋`class_id`＋`payment_id`…）。

### 新排試堂

1. 查學生、是否已有未結案試堂、是否已就讀該班（已就讀 → 唔好再建試堂）。  
2. **科目必須明確**。用戶只講年級＋時段 → 列出該格現有中六／該年級堂；多過一科或零科 → **停、問**。  
3. `insert`：`status=已預約`、`trial_type`（原價試堂／半價試堂／免費試堂）、`counts_toward_headcount` **手選**（用戶未講：收費試堂預設 `true`，回覆講明）。  
4. **一定要出學費單**（含 $0）。未出單／未確認 → 政策上不上點名紙。見 `docs/playbooks/frontdesk/TRIAL_RECEIPT_FRONTLINE.md`。

### 半價試堂出單（易錯）

| 欄位 | 正確 | 錯誤 |
| --- | --- | --- |
| `payment_details.amount` | **正價**（如課價 300） | 只填 150 |
| `payments.subtotal_amount` | 正價 | 半價 |
| `payments.total_amount` | 實收半價 | 同正價 |
| 優惠 | 目錄「試堂半價（50%）」＋`payment_discount_applications.amount_deducted` | 無優惠列、直接改金額 |
| `trial_type` | `半價試堂` | 原價試堂 |

付款方式必須用系統預設字串（`PAYMENT_METHOD_PRESETS`）：**`銀行轉帳`**（帳），不是「銀行轉賬」。

### 收款狀態

- 用戶未講已收／確認 → 出單用 **`待收款`**，`payment_method` 可空。  
- 用戶說「確認收款」→ 改 **`已收款`**，填付款方式；並做試堂權益抬池（見下）。  
- 用戶說「還未收款」而誤標已收款 → **改回待收款**，清付款方式。

### 確認收款後抬池（必做）

對齊 `topUpEntitlementsForPayment`（試堂、無就讀報讀）：

1. 若該 `payment_detail_id` 尚無 `entitlement_consumption_events.reason=entitlement_top_up`：  
2. 確保有池：`student_entitlement_pools`  
   - `course_group='trial'`  
   - `namespace_key='class:{class_id}'`  
   - `source_enrollment_id=null`  
   - `academic_year_id`＝該班學年  
3. `initial_lessons`／`remaining_lessons` 各 **+lesson_count**  
4. 寫 `entitlement_consumption_events`：`delta_lessons=+n`、`reason=entitlement_top_up`、`payment_detail_id` 已填

### 試堂改期

程式 `rescheduleTrialSession`：**已取消／已有結果**不可改期；且新排程必須**同一 `class_id`**。

實務：原堂因導師請假取消 → 試堂常已 `status=取消`。正確做法：

1. 同一班揀新 `schedules`（未取消、未來日）。  
2. **更新同一筆** `trial_sessions`：`schedule_id`、`trial_date`、`status=已預約`；**保留 `payment_id`**。  
3. `remarks` 可註「由 YYYY-MM-DD 改期（原堂導師請假）」。  
不要另開第二筆試堂令收款單孤兒化（除非用戶要求新單）。

---

## C. 查庫注意

- REST query 含中文必須 `urllib.parse.urlencode`（否則 `ascii` codec 炸）。  
- `leave_makeup_records` 原堂欄係 **`schedule_id`**。  
- `schedules` 日期係 **`scheduled_date`**。  
- 多句 SQL 經 REST 可能只回最後一句；分次查。  
- 學生姓名庫內或有尾隨空白／tab（如 `莊凱茵\t`）→ `like`／精確查都要核對 `id`。

---

## D. 本對話錯題摘要（必避）

1. **口頭取消日 ≠ 該生原班取消日** → 先查該班 `schedules`，對唔上就停問。  
2. **補堂掛原班** → 其他就讀生上紙；要改掛 0 人宿主或確認全班都補。  
3. **同年級無空宿主就硬停／亂掛有人班** → 可問；或用同科 0 人其他年級並講明。  
4. **半價只填實收** → 會計唔到優惠；必須正價＋50% 優惠列。  
5. **未收款標已收款** → 點名紙／堂數提前生效；未收先用待收款。  
6. **確認收款唔抬試堂池** → 點名扣堂可能對唔上；確認後補 pool＋top_up event。  
7. **已取消試堂走正式改期 API** → 會拒；應原地改 `schedule_id`／復「已預約」。  
8. **付款方式用錯字「轉賬」** → 用預設「銀行轉帳」。

詳細欄位樣板見 [reference.md](reference.md)。
