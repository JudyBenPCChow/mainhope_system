# 學年鎖整固 — 團隊對顧問審閱的觀察與疑問

> **最終狀態（2026-07-31）**：已改撤硬鎖；見 [`ACADEMIC_YEARS.md`](../ACADEMIC_YEARS.md) §1.1。下文為當日問答，**勿再當待辦**。

| 欄位 | 值 |
| --- | --- |
| 日期 | 2026-07-31 |
| 對象 | 外部技術顧問（請對照 [`2026-07-31-academic-year-lock-review-consultant.md`](./2026-07-31-academic-year-lock-review-consultant.md)） |
| 背景 | 團隊檢查報告 [`2026-07-31-academic-year-lock-review.md`](./2026-07-31-academic-year-lock-review.md)；工程追蹤 [`../backlog/academic-year-lock.md`](../backlog/academic-year-lock.md)（其後 `cancelled`） |
| 撰寫 | 本 repo coding agent（對話內盤點／實作方）；待產品負責人拍板處已標明 |
| 狀態 | **請顧問回覆文內「疑問」小節** |

---

## 1. 總體觀察

我們同意顧問的總評框架：**L1/L2 是可立即修的實作錯誤；L6–L12 是營運痛點但 UX 原則要清楚；L13 是硬度政策，不拍板就無法寫死規則。**

顧問補上的「全量 audit 表」（僅檔期模組三處傳 `endDate`）對我們很有用——原先檢查報告指出 API 危險形狀，但未把「誰真正傳了第二參數」列成表。這降低了 A1 的認知負載：**修 bug 的 blast radius 很小，幾乎可獨立 PR。**

A1／A2／C 切分與我們把問題拆出 role-ops、另開專題的意圖一致；我們傾向**接受此切分作為工程節奏**，除非產品在 L13 選了與「先 A1 不改政策」衝突的方案（見下）。

---

## 2. 逐項觀察（對顧問判決）

### 2.1 AL-1（L1 + L2）— 同意，可開工

- **同意**：症狀與根因綁在一起；admin 路徑不應再消費呼叫端傳入的 `endDate`。
- **同意**：三處檔期呼叫（UI 1 + `teacherAvailabilityQueries` 2）是目前已知危險點；其餘只傳 label 的路徑在「admin 誤用 endDate」意義下安全。
- **觀察／補充**：修法上我們同意「admin 永遠用真實今天」。實作時會一併確認 `todayYmd()` 與現有 `academicYearLabelFromStartDate(null)`／本地時區是否一致（後台一律本地日曆日，避免 UTC 日界）。
- **小疑問**：顧問建議保留 `isAcademicYearReadOnly(endDate, label)` 簽名並令 admin 忽略 `endDate`——是否接受短期「簽名仍誤導、內部已正確」？還是 A1 就應 deprecate／改名強制呼叫端遷移（僅三處危險點，遷移成本低）？我們傾向 **A1 直接改名或改為具名 opts，避免下一位再傳 endDate**。

### 2.2 AL-2（L3 + L4）— 大致同意，有實作細節要釐清

- **同意 L3 漸進**：金流／出席優先用實體 label；排程暫以日期為 proxy。
- **觀察**：現況不少寫入路徑（點名、請假、繳費）的「單據」未必已有穩定的 `academic_year_label` 欄——可能要：
  - 從關聯班別／學年字典 join；或
  - 寫入時冗餘存 label；或
  - fallback 日期推算。  
  顧問說的 `guardAcademicYearEditForEntity({ label?, date? })` 我們贊成作統一入口，但 **A2 開工前需要顧問確認：各實體「權威 label」從哪張表／哪個欄讀**（見疑問 Q3）。
- **同意 L4**：null label 不改成「一律鎖死」；加 warn／可選 audit 即可。我們不會在 A1 因缺 label 而鎖死舊資料。

### 2.3 AL-3（L5）— 同意方向，對「分叉時間點」有一點校正需求

- **同意**：雙軌語意長期危險；應在下次 cutover 前處理。
- **觀察**：顧問對 2027-09 teacher 仍可編 `2627`、admin 已鎖的推演，與我們對 `isClosedAcademicYear` 的讀法一致——**分叉是真的**。
- **疑問**：建議的 teacher 規則「不早於 `TEACHER_MIN_EDITABLE_LABEL`」是否**完全取代**「目前＋下一」？還是「地板 ∩（目前＋下一）」？  
  文中兩段表述略有張力：一段像只要 ≥`26SM` 就可編；一段又說長期對齊 admin 的「目前＋下一」只加地板。**請明確目標語意**（見 Q4）。

### 2.4 AL-4（L6–L12 + L14）— 同意 UX 方向，範圍要防膨脹

- **同意**：黃警報橫幅用在「只係睇舊資料」是錯誤語氣；應改灰底唯讀標籤／寫入控件 disabled。
- **同意**：文案拆成「寫入阻擋」vs「瀏覽提示」；L11 跟 `yearLocked` disable（非隱藏）。
- **觀察**：顧問寫「文案拆分和橫幅降級的技術實作不依賴產品決策，可先做」——我們同意可先做，但會**刻意不做完整三態狀態機／全站枚舉**在 A1，以免變相大 refactor。A1 目標對齊顧問：「鎖對 + 安靜唯讀」。
- **疑問**：點名頁選歷史日時，是否仍允許**展開查看已存出席**（只擋儲存）？我們假設 **是**；若顧問認為歷史日應連面板都只讀簡化，請說明（Q5）。

### 2.5 AL-5（L13）— 同意「必須先拍板」；對 30 日窗有營運疑問

- **同意**：硬鎖把日常糾錯推給 alien，與 alien「超管」定位衝突。
- **對選項 B（30 日）的觀察**：
  - 顧問舉例：今日 2026-07-31、`2526` end=06-30 → 已 31 日 → 窗已關。若我們**現在**上線 B，對當下最痛的 `2526` 殘務**即時無幫助**，仍要靠 alien 或一次性例外。
  - 過渡窗對「未來每次學年切換」有價值；對「已經過窗的債」要另有說法（一次性 alien 清理／臨時解鎖）。
- **疑問（請顧問表態／幫產品想）**：見 Q1、Q2。

### 2.6 AL-6（L15）— 同意放階段 C

無異議。學年鎖主價值是防誤操作，不是本輪威脅模型核心。

---

## 3. 對四題直答的初步立場（產品未最終拍板）

供顧問知道團隊目前傾斜，**不是最終決策**：

| # | 顧問建議 | 團隊目前傾向 | 備註 |
| --- | --- | --- | --- |
| 1 Admin 修正權 | 30 日過渡窗 | **傾向接受方向**，但要處理「已過窗的現債」 | 見 Q1–Q2 |
| 2 瀏覽 UX | 三態＋灰標、禁黃警報瀏覽 | **同意，A1 先做降級** | 完整三態可 A2 |
| 3 鎖主鍵 | 金流／出席實體 label 優先 | **同意漸進** | 需權威欄位來源 Q3 |
| 4 Teacher cutoff | 可配置地板＋長期對齊滾動 | **同意要可配置** | 語意請澄清 Q4 |

---

## 4. 請顧問回覆的疑問

### Q1 — L13 與「已經過期的 `2526`」

若採 30 日窗，以目前日曆（約 2026-07-31）`2526` 已出窗。顧問是否建議：

- **(a)** 只定義未來規則，現債繼續 alien；或  
- **(b)** 上線時給一次「遷移寬限」（例如至 2026-08-31 前 admin 仍可改 `2526`）；或  
- **(c)** 其他？

我們需要一句可寫進 `ACADEMIC_YEARS.md` 的規則，避免工程上線後行政仍卡死。

### Q2 — 過渡窗邊界的精確定義

請確認或修正以下草案是否與顧問原意一致：

> Admin 可編 =「目前學年」∪「下一學年」∪「任一學年滿足 `今天 − end_date ≤ 30 日`（且 end_date ≤ 今天）」。

特別是：

- 未開始的「下一學年」是否永遠可編（現況是）？  
- 窗是否只對**已結束**學年生效？  
- 暑期 `*SM` 與正規是否同一 N=30？  
- `今天 − end_date` 用**日曆日**還是工作日？

### Q3 — 實體 label 的權威來源（L3）

對下列寫入，顧問建議的「單據 academic_year_label」實際應讀哪裡？（現況可能沒有獨立欄）

| 操作 | 我們目前猜測 | 請確認／改正 |
| --- | --- | --- |
| 點名儲存 | 經 `schedule` → `class` → `academic_year_label`／`start_date` 推算 | ？ |
| 請假 | `leave_date`／連結排程的班別學年 | ？ |
| 繳費 | `payment_date` 推算 vs 報讀班別學年（一單可能跨班） | ？ |

若繳費「一單多班／無班」，實體 label 策略是什麼？

### Q4 — Teacher 目標語意（L5）

請二選一（或給第三式）：

- **T-A**：Teacher 可編 = 所有 label ≥ `TEACHER_MIN_EDITABLE_LABEL`（可編很多已結束但仍 ≥ 地板的學年）。  
- **T-B**：Teacher 可編 = （≥ 地板）∩（admin 同款「目前＋下一」）［± 過渡窗若有］。  

我們傾向 **T-B**（較唔會出現「老師改得、行政改唔到」的倒掛），但要顧問確認是否接受老師比行政更窄。

### Q5 — 點名歷史日的讀寫邊界（L6）

A1 橫幅降級後，歷史日是否：

- 可載入、可展開已存出席、不可儲存／不可改狀態；還是  
- 進一步限制（例如不可開 roll-call 面板，只導去「出席紀錄」唯讀頁）？

我們預設前者（改動小、符合「可睇」）。

### Q6 — A1 是否必須等 Q1？

顧問結論寫「建議團隊先就決策點 1 給方向，其他可不阻塞開工」。我們解讀為：

- **A1（修 L1/L2 + UX 降級 + L11）可先開，唔改 L13 政策**；  
- **A2 才實作過渡窗**。

請確認此解讀正確。若 L13 選 A（硬鎖）或 C（申請解鎖），A1 是否仍原樣？

### Q7 — 具名 API 與相容

A1 拆函式時，是否要求：

- 刪除或 `@deprecated` 舊 `isAcademicYearReadOnly(endDate, label)` 位置參數；  
- 以及 `canEditAcademicYear(label, endDate?)` 第二參數在 admin 路徑改為 ignore 並 eslint／註解禁止傳 endDate？

我們傾向 **deprecated + 檔期三處改掉 + 類型上令第二參數僅用於 teacher closed 判斷且改名**，避免 overload 復活。

---

## 5. 我們打算怎麼用顧問回覆

顧問回覆 Q1–Q7 後，團隊預期：

1. 更新 [`../backlog/academic-year-lock.md`](../backlog/academic-year-lock.md) 工作項狀態／驗收句；  
2. 需要寫進政策的句子補 [`../ACADEMIC_YEARS.md`](../ACADEMIC_YEARS.md)；  
3. 開 A1 PR（L1/L2/L4 warn/L6–L12 降級/L11），**不**在 A1 實作過渡窗除非 Q6 另有指示。

---

## 6. 相關路徑

```
docs/product/audits/2026-07-31-academic-year-lock-review.md            ← 團隊檢查
docs/product/audits/2026-07-31-academic-year-lock-review-consultant.md ← 顧問審閱
docs/product/audits/2026-07-31-academic-year-lock-team-response.md     ← 本檔（觀察與疑問）
docs/product/topics/academic-year-lock.md
docs/policies/academic/ACADEMIC_YEARS.md
```
