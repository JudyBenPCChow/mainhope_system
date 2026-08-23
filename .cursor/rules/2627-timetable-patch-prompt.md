# 2627 時間表 patch — 開局模板

貼到新 chat（填 `[…]`）：

```text
2627 時間表：patch only（跟 .cursor/rules/2627-timetable-doc.mdc PATCH 模式）。

改動範圍：
- 檔案：[docs/year/2627/timetable/versions/vX.Y/2627_timetable_scheme_vX.Y.md]
- 只改：[…]
- 唔改：[weekly / teachers_week / empty_rooms / class_codes]
- 版號：維持 vX.Y

改動（before → after）：
1. 舊：[…]  新：[…]

禁止：regenerate、generate_2627_timetable_doc.py、docx、pdf、bump 版

完成：只 show diff，confirm 後先 commit。
```

**短版：** `patch only：只改 v3.10 scheme 兩行 [舊→新]，其他唔郁，show diff。`

**定稿出 Word（仍唔 regenerate md）：** `v3.10 已 patch。只對現有 md 跑 --word；唔改 md、唔 bump 版。`

**SYNC：** `patch + SYNC scheme/teachers_week/weekly（同 before→after 清單）；仍唔跑 script。先 diff 全部，confirm 後 commit。`
