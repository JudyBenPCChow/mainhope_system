# 學生狀態分類與判定指引

本文件約束**學生四維業務狀態**的資料來源、計算規則與前端正規化方式，避免「資料庫正確、畫面全錯」或「子字串誤判」等問題再次發生。

介面用語：**繁體中文**。程式入口見 `src/services/studentQueries.ts`、`src/lib/statusTag.ts`、`supabase/migrations/*students*`。  
營運政策索引：[`OPS_POLICIES.md`](../_INDEX.md)。

---

## 1. 業務概念（必先釐清）

| 概念 | 系統欄位／表 | 說明 |
| --- | --- | --- |
| **注冊** | `students.registration_status` | 是否為正式註冊客戶（`已註冊` / `非注冊`）；試堂／查詢屬 `非注冊`。**手動維護**。 |
| **報讀** | `student_class_enrollments` | 學生報讀某一班的紀錄；**一筆 = 一個班別報讀**，不是學生主檔建立日。 |
| **在讀** | `students.enrollment_status` | 現時是否有任一筆 `status = 就讀中` 的班別報讀。**自動計算**。 |
| **活躍** | `students.activity_status` | 過去三個月內是否有班別報讀紀錄（見第 3 節）。**自動計算**。 |
| **學業階段** | `students.academic_stage` | `中學階段` / `已畢業`。**手動維護**。 |
| **legacy 摘要** | `students.status` | 舊欄位；由 DB 函式依上列維度衍生，供舊報表／匯出相容。**勿在 UI 當唯一真相**。 |

**鐵則：**

- **注冊日期 ≠ 報讀日期**。不得用 `students.created_at` 判定活躍或報讀。
- **僅匯入學生主檔、未匯入班別報讀**時，在讀／活躍應為 `非在讀` / `非活躍生`（除非之後新增報讀紀錄）。

---

## 2. 單一真相來源（分層職責）

```
student_class_enrollments（報讀事實）
        ↓
recompute_student_enrollment_state()   ← DB 業務規則（migration 內）
        ↓
students.enrollment_status / activity_status / status
        ↓
studentQueries.asStudent()             ← 讀取、補缺、型別映射
        ↓
UI（Tag、篩選、統計）                   ← 顯示；信任 DB 列舉值
```

| 層級 | 可以做 | 不可以做 |
| --- | --- | --- |
| **DB 函式** | 依報讀紀錄重算 `enrollment_status`、`activity_status`、legacy `status` | 用學生主檔 `created_at` 代替報讀 |
| **service 映射** | 將 DB 字串 map 成 TS union；舊 CSV **匯入相容** | 用 legacy `status` 推斷活躍（除非 `activity_status` 欄位真的不存在） |
| **component** | 顯示 `StudentClassificationTags`、篩選 | 在頁面內另寫 `/活躍/` 等 regex 判斷 |

新增或修改規則時：**先改 DB 函式 + migration，再對齊 `computeDerivedFromEnrollments`（前端同步路徑）**，最後才改 UI 文案。

---

## 3. 現行自動計算規則（2026-07）

### 3.1 `enrollment_status`（在讀 / 非在讀）

- **在讀**：存在任一筆 `student_class_enrollments.status = '就讀中'`（不限學年）。
- **非在讀**：否則；若 `registration_status = 非注冊` 強制為非在讀。

### 3.2 `activity_status`（活躍生 / 非活躍生）

- **活躍生**：過去 **3 個月**內，至少一筆班別報讀紀錄，且事件日期 ≥ `today - 3 months`。
- 事件日期：`coalesce(enroll_date, created_at 轉香港日期)`。
- **目前未過濾** `enrollments.status`（已退讀但日期在近三個月內仍可能算活躍——若業務要改，須另開 migration）。

### 3.3 報讀事件日誌（建議語意）

透過 UI 新增報讀時會寫入 `enrollment_change_events`（`action = 'enroll'`）。語意上最接近「新增一筆報讀」；若日後收緊活躍定義，可優先考慮此表而非 `enroll_date` 回填值。

---

## 4. 子字串誤判（曾發生的 production 級 bug）

### 4.1 問題說明

中文狀態常見 **「非XXX」與「XXX」共用子字串**。用「是否包含某段文字」判斷時，否定詞會被肯定詞規則誤殺。

**典型案例（2026-07）：**

```typescript
// ❌ 錯誤：非活躍生 內含「活躍」
if (/活躍/.test(s)) return "活躍生"

normalizeActivityStatus("非活躍生") // → 誤判為「活躍生」
```

資料庫存的是 `非活躍生`，畫面、篩選、儀表板統計卻全部變成活躍生——**與是否有報讀紀錄無關**。

### 4.2 `statusTag.ts` 的同類問題

`explainStatusTone` 使用 `s.includes(keyword)`。若規則順序為先匹配 `活躍生`、後匹配 `非活躍生`：

```
"非活躍生".includes("活躍生") === true  → 被標成 success 綠色
```

### 4.3 正確寫法原則

1. **固定列舉（CHECK 約束有的值）→ 優先全字精確比對**

   ```typescript
   if (s === "活躍生") return "活躍生"
   if (s === "非活躍生") return "非活躍生"
   ```

2. **必須用模糊比對時（僅舊匯入相容層）→ 否定詞先判斷**

   ```typescript
   if (/非活躍/.test(s)) return "非活躍生"
   if (/活躍/.test(s)) return "活躍生"
   ```

3. **`statusTag` 規則表**：`非活躍生`、`非在讀`、`非注冊` 等**必須排在**對應肯定詞之前（見 `STUDENT_CLASSIFICATION_RULES`）。

4. **同一語意家族**（在讀／非在讀、注冊／非注冊）套用相同模式，改一處時檢查其餘 normalize 函式。

### 4.4 高風險字串對照表（維護時必查）

| 若先匹配 | 會誤傷 |
| --- | --- |
| `活躍` / `活躍生` | `非活躍生` |
| `在讀` / `就讀` | `非在讀` |
| `注冊` / `已註冊` | `非注冊` |
| `畢業` | `中學階段`（較少見；`normalizeAcademicStage` 已用 `!/階段/` 防護） |

---

## 5. `normalize*` 與 `inferStateFromLegacy` 使用邊界

| 函式 | 用途 |
| --- | --- |
| `normalizeRegistrationStatus` | 匯入舊值（僅查詢、試堂）→ `非注冊` |
| `normalizeEnrollmentStatus` | 匯入舊 status 文案 → 在讀／非在讀 |
| `normalizeActivityStatus` | **僅**將 DB／匯入字串規範成 `活躍生`／`非活躍生` |
| `normalizeAcademicStage` | 中學中 → 中學階段 等遷移相容 |
| `inferStateFromLegacy` | **`activity_status` 欄位不存在時**才用；不得假設 legacy `在讀` ⇒ 活躍生 |

`asStudent` 邏輯：

- `row.activity_status != null` → **直接用 DB 值**，不再從 legacy 推活躍。
- 活躍與否**只能**來自報讀紀錄重算結果，不能來自學生主檔的 `status` 或匯入預設。

---

## 6. 資料匯入注意

`supabase/import/20_transform_to_current_schema.sql` 對空值預設：

- `status` → `在讀`
- `enrollment_status` → `在讀`

這是**舊欄位預設**，不代表真有報讀。匯入僅學生清單、無 `student_class_enrollments` 時：

1. 執行含 `recompute_student_enrollment_state` 的 migration 回填；或
2. 手動觸發重算。

否則在 migration 未套用前，前端可能走 legacy 推斷路徑。

**建議（新匯入腳本）：** 無報讀資料時 `enrollment_status` 預設改為 `非在讀`，與業務一致。

---

## 7. UI 顯示約定

- 列表／詳情狀態標籤：共用 `StudentClassificationTags`（`src/components/students/studentsUi.tsx`）。
- 顏色：一律 `statusToTagTone`（`src/lib/statusTag.ts`），禁止頁面內 if/else 對色。
- 列表窄欄可用 `compact` 縮短注冊標籤文案；語意不變。

---

## 8. 變更檢查清單（PR / 改功能前）

- [ ] 業務規則變更是否已寫入**新 migration**（`create or replace function recompute_student_enrollment_state`）？
- [ ] `computeDerivedFromEnrollments` 是否與 DB 邏輯一致？
- [ ] 是否誤用 `students.created_at` 或注冊欄位代表報讀？
- [ ] `normalize*` 對固定列舉是否**精確比對**或**否定詞優先**？
- [ ] `STATUS_TAG_RULES` 是否將 `非*` 規則放在肯定詞之前？
- [ ] 匯入／seed 是否避免無報讀卻預設 `在讀`？
- [ ] `npm run build` 通過；若已加測試，涵蓋 `非活躍生` 不可判為 `活躍生`。

### 8.1 建議單元測試（尚未全面實作時手動驗證）

```text
normalizeActivityStatus("非活躍生") === "非活躍生"
normalizeActivityStatus("活躍生")   === "活躍生"
statusToTagTone("非活躍生")         === "default"   // 不可為 success
normalizeEnrollmentStatus("非在讀") === "非在讀"     // 不可因含「在讀」而判在讀
```

---

## 9. 相關檔案索引

| 檔案 | 內容 |
| --- | --- |
| `supabase/migrations/20260707193000_students_four_dimension_classification.sql` | 四維欄位、首版重算函式 |
| `supabase/migrations/20260707200000_enrollment_status_any_active_enrollment.sql` | 在讀改為「現時就讀中」 |
| `src/services/studentQueries.ts` | 型別、`normalize*`、`computeDerivedFromEnrollments`、`syncStudentEnrollmentState` |
| `src/lib/statusTag.ts` | 標籤色字典 |
| `src/components/students/studentsUi.tsx` | `StudentClassificationTags` |
| `docs/meta/UI_DESIGN_INSTRUCTIONS.md` | Tag／`statusToTagTone` UI 規範 |

---

## 10. 變更紀錄

| 日期 | 摘要 |
| --- | --- |
| 2026-07-07 | 初版：釐清注冊 vs 報讀、子字串誤判、`非活躍生` 顯示 bug 與防呆清單 |
