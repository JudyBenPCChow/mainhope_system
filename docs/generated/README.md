# 產出物（generated）

由 markdown／腳本產生嘅 **docx／pdf**。  
**唔好**當真相人手改；改源 md 後重跑對應 `scripts/generate_*.py`。

| 產出 | 源 |
| --- | --- |
| `2627/2627_REGULAR_YEAR_OPS_GUIDE.docx`／`.pdf` | `year/2627/ops-guide.md` |
| `2627/2627_ACADEMIC_CALENDAR_HANDOUT.pdf` | `policies/academic/ACADEMIC_CALENDAR.md`（腳本內嵌日期表） |
| `frontdesk/MAINHOPE_TERMINOLOGY.docx`／`.pdf` | `meta/TERMINOLOGY.md` |
| `frontdesk/UI_TERMINOLOGY_CHANGE_REFERENCE.pdf` | `playbooks/frontdesk/UI_TERMINOLOGY_CHANGE_REFERENCE.md` |
| `26sm/26SM_LEAVE_MAKEUP_FOLLOWUP.pdf` | skill `leave-makeup-followup`；`scripts/generate_26sm_leave_makeup_pdf.py --data …`（無 `--data`＝2026-08-16 snapshot） |
| `26sm/26SM_SUBJECT_GRADE_HEADCOUNT.pdf` | `scripts/generate_26sm_subject_grade_headcount_pdf.py`（2026-08-16 production 就讀人數快照） |
| `payroll/PAYROLL_GUIDE.docx` | `policies/staffing/PAYROLL_GUIDE.md` |
| `print/*` | 歷史列印稿 |

時間表 docx／pdf 現放喺 [`../year/2627/timetable/`](../year/2627/timetable/)（與方案 md 同櫃，方便一齊睇）。
