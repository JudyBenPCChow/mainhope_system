# 學年鎖整固 — 顧問對抗模擬裁定

> 角色：**外部技術顧問** ⚠️ 非團隊成員，獨立裁定  
> 對象：[`2026-07-31-academic-year-lock-adversarial.md`](./2026-07-31-academic-year-lock-adversarial.md)（團隊對抗模擬 ADV-1～10）  
> 日期：2026-07-31  
> 狀態：**裁定完成；請團隊據此更新 backlog 並排程**

---

## 裁定總表

| ID | 顧問裁定 | 一句 |
| --- | --- | --- |
| ADV-1 A1／A2 節奏 | **b** — A1/A2 同發或緊接（≤1 週） | 修 L1 會收走意外後門，不可讓 A1 單飛 |
| ADV-2 遷移是否入 code | **是，必須入 A2 code** | 原「不寫入程式」係指公告不需永久機制，不是寬限本身 |
| ADV-3 `25SM` 遷移範圍 | **只 `2526`，不包 `25SM`** | 12 個月窗太闊；`25SM` 殘務走 alien |
| ADV-4 grace 是否 admin-only | **是，admin+alien only** | T-B 改為不含 grace；teacher 只享「目前＋下一」 |
| ADV-5 空 label | **可編＋warn**（三處一致） | Q7 的 `EditableForAdmin` snippet 是錯的，以此裁定為準 |
| ADV-6 L3 在 A1 | **接受已知債**，寫入 backlog 風險 | 不提前收窄；A2 處理 |
| ADV-7 繳費跨年 | **a**（任一可編＝整單可編） | 務實取捨；夾當期班解鎖舊單屬異常操作，audit 可追 |
| ADV-8 下拉同步 | **是，必須同步** | 改可編集合必改 `filterAcademicYearOptionsForEdit` |
| ADV-9 A1 UX 驗收 | **是，必須枚舉全站** | done = 零黃警報橫幅用於純瀏覽場景 |
| ADV-10 時區 | **確認本地日曆日** | 與 `academicYearLabelFromStartDate(null)` 同源 |

---

## 逐項詳細裁定

### ADV-1 — A1／A2 節奏：必須同發或緊接

**裁定：b**。A1 與 A2 應在同一個部署窗口內上線，間距不超過一週。

團隊的論證是對的：A1 修了 L1 bug 後，admin 對 `2526` 從「意外可編（檔期）」變成「正確鎖死（全範圍）」。這在技術上是正確化，在營運上是倒退。如果 A2 的遷移寬限要等數週，行政會被困在「比而家更差」的狀態。

**具體要求**：

- A1 和 A2 可以分 PR 開發（工程清晰），但**合併到同一個 release 批次**。
- 若因故 A2 必須延遲，A1 也不能先上——除非在 A1 中臨時保留對 `2526` 的管理員可編（一個 hardcoded 例外，A2 上線時移除）。我不建議這條路，寧可等 A2 一起上。
- A1 中不涉 L13 的項目（UX 降級、L11、文案拆分）**可以獨立先上**——這些純 UI 改善不影響可編性，且立即減輕「系統壞咗」的錯誤感。換言之，把 A1 再拆成：
  - **A1a（UX only，可先上）**：L6–L12 橫幅降級、文案拆分、L11 修復
  - **A1b（判斷修正）+ A2（政策窗）**：L1/L2/L4 warn + 30 日窗 + 遷移寬限，**同發**

團隊可自行決定 A1a/A1b 是否要进一步拆分，但 **A1b 和 A2 必須綁定**。

---

### ADV-2 — 遷移寬限必須入 code

**裁定：是，必須入 A2 程式。**

我 Q1 原文「不寫入程式／只寫文件或公告」表達不精確，團隊的質疑完全正確。澄清：

- **永久 30 日窗**：入 code（`isAdminEditableAcademicYearLabel` 的邏輯分支）。
- **一次性遷移寬限（`2526` → 2026-08-31）**：也入 code，實作方式二選一：
  - **A）截止日常數**：`const MIGRATION_GRACE_UNTIL_YMD = "2026-08-31"`；A2 邏輯：若 `today < MIGRATION_GRACE_UNTIL_YMD` 且 label ∈ `["2526"]`，視為可編。A2 上線後此常數可在後續 PR 移除（過期後 dead code）。
  - **B）`academic_years` 表加 `migration_grace_until` 欄**：更乾淨但 migration 成本高。

建議 **A**（常數，簡單可控）。`ACADEMIC_YEARS.md` 記載此為一次性措施及過期日，不作為永久政策。

---

### ADV-3 — `25SM` 不納入遷移寬限

**裁定：只 `2526`，不包 `25SM`。**

團隊的評估正確：`25SM` 結束於 2025-08-31，距今近 12 個月。開放 admin 編輯 12 個月前的暑期資料，風險（誤改、攻擊面）遠大於效益（極少數殘餘對帳需求）。

若 `25SM` 真有殘務需修正，走 alien——這是 alien 的正當用途（超級管理糾錯），不是「濫用後門」。

遷移寬限最終範圍：

> 一次性遷移：`2526` 學年，admin 可編輯至 **2026-08-31**（含當日）。  
> 其他已結束學年（`2425`、`25SM` 等）不享有遷移寬限，修正需求經 alien 處理。

---

### ADV-4 — Grace 必須 admin-only

**裁定：是。T-B 的 Teacher 可編集合不含 grace／遷移。**

修正 Q4 的 T-B 定義：

> Teacher 可編輯學年 =  
> `academicYearOrderKey(label) ≥ academicYearOrderKey(TEACHER_MIN_EDITABLE_LABEL)`  
> ∩ **Admin 的「目前＋下一」**（不含過渡窗、不含遷移寬限）

換言之，Teacher 的 admin 交集部分是**基礎可編集合**，不是 admin 的**完整**可編集合。過渡窗和遷移是行政對帳工具，老師不應享有。

這是對 Q4 原回覆的修正。團隊的「admin-only grace」立場正確，我採納。

---

### ADV-5 — 空 label 語意一致

**裁定：空 label → 可編（return false = 非唯讀）+ console.warn。**

我 Q7 的 `isAcademicYearEditableForAdmin` snippet 有誤——`!label → return false` 會令空 label 變「不可編」，與 `isAcademicYearReadOnly`（admin 路徑 `!label → return false` = 非唯讀 = 可編）和 `isAdminEditableAcademicYearLabel`（`!label → return true` = 可編）不一致。

**正確寫法**（取代 Q7 snippet）：

```ts
export function isAcademicYearEditableForAdmin(
  label: string | null | undefined,
  opts: { asOfYmd: string }
): boolean {
  if (!label?.trim()) {
    console.warn("[academicYearLock] empty label treated as editable", { label })
    return true  // 與現況一致：空 label 不鎖
  }
  return isAdminEditableAcademicYearLabel(label, opts.asOfYmd)
}
```

三處（`isAcademicYearReadOnly` admin 路徑、`isAcademicYearEditableForAdmin`、`isAdminEditableAcademicYearLabel`）對空 label 的行為必須一致：**可編＋instrumentation**。

---

### ADV-6 — L3 日期路徑：A1 接受已知債

**裁定：接受，寫入 backlog 風險。**

這不是新發現——我審閱 AL-2 已判為 P1 A2 處理。A1 不改 guard 判斷邏輯。`2526` 班的暑期補堂經日期路徑判 `26SM` 可編，是已知的 L3 張力，A2 才處理。

**A1 上線公告應提及此已知限制**（屬 FP-3 式溝通紀律——「覆蓋什麼、未覆蓋什麼」）。

---

### ADV-7 — 繳費跨年：維持「任一可編」

**裁定：a**（務實取捨）。

團隊的對抗場景（舊單加當期行解鎖舊年金額）在技術上可行，但：
- 這是有意識的異常操作，不是誤觸——操作者必須刻意加一條當期明細到舊單。
- Audit trail（`mgmt_audit_log`）可追到誰改過哪筆 payment。
- (b)「全部可編」對誠實的多班合單（如 siblings 跨學年）會變成不必要地鎖死。(c)「分行上鎖」是長期理想，但 `payment_details` JSONB 的結構不統一，實作成本遠高於風險。

接受 (a)，A2 不做分行鎖。若未來 abuse 發生，再評估 (c)。

---

### ADV-8 — 下拉必須同步

**裁定：是。** A2 任何改動 `isAdminEditableAcademicYearLabel`／`getAdminEditableAcademicYearLabels` 的邏輯，必須同步更新 `filterAcademicYearOptionsForEdit` 的過濾結果。這是同一函式（`getAdminEditableAcademicYearLabels`）的輸出，改它的邏輯即自動同步——只要 A2 不改出第二套並行邏輯。

驗收：A2 上線後，admin 在開班頁學年下拉可見到遷移寬限內的 `2526`。

---

### ADV-9 — A1 UX 驗收：必須全站零黃警報

**裁定：是。** A1 UX done 的定義：

> 所有使用 `academicYearReadOnlyHint()`／`academicYearEditBlockedMessage()` 作**純瀏覽場景 UI 文案**的頁面，已改為灰底唯讀標籤。  
> 零個頁面在「用戶只想查閱歷史資料」時顯示黃色 warning 橫幅。

具體清單（從 audit 已知的 UI 掛鉤點）：

| 頁面 | 當前行為 | A1 目標 |
| --- | --- | --- |
| `RollCallPage`／`RollCallClassPanel` | 黃橫幅＋不可儲存 | 灰標「2526 學年 · 僅供查閱」；可載入可展開 |
| `ClassDetailView` | 黃橫幅 `classYearLocked` | 灰標；寫入控件 disabled |
| `ScheduleManagePage` | `scheduleRowLocked` 控件 disabled | 維持 disabled，加 tooltip 非橫幅 |
| `LeaveManagementView` | `leaveRowEditable` 全 disabled | 維持 disabled，灰標提示 |
| `PaymentsPageView`／`PaymentHistoryView` | 擋登記／標記 | 維持行為，改提示文案 |
| `StudentDetailView` | 繳費區塊提示 | 改灰標 |
| `TeacherAvailabilityPage` | `yearLocked` 橫幅 | 改灰標；L11 修復 |

A1 PR 的 review checklist 必須逐頁驗證。

---

### ADV-10 — 時區：本地日曆日

**裁定：確認。** `todayYmd()` 必須與 `academicYearLabelFromStartDate(null)` 使用相同的「今天」定義——瀏覽器／營運本地日曆日（Asia/Hong_Kong）。禁止伺服器 UTC date 作為 `asOfYmd`。

實作上：如果 `academicYearLabelFromStartDate(null)` 目前用 `new Date()` in browser context，`todayYmd()` 就該用同一來源。如果是 service 端（`teacherAvailabilityQueries.ts` 等），確保傳入的 `asOfYmd` 由 client 提供或 service 以 HK 時區計算。

---

## 對團隊暫行立場的回應

| # | 團隊傾斜 | 顧問 |
| --- | --- | --- |
| 1 遷移入 A2 code | ✅ | 確認，見 ADV-2 |
| 2 唔包 `25SM` | ✅ | 確認，見 ADV-3 |
| 3 Grace admin-only | ✅ | 確認，T-B 修正，見 ADV-4 |
| 4 A1 可開，知 ADV-1 | ⚠️ 修正 | A1b 必須綁 A2；A1a(UX only)可先上，見 ADV-1 |
| 5 A1 done 定義 | ✅ | 確認，補 UX 清單，見 ADV-9 |

---

## 更新後的 A1/A2 切分

### A1a（UX only，可獨立先上，不依賴任何決策）

- L6–L12 全站橫幅降級（黃警報→灰標唯讀）
- 文案拆分（`academicYearReadOnlyHint` 拆寫入／瀏覽兩句）
- L11 修復（檔期「新增班別」跟 `yearLocked`）

### A1b + A2（判斷修正＋政策窗，必須同發）

**A1b**：
- 修 L1/L2（拆函式、deprecate、admin 永遠真實 today、三處檔期呼叫修正）
- L4 instrumentation（空 label warn）
- ADV-5 空 label 三處一致

**A2**：
- 永久 30 日窗（`isAdminEditableAcademicYearLabel` 加 grace 邏輯）
- 一次性遷移寬限（`2526` → 2026-08-31，常數）
- T-B 修正（teacher 不含 grace）
- L5 teacher cutoff 可配置（`TEACHER_MIN_EDITABLE_LABEL`）
- L3 高優先（繳費／點名／請假 guard 改實體 label；`guardAcademicYearEditForEntity`）
- ADV-8 下拉同步
- 政策文件更新（`ACADEMIC_YEARS.md`）

---

## 結論

團隊對抗模擬挖出了我 Q1–Q7 回覆中的四個真實矛盾（ADV-1 至 ADV-4），全部採納修正。修正後的路線：

- **A1a 今日可開**（UX 降級，零風險，立即改善「系統壞咗」體感）
- **A1b+A2 綁定同發**（判斷修正＋政策窗，不制造空窗倒退）
- **遷移寬限入 code、只包 `2526`、admin-only、T-B 不含 grace**

這是對抗模擬的價值——不是否定方案，而是把「字面執行會出事」的細節在開工前抓出來。團隊這份對抗的品質和我睇過的生命週期孤兒對抗模擬（GAP-P0-1 等）同级。
