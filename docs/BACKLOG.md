# 工程待跟進（Backlog）

本檔＝工程主題目錄，不是產品看板，也不是 UI／營運規範正文。

| 想找… | 去邊 |
| --- | --- |
| 手機該點做（規範） | [`UI_DESIGN_INSTRUCTIONS.md`](./UI_DESIGN_INSTRUCTIONS.md) §14；收款單一入口 §15 |
| 進行中實作步驟 | [`docs/plans/`](./plans/) |
| 稽核報告（已完成的調查） | [`docs/audits/`](./audits/)（含 [未用／隱藏路由／重疊](./audits/2026-07-31-unused-overlap-routes.md)、[老師桌面／手機對照](./audits/2026-07-31-teacher-desktop-mobile-parity.md)） |
| 行政邊緣模擬（2026-07-31） | Cursor Canvas `admin-edge-case-simulation.canvas.tsx`；發現已回寫各 backlog 分題「行政邊緣模擬」節 |
| 未規劃功能構想 | [`FUTURE_*.md`](./FUTURE_BANNER_PUSH_NOTIFICATIONS.md) 等 |
| 架構習慣 | [`AGENT_HANDOFF.md`](./AGENT_HANDOFF.md) |
| 營運操作／政策 | [`SYSTEM_MANUAL.md`](./SYSTEM_MANUAL.md)、[`OPS_POLICIES.md`](./OPS_POLICIES.md) |

**Agent**：使用者問「有咩未做」／list backlog 時，**只讀「進行中／未完成」表**（`open`／`in_progress`）；勿把下方已完成表當成待辦。

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
| in_progress | 高 | 生命週期孤兒 | **A1 已落 code**（取消補堂攔截＋Confirm）；A2／B／C 未做；附行政模擬個案 | [lifecycle-orphans.md](./backlog/lifecycle-orphans.md)（含「行政邊緣模擬」）· [plans/2026-07-31-lifecycle-orphans.md](./plans/2026-07-31-lifecycle-orphans.md) |
| open | 高 | 角色／權限日常加固 | 對抗性批次已清；殘項：學生詳情繳費／請假對老師旁路 | [role-ops-hardening.md](./backlog/role-ops-hardening.md)（R1–R2 · [老師對照](./audits/2026-07-31-teacher-desktop-mobile-parity.md)） |
| open | 高 | 流動裝置介面 | 三角色手機版面；老師對照＋行政模擬 S19（Inbox／請假橫滑） | [mobile-ui.md](./backlog/mobile-ui.md)（§E · §F） |
| open | 高 | 正規逾期罰款／禁止入室 | 政策已有、系統未強制；行政模擬 S10：第 N 堂／$50／入室警示 | [tuition-late-fee-enforcement.md](./backlog/tuition-late-fee-enforcement.md) |
| open | 中 | 聯絡資料自助更新（一次性活動） | 批量派發專屬連結／QR，家長核對電話與偏好後職員審核寫入；活動完可收埋 | [contact-update-campaign.md](./backlog/contact-update-campaign.md) |
| open | 中 | 試堂紀錄收尾 | 對抗後定案：只經 `/Payments` 收款；O1t 清點名；T4／T5 defer · [對抗](./audits/2026-08-01-trial-sessions-wrapup-adversarial.md) | [trial-sessions.md](./backlog/trial-sessions.md) |
| open | 中 | 原班連堂分節點名 | 第 1 節假、第 2 節到尚未支援；行政模擬 S06 判定 UI 無法收尾 | [consecutive-half-session-attendance.md](./backlog/consecutive-half-session-attendance.md) |
| open | 中 | 連堂請假預設 UX | 預設「兩節一併」易多欠 1；行政模擬 S04 | [consecutive-leave-default-ux.md](./backlog/consecutive-leave-default-ux.md) |
| open | 中 | 代堂算薪／出勤報表 | 部分查詢偏 `classes.teacher_id`；模擬 S07 易錯 | [substitute-teacher-reporting.md](./backlog/substitute-teacher-reporting.md) |
| open | 中 | 死碼／路由表面清理 | 沙盒＋待辦看板**已廢除**；餘：月費頁／prototype 殘碼（D1–D2）、可選 entities／Courses 對齊 | [dead-surface-cleanup.md](./backlog/dead-surface-cleanup.md)（D1–D5）· [稽核](./audits/2026-07-31-unused-overlap-routes.md) |
| open | 中 | 管理層角色分流 | 新增 `manager`；與行政分開首頁（營運總覽 vs 管理中心）及側欄；外星人／老師本期不改 | [mgmt-manager-role.md](./backlog/mgmt-manager-role.md) |

---

## 已完成／已取消

備查用；**唔係**待辦。完成日以分題檔為準。

| 狀態 | 優先 | 主題 | 摘要 | 詳情 |
| --- | --- | --- | --- | --- |
| done | 高 | 撤學年硬鎖＋輕量防呆 | 清硬鎖；非當期 confirm＋audit | [academic-year-unlock-soft-guard.md](./backlog/academic-year-unlock-soft-guard.md) |
| cancelled | 高 | 學年鎖整固 | 不整固；改撤硬鎖＋confirm＋audit | [academic-year-lock.md](./backlog/academic-year-lock.md)（歷史）· [rethink](./audits/2026-07-31-academic-year-lock-rethink.md) |
| done | 中 | Migration 歷史對齊 | 幽靈已清；A–D 完成；local/remote 對齊；`db push --dry-run` up to date（2026-07-31） | [supabase-migration-history.md](./backlog/supabase-migration-history.md) |
