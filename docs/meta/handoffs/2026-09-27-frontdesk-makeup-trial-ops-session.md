# Session HANDOFF：前台 production 調堂／試堂寫入

| 欄位 | 值 |
| --- | --- |
| 日期 | 2026-09-27 |
| 主題／backlog | 無分題（營運寫庫；非 feature 工程） |
| 分支／工作樹 | `main`（對齊 `origin/main`）；未提交：`.cursor/skills/frontdesk-makeup-trial-ops/`；無關：`supabase/.temp/cli-latest`、`.worktrees/` |

## 目標
- 以對話直接在 MainHope_production 安排個別學生補堂（調堂）與試堂（含半價出單／確認收款）。
- 將本會話易錯點升格為可重用 skill，方便新會話自動跟流程。

## 已完成
- **調堂／補堂（production 已寫）**（節錄；皆綁 `leave_makeup_records`）：
  - 中四葉梓軒數學：`9/12` 取消 → `9/10 17:45`（`2627-MATHS4001-B`）
  - 中四蔡曉朗數學：`9/5` 事假 → `9/7 17:45`（`2627-MATHS4001-B`；**非**口頭 `9/12`）
  - 中六趙佳鑫／朱震軒數學：`9/12` → `9/8 17:45`（`2627-MATHS6001-B`，與羅兆斐同格）
  - 中六蕭馥鎣數學：`9/12` → `9/13 11:30`（`2627-MATHS5001-B` 英仙座）
  - 中五譚仟渝數學：`9/12` → 同格 `9/13 11:30`
  - 中六葉熙桐數學：補堂由 `9/10 19:00` **改綁** `9/13 11:30`
  - 中三劉子軒／莊凱茵英文：`9/6` 取消 → `9/11 16:30`（宿主改掛 `2627-ENGS3001-B`）
  - 中六王以靈／陳柏朗／趙樂怡生物：`9/4` → `9/18 17:45`（原班 `BIOS6001-D` 全班補回格）
  - 中六朱震軒／蕭馥鎣化學：`9/19` → `9/27 14:00`（`CHEMS6001-A`）
- **試堂**：
  - 秦錦怡中一科學：`9/20`（已取消）改期 → `9/27 11:30`（`SCIS1001-A`，保留原收款）
  - 趙倩彤中六中文半價試堂：`9/27 16:30`（`CHIS6001-B`）；單據 `MX-RC-20260927-0001` 正價 $300／實收 $150；**已收款、銀行轉帳**；試堂權益池已抬 1 堂
- **Skill（未 commit）**：`.cursor/skills/frontdesk-makeup-trial-ops/`（`SKILL.md`＋`reference.md`）

## 未完成／卡住
- Skill／錯題本更新**尚未 git commit**（用戶未要求 commit）。
- 本會話未跑 `npm run build`／lint（純 production 寫庫＋skill 文件）。

## 下一步（給新會話）
1. 讀 `.cursor/skills/frontdesk-makeup-trial-ops/SKILL.md`；若繼續前台補堂／試堂，直接跟 skill 查庫寫入。
2. 若用戶要保留 skill：commit `.cursor/skills/frontdesk-makeup-trial-ops/`（可連本 handoff／`AGENT_LESSONS` 一併；**不要** commit `supabase/.temp`／`.worktrees/`）。
3. 新補堂／試堂個案：先對請假日／原班取消堂，再揀宿主或出單；收款狀態跟用戶明示。

## 開局必讀（精簡）
- `AGENTS.md`
- `.cursor/skills/frontdesk-makeup-trial-ops/SKILL.md`
- （試堂出單）`docs/playbooks/frontdesk/TRIAL_RECEIPT_FRONTLINE.md`

## 勿再踩
- 口頭「取消堂日」未核對該生原班 `schedules` 就硬綁。
- 補堂掛原班令其他就讀生上紙（除非全班都補）。
- 半價試堂只填實收、不留正價＋「試堂半價（50%）」優惠列。
- 未收款標「已收款」；付款方式用「銀行轉賬」而非預設「銀行轉帳」。
- 確認收款後忘記試堂 `course_group=trial` 抬池。
- 已取消試堂走 `rescheduleTrialSession`（會拒）；應原地改 `schedule_id` 復「已預約」。

## 明確唔做
- 未完成補堂總表／PDF → skill `leave-makeup-followup`
- 全班取消改期工程／抽走 `makeup_of=` 標記
- 本會話無 feature PR／migration 要跟進
