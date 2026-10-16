# 專家覆核：轉班與手誤清除後的到課宣告（方案審查）

對本檔的書面回覆見 [2026-10-07-enrollment-declaration-expert-review-response.md](./2026-10-07-enrollment-declaration-expert-review-response.md)。

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open` |
| 性質 | **覆核與方案審查。未拍板、未改程式、未清資料、未查 production** |
| 日期 | 2026-10-07 |
| 覆核對象 | [enrollment-declaration-transfer-and-purge.md](../../product/topics/enrollment-declaration-transfer-and-purge.md)（收窄後方案稿） |
| 上一份 | [2026-10-07-purge-enrollment-declaration-review.md](./2026-10-07-purge-enrollment-declaration-review.md)（討論與查庫紀錄） |
| 方法 | 閱讀本機工作樹程式與 `supabase/migrations`；交叉比對已拍板分題文件 |
| 未做 | 沒有查 production；沒有改任何程式；沒有動 §4–§5 任何殘留列 |


## 不要做

- 不要依本檔改程式、改文案、清資料。本檔是審查意見，不是施工單。
- 不要作廢或刪除張以諾中文 B、蔡曉朗中文 A、蔡曉朗中三數學 9 月 10 日的殘留宣告。
- 不要把本檔的建議當成已拍板；§11 的 D1–D6 仍待產品填。
- 不要把「已核實」以外的推論寫成事實。production 數字一律沿用原稿，未經本檔獨立覆核。


## 一句

方向對（三層分離、只作廢不足以解決、繼承必須改）。§8.2 的日閘應閘在**補回日**而非原堂日——理由是紙帳分離與 `class_all`，不是任何單一例子。另有 3 個阻塞級實作缺口、4 個未閉合的決策口，以及漏引的已拍板文件。

> **2026-10-07 修訂**：本節與 §1 原稱「用原堂日會令方案修不好林藝涵」。該標題**不成立**（林藝涵原堂日 2026-10-03 在退讀之後，兩種讀法都跳過她），已改寫。見 §1 與 §10 修訂紀錄。


## 0. 覆核方法與限制

本覆核以**程式與 migration** 為主要證據，全部在本機工作樹閱讀，可逐條覆驗。

**production 的庫內事實（原稿 §4 觸發例子、§5 全庫盤點）沒有獨立覆核**：本檔沒有查庫（憑證存取被沙箱阻擋，未繞過）。原稿與覆核稿的數字沿用；但凡結論依賴「原堂日期」或「277 筆殘留的組成」者，本檔會標明為未核實。

核實標記：

- **已核實** ＝ 有 `file:line` 證據，可當場覆驗。
- **未核實** ＝ 依賴 production 數字或推論。


## 1. 必修：§8.2 的日閘應閘在補回日，不是原堂日

§8.2 寫：只抄「該生在**原堂日期**通過報讀／退讀日閘」的人。

這句話有兩種讀法：

| 讀法 | 條件 |
| --- | --- |
| A：原堂日 O | 原堂日 O 落在報讀窗內 |
| B：補回日 M | 補回日 M 落在報讀窗內 |

**只有「原堂當日仍在讀、補回日已轉走」的人（蔡汶軒形狀）分辨得出 A 與 B。** 三個已知例子都分辨不出：

| 例子 | 原堂日 | 退讀生效 | 兩種讀法 |
| --- | --- | --- | --- |
| 張以諾中文 B | — | 無報讀覆蓋原堂 | 都跳過 |
| 蔡曉朗中文 A | — | 無報讀覆蓋原堂 | 都跳過 |
| 林藝涵 | 2026-10-03 | 2026-09-08 | 都跳過（10-03、10-04 都在退讀之後） |

> **2026-10-07 修訂：本節原標題為「用錯日期（會令方案修不好林藝涵）」，該標題不成立。** 經回覆稿舉證，林藝涵原堂日 2026-10-03、補回日 2026-10-04，兩者都在退讀生效日之後，**兩種讀法都會跳過她**。D2 仍應改為補回日，但理由是「紙帳分離＋`class_all`」，不是林藝涵。原稿 §4.4 只寫「10 月 3 日舊班整堂補回 10 月 4 日」，未明寫哪個是原堂日；回覆稿指補回備註寫「補回 2026-10-03」，該備註原文與排程 id 應留在紀錄，因為本節結論曾經取決於它。

### 讀法 A 是錯的，三條獨立理由

讀法 A 的問題不是「修不好某個例子」，而是**會造出紙上沒有、帳上有的人**。

1. **原稿 §7.1 自己給的理由就是讀法 B。** 該節說蔡汶軒不該被抄，理由是「點名紙有日閘，人不上紙」。紙的日閘閘在**那一堂**（補回日），不是原堂日。用讀法 A，蔡汶軒只要原堂日早於退讀生效日 2026-10-04，照樣被抄——與 §7.1 的結論直接相反。

2. **已拍板的 `roster_policy=class_all` 就是讀法 B。** [`nonstandard-scheduling.md`](../../product/topics/nonstandard-scheduling.md) §206-207 定明：取消後以「安排補堂」建立的補回堂＝**不可剔人、全體就讀生上紙**、固定 `class_all`。紙上的人是**當下就讀生**。「會上紙的人」正好等於「補回日閘通過的人」。用讀法 A 會做出「紙上沒有他、帳上有他」——正是 §7.1 抱怨的形狀。

3. **現有 helper 本來就是讀法 B。** `enrollmentPassesDateGates(enrollment, schedule)`（`src/services/scheduleRosterQueries.ts:405-421`）閘的是傳入那筆 `schedule.scheduledDate`。要實作讀法 A 得**另寫一套**，離開現有語意。

### 建議改寫

D2 改為「抄給**補回日**當日應在紙上的人」，並明寫**複用名冊同一支函式**（`rosterStudentsForSchedule` / `src/services/rosterEligibilityService.ts:52-54`）作唯一來源，讓「預覽／會上紙／會抄」三者同源。這同時滿足 §8.2 最後一句「預覽應與實際一致」。

**不要「過濾舊 `void` 再抄」**——改為按補回日名冊**重鑄**（re-mint）。取池不必讀 `void` 列，見 §10.3。

### 待補：分辨例的原堂日

三個已知例子都分辨不出 A 與 B（見上表）。唯一能分辨的是「原堂當日仍在讀、補回日已轉走」的形狀。

- **蔡汶軒那一堂的原堂日**——若要拿她當分辨例，必須補。**未核實。**
- **林藝涵**——已由回覆稿舉證（原堂日 2026-10-03、補回日 2026-10-04），不必再列為缺口。


## 2. 阻塞級實作缺口（方案未提，一落地就會踩）

### 2.1 手誤清除有一條真實可達的半途失敗路徑

**已核實。** `homework_tutoring_monthly_charges.enrollment_id` 是 **`ON DELETE RESTRICT`**（`supabase/migrations/20260824184500_homework_tutoring_product.sql:105`），而 `purgeMistakenEnrollment` 的刪除順序是 **出席 → 增退事件 → 選堂 → 報讀**（`src/services/studentQueries.ts:1869-1888`），報讀是最後一步。

手誤清除按鈕在名冊列上**沒有班種守衛**（`src/components/classes/ClassDetailView.tsx:2532-2534`，就在「退讀」旁邊的「其他操作」內）。

後果：功輔班有月費列時按手誤清除 → 出席已刪、稽核已寫 → 刪報讀 FK 失敗 → **留下「出席沒了、報讀還在」的半途狀態**。若照 §8.1 的「先作廢再刪」，失敗後就是 **§7.4 自己點出的形狀**：宣告已作廢、報讀仍在、狀態仍就讀中。

**§7.4 的假設情境有現成觸發器。**

第二條失敗向量：同一 helper 內有 `assertAcademicYearEditableForDate(hit.attendanceDate)`（`src/services/attendanceLifecycleQueries.ts:435`），在刪出席的迴圈中逐筆檢查學年鎖——出席跨已鎖學年時會刪到一半才 throw。

**建議**：§10 第 2 步寫明用哪一種交易方式。repo 內已有補償式 rollback 先例可抄：`insertEnrollment` 的 catch（`src/services/studentQueries.ts:1638,1654`）。或走單一 RPC。

### 2.2 整堂補回繼承同樣不是交易，且半途失敗無法重試

**已核實。** 順序是：新排程寫入（帶 `makeup_of=`）→ 作廢來源 active（`voidActiveDeclarationsForSchedules`）→ 批次插入新宣告。全程無交易（`src/services/scheduleMakeupQueries.ts:342,394`；`src/services/entitlementQueries.ts:960-986`）。

中途失敗留下：新排程在、來源 active 已被作廢、新宣告只插一半。**重試會被 `findExistingMakeupScheduleIds` 擋住**（UI 回「此取消堂已安排過補回排程，請勿重複建立」），只能改庫。

另兩點：

- 衝突偵測用**錯誤訊息字串比對**（`includes("attendance_declarations_active_schedule_student")`，`src/services/entitlementQueries.ts:677-688, 835-846`），不是 error code。
- 回傳筆數是 `toInsert.length`，不是實際插入數（`:987`）。

### 2.3 預覽與實際複製目前必然不一致

**已核實。** 兩者是完全不同的查詢：

| | 預覽「原應出席」 | 實際繼承 |
| --- | --- | --- |
| 位置 | `src/services/scheduleMakeupQueries.ts:162-191` | `src/services/entitlementQueries.ts:930-931` |
| 讀什麼 | active 宣告 ∩ 就讀中報讀 ∩ 日閘，**加**試堂與補堂生、**減**當日請假 | **active 或 void** 全部；無報讀、無日閘、無試堂／補堂過濾 |

所以 §8.2 最後那句「預覽應與實際一致」是**新增需求**，不是現況描述。

正確實作是「**一支函式、兩個消費者**」，不是修兩條查詢。目前繼承的回傳值被直接丟棄（`scheduleMakeupQueries.ts:394`），也沒有任何地方比對兩者。

### 2.4 退讀的作廢仍是靜默失敗，方案只修了手誤清除

**已核實。** `voidStudentDeclarationsOnClassFromDate` 失敗只 `console.error`，退讀照樣完成（`src/services/studentQueries.ts:1948-1956`）。但 §8.3 正是要把前線**推去用退讀／轉時間**。

修好手誤清除卻留著退讀 best-effort，等於推薦路徑比被勸退的路徑更不安全。應對稱納入 §10。


## 3. 決策口未閉合

### 3.1 D2 與 D3 邏輯綁死，決策表卻當成兩題獨立

**已核實（文件內部矛盾）。** §8.2 第二個分支允許「有未完成請假，且補堂排程指向**原堂**（或已改掛的新堂）」時抄宣告。但 §7.2 自己說：請假指向原堂時抄宣告＝人不上新紙、卻多一筆 `class_reschedule`、追收多計——「這是新問題」。

兩句直接打架。安全寫法：**只有已改掛到新堂的未完成請假才抄**，即該分支以 D3 為前提。若產品 **D2 同意、D3 不同意**，§8.2 會把 §7.2 剛指出的 bug 原樣放回。

另註（**已核實**）：補堂生上紙**只需要請假列，不需要宣告**（`src/services/rosterEligibilityService.ts:70-78`，來源 `leave_makeup_records.makeup_schedule_id`）。所以「紙＝報讀 ∩ 宣告」對補堂／調堂人口不成立；§2 的三層表要避免讓人以為宣告是上紙的必要條件。

### 3.2 「作廢全部有效宣告」與「保留出席」互相矛盾

**已核實。** 出席確認的第二選項，文案自己寫的是「**保留出席並清除報讀（將成孤兒）**」（`src/lib/enrollmentAttendanceConfirm.ts:73-77`）。若同時把該班全部有效宣告作廢（§7.4 要求含已取消堂），會得到**有計費出席、無宣告**。

**嚴重度下修（2026-10-07 修訂）。** 追收以 active 宣告為準，而 `enrollment_auto` 只在該班仍在就讀名單時才計（`src/services/tuitionChaseQueries.ts:170`）。手誤清除已經把報讀刪掉，該班本來就不在名單內——所以**這一堂收不到錢是「刪報讀」造成的，不是「作廢」造成的**；作廢只是沒有把它救回來。原文因果寫錯，回覆稿指正成立。

真正的麻煩是**孤兒計費出席**（文案自己寫「將成孤兒」），以及日後整堂補回時要如何處理。

需要一條規則：保留出席時，該堂的宣告是否一併保留；或文案要說清後果。

### 3.3 刪出席不退堂，而「已繳堂數池不動」是半真

**已核實。** `entitlement_reinstated` 全庫只在 `src/services/entitlementQueries.ts:1240` 寫（`applyEntitlementConsumptionDelta`），呼叫者只有點名儲存／roll-call 路徑。管理端單列刪出席（`deleteAttendanceDetailAsMgmt` → `deleteAttendanceHitsWithAuditOrThrow`）**不回沖**。

所以手誤清除預設刪出席 → **堂數池仍被扣**。

§9 說「不自動沖正已扣堂」是明確決定，可以接受；但 §8.1 新文案寫「**已繳堂數池不動**」就是半真——池的**餘額**確實動過了。要麼在刪出席時回沖，要麼文案改寫成「已扣堂數不會退回」。

另註（**已核實**）：`applyEntitlementConsumptionDelta` 本身**不要求有宣告**，只要求狀態轉為計費；off-roster 寫出席一樣扣池。

### 3.4 §8.4 把「繼承規則」當「清理規則」用

277 筆殘留要的是**墓碑條件**（「active 的 `enrollment_auto`，而該堂日沒有報讀覆蓋 → 作廢」），與「繼承時抄誰」是兩條不同條件。

§5 也沒有確認這 277 筆之中有沒有任何一列**旁邊掛著計費出席**。**未核實。**

**建議**：§8.4 加 dry-run 清單、逐列分類、寫稽核、清完做追收與點名紙前後對照。

### 3.5 新文案仍沒提「待補堂／請假」

**已核實。** `student_pending_lessons.enrollment_id` 是 `ON DELETE SET NULL`（`supabase/migrations/20260716120000_student_pending_lessons.sql:7`）——刪報讀後**列還在、狀態仍是「待補」**。

原稿 §1 自己列的四項未收窄（宣告、池、待補堂、請假），本案只收了兩項（宣告、池），漏了待補堂與請假。


## 4. 與已拍板文件的關係（漏引／需對齊）

| 檔案 | 已定內容 | 本案 | 關係 |
| --- | --- | --- | --- |
| [`makeup-special-cases.md`](../../product/topics/makeup-special-cases.md) M05 | 「正式補回堂**全班上紙、不可剔人**」 | §8.2（**改寫後**）＝抄補回日名冊 | **不是衝突，是對齊**（2026-10-07 修訂）：D2 改對之後正是在執行 M05，應**引用**它、不必重開。只有原 §8.2 的「原堂日」寫法才會與 `class_all` 分家 |
| [`makeup-special-cases.md`](../../product/topics/makeup-special-cases.md) **Y06** | 「**待補期間退讀、轉班或標畢業**」＝**待確認** | §4.4／§8.2 正是在決定這件事 | 本案**決定了別的 open 主題擁有的條目**，卻沒有互相引用 |
| [`transfer-class-time.md`](../../product/topics/transfer-class-time.md)（**done**，2026-09-05 關帳） | 「請假與補堂**跟舊班**」；「已約在新班尚未上的補堂：報讀第一堂必須晚於該日，該日仍以調堂上紙」 | D3／D4 | D4 重開已關帳決策，需明寫「重開哪一條」 |
| [`nonstandard-scheduling.md`](../../product/topics/nonstandard-scheduling.md) §206-207 | 補回堂固定 `roster_policy=class_all`、不可剔人 | §8.2 | 這是「紙從哪來」的權威定義，必須一併改 |
| [2627 營運指引](../../year/2627/ops-guide.md) §5.4 | 「舊班未完成補堂（已約或未約）准轉，但須確認；請假與補堂跟舊班」 | D3／D4 | 行政讀本，需同步 |

**建議**：§10 加一步「**引用並對齊** M05／`class_all`（**不重開**）；**輸入 Y06**（不假裝已關）；標明 D4 重開 `transfer-class-time.md` 哪一條；同步 `nonstandard-scheduling.md`、§5.4 與行政 playbook」。


## 5. 對原稿的事實修正

1. **§3.1「本身不寫 `mgmt_audit_log`」不完全。**
   刪出席那條分支**會**寫一列（`src/services/attendanceLifecycleQueries.ts:429-432`，`action: 刪除出席紀錄（生命週期）`，detail 含 `reason=purge_mistaken_enrollment`，並且**含學生 id、排程 id、出席日期、出席列 id**）。
   → 原稿搜到零列，是因為張以諾／蔡曉朗在殘留班**沒有出席**，`hits.length === 0` 時該 helper 直接 return（`:420`），所以根本沒寫。
   → **「零列」的結論成立，但成因要改寫**：不是「稽核不含識別碼」，而是「沒有出席就沒有稽核列」。
   → 附帶結論：報讀刪除本身**永遠不會**留下稽核列，即使有出席也一樣（那列記的是刪出席）。

2. **§3.1「確認後新出現的列不會被刪，清除仍會做完」有例外。**
   若確認的 id 全部已不存在、而仍有其他出席列，purge 會 **throw 並在四步刪除之前中止**（`src/services/studentQueries.ts:1842-1846`）。

3. **§2 的三層模型在 schema 沒有對應鍵。**
   `attendance_declarations` **沒有 `enrollment_id`、也沒有 `class_id`**（`supabase/migrations/20260804010000_entitlement_pools_and_declarations.sql:57-71`），與報讀之間只靠 `pool_id` 間接相連。「到課宣告跟這筆報讀走」目前是概念，不是外鍵。任何要「按報讀找宣告」的實作都要留意這點。

4. **沒有 void 原因可用。**
   表上沒有 `void_reason`／`voided_at`／`voided_by`；`manual_reason` 這個欄存在但**全庫從未寫入**（只有 SELECT）。繼承目前只能分辨 `active`／`void`／`superseded` 與 `source_event_type`。

5. **`deleteEnrollment` 是死碼。**
   `src/services/studentQueries.ts:1805-1810` 硬刪報讀、不作廢宣告，但**全庫無呼叫者**。要麼刪掉，要麼一併納入規則，不要留著等哪天被接上。


## 6. 補充建議：在作廢當下蓋原因（**不能取代日閘**）

§8.2 的日閘若閘在**原堂日**，在資料模型上**算不出來**（閘在**補回日**則算得出來——現行那一行就是答案）：

- `insertEnrollment` 重新報讀時**改寫同一行**——覆寫 `enroll_date`，並把 `withdraw_effective_date`、`withdraw_reason` 清成 null（`src/services/studentQueries.ts:1520-1596`）。歷史區間消失。
- 手誤清除把報讀列與增退事件**硬刪**，事後完全沒有歷史。
- 名冊 RPC 只回 `status='就讀中'` 的報讀（`supabase/migrations/20260811023000_trial_receipt_before_roster.sql:151`），已退讀的連日期都拿不到。

即「這名學生**原堂當日**是否在讀」是一個**在需要回答的時候已經不存在的資訊**。這是 D2 應改閘補回日的**第三個理由**（前兩個是紙帳分離、`class_all`），也是本節其餘建議仍然成立的原因。

**建議**：在作廢當下蓋原因——那時全部上下文都在手上。加 `void_reason`（或開始寫既有的 `manual_reason`）：

- 退讀 → `enrollment_withdrawn`
- 手誤清除 → `enrollment_purged`
- 老師請假／軟取消 → 維持現狀（`class_cancelled` 類）

**但不能單獨當繼承規則（2026-10-07 修訂，接受回覆稿的反例）。** 軟取消（老師請假）會先在該列蓋「堂取消」；學生**其後**才退讀——那一列的原因仍然是「堂取消」。繼承若只看原因，補回日他早已不在紙上，卻照樣被抄回來。原因是**作廢當時**的狀態，不會隨後續狀態改變而更新。

正確分工：**補回日名冊為準**（§1）；原因欄作**稽核**，並用來跳過「清除／退讀作廢」的 void。

好處：

1. 不必從被改寫過的現況反推歷史。
2. 可稽核、可解釋給行政。
3. §8.4 的清理與 D1 的作廢共用同一個標記。
4. 清理（墓碑條件）與稽核共用同一標記，不必另立欄位。

**定位：D2 的補充，不是替代。**


## 7. 建議改寫 §11 決策表

| ID | 題 | 建議 | 相對原稿的變更 |
| --- | --- | --- | --- |
| D1 | 手誤清除作廢該班全部有效宣告，與刪報讀同成敗或可回滾 | 同意 | 補：明寫交易方式；處理功輔 `RESTRICT`；「保留出席」時該堂宣告的去留 |
| D2 | 整堂補回繼承只抄**補回日**應在紙上的人（與名冊同源） | 同意（**改寫**） | 原堂日 → 補回日；改為按名冊**重鑄**、不過濾舊 `void`（§10.3）；請假分支以 D3 為前提 |
| D3 | 整堂補回改掛未完成調堂的補堂排程 | 同意改掛 | 需與 M05／Y06 一併更新 |
| D4 | 轉時間退讀生效日與新班第一堂分開填 | 同意 | 註明重開 `transfer-class-time.md` 哪一條 |
| D5 | 同科第二班先引導，硬閘等 D4 | 同意 | — |
| D6 | 規則落地後一次清理 §4–§5 殘留 | 同意 | 加 dry-run、稽核、追收前後對照 |
| **D7（新）** | 退讀的宣告作廢失敗是否一併改為中止／重試 | 同意 | 對應 §2.4 靜默失敗 |
| **D8（新）** | 作廢是否蓋 `void_reason`（**稽核與清理用，不取代日閘**） | 同意 | 對應 §6；2026-10-07 修訂：原題「繼承改讀原因而非日閘」**撤回** |
| **D9（新）** | 整堂補回與手誤清除的交易化 | 同意 | 對應 §2.1／§2.2 |


## 8. 建議改寫 §10 實作順序（拍板後）

1. **蓋原因**：作廢時寫 `void_reason`（退讀／清除）。
2. **繼承**：按**補回日名冊重鑄**（與名冊同源，不過濾舊 `void`）＋未完成且**已改掛**的請假；單測含林藝涵／張以諾／調堂生／預約退讀。
3. **手誤清除**：作廢該班全部有效宣告，與刪報讀**同一交易**；改文案；補稽核列；處理功輔 `RESTRICT`。
4. **退讀**：作廢失敗改為中止或重試（與第 3 步對稱）。
5. **整堂補回**：交易化；補堂排程改掛（若 D3 同意）；預覽與複製同源。
6. **轉時間**：退讀生效日可對齊「舊班最後一堂的下一日」或指定日；到期改已退讀（若 D4 同意）。
7. **引導**：同科已有就讀中專科時，提示改用轉時間（不先硬擋）。
8. **清理** §4–§5 殘留：dry-run → 稽核 → 清理 → 追收與點名紙前後對照。
9. **文件同步**：**引用並對齊** M05／`nonstandard-scheduling.md` 的 `class_all`（**不重開**）；Y06 標成**輸入**（不假裝已關）；標明 D4 重開 `transfer-class-time.md` 哪一條；同步 §5.4 與行政 playbook。


## 9. 待補事實（產品拍板前）

1. ~~林藝涵、蔡汶軒的原堂日~~ → **只剩蔡汶軒**。林藝涵原堂日 2026-10-03（補回備註），**已由回覆稿查庫補上，不再是缺口**；且兩種讀法都跳過她，她本來就不能當分辨例。蔡汶軒若要當分辨例才需要她那一堂的原堂日。（未核實）
2. **§5 那 277 筆之中，有沒有任何一列旁邊掛著計費出席**——決定 §8.4 清理能否直接作廢。（未核實）
3. **蔡曉朗中三 9-10 那筆在 D2 新規則下的定性**——沿用覆核稿問題 5。（未核實）


## 10. 修訂紀錄（2026-10-07，回應回覆稿）

對象：[`2026-10-07-enrollment-declaration-expert-review-response.md`](./2026-10-07-enrollment-declaration-expert-review-response.md)。本節只記「本稿改了什麼、為什麼」，不新增建議。

### 10.1 接受並已改寫（4 項）

| 原稿 | 回覆稿指正 | 本稿處置 |
| --- | --- | --- |
| §1 標題「用原堂日**會令方案修不好林藝涵**」 | 林藝涵原堂日 2026-10-03（補回備註），新堂 2026-10-04，退讀生效 2026-09-08——**兩種讀法都跳過她**，該例不能分辨讀法 | **撤回標題**。D2 改閘補回日的理由改掛在**紙帳分離**與 `class_all` 上；另補第三個理由：原堂日的狀態在資料模型上算不出來（§6），補回日算得出來 |
| §3.2「這一堂**收不到錢是作廢造成的**」 | 追收在人已不在就讀名單時本就不計該班 `enrollment_auto`；該班 `poolClassIds` 由 `就讀中` 建（`src/services/tuitionChaseQueries.ts:170`），報讀一刪就已排除 | **因果改寫**：這一堂收不到錢是**刪報讀**造成的，作廢只是沒有把它救回來。嚴重度下修；但「保留出席時該堂宣告留不留」仍須產品回答 |
| §4 M05 列為「與已拍板文件衝突」 | M05／`nonstandard-scheduling.md` 的 `class_all` 是「正式補回堂全體就讀生上紙、不可剔人」；D2 改抄**補回日名冊**正是在執行它 | **改為對齊**：應**引用** M05、不必重開（`nonstandard-scheduling.md:206-207` 一併對齊） |
| §6「**繼承只讀這個原因**」；「D2 的替代或補充方案」 | 軟取消先蓋「堂取消」，學生**其後**才退讀，那一列原因仍是「堂取消」；只看原因仍會把補回日不在紙上的人抄回來 | **降為補充**：補回日名冊為準，原因欄作**稽核**與跳過「清除／退讀作廢」的 void；D8 題目一併改寫（§7） |

### 10.2 維持不變

覆核稿下列結論回覆稿明確同意，或未提異議，維持原判：

- **阻塞級實作缺口**：功輔月費 `ON DELETE RESTRICT`（`supabase/migrations/20260824184500_homework_tutoring_product.sql:105`）＋手誤清除按鈕無班種守衛（`src/components/classes/ClassDetailView.tsx:2532-2534`）＝§7.4 半套狀態的現成觸發路徑；學年鎖在刪出席迴圈中途 throw（`src/services/attendanceLifecycleQueries.ts:435`）是第二條。
- **退讀作廢失敗只打 log**（`src/services/studentQueries.ts:1948-1956`）→ D7。方案稿 §3.2 寫了、§10 漏了。
- **預覽 ≠ 複製**（`src/services/scheduleMakeupQueries.ts:162-191` vs `:342,394`）——方案稿「預覽應與實際一致」是**新增需求**，不是現況描述。
- **繼承非交易、重試被擋**（`findExistingMakeupScheduleIds`）→ D9 施工項，**不擋 D1／D2 拍板**。
- **D2 與 D3 綁死**：§7.2 與 §8.2 打架；D3 不同意則繼承不應保留「請假指向原堂」分支。
- **§5 五條事實修正**（稽核列實含識別碼、確認 id 全失效會 throw、宣告表無 `enrollment_id`／`class_id`、無 `void_reason`、`deleteEnrollment` 死碼）。
- **墓碑條件 ≠ 繼承條件**；待補堂刪報讀後 `enrollment_id` 變空、狀態仍「待補」（`supabase/migrations/20260716120000_student_pending_lessons.sql:7`）。
- **單元測試清單**與 **§8 實作順序**（僅第 9 步改寫為「對齊 M05、輸入 Y06」）。
- **Y06 標成輸入**、**D4 明寫重開 `transfer-class-time.md` 哪一條**、**§5.4 與行政 playbook 同步**。

### 10.3 新增：重鑄（re-mint）取代「過濾 void 再抄」

回覆稿 §2.1 提議：與其過濾舊 `void` 再抄，不如**按補回日名冊重鑄**；軟取消後讀 `void` 只是為了繼承 `pool_id`，而池可按年級課程組取得。**接受**，並把可行性釘在程式上：

- **取池不必經宣告（已核實）**：`fetchPoolByNamespace`（`src/services/entitlementQueries.ts:223-239`）以 `(student_id, academic_year_id, course_group, namespace_key)` 直查 `student_entitlement_pools`；`fetchPoolForStudentClass`（`:990-1002`）由班別 context 取得 namespace。→ 重鑄路徑**不需要讀 void 列**。
- **衝突走既有路徑（已核實）**：`insertActiveDeclarationsIgnoringConflicts`（`:821-847`）以部分唯一索引 `attendance_declarations_active_schedule_student` 的**訊息字串**比對、逐列重試。重鑄必須走這條，不要另寫插入。
- **回傳值不要信（已核實）**：`inheritDeclarationsAcrossSchedules` 回傳 `toInsert.length`（`:987`），不是實插數——與回覆稿 §2.6 一致。

兩個實作前要釘的細節（**產品／工程擇一，本稿不代決**）：

1. **重鑄的 `source_event_type`**。整堂補回是**同班**，用 `enrollment_auto` 可讓學費追收不必依賴跨班規則；但跨班追收判斷現靠 `CROSS_CLASS_CHASE_DECLARATION_SOURCES = ["student_makeup", "class_reschedule"]`（`src/lib/tuitionChaseDetail.ts:12-15`）。若保留 `class_reschedule` 以留住「這筆來自補回」的線索，就要一併確認追收口徑；改 `enrollment_auto` 則要確認報表仍看得出補回來源。
2. **混級專科的 legacy 池**。`resolvePoolIdForStudentClass`（`:1004-1038`）特意**先讀該排程上的宣告**、讀不到才退回 namespace；`:241-243` 的註解說明歷史上存在年級碼池與 class 池並存、宣告仍綁舊池。純按 namespace 重鑄，在這種學生身上可能取到**另一口池**。整堂補回是同班同 namespace，正常情況安全；但重鑄宜**先讀舊列 `pool_id`，讀不到才退回 namespace**，不要反過來。


## 附錄：本覆核引用的程式位置

| 路徑 | 用途 |
| --- | --- |
| `src/services/studentQueries.ts:1520-1596` | `insertEnrollment`（重報改寫同一行） |
| `src/services/studentQueries.ts:1638,1654` | 補償式 rollback 先例 |
| `src/services/studentQueries.ts:1805-1810` | `deleteEnrollment`（死碼，不作廢） |
| `src/services/studentQueries.ts:1842-1846` | 確認 id 全失效時 throw |
| `src/services/studentQueries.ts:1869-1888` | purge 刪除順序 |
| `src/services/studentQueries.ts:1948-1956` | 退讀作廢靜默失敗 |
| `src/services/entitlementQueries.ts:677-688, 835-846` | 衝突以訊息字串比對 |
| `src/services/entitlementQueries.ts:912-988` | `inheritDeclarationsAcrossSchedules`（`:987` 回傳 `toInsert.length`） |
| `src/services/entitlementQueries.ts:223-239` | `fetchPoolByNamespace`（取池不必經宣告） |
| `src/services/entitlementQueries.ts:821-847` | `insertActiveDeclarationsIgnoringConflicts`（衝突跳過） |
| `src/services/entitlementQueries.ts:990-1002, 1004-1038` | `fetchPoolForStudentClass`／`resolvePoolIdForStudentClass`（先讀宣告再退回 namespace） |
| `src/services/entitlementQueries.ts:241-243` | 混級專科 legacy 年級碼池與 class 池並存 |
| `src/services/tuitionChaseQueries.ts:170` | `poolClassIds` 只由 `就讀中` 建 |
| `src/lib/tuitionChaseDetail.ts:12-15` | `CROSS_CLASS_CHASE_DECLARATION_SOURCES` |
| `src/services/entitlementQueries.ts:1240` | `entitlement_reinstated` 唯一寫入處 |
| `src/services/scheduleMakeupQueries.ts:162-191, 342, 394` | 預覽／補回加堂／繼承呼叫 |
| `src/services/scheduleRosterQueries.ts:405-421` | `enrollmentPassesDateGates` |
| `src/services/rosterEligibilityService.ts:52-54, 70-78` | 名冊日閘；補堂生靠請假列 |
| `src/services/attendanceLifecycleQueries.ts:420, 429-435` | 出席刪除稽核／學年鎖 |
| `src/lib/enrollmentAttendanceConfirm.ts:73-77` | 「將成孤兒」文案 |
| `src/components/classes/ClassDetailView.tsx:2532-2534` | 手誤清除按鈕無班種守衛 |
| `supabase/migrations/20260804010000_entitlement_pools_and_declarations.sql:57-76` | declarations 表與唯一索引 |
| `supabase/migrations/20260811023000_trial_receipt_before_roster.sql:151` | 名冊 RPC 只回就讀中 |
| `supabase/migrations/20260824184500_homework_tutoring_product.sql:105` | 功輔月費 `ON DELETE RESTRICT` |
| `supabase/migrations/20260716120000_student_pending_lessons.sql:7` | 待補堂 `ON DELETE SET NULL` |
