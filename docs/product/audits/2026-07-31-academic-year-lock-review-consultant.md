# 學年鎖整固 — 技術顧問審閱

> **最終狀態（2026-07-31）**：不整固；改撤硬鎖。見 [`ACADEMIC_YEARS.md`](../ACADEMIC_YEARS.md) §1.1、[`academic-year-unlock-soft-guard.md`](../backlog/academic-year-unlock-soft-guard.md)。下文為當日審閱，**勿再當待辦**。

> 角色：**外部技術顧問** ⚠️ 非團隊成員，獨立審閱  
> 對象：[`2026-07-31-academic-year-lock-review.md`](./2026-07-31-academic-year-lock-review.md)（團隊檢查報告）及 [`../backlog/academic-year-lock.md`](../backlog/academic-year-lock.md)（工程待辦 L1–L15；其後 `cancelled`）  
> 基於：程式盤點（`academicYearAccess.ts`、`mgmtRole.ts`、`academicYearEditGuard.ts`）、對抗性稽核 §P0-2、學年政策文件  
> 日期：2026-07-31  
> 狀態：**歷史審閱（已結案：撤鎖）**

---

## 總評

團隊的檢查報告品質很高——從單一 bug（P0-2）挖出三層十五個問題，且正確區分了「程式 bug」「API 設計缺陷」「產品政策空缺」三條線。這份審閱的任務不是重複盤點，而是對每個發現給出**獨立判決、技術取捨建議、以及開工前必須拍板的項目**。

核心結論：L1/L2 是**必須修且現在就能修**的架構性 bug。L6–L12 的瀏覽體驗是**實際營運痛點**但解法取決於產品決定。L13 是**最難但也最重要的政策決策**——它決定了整個學年鎖的「硬度」應該設在哪裡。

---

## AL-1：`end_date` 誤當 reference「今天」（L1 + L2）

**判決**：Agree — 這是全報告最清晰的 bug，不是設計取捨，是實作錯誤。

**理由**：

```ts
// mgmtRole.ts:82-93 — 現況
export function isAcademicYearReadOnly(endDate?, label?) {
  const role = getMgmtRole()
  if (role === "alien") return false
  if (role === "admin") {
    if (!label?.trim()) return false
    return !isAdminEditableAcademicYearLabel(label, endDate?.slice(0,10) ?? null)
    //                                               ^^^^^^^^ 這裡：endDate 被當成 referenceYmd
  }
  return isClosedAcademicYear(endDate, label)
}
```

對 teacher，`endDate` 是學年結束日（語意正確：判斷是否已過期）。對 admin，`endDate` 被塞進 `isAdminEditableAcademicYearLabel(label, referenceYmd)` 的第二參數——即「今天」——導致傳入 `2026-06-30`（`2526` 的 end_date）時，admin 被判定為「目前學年仍是 `2526`」，歷史檔期錯誤解鎖。

L1 和 L2 本質是同一個問題的兩個面：L1 是症狀（檔期頁踩雷），L2 是根因（API 形狀鼓勵誤用）。

**全量 audit 結果**（共 8 處 `canEditAcademicYear` 呼叫 + 4 處 `assertAcademicYearEditable` 呼叫）：

| 檔案 | 行號 | 呼叫 | 傳 endDate？ | 風險 |
| --- | --- | --- | --- | --- |
| `TeacherAvailabilityPage.tsx` | 70 | `canEditAcademicYear(year.label, year.end_date)` | **是** | **L1 現場** |
| `teacherAvailabilityQueries.ts` | 182 | `assertAcademicYearEditable(year.label, year.end_date)` | **是** | **服務層也中** |
| `teacherAvailabilityQueries.ts` | 247 | `assertAcademicYearEditable(ay.label, ay.end_date)` | **是** | **服務層也中** |
| `ClassesListPage.tsx` | 390,424,438,976,995,1005 | `canEditAcademicYear(label)` | 否 | ✅ 安全 |
| `ClassDetailView.tsx` | 314 | `canEditAcademicYear(label)` | 否 | ✅ 安全 |
| `ClassCreatePage.tsx` | 79 | `isAcademicYearReadOnly(undefined, label)` | 明傳 undefined | ✅ 安全 |
| `classQueries.ts` | 460 | `assertAcademicYearEditable(label)` | 否 | ✅ 安全 |
| `canEditAcademicYearForDate` 全系列 | 15 處 UI + 23 處 service | date → label → canEditAcademicYear(label) | 否 | ✅ 安全（只傳 label） |

三個傳 `endDate` 的呼叫點全部在**檔期模組**（UI + service），全數危險。其他所有模組（班別、點名、請假、繳費、排程）都沒有傳 `endDate`——這解釋了為什麼 bug 只在檔期頁被觸發。

**建議**：**不給選項，直接修。** 做法分兩層：

**第一層（修 bug，A1 級）**：拆成兩個函式，消滅參數 overload：

```ts
// 方案：具名參數，語意不可誤讀
function isAcademicYearEditableForAdmin(
  label: string | null | undefined,
  opts: { asOfYmd: string }  // 永遠是「今天」，不是 endDate
): boolean

function isAcademicYearClosedForTeacher(
  endDate?: string | null,
  label?: string | null
): boolean  // 保留現有邏輯，僅改名
```

`isAcademicYearReadOnly` 改成內部分派：

```ts
export function isAcademicYearReadOnly(
  endDate?: string | null,
  label?: string | null
): boolean {
  const role = getMgmtRole()
  if (role === "alien") return false
  if (role === "admin") {
    if (!label?.trim()) return false  // 見 AL-3 討論
    return !isAcademicYearEditableForAdmin(label, { asOfYmd: todayYmd() })
  }
  return isAcademicYearClosedForTeacher(endDate, label)
}
```

重點：admin 路徑**永遠用真實今天**，不從參數推。`endDate` 參數對 admin 是 dead code——保留只為向後相容，內部不用。

**第二層（修呼叫點，A1 級）**：三個檔期模組的呼叫點改為只傳 label：

- `TeacherAvailabilityPage.tsx:70` → `canEditAcademicYear(year.label)`（去掉 `year.end_date`）
- `teacherAvailabilityQueries.ts:182` → `assertAcademicYearEditable(year.label)`（去掉 `year.end_date`）
- `teacherAvailabilityQueries.ts:247` → `assertAcademicYearEditable(ay.label)`（去掉 `ay.end_date`）

**優先級**：P0 — 開工第一件事，不依賴任何產品決策。

---

## AL-2：鎖的主鍵——日期推 label vs 實體 label（L3 + L4）

**判決**：Agree — L3 是真正的架構張力，L4 是防呆漏洞。

**理由**：

現況有兩套路徑判斷學年：

| 路徑 | 函式 | 用法 |
| --- | --- | --- |
| 日期推 label | `canEditAcademicYearForDate(ymd)` → `academicYearLabelFromStartDate(ymd)` | 排程日、點名日、付款日 |
| 實體 label | `canEditAcademicYear(label, endDate?)` | 班別 `academic_year_label`、檔期學年 |

L3 的問題：暑期補正規堂（如 `26SM` 開的補堂補 `2526` 的缺堂），補堂日落在 `26SM`，日期推 label 會判可編；但該補堂營運上歸屬 `2526`。反過來，正規學年內開的暑期預備堂也有同樣的歸屬不一致。

L4：admin 路徑 `!label?.trim() → return false`（= 可編），是在防 `null` 炸毀，但副作用是缺 `academic_year_label` 的舊資料會繞過學年鎖。這個早退條件應該保留（防禦性），但應該 log warning 或至少在 audit 場景觸發通知。

**建議**：

**L3**：**選項 B（漸進式遷移）**——不要求階段 A 全部改以實體 label 為準，但訂出優先級：

- **高優先**（涉及金流／出席）：繳費、點名、請假的寫入 guard 改為以**該單據上的 `academic_year_label`** 為準，日期推 label 作 fallback（label 為空時）。這群操作的正確性要求最高。
- **中優先**：排程、補堂——目前以日期推 label 可接受，因為這些操作的上課日本身就是營運歸屬的合理 proxy。
- **低優先**：純瀏覽——日期推 label 對「顯示哪個學年的資料」足夠。

實作上，可以在 `academicYearEditGuard.ts` 新增一個 `guardAcademicYearEditForEntity(opts: { label?: string, date?: string })` 統一入口：label 優先，date fallback。

**L4**：**選項 A（加 instrumentation，不改行為）**——保留早退（不讓 null label 炸毀 UX），但 `console.warn` 或寫入 `mgmt_audit_log`（若 alien 在線）。不建議改成「null label → 視為鎖住」，因為這會讓沒 label 的舊資料完全無法操作，比繞過更差。

**優先級**：L3 高優先項目 P1（依賴 §決策點 3 的拍板），L4 P2。

---

## AL-3：雙軌 cutoff 的長期分叉風險（L5）

**判決**：Agree — 這不是 immediate bug，但是**技術債**，放著會隨時間惡化。

**理由**：

```
Teacher: ACADEMIC_YEAR_EDITABLE_FROM_YMD = "2026-07-01"  ← 寫死常數
Admin:   滾動「academicYearLabelFromStartDate(今天)」+ 下一學年
```

兩套規則在 2026 年給出相同結果（`2526` 鎖、`26SM` 開），但含意完全不同：
- Teacher 規則是「2026-07-01 前結束的學年 = 歷史」
- Admin 規則是「不是目前學年也不是下一學年 = 歷史」

2027 年 9 月（進入 `2728`），teacher 仍只開 `26SM` 起——但 `2627` 已經結束了，按 teacher 規則仍可編？這取決於 `isClosedAcademicYear` 的 end_date 比較——如果 `2627` 的 `end_date = 2027-06-30 < 2026-07-01`？不，`2027-06-30 > 2026-07-01`，所以不會被 `isClosedAcademicYear` 鎖。換言之，teacher cutoff 的**真正作用**是 `isClosedAcademicYear` 內的 `end < "2026-07-01"` 比較，不是 `ACADEMIC_YEAR_EDITABLE_FROM_YMD` 本身。

等等——讓我重新追。`isClosedAcademicYear(endDate, label)` 的邏輯：
1. 若 `endDate < "2026-07-01"` → closed
2. 否則若 `label` 的 order key `< EDITABLE_ORDER_FROM (26500)` → closed
3. 否則 → not closed

所以對 teacher，`2627`（endDate = 2027-06-30）不會被條件 1 鎖，order key = 26900 > 26500，不會被條件 2 鎖 → `2627` 對 teacher 可編。但 admin 在 2027 年 9 月時，目前學年是 `2728`，`2627` 不是目前也不是下一 → admin 鎖、teacher 開。**這就是分叉**。

但實際上 2027 年 9 月時 `ACADEMIC_YEAR_EDITABLE_FROM_YMD` 應該已被更新（或改成可配置），所以這不是靜態分析能判定的。重點是：**雙軌的語意不一致，長期維護會出錯**。

**建議**：**選項 B（統一為滾動規則＋可配置 cutoff）**。

Teacher 規則改為與 admin 同源的滾動判斷，但加上一個**獨立的最小可編輯學年**（可配置，目前 = `26SM`）：

```ts
// 取代 ACADEMIC_YEAR_EDITABLE_FROM_YMD 常數
const TEACHER_MIN_EDITABLE_LABEL = "26SM"  // 來自字典或 env

function isTeacherYearEditable(label: string): boolean {
  return academicYearOrderKey(label) >= academicYearOrderKey(TEACHER_MIN_EDITABLE_LABEL)
}
```

這樣 teacher 的規則變成：「早於 `26SM` 的學年 = 歷史；`26SM` 及以後 = 按正常滾動規則」。雙軌統一到同一套「目前＋下一」邏輯，只差在 teacher 多了一個歷史地板。

`TEACHER_MIN_EDITABLE_LABEL` 放進 `academic_years` 字典或 env——不要寫死常數。

**優先級**：P2 — 不阻擋 A1，但在下次 cutover 前（進入 `2627` 或 `27SM` 時）必須處理。

---

## AL-4：鎖寫入污染瀏覽體驗（L6–L12 + L14）

**判決**：Agree — 這是用戶口中「錯誤感」的主要來源，但**解法不是技術問題，是 UX 原則問題**。

**理由**：

現況把「不可寫入」和「不可查閱」綁在同一條線上。十五個呼叫點中，多數用 `canEditAcademicYear*` 同時控制：
- 寫入 guard（正確）
- UI 控件 disabled（部分正確）
- 整頁黃色警報橫幅（錯誤——查閱歷史不該是警報）
- 列表操作按鈕隱藏（灰色地帶——「刪除」應隱藏，「查看詳情」不應）

核心混淆：`academicYearReadOnlyHint()` 的語氣是**拒絕操作**（「僅 xx 及 yy 學年可新增或修改」），但被用在**純瀏覽場景**（只想看舊點名紀錄的使用者看到「你不可修改」的橫幅 = 系統在拒絕一個他沒要求的操作）。

**建議**：**選項 B（三態模型 + 語境文案）**。

將目前的 boolean（可編／不可編）拆成三態：

| 態 | 語意 | UI 行為 | 適用場景 |
| --- | --- | --- | --- |
| **可編** | 目前學年，角色有權 | 全功能 | 今日點名、當期排程 |
| **唯讀．歷史** | 已過學年，正常查閱 | 可開可睇；寫入控件 disabled＋低調「唯讀」標籤（非橫幅）；無警報 icon | 查舊點名、歷史請假 |
| **無權限** | 角色根本不該看／改 | 不適用（目前學年鎖不處理此態——那是 RLS 的事） |

關鍵改動：

1. **拆分 guard 函式**：`canEditAcademicYear*` 保留為寫入判斷；新增 `isAcademicYearHistorical(label)` 專門給 UI 判斷「是否顯示唯讀模式」。
2. **橫幅降級**：歷史學年／日期不再用黃色 warning 橫幅。改為：頁面頂部低調灰底 `「2526 學年 · 僅供查閱」`（像 GitHub 的 archived repository label），或只在 hover 寫入控件時 tooltip 顯示。
3. **文案分家**：`academicYearReadOnlyHint()` 拆成兩句：
   - 寫入阻擋（拋錯用）：`「2526 學年已結束，不可修改。如需修正請聯絡行政主管。」`
   - 瀏覽提示（UI 用）：`「2526 學年 · 僅供查閱」`
4. **L11 修復**：檔期頁 `yearLocked` 時，「由此時段新增班別」按鈕 disable（不是隱藏——隱藏會讓人不解為何按鈕消失）。

**優先級**：P1 — UX 原則是 §決策點 2，但文案拆分和橫幅降級的技術實作不依賴產品決策，可先做。

---

## AL-5：Admin 對歷史學年的修正權（L13）

**判決**：這是整份報告最關鍵的**產品政策決策**，技術上有多種實作路徑，但必須先有答案才能寫程式。

**理由**：

目前的行為是硬的：學年一過，admin 就完全不能改——點名錯帳、請假更正、繳費修改全部被擋，只能切 alien。這是把 alien 當成「萬能後門」用，但 alien 的設計意圖是**超級管理（刪班／刪老師）**，不是「行政日常糾錯」。

有三種政策立場，對應不同實作：

| 立場 | 規則 | 實作 | 風險 |
| --- | --- | --- | --- |
| **A. 硬鎖** | 過了就是過了，要改只能 alien | 現況（修好 L1 後） | 行政被迫升權；alien 操作無 audit trail 區分 |
| **B. 過渡窗** | 學年結束後 N 日內 admin 仍可改（如 30 日） | `isAcademicYearEditableForAdmin` 加 `graceDays` 參數 | 需定義 N；跨暑期邊界要特別處理 |
| **C. 申請解鎖** | admin 可「申請解鎖」特定學年／特定學生，alien 批准後限時開放 | 新表 `academic_year_unlock_requests` + alien 審批 UI | 實作成本最高；但 audit trail 最完整 |

**建議**：**選項 B（30 日過渡窗）+ 保留 alien 後門**。

理由：
- 選項 A 把營運負擔推給 alien（= 技術人員／Hoi Ying），不可持續。
- 選項 C 是長期理想，但階段 A 的實作成本太高（新表、審批 UI、時限邏輯）。
- 選項 B 覆蓋了最多日常場景（行政在學年結束後一個月內對帳、修正錯漏），且實作簡單——改 `isAdminEditableAcademicYearLabel` 加一個 `graceDays` 參數。

具體規則提案：

> Admin 可編輯 = 目前學年 + 下一學年 + 剛結束學年（若 `今天 − 該學年 end_date ≤ 30 日`）

以今日 2026-07-31 為例：`2526` end_date = 2026-06-30，距今 31 日 → **不可編**（過渡窗已關）。若今天是 2026-07-15，距今 15 日 → **可編**。

跨暑期邊界的特殊處理：暑期結束後（9 月 1 日起），剛結束的暑期學年（如 `26SM` end_date = 2026-08-31）享有 30 日過渡窗；同時正規 `2627` 是目前學年。兩個窗口可以重疊——這不是 bug，是預期行為。

**優先級**：P0 — 這是 §決策點 1，開工前必須拍板。若團隊選 B，我可以出精確的規則表。

---

## AL-6：無 DB 層學年鎖（L15）

**判決**：Agree — 這是長期加固項，不是本輪優先。

**理由**：目前學年鎖全在 service/frontend 層。理論上，知道 API 的 teacher 可以用 `assertAcademicYearEditable` 不覆蓋的路徑繞過。但實務上：
- 學年鎖的主要價值是**防止誤操作**（UI 炸彈、行政選錯學年），不是防止惡意攻擊。
- 惡意攻擊的威脅模型中，能繞過學年鎖的 teacher 帳號本身已有 RLS 限制（不能刪 attendance 等）。
- DB 層學年鎖需要 RLS 政策知道「每列的學年歸屬」，這對排程（透過班別→學年）和點名（透過排程→班別→學年）意味著 nested subquery，效能需謹慎評估。

**建議**：**階段 C 處理**。在學年鎖 UX 和 API 穩定後，挑選 2–3 條最高風險的寫入路徑（如 attendance DELETE/UPDATE、payments UPDATE）加 DB 層 `academic_year_label` 閘。不需要全表覆蓋。

**優先級**：P3 — 列入 backlog 但不排入階段 A/B。

---

## 四題直答（對應檢查報告 §6）

### 1. Admin 對剛結束學年的修正權

**建議選項 B**：結束後 30 日過渡窗（詳見 AL-5）。不建議完全禁止（把壓力推給 alien），也不建議現階段就做申請解鎖系統（成本太高）。

### 2. 瀏覽 UX 原則

**建議三態模型**（詳見 AL-4）：

> 歷史學年／日期＝可開可睇＋寫入控件 disabled＋低調灰底「唯讀」標籤。  
> 禁止黃色警報橫幅用於純瀏覽場景。  
> `academicYearReadOnlyHint()` 拆成「寫入阻擋文案」和「瀏覽提示文案」兩句。

這個原則不依賴 §1 的政策決定，可以立即開工。

### 3. 鎖的主鍵：日期推 label vs 實體 label

**建議漸進式遷移**（詳見 AL-2）：

- 金流／出席相關的寫入 guard（繳費、點名、請假）：以**單據上的 `academic_year_label`** 為準。
- 排程／補堂：維持日期推 label（上課日是合理 proxy）。
- 全部 guard 保留 date fallback（label 為空時）。
- 班別操作（開班、刪班、複製）：已用實體 label，維持。

### 4. Teacher cutoff 機制

**建議改為可配置**（詳見 AL-3）：

- 將 `ACADEMIC_YEAR_EDITABLE_FROM_YMD = "2026-07-01"` 常數改為字典驅動的最小可編輯 label（`TEACHER_MIN_EDITABLE_LABEL = "26SM"`）。
- Teacher 規則統一為「不早於最小可編輯 label」+「非歷史學年」。
- 長期目標：admin 和 teacher 用同一套「目前＋下一」邏輯，只差在 teacher 有歷史地板。

---

## 建議的階段切分

參照生命週期孤兒方案的 A1/A2 模式，建議學年鎖整固也切兩刀：

### A1（必做，先上，不依賴產品決策）

| 項 | 內容 |
| --- | --- |
| **修 L1** | `isAcademicYearReadOnly` admin 路徑不再吃 `endDate`；永遠用真實今天 |
| **修 L2** | 拆成 `isAcademicYearEditableForAdmin` / `isAcademicYearClosedForTeacher`；audit 全呼叫點 |
| **L4 instrumentation** | null label 早退加 console.warn |
| **L6–L12 文案拆分** | `academicYearReadOnlyHint()` 拆成寫入／瀏覽兩句；橫幅降級為灰底唯讀標籤 |
| **L11 修復** | 檔期「新增班別」按鈕跟 `yearLocked` |

A1 的目標：消滅已知 bug + 消除「系統壞咗」的瀏覽錯誤感。不改變任何政策規則。

### A2（隨後，部分依賴產品決策）

| 項 | 內容 | 依賴 |
| --- | --- | --- |
| **L13 過渡窗** | Admin 30 日修正權 | §決策點 1 拍板 |
| **L3 高優先** | 繳費／點名／請假 guard 改實體 label | §決策點 3 拍板 |
| **L5 可配置 cutoff** | Teacher 最小可編輯 label 字典化 | §決策點 4 拍板 |
| **L14 UX** | 完整三態模型（若 A1 的灰底標籤不夠） | §決策點 2 確認 |
| **L3 中低優先** | 排程／補堂 guard 改實體 label（可選） | 視需要 |

### 階段 C（長期）

| 項 | 內容 |
| --- | --- |
| **L15** | DB 層學年鎖（2–3 條高風險寫入路徑） |
| **L3 收尾** | 統一全部 guard 以實體 label 為準 |

---

## 彙總表

| ID | 判決 | 建議 | 優先 | 依賴產品決策 | 一句理由 |
| --- | --- | --- | --- | --- | --- |
| L1 | Agree | admin 路徑永遠用真實今天 | P0 | 否 | 不是取捨，是 bug |
| L2 | Agree | 拆函式 + 全量 audit | P0 | 否 | API 形狀是 L1 的根因 |
| L3 | Agree | 漸進式遷移，金流／出席優先 | P1 | 是（§3） | 日期推 label 對排程夠用，對金流不夠 |
| L4 | Agree | 保留早退 + instrumentation | P2 | 否 | 不該讓 null label 炸 UX，但要知道發生 |
| L5 | Agree | 統一滾動規則 + 可配置地板 | P2 | 是（§4） | 現在沒壞，但下次 cutover 前必須處理 |
| L6–L12 | Agree | 三態模型 + 文案拆分 + 橫幅降級 | P1 | 部分（§2） | 用戶說「錯誤感」的主因 |
| L13 | Agree | 30 日過渡窗（選項 B） | P0 | **是（§1）** | 最關鍵的政策決策 |
| L14 | Agree | 併入 L6–L12 的 UX 改造 | P1 | 是（§2） | 「唯讀」和「無權限」必須能區分 |
| L15 | Agree | 階段 C，2–3 條高風險路徑 | P3 | 否 | 長期加固，非本輪 bottleneck |

---

## 結論

團隊檢查報告的十五個問題都是真的，但不等於十五個都要在階段 A 解決。關鍵是分清三條線：

1. **現在就修的 bug**（L1/L2）：不依賴任何決策，不改政策，純修實作錯誤。
2. **現在就改的 UX**（L6–L12 文案和橫幅）：不依賴政策，只改前端呈現，效果立竿見影。
3. **必須先拍板的政策**（L13 admin 修正權、L3 鎖的主鍵、L5 cutoff 機制）：技術方案已備，等產品決定。

A1 範圍內的項目（修 L1/L2 + UX 降級 + L4/L11）足以讓系統從「會鎖錯、會嚇人」變成「鎖對、安靜地唯讀」。A1 完成後，學年鎖的**正確性**和**瀏覽體驗**兩個維度都回到基線。A2 再加上政策彈性（過渡窗、實體 label、可配置 cutoff）完成整固。

**建議團隊先就 §決策點 1（admin 修正權）給出方向，其他三點我可以基於技術判斷直接出方案不阻塞開工。**

---

## 相關路徑

```
docs/product/audits/2026-07-31-academic-year-lock-review.md   ← 團隊檢查報告（本審閱對象）
docs/product/topics/academic-year-lock.md                    ← 工程待辦 L1–L15
docs/policies/academic/ACADEMIC_YEARS.md                               ← 學年政策
docs/product/audits/2026-07-30-role-ops-adversarial.md       ← P0-2 原始發現
src/lib/academicYearAccess.ts                         ← 常數／label 邏輯
src/lib/mgmtRole.ts                                   ← isAcademicYearReadOnly（L1/L2 根因）
src/lib/academicYearEditGuard.ts                      ← canEditAcademicYear* 系列
```
