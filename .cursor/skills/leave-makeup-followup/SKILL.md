---
name: leave-makeup-followup
description: >-
  查 production 未完成補堂（學生／老師請假：未安排、已排未上），匯成同一張表並產出 PDF。
  Use when the user asks 未完成補堂、請假未安排、已安排補堂但未上、補堂匯出、補堂 PDF、
  26SM／某學年請假補堂名單, or to regenerate docs/generated/*/LEAVE_MAKEUP_FOLLOWUP.pdf.
---

# 未完成補堂匯出

從 **MainHope_production** 即時查該學年欠補堂，產出 PDF。唔好用舊 snapshot 當今日真相。

無 MCP `execute_sql`／無 production 查庫權限：**停、通知使用者**，唔好用舊 JSON 或空表充當今日名單。見 `.cursor/rules/no-forced-output-without-access.mdc`。

## 何時用

用戶叫：未完成補堂、請假未安排、已排未上、補堂總表／PDF、某學年（如 26SM）補堂跟進。

## 步驟

1. 學年：用戶指定用該 `academic_years.label`；無指定則用今日日期落在嘅學年。
2. `list_projects` 揀 **MainHope_production**（唔好用 staging）。
3. 讀 [queries.md](queries.md)，用 MCP `execute_sql` 跑學生請假＋老師取消堂兩條 SQL（把 `26SM` 換成該 label）。
4. 按下方口徑分類、合併連堂、計人數／堂數。
5. 寫 JSON（schema 見下）→ 跑 PDF 腳本。
6. 回覆：要安排（人／堂）、還要補（人／堂）、PDF 路徑、補堂日已過仍未上（如有）。

可選：Canvas 方便喺 IDE 篩；**PDF 必做**。

## 四類

| bucket | 意思 |
| --- | --- |
| `s_none` | 學生請假，未安排補堂 |
| `s_pending` | 學生請假，已安排補堂但未上 |
| `t_none` | 老師請假，未安排補堂 |
| `t_pending` | 老師請假，已安排補堂但未上 |
| `paid_gap` | 該班已繳堂數未用完，差額唔係學生／老師請假（未點名或日曆已完仍有餘額） |

**要安排**＝`s_none`＋`t_none`（不含 `paid_gap`）。**還要補**＝`s_pending`＋`t_pending`。同一人可同時出現多類。人數＝姓名去重；堂數＝連堂拆開（2 筆＝2 堂）。總表按任教老師排序。

## 口徑（必須跟）

扣堂點名（已上）：`現場`、`錄影回放`、`zoom實時網課`、`no show`、`請假而不需補回`、`出席`、`網課`、`補課`、`線上`、`即時直播`、`不用補回`。

**唔列入：** `錄影`／不補回、status 含已補課／已完成／放棄、補堂日已有扣堂點名、無報讀／取消堂無人應到、天氣取消且補回已點名。老師取消堂若該生當日已有**學生**請假單，只入學生列，唔雙計。

**未安排：** 無 `makeup_date` 且無 `makeup_schedule_id`（老師取消堂則無 `makeup_of=` 補回堂）。系統寫「調堂」但未選日＝未安排。

**已排未上：** 已有補堂日／補回堂，但該生未扣堂點名（**含未來補堂日**）。

學生來源：`leave_makeup_records`，班屬該學年，`leave_reason` 不含老師／導師。老師來源：該學年 `schedules.status` 取消且 `cancel_reason` 含老師／導師，再加當日應到報讀（期數／單堂選堂；`enroll_date`≤堂日；未退或退讀生效日＞堂日）。補回堂：`remarks` 含 `makeup_of=<取消堂id>` 且未取消。

合併：學生同一人＋班＋請假日（連堂）併一列，`lessons` 加總；老師同一班＋取消日＋原因＋補堂日，涉及學生用頓號。

## JSON → PDF

寫 `docs/generated/<year小寫>/<YEAR>_LEAVE_MAKEUP_FOLLOWUP.json`：

```json
{
  "year": "26SM",
  "as_of": "2026-08-16",
  "start_date": "2026-07-01",
  "end_date": "2026-08-31",
  "rows": [
    {
      "bucket": "s_none",
      "classCode": "26SM-MATHS3008-A",
      "teacher": "Mark Yu",
      "students": "阮心兒",
      "reason": "事假",
      "leaveDate": "2026-07-15",
      "arranged": false,
      "makeupDate": "—",
      "lessons": 1,
      "note": "備註：8月底補回"
    }
  ]
}
```

```bash
python3 scripts/generate_26sm_leave_makeup_pdf.py --data docs/generated/26sm/26SM_LEAVE_MAKEUP_FOLLOWUP.json
```

產出：`docs/generated/<year小寫>/<YEAR>_LEAVE_MAKEUP_FOLLOWUP.pdf`。無 `--data`＝重出 2026-08-16 內嵌 snapshot，**唔好**當 live。

PDF 字型：本機 Microsoft Word 嘅 `mingliu.ttc`（新細明體）。缺字型就講邊台機缺，唔好改用英文字。

更新 `docs/generated/README.md` 該列（新學年路徑先加）。

## 另一台電腦／GitHub

呢個係**專案 skill**（`.cursor/skills/leave-makeup-followup/`），跟 git。另一台 `git pull` 再開本專案，Cursor 會載入。

仍要本機有：Cursor 開呢個 repo、Supabase MCP 已登入（可查 production）、Python `reportlab`／`fontTools`、Word 新細明體（出 PDF）。MCP token **唔**喺 GitHub。

未 push 呢個 skill 嘅 commit → 另一台未有。個人 skill（`~/.cursor/skills/`）唔跟本 repo。
