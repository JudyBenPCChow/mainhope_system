# 已繳堂數帳本（審閱定稿）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `in_progress`（已套用 production schema；畫面須隨此次部署；未重算 22 口） |
| 優先 | 中 |
| 日期 | 2026-11-16 |
| 範圍 | 常規學年 `2627` 起的專科已繳堂數。暑期 `26SM` 不遷。功課輔導班不走這套結餘 |
| 來源 | 11-15 審閱稿＋IT 專家覆核＋2026-11-16 日常／對抗性模擬；產品確認人手更正僅外星人（維持 M19） |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) 進行中 |
| 相關 | [權益池 v3](./entitlement-pool-per-student-v3.md)、[單據／權益更正頁](./payment-entitlement-correction-ui.md)、[更正申請制（本輪不開工）](./entitlement-correction-approval.md)、[討論手記](../../meta/handoffs/2026-11-15-entitlement-balance-events.md)、[P0-1 M19](./p0-1-authorization-decisions.md) |

畫面與營運用語稱「已繳堂數」。程式識別字維持英文。上線當日不把 22 口尚餘改成流水合計。

## 1. 一句

尚餘不是給人改的欄。它是帳本算出來的快取。任何人（含外星人）要動合計，只能插入一筆不可改寫的差額事實；資料庫在同一交易內用函式本地 GUC 投影尚餘。登入者與 `service_role` 的 Data API PATCH 尚餘、插入非 0 的池、改寫或刪除舊流水，一律拒絕。表擁有者／MCP 不在此模型內，agent 只准插流水。

這對齊 Stripe Customer Balance／Billing Credits，以及本系統作廢學費單已用的 `app.payment_void_command` 閘。不採用複式記帳，也不刪 `remaining_lessons` 改每次 SUM。

## 2. 相對 11-15 審閱稿：採納與必須改掉

採納：流水是真源；尚餘是 O(1) 快取；事件只帶差額；同一交易投影；負數合法；欠費仍上紙；不開工申請制；兩張流水表本輪不合併；上線前先出對照再重算。

必須改掉（照原文實作會擋不住或會弄壞點名）：

1. **不要用 `pg_trigger_depth() = 0`。** 使用者 UPDATE 時觸發器內深度是 1，條件幾乎永不成立。改複製作廢單的 GUC（`app.entitlement_projecting`），觸發器 `ENABLE ALWAYS`。
2. **不要加 `(attendance_detail_id, reason)` 唯一鍵。** 「現場 → 病假 → 現場」會撞第一次 `consumed`。改為對該筆出席做淨額對帳。
3. **作廢真源是 Edge + `void_payment_apply`，不是 `void_payment_command`。** 兩者目前都不退堂。退堂必須併入真正的作廢交易，兩條入口都呼叫同一內部函式。
4. **人手更正僅外星人**（已確認，維持 M19）。行政開錯單走作廢／重開。11-15 稿「建議行政／管理層也可交更正事實」作廢。
5. **流水必須禁 UPDATE／DELETE**；鑄池 INSERT 非 0 必須拒。只監聽 INSERT 不夠。
6. **重算不可插入對帳列**（代數上仍會裂）。用重算 GUC 把欄設成該口 SUM，另寫稽核。
7. **`initial_lessons` 只投影收款事實**，不夾 0；調動只動尚餘。
8. 執行期併池、前台 agent skill 的絕對值寫入，同一輪改掉。
9. **投影器與「只插流水、不再寫尚餘」必須同一則 migration。** 先開 `AFTER INSERT` 投影、舊畫面仍 PATCH 再插事件，會把堂數加兩次。
10. **確認收款必須與加堂同一交易**（待收款→已收款含收據號＋top_up）。不可先改狀態再呼叫「只處理已收款」的函式。
11. **`REVOKE` 流水 INSERT 是必須，不是理想。** 只收老師空 `schedule_id` 不夠：職員 `attendance.take` 仍可插 `entitlement_top_up` 且 `payment_detail_id` 為空。
12. **`initial_lessons >= 0` CHECK 保留。** 已收不可負；剩餘可負。作廢只沖已有 top_up，代數上不會把已收推負。刪掉應用程式的 `Math.max(0, …)`，越沖則整筆交易失敗。混級口若 `initial` 與入帳流水不符，重算時把 `initial` 設成 top_up＋clawback 合計。

## 3. 注意事項（不可偏離）

1. Production 行為在落地前仍是瀏覽器讀改寫絕對尚餘。本文是定稿方案，不是現況。
2. 尚餘不是點名紙入場條件。餘額 0 或負數，學生仍可上紙。
3. 暑期 `26SM` 永遠走舊路徑，不鑄已繳堂數池。
4. 功課輔導班客戶端鑄池已略過；本輪不遷。
5. 作廢學費單不准 Data API 把狀態改成作廢；堂數退回必須與作廢同交易。
6. 流水不可改寫。更正是再插入反向或調整事實。
7. 負數尚餘合法。重算與投影都不可把負數改成 0。
8. 申請制不做。另題 `entitlement-correction-approval.md` 仍是 `open`。
9. **不要先收 UPDATE 再補函式。** 確認收款與作廢會變成錢已入帳、堂數沒加上。
10. 上線重算會令追收數字變大。這是把少追的堂補回帳上，不是新收費規則。必須先出對照給營運過目。
11. `service_role` 不受 RLS 約束。尚餘必須在欄位層拒絕非投影寫入，並收回欄位 UPDATE。不要宣稱 postgres 擁有者無法 `DISABLE TRIGGER`。
12. 混級 `class:` 口**不要與年級口加總**。各口只對自己的流水重算。22 口不是一律下降（見 §11）。

## 4. 現況（2026-11-16 唯讀）

口徑：`remaining_lessons − Σ consumption_events − Σ adjustments`，應為 0。

2627 全部池 166 口中，專科仍有 **22 口對不上、合計偏高 58 堂**（與 11-15 相同）。試堂、功輔目前對得上。11-15 曾見的 1 口偏低已不在。

- 年級專科：91 口，19 口偏高，+56 堂。
- 混級 `class:` 專科：16 口，3 口偏高，+2 堂。
- 負數尚餘 12 口：合法，重算維持負數。
- 年級專科的 `initial_lessons` 目前等於 top_up＋clawback 合計。

寫入路徑現況（落地前）：

- 點名：`apply_attendance_entitlement_delta` 鎖列、改尚餘、插事件，同一交易；內層吞例外；無出席淨額對帳；客戶端先寫出席再 RPC。
- 確認收款／作廢退堂／人手增減／搬堂：瀏覽器讀尚餘、寫回絕對值、再插流水，非同一交易。收款／作廢已有 `(payment_detail_id, reason)` 唯一鍵；衝突當成成功、不收回已改的尚餘。
- 作廢畫面：Edge `void-payment` → `void_payment_apply`（只改單據＋轉介），成功後才跑 `clawbackEntitlementsForPayment`。
- 老師 RLS 可 UPDATE `remaining_lessons`；可 INSERT `schedule_id` 為空的消耗事件。
- 鑄池應用程式寫 0／0；Data API 仍可插入非 0。
- 前台 skill 教 agent 對 remaining 做 +n（服務金鑰）。

## 5. 機制

```text
老師點名／行政確認收款或作廢／外星人更正
        │
        ▼
  只經 SECURITY DEFINER command INSERT 流水
  （差額 + 原因 + 冪等鍵；禁止送絕對尚餘）
        │
        ▼
  同一交易：投影器 set_config('app.entitlement_projecting','1')
            remaining_lessons += delta
            （top_up／clawback 同步改 initial_lessons）
        │
        ▼
  直接 UPDATE remaining／initial、INSERT 非 0 池、
  UPDATE／DELETE 流水 → 資料庫拒絕（含服務金鑰）
```

尚餘欄保留，給學費追收 O(1) 讀。真源是：

`Σ entitlement_consumption_events.delta_lessons + Σ entitlement_pool_adjustments.delta_lessons`

鑄空池時兩者都是 0，無需開帳列。

### 5.1 事實種類

| 入口 | 提交的事實 | 寫入 | 冪等 |
| --- | --- | --- | --- |
| 老師點名 | 該筆出席的計費淨額應對齊庫內現況 | `entitlement_consumption_events`（`entitlement_consumed`／`entitlement_reinstated`） | 鎖出席列＋該口池；目標淨額 − 已有淨額；差額為 0 則不插列 |
| 確認收款 | 該筆已收款明細的堂數 | 同上（`entitlement_top_up`） | 已有 `(payment_detail_id, reason)`；`ON CONFLICT DO NOTHING` |
| 作廢單據 | 與作廢同一交易內退堂 | 同上（`entitlement_clawback`） | 已有；只准沖先前該明細的 top_up |
| 人手增減 | 「因何事加減 n 堂」 | `entitlement_pool_adjustments` | 一筆一 id；必填原因碼與備註；僅外星人 |
| 搬堂 | 來源 −n、目標 +n、同一批次 | 兩列 adjustments | 兩口按 id 排序上鎖後插入 |

點名繼續走 `apply_attendance_entitlement_delta`，改為只插入流水（由投影器改尚餘），失敗必須上拋。

事件種類約束（CHECK，不只 RLS）：

- `entitlement_top_up`／`entitlement_clawback`：必須有 `payment_detail_id`；正負號分別為正／負。
- `entitlement_consumed`／`entitlement_reinstated`：必須有 `attendance_detail_id` 與 `schedule_id`。
- 收款／作廢／點名只寫 `entitlement_consumption_events`；人手／搬堂只寫 `entitlement_pool_adjustments`。同一經濟事實禁止兩表都插（對帳加總不會叫，因為兩邊都有數）。

### 5.2 資料庫閘

1. **投影。** `private.project_entitlement_delta`（`SECURITY DEFINER`，表擁有者）在函式頭用 `SET app.entitlement_projecting = '1'`（函式結束含錯誤會自動還原；不要靠手動清 0，亦不要第三參 `false` 的 session SET）。然後 `remaining_lessons = remaining_lessons + NEW.delta_lessons`（入帳類同步 `initial_lessons`）。由兩張流水表的 `AFTER INSERT` 呼叫。函式與畫面都不直接 UPDATE 這兩欄。SQL 用 `remaining = remaining + delta`（列鎖），不要先讀變數再寫。
2. **拒絕直改。** 池 `BEFORE UPDATE`：兩欄有變，且（GUC 不是 `'1'` **或** `pg_trigger_depth() < 2`）→ `RAISE`。雙條件：GUC 防其他觸發器；深度防使用者直改（深度 1）。`ENABLE ALWAYS`。另 `REVOKE UPDATE (remaining_lessons, initial_lessons)` 含 `service_role`。
3. **鑄池。** `BEFORE INSERT`：兩欄必須為 0。重算走獨立函式，不開放「INSERT 非 0」。鑄池只 `INSERT 0,0`，唯一鍵衝突則重讀；禁止 PostgREST upsert 尚餘欄。
4. **流水不可改寫。** 兩張流水表 `BEFORE UPDATE`／`BEFORE DELETE` → `RAISE`（`ENABLE ALWAYS`）。冪等只准 `ON CONFLICT DO NOTHING`，不准 `DO UPDATE`。
5. **鎖。** command 內對該口 `SELECT … FOR UPDATE`（搬堂則兩口按穩定 id 順序）。點名另鎖該筆 `attendance_details`。刪點名時列可能已不在：目標淨額視為 0，仍須能插入 `reinstated`。
6. **冪等。** 收款／作廢插入用 `ON CONFLICT DO NOTHING`。沒有新列，投影器不動尚餘。點名用淨額。
7. **作廢原子。** `private.clawback_entitlements_for_payment` 由 `void_payment_apply` **與** `void_payment_command` 呼叫。`alreadyVoided=true` **仍跑**冪等 clawback（今日無「已作廢未退堂」列，但 rollout 空窗與重試必須修）。
8. **`ending_remaining`。** 由投影器 `UPDATE … RETURNING remaining_lessons` 回寫該列，不要讓 command 先填。
9. **`created_by`。** Edge 作廢以 `service_role` 呼叫，`auth.uid()` 為空。用 `p_actor_email` 對到 `app_users.id`；對不上則允許空並另存 email，或系統 UUID。不要做成單純 `NOT NULL` + `auth.uid()`。
10. **Data API（必須）。** 對 `authenticated` 與 `service_role` 收回兩張流水表 INSERT／UPDATE／DELETE，以及池 remaining／initial 的 UPDATE／DELETE；只留表擁有者 DEFINER。`REVOKE TRUNCATE`。池有流水則 FK `ON DELETE RESTRICT`；無流水的空口 DELETE 亦禁（除非另文寫清例外）。
11. **事件單位。** `delta_lessons` 必須為非 0 整數（或產品若准半堂則寫清）。忽略客戶端 `p_lesson_units`：一列排程＝1 堂；連堂＝兩列出席、兩筆淨額。

重算：`private.recalculate_entitlement_pool(p_pool_id uuid)` 只接受池 id，內部 `SELECT SUM`，不接受呼叫端傳入的 n。不授 `authenticated`。一次性由 agent／postgres 跑。寫 `mgmt_audit_log`。`initial_lessons` 設成該口 top_up＋clawback 合計（保留 ≥ 0 CHECK）。

### 5.3 點名淨額（必做）

現行函式用客戶端 `p_previous_status`／`p_next_status`。同一狀態再存是 no-op；兩個請求都帶「由未計費改計費」仍會扣兩次。

改為：

1. 鎖該筆 `attendance_details`（若列仍在）與目標池。
2. 以**庫內現況**是否計費為目標淨額（計費則 −1，否則 0）。**忽略**客戶端 `p_lesson_units`。連堂是兩列排程各扣 1，不是一列 ×2。
3. `SUM` 該 `attendance_detail_id` 既有 `entitlement_consumed`／`entitlement_reinstated`。
4. 只插入「目標 − 已有」；為 0 則 return。
5. 找不到池：維持通知外星人；**寫入失敗必須上拋**，不可 `EXCEPTION WHEN OTHERS` 吞掉。畫面已有 `AttendanceSideEffectError`。重試因淨額安全。

尚餘＝流水 的對帳**看不到**「出席已是計費、事件淨額 0」（兩邊都沒扣）。持續對帳須另加：計費出席 vs 該 `attendance_detail_id` 事件淨額。

「出席與扣堂同一 Postgres 函式」列為後續，本輪不強制。

### 5.4 確認收款 command

新 DEFINER 函式必須在**同一交易**內完成：待收款／待繳費 → 已收款（含收據號）＋各明細 top_up。不要先 `UPDATE payments.status` 再另一次 RPC 加堂。現行 `markPaymentReceived` 正是這種拆法。

- 堂數以明細 `lesson_count` 為準（integer）。
- **組別／namespace 在伺服器端解析**（試堂走 trial 池；正課走年級或混級規則）。不要信任客戶端池 id。
- 功課輔導班、`26SM` 略過（這些明細不入專科帳，但單據狀態仍一併確認）。
- 堂數 > 0 且屬本帳本範圍、卻無法入帳：整筆確認失敗並回滾狀態，畫面可見。不可 `console.warn` 後當成功。
- 歷史已收款卻未入帳的單（例如張馨文 `MX-RC-20261016-0004`）**不會**因新 command 自動補鑄。上線前由營運作廢或補入帳，與「鑄不到就失敗」分開處理。

### 5.5 `initial_lessons`

產品 D9：已收＝已確認收款堂數；剩餘＝已收 − 已扣 ± 更正。

- `initial_lessons` 只由 `entitlement_top_up`／`entitlement_clawback` 投影。保留資料庫 `CHECK (initial_lessons >= 0)`。不在應用程式 `Math.max(0, …)` 默默地板。
- 調動／搬堂只改 `remaining_lessons`。
- 點名不改 `initial_lessons`。
- 混級口若最初入帳 ≠ 入帳流水（2026-11-16：林芍延 10 vs ＋3），重算把 `initial_lessons` 設成該口 top_up＋clawback。

### 5.6 授權

約束的是事件種類，不是合計欄。合計沒有入口。

| 事實 | 誰可提交 | 約束 |
| --- | --- | --- |
| 扣堂／退回 | 有點名權，且可寫該堂（老師或職員） | 必須綁該堂／該筆出席；禁止空 `schedule_id` 加堂 |
| 確認收款加堂 | 能確認該張單的人 | 只准對已收款、未作廢明細 |
| 作廢退堂 | 能作廢該張單的人（含 30 分鐘第二人；外星人無時間窗維持現況） | 只准沖先前 top_up |
| 人手增減／搬堂 | **僅外星人**（`entitlements.correct`） | 必填原因碼與備註 |

`/PaymentCorrection` 仍可讓有 `payments.void` 的行政進入（作廢／重開）。增減／搬堂控件只顯示給 `entitlements.correct`。不要把該能力授給行政。

老師點名改走 RPC 後，刪「老師只可改 `remaining_lessons`」的 UPDATE 政策。

### 5.7 畫面、skill、執行期併池

瀏覽器不再讀尚餘再寫回絕對值。

- 確認收款 → 只呼叫「改狀態＋加堂」同一 command，畫面不再先 PATCH `payments.status`
- 作廢 → 只呼叫已含退堂的 apply／command（含 alreadyVoided 重試）
- 更正頁增減／搬堂 → 只送差額、原因碼、備註
- [`.cursor/skills/frontdesk-makeup-trial-ops/SKILL.md`](../../.cursor/skills/frontdesk-makeup-trial-ops/SKILL.md) 改為呼叫 command，禁止對 remaining +n
- `mergeLegacyGradePoolsIntoClassScoped`：欄位閘一開，絕對值相加會失敗。本輪停用執行期絕對值合併，或改成只重掛宣告（不改尚餘）。禁止無流水地加減 remaining

### 5.8 歷史 22 口

欄位拒絕打開後，**每一口對自己的流水**把尚餘設成 SUM（年級 19 口＋混級 `class:` 3 口各自算，互不加總）。這是補歷史，不是日常流程。

重算前必須產出對照（學生、年級或 `class:`、現尚餘、帳本合計、差額、對追收的影響）給營運過目。寫入走重算 GUC＋`mgmt_audit_log`＋agent 改庫通知，不往流水插假事件。

對照必須標出（模擬已見、不是一律「尚餘下降／追收變嚴」）：

- 梁景維混級一口尚餘 −2、流水 −1，重算會**升高**；兩口均已退讀，不入追收。
- 朱震軒尚餘 27→21 後仍覆蓋本期＋下期，追收建議維持 0。
- 葉梓軒有一筆空 `schedule_id` 扣堂；重算會承認它。池無 `class_id`。
- 林芍延共用口含外星人 −5 堂更正；混級口 `initial` 不符。

其後持續對帳：

- 尚餘 ≠ Σ 流水 → 告警。
- 計費出席 vs 該出席事件淨額 → 告警（修「點了名但沒扣堂」）。

## 6. 實作順序（不可對調）

產品（2026-11-16）：**先套新模式，約兩日後才重算這 22 口。** 上線當日不把尚餘改成流水合計。這兩日追收這 22 口仍會按偏高的尚餘少追；新點名／收款只在現有尚餘上加減，差額大致固定，不會再用絕對值覆蓋。

1. 只讀對照給營運過目（第 12 節）；不寫庫。
2. **同一則 migration：** command／RPC 改為只插流水（點名淨額、收款狀態＋top_up 同交易、作廢含 clawback）**並且**啟用投影器。不可先開投影、舊寫入仍改尚餘。
3. 畫面與 skill 必須在該 migration 部署的同一發布切換；舊 bundle 若仍 PATCH 尚餘，欄位拒絕應已打開，令舊路徑失敗可見，而不是雙記入帳。
4. 打開欄位拒絕＋`REVOKE`；鑄非 0 池亦拒；刪老師只改尚餘政策；用老師／行政 JWT 與 `service_role` 試 PATCH，確認被拒。
5. **約兩日後**營運過目，再重算（含混級 `initial`）。重算必須用**當日**該口 `SUM`，不可把第 12 節的 11-16 數字當絕對值填回去。持續對帳在重算前可忽略已知這 22 口，避免當告警風暴。

欄位拒絕可以與第 2 步同一則 migration（較安全），或緊接在畫面發布之後。**投影器絕不可早於「停止寫尚餘」。**

## 7. 改完應有的結果

- 老師點名：計費則尚餘減少並留下扣堂事實。切換事假／病假再改回現場，淨額正確。老師不能把尚餘改成任意數字。扣堂失敗時畫面顯示未完成，重試不會雙扣。
- 確認收款、作廢：狀態與堂數同一交易；重試作廢仍會冪等退堂。
- 人手更正：只有外星人能提交「因何事加減 n 堂」。行政走作廢／重開。
- 兩人同時交事實：兩筆都留下，尚餘等於合計。
- 學費追收的尚餘等於入帳 − 扣堂 ± 有紀錄的更正。
- 直接 PATCH `remaining_lessons` 被拒絕（登入者與 `service_role`）。
- 已對不上的 22 口，重算後與自身帳本一致。負數維持負數；個別口尚餘可能升高。

## 8. 實作時必測

| 案例 | 期望 |
| --- | --- |
| 尚餘 10，並行點名 −1 與收款 +4 | 兩筆流水都在，尚餘 13，不是 14 或 9 |
| 同一 `payment_detail` 重複 top-up | 仍一筆 +n；尚餘不加第二次 |
| 作廢走 `void_payment_apply` | 單據作廢與 clawback 同成或同敗 |
| 更正插入失敗 | 尚餘不變 |
| authenticated 與 service role PATCH `remaining_lessons` | 被拒 |
| INSERT 池 remaining=40 | 被拒 |
| 老師對空 `schedule_id` 插正數事件 | 被拒 |
| 行政呼叫 G2 RPC | 被拒 |
| 行政／老師 Data API INSERT `entitlement_top_up` 且無 `payment_detail_id` | 被拒 |
| 同一出席：現場 → 病假 → 現場 | 三筆流水，淨額 −1，不是唯一鍵衝突 |
| 並行兩次「未計費 → 計費」 | 只扣一次 |
| 點名 RPC 傳 `p_lesson_units=999` | 仍只扣 1 |
| 尚餘為 −2 的口做投影／重算 | 維持 −2 |
| 重算代數 | remaining 設成 SUM，流水列數不變 |
| 先開投影、舊 top-up 仍 PATCH 再 INSERT | 測試必須失敗（雙倍）；發布順序要防住 |
| `alreadyVoided` 重試 | 補上缺失的 clawback，不重複退 |
| 確認收款 command 在加堂失敗時 | 單據狀態回滾，不是已收款無入帳 |

現有測試覆蓋命名空間與點名 RPC 呼叫形狀，**沒有**針對收款加堂／作廢退堂／並行覆蓋／唯一鍵衝突回滾。本題實作時要補。

## 9. 本輪不做、已知穩定風險

帳本修好後仍可能讓營運以為系統亂，另題處理：

- 追收讀 `remaining_lessons` 未翻頁（[postgrest-complete-read](./postgrest-complete-read.md)）。
- 畫面與追收 PDF 口徑分叉（[operational-rule-single-source](./operational-rule-single-source.md) 組 1）。
- D8 退學滿 3 個月作廢剩餘：v3 已拍板，本輪只預留 reason，不開工。
- G2c 轉讓雙方家長確認未做。
- 私人課程不切權益閘、一對二共用餘額未產品化：本輪範圍外。
- 同一 `makeup_of=` 兩次加堂導致雙扣（健康稽核 P1-3）：標記本身不准刪；不是帳本寫入模型。
- 追收把「年級碼池且 `class_id` 為混級班」別名到 `class:` 鍵：現況 0 口坐在混級班上，未雙計。本輪不拆這層別名，對照時核對。
- 張馨文 `MX-RC-20261016-0004` 已收款試堂未入帳：與新 command 分開，上線前營運決定作廢或補入帳。

## 10. 上線配套

畫面與 skill 須與 migration 同一發布切換。舊 bundle 若仍把單據改成已收款再 PATCH 尚餘，狀態閘與欄位拒絕會令路徑失敗可見。約兩日後才重算 22 口。

## 11. 2026-11-16 模擬與對抗性檢查（已納入上文）

日常模擬（production 真實個案）與對抗性靜態審查後，定稿已吸收下列原未寫清的點：發布順序防雙記入帳、確認收款與加堂同交易、`REVOKE INSERT` 必須、作廢 `alreadyVoided` 仍 clawback、點名單位不信客戶端、保留 `initial_lessons >= 0`、重算函式不可接受絕對值、對帳含計費出席淨額。

仍須營運在對照過目時處理、但不擋機制開工的：張馨文 0004；22 口對照上標梁景維升高、朱震軒追收不變、葉梓軒空扣、林芍延混級 `initial`。

## 12. 22 口只讀對照（2026-11-16，未寫庫）

口徑：`尚餘 − (消耗事件 + 調動)`。重算後尚餘＝流水合計。年級口 `initial` 已等於入帳流水；混級三口有兩口 `initial` 不符，重算一併把 `initial` 設成入帳合計。追收建議未在此重跑整頁引擎；下列「追收」欄來自抽樣（已查庫期數庫存）或標「視本期還會扣」。

年級專科（19 口，尚餘合計偏高 56 堂）：

| 學生 | 編號 | 口 | 現尚餘 | 流水 | 差額 | 重算後尚餘 | 備註 |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| 蕭馥鎣 | 20261552 | S6 | 18 | 11 | +7 | 11 | 抽樣：建議收 8→15 |
| 朱震軒 | 20261623 | S6 | 27 | 21 | +6 | 21 | 抽樣：建議收仍 0 |
| 劉子軒 | 20261884 | S3 | 10 | 5 | +5 | 5 | 抽樣：建議收 3→8 |
| 羅善瀧 | 20261898 | S2 | 9 | 5 | +4 | 5 | |
| 莫麗琪 | 20261968 | S4 | 8 | 4 | +4 | 4 | |
| 趙佳鑫 | 20261593 | S6 | −1 | −5 | +4 | −5 | 負數維持；抽樣：建議收 19→23 |
| 林芍延 | 20261931 | S4 | 1 | −2 | +3 | −2 | 含調動 −5 |
| 羅兆斐 | 20261760 | S6 | 9 | 6 | +3 | 6 | |
| 蔡汶軒 | 20261711 | S6 | 10 | 7 | +3 | 7 | |
| 黃慧淇 | 20261853 | S6 | 8 | 5 | +3 | 5 | |
| 林藝涵 | 20261679 | S4 | 8 | 6 | +2 | 6 | |
| 梁天因 | 20261614 | S5 | 8 | 6 | +2 | 6 | |
| 潘子翹 | 20261922 | S3 | 6 | 4 | +2 | 4 | |
| 葉熙桐 | 20261498 | S6 | 14 | 12 | +2 | 12 | |
| 鄧宇童 | 20261778 | S3 | 8 | 6 | +2 | 6 | |
| 吳梓甄 | 20261970 | S6 | 4 | 3 | +1 | 3 | |
| 曾穎 | 20261489 | S6 | 0 | −1 | +1 | −1 | |
| 秦錦怡 | 20261979 | S1 | 8 | 7 | +1 | 7 | |
| 葉梓軒 | 20261899 | S4 | 4 | 3 | +1 | 3 | 含一筆空堂次扣堂 |

混級 `class:`（3 口，淨偏高 2 堂；不與年級口加總）：

| 學生 | 編號 | 現尚餘 | 流水 | 差額 | 重算後尚餘 | initial vs 入帳 | 備註 |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| 林芍延 | 20261931 | 2 | 0 | +2 | 0 | 10 vs 3 | 就讀中；重算 initial→3 |
| 梁景維 | 20261932 | 0 | −1 | +1 | −1 | 4 vs 4 | 已退讀，不入追收 |
| 梁景維 | 20261932 | −2 | −1 | −1 | −1 | 4 vs 0 | 尚餘升高；已退讀；initial→0 |

今日作廢單均已有對應 clawback（0 筆「已作廢未退堂」）。
