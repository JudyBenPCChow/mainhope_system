# 產出物（generated）

由 markdown／腳本產生嘅 **docx／pdf**。  
**唔好**當真相人手改。日常改源 md 就收工；**用戶要發佈**先重跑對應 `scripts/generate_*.py`。

| 產出 | 源 |
| --- | --- |
| `2627/2526_26SM_SUBJECT_ENROLLMENTS_REVIEW.xlsx` | `scripts/export_2526_26sm_subject_review.py`（2526 Notion 六月科目＋26SM 系統報讀，前線覆核用） |
| `2627/HOMEWORK_TUTORING_BREAKEVEN.xlsx` | `scripts/generate_homework_tutoring_breakeven_xlsx.py`（功輔小學／中學室回本；黃格可改，灰格公式） |
| `2627/2627_ACADEMIC_CALENDAR_HANDOUT.pdf` | `policies/academic/ACADEMIC_CALENDAR.md`（腳本內嵌日期表） |
| `frontdesk/MAINHOPE_TERMINOLOGY.docx`／`.pdf` | `meta/TERMINOLOGY.md` |
| `frontdesk/UI_TERMINOLOGY_CHANGE_REFERENCE.pdf` | `playbooks/frontdesk/UI_TERMINOLOGY_CHANGE_REFERENCE.md` |
| `26sm/26SM_LEAVE_MAKEUP_FOLLOWUP.pdf` | skill `leave-makeup-followup`；`scripts/generate_26sm_leave_makeup_pdf.py --data …`（無 `--data`＝2026-08-16 snapshot） |
| `26sm/26SM_SUBJECT_GRADE_HEADCOUNT.pdf` | `scripts/generate_26sm_subject_grade_headcount_pdf.py`（2026-08-16 production 就讀人數快照） |
| `payroll/PAYROLL_GUIDE.docx` | `policies/staffing/PAYROLL_GUIDE.md`（`scripts/generate_payroll_guide_doc.py`） |
| `print/*` | 歷史列印稿 |

時間表 docx／pdf 現放喺 [`../year/2627/timetable/`](../year/2627/timetable/)（與方案 md 同櫃，方便一齊睇）。
