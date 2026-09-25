# 潛在客戶／廣告試堂公開頁

| 欄位 | 值 |
| --- | --- |
| 狀態 | `done` |
| 優先 | 中 |
| 範圍 | 多來源潛在客戶主檔；Meta 廣告公開試堂登記頁；試堂班別管理（舊生邀請＋廣告公開雙通道）；談妥後建非註冊主檔走既有試堂＋收款上紙 |
| 不含 | 訪客無主檔收款；自動改已註冊；一鍵正式報讀；官網留言公開表單（只預留來源）；與既有試堂邀請 token 合併；獨立「廣告試堂名單」頁；Meta pixel／UTM（可下波） |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) 進行中 |
| 盤點日期 | 2026-09-25 |
| 上次更新 | 2026-09-25（切塊 7：側欄改名舊生試堂邀請） |
| 開工閘 | 無硬依賴。與 [試堂邀請公開連結](./trial-invite-link.md) 並列，**勿合併** token／審核流程；班別控管可同頁雙開關。開工前先消化分題「模擬檢查」H1–H5 及「第二輪訂正」 |

## 結論

廣告客戶與「只查詢」人士先進**潛在客戶**，不建正式報讀生。要排試堂或收款時，建 **`students`＋`registration_status = 非注冊`**，再走既有 `trial_sessions` → 收款登記確認 → 點名紙／計人頭。正式報讀某班時才改 **已註冊**並建報讀。有主檔 ≠ 已註冊 ≠ 已報讀。

Meta 廣告用固定公開網址；可選班別／堂次用**廣告專用**控管欄（`ad_trial_listed`／`ad_trial_excluded`），與舊生邀請欄位分開、預設相反；職員界面合併為**試堂班別管理**（見「界面」）。

## 已定產品

### 生命週期

| 階段 | 存放 | 行為 |
| --- | --- | --- |
| 查詢／廣告登記／來電／前台代登 | `leads` | 姓名、學校、年級、聯絡、來源、備註；可附想試堂次 |
| 要排試堂／要收款 | `students`（`非注冊`）＋既有試堂／收款 | 從潛在客戶「建檔」；建 `trial_sessions`（手選 `counts_toward_headcount`）→ `/Payments` 確認 |
| 正式報讀 | 改 `已註冊`＋`student_class_enrollments` | 才算正式客戶；活躍名單靠報讀自動計算 |

```text
潛在客戶（leads）
  → 建檔（非注冊）→ trial_sessions＋計人頭手選 → 確認收款 → 點名紙見名
  → 正式報讀 → 已註冊
```

### 潛在客戶

- 多來源：`ad_trial`／`phone`／`front_desk`／`website`／`other`
- 首版入口：廣告公開頁提交；職員人手新增（電話／前台）
- 狀態建議：`new`／`contacted`／`converted`／`closed`
- `converted_student_id`：建檔後掛回；一鍵正式報讀另題
- **不做**訪客無 `student_id` 的收款（`payments.student_id` 必填）

### 廣告公開頁

- 固定路由（建議 `/AdTrial`），Layout 外，供 Meta 廣告連結
- 欄位：姓名、學校、年級、聯絡電話（WhatsApp）、備註（可選）
- 選堂：年級過濾 →（S4–S6 選修）→ 科目 → 班／堂次 → 確認；流程對照試堂邀請公開頁，但無 token／既有生身分
- 提交只寫 `leads`（＋試堂意向行）；**不**建學生、不建試堂、不出單

### 廣告公開目錄欄（資料與邀請分開；界面同頁）

- `classes.ad_trial_listed`（預設 **false**，職員逐班納入，避免公開誤開全校）
- `schedules.ad_trial_excluded`（預設 false）
- 職員界面：**擴充**現有 `/TrialInviteCatalog` 為**試堂班別管理**（側欄改名），同一頁並排「舊生邀請／廣告公開」開關；**不**另開 `/AdTrialCatalog`。權限同 `students.enroll`
- 公開自動隱藏：就讀中 ≥ 6 人（若保留）。**不做**已報讀同科／半年曾試（無學生身分）
- **與邀請不互佔**：不以「該堂已有邀請試堂」隱藏廣告目錄或拒絕廣告建試堂（見模擬檢查定案）
- 目錄：目前學年（`academic_years.is_current`）且 `class_kind ∈ {group, homework}`；不含私人課程；只列未來未取消堂

### 點名紙與計人頭（沿用現行，不另開通道）

上紙條件見 [`TRIAL_RECEIPT_BEFORE_ROSTER.md`](../../policies/enrollment/TRIAL_RECEIPT_BEFORE_ROSTER.md)／roster RPC：

1. 有 `trial_sessions`（綁學生＋該排程）
2. 已掛 `payment_id` 且 `payments.status = 已收款`（含 $0）
3. **不**檢查 `registration_status` → 非註冊主檔可上紙

計人頭：建試堂時手選 `counts_toward_headcount`；與收不收錢分開；人數／計糧跟此旗標。停在潛在客戶、或只建檔未確認收款 → 不上紙。

註冊語意見 [`STUDENT_STATUS_CLASSIFICATION.md`](../../policies/enrollment/STUDENT_STATUS_CLASSIFICATION.md)：試堂／查詢屬 `非注冊`；無報讀則預設「活躍」頁通常不出現；名冊仍可見（可另加篩非註冊／預設隱藏，非首版必做）。

## 界面（2026-09-25 定）

心智：**三條線分開，試堂本體只在「試堂紀錄」匯合。** 不另開「廣告試堂紀錄」或獨立「廣告試堂名單」頁。

### 側欄（學生與報讀）

| 側欄標籤 | 路由（建議） | 用途 |
| --- | --- | --- |
| 潛在客戶 | `/Leads` | 廣告／電話／前台尚未建檔的人 |
| 舊生試堂邀請 | `/TrialInviteCampaign`（現有；側欄可由「試堂邀請」改名） | 為**已有學生**產連結、WhatsApp／WeChat、待審核 |
| 試堂班別管理 | 擴充現有 `/TrialInviteCatalog`（側欄由「試堂名單控管」改名） | 對外公開頁開哪些**班／堂**（舊生邀請＋廣告公開雙通道） |
| 試堂紀錄 | `/TrialSessions`（現有） | 所有已建檔學生的試堂；篩選找人 |

公開 `/AdTrial` 在 Layout 外，不進側欄。頁與頁用捷徑串接，**不要**用 Tab 把潛在客戶／邀請／班別控管塞進同一殼。

### 各頁答什麼／不答什麼

| 頁 | 列的是 | 答的問題 | 不要做 |
| --- | --- | --- | --- |
| 潛在客戶 | 尚未建檔的人 | 誰來過？跟到哪？要不要建檔？ | 審核佇列、產連結、選堂控管、收款、建 `trial_sessions` |
| 舊生試堂邀請 | 已有學生＋token／申請 | 誰有連結？待審？ | 廣告來客、無學生的列 |
| 試堂班別管理 | **班／堂** | Meta／邀請連結「開了哪些班」 | 潛在客戶名單、審核、建檔、當人的試堂列表 |
| 試堂紀錄 | 已建檔學生的 `trial_sessions` | 誰試哪一堂、收未收款、結果 | 當潛在客戶 CRM |

廣告客流程：

```text
訪客填 /AdTrial
  → 潛在客戶（跟進、建檔成非註冊）
  → 試堂紀錄（排堂、計人頭）
  → 收款登記（如需）
  → 點名紙
```

「廣告可選哪些班」只影響公開表單內容，**從不**產生另一張「廣告試堂」人名表。廣告客建檔後，試堂只出現在**試堂紀錄**。

### 試堂班別管理（雙通道）

擴充現有名單控管 UI（表頭篩選、展開堂次、批量、滿班／已有試堂標示）。每班一列兩個**獨立**開關：

| 開關 | 欄位 | 預設 |
| --- | --- | --- |
| 舊生邀請 | `trial_invite_listed` | 開 |
| 廣告公開 | `ad_trial_listed` | 關（須職員逐班打開） |

展開堂次時，剔除分兩欄，或頂部先選「編輯：舊生邀請／廣告公開」再勾堂次，避免一次勾選誤傷另一通道。批量操作須寫明「僅廣告／僅舊生邀請／兩者」。

頁首一句：控制對外公開頁可選的班與堂；舊生邀請與廣告公開各自獨立。滿額（就讀中 ≥ 6）兩渠都可自動隱藏。邀請目錄「該堂已有未取消試堂」**只服務邀請渠**；廣告公開頁不以邀請試堂佔位。控管頁「已有試堂」是給職員看的標示，**不是**廣告開關。

### 潛在客戶 `/Leads`

工作佇列，不是學生名冊。

- **狀態分頁**：`新進`／`已聯絡`／`已建檔`／`已結束`；預設「新進」
- **來源 chip**：廣告試堂／電話／前台／其他（官網可先藏或灰）
- **列上**：姓名｜年級｜學校｜電話（WhatsApp）｜來源｜想試摘要｜狀態｜時間｜主操作
- **主操作**：標已聯絡；建檔（非註冊）；已建檔則連學生詳情／試堂紀錄（`converted_student_id`）
- **人手新增**對話框：姓名、聯絡、年級、學校、來源、備註；想試只作提示，**不**在 lead 階段硬綁必須建的 `schedule`
- 建檔成功：**留在本頁**，橫幅＋「前往排試堂」；不要在本頁建試堂或收款
- 想試意向僅灰字提示；真正排堂以試堂紀錄為準（建檔當下重驗堂次，見 H5）

### 試堂紀錄（前台找各種試堂的主頁）

舊生邀請核准、廣告建檔後手建、前台直接建，**全部**進同一頁。以篩選分流，不另開廣告試堂列表：

- 既有：狀態／類型／結果
- 建議加：**註冊**＝非註冊（多半查詢／廣告試堂客）／已註冊
- 搜尋：姓名／電話
- （可選，下波）來源 Tag：手建／舊生邀請／廣告建檔——首版可靠非註冊＋潛在客戶「已建檔」連結辨識

### 已拍板決策摘要

1. 取消獨立 `/AdTrialCatalog`；名單控管改名並雙通道。
2. 「試堂邀請」＝舊生試堂邀請產生／審核頁（可改側欄文案為「舊生試堂邀請」）。
3. 廣告客＝潛在客戶 → 建檔 → 試堂紀錄；班別管理 ≠ 人的試堂紀錄。
4. 試堂紀錄用篩選服務前台找不同人的試堂。

## 模擬檢查（邏輯／代碼；2026-09-25）

不涉界面（界面見上節）。對照現行 `students`／`trial_sessions`／收款／roster RPC 走完「廣告提交 → 潛在客戶 → 建非註冊 → 試堂 → 確認收款 → 點名紙／計人頭 → 正式報讀」。

### 結論摘要

主鏈（非註冊主檔＋已確認試堂單）**可以**上紙與計人頭；roster **不**看 `registration_status`。風險多在**建檔預設、轉正漏改註冊、意向堂次過期、固定公開 URL 濫用、遺漏掛 `payment_id`**。

### 獨立重模擬（2026-09-25 第二輪）

未開工、未改程式。對照現行 students／trial／收款／roster／邀請 RPC 重走「提交 → 潛在客戶 → 建非註冊 → 試堂 → 確認收款 → 點名紙／計人頭 → 正式報讀」。

**判定：** H1–H5、M1–M9、L1–L4 **仍成立**，產品分流與不互佔**不推翻**。下列為訂正與遺漏（已寫入各表）。

| 核對項 | 結果 |
| --- | --- |
| `insertStudent` 省略註冊 → `已註冊`（normalize 空字串＋DB default） | H1 仍準 |
| `insertEnrollment` **不**升註冊；`convertTrialToEnrollment` 才會 | H2 收緊：閘應落在 `insertEnrollment` |
| roster RPC 試堂列：`payment_id`＋`payments.status=已收款`；無 `registration_status` | L3／上紙表仍準 |
| `rosterHeadcountForSchedule`：純試堂只計 `countsTowardHeadcount===true` | M4 仍準 |
| 邀請「一堂一試堂」＝目錄／提交閘，不是 DB／核准約束 | 見不互佔表；本分題不改該 SQL |
| `/Payments` 選人＝`fetchAllStudents`（含非註冊）；試堂新增 picker 亦含非註冊 | 收款找得到人；試堂新增搜尋弱（M13） |
| 前台家長填表 submit 強制 `已註冊` | 勿把廣告接去 intake |

### 廣告 vs 邀請：試堂位不互佔（2026-09-25 定）

兩套名單可掛同一 `schedule`，但**廣告側不因邀請已有試堂而隱藏或拒絕建試堂**。本分題**不改**邀請「一堂一試堂」現行 SQL。

現行程式其實是三層，不要當成「DB 一堂只能一人」：

| 層 | 現行行為 | 對廣告客的意思 |
| --- | --- | --- |
| 邀請公開目錄／`trial_invite_submit` | `trial_invite_schedule_open_for_parent`：該堂有**任何未取消** `trial_sessions`（含已完成、不問來源）則不出現／拒交 | 廣告生一旦建了試堂（即使未收款），新邀請家長會看不到該堂。待審核申請**不**佔位 |
| `trial_invite_review` 核准 | 只擋**同一學生**對該堂未結案試堂 | 廣告試堂已存在時，已提交的邀請申請**仍可核准**，兩人可同上紙 |
| `insertTrialSession`＋partial unique | 只擋同生同 `schedule_id` 開著試堂；另擋同生同時段衝突、過期／取消排程 | 職員為廣告客手建試堂**不**因邀請生已佔該堂而失敗 |

- 若要嚴格雙向不互佔：邀請目錄日後可改為只計邀請來源——**非本分題首版必改**（用戶已禁改此 SQL）。
- 廣告目錄／廣告建試堂：**不以**「該堂已有邀請試堂」為佔位；廣告側若做佔位，只計廣告來源（或首版廣告側不做一堂一試堂）。
- 同生同堂開著試堂仍受 DB partial unique 約束（與渠無關）。
- 接受結果：同堂可同時出現邀請試堂生＋廣告試堂生。首版廣告側若不做佔位，同一堂甚至可有**多名**廣告試堂生（只受同生 unique）。滿班門檻只計就讀中報讀 ≤ 5，**不含**試堂人頭。

### 何謂「提交時的 schedule_id 到建試堂時已失效」

家長在廣告頁提交時，系統把當時勾選的 `schedule_id`（某一班的某一日某一節）寫進潛在客戶意向。之後行政 WhatsApp、建非註冊、再建 `trial_sessions`，中間可能隔數日。建檔當下該列排程可能已不能再用，例如：

| 情況 | 意思 |
| --- | --- |
| 日期已過 | 該堂上課日已過，不能再建未來試堂 |
| 排程被刪／改狀態 | 假期刪列、人手刪堂、改期後 id 不同 |
| 廣告名單剔除 | 職員把該班 `ad_trial_listed=false` 或該堂 `ad_trial_excluded` |
| 公開自動隱藏觸發 | 例如就讀中 ≥6 人（若廣告目錄仍套此規則） |

**不是**「邀請渠已有人試過該堂所以失效」——依上節不互佔。  
也**不是**「意向一提交就鎖死該堂」——意向／申請本身不佔位；失效指職員真的要建試堂時，意向裡的 id 已對不上可用排程。

### 高（開工前須定／寫死）

| # | 問題 | 依據 | 後果 | 建議 |
| --- | --- | --- | --- | --- |
| H1 | `insertStudent`／DB 預設 `registration_status = 已註冊`；未顯式傳 `非注冊` 會建成正式註冊 | `studentQueries.insertStudent`＋`inferStateFromLegacy` 預設已註冊；migration default `已註冊`；前台 `emptyIntakeForm` 亦預設已註冊 | 只試一次的人進「已註冊」語意；與產品分流相反 | 建檔捷徑**強制**寫 `非注冊`；禁止走一般「新生註冊」預設路徑；勿複用家長填表強制已註冊的契約 |
| H2 | 正式報讀時若仍為 `非注冊`：DB／前端重算會**強制** `enrollment_status=非在讀`，但 `activity_status` 仍可因報讀變成**活躍生** | `recompute_student_enrollment_state`；`computeDerivedFromEnrollments`；**`insertEnrollment` 本身不改 `registration_status`**。`convertTrialToEnrollment` 才會升註冊。學生詳情／班別詳情／前台報讀步／轉班皆走 `insertEnrollment` | 有報讀卻標非在讀；又出現在活躍頁；試堂被 `closeOpenTrialsAfterEnrollment` 標 converted | 程式閘落在 **`insertEnrollment`**（有報讀則不可維持 `非注冊`），不能只靠轉正對話或建檔捷徑 |
| H3 | 上紙＝`trial_sessions`＋`payment_id`＋單據**已收款**；收款後才 `linkOpenTrialsToPayment`（同生同班、明細描述含「試堂」）；失敗時可能「收款成功、關聯失敗」只警告 | roster RPC；`PaymentsPageView`（`linkedTrialIds` 與 `skippedMessages` **皆空時不警告**）；`linkOpenTrialsToPayment`；`topUpEntitlementsForPayment`（無「試堂」字樣且無報讀 → 略過抬池） | 已收款卻不上紙；無報讀新生無 trial 權益池；待收款若先掛 `payment_id` 仍不上紙（RPC 要已收款） | 建檔流程一次做：建試堂 → 出單／確認 → **核對 linkedTrialIds 非空**（勿假設收款頁一定擋得住）；明細必須走試堂行；免費用 $0 已收款或 `issueZeroReceiptForTrialSessions` |
| H4 | 固定公開 URL 無 token；anon `catalog_get`／`submit` 可被刷／爬堂次庫存 | 對照 `trial_invite_get`／`contact_update_*`：anon 僅 get+submit、無 DB 內 rate limit／CAPTCHA；invite 目錄回老師姓名、班／堂 UUID、每班最多 12 堂，不回同學姓名；廣告版無「已報讀／半年曾試」過濾 → 可爬 slot 更寬 | leads 洗版、目錄／老師／開班策略被掃；輪詢可 side-channel 推斷滿班／已佔 | submit：必填＋電話去重窗＋honeypot／冷卻（必要時 Edge／Turnstile）；catalog：欄位最小化、勿回同學姓名／人數細節；維持 `ad_trial_listed` 預設 false；監控提交速率與同 `schedule_id` 集中度 |
| H5 | 意向裡的 `schedule_id` 到建試堂時可能**失效**（日過／刪堂／廣告名單剔除／滿班隱藏等）；意向本身不佔位 | 提交只存快照。`insertTrialSession` 已擋：過期、取消／缺列、同生開著試堂、同生同時段衝突；**不**擋滿班、`ad_trial_listed`、他生試堂（符合不互佔） | 職員按舊意向建堂失敗，或建到已剔出廣告目錄的堂 | 建檔當下重載該排程是否仍存在且仍屬廣告開放規則；失效則提示改選，**不**因邀請渠已有試堂而拒絕 |

### 與既有前台填表的關係（勿混）

repo 已有家長公開填表 → 職員接稿建檔：`front_desk_intake_sessions`（`/FrontDeskIntake`、前台精靈 `RegisterStudentStep`）。那是**另一條** lead 稿，且家長 submit **強制已註冊**。本分題的 `leads`（廣告／來電／多來源）**另開表**，不要把廣告流量接去 intake 再被迫已註冊。試堂管理頁本身也不建學生，只接既有 `student_id`。

### 中

| # | 問題 | 說明 |
| --- | --- | --- |
| M1 | ~~兩渠搶同一試堂位~~ → **已定不互佔** | 見上節；廣告建試堂不因邀請已有試堂而擋。同堂兩名試堂生（一邀請一廣告）點名紙可同時出現——屬接受結果。首版廣告側若不做佔位，同一堂可有多名廣告試堂生；控管頁 `trialCount` 應顯示總數供職員判斷，不當鎖定 |
| M2 | 自報年級錯 → 選錯班；建檔用錯年級 | 年級寫入 student 後影響日後邀請／配班；職員應可改年級再試堂。廣告年級須能 `normalizeStudentGrade` 成標準碼，無法辨識則勿寫入主檔 |
| M3 | 電話無唯一約束 | 同一人多次提交／來電可多 lead、甚至多學生主檔；建檔前應提示同電話既有生／既有 lead（比對 `whatsapp`／`student_phone`／`parent_phone`） |
| M4 | `counts_toward_headcount` 可 null | DB 允許；null **仍可上紙**（有收款），但 `rosterHeadcountForSchedule` **不計**人頭 → 計糧偏低；建試堂必須寫 true／false |
| M5 | 學號可 null（`insertStudent` 允許） | 收款仍可；搜尋／收據顯示弱；建檔捷徑應一併 `allocateNextStudentCode` |
| M6 | 高中選修只存 lead、未抄入 `students.elected_subject_codes` | 日後轉邀請或學生詳情缺選修；建檔時應複製 |
| M7 | 意向多科／多堂 vs 職員一次只建一試堂；同班多筆開著試堂＋一張單 | `pickOpenTrialIdsForPaymentLink` 只掛最近試堂日一組；較早開著試堂可能永遠無 `payment_id`；converted 語意要定義 |
| M8 | 目錄若回 `teacher_name`／班碼（與 invite 同構） | 對競爭者可商用；屬固定 URL 已知代價。勿再加就讀人數／同學名單；`leads` 禁 anon 直讀（僅 DEFINER submit） |
| M9 | 2627 試堂權益：`mintOnly` 鑄 trial 池、不建宣告 | 點名靠 `trials` 入冊後扣 trial 池；若未 topUp（明細無試堂），消耗會靜默無池。屬現行試堂契約，建檔捷徑須走試堂收款行。功課輔導班 topUp 會略過（現行如此） |
| M10 | 廣告目錄學年／堂次窗未寫死 | 邀請控管只列 `academic_years.is_current`、未來未取消堂。廣告公開目錄應對齊，否則可能列出非目前學年班 |
| M11 | 廣告電話只寫 `whatsapp` 則收款搜尋找不到 | 點名紙聯絡＝`coalesce(whatsapp, student_phone, parent_phone)`；`studentSearchText` **不含** `whatsapp`。建檔須同時寫 `whatsapp` 與 `parent_phone`（或學生電話） |
| M12 | 非註冊生仍出現在舊生邀請活動頁 | `TrialInviteCampaignView` 用 `fetchAllStudents` 只濾已畢業。建檔後職員可能誤產邀請連結。首版可提示／過濾非註冊，或接受兩條都能建 `trial_sessions` |
| M13 | 試堂紀錄新增 picker 搜尋弱、無 URL 預填 | 只搜姓名／年級，無學號／電話；無 `?studentId=`（收款頁有）。建檔橫幅「前往排試堂」必須帶 `studentId` 並預填新增對話，否則同名易揀錯 |

### 低／已知可接受

| # | 問題 | 說明 |
| --- | --- | --- |
| L1 | 非註冊、無報讀 → 預設活躍頁通常無；名冊仍有 | 符合「有主檔≠正式生」；名冊篩選可下波 |
| L2 | 權益池試堂路徑用 `isTrial`／`mintOnly`，不需先有報讀 | 現行試堂收款已支援未報讀；點名靠 trials∪宣告∪補堂 |
| L3 | roster 不濾註冊狀態 | 非註冊＋已確認試堂可上紙——符合本方案 |
| L4 | 同生同 schedule 開著試堂 | partial unique index 已擋；跨生同堂（含邀請＋廣告各一）依「不互佔」允許 |
| L5 | 作廢單後 `trial_sessions.payment_id` 仍指向作廢單 | 自動掛單只揀 `payment_id is null`；再出單不會自動重掛。現行試堂已如此，非本分題必改 |
| L6 | 邀請待審核不佔位 | 兩名邀請家長可先後提交同一堂；核准層才寫 `trial_sessions`。與不互佔一致，無需為廣告另開鎖 |

### 點名紙／計人頭（再確認）

| 條件 | 結果 |
| --- | --- |
| lead only | 不上紙 |
| 非註冊主檔、無試堂或未確認收款 | 不上紙 |
| 非註冊＋`trial_sessions`＋已收款＋`counts_toward_headcount=true` | 上紙；計人頭 |
| 同上但計人頭 false | 上紙；不計人頭 |
| 已註冊與否 | **不影響**上紙 |

## 建議實作切塊

1. Migration：`leads`／試堂意向行／`ad_trial_listed`／`ad_trial_excluded`；anon RPC `ad_trial_catalog_get`／`ad_trial_submit`；職員 RLS（建議 capability `students.enroll`）。目錄只列目前學年＋未來堂（M10）
2. 公開頁 `/AdTrial`＋ service（含 H4 防呆）
3. 擴充 `/TrialInviteCatalog` → **試堂班別管理**（舊生邀請＋廣告公開雙開關／堂次剔除）；側欄改名；**不**另開 `/AdTrialCatalog`；「已有試堂」標示不鎖定廣告開關
4. `/Leads`：清單、篩來源／狀態、WhatsApp、人手新增；**建檔捷徑強制非註冊＋學號＋電話寫入 whatsapp 與 parent_phone＋選修複製＋重驗堂次（H1–H5、M3、M6、M11）**；建檔後捷徑進試堂紀錄（帶 `studentId`，M13）
5. `/TrialSessions`：加註冊狀態等篩選；新增對話支援 `?studentId=` 預填；來源 Tag 可下波
6. 正式報讀閘：落在 `insertEnrollment`——有報讀則不可維持 `非注冊`（H2）
7. 側欄文案（潛在客戶／舊生試堂邀請／試堂班別管理／試堂紀錄）；相關單測；`npm run build`

## 不做（首版）

- 無學生主檔的收款或試堂
- 提交即建學生／自動出單
- 與 `/TrialInvite/:token` 共用 token 或審核佇列
- 改邀請「一堂一試堂」現行 SQL（`trial_invite_schedule_open_for_parent`／submit 佔位）
- 獨立「廣告試堂名單」頁／「廣告試堂紀錄」列表
- 官網留言表單 UI（schema 留 `website`）
- 轉正一鍵報讀、名冊預設隱藏非註冊、試堂紀錄「來源」Tag（可列下波）

## 相關

| 用途 | 路徑 |
| --- | --- |
| 既有生試堂邀請（並列、勿混） | [trial-invite-link.md](./trial-invite-link.md) |
| 試堂出單先上紙 | [TRIAL_RECEIPT_BEFORE_ROSTER.md](../../policies/enrollment/TRIAL_RECEIPT_BEFORE_ROSTER.md) |
| 學生四維狀態 | [STUDENT_STATUS_CLASSIFICATION.md](../../policies/enrollment/STUDENT_STATUS_CLASSIFICATION.md) |
| 公開頁流程參考 | `src/components/trialInvite/TrialInvitePublicForm.tsx`、`src/lib/trialInvitePublicFlow.ts` |
| 既有前台家長填表（勿混作廣告 lead） | `front_desk_intake_sessions` · `FrontDeskIntake` · `RegisterStudentStep` |
| 試堂轉正升註冊 | `convertTrialToEnrollment`（`trialQueries.ts`）；人手報讀閘應落在 `insertEnrollment` |
