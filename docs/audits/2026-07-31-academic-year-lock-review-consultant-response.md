# 學年鎖整固 — 顧問對團隊疑問的回覆

> 角色：**外部技術顧問** ⚠️ 非團隊成員，獨立審閱  
> 對象：[`2026-07-31-academic-year-lock-team-response.md`](./2026-07-31-academic-year-lock-team-response.md)（團隊觀察與疑問）  
> 基於：顧問審閱、團隊檢查報告、學年政策文件  
> 日期：2026-07-31  
> 狀態：**請團隊確認後更新 backlog 並開 A1**

---

## Q1 — L13 與「已經過期的 `2526`」

> 若採 30 日窗，`2526` 已出窗。顧問建議 (a) 只定義未來規則、(b) 上線時給遷移寬限、還是 (c) 其他？

**建議 (b) 的變體：一次性遷移寬限。**

規則分兩層寫：

**永久規則**（寫入 `ACADEMIC_YEARS.md`）：

> Admin 可編輯學年 = 目前學年 ∪ 下一學年 ∪ 剛結束學年（結束後 30 日內）。

**一次性遷移條款**（寫入 `ACADEMIC_YEARS.md` 或上線公告，不寫入程式）：

> 2026-07-31 上線時，`2526` 及 `25SM` 享有額外寬限至 **2026-08-31**（暑期結束日）。此寬限為一次性遷移措施，不納入永久規則。

理由：
- (a)「現債繼續 alien」等於沒有解決 L13 的當下痛點——行政現在最需要改的就是 `2526` 殘務。
- (b) 用「上線日到暑假結束」作遷移窗，給了行政整個八月清理 `2526` 的點名錯帳和請假更正。暑假本身就是行政對帳季，時間合理。
- 2026-09-01 起（進入 `2627`），`2526` 遷移窗關閉，全面回歸永久規則（30 日窗）。此時 `2526` 已結束 62 日，不應再有日常修正需求。

實作上：A1 不碰 L13（見 Q6），所以這條遷移窗在 A2 實作。A2 上線前若遷移窗已過（例如 A2 拖到九月才上），再跟產品確認是否延長或改 alien 清理——但現在討論這個太早。

---

## Q2 — 過渡窗邊界的精確定義

團隊草案：

> Admin 可編 =「目前學年」∪「下一學年」∪「任一學年滿足 `今天 − end_date ≤ 30 日`（且 end_date ≤ 今天）」

**確認，與我原意一致。** 逐項回覆：

- **未開始的「下一學年」是否永遠可編？** 是。現況 `2627`（2026-09-01 起）現在就可編，這是正確的——行政需要在暑假預先設定新學年的班別和排程。不應被過渡窗邏輯影響。
- **窗是否只對已結束學年生效？** 是。`end_date ≤ 今天` 這條件已保證。對未結束的學年，它要嘛是「目前學年」要嘛是「下一學年」，已被前兩個集合覆蓋。
- **暑期 `*SM` 與正規是否同一 N=30？** 是。暑期只有兩個月，30 日窗已覆蓋整個九月（暑期 8/31 結束 → 窗到 9/30），足以讓行政在正規學年開學後完成暑期對帳。不需要為 SM 另設更短的窗。
- **日曆日還是工作日？** **日曆日**。理由：a) 實作簡單（`end_date + 30 days` 字串比較）；b) 工作日定義因地區／假期而異，不值得為此引入 holiday calendar 依賴；c) 30 個日曆日本身已比「約一個月工作日（~22 日）」寬鬆，有緩衝。

**最終規則（可直接寫入文件）**：

> Admin 可編輯學年 =  
> 「目前學年」（`academicYearLabelFromStartDate(今天)` 所屬）  
> ∪ 「下一學年」（`getNextAcademicYearLabel(目前)`）  
> ∪ 任何滿足以下兩條件的學年：  
> &nbsp;&nbsp;1. `end_date ≤ 今天`（已結束）  
> &nbsp;&nbsp;2. `今天 − end_date ≤ 30 日`（日曆日）

---

## Q3 — 實體 label 的權威來源（L3）

團隊猜測基本正確，以下是逐操作確認：

| 操作 | 權威 label 來源 | 說明 |
| --- | --- | --- |
| **點名儲存** | `schedules.scheduled_date` → join `classes.academic_year_label` | 若 class label 為空，fallback `academicYearLabelFromStartDate(scheduled_date)` |
| **請假** | `leaves.leave_date` → join 該日所屬 schedule → class label | 若無 schedule 關聯（獨立請假），fallback `academicYearLabelFromStartDate(leave_date)` |
| **繳費** | `payments.payment_date` → 該 payment 關聯的 `class_id` → `academic_year_label` | 見下方「一單多班」處理 |

**繳費「一單多班／無班」的處理**：

繳費是所有操作中最複雜的，因為一筆 payment 可以跨多班（例如 siblings 合單），也可以完全無班（雜費、書簿費）。

建議策略（三層 fallback）：

1. **有 `class_id`**：以該班的 `academic_year_label` 為準（最精確）。
2. **無 `class_id` 但有 `payment_date`**：以 `academicYearLabelFromStartDate(payment_date)` 為準。
3. **兩者皆無**：fallback 到寬鬆模式（不鎖）——這種資料本身就缺上下文，鎖了只會製造更多 alien 求助。

一單多班的場景：如果 payment 關聯了 N 個班，且各班屬於不同學年（例如暑期＋正規過渡期的合單），**任何一個班的學年可編即視為整單可編**。這是務實取捨——拆單邏輯太複雜，且跨學年合單本身是少見的邊界案例。

**統一入口實作建議**：

```ts
// academicYearEditGuard.ts（A2 新增）
async function guardAcademicYearEditForEntity(opts: {
  classId?: string | null       // 最優先：班別學年
  dateYmd?: string | null       // fallback：日期推 label
  label?: string | null         // 顯式傳入（少數場景）
}): Promise<string | null>      // null = 可編，string = 阻擋原因
```

A1 不需要這個——A1 只修 L1/L2 bug 和 UX 降級，不碰 guard 的判斷邏輯。

---

## Q4 — Teacher 目標語意（L5）

**建議 T-B**：Teacher 可編 = （≥ 地板）∩（admin 同款「目前＋下一」）。

理由：

- T-A（只要 ≥ 地板就可編）會造成 teacher 能改 `2526`（若地板仍是 `26SM` 且 `2526` label order < `26SM`……等等，`2526` order key = 26900? 不，`2526` → 25*1000+900 = 25900，`26SM` → 26*1000+500 = 26500。25900 < 26500，所以 T-A 下 `2526` 也不可編。但 `2627`（26900 > 26500）在 T-A 下可編，即使 admin 在 2027 年 9 月時已鎖 `2627`）。**T-A 會造成「老師比 admin 寬」的倒掛**——團隊已指出這不可接受。
- T-B 保證 teacher 永遠 ≤ admin 的權限範圍。地板的作用是**下限**（不早於某個歷史起點），不是**上限**。
- 實作上 T-B 就是 `isTeacherYearEditable(label) && isAdminEditableAcademicYearLabel(label, { asOfYmd: todayYmd() })`——兩層交集，邏輯清晰。

**最終語意**：

> Teacher 可編輯學年 =  
> `academicYearOrderKey(label) ≥ academicYearOrderKey(TEACHER_MIN_EDITABLE_LABEL)`  
> ∩ Admin 的可編輯學年集合（目前＋下一＋過渡窗）

其中 `TEACHER_MIN_EDITABLE_LABEL` 由字典／設定驅動（目前 = `"26SM"`）。

這樣 2027 年 9 月時：admin 可編 = `2728` + `2829` + `27SM`（若在窗內）；teacher 可編 = 同集合（因為全部 ≥ `26SM` 地板）。雙軌統一，不會分叉。

---

## Q5 — 點名歷史日的讀寫邊界（L6）

**確認團隊預設：可載入、可展開已存出席、不可儲存／不可改狀態。**

進一步具體化 A1 的行為：

| 場景 | A1 行為 |
| --- | --- |
| 選歷史日（學年已鎖） | 正常載入當日 roster + 已存 attendance |
| 查看已存出席 | 可展開每個學生的狀態詳情（出席／缺席／請假標記） |
| 修改出席狀態 | 控件 disabled（radio／select 灰掉）；hover tooltip「2526 學年 · 僅供查閱」 |
| 儲存按鈕 | disabled + tooltip |
| 頁面頂部 | 灰底標籤「2526 學年 · 僅供查閱」（取代現有黃色警報橫幅） |

**不需要**進一步限制到「不可開 roll-call 面板，只導去出席紀錄頁」。理由：
- 點名頁是行政查舊紀錄的自然入口（「邊班邊堂、邊個學生、咩 status」一目了然）。
- 把他們趕去另一個頁面只為了看同一筆資料，體驗更差。
- 只要寫入路徑全 disabled + 視覺上清楚標示唯讀，就不會有「系統壞咗」的錯覺。

這是 A1 範圍內，不依賴任何產品決策。

---

## Q6 — A1 是否必須等 Q1？

**確認團隊解讀正確：A1 不依賴 L13 政策決定，可立即開工。**

A1 的邊界再確認一次：

| A1 做 | A1 不做 |
| --- | --- |
| 修 L1：admin 路徑不再吃 `endDate`，永遠用真實今天 | 改 admin 可編輯學年集合（不過渡窗、不改規則） |
| 修 L2：拆函式／deprecate 舊簽名 | 改 teacher cutoff 機制 |
| 修三個檔期呼叫點（去掉 `endDate`） | 改 guard 判斷邏輯（label vs date） |
| L4 instrumentation（null label warn） | 任何 DB 層改動 |
| L6–L12 UX 降級（橫幅→灰標、文案拆分） | 完整三態狀態機 |
| L11 修復（「新增班別」跟 `yearLocked`） | — |

**無論 L13 最終選 A（硬鎖）、B（過渡窗）、還是 C（申請解鎖），A1 的內容都不變。** 因為 A1 修的是「鎖的判斷是否正確執行現有規則」以及「鎖住後的 UI 呈現」，不是「規則是什麼」。

A2 才根據產品拍板的規則修改 `getAdminEditableAcademicYearLabels`／`isAdminEditableAcademicYearLabel` 的邏輯。

---

## Q7 — 具名 API 與相容

**同意團隊傾向：A1 直接 deprecate + 改名，不等第二輪。**

具體做法：

**第一步：新增具名函式**

```ts
// mgmtRole.ts — 新增
export function isAcademicYearEditableForAdmin(
  label: string | null | undefined,
  opts: { asOfYmd: string }
): boolean {
  if (!label?.trim()) return false  // 保留 AL-4 早退 + instrumentation
  return isAdminEditableAcademicYearLabel(label, opts.asOfYmd)
}

export function isAcademicYearClosedForTeacher(
  endDate?: string | null,
  label?: string | null
): boolean {
  return isClosedAcademicYear(endDate, label)
}
```

**第二步：改 `isAcademicYearReadOnly` 內部實作**

```ts
// mgmtRole.ts — 保留簽名、改內部、加 deprecated
/** @deprecated 請改用 isAcademicYearEditableForAdmin 或 isAcademicYearClosedForTeacher */
export function isAcademicYearReadOnly(
  endDate?: string | null,
  label?: string | null
): boolean {
  const role = getMgmtRole()
  if (role === "alien") return false
  if (role === "admin") {
    if (!label?.trim()) return false
    return !isAcademicYearEditableForAdmin(label, { asOfYmd: todayYmd() })
    //                                        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^ 不再消費 endDate
  }
  return isAcademicYearClosedForTeacher(endDate, label)
}
```

**第三步：遷移三個危險呼叫點**

- `TeacherAvailabilityPage.tsx:70` → `!isAcademicYearEditableForAdmin(year.label, { asOfYmd: todayYmd() })`
- `teacherAvailabilityQueries.ts:182,247` → 同理，改用 `isAcademicYearEditableForAdmin`

**第四步：改 `canEditAcademicYear` 簽名**

```ts
// academicYearEditGuard.ts
/** @deprecated 第二參數 endDate 僅供向後相容；admin 路徑忽略此參數 */
export function canEditAcademicYear(
  label: string | null | undefined,
  _endDate?: string | null  // 改名為 _endDate 表示棄用
): boolean {
  return !isAcademicYearReadOnly(_endDate, label)
}
```

`_endDate` 前綴底線是 JS/TS 的慣用信號（「此參數存在但應忽略」）。不刪參數是為了不炸掉未經 audit 的第三方呼叫（若有），但語意上已明確表示不應再傳。

**不建議**在 A1 就加 eslint rule 禁止傳 `endDate`——那需要自訂規則，成本偏高。`@deprecated` + `_endDate` 命名 + audit 完所有呼叫點已足夠。

---

## 彙總

| Q | 答 | 一句 |
| --- | --- | --- |
| Q1 現債 `2526` | (b) 變體：一次性遷移寬限至 2026-08-31 | 永久規則 30 日窗，上線時給暑假清理期 |
| Q2 窗邊界 | 確認團隊草案正確 | 日曆日、SM 同 N=30、未開始學年不受窗影響 |
| Q3 權威 label | 點名→class label、請假→schedule→class、繳費→class_id fallback date | 統一入口 `guardAcademicYearEditForEntity` A2 實作 |
| Q4 Teacher 語意 | **T-B**（≥ 地板 ∩ admin 目前＋下一） | 老師永不高於 admin |
| Q5 點名歷史日 | 可載入、可展開、不可改、灰標唯讀 | A1 做 |
| Q6 A1 等 Q1？ | **不等，A1 立即開工** | L13 選什麼都不影響 A1 內容 |
| Q7 API 相容 | deprecated + `_endDate` + 三處遷移 | A1 做，不炸舊呼叫 |

---

**團隊下一步**：確認上述回覆後，更新 `backlog/academic-year-lock.md`，開 A1 PR。有需要我再深入任何一點。
