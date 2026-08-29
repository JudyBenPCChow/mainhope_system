# Session HANDOFF：P0-2 過夜續做

| 欄位 | 值 |
| --- | --- |
| 日期 | 2026-08-15 |
| 主題／backlog | [`tech-debt-hardening.md`](../../product/topics/tech-debt-hardening.md)（P0-2） |
| 分支／工作樹 | `main`；有大量其他未提交程式改動，不可擅自 stage／commit／覆蓋 |
| 驗證 | 本輪只讀交接／主題；未跑 build／lint／test |

## 目標
- P0-2：前端 AuthContext／route／nav／button／teacher scope 消費同一 DB profile，消除 localStorage 身份權威。
- **P0-1 先行**；未交凍結 contract 前唔改共用 Auth 檔。

## 已完成
- P0-2 調查已存：。
- 與 P0-1 互相審閱；架構方向一致。
- 2026-08-15 晚：新 P0-2 agent 已讀協調交接，確認交接區同分工；用戶指示唔實作。
- Backlog／分題已標：P0-2 調查完、agent 已接、等 P0-1。

## 未完成／卡住
- P0-1 決策稿仍填答中：[`p0-1-authorization-decisions.md`](../../product/topics/p0-1-authorization-decisions.md)。公理 1／B／C／IA1／V2／V4 已收；未全簽。
- Profile v2／role-switch v2／capability catalog／`authz_version` 未凍結。
- Callsite inventory、UI／聯合驗收案例尚未補寫。
- 未改任何前端 Auth 程式。

## 下一步（給新會話）
1. Glob `docs/meta/handoffs/*p0-authz*`，讀日期最新一份（含本檔同協調檔）。
2. 若 P0-1 已交 profile v2／capability catalog／role-switch contract → 審閱接口，唔自改 key、唔另建前端矩陣。
3. 否則可補 localStorage／teacher scope／cache／route guard callsite inventory，或準備 UI／聯合驗收案例。
4. 未交 contract 前唔改共用 Auth 檔、唔 commit。

## 開局必讀（精簡）
- `AGENTS.md`
- [`tech-debt-hardening.md`](../../product/topics/tech-debt-hardening.md)
- [`2026-08-15-p0-authz-coordination-session.md`](./2026-08-15-p0-authz-coordination-session.md)

## 勿再踩
- 唔用 `hasCapability(role, key)` 喺前端重建矩陣；要用 `can(profile.capabilities, "payments.void")`。舊 P0-2 調查 §4 仍寫前者，以協調 handoff／P0-1 定稿為準。
- 唔把 localStorage／React Context／JWT claim 當授權真源。
- IA1 已收：P0-1 只收 DB 權限；側欄暫時維持而家，畫面改動屬 P0-2 其後。

## 明確唔做
- 現階段不實作前端 Auth 改造。
- 不可改：`authBootstrap.tsx`、`authSession.ts`、`authRoleQueries.ts`、`RequireMgmtRoles.tsx`、`mgmtRole.ts`、`teacherScope.ts`、`navStructure.ts`。
- 不 commit／push。
