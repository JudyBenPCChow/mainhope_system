---
name: class-by-grade-subject
description: >-
  按「年級＋科目」即時查 MainHope_production 專科班別情況（course code、逢星期、
  時段、老師、就讀中人數），並以固定純文字格式回傳。Use when the user says
  中四中文、中三數學、年級加科目、查班、班別情況、有幾班、幾多人，
  or lists multiple grade+subject pairs.
---

# 年級＋科目 → 班別情況（即時查庫）

從 **MainHope_production**（`gudmbilboyhouotilrvt`）即時查專科班，按使用者指定的一組或多組「年級＋科目」輸出固定格式。

無 Supabase MCP `execute_sql`、又無 `SUPABASE_ACCESS_TOKEN`（`supabase db query --linked`）、又無 `SUPABASE_SERVICE_ROLE_KEY`：**停、通知使用者缺什麼**。見 `.cursor/rules/no-forced-output-without-access.mdc`。不要用時間表 CSV／舊 snapshot／假資料交差。

回覆用**繁體中文書面語**；術語跟 `.cursor/rules/terminology.mdc`。

## 觸發

使用者說出年級＋科目（可多組），例如：

- `中四中文`／`中四級中文`／`中四 中文`
- `中三數學、中五英文`（多組：依請求順序各印一塊）
- `查中二化學班別`／`中一有幾班英文`

預設範圍：**目前常規學年專科班**（`academic_years.label = '2627'` 或 `course_code_full like '2627-%'`；`class_kind = 'group'`）。

若使用者明講暑期／`26SM`／功輔／私人課程，才改範圍；否則不要夾功輔或私人課程。

## 輸出格式（嚴格）

每一組「年級＋科目」一塊；多組之間空一行。範例結構（數字須來自查庫，勿照抄）：

```
中四級中文
2627-CHIS4001
A班 逢星期二 下午4:30-5:45 Christine Fan (2人）
B班 逢星期三 下午4:30-5:45 Christine Fan (2人）
```

| 行 | 規則 |
| --- | --- |
| 1 | 標題＝`{年級標籤}級{科目}`，如 `中四級中文`（不要寫「科」尾、不要 course code） |
| 2 | **課程碼（不含班號）**：`course_code_full` 去掉末段 `-A`／`-B`…，如 `2627-CHIS4001` |
| 3… | 每一 `section` 一行：`{section}班 逢{星期} {時段} {老師名} ({N}人）` |

同一課程碼下多班：按 `section_code`（A、B、C…）排序。若同一年級＋科目對應**多個不同課程碼**（例如不同 course_seq），每個課程碼各印一塊（標題相同、第二行不同）。

無符合班別：該組印標題後一行 `（目前無對應專科班）`。

### 欄位格式細節

- **年級標籤**：中一…中六／小一…小六（見 `src/lib/studentGrade.ts`）。使用者寫 `S4`／`中四級` 都正規化成 `中四`。
- **逢星期**：`classes.day_of_week` 經 `formatWeekdaysDisplay` 後加「逢」前綴（已有「逢」不重複）。多日用頓號：`逢星期一、星期三`。
- **時段**：DB 多為 24 小時 `16:30-17:45`。顯示轉 12 小時＋午前午後：
  - `00:00–11:59` → `上午…`；`12:00–12:59` → `中午…`；`13:00–23:59` → `下午…`
  - 小時去掉前導零：`4:30` 不是 `04:30`；分鐘保留兩位
  - 起迄之間用半形 `-`：`下午4:30-5:45`
  - 若 `time_slot` 已含「上午／下午／中午」則只正規化空白與破折號，不要雙重加前綴
- **老師**：`teachers.full_name`（班別主責 `classes.teacher_id`）
- **人數**：該班 `student_class_enrollments.status = '就讀中'` 筆數。括號用半形 `(`＋全形 `）`，如 `(2人）`。0 人仍列出（空班正常，見 `ops-data-check.mdc`）

## 查庫步驟

1. **確認通道**（擇一）：
   - Supabase MCP `execute_sql` → project **MainHope_production**
   - 或 `npx supabase db query --linked`（須 `SUPABASE_ACCESS_TOKEN`／`supabase login`）
   - 或 REST＋`SUPABASE_SERVICE_ROLE_KEY`  
   僅有 anon key 而 RLS 拒讀／回空：**不可**當「無班」。停並說明缺權限。
2. 解析每組請求 → `(grade_label, grade_code, subject_name)`。
3. 跑 [queries.md](queries.md) 的 SQL（代入年級碼、科目、學年）。
4. 在 agent 側格式化時段與標題，按上述格式輸出。
5. 多組：依使用者順序逐組輸出。

## 口徑（必須跟）

| 項目 | 規則 |
| --- | --- |
| 產品線 | 預設只 **專科班** `class_kind = 'group'` |
| 人數 | 只計 `student_class_enrollments.status = '就讀中'`；拖欠學費仍算就讀（不要當異常） |
| 年級 | 班別 `classes.grade` **或** 課程 `eligible_grade_codes`／`grade_code` 含目標年級即入選（混級班要列出） |
| 科目 | 優先 `subjects.name_zh`；其次 `classes.subject` 含科目名；可用常見別名（中文／CHI／CHIS 等，見 queries.md） |
| 測試班 | 排除老師名或 `course_code_full` 含 `Test`／`HWKP`（前線完成度慣例） |
| 空班 | 0 人仍列；不要叫人「找學生填」 |
| 暑期未續常規 | 不在本題範圍；不要發明「未轉學年」缺口 |
| 學年旗標 | 跟 `academic_years.label`／course code 前綴，不要只靠 `is_current` 亂切 |

## 同事怎麼用

- **Cursor 對話／Project**：直接打 `中四中文`（可多組）。協調者／agent 應自動套本 skill 查庫回覆。
- **手機／電腦**：同一 Cursor Project 或已接 production 查庫的 Cloud Agent 對話即可；不需另開 App。回傳是純文字，方便複製到 WhatsApp。
- **本機／腳本**：有 token 時用 `npx supabase db query --linked` 跑 queries.md；無 token 不要硬用 anon REST。

## 勿做

- 不要用 `docs/year/2627/timetable/**` CSV 冒充今日人數或時段
- 不要 commit `docs/generated/**` 或 `BACKLOG.md` 索引表
- 不要改 `classes.teacher_id`／排程；本工序只讀
- 不要把私人課程／功輔混進預設專科查詢
