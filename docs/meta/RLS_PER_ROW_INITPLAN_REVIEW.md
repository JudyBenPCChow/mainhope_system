# 審閱：SELECT 政策逐列重算角色，拖慢所有分頁

| 欄位 | 值 |
| --- | --- |
| 狀態 | 已審（2026-10-24）。方案已依 live catalog 修正。尚未寫 migration、尚未改庫 |
| 日期 | 2026-10-24（初稿當晚；同日擴大檢查 live `pg_policy`） |
| 庫 | MainHope_production（`gudmbilboyhouotilrvt`，ap-northeast-1，PostgreSQL 17.6） |
| 現象 | 骨架先出現；任何分頁讀 SQL 都比平時慢。已上線網頁與本機 `npm run dev` 相同 |
| 性質 | 調查＋已審方案。不是實施指令；改庫前另開 migration |

相關設計：[`docs/product/topics/p0-1-authorization-redesign.md`](../product/topics/p0-1-authorization-redesign.md) §3（已寫明 RLS 要用 `(select private.has_capability(...))`）。實際政策在 `supabase/migrations/20260815225314_p0_1_schedule_attendance_leave.sql` 一類檔案，呼叫時沒有這層子查詢。2026-07-22 已為老師路徑改過 `teacher_owns_schedule_row`（避免每列再讀 `schedules`），但沒有包 session 不變的函數。

## 審閱結論（四個原問題）

1. **行政在包了 `(SELECT …)` 之後，實務上不應再逐列跑 `teacher_owns_schedule_row`／`portal_can_access_class`。** PostgreSQL 不把短路寫進文件，提交前必須用 `EXPLAIN (ANALYZE, BUFFERS)` 看時間與 buffer，不要看 Filter 字串還有沒有函數名。執行器對確定的 `false AND f()`／左邊已真的 `OR` 會跳過。`is_teacher_role`／`is_portal` 有 `coalesce`，InitPlan 結果是確定布林，不是 `NULL`（`NULL AND f()` 仍會算 `f`）。**不要靠調政策順序當修復。** 未包裝時貴的是每列多次 `current_app_role()`；把老師政策排第一對行政幾乎沒幫助。
2. **只包與該列無關的呼叫時，與現有 boolean 等價**（fail closed、下一句才重讀 active role、財務缺 capability 仍看不見、雙重身份跟 active role）。會破壞等價的是把列條件整段塞進不參考該列的子查詢，或另加恒真政策。
3. **第一輪不要做角色快照。** 本社單一 statement 內 active role 只有一個；InitPlan 修好後行政 Filter 實質上是常數真。快照要改 helper 與全部政策，換來的只是規劃器保險。若驗證發現行政仍逐列進老師／學生支路，再做一條 `CASE (SELECT current_app_role())` 政策當後備。不要把能力寫進 JWT（方案 §3 已拒絕）。
4. **同一交易改所有 `USING`／`WITH CHECK`，含 `FOR ALL`。這不再是「順便」。** `polcmd='*'` 的寫入政策對 SELECT 一樣生效。只改具名 `FOR SELECT`，今晚的讀取路徑仍在。

---

## 背景

2026-10-24 晚，使用者回報整個系統載入變慢：已上線的 `mainhopesystem.vercel.app`，以及本機開發伺服器，任何分頁都一樣。接著補充：畫面骨架正常，慢在讀 SQL。

兩端都用瀏覽器的 Supabase client，經 PostgREST，以 `authenticated` 讀同一套 production。直接用資料庫高權限連線（略過 RLS）並不快取不到這個現象。

## 當時庫的狀態

約 2026-10-24 15:16 UTC 看過一次：

- `max_connections` 60；backend 21；沒有 idle in transaction；沒有 `pg_blocking_pids`。
- `pg_stat_database` 累計 cache hit 100%（`blks_read` 1983，`blks_hit` 約 5.48e9）。`stats_reset` 為 null，這是長期累計，不是這一晚的窗口。
- `shared_buffers` 224MB，`work_mem` 2184kB。執行期緩衝區都是 shared hit，時間不在讀碟。
- 角色逾時：`authenticated` 與 `authenticator` 的 `statement_timeout` 為 8s；`authenticator` 另有 `lock_timeout` 8s；`anon` 為 3s。資料庫層預設是 120s，量到的是登入角色覆寫。

公開表都很小。`schedules` 3,942 列、約 1.5MB；`students` 約 536 列。最大的 `attendance_declarations` 約 1.8MB。沒有一張表大到足以單獨解釋數秒。

## 發現

### 同一句 SQL，有無 RLS 差約 70 倍

```sql
select remarks, status
from public.schedules
where scheduled_date >= date '2026-09-01'
  and remarks like '%makeup_of=%'
order by scheduled_date
limit 1000;
```

| 執行身份 | 計畫 | 回傳／濾掉 | shared hit | 執行時間 |
| --- | --- | --- | --- | --- |
| 表擁有者，略過 RLS | Seq Scan | 40／3,902 | 129 | 19.8 ms |
| `authenticated`，行政的 JWT `sub` | Index Scan `schedules_scheduled_date_idx` | 40／3,035 | 37,318 | 1,344 ms |

行政這次的 Filter 是三條政策合成的 `OR`：

```text
(is_teacher_role() AND teacher_owns_schedule_row(current_teacher_id(), class_id, teacher_id, original_teacher_id))
OR (private.has_capability('schedule.read') AND is_mgmt_staff())
OR (is_portal() AND portal_can_access_class(class_id))
AND remarks ~~ '%makeup_of=%'
```

`schedules` 上的三條 SELECT 政策（live `pg_policy`）：

| 政策 | `USING` |
| --- | --- |
| `rls_phase_b_teacher_select_schedules` | `is_teacher_role() AND teacher_owns_schedule_row(current_teacher_id(), class_id, teacher_id, original_teacher_id)` |
| `rls_cap_select_schedules` | `private.has_capability('schedule.read') AND is_mgmt_staff()` |
| `portal_select_schedules` | `is_portal() AND portal_can_access_class(class_id)` |

`has_capability`、`is_mgmt_staff`、`is_teacher_role`、`is_portal`、`current_teacher_id`、`teacher_owns_schedule_row`、`portal_can_access_class` 都是 `STABLE`。`STABLE` 只代表同一 scan 內結果不變，**執行器不會因此快取**。`current_app_role()` 是 `plpgsql`、`SECURITY DEFINER`：有 JWT session 時讀 `private.mgmt_session_roles`，否則讀 `mgmt_active_roles`／`app_users.role`。`has_capability` 再依這個 role 查 `private.authz_role_capabilities`。`is_teacher_role`／`is_mgmt_staff` 可內聯，內聯後變成多次 `current_app_role()`；`has_capability` 是 `SECURITY DEFINER`，不會內聯，內部又再呼叫一次。每列約 12 次 buffer hit，與 37,318／3,075 相符。真正貴的是重複的 `current_app_role()`，不是表或索引。

`LIKE '%makeup_of=%'` 用不到 btree。自 2026-09-01 起要走過 3,075 列才留下 40 列，所以這句特別貴。沒有 RLS 時，同一掃描只要 20ms；索引不是這次的主因。

初稿量測**沒有**帶 JWT `session_id`。正式路徑走 `mgmt_session_roles`，只會更貴。

### 其他清單同一模式

同一晚、同一種行政 JWT（見文末方法限制）：

| 查詢 | 列 | shared hit | 執行時間 |
| --- | --- | --- | --- |
| `schedules.id`，`scheduled_date >= 2026-09-01` 且 `status ILIKE '正常'`，`LIMIT 1000` | 掃描約 1,127，回傳 1,000 | 13,802 | 513 ms |
| `students.id, full_name`，`ORDER BY full_name LIMIT 200` | 掃完整表 536 列 | 5,945 | 249 ms |

學生政策的 Filter 同形：`is_teacher_role() AND teacher_can_access_student(id)`，或 `has_capability('students.read') AND is_mgmt_staff()`，或 `is_portal() AND id = current_portal_student_id()`。

帶班別、老師、原任老師、課室的 `schedules` 嵌入查詢（`scheduled_date` 加 `status ILIKE`），`pg_stat_statements` 自 2026-06-01 起 1,440 次，平均 4.7 秒，最長 8.0 秒。`remarks LIKE` 那句 88 次，平均 6.2 秒，最長 8.0 秒。最長都貼著 `authenticated` 的 8 秒上限。統計裡沒有 `max_exec_time > 15s` 的語句，和「角色逾時 8 秒、資料庫預設 120 秒」一致。

**`pg_stat_statements` 的 `stats_reset` 為 null（自 2026-06-01 起從未重置）。** 平均混了 P0-1 前後與七月熱修前後。判斷現況用當晚 `EXPLAIN` 與 `max_exec_time` 貼 8 秒，不要用四個月平均做通過標準。

### 今晚實際失敗的那一筆

2026-10-24 15:13:12 UTC，Postgres 日誌：`canceling statement due to statement timeout`。同一秒 PostgREST：

```text
GET /schedules?select=remarks,status
  &scheduled_date=gte.2026-09-01
  &remarks=like.*makeup_of=*
  &order=scheduled_date.asc&offset=0&limit=1000
→ 500
```

Referrer 是 `https://mainhopesystem.vercel.app/`。對應首頁提醒：`src/services/adminSlaReminderQueries.ts` 的 `listTeacherCancels`，由 `src/components/home/AdminSlaReminderSection.tsx` 在首頁載入。它只負責這一筆逾時，不是每個分頁都打這句。

當日 Postgres 日誌裡，statement timeout 只見到兩筆（約 09:00 UTC 與 15:00 UTC 各一）。擴大檢查近 24 小時仍是 2 筆。常態是每句多等零點幾秒到數秒，偶發才頂到 8 秒並 500。

PostgREST 日誌在 24 小時內幾乎每一行都是 `Warp server error: Thread killed by timeout manager`（3,173／3,191）。同一窗口的 edge 日誌仍以 HTTP 200 為主（約 12:00–15:30 UTC：7,712 筆 200、1 筆 500）。這個 Warp 訊息更像週期性日誌，不是這次「每頁都慢」的證據。

### 不要併進這次成因的熱點

| 語句 | 次數（約） | 平均 | 說明 |
| --- | --- | --- | --- |
| `get_teacher_schedule_roster_context(p_schedule_ids)` | 372,516 | 133 ms | 累計最貴。`SECURITY DEFINER`，內層已略過表 RLS。成本在授權核對與 JSON。點名仍大量呼叫。包政策後若點名紙仍慢，下一輪才動 |
| `get_enrollment_effective_dates(p_enrollment_ids)` | 182 | 5.9 s | 點名路徑已停用（見 `scheduleRosterQueries.ts`）。平均混了舊實作。函數內 `is_mgmt_staff()` 仍未包，列為後續清理 |
| `current_inbox_actor_key()` | 409,976 | 10 ms | 單次 RPC 不慢；**政策裡裸呼叫**仍要包（見下） |
| `get_my_mgmt_profile_v2()` | 39,822 | 24 ms | 單次不慢 |

---

## 擴大檢查（live catalog，同日稍後）

初稿只完整讀了 `schedules`，其餘只數 SELECT 條數。後來對 `pg_policy`／`pg_proc`／效能顧問做了全庫掃描。

公開 schema 264 條政策，**沒有一條**把下列函數包成 `(SELECT …)`：

| 寫法 | 未包裝條數 |
| --- | --- |
| `has_capability` | 182 |
| `is_mgmt_staff` | 85 |
| `is_teacher_role` | 46 |
| `is_portal` | 20 |
| `teacher_can_access_*` | 19 |
| `current_teacher_id` | 12 |
| 政策裡直接寫 `current_app_role()` | 2 |

效能顧問對 `authenticated`「多條 permissive 政策」有 90 項。同一病在全庫複製，不是只有排程／學生。

### `FOR ALL` 寫入政策也是 SELECT 政策

約 75 條 `rls_cap_write_*` 的 `polcmd='*'`。PostgreSQL 對 SELECT 把它們和具名 SELECT 做 `OR`。只改 `rls_cap_select_*`，讀取路徑仍在。

例子（live）：

| 表 | SELECT 實際會跑的政策 |
| --- | --- |
| `leave_makeup_records` | portal ＋ `leaves.read` ＋ **`leaves.manage` 的 FOR ALL** ＋ 老師範圍（四支） |
| `student_class_enrollments` | portal ＋ `students.read` ＋ **`students.enroll` 的 FOR ALL** ＋ 老師範圍（四支） |
| `attendance_declarations` | 職員 SELECT（兩個 capability 的 `OR`）＋ **FOR ALL 三個 capability 的 `OR`** ＋ 老師（一列最多六次 `has_capability`／角色） |
| `courses`／`teachers`／校曆／學年期數 | 同樣四支 |

`ALTER POLICY … USING` 不會改 `WITH CHECK`。寫入兩側都要顯式改。

### `is_portal()` 對職員也很貴

live 定義不是 `role = student` 這麼簡單：

```sql
coalesce(current_app_role(), '') = 'student'
OR current_portal_view_as_student_id() IS NOT NULL
```

後者每次查 `portal_staff_view_as`，裡面再跑 `is_mgmt_staff()`／`current_app_user_id()`。沒有人在代看學生時，行政掃任何帶 portal 政策的表，仍每列做這次空查。20 條 portal 政策都這樣。包 `(SELECT public.is_portal())` 對這次事故（職員清單）特別值得。

代看學生時，職員政策本來就開整表，`OR` 之後仍是整表。這是現況語意，包裝不改變可見列。不要夾進這次。

### 同一政策裡多個 `has_capability` 是加法

每個裸呼叫都進 `current_app_role()`。包裝時應收成**一個** InitPlan，例如：

```sql
(select private.has_capability('schedule.read') and public.is_mgmt_staff())

(select private.has_capability('entitlements.read')
    or private.has_capability('students.read'))
```

不要每個 key 各包一次、卻仍讓政策每列組合它們。

### 原文清單沒點名、必須包的呼叫

- `inbox_events`：`has_capability('inbox.read') AND NOT is_teacher_role() AND (audience 空 OR current_app_role() = ANY (audience_roles))`。`current_app_role()` 與列無關；`audience_roles` 比較留在外面。
- `inbox_reads`：`has_capability('inbox.read') AND actor_key = current_inbox_actor_key()`。`current_inbox_actor_key()` 是 plpgsql，內部再調 `current_app_role`，與列無關。
- `current_portal_student_id()`（portal 政策的等號右側）。
- `can_access_homework_day_logs()`（功輔日誌；表小，同一規則）。

### 老師範圍函數：七月熱修沒有跟到其他表

這次**不改範圍語意**。行政在 InitPlan 且 AND 短路後不應再進這些函數；老師名單／點名紙仍會。第一輪不要改它們，也不要為此加 69 條未索引外鍵。

| 政策 | 仍在做的事 |
| --- | --- |
| `students` 老師 SELECT | `teacher_can_access_student(id)`：報讀、舊日曆指派、請假補回堂、試堂，四段 `EXISTS`。補回那段對每筆請假再呼叫 `teacher_can_access_schedule(makeup_schedule_id)` |
| `attendance_declarations` 老師 SELECT | `teacher_can_access_schedule(schedule_id)`，約 4,900 列每列回表 |
| `attendance_details` 老師 SELECT | `teacher_can_read_attendance(class_id, schedule_id)` |
| `leave_makeup_records` 老師 SELECT | `teacher_can_access_class` 或 `teacher_can_access_schedule` |

第二輪（InitPlan 之後、老師 `EXPLAIN` 仍 Seq Scan 時）才考慮：請假的 `class_id`／`schedule_id`／`makeup_schedule_id`、試堂的 `class_id`／`schedule_id`、出席的 `class_id`。

### 包了 InitPlan 仍在、不要假裝一次修完

- PostgREST embed 把同一套政策乘到嵌套表（排程帶班別／老師／課室；宣告嵌套池）。行政應隨 InitPlan 下降；若仍慢，才是查詢形狀（錯題本：不要拉全年宣告再在 JS 濾）。第一輪不改前端。
- `{ count: 'exact', head: true }`：請假表約 128 列卻有約 2,802 次、平均 1.5 秒；排程類似。根因仍是 RLS 逐列；包好之後應回到毫秒。不要先改成 `planned` 當修復。
- 效能顧問的未使用索引、staging 無主鍵、Auth 連線數策略：與今晚無關。

---

## 修正後的改法

把「與該列無關」的判斷改成標量子查詢，讓每一句 SQL 只算一次。這是授權方案 §3 已採用的寫法。真源是 **live `pg_policy`**（`pg_get_expr(polqual)`／`polwithcheck`），不要只改 P0-1 migration 裡那些 `rls_cap_select_*`。用腳本列出裸呼叫後生成 `ALTER POLICY`，同一交易提交。不要先 `DROP POLICY` 再另開交易 `CREATE`：中間 RLS 仍開、政策為空時，該表會全部拒絕。

### 要包（與列無關）

`private.has_capability`、`public.is_mgmt_staff`、`public.is_teacher_role`、`public.is_portal`、`public.current_teacher_id`、`public.current_portal_student_id`、`public.current_app_role`、`public.current_inbox_actor_key`、`public.can_access_homework_day_logs`、`public.current_app_user_id`（若政策直接呼叫）。

同一政策裡多個 session 不變判斷，合成**一個** `(SELECT …)`。

### 不准包進外層子查詢（列條件）

`teacher_owns_schedule_row(…, class_id, teacher_id, original_teacher_id)`、`teacher_can_access_class(class_id)`、`teacher_can_access_schedule(schedule_id)`、`teacher_can_access_student(id)`、`teacher_can_read_attendance(class_id, schedule_id)`、`portal_can_access_class(class_id)`、以及 `id = …`／`actor_key = …`／`current_app_role() = ANY (audience_roles)` 的**欄位那一側**。

可選、作為防漏：在可內聯的 `is_teacher_role`／`is_mgmt_staff` 內部把 `current_app_role()` 包成 `(SELECT …)`。`has_capability`、`is_portal`、`current_inbox_actor_key` 是 DEFINER／plpgsql，**不會**內聯，政策層仍必須包。兩層一起做，不是二選一。

`portal_can_access_class` 內部可改成 `e.student_id = (SELECT current_portal_student_id())`；整段函數不能包進外層 `(SELECT …)`。

### 寫法示例

職員政策收成一個 InitPlan：

```sql
alter policy rls_cap_select_schedules
on public.schedules
using (
  (select private.has_capability('schedule.read') and public.is_mgmt_staff())
);
```

老師與學生入口只包角色與整句不變的 id：

```sql
alter policy rls_phase_b_teacher_select_schedules
on public.schedules
using (
  (select public.is_teacher_role())
  and public.teacher_owns_schedule_row(
    (select public.current_teacher_id()),
    class_id,
    teacher_id,
    original_teacher_id
  )
);

alter policy portal_select_schedules
on public.schedules
using (
  (select public.is_portal())
  and public.portal_can_access_class(class_id)
);
```

FOR ALL 同樣包（這條也參與 SELECT）：

```sql
alter policy rls_cap_write_leave_makeup_records
on public.leave_makeup_records
using (
  (select private.has_capability('leaves.manage'))
)
with check (
  (select private.has_capability('leaves.manage'))
);
```

收件匣直接呼叫：

```sql
-- USING 概念：角色一次；audience_roles 仍逐列
(select private.has_capability('inbox.read'))
and (select not public.is_teacher_role())
and (
  coalesce(cardinality(audience_roles), 0) = 0
  or (select public.current_app_role()) = any (audience_roles)
)
```

預期：行政讀上面那句 `makeup_of`，從約 1.3 秒回到約 20–50 毫秒，shared hit 從約三萬頁回到約一百頁。老師仍逐列跑範圍函數。那是範圍判斷，這次不拿掉，老師畫面也不該因此變寬或變快。

### 不要做的事

- 把 `statement_timeout` 調大。那會讓真正跑滿的語句佔著連線更久。
- 為 `%makeup_of=%` 加 trigram。沒有逐列政策時這句已是 20 毫秒；約 4,000 列不值得為寫入付索引。
- 另加一條 `USING (true)` 或「快速政策」卻留下舊政策。多條 permissive policy 是聯集，舊的逐列表達式還在。
- 用 `SECURITY DEFINER` 的檢視或 RPC 繞過 RLS 來換速度。那是另一套授權，不在這次範圍。
- 調政策順序當修復，或第一輪合併成角色快照／單一 `CASE` 政策。
- 第一輪改老師範圍語意、加齊 69 條外鍵索引、改前端 embed／`count: 'exact'`、動 roster RPC。

## 這個改法可能造成的新問題

表達式保持等價時，可見列不應改變。InitPlan 只活在單一 statement；下一句會再讀 active role。`has_capability` 為 null 或 false 時，該列仍然不通過。

會出問題的是改寫時不再等價：

| 改寫 | 後果 |
| --- | --- |
| 只留 `is_mgmt_staff()`，拿掉 `has_capability` | 行政、管理層、財務、外星人都是職員，能力不同。讀取範圍變寬 |
| 老師政策只剩 `(SELECT is_teacher_role())`，或把 `teacher_owns_schedule_row(class_id, …)` 放進一個不參考該列的子查詢 | 老師看到全部課堂 |
| 學生入口只剩 `(SELECT is_portal())` | 學生看到全部列 |
| 新增寬鬆政策而不替換舊政策 | 舊成本還在；若新政策恒真，表被打開 |
| 只改具名 SELECT，留下 `FOR ALL` | 讀取仍然逐列跑寫入政策裡的 `has_capability` |
| 把能力拷進 JWT | 與 §3 相反。切換角色、撤權要等 token 更新 |

若包了子查詢之後，行政計畫仍逐列呼叫 `teacher_owns_schedule_row`，時間不會回到數十毫秒。那時才考慮把三條合成一條 `CASE (SELECT current_app_role())` 政策（行政支路完全不含老師範圍函數）。確認前不要假設已解決。

## 建議的驗證

在**會 rollback 的交易**裡改政策，不要先提交。用**真實 access token**（含 `session_id`）。對行政、管理層、財務、老師、學生入口（含代看學生）各做：

- `schedules`、`students`、`leave_makeup_records`、`attendance_declarations` 的 `count(*)`
- 一筆應看見的 id、一筆不應看見的 id

列數與抽樣 id 和改寫前一致，才提交。財務要挑一個他沒有的 capability（例如 `leaves.read`），確認仍然看不見。

提交後以行政身分 `EXPLAIN (ANALYZE, BUFFERS)`：

| 查詢 | 通過標準 |
| --- | --- |
| 文中那句 `makeup_of` | 約 20–50ms；shared hit 約一百，不是約 37,000 |
| 首頁當日 `schedules` 帶班別／老師 embed | 遠低於現況數秒；不應貼 8s |
| `leave_makeup_records` 的 `count(*)` | 毫秒級，不是約 1.5s |

老師身分再跑 `schedules`／`students`／宣告：計畫裡仍有範圍函數，且不會退回整表。

## 方法限制

- 初稿行政身份是：`set_config('request.jwt.claims', {"sub": <某行政 auth_user_id>, "role": "authenticated"})`，然後 `SET LOCAL ROLE authenticated`。沒有設定 session claim。擴大檢查讀了 live 政策與函數定義，仍未在含 `session_id` 的 JWT 下重跑 `EXPLAIN`。
- 擴大檢查已讀全庫政策表達式與 FOR ALL 清單；未逐條人工改寫（尚未寫 migration）。
- `get_teacher_schedule_roster_context` 未拆計畫。
- 沒有改任何政策，也沒有寫 migration。
