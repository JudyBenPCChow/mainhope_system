# 工程待跟進（Backlog）

本檔＝工程主題目錄，不是產品看板，也不是 UI／營運規範正文。


| 想找…                | 去邊                                                                                                                                                                                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 手機該點做（規範）          | `[UI_DESIGN_INSTRUCTIONS.md](../meta/UI_DESIGN_INSTRUCTIONS.md)` §14；收款單一入口 §15                                                                                                                                                                                                 |
| 流動介面進度／模擬          | `[backlog/mobile-ui.md](./topics/mobile-ui.md)`；[波次 1](./audits/2026-08-01-mobile-shell-wave1-sim.md)／[2](./audits/2026-08-01-mobile-wave2-sim.md)／[3](./audits/2026-08-01-mobile-wave3-private-tutoring-sim.md)／[三角色裝置 08-05](./audits/2026-08-05-mobile-roles-devices-sim.md) |
| 進行中實作步驟            | `[docs/product/plans/](./plans/)`                                                                                                                                                                                                                                               |
| 稽核報告（已完成的調查）       | `[docs/product/audits/](./audits/)`（含 [未用／隱藏路由／重疊](./audits/2026-07-31-unused-overlap-routes.md)、[老師桌面／手機對照](./audits/2026-07-31-teacher-desktop-mobile-parity.md)、[2026-08-14 技術債](./audits/2026-08-14-tech-debt-review.md)）                                                   |
| 行政邊緣模擬（2026-07-31） | Cursor Canvas `admin-edge-case-simulation.canvas.tsx`；發現已回寫各 topics 分題「行政邊緣模擬」節                                                                                                                                                                                                 |
| 未規劃功能構想            | `[FUTURE_*.md](./future/FUTURE_BANNER_PUSH_NOTIFICATIONS.md)` 等                                                                                                                                                                                                                 |
| 架構習慣               | `[AGENT_HANDOFF.md](../meta/AGENT_HANDOFF.md)`                                                                                                                                                                                                                                  |
| 營運操作／政策            | `[SYSTEM_MANUAL.md](../playbooks/_INDEX.md)`、`[OPS_POLICIES.md](../policies/_INDEX.md)`                                                                                                                                                                                         |


**Agent 讀檔習慣**：

- 問「有咩未做」／list backlog → **只讀「進行中／未完成」表**（`open`／`in_progress`）；**停**；勿開分題、勿把下方已完成表當成待辦。
- 問卡住／等緊咩 → 讀「等待中」；**未解除唔開工**（唔套 production、唔當可續做）。
- 做某個主題 → 先開該列 `topics/<topic>.md`；僅當 `in_progress` 且需要步驟時再開**現行** `plans/…`；唔開同主題舊 review／adversarial 系列。
- 「想找」表同 `audits/` 連結＝備查索引；預設唔開，除非對對抗結果、查「點解咁決定」、或使用者點名續做該波。
- 已完成／已取消表同其連結：備查用，日常任務唔掃。



## 維護約定

- 新主題：加一列到「進行中／未完成」+ 可選 `docs/product/topics/<topic>.md`
- 開始做：狀態改 `in_progress`；若有實作計畫，連到 `docs/product/plans/…`
- 完成或取消：狀態改 `done`／`cancelled`，**整列移到「已完成／已取消」表**（可留分題檔備查，勿默默刪）
- 本索引只放一句摘要；長表／方案放分題檔
- **唔好**把 `done`／`cancelled` 同未做完項混喺同一張表

---

表內順序＝優先 **高 → 中 → 低**；同級內先安全／學年擋路，再品質閘與架構，再產品收尾。2026-08-15 技術債 P1–P3 已歸屬（見 [稽核](./audits/2026-08-14-tech-debt-review.md)）。

## 進行中／未完成

| 狀態 | 優先 | 主題 | 摘要 | 詳情 |
| --- | --- | --- | --- | --- |
| in_progress | 高 | 技術債／工程硬化 | **P0-1** kernel 已喺 production。Staging 收緊 RLS＋蓋印已過 allow-deny；**production 未套**（上線檢查見分題）。**2026-08-18** 前端 actor 回退已入 `main`（PR #19）；等 production deploy。**P0-2** Auth 已讀 profile v2；清 service `getMgmtRole`／JWT session 其後。 | [tech-debt-hardening.md](./topics/tech-debt-hardening.md) · [稽核](./audits/2026-08-14-tech-debt-review.md) · [P0-1 重評](./topics/p0-1-authorization-redesign.md) |
| in_progress | 高 | 報讀包裝與點名權益 | Wave 1–2 ✅；**主波支付→池 ✅**；**暫停**：等 `2627` 班 live 後做 E2E／驗收（P1-1 雙路徑） | [summer-enrollment-roster-consistency.md](./topics/summer-enrollment-roster-consistency.md) · [計劃](./plans/2026-08-04-enrollment-entitlement-roster.md) · [閉環 draft](./plans/2026-08-04-tuition-entitlement-closed-loop.md) · [請假遲用討論](./plans/2026-08-05-leave-deferral-pool-vs-credit-discussion.md) · [顧問評審](./topics/summer-enrollment-roster-consistency-consulting-review.md) · [影響模擬](./audits/2026-08-03-summer-enrollment-tuition-rights-impact.md) |
| open | 高 | 2627 九月常規時間表 | 2026-08-18 **ver. 2.5** 候選（60 班；Christine 四改五）；2.0–2.4 檔案保留；待簽收；prod 仍 0 班 | [2627-september-timetable.md](./topics/2627-september-timetable.md) · [全校 pdf](../year/2627/timetable/2627_timetable_scheme_v2.5.pdf) · [老師 pdf](../year/2627/timetable/2627_timetable_teachers_week_v2.5.pdf) · [排課規則](../policies/scheduling/SCHEDULING_RULES.md) |
| open | 高 | Database schema contract／advisor | **P1-3＋P2-1＋P3-1 DB**：generated types、SECURITY DEFINER／FK index 分類、重複 index／殘留表 | [database-contract-advisor-hygiene.md](./topics/database-contract-advisor-hygiene.md) · [稽核](./audits/2026-08-14-tech-debt-review.md) |
| in_progress | 高 | 流動裝置介面 | 高頻波次 1–3 回歸 Pass；2026-08-05 三角色模擬：餘 Mgmt／外星人大表／老師 P3／FilterSheet | [mobile-ui.md](./topics/mobile-ui.md) · [sim 08-05](./audits/2026-08-05-mobile-roles-devices-sim.md) · [1](./audits/2026-08-01-mobile-shell-wave1-sim.md)／[2](./audits/2026-08-01-mobile-wave2-sim.md)／[3](./audits/2026-08-01-mobile-wave3-private-tutoring-sim.md) |
| open | 中 | 計糧／營運總覽載入偏慢 | **P2-2**：未結算計糧每次 live 重算；營運總覽 summary→full 重複查詢＋重活；與軟封存互補另做；稍後開工 | [page-load-perf-payroll-mgmt.md](./topics/page-load-perf-payroll-mgmt.md) |
| open | 中 | 軟封存與查詢收窄 | 已畢業＋近兩學年預設唔 load（唔刪）；**P1-6**＝請假／試堂停用 `listStudents()` 全表 `select *`；對抗紅線已寫；稍後開工 | [soft-archive-query-scope.md](./topics/soft-archive-query-scope.md) · [對抗](./audits/2026-08-01-soft-archive-adversarial.md) |
| open | 中 | 死碼／路由表面清理 | **P2-4＋P3-1 前端**：`/prototype/*` 其後加返（含免登入 HomeWayfinding）；月費／contactUpdate 暫緩勿刪；餘 D2b／D3／D6 Base44／包名 | [dead-surface-cleanup.md](./topics/dead-surface-cleanup.md) · [稽核](./audits/2026-07-31-unused-overlap-routes.md) |
| open | 中 | 登入洩露密碼保護（原 P0-4） | Supabase Auth 開 HaveIBeenPwned 檢查；無程式；自技術債拆出 | [auth-leaked-password-protection.md](./topics/auth-leaked-password-protection.md) · [RLS 收尾](../meta/RLS_ROLLOUT.md) |
| in_progress | 中 | HK 成本統計／入帳 | 7 月：計糧已結算＋`payroll_settle` 已過帳；歷史薪金已 void；Cody 非計糧 $420 已補；**剩按金待定**；非老師人工未產品化；4–6 月／純利另波 | [hk-expense-cost-stats.md](./topics/hk-expense-cost-stats.md) · [計劃](./plans/2026-08-05-hk-expense-cost-stats.md) |
| in_progress | 中 | 代堂算薪／出勤報表 | 已點名禁取消代堂＋空白老師警告＋老師詳情出勤改跟排程老師；餘匯出／KPI 盤點、換主責只同步未來 | [substitute-teacher-reporting.md](./topics/substitute-teacher-reporting.md) · [前線](../playbooks/frontdesk/SUBSTITUTE_AND_CLASS_TEACHER_FRONTLINE.md) |
| open | 中 | 營運總覽 KPI 規格 | 寫清 `/MgmtDashboard` 要顯示邊啲數；已收產品 1–7（收學費／堂數／試堂／免費／消堂） | [mgmt-dashboard-kpi-spec.md](./topics/mgmt-dashboard-kpi-spec.md) |
| open | 中 | 2627 常規學年營運指引 | **v1.8**＋docx；§7 校曆＋月費已寫；讓房不做；待發佈／掛 SYSTEM_MANUAL | [2627-regular-year-ops-guide.md](./topics/2627-regular-year-ops-guide.md) · [指引](../year/2627/ops-guide.md) · [docx](../generated/2627/2627_REGULAR_YEAR_OPS_GUIDE.docx) |
| open | 中 | 功課輔導班產品 | H1–H10 已定（H4＝不做讓房）。價曆已簽收；後台未可登記月費；餘 H11 審閱 | [homework-tutoring.md](./topics/homework-tutoring.md) · [待決 WIP](./topics/homework-tutoring-decisions-wip.md) · [月費](../policies/payments/HOMEWORK_TUTORING_MONTHLY_FEE.md) · [校曆](../policies/academic/ACADEMIC_CALENDAR.md) · [UI v2](./plans/2026-08-01-homework-tutoring-ui-design-v2-roles.md) |
| open | 中 | Alien 模擬職員身份 | idea：對方報畫面問題時以該職員視角檢視；前端-only → 可選 DB view-as；先不實作 | [alien-mgmt-view-as.md](./topics/alien-mgmt-view-as.md) |
| open | 低 | 營運文件瀏覽頁 | idea：行政以上（admin／manager／alien）應用內睇營運文件；未開工 | [ops-docs-viewer.md](./topics/ops-docs-viewer.md) |

---



## 已完成／已取消

備查用；**唔係**待辦。完成日以分題檔為準。

| 狀態 | 優先 | 主題 | 摘要 | 詳情 |
| --- | --- | --- | --- | --- |
| done | 高 | 前端架構邊界／God files | 波次 1–4＋失敗態已落地；KPI／列表失敗唔當 0；唔以拆完 God file／完整單向分層為關閉條件 | [frontend-architecture-boundaries.md](./topics/frontend-architecture-boundaries.md) · [計劃](./plans/2026-08-16-frontend-architecture-boundaries.md) · [稽核](./audits/2026-08-14-tech-debt-review.md) |
| done | 高 | 前台規模／流程更新（試堂原則） | T1–T4 已關；出單閘紙／免費跳收款／計人頭／半價50%；培訓發佈非工程 | [frontline-ops-update.md](./topics/frontline-ops-update.md) · [試堂 WIP](./topics/trial-promo-receipt-frontline-wip.md) · [政策](../policies/enrollment/TRIAL_RECEIPT_BEFORE_ROSTER.md) |
| done | 高 | 單據／權益更正頁（G2） | `/PaymentCorrection`＋調動表＋作廢 30 分／第二人；政策／2627／手册／明學IT狗已跟分流。申請制另題。G2c 雙方家長確認未做 | [payment-entitlement-correction-ui.md](./topics/payment-entitlement-correction-ui.md) · [母題 §4.13](./topics/summer-enrollment-roster-consistency.md) |
| done | 高 | 主線品質閘（P0-3） | CI＋測試 typecheck；`main` ruleset 必過 `lint · typecheck:test · test · ui:check · build`；阿Po 留 | [mainline-quality-gate.md](./topics/mainline-quality-gate.md) |
| cancelled | 中 | 原班連堂分節點名 | 實務幾乎唔會半節假／半節到；維持整組同一狀態 | [consecutive-half-session-attendance.md](./topics/consecutive-half-session-attendance.md) |
| done | 高 | 出席紀錄日期範圍查詢 | 專用 RPC `get_attendance_records_in_range`＋`attendance_date` 索引；列表唔打 roster；預設整月（B）；失敗唔 silent 全 0 | [attendance-records-range-query.md](./topics/attendance-records-range-query.md) |
| done | 中 | 連堂請假預設 UX | 預設改「只請本節」；兩節一併 Confirm；前台勾選提示 | [consecutive-leave-default-ux.md](./topics/consecutive-leave-default-ux.md) |
| done | 中 | 計糧引擎 | 正式引擎已接線（schema／計算／`/Payroll` 真點名；審閱→結算已持久化）；功課班暫緩；費率頁／銀行帳號／Sophie·Cody 入冊屬下一波 | [payroll-engine.md](./topics/payroll-engine.md) · [指南](./PAYROLL_GUIDE.md) · [修訂方法](./plans/2026-08-01-payroll-method-revised.md) |
| done | 中 | 聯絡資料自助更新（一次性活動） | token／公開頁／活動頁已上；admin／alien；執行窗 8 月下旬 | [contact-update-campaign.md](./topics/contact-update-campaign.md) |
| done | 高 | 正規逾期罰款 | 收款自動加 $50（池模型；每月每科一次；豁免須原因；2026-10-01 起生效；禁入室不系統化；admin／alien 系統通知已發） | [tuition-late-fee-enforcement.md](./topics/tuition-late-fee-enforcement.md) · [前線指引](../playbooks/frontdesk/TUITION_LATE_FEE_FRONTLINE.md) |
| done | 中 | 管理層角色分流 | 新增 `manager`；首頁／側欄分流；`isAdminOrAlien` 敏感主控；migration 已套用 | [mgmt-manager-role.md](./topics/mgmt-manager-role.md) · [計劃](./plans/2026-08-01-mgmt-manager-role.md) |
| done | 高 | 角色／權限日常加固 | P0／P1＋R1／R2／§6 已清；對抗 P1（CTA／slim balances／manager 旗標／文案）已修 | [role-ops-hardening.md](./topics/role-ops-hardening.md) · [計劃](./plans/2026-08-01-student-detail-teacher-hardening.md) · [對抗](./audits/2026-08-01-student-detail-teacher-adversarial.md) |
| done | 高 | 生命週期孤兒 | A1／A2／O3／O4 已落；O0／O5 本期不做（可見性／健康檢查可另開） | [lifecycle-orphans.md](./topics/lifecycle-orphans.md) · [plans](./plans/2026-07-31-lifecycle-orphans.md) |
| done | 中 | 試堂紀錄收尾 | 零頁內收款、對帳／O1t／PaymentStep／作廢解掛／系統通知已齊；視為完全解決 | [trial-sessions.md](./topics/trial-sessions.md) |
| done | 高 | 撤學年硬鎖＋輕量防呆 | 清硬鎖；非當期 confirm＋audit | [academic-year-unlock-soft-guard.md](./topics/academic-year-unlock-soft-guard.md) |
| cancelled | 高 | 學年鎖整固 | 不整固；改撤硬鎖＋confirm＋audit | [academic-year-lock.md](./topics/academic-year-lock.md)（歷史）· [rethink](./audits/2026-07-31-academic-year-lock-rethink.md) |
| done | 中 | Migration 歷史對齊 | 幽靈已清；A–D 完成；local/remote 對齊；`db push --dry-run` up to date（2026-07-31） | [supabase-migration-history.md](./topics/supabase-migration-history.md) |
