# 2627 學年轉換 — 發佈清單

| 欄位 | 值 |
| --- | --- |
| 指引版本 | **v1.14**（2026-08-29） |
| 狀態 | **可發佈** |

## 發佈物

| 格式 | 路徑 |
| --- | --- |
| Markdown（真相） | [`ops-guide.md`](ops-guide.md) |
| Word | [`../../generated/2627/2627_REGULAR_YEAR_OPS_GUIDE.docx`](../../generated/2627/2627_REGULAR_YEAR_OPS_GUIDE.docx) |
| PDF | [`../../generated/2627/2627_REGULAR_YEAR_OPS_GUIDE.pdf`](../../generated/2627/2627_REGULAR_YEAR_OPS_GUIDE.pdf) |
| 校曆手冊 PDF | [`../../generated/2627/2627_ACADEMIC_CALENDAR_HANDOUT.pdf`](../../generated/2627/2627_ACADEMIC_CALENDAR_HANDOUT.pdf) |

## 發佈步驟

1. 以 WhatsApp 傳 **PDF** 連結或附件予全公司職員。
2. 前台可備 **列印本**（接待／課室）。
3. 時間表 ver. 3.6 **另發**（見 [`timetable/2627_timetable_signoff_v3.6.md`](timetable/2627_timetable_signoff_v3.6.md)）；指引 deliberately 不載課表。
4. 操作說明索引已掛：[`playbooks/_INDEX.md`](../../playbooks/_INDEX.md)「本學年員工讀本」一節。

## v1.11 變更摘要

- §7.3 功輔導師編更（H11 通過後補寫）
- 其餘章節同 v1.10

## 重出 docx／pdf

日常改 `ops-guide.md` **唔**自動出檔。要發佈／列印時先跑：

```bash
python3 scripts/generate_2627_ops_guide_doc.py
```
