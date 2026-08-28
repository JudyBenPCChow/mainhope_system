# Agent 錯題本

可復用教訓。Session 進度見 `docs/meta/handoffs/*-session.md`。長期鐵則見 `AGENTS.md`。

## 教訓

### 2026-08-28 — 樣式沙盒先獨立 HTML，唔好只掛 Vite 路由
- **情境**：用戶要試新 UI，且明講「沙盒（html）」「唔接真實專案網頁」。
- **錯在邊**：只跟 `src/prototypes/`＋`/prototype/…` 免登入路由。本機若唔喺該 branch 跑 `npm run dev`，React Router 無匹配→全白；Vercel preview 可能有 Deployment Protection。
- **正確做法**：同 `sandbox/tuition-quote/index.html` 一樣，第一件交可雙擊／`python -m http.server` 打開嘅 HTML。Vite `/prototype` 可作後續對齊 design token，但唔好當用戶本機唯一入口。
- **若已升格**：`.cursor/rules/ui-sandbox-html.mdc`、skill `ui-sandbox-html`、`AGENTS.md` 指令節

### 2026-08-08 — 繁中專業紀錄 PDF 字型與版式
- **情境**：2627 時間表要出黑白 docx／pdf 方案紀錄。
- **錯在邊**：PDF 用錯 Songti TTC face（簡體）→ 缺字／亂碼；格內用 S6／功等簡稱；夾「驗證摘要」、emoji／彩色。
- **正確做法**：嵌入 **新細明體（PMingLiU）**（可從 Word `mingliu.ttc` face 1 抽出）；12pt；每章新頁；章題粗體；無斜體／emoji／非灰階色；時間表格內全寫（例：中六級中文科（A)／老師全名／時段）；方案唔放驗證摘要章。
- **若已升格**：未升格（見 `scripts/generate_2627_timetable_doc.py`、本輪 handoff 勿再踩）

### 2026-08-09 — 舊「出錯只准作廢」≠ 最終產品
- **情境**：G2a–G2d 要按錯類型更正（池調動表／作廢重開＋第二人確認）；現役只有作廢按鈕。
- **錯在邊**：用 `PAYMENT_RECEIPT_VOID_POLICY`／說明書「不可修改已確認單、出錯請作廢」擋新頁，或當產品已定死。
- **正確做法**：現役能力同新定案分開寫；缺口列入 [`backlog/payment-entitlement-correction-ui.md`](backlog/payment-entitlement-correction-ui.md)；舊文加「待同步」橫額。禁硬刪仍有效。
- **若已升格**：未升格（新頁未做；舊文已標更新中）

### 2026-08-04 — 大改點名資格先落地基再接事件
- **情境**：報讀包裝／點名權益（池＋宣告）；現役暑期須維持舊路徑，正規學年即將開口報讀。
- **錯在邊**：若 Wave 1 一次捆綁取消／補堂／扣堂／全入口，難驗、易濺現役學年；亦難分「地基錯」定「流程錯」。
- **正確做法**：先 schema＋學年硬閘＋報讀鑄池／自動宣告＋shadow；再開事件寫宣告與消耗。開口前最低營運包另列（改期跟名＋後加排程入紙），唔同手動加名／暑期切換捆綁。
- **若已升格**：未升格（見計劃 `docs/product/plans/2026-08-04-enrollment-entitlement-roster.md` §3／§8）

### 2026-08-04 — remint 權益池前先刪宣告
- **情境**：`attendance_declarations.pool_id` references pools `ON DELETE restrict`。
- **錯在邊**：只把宣告 `void` 再 `delete` pool → FK 失敗。
- **正確做法**：改包裝重鑄時先 `delete` 該 pool 下宣告（或改 in-place update），再刪／重建池。
- **若已升格**：未升格
