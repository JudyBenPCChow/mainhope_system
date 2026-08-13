# 營運政策索引

介面用語：**繁體中文**。

本櫃＝**校方營運規條／正確做法**（可含尚未由系統強制執行的條款）。  
「畫面而家點用」→ [`../playbooks/_INDEX.md`](../playbooks/_INDEX.md)。  
本學年職員讀本 → [`../year/2627/ops-guide.md`](../year/2627/ops-guide.md)。

| 類型 | 用途 |
| --- | --- |
| **本櫃政策篇** | 業務真相、防呆、與程式錨點；改了要同步系統或標「尚未系統化」 |
| **playbooks** | 接待／管理員操作現況 |
| **meta／AGENTS** | 開發分層、路由、RLS |

---

## 政策姊妹篇

### 學年／校曆

| 文件 | 主題 |
| --- | --- |
| [學年與報讀形式](academic/ACADEMIC_YEARS.md) | 正規 vs 暑期；label、日期、報讀選項；後台寫入不硬鎖歷史學年 |
| [校曆（專科／功輔）](academic/ACADEMIC_CALENDAR.md) | 專科／功輔假日與堂數規則；2627 細節見該檔（部分未入 DB） |

### 報讀／學生

| 文件 | 主題 |
| --- | --- |
| [試堂出單先上紙](enrollment/TRIAL_RECEIPT_BEFORE_ROSTER.md) | 試堂須出單確認後先入池、先上點名紙；免費亦出 $0 單 |
| [學生狀態分類](enrollment/STUDENT_STATUS_CLASSIFICATION.md) | 注冊／報讀／在讀／活躍等 |
| [學生編號](enrollment/STUDENT_CODE.md) | 學號規則 |

### 出席／扣堂

| 文件 | 主題 |
| --- | --- |
| [點名狀態與扣堂](attendance/ATTENDANCE_BILLING.md) | 已上堂數、連堂補堂、追學費 |

### 繳費

| 文件 | 主題 |
| --- | --- |
| [學費學期節奏與逾期罰款](payments/TUITION_TERM_AND_LATE_FEE_POLICY.md) | 按月堂數；逾期 $50（池模型；2026-10-01 起） |
| [收款單據作廢與更正](payments/PAYMENT_RECEIPT_VOID_POLICY.md) | 禁硬刪；作廢／池調動分流 |

### 排課／場地／代堂

| 文件 | 主題 |
| --- | --- |
| [小組課排課規則](scheduling/SCHEDULING_RULES.md) | 格網、功輔、兼職密排、驗證清單 |
| [課室與場地](scheduling/CLASSROOMS_OPS.md) | 可用課室；17K 停用 |
| [同班偶發代課](scheduling/SCHEDULE_SUBSTITUTE_TEACHER.md) | 代堂 ≠ 改主責；只改該堂 `schedules.teacher_id` |

### 計糧

| 文件 | 主題 |
| --- | --- |
| [計糧指南](staffing/PAYROLL_GUIDE.md) | 財務／管理層：計法、強積金、出糧（docx → `generated/payroll/`） |

### 文案

| 文件 | 主題 |
| --- | --- |
| [文案與稱呼](../meta/TERMINOLOGY.md) | **明學教育**；禁院方、「明學補習社」、書院／學院自稱 |

---

## 維護約定

1. **一篇一主題**：勿把代堂、扣堂、學費罰款揉成單一巨檔。
2. **交叉引用**：相關概念用連結（例如追學費 ≠ 逾期罰款）。
3. **尚未系統化**：文首或相關節標明 `系統現況：…`。
4. **改規則時**：先改本櫃對應政策篇 → 再改 [`../year/2627/ops-guide.md`](../year/2627/ops-guide.md) → 同一輪重出 docx（見 `generated/`）。只改寫法／例子可只改 2627。
5. **稱呼**：見 [`../meta/TERMINOLOGY.md`](../meta/TERMINOLOGY.md)。
