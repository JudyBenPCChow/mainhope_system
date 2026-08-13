# 演示資料（種子）單一來源

## 原則

- **完整演示資料**只維護在 [`supabase/seed.sql`](../supabase/seed.sql)（`BEGIN` → `TRUNCATE … CASCADE` → `INSERT`，含 `payment_discounts` 預設列）。
- **Schema** 只維護在 [`supabase/migrations/20260418120000_baseline.sql`](../supabase/migrations/20260418120000_baseline.sql)（單一 baseline）。
- 親友關係演示列寫在 `seed.sql`（須遵守 `student_a_id::text < student_b_id::text`）。

## 與前端對齊

- 專班老師演示：`JUDY_CHU_TEACHER_ID` 在 [`src/lib/teacherScope.ts`](../src/lib/teacherScope.ts)，須與 `seed.sql` 內 **Judy Chu** 列之 `id` 一致。

## 套用方式

```bash
cd mingxue-admin && supabase db reset
```

（會先套用 `supabase/migrations/` 內 migration，再執行 `supabase/seed.sql`。專案需已 `supabase init` 且 `config.toml` 啟用 seed，預設即為 `./seed.sql`。）

## 已連結的測試遠端（資料可全丟時）

假資料可整庫重種時，可對 linked 專案執行 `supabase db reset --linked`，使遠端與本機 baseline + seed 一致（**會刪光遠端資料**）。
