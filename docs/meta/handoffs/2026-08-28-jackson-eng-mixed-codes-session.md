# Session HANDOFF：Jackson 2627 英文混級模板（套用 production）

| 欄位 | 值 |
| --- | --- |
| 日期 | 2026-08-28 |
| 主題／backlog | 無分題（營運資料更正；2627 時間表分題已 `done`） |
| 分支／工作樹 | `cursor/jackson-eng-mixed-codes-b9e0`；PR [#39](https://github.com/JudyBenPCChow/mainhope_system/pull/39)；工作樹淨（唔好 commit `dist/`／`node_modules`） |
| 驗證 | CI 全過（lint · typecheck:test · test · ui:check · build）；Vercel preview Ready。**production migration 未套**（寫檔環境無 `SUPABASE_ACCESS_TOKEN`） |

## 目標
- 將 Jackson Lau **2627** 兩班英文改課程模板：`ENGS4001`→`ENGS4004`、`ENGS5001`→`ENGS5004`。
- 兩新模板接受中四、中五、中六。Cyndi 嘅 `*-A` 唔改。
- 本交接只要求：**有 token 嘅 agent 單檔套用 migration 並核對 production 列**。

## 已完成
- Migration：`supabase/migrations/20260828233000_jackson_eng_mixed_senior_courses.sql`（加 `courses.eligible_grade_codes`；建 `ENGS4004`／`ENGS5004`；`2627-ENGS4001-B`→`2627-ENGS4004-B`、`2627-ENGS5001-B`→`2627-ENGS5004-B`；`classes.grade`＝中四／中五／中六）。排程跟 `class_id`，唔使改 `schedules`。
- 前端：課程管理「接受年級」；`fetchCourseOptions` 按 eligible 篩；班別年級跟模板。
- 時間表 **PATCH 現行 v4.0** CSV／方案／老師／周表字串（唔 bump 4.1、唔 regenerate Word／PDF）。
- 程式已 push；CI 綠。

## 未完成／卡住
- **未套 production。** 寫檔嗰個 Cloud Agent `npm run db:apply` 失敗：`Access token not provided`。
- Merge 前端前都可先套 SQL：舊 frontend 唔 select `eligible_grade_codes`，但 `classes.grade` 三個標籤已夠顯示；S5／S6 課程下拉要等 PR merge 先會列出 `ENGS4004`。

## 下一步（給新會話）
1. Checkout `cursor/jackson-eng-mixed-codes-b9e0`（或確認該檔已喺工作樹）。讀 `.cursor/skills/apply-supabase-migration/SKILL.md`。
2. 套用（禁止 `db push`）：

```bash
export PATH="$HOME/.local/bin:$PATH"
npm run db:apply -- supabase/migrations/20260828233000_jackson_eng_mixed_senior_courses.sql
```

失敗立刻 fallback：

```bash
supabase db query --linked -f supabase/migrations/20260828233000_jackson_eng_mixed_senior_courses.sql
supabase migration repair --status applied 20260828233000 --linked
```

3. 核對（預期：Jackson 兩行新碼＋`{S4,S5,S6}`；Cyndi `*-A` 仍舊碼、單一年級）：

```sql
select course_code_base, grade_code, eligible_grade_codes, course_name
from public.courses
where course_code_base in ('ENGS4001','ENGS4004','ENGS5001','ENGS5004')
order by 1;

select c.course_code_full, c.grade, t.full_name, co.course_code_base, co.eligible_grade_codes
from public.classes c
join public.academic_years ay on ay.id = c.academic_year_id
left join public.teachers t on t.id = c.teacher_id
left join public.courses co on co.id = c.course_id
where ay.label = '2627'
  and c.course_code_full ~ 'ENGS[45]00[14]-'
order by c.course_code_full;
```

4. 回報：套用 OK／失敗訊息；四條 `course_code_full` 實際值。唔好當「已套用」除非 query 見到新碼。

## 開局必讀（精簡）
- `AGENTS.md`（migration 只新增、單檔套用）
- `.cursor/skills/apply-supabase-migration/SKILL.md`
- `supabase/migrations/20260828233000_jackson_eng_mixed_senior_courses.sql`

## 勿再踩
- **禁** `supabase db push`／全量 reset。
- **禁** 改 Cyndi：`2627-ENGS4001-A`、`2627-ENGS5001-A`。
- **禁** 把 Jackson 班號改成 `-A`；新模板只有一班，仍用 **B**（對齊時間表「英B」）。
- **禁** FULL regenerate 2627 時間表／bump 4.1／改歷史 `versions/v3.x`。
- `migration list --output-format json` 常 timeout；list 失敗仍要試 `db query` + `repair`。
- 舊碼列若已係 `ENGS4004-B`（重跑），UPDATE 0 行屬正常（idempotent）。

## 明確唔做
- 唔改政策／2627 ops-guide（高中混級，非初中×高中）。
- 唔重出 v4.0 docx／pdf（用戶未要求 SYNC／Word）。
- 唔開新主題、唔改其他老師／其他學年（26SM 等）。
- 唔需要再改前端除非套用後發現 `eligible_grade_codes` 寫入失敗。
