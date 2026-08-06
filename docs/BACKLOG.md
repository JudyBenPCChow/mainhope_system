# 工程待跟進（Backlog）

本檔＝工程主題目錄，不是產品看板，也不是 UI／營運規範正文。

| 想找… | 去邊 |
| --- | --- |
| 手機該點做（規範） | [`UI_DESIGN_INSTRUCTIONS.md`](./UI_DESIGN_INSTRUCTIONS.md) §14；收款單一入口 §15 |
| 流動介面進度／模擬 | [`backlog/mobile-ui.md`](./backlog/mobile-ui.md)；[波次 1](./audits/2026-08-01-mobile-shell-wave1-sim.md)／[2](./audits/2026-08-01-mobile-wave2-sim.md)／[3](./audits/2026-08-01-mobile-wave3-private-tutoring-sim.md)／[三角色裝置 08-05](./audits/2026-08-05-mobile-roles-devices-sim.md) |
| 進行中實作步驟 | [`docs/plans/`](./plans/) |
| 稽核報告（已完成的調查） | [`docs/audits/`](./audits/)（含 [未用／隱藏路由／重疊](./audits/2026-07-31-unused-overlap-routes.md)、[老師桌面／手機對照](./audits/2026-07-31-teacher-desktop-mobile-parity.md)） |
| 行政邊緣模擬（2026-07-31） | Cursor Canvas `admin-edge-case-simulation.canvas.tsx`；發現已回寫各 backlog 分題「行政邊緣模擬」節 |
| 未規劃功能構想 | [`FUTURE_*.md`](./FUTURE_BANNER_PUSH_NOTIFICATIONS.md) 等 |
| 架構習慣 | [`AGENT_HANDOFF.md`](./AGENT_HANDOFF.md) |
| 營運操作／政策 | [`SYSTEM_MANUAL.md`](./SYSTEM_MANUAL.md)、[`OPS_POLICIES.md`](./OPS_POLICIES.md) |

**Agent 讀檔習慣**：

- 問「有咩未做」／list backlog → **只讀「進行中／未完成」表**（`open`／`in_progress`）；**停**；勿開分題、勿把下方已完成表當成待辦。
- 做某個主題 → 先開該列 `backlog/<topic>.md`；僅當 `in_progress` 且需要步驟時再開**現行** `plans/…`；唔開同主題舊 review／adversarial 系列。
- 「想找」表同 `audits/` 連結＝備查索引；預設唔開，除非對對抗結果、查「點解咁決定」、或使用者點名續做該波。
- 已完成／已取消表同其連結：備查用，日常任務唔掃。

## 維護約定

- 新主題：加一列到「進行中／未完成」+ 可選 `docs/backlog/<topic>.md`
- 開始做：狀態改 `in_progress`；若有實作計畫，連到 `docs/plans/…`
- 完成或取消：狀態改 `done`／`cancelled`，**整列移到「已完成／已取消」表**（可留分題檔備查，勿默默刪）
- 本索引只放一句摘要；長表／方案放分題檔
- **唔好**把 `done`／`cancelled` 同未做完項混喺同一張表

---

## 進行中／未完成

| 狀態 | 優先 | 主題 | 摘要 | 詳情 |
| --- | --- | --- | --- | --- |
| in_progress | 高 | 報讀包裝與點名權益 | Wave 1–2 ✅；跟飛單元＋`26SM` ✅；**live `2627` E2E 阻**（0 班）；產品思考中：收款→池／請假遲用唔經轉結餘（禁 Phase A）；Wave 3 開口近先做否則緩；`26SM` 切換不做 | [summer-enrollment-roster-consistency.md](./backlog/summer-enrollment-roster-consistency.md) · [計劃](./plans/2026-08-04-enrollment-entitlement-roster.md) · [閉環 draft](./plans/2026-08-04-tuition-entitlement-closed-loop.md) · [請假遲用討論](./plans/2026-08-05-leave-deferral-pool-vs-credit-discussion.md) · [顧問評審](./backlog/summer-enrollment-roster-consistency-consulting-review.md) · [影響模擬](./audits/2026-08-03-summer-enrollment-tuition-rights-impact.md) |
| in_progress | 高 | 流動裝置介面 | 高頻波次 1–3 回歸 Pass；2026-08-05 三角色模擬：餘 Mgmt／外星人大表／老師 P3／FilterSheet | [mobile-ui.md](./backlog/mobile-ui.md) · [sim 08-05](./audits/2026-08-05-mobile-roles-devices-sim.md) · [1](./audits/2026-08-01-mobile-shell-wave1-sim.md)／[2](./audits/2026-08-01-mobile-wave2-sim.md)／[3](./audits/2026-08-01-mobile-wave3-private-tutoring-sim.md) |
| open | 中 | 功課輔導班產品 | v2 全角色沙盒已落地（待審閱）；功課進度留 Notion；餘價錢／計費／校曆／讓房；未接正式 DB | [homework-tutoring.md](./backlog/homework-tutoring.md) · [UI v2](./plans/2026-08-01-homework-tutoring-ui-design-v2-roles.md) |
| open | 中 | 原班連堂分節點名 | 第 1 節假、第 2 節到尚未支援；行政模擬 S06 判定 UI 無法收尾 | [consecutive-half-session-attendance.md](./backlog/consecutive-half-session-attendance.md) |
| open | 中 | 連堂請假預設 UX | 預設「兩節一併」易多欠 1；行政模擬 S04 | [consecutive-leave-default-ux.md](./backlog/consecutive-leave-default-ux.md) |
| in_progress | 中 | 代堂算薪／出勤報表 | 已點名禁取消代堂＋空白老師警告＋老師詳情出勤改跟排程老師；餘匯出／KPI 盤點、換主責只同步未來 | [substitute-teacher-reporting.md](./backlog/substitute-teacher-reporting.md) · [前線](./manual/SUBSTITUTE_AND_CLASS_TEACHER_FRONTLINE.md) |
| open | 中 | 死碼／路由表面清理 | 沙盒＋待辦看板**已廢除**；**月費頁／contactUpdate 暫緩勿刪**；餘 D2b／D3–D5 | [dead-surface-cleanup.md](./backlog/dead-surface-cleanup.md) · [稽核](./audits/2026-07-31-unused-overlap-routes.md) |
| open | 中 | 軟封存與查詢收窄 | 已畢業＋近兩學年預設唔 load（唔刪）；對抗紅線已寫；稍後開工 | [soft-archive-query-scope.md](./backlog/soft-archive-query-scope.md) · [對抗](./audits/2026-08-01-soft-archive-adversarial.md) |
| open | 中 | 計糧／營運總覽載入偏慢 | 診斷：未結算計糧每次 live 重算；營運總覽 summary→full 重複查詢＋重活；與軟封存互補另做；稍後開工 | [page-load-perf-payroll-mgmt.md](./backlog/page-load-perf-payroll-mgmt.md) |
| in_progress | 中 | HK 成本統計／入帳 | 7 月非薪金已確認（剩按金 1 筆）；計糧結算後驗薪金 void／過帳；純利另題 | [hk-expense-cost-stats.md](./backlog/hk-expense-cost-stats.md) · [計劃](./plans/2026-08-05-hk-expense-cost-stats.md) |
| open | 低 | 營運文件瀏覽頁 | idea：行政以上（admin／manager／alien）應用內睇營運文件；未開工 | [ops-docs-viewer.md](./backlog/ops-docs-viewer.md) |
| open | 中 | Alien 模擬職員身份 | idea：對方報畫面問題時以該職員視角檢視；前端-only → 可選 DB view-as；先不實作 | [alien-mgmt-view-as.md](./backlog/alien-mgmt-view-as.md) |

---

## 已完成／已取消

備查用；**唔係**待辦。完成日以分題檔為準。

| 狀態 | 優先 | 主題 | 摘要 | 詳情 |
| --- | --- | --- | --- | --- |
| done | 中 | 計糧引擎 | 正式引擎已接線（schema／計算／`/Payroll` 真點名；審閱→結算已持久化）；功課班暫緩；費率頁／銀行帳號／Sophie·Cody 入冊屬下一波 | [payroll-engine.md](./backlog/payroll-engine.md) · [指南](./PAYROLL_GUIDE.md) · [修訂方法](./plans/2026-08-01-payroll-method-revised.md) |
| done | 中 | 聯絡資料自助更新（一次性活動） | token／公開頁／活動頁已上；admin／alien；執行窗 8 月下旬 | [contact-update-campaign.md](./backlog/contact-update-campaign.md) |
| done | 高 | 正規逾期罰款 | 收款自動加 $50（池模型；每月每科一次；豁免須原因；2026-10-01 起生效；禁入室不系統化；admin／alien 系統通知已發） | [tuition-late-fee-enforcement.md](./backlog/tuition-late-fee-enforcement.md) · [前線指引](./manual/TUITION_LATE_FEE_FRONTLINE.md) |
| done | 中 | 管理層角色分流 | 新增 `manager`；首頁／側欄分流；`isAdminOrAlien` 敏感主控；migration 已套用 | [mgmt-manager-role.md](./backlog/mgmt-manager-role.md) · [計劃](./plans/2026-08-01-mgmt-manager-role.md) |
| done | 高 | 角色／權限日常加固 | P0／P1＋R1／R2／§6 已清；對抗 P1（CTA／slim balances／manager 旗標／文案）已修 | [role-ops-hardening.md](./backlog/role-ops-hardening.md) · [計劃](./plans/2026-08-01-student-detail-teacher-hardening.md) · [對抗](./audits/2026-08-01-student-detail-teacher-adversarial.md) |
| done | 高 | 生命週期孤兒 | A1／A2／O3／O4 已落；O0／O5 本期不做（可見性／健康檢查可另開） | [lifecycle-orphans.md](./backlog/lifecycle-orphans.md) · [plans](./plans/2026-07-31-lifecycle-orphans.md) |
| done | 中 | 試堂紀錄收尾 | 零頁內收款、對帳／O1t／PaymentStep／作廢解掛／系統通知已齊；視為完全解決 | [trial-sessions.md](./backlog/trial-sessions.md) |
| done | 高 | 撤學年硬鎖＋輕量防呆 | 清硬鎖；非當期 confirm＋audit | [academic-year-unlock-soft-guard.md](./backlog/academic-year-unlock-soft-guard.md) |
| cancelled | 高 | 學年鎖整固 | 不整固；改撤硬鎖＋confirm＋audit | [academic-year-lock.md](./backlog/academic-year-lock.md)（歷史）· [rethink](./audits/2026-07-31-academic-year-lock-rethink.md) |
| done | 中 | Migration 歷史對齊 | 幽靈已清；A–D 完成；local/remote 對齊；`db push --dry-run` up to date（2026-07-31） | [supabase-migration-history.md](./backlog/supabase-migration-history.md) |
