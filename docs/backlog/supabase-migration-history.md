# Supabase migration 歷史對齊（第二段餘項）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open` |
| 優先 | 中 |
| 範圍 | linked 遠端 `MainHope_production` 的 `schema_migrations` 與本地 `supabase/migrations/` 對齊 |
| 已完成 | 清幽靈（35 個 remote-only `reverted`）；Batch A（21）＋ Batch B1（16）只 `repair applied`、未跑 SQL |
| 不含 | 日常新檔套用（繼續 `npm run db:apply`）；全量 `db push --include-all`（禁止） |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 建議表 | [`SUPABASE_MIGRATION_PHASE2_RECOMMENDATIONS.md`](../SUPABASE_MIGRATION_PHASE2_RECOMMENDATIONS.md) |
| 單檔流程 | [`SUPABASE_MIGRATION_APPLY.md`](../SUPABASE_MIGRATION_APPLY.md) |
| 更新日期 | 2026-07-30 |

## 未做（簡明）

| ID | 項目 | 說明 | 建議 |
| --- | --- | --- | --- |
| M1 | Batch B2 煙霧確認後只標記 | 單堂報讀、軟退讀、補堂 host RLS、portal 相關；使用者尚未回報測完。雙角色 Mark／Katie **已確認正常**，可一併標記：`20260721161817`、`20260723043700` | 測完或授權後 `repair --status applied`（唔跑 SQL）。候選 version 見下「B2 清單」 |
| M2 | Apo chat satisfaction | `20260709060000`：建議再探 `apo_chat_*` 滿意度欄後標記 | 唯讀查欄 → 有則只標記 |
| M3 | Batch C 人工對照 | 成對／別名三組，勿盲目重跑 | 見下「C 清單」；對完多數只標記 |
| M4 | Batch D：作廢通告 | `20260730053000`：inbox 未見對應標題，傾向未 INSERT | 優先 `npm run db:apply -- …30053000…` |
| M5 | Batch D：函式核對 | `20260721020000`（peek_portal_invite…）、`20260717120000`（close_orphan*）探針未見 | 先查遠端物件名；冇先至 `db:apply` |
| M6 | （可選）恢復 `db push` | 餘項清完後先 `db push --dry-run`；仍勿 `--include-all` 亂推 | 僅當 M1–M5 收束後 |

## B2 清單（待標記；測完／授權後）

| Version | 檔案主題 |
| --- | --- |
| `20260618040000` | parent_student_portal |
| `20260711173000` | single_session_enrollment |
| `20260712023000` | enrollment_soft_withdraw_and_agent_reserve |
| `20260720180000` | leave_makeup_host_teacher_access |
| `20260721161817` | mark_yu_dual_mgmt_roles（**已確認正常**） |
| `20260721163734` | legacy_student_subject_enrollments |
| `20260721184621` | portal_trial_schedules_and_security_hardening |
| `20260722110000` | fix_enrollment_dates_and_schedule_rls_perf |
| `20260723043700` | katie_lee_dual_mgmt_roles（**已確認正常**） |

煙霧測入口（行政／外星人）：

| 主題 | 入口 |
| --- | --- |
| 單堂 | `/FrontDeskWizard` 報讀步，或學生詳情報讀 →「單堂／自選堂數」＋勾堂 |
| 軟退讀 | 學生詳情 →「退讀」→「確認退讀」Dialog（測試生先好） |
| 補堂 host | `/LeaveManagement` 調堂／連結補堂；排程／點名見「補堂」標籤 |
| Portal | `/PortalEnrollmentRequests`、`/TrialSessions`、學生詳情家長邀請區 |

## C 清單（人工對照）

| Version | 注意 |
| --- | --- |
| `20260618140000` | 檔寫 `status_reason`；遠端見 `cancel_reason` |
| `20260709092225` / `20260709173000` | teacher_mgmt 成對 |
| `20260714055439` / `20260714140000` | script_library 成對；遠端表名 `script_library_entries` |

## 驗收／完成條件

1. `supabase migration list --linked`：remote-only＝0；local-only 僅餘刻意暫緩項（理想為 0）。
2. 未對 production 跑過全量 `db push --include-all`。
3. 新功能 migration 仍走 `npm run db:apply`。

## 相關

- Skill：`.cursor/skills/apply-supabase-migration/SKILL.md`
- Rule：`.cursor/rules/supabase-migrations.mdc`
