# 營運政策索引

介面用語：**繁體中文**。

本櫃＝**補習社營運規則／正確做法**（可含尚未由系統強制執行的條款）。
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
| [學年與報讀形式](academic/ACADEMIC_YEARS.md) | 常規 vs 暑期；label、日期、報讀選項；後台寫入不硬鎖歷史學年 |
| [軟封存與查詢範圍](academic/SOFT_ARCHIVE.md) | 已畢業／近兩學年日常名單預設不載入；不刪庫；合規／財務可查全量 |
| [校曆（專科／功輔）](academic/ACADEMIC_CALENDAR.md) | 專科／功輔假日與堂數規則；2627 專科校舍假期 21 日、功輔放假 31 日均已入庫（分表） |

### 報讀／學生

| 文件 | 主題 |
| --- | --- |
| [試堂出單先上紙](enrollment/TRIAL_RECEIPT_BEFORE_ROSTER.md) | 試堂須出單確認後先增加已繳堂數、先上點名紙；免費亦出 $0 單；老師收件匣通知 |
| [學生狀態分類](enrollment/STUDENT_STATUS_CLASSIFICATION.md) | 註冊／報讀／在讀／活躍等 |
| [學生編號](enrollment/STUDENT_CODE.md) | 學號規則 |

### 出席／扣堂

| 文件 | 主題 |
| --- | --- |
| [點名狀態與扣堂](attendance/ATTENDANCE_BILLING.md) | 已扣堂數、連堂補堂、追學費；`2627` 同一級專科小組共用已繳堂數餘額 |

### 繳費

| 文件 | 主題 |
| --- | --- |
| [學費學期節奏與逾期罰款](payments/TUITION_TERM_AND_LATE_FEE_POLICY.md) | 按月堂數；逾期 $50（已繳／已扣堂數模型；2026-10-01 起） |
| [功課輔導班月費](payments/HOMEWORK_TUTORING_MONTHLY_FEE.md) | 2627 初中按週日數月費；小學跟中一；12／2 月四分三；收款登記按月數×月費檔；已繳睇繳費紀錄；不扣堂、不收專科逾期罰款 |
| [收款單據作廢與更正](payments/PAYMENT_RECEIPT_VOID_POLICY.md) | 禁硬刪；作廢／已繳堂數調動分流 |

### 排課／場地／代堂

| 文件 | 主題 |
| --- | --- |
| [專科班排課規則](scheduling/SCHEDULING_RULES.md) | 格網、功輔、兼職密排、老師配額、已確認班別時間鎖、**4.0 方案工程已完（其後加班只入系統）** |
| [課室與場地](scheduling/CLASSROOMS_OPS.md) | 可用課室；17K 停用 |
| [同班偶發代堂](scheduling/SCHEDULE_SUBSTITUTE_TEACHER.md) | 代堂 ≠ 更換任教老師；只改該堂 `schedules.teacher_id` |

### 計糧

| 文件 | 主題 |
| --- | --- |
| [計糧指南](staffing/PAYROLL_GUIDE.md) | 財務／管理層：計法、強積金、出糧；Natalie 一對一 $350／節（docx → `generated/payroll/`） |

### 文案

| 文件 | 主題 |
| --- | --- |
| [用語表](../meta/TERMINOLOGY.md) | 員工用：公司術語與定義。Agent 表 `.cursor/rules/terminology.mdc`；改詞須同步並審本櫃／2627（`terminology-sync.mdc`） |

---

## 維護約定

1. **一篇一主題**：勿把代堂、扣堂、學費罰款揉成單一巨檔。
2. **交叉引用**：相關概念用連結（例如追學費 ≠ 逾期罰款）。
3. **尚未系統化**：文首或相關節標明 `系統現況：…`。
4. **改規則時**：先改本櫃對應政策篇 → 再改 [`../year/2627/ops-guide.md`](../year/2627/ops-guide.md) → 同一輪重出 docx（見 `generated/`）。只改寫法／例子可只改 2627。
5. **稱呼**：見 [`../meta/TERMINOLOGY.md`](../meta/TERMINOLOGY.md)。改術語須同步 agent 表並重審本櫃用詞（`.cursor/rules/terminology-sync.mdc`）。
