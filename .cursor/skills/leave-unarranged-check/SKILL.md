---
name: leave-unarranged-check
description: >-
  查 production 該學年尚未安排補堂的學生請假，按當日點名分成「已點事假或病假」「未點名」「已點現場」三表，
  並另頁列出老師請假取消且尚未補回的應到學生，產出給前台勾選是否「不補回」的 PDF。
  Use when the user says 未安排請假核對、是否不補回、不用補回、減收沒有選不補回、請假三表、
  已點現場卻有請假、老師請假未補回核對 PDF。
  已排未上、四類補堂總表改走 leave-makeup-followup。不要依學費「減收」自動改成不補回。
---

# 未安排請假核對表

從 **MainHope_production** 即時查，產出給前台勾選的 PDF。不要用舊 snapshot。不要改庫。

無 MCP `execute_sql`：**停、通知使用者**。見 `.cursor/rules/no-forced-output-without-access.mdc`。

回覆用繁體中文書面語。畫面上的選項是「不補回」。使用者說「不用補回」或「順延」時，PDF 與回覆仍寫「不補回」。

已排未上、老師與學生合成一份四類總表：改走 `leave-makeup-followup`。

## 步驟

1. 學年：使用者指定用該 `academic_years.label`；否則用今日香港日期落在的學年。
2. `execute_sql` 打 **MainHope_production**（`gudmbilboyhouotilrvt`）。讀 [queries.md](queries.md)，把學年 label 換上。
3. 學生列按當日點名分表。老師列全部放第四頁，不要併入「未點名」。
4. 寫 JSON → 跑本目錄 `generate_pdf.py`。
5. 回覆：四表各幾堂、PDF 路徑。已點現場若有列，先點名那幾位。

不要依「減收」把紀錄改成「不補回」。新增請假的預設就是學費「減收」、補課安排「待安排」；儲存時「減收」會把補課安排清空。所以「減收＋空白」可能只是照預設儲存，尚未決定補不補。

## 四頁

每頁自標題起另開。表若跨頁，下一類仍從新頁的標題開始。

| 頁 | 誰 | 意思 |
| --- | --- | --- |
| 一、已點事假或病假 | 學生請假 | 點名沒有問題。只是尚未選「不補回」，或寫了調堂、待安排而還沒有補堂日 |
| 二、未點名 | 學生請假 | 當日沒有點名。即使是事假或病假，點名紙仍應點上。同時尚未選「不補回」，或未安排補堂 |
| 三、已點現場 | 學生請假 | 已有請假紀錄，點名卻是現場。先核對是否確實出席，不要直接改成不補回 |
| 四、老師請假、尚未補回 | 老師取消堂的應到生 | 堂已取消，所以沒有點名，不併入第二頁。當日已有學生本人請假單的，不在此頁重複 |

點名不是「事假」「病假」「未點名」「現場」：不要塞進上表。在回覆寫出狀態與人數，並停下來問要放哪一頁。

## 口徑

學生來源：`leave_makeup_records`，班屬該學年，`leave_reason` 不含老師／導師。沒有補堂日、也沒有補堂排程。系統寫「調堂」或「待安排」但未選日＝未安排。

不列入：補課安排含錄影、不補回；狀態含已補課、已完成、放棄；老師或導師請假單。

老師來源：該學年 `schedules.status` 含取消，且 `cancel_reason` 含老師或導師，沒有未取消的 `makeup_of=<該堂id>` 補回堂。應到＝`enroll_date`≤堂日，且未退或退讀生效日＞堂日。該生該堂已有學生本人請假單（原因不含老師／導師）則不重複。測試班、老師名含 Test／HWKP 不列入。

欄位由左至右：請假日期、學生姓名、班別、原因、補課安排、學費處理、核對。學生列的補課安排空白寫「空白」。老師列補課安排寫「未安排」，學費處理寫「—」。姓名去掉首尾空白。同一頁按請假日期、學生姓名、班別排序。

## JSON → PDF

寫 `docs/generated/<year小寫>/<YEAR>_LEAVE_UNARRANGED_CHECK.json`：

```json
{
  "year": "2627",
  "as_of": "2026-11-16",
  "rows": [
    {
      "bucket": "leave",
      "leaveDate": "2026-09-20",
      "student": "蔡佳俊",
      "classCode": "2627-ENGS4001-A",
      "reason": "病假",
      "makeup": "空白",
      "tuition": "減收",
      "remarks": ""
    }
  ]
}
```

`bucket`：`leave`、`unmarked`、`present`、`teacher`。備註（例如學校參觀）放 `remarks`，腳本會附在原因下。

```bash
python3 .cursor/skills/leave-unarranged-check/generate_pdf.py \
  --data docs/generated/2627/2627_LEAVE_UNARRANGED_CHECK.json
```

產出同目錄 PDF。字型沿用 `scripts/generate_26sm_leave_makeup_pdf.py` 的新細明體。缺字型就說明，不要改英文字型。

不要把這份核對表寫進 `docs/generated/README.md`。不要 commit `docs/generated/**`。
