---
name: trial-new-student-conversion
description: >-
  查 MainHope_production：指定期間新註冊新生的新報讀名單（試堂轉化或即時報讀），
  以及試堂成功率（全部／只限專科）。一人一科一筆，分母只計已上試堂並已點名為實際出席的紀錄。
  Use when the user asks 新註冊、新報讀、試堂轉化、轉正、即時報讀、試堂成功率、
  轉化率、轉化成功率、只限專科.
---

# 新生試堂、轉正與成功率

從 **MainHope_production**（`gudmbilboyhouotilrvt`）即時查。每次重查，不要沿用上一則的人數。

無 Supabase MCP `execute_sql`、又無 `SUPABASE_ACCESS_TOKEN`、又無 `SUPABASE_SERVICE_ROLE_KEY`：**停、通知使用者**。見 `.cursor/rules/no-forced-output-without-access.mdc`。不要用舊名單或假數交差。

回覆用繁體中文書面語。用語：註冊、報讀、試堂、轉正、專科班、功輔班、私人課程。資料庫註冊狀態值仍是「已註冊／非注冊」，回覆寫「非註冊」。

本 skill 只讀。試堂名單 PDF 用 `trial-followup-pdf-mail`。安排試堂或寫入報讀用 `frontdesk-makeup-trial-ops`。

## 期間

使用者給起日（「自 9 月 26 日起」＝該年 `2026-09-26`，含當日）。未給迄日則迄日為香港今天。起迄都是香港日期。

## 新生（兩題共用）

同時符合才是新生：

- `btrim(old_student_id)` 為空（沒有舊生編號）
- 學生紀錄建立日 `(created_at at time zone 'Asia/Hong_Kong')::date` 落在起迄日內
- 姓名不含 `test`、`測試`

期間之前已建立學生檔的人，即使期間內才試堂或才報讀，**不計**。註冊狀態仍是「非注冊」的新生**仍計入試堂分母**。

## 一、新報讀人數與名單

問「新註冊的新報讀」「試堂轉化或即時報讀有幾多人」時做這題。

- 母體＝上面的新生，且至少有一筆 `student_class_enrollments`
- **人數以人計**（一人多科仍算 1 人）
- 某人任一報讀有對應試堂 `outcome = 'converted'`（`converted_enrollment_id` 或同一 `class_id`）→ 途徑寫「試堂轉化」；否則「即時報讀」
- 列出每科；`已退讀` 照列並標狀態
- 只有試堂、尚未報讀的人不入這份名單

回覆先寫人數，再分「試堂轉化 N 人、即時報讀 N 人」，然後用表：報讀日（該生最早一筆報讀的香港建立日）、姓名、年級（小一…中六）、途徑、科目。

## 二、試堂成功率

問「轉化率／試堂成功率／全部／只限專科」時做這題。**不要**用試堂頁公式「已轉化 ÷（已轉化＋已流失＋其他結果）」。

| 項目 | 規則 |
| --- | --- |
| 母體 | 只限上一節的新生 |
| 一筆 | **一個學生 ＋ 一個科目**（`classes.subject`，空白則當未填科目） |
| 兩科 | 同一人試兩科＝兩筆。同一人同一科多堂試堂（改期、取消再約）合併為一筆 |
| 已上並已點名 | 該生該科的試堂排程上，有其本人的 `attendance_details`，且狀態屬實際出席（`現場`、`錄影回放`、`zoom實時網課`、`出席` 等；見 `src/lib/attendancePresence.ts` 的 `isActualPresentStatus`）。未點名、缺席、no show、事假、病假都不算 |
| 分母 | 該範圍內**已上試堂並已點名**的筆數。尚未上堂的不入分母 |
| 分子 | 分母之中，該科任一試堂 `outcome = 'converted'` 的筆數 |
| 全部 | 專科、功輔、私人課程都計；某類沒有已點名出席就不入 |
| 只限專科 | 只計 `class_kind = 'group'`。使用者另點名功輔或私人課程才單計該類 |
| 即時報讀 | 沒有試堂的報讀**不入**這題分母 |

成功率＝分子 ÷ 分母。百分比四捨五入到小數一位，並寫出分數（例如 9／11）。分母為 0：寫「沒有已上並已點名的新生試堂」，不算百分比。

預設先交表，不必逐筆名單。使用者要名單時，每筆一行：姓名、年級、科目、結果（已轉正／未轉正）。

```
| 範圍 | 成功率 | 已轉正 | 試堂紀錄 |
| 全部 | 80.0%（8／10） | 8 | 10 |
| 只限專科 | 75.0%（6／8） | 6 | 8 |
```

分數與百分比必須來自當次查庫，不要沿用例子裡的數字。

## 查庫

1. Supabase MCP `execute_sql`，project `gudmbilboyhouotilrvt`。不可用則 `npx supabase db query --linked`。anon 空陣列不算「沒有新生」。
2. 跑 [queries.md](queries.md)，代入 `:start_date`、`:end_date`。
3. 年級代碼換成 `src/lib/studentGrade.ts` 的中文標籤。

## 勿做

- 不要把舊生加科、舊生試堂算進新生
- 不要把同一人同一科的多堂試堂拆成多筆
- 不要用 `counts_toward_headcount` 當成功率篩選（該欄是點名人頭，功輔試堂常為 false）
- 不要把 `2627-HWKP*` 功輔班當測試班剔除
- 不要寫入資料庫，不要改試堂結果
