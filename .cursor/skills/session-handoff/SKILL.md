---
name: session-handoff
description: >-
  長會話收尾：分層寫 session HANDOFF、糾正反思表、可復用錯題本；新會話開工前讀交接再繼續。
  用戶說「準備handoff」時必須套用。亦用於收尾、交接、handoff、結束會話、換日續做、
  寫給下一個 agent、回顧糾正或錄入經驗。唔用於行政同事工程完工摘要（用 mainhope-release-handoff）。
---

# 會話收尾交接（三層）

寫俾**完全冇上下文**嘅下一個 agent／下日自己睇。唔好把進度、反思、長期教訓塞同一個檔。

## 同其他文件嘅界線

| 文件／skill | 用途 | 本 skill 唔做 |
| --- | --- | --- |
| 本 skill → session HANDOFF | 呢次任務**進度狀態** | — |
| `mainhope-release-handoff` | 工程完工 → **行政摘要**／收件匣草稿 | 唔寫行政文案 |
| `docs/meta/AGENT_HANDOFF.md` | 長期架構／分層／RLS 慣例 | 唔覆寫、唔塞 session 進度 |
| `docs/product/BACKLOG.md` + `docs/product/topics/<topic>.md` | 主題真相來源 | HANDOFF 只**指過去**，唔複製長規格 |
| `AGENTS.md`／`.cursor/rules`／skills | 長期規則 | 錯題本重複出現先升格 |

## 推薦順序

1. **先寫 session HANDOFF**（必做，若用戶要求收尾／交接）
2. **過程有被糾正** → 出反思表（預設只回覆聊天，唔落碟）
3. **可復用教訓** → 寫入／更新錯題本
4. **同一教訓反覆出現** → 升格到 `AGENTS.md`／rule／skill（先問用戶，除非用戶已授權改規則）

用戶只講其中一層就只做嗰層。

---

## 1. Session HANDOFF（狀態）

**路徑**：`docs/meta/handoffs/YYYY-MM-DD-<scope>-session.md`  
目錄唔存在就建立。`<scope>` 用短英文／拼音主題（例：`payroll-tab-ia`、`summer-roster`）。

**只記狀態**，唔寫長篇敘事、唔貼大段 code、唔重抄 backlog 規格。

### 寫之前先核對事實

- 相關 `git status`／關鍵 diff（若有未提交變更）
- 對應 `docs/product/topics/<topic>.md` 現況（若有主題）
- 已跑驗證（`build`／`lint`／測試）同結果；未跑就寫「未驗證」

### 模板

```markdown
# Session HANDOFF：<一句主題>

| 欄位 | 值 |
| --- | --- |
| 日期 | YYYY-MM-DD |
| 主題／backlog | `docs/product/topics/<topic>.md` 或「無分題」 |
| 分支／工作樹 | <branch；有未提交就列關鍵路徑> |

## 目標
- <本會話要達成咩；一句到三句>

## 已完成
- <可驗證成果；檔案／路由／migration 用路徑點名即可>

## 未完成／卡住
- <阻礙、待確認產品決策、環境限制>

## 下一步（給新會話）
1. <第一件該做嘅具體動作>
2. <…>

## 開局必讀（精簡）
- `AGENTS.md`
- <最多 2–3 個直接相關檔：backlog 分題、關鍵 service>

## 勿再踩
- <本會話已踩過、下個 agent 易再踩嘅坑；無則寫「無」>

## 明確唔做
- <範圍外、用戶否決、或應交另一 skill 嘅事>
```

### 完成後回覆用戶

- 檔案路徑
- 下一步第一條（方便即刻開新會話）
- 若有未提交變更／未套用 migration，醒目標出

---

## 2. 反思（糾正歸因）

適用：用戶要求回顧、或收尾時本會話確有被糾正。

**預設只輸出在聊天**；用戶明確要求存檔先寫  
`docs/meta/handoffs/YYYY-MM-DD-<scope>-retro.md`。

逐條列出**被用戶糾正**嘅內容（唔係所有改動）。歸因只准兩類：

- **信息不足**：缺檔、缺慣例、未讀 backlog／AGENTS、假設錯誤前提
- **判斷錯**：有資訊仍選錯方案、過度設計、忽略鐵則

用表：

```markdown
| 修改內容（糾正後應係咩） | 錯誤歸因 | 下次開局指令建議 |
| --- | --- | --- |
| … | 信息不足／判斷錯 | 給用戶可直接貼嘅一句提示 |
```

「下次開局指令建議」要可執行（例：「先讀 `docs/product/topics/payroll-engine.md` 再改 UI，唔好動引擎」），唔好空泛「要小心」。

---

## 3. 錯題本（可復用經驗）

**路徑**：`docs/meta/AGENT_LESSONS.md`（無則新建，用下方結構）。

**只錄**：

- 可復用教訓（下次另一主題都用得着）
- 已驗證有效嘅做法

**唔錄**：

- 一次性進度（歸 HANDOFF）
- 已寫進 `AGENTS.md`／`.cursor/rules`／既有 skill 嘅條文（改加一句「見 xxx」，唔重複全文）
- 未經確認嘅推測

### `docs/meta/AGENT_LESSONS.md` 結構

```markdown
# Agent 錯題本

可復用教訓。Session 進度見 `docs/meta/handoffs/*-session.md`。長期鐵則見 `AGENTS.md`。

## 教訓

### YYYY-MM-DD — <短標題>
- **情境**：
- **錯在邊**：
- **正確做法**：
- **若已升格**：<AGENTS／rule／skill 路徑，或「未升格」>
```

已有相近條目 → **更新舊條**，唔新開重複標題。

---

## 新會話開工（讀 HANDOFF 時）

若用戶指住某份 `*-session.md` 或話「按上次 HANDOFF 繼續」：

1. 讀該 HANDOFF（同其「開局必讀」清單）
2. 唔預讀 audits／舊 plans（跟 `AGENTS.md` 讀檔階梯）
3. 先複述目標、下一步第一條、勿再踩；等用戶確認或直接開工（視用戶語氣）

---

## 觸發用語（用戶可直接貼）

1. 「呢個會話要結束。寫一份交接俾完全冇上下文嘅新會話，存到 `docs/meta/handoffs/`。」
2. 「回顧今次協作，把所有被我糾正過嘅內容逐條列出；用表：修改內容、錯誤歸因、下次指令建議。」
3. 「把啱啱嘅經驗錄入錯題本，只記糾錯同有效方法；已有就更新。」
