# 明學教育 — 管理系統（遷移骨架）

由 Base44 遷移計畫產生的 **Vite + React + TypeScript + Tailwind + React Router** 專案。目前為 **可執行骨架**：路由與側欄對齊舊版 `App.jsx`／`Layout.jsx`，資料層為 **`src/api/entities.ts` stub**，之後改接 Supabase。

**協作／交給 AI Agent 的約定**（目錄職責、`services` 型別映射、RLS 上線注意、路由與側欄同步）：見 **[docs/AGENT_HANDOFF.md](docs/AGENT_HANDOFF.md)**。

## 本機執行

```bash
cd mingxue-admin
npm install
npm run dev
```

首次請在首頁選擇 **演示角色**（寫入 `localStorage.mgmt_role`：`admin`／`teacher`／`alien`），即可看到側欄與各占位頁。

## 環境變數

複製 `.env.example` 為 `.env`，填入 `VITE_SUPABASE_URL` 與 `VITE_SUPABASE_ANON_KEY`（接上 Supabase 後於 `src/lib/supabaseClient.ts` 使用）。

## 如何改 API（Base44 entities → Supabase）

整體概念：**頁面盡量仍從 `@/api/entities` 匯入**，但把 `entities.ts` 裡每個 `XXX.list`／`XXX.update` 的實作，改成呼叫 **`src/services/`** 裡用 **`supabase.from(...)`** 寫好的函式。

### 1. 確認 Supabase 有連線

- 專案根目錄要有 **`.env`**（不要提交到 git），內含：
  - `VITE_SUPABASE_URL=你的專案 URL`
  - `VITE_SUPABASE_ANON_KEY=anon public key`
- 重開 **`npm run dev`**（Vite 只會在啟動時讀 env）。
- `src/lib/supabaseClient.ts` 會在兩個變數都有值時建立 **`supabase`**；否則為 **`null`**（此時範例 service 會回傳空陣列並在 console 警告）。

### 2. 在 Supabase 建好表與 RLS

- 表名建議與遷移計畫一致（例如 **`students`**），欄位型別對齊你的 JSON schema。
- 在 Supabase Dashboard 開 **RLS**，為 `select`／`insert`／`update` 寫政策（依 `profiles.role` 等），否則前端會收到 **permission denied**。

### 3. 建立資料庫表（Supabase）

1. 在 [Supabase Dashboard](https://supabase.com/dashboard) 建立專案後，開啟 **SQL Editor**。  
2. **Supabase CLI**（建議）：在專案根執行 `supabase init`（若尚無設定檔），再 `supabase db reset` — 會套用 **`supabase/migrations/20260418120000_baseline.sql`**（單一 schema baseline），再執行 **`supabase/seed.sql`**（完整演示種子：`TRUNCATE` 後寫入老師／課室／學生／班／排程／出席／請假／繳費等；固定 UUID；專班老師 Judy 與 [`src/lib/teacherScope.ts`](src/lib/teacherScope.ts) 一致）。亦可在 SQL Editor 手動依序貼上該二檔內容。  
3. 變更種子請只改 **`supabase/seed.sql`**；變更表結構請加 **新 migration**（或調整 baseline 後對測試庫 `db reset --linked`）。  
4. 若遠端 Supabase **曾套用舊版** `001`～`008` migration：測試資料可全丟時，用 `supabase db reset --linked` 與本機對齊；否則需依官方流程 `migration repair` 清掉舊版本紀錄再 push 新 baseline。  
5. 確認 **Project Settings → API** 的 **URL** 與 **anon public key** 已寫入本機 **`.env`**。

### 4. 程式已接線處

- **`src/services/queries.ts`**：`listTable("表名")` 與各 **`listTeachers`、`listStudents`…**、`updateAppUser`。  
- **`src/api/entities.ts`**：已全部指向上述函式（不再使用 stub `notImpl`）。  
- **`src/services/dashboard.ts`** + **`src/components/home/*`**：管理員首頁儀表板（統計、未繳費、今日課堂、最近收費、圖表、功能模組）。  
- 若要**自訂查詢**（篩選、join、RPC），在 `queries.ts` 新增函式後，再改 `entities.ts` 對應匯出即可。

### 5. 與舊 Base44 的對照

| 舊寫法（概念） | 新寫法（概念） |
|----------------|----------------|
| `base44.entities.Students.list()` | `await Students.list()`（內部改為 `supabase.from('students')`） |
| `base44.auth` | `supabase.auth`（登入／登出／`getSession`） |
| `base44.users.inviteUser` 等 | Supabase Auth **Admin API** 或 Edge Function（需在後端／有 service role，**不要**把 service role key 放進前端 `.env`） |

## 下一步（對照遷移計畫）

1. 將計畫內已貼的 **`pages/*`、`components/*`、`components/ui/*`** 原始碼逐步貼入 `src/`（`.jsx` 可改 `.tsx` 或保留 `.jsx` 並調 `tsconfig`）。
2. 實作 **`src/api/entities`** 或改為 **`src/services/*`** 呼叫 Supabase，並加上 RLS／`profiles.role`。
3. 補齊 **`hooks/use-mobile`** 以外**尚未搬入的 hooks／lib**。
4. 依需求補齊 **`components/ui`** 其餘檔（`checkbox`、`tooltip`、`toast` 等）。

## 目錄說明

| 路徑 | 說明 |
|------|------|
| `src/App.tsx` | 路由表（大寫 path 與舊版一致） |
| `src/components/Layout.tsx` | 側欄＋角色可見選單（`localStorage.mgmt_role`） |
| `src/pages/*` | 占位頁，待替換為真實頁面 |
| `src/api/entities.ts` | 對外 API 匯出（逐步改接 `src/services/*`） |
| `src/services/queries.ts` | 各表 `list*` 與 `User.update`（Supabase） |
| `supabase/migrations/*.sql` | Schema baseline（CLI migration）；演示資料在 `supabase/seed.sql` |
| `src/lib/utils.ts` | `cn`（clsx + tailwind-merge） |
| `src/lib/supabaseClient.ts` | Supabase client（有 env 時建立） |
# mainhope_system
# mainhope_system
# mainhope_system
# mainhope_system
# mainhope_system
