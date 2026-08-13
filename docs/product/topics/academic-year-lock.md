# 學年鎖（唯讀／可編輯）整固 — 已取消

| 欄位 | 值 |
| --- | --- |
| 狀態 | `cancelled` |
| 優先 | — |
| 取代為 | [academic-year-unlock-soft-guard.md](./academic-year-unlock-soft-guard.md)（撤硬鎖＋confirm＋audit） |
| 決策 | 2026-07-31：兩邊顧問對齊不整固；見 [audits/2026-07-31-academic-year-lock-rethink.md](../audits/2026-07-31-academic-year-lock-rethink.md) |
| 索引 | [BACKLOG.md](../BACKLOG.md) |
| 盤點日期 | 2026-07-31 |

## 結論（最終）

**不實作**本檔 A1b／A2／L1–L15 整固路線。  
硬鎖成本（雙軌、誤用 `end_date`、瀏覽恐慌、過渡窗／遷移複雜度）高過「誤操作防呆」收益；改以撤鎖＋輕量替代。  

以下正文保留作歷史盤點備查，**勿再當待辦勾選**。

---

## 現行機制（程式錨點）— **撤鎖前快照（已過時）**

> 下表描述撤硬鎖**之前**的行為，僅供稽核鏈備查。  
> **現行政策**見 [academic-year-unlock-soft-guard.md](./academic-year-unlock-soft-guard.md) 與 [`ACADEMIC_YEARS.md`](../policies/academic/ACADEMIC_YEARS.md) §1.1。

| 層 | 檔案 | 行為（舊） |
| --- | --- | --- |
| 門檻常數 | `src/lib/academicYearAccess.ts` | `ACADEMIC_YEAR_EDITABLE_FROM_YMD = 2026-07-01`；teacher 用 `isClosedAcademicYear`；admin 用 `isAdminEditableAcademicYearLabel(label, referenceYmd)` |
| 角色閘 | `src/lib/mgmtRole.ts` → `isAcademicYearReadOnly` | alien 永不鎖；admin／teacher 見上 |
| UI／服務閘 | `src/lib/academicYearEditGuard.ts` | `canEditAcademicYear(label, endDate?)`、`canEditAcademicYearForDate(ymd)`（**由日期推 label**，唔睇班別 `academic_year_label`） |
| 服務層硬擋 | `assertAcademicYearEditable*` | 排程／點名／請假／繳費／檔期／補堂／一對一預約等寫入前拋錯 |

**日期 → label**（`academicYearLabelFromStartDate`）：7–8 月→`YYSM`；其餘→正規 `YYZZ`。

**以今日 2026-07-31（落在 `26SM`）為例（政策正確時）：**

| 角色 | 可編 | 應鎖 |
| --- | --- | --- |
| alien | 全部 | — |
| admin | `26SM`、`2627` | `2526` 及更早、更遠未來 |
| teacher | `26SM` 起 | `2526` 及更早（cutoff） |

---

## 問題清單（日常運作）

### A. 錯誤鎖／解鎖（正確性）

| ID | 嚴重度 | 現象 | 影響 |
| --- | --- | --- | --- |
| **L1** | 高 | 檔期頁 `canEditAcademicYear(year.label, year.end_date)`：admin 把 `end_date` 當 reference「今天」→ 選 `2526`（end 2026-06-30）被誤判可編 | 歷史檔期可被改；原 role-ops **P0-2** |
| **L2** | 高 | `isAcademicYearReadOnly(endDate, label)` 參數 overload 無型別名／註解防呆；呼叫點易再犯 | 同類 bug 會再出現 |
| **L3** | 中 | `canEditAcademicYearForDate` 只認**日曆推得嘅 label**，唔認班別／單據上的 `academic_year_label` | 暑期補正規堂、跨期改期：鎖／開與營運歸屬不一致 |
| **L4** | 中 | admin：`label` 空白 → 視為可編（`!label` 直接放行） | 缺 label 資料繞過學年鎖 |
| **L5** | 中 | teacher cutoff **寫死 2026-07-01**；admin 係滾動「今日＋下一」 | 翌年後 teacher 規則會過時或與 admin 長期不一致 |

### B. 瀏覽／閱讀體驗（鎖寫入殃及查閱）

| ID | 嚴重度 | 現象 | 觸點 |
| --- | --- | --- | --- |
| **L6** | 高 | 點名選歷史日：頂部黃橫幅＋整頁不可儲存；**查閱當日紀錄仍要睇到橫幅**，語氣似故障 | `RollCallPage`／`RollCallClassPanel` |
| **L7** | 中 | 班別詳情：歷史學年黃橫幅；排程狀態／刪除／補堂入口全收 | `ClassDetailView` `classYearLocked` |
| **L8** | 中 | 排程管理：依 `scheduled_date` 鎖列（課室／狀態等控件 disabled） | `ScheduleManagePage` `scheduleRowLocked` |
| **L9** | 中 | 請假：歷史列詳情可開但欄位全 disabled；列表操作鈕灰 | `LeaveManagementView` `leaveRowEditable` |
| **L10** | 中 | 繳費：付款日屬鎖住學年 → 登記／標記動作擋；提示同句「僅 xx 及 yy 可修改」 | `PaymentsPageView`、`PaymentHistoryView`、`StudentDetailView` |
| **L11** | 中 | 檔期：鎖住時仍可撳「由此時段新增班別」跳去開班，之後先再被擋 | `TeacherAvailabilityPage` pattern 按鈕未跟 `yearLocked` |
| **L12** | 低 | 所有鎖共用 `academicYearReadOnlyHint()`——admin／teacher 規則不同，文案未必對應實際原因 | `mgmtRole.ts` |

### C. 營運政策缺口（產品／流程）

| ID | 嚴重度 | 現象 | 說明 |
| --- | --- | --- | --- |
| **L13** | 高 | 學年一過（例入 `26SM` 後），admin **無法**修正 `2526` 點名／請假／繳費／排程；只得切外星人 | 過渡期／對帳日常被逼升權 |
| **L14** | 中 | 「瀏覽歷史」與「禁止改寫」未分開：無明確唯讀模式文案（例如「只讀 · 要改請切外星人」） | 職員以為系統壞或權限錯亂 |
| **L15** | 低 | 學年鎖**純前端／service assert**，DB 無對應 RLS；懂 API＋alien 以外帳號理論上仍可能繞過（視角色） | 長期可與 RLS 對齊；非本輪必做 |

---

## 建議修法方向（未實作；待產品拍板）

1. **拆 API**：`isAdminYearEditable(label, { asOfYmd })` vs `isTeacherYearClosed(label | endDate)`；禁止 `endDate` 傳入 admin reference。
2. **修 L1**：檔期／一切 admin 呼叫只傳 label；`asOf` 永遠真實今天（或明確具名參數）。
3. **瀏覽 vs 寫入**：歷史學年／日期＝可開可睇；寫入控件 disabled＋一句「唯讀（學年已鎖）」；避免整頁警報感。
4. **產品定案 L13**：admin 過渡窗（例如結束後 N 日仍可改）、或「申請解鎖」、或明確只准 alien——寫入 [`ACADEMIC_YEARS.md`](../policies/academic/ACADEMIC_YEARS.md)。
5. **對齊 L3**：關鍵寫入改以**實體學年 label**（班／單據）為準，日期推 label 只作後備。
6. **Cutoff**：teacher 門檻改由字典／設定驅動，勿永久寫死 2026-07-01。

---

## 工作項（初稿；實作前可再拆 PR）

| 狀態 | ID | 優先 | 工作 |
| --- | --- | --- | --- |
| cancelled | L1–L15 等 | — | 全部取消；改見 [academic-year-unlock-soft-guard.md](./academic-year-unlock-soft-guard.md) |

~~以下原表作廢~~


## 相關

- 學年定義：[`ACADEMIC_YEARS.md`](../policies/academic/ACADEMIC_YEARS.md)
- 舊追蹤（已遷出）：[role-ops-hardening.md](./role-ops-hardening.md) P0-2
- 稽核片段：[audits/2026-07-30-role-ops-adversarial.md](../audits/2026-07-30-role-ops-adversarial.md) §P0-2
