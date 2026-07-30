# 學年鎖問題：經過與全面檢查報告

| 欄位 | 值 |
| --- | --- |
| 日期 | 2026-07-31 |
| 性質 | 技術顧問交接／調查備忘（非實作計畫） |
| 作者角色 | 本 repo coding agent（對話內盤點） |
| 環境時點 | 使用者日為 2026-07-31（約落在暑期學年 `26SM`） |
| 工程追蹤 | [`../backlog/academic-year-lock.md`](../backlog/academic-year-lock.md) |
| 前身稽核 | [`2026-07-30-role-ops-adversarial.md`](./2026-07-30-role-ops-adversarial.md) §P0-2 |
| 學年政策正文 | [`../ACADEMIC_YEARS.md`](../ACADEMIC_YEARS.md) |

---

## 1. 給技術顧問的一句話

學年鎖本意是「過期／非當期學年不可改寫」，但現況**參數語意混亂、admin／teacher 雙軌、鎖寫入卻污染瀏覽 UI**；且已證實檔期頁會把學年 `end_date` 誤當成「今天」而錯誤解鎖。問題已從「角色權限加固」拆成獨立 backlog 主題，**尚未實作整固**。

---

## 2. 前後經過（對話脈絡）

### 2.1 起點：角色／權限日常加固

2026-07-30 對抗性稽核（production live）列出多項角色問題，工程追蹤於 [`../backlog/role-ops-hardening.md`](../backlog/role-ops-hardening.md)。其中 **P0-2** 為：

> Admin 在「老師檔期」選歷史學年（如 `2526`）時，學年鎖失效，誤判可編輯。

根因（稽核當日已寫明）：`canEditAcademicYear(label, endDate)` → `isAcademicYearReadOnly(endDate, label)` 對 **admin** 會把第一參數傳入 `isAdminEditableAcademicYearLabel(label, referenceYmd)`，等於把 **`end_date` 當成「今天」**。

### 2.2 同主題已完成的其他項（與學年鎖無關，供對照）

同一輪對話／後續實作中，角色主題其餘項已清完，例如：

| 項 | 摘要 |
| --- | --- |
| P1-3 | 外星人代堂：`canAssignSubstitute = isMgmtStaff()` |
| P1-6／P1-4 | 優惠 nav 僅 alien；老師隱藏一對一「預約上堂」 |
| P1-5／P1-7 | `RequireMgmtRoles` 擋 Payments／Teachers／Leave／Trial／Users deep-link |
| P0-1 | 老師不可取消課堂：UI + `schedules` BEFORE UPDATE 白名單 trigger |
| P1-2 | `inbox_reads` 老師僅自己 `actor_key` |
| P1-1 | 電話／email／薪資移至 `teachers_private` |

使用者當時明確：**暫時唔想碰學年問題**，故 P0-2 未在該輪實作。

### 2.3 轉折：學年鎖不止 P0-2

2026-07-31 使用者指出：除 backlog 已寫的 bug 外，**學年鎖亦造成多處瀏覽／閱讀時的錯誤感**，要求：

1. 全面檢查現行學年鎖設定與功能；
2. 指出對日常運作的問題；
3. 在 backlog **另起新主題**（不要再擠在角色加固裡）。

Agent 完成程式盤點後：

- 新增 [`../backlog/academic-year-lock.md`](../backlog/academic-year-lock.md)（問題 L1–L15、建議方向、工作項初稿）；
- [`../BACKLOG.md`](../BACKLOG.md) 新增「學年鎖整固」；角色主題標 `done`，原 P0-2 標 `moved`。

**本檔**＝給顧問 AI 的敘事＋檢查紀錄；細節勾選表以 backlog 為準。

---

## 3. 現行設計（檢查時的程式事實）

### 3.1 核心模組

| 檔案 | 職責 |
| --- | --- |
| `src/lib/academicYearAccess.ts` | label 排序、`getAdminEditableAcademicYearLabels`、`isClosedAcademicYear`、常數 `ACADEMIC_YEAR_EDITABLE_FROM_YMD = "2026-07-01"` |
| `src/lib/mgmtRole.ts` | `isAcademicYearReadOnly(endDate?, label?)`、`filterAcademicYearOptionsForEdit`、`academicYearReadOnlyHint` |
| `src/lib/academicYearEditGuard.ts` | UI／service 閘：`canEditAcademicYear`、`canEditAcademicYearForDate`、`assertAcademicYearEditable*` |
| `src/lib/courseCode.ts` | `academicYearLabelFromStartDate(ymd)`：7–8 月→`YYSM`，其餘→正規 `YYZZ` |

### 3.2 角色規則（設計意圖）

| 角色 | 規則 |
| --- | --- |
| **alien** | 永不唯讀 |
| **admin** | 僅可編「以 referenceYmd 推算的目前學年」及其「下一學年」 |
| **teacher**（及其他非 admin／alien） | `end_date < 2026-07-01` 或 label 早於 `26SM` → 唯讀 |

文件對照：[`../ACADEMIC_YEARS.md`](../ACADEMIC_YEARS.md) §可編輯門檻。

### 3.3 危險的 API 形狀（顧問必讀）

```ts
// mgmtRole.ts — 同一函式、第一參數語意依角色分叉
isAcademicYearReadOnly(endDate?, label?)
// admin 路徑：endDate 被當成 isAdminEditableAcademicYearLabel 的 referenceYmd（「今天」）
// teacher 路徑：endDate 被當成學年結束日，用於 isClosedAcademicYear
```

```ts
// academicYearEditGuard.ts
canEditAcademicYear(label, endDate?)  // 直接把 endDate 傳入上述函式
canEditAcademicYearForDate(ymd)       // 只用日期推 label，不看班別 academic_year_label
```

檔期頁實際呼叫（bug 現場）：

```ts
// TeacherAvailabilityPage.tsx
canEditAcademicYear(year.label, year.end_date)  // admin 下 end_date ≡ 偽「今天」
```

### 3.4 寫入攔截覆蓋面（service assert）

`assertAcademicYearEditable*` 出現在（非完整列表）：排程增刪改、點名儲存、請假、繳費、補堂、一對一預約、學院校曆休課、老師檔期寫入等。  
**DB 層無對應「學年鎖」RLS**——屬前端／service 約定。

### 3.5 UI 掛鉤（瀏覽體驗相關）

| 頁／元件 | 掛鉤變數 | 行為概要 |
| --- | --- | --- |
| `RollCallPage`／`RollCallClassPanel` | `dateEditable = canEditAcademicYearForDate(date)` | 黃橫幅；不可儲存點名 |
| `ClassDetailView` | `classYearLocked`、`canEditAcademicYearForDate(排程日)` | 橫幅；鎖班別編輯／排程狀態等 |
| `ScheduleManagePage` | `scheduleRowLocked` | 依上課日鎖列上控件 |
| `LeaveManagementView` | `leaveRowEditable` | 歷史列操作／詳情欄 disabled |
| `PaymentsPageView`／`PaymentHistoryView`／`StudentDetailView` | `canEditAcademicYearForDate(付款日)` | 擋登記／標記等 |
| `TeacherAvailabilityPage` | `yearLocked` | 橫幅；寫入應擋，但「由此時段新增班別」按鈕未跟鎖 |
| `ClassesListPage`／開班表單 | `canEditAcademicYear`／`filterAcademicYearOptionsForEdit` | 刪除／複製／狀態；開班學年選項過濾 |

---

## 4. 檢查方法與限制

### 4.1 做了什麼

- 靜態追蹤：上述 lib＋所有 `canEditAcademicYear*`／`assertAcademicYear*`／`filterAcademicYearOptionsForEdit` 呼叫點（`src/` Grep）。
- 對照政策文件：`ACADEMIC_YEARS.md`、role-ops 稽核 §P0-2。
- 以「今日 ∈ `26SM`」心智模型推演 admin／teacher 應鎖／可編集合。
- **未**在本輪重跑 production live session 驗證 L1（沿用 2026-07-30 稽核結論）；**未**改程式完成整固。

### 4.2 沒做什麼

- 無完整 E2E 點擊每頁歷史學年截圖。
- 無量化「職員因黃橫幅誤報 bug」的客服數據——「瀏覽錯誤感」來自程式行為推斷＋使用者口述。
- 無提出已拍板的產品規則（例如 admin 過渡窗 N 日）——backlog 列為待定案。

---

## 5. 檢查發現（按嚴重度歸類）

編號與 backlog [`academic-year-lock.md`](../backlog/academic-year-lock.md) 對齊（L1–L15）。

### 5.1 正確性：鎖錯／解錯

| ID | 發現 |
| --- | --- |
| **L1** | 檔期：admin + `end_date` 作 reference → 歷史學年（如 `2526`）可被誤判可編。稽核 live 已證。 |
| **L2** | `isAcademicYearReadOnly` 參數 overload 無防呆命名；任何 `canEditAcademicYear(label, endDate)` 對 admin 都危險。 |
| **L3** | 多數營運寫入用 **日期→label**；班別鎖用 **實體 label**。跨期補堂／改期／暑期碰正規日，鎖界可能與營運歸屬不一致。 |
| **L4** | admin 路徑 `label` 空白 → 視為可編，缺資料可繞過。 |
| **L5** | teacher cutoff 寫死 `2026-07-01`／`26SM`；admin 為滾動「今日＋下一」——雙軌長期會分叉、文案共用易誤導。 |

### 5.2 瀏覽／閱讀：鎖寫入殃及查閱

| ID | 發現 |
| --- | --- |
| **L6** | 點名選歷史日：頂部警報式黃橫幅＋整頁不可存；職員只想「睇返舊日點名」仍被警告轟炸。 |
| **L7–L10** | 班別詳情／排程列／請假／繳費：歷史資料可開，但控件大面積 disabled＋同一句 hint——體感像權限故障或系統壞。 |
| **L11** | 檔期 `yearLocked` 時，「由此時段新增班別」仍可導向開班頁，失敗點延後。 |
| **L12** | `academicYearReadOnlyHint()` 不區分實際觸發規則（admin 滾動 vs teacher cutoff）。 |

### 5.3 營運政策缺口

| ID | 發現 |
| --- | --- |
| **L13** | 一進入新學年（例：`26SM`），admin **合法地**改不了整個 `2526` 殘務（點名錯帳、請假、繳費更正、排程）；實務上被迫切外星人。這是「政策過硬」而不只是 bug。 |
| **L14** | 產品未定義「唯讀瀏覽模式」文案／流程，與「你無權限」難以區分。 |
| **L15** | 無 DB 層學年鎖；長期一致性／防 API 繞過屬加固項，非本輪瀏覽痛點主因。 |

### 5.4 與「角色加固」的邊界

- L1 最初掛在 role-ops P0-2，因為稽核當日用角色帳號測出。
- 全面檢查後確認：**主體是學年存取政策與 Guard API 設計**，不是 RLS／mgmt_role 切換本身。
- 故已遷出；角色主題其餘項視為完成。

---

## 6. 建議顧問優先關注的決策點

實作前建議產品／顧問先拍板，否則工程只能修 L1／L2 這類明確 bug：

1. **Admin 對剛結束學年的修正權**（L13）：完全禁止／結束後 N 日窗口／僅 alien／申請解鎖？
2. **瀏覽 UX 原則**（L6–L12）：歷史＝可讀＋控件 disabled＋低調「唯讀」；禁止警報式整頁橫幅？
3. **鎖的主鍵**（L3）：以實體 `academic_year_label` 為準，還是繼續以事件日期推算？
4. **Teacher cutoff**（L5）：維持 cutover 常數，還是改字典／設定？

工程上無爭議、可先做的：

- 修 L1；重構 L2（具名參數／拆函式）；audit 全部 `canEditAcademicYear(*, endDate)` 呼叫點。

---

## 7. 相關路徑速查

```
docs/backlog/academic-year-lock.md          ← 工程待辦主檔（L1–L15）
docs/BACKLOG.md                            ← 主題索引「學年鎖整固」
docs/backlog/role-ops-hardening.md         ← P0-2 = moved；主題 done
docs/audits/2026-07-30-role-ops-adversarial.md
docs/ACADEMIC_YEARS.md
src/lib/academicYearAccess.ts
src/lib/mgmtRole.ts                        ← isAcademicYearReadOnly
src/lib/academicYearEditGuard.ts
src/components/teacherAvailability/TeacherAvailabilityPage.tsx  ← L1 現場
```

---

## 8. 狀態（截至本報告）

| 項目 | 狀態 |
| --- | --- |
| 問題盤點與 backlog 專題 | 已完成 |
| L1 程式修復 | **未做**（使用者曾暫緩；現改專題跟進） |
| L2–L15 實作 | **未做**；待決策＋分 PR |
| 本報告 | 供技術顧問 AI 理解前後經過與檢查邊界 |

若顧問下一步要出實作計畫，請以 [`../backlog/academic-year-lock.md`](../backlog/academic-year-lock.md) 工作項表為勾選底稿，並先回覆 §6 決策點。
