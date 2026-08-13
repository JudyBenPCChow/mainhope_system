# 學費—權益—交付—請假—扣堂 營運閉環

> 日期：2026-08-04  
> 狀態：**draft**（對抗審查已寫入 §11；**§12 修稿閘未過前禁止 Phase A**；§4 產品簽核後先改 `open`）  
> 性質：目標架構＋分期計劃；**承接**報讀包裝與點名權益，**擴**至交費↔池  
> 標題注意：對外／對行政勿稱「閉環 Done」直至 §10＋§12 全過；未過前本波次正式名稱建議用「**支付增額波次**」  
> 前置：[報讀權益池＋到課宣告](./2026-08-04-enrollment-entitlement-roster.md)（Wave 1 ✅；Wave 2–4 進行中）  
> Backlog 母題：[summer-enrollment-roster-consistency.md](../backlog/summer-enrollment-roster-consistency.md)  
> As-built 斷層：Cursor Canvas `tuition-schedule-leave-billing-asbuilt.canvas.tsx`（2026-08-04 工程流）  
> 對抗：2026-08-04 三角度（產品／前線、技術／資料、範圍／會計治理）——見 §11

---

## 0. 目標一句

前線直覺：

> 交咗 N 堂錢 → 系統有 N 堂權益 → 排程／補回有應到宣告 → 請假改交付唔偷扣 → 點名計費扣權益；改假則返還。

本計劃要令以上鏈變成**實線事件流**（營運閉環）。  
**不**等於把七本帳併成一本，亦**不**自動完成會計收入認列（見 §6）。

---

## 1. 與現行權益計劃的關係

| 層 | 誰負責 | 狀態 |
| --- | --- | --- |
| 權益池＋到課宣告＋點名消耗／返還 | 母題 Wave 1–4 | Wave 1 完；Wave 2 下一波 |
| **支付／收據堂數 → 鑄池／增額／對帳閘** | **本計劃 Phase A** | 母題明確押後 |
| 請假事件 ↔ 宣告／消耗政策寫死 | 本計劃 Phase B（產品句＋實作） | 母題 Wave 2 有鉤；政策未鎖 |
| 統一對帳視圖（已付／池餘／已宣告／已消耗） | 本計劃 Phase C | 未做 |
| 取消堂／退費／月費處置與池一致 | 本計劃 Phase D | 未做；需產品句 |
| 收入認列／預收轉已賺 | **另案會計** | 本計劃不開工 |
| `26SM` 切正式路徑 | 母題 Wave 4 ＋本計劃回歸 | 不強制本輪 |

**開工順序硬約束：** 母題 Wave 2（事件宣告＋消耗／返還＋入口收斂）未達出門檻前，**唔好**開 Phase A 改支付寫入口徑——否則池會被收據同排程兩源同時抬高而失控。

---

## 2. 目標閉環（實線）

```text
報讀（命名空間／包裝）
  └─ 鑄空池或目標池（package + class + year + enrollment）

收款確認（payment_details.lesson_count 或月費 chargeable）
  └─ entitlement_top_up / mint   ← Phase A（新實線）
       └─ remaining_lessons ↑；稽核綁 payment_detail_id（可選）

排程存在／新增／全班補回／個別調堂
  └─ attendance_declaration (active, pool_id)   ← 母題 Wave 2

請假（leave_makeup_records）
  └─ 宣告 void 或保留＋預填；調堂 → 新宣告繼承 pool   ← Phase B 政策鎖死

點名 saveAttendance（billable）
  └─ entitlement_consumed；remaining ↓   ← 母題 Wave 2

改點名（billable → 非計費）／清不應存在列
  └─ entitlement_reinstated；remaining ↑   ← 母題 Wave 2
```

虛線保留（刻意）：

- 月費應收列 ↔ 池：可對帳，**唔**用月費列當點名資格  
- `tuition_credit_entries`：繼續係**錢／下月抵扣**，唔係可上課次池（除非 Phase D 另定「結餘轉池」產品）  
- `student_pending_lessons`：營運債；入池須顯式「清欠→top_up」事件，禁止靜默當座位  

---

## 3. 閉環後各帳職責（仍分本，但有事件橋）

| 帳 | 答 | 閉環後 |
| --- | --- | --- |
| 收款 | 收咗幾多錢／收據堂數 | 確認收款時可觸發 **top_up** |
| 權益池 | 仲剩幾堂、邊個包裝 | **唯一**「可上課次」真帳 |
| 到課宣告 | 今堂點名紙應有邊個 | **唯一**正式名單來源（gated 學年） |
| 請假事件 | 邊日請、點安排、學費處置 | 改宣告；disposition 只動錢，唔直接改池（除非 Phase D） |
| 點名結果 | 今次交付結果 | 驅動消耗／返還 |
| 月費應收 | 某月應收 | 繼續算錢；與池對帳報表，唔驅動名單 |
| 轉結餘 | 可抵下月金額 | 維持金額帳；轉池另議 |
| 排程 | 邊日交付 | 觸發補宣告／void；唔當權益 |

---

## 4. 必須先拍板的產品句（寫進本檔後先開工）

### 4.1 池堂數來源優先序（Phase A 核心）

當「報讀鑄池（跟排程目標）」同「收據 lesson_count」不一致時：

| 選項 | 含義 | 取捨 |
| --- | --- | --- |
| **P1 收據為增額真源** | 報讀只建命名空間／0 或下限；**已收款 lesson_count 加總**決定可消耗上限；排程只觸發宣告，唔自動抬 `initial` | 最貼「交 N 堂」；提早繳費唔會因未排程而無池；超賣排程要靠「無餘額拒宣告」 |
| **P2 排程目標為鑄造真源** | 維持母題 Wave 1；支付只做對帳告警，唔改池 | 閉環唔完整；回頭原點 |
| **P3 雙約束** | `remaining` 可宣告上限 = min(排程未消耗宣告需求, 已付未消耗) | 最嚴；實作同 UX 最重 |

**建議預設：P1**（閉環定義所需）——**須產品書面簽核**；未簽核前唔可當開工默認（對抗：翻案母題「支付後增額屬後續／不改收款寫入」）。  
採 P1 時必須同步交貨（否則雙計，見 §11／§12）：

1. 停 gated 學年「按排程抬 `remaining`」（含母題 Wave 2 §8.1 抬池句）  
2. **存量 cutover 公式**（已 inflated 嘅 2627 池點 reset／對齊已付）  
3. **建 active 宣告前原子校驗／鎖定餘額**（收據真源唔等於可超賣宣告）

### 4.2 月費路徑點樣 top_up

| 選項 | 含義 |
| --- | --- |
| **M1** | `createMonthlyTuitionPayment` 成功且確認收款後，按該單 `lesson_count` top_up 對應班／年 `regular_full`（或當月包裝）池 |
| **M2** | 月費只寫 charge／receipt；另跑「月結對帳工作」批次 top_up |
| **M3** | 月費唔入池；只有人手收據 top_up（正規月費生閉環缺口） |

**建議：M1**（同收款確認同一事務邊界；失敗要可重試／冪等）——須簽核。  
對抗補句：遲交罰款 `$50`、partial pay、贈堂、試堂轉正嘅 `lesson_count`／入邊個池，**另行列產品句**，唔可默認「收據字面＝銷售承諾」。

### 4.3 請假日宣告（承接母題未鎖項）

沿用先前決策題：**B 保留＋預填**／**A void**／**C 按安排分支**。  
閉環要求：無論邊個，**消耗只跟點名 status**，請假單本身唔扣池。

### 4.4 返還與 `valid_to`

建議：**只返還餘額、唔自動延期**；過期池返還後不可自動再宣告（要人手／例外）。

### 4.5 取消堂對錢（Phase D，可後於 A–C）

| 選項 | 含義 |
| --- | --- |
| **X1** | 只 void 宣告、唔退款、唔改月費（現行精神） |
| **X2** | 行政可選：退款／轉結餘／留池待補回 |
| **X3** | 系統自動轉結餘 |

**建議先 X1＋X2 手動**；禁止自動改收據。

### 4.6 「結餘／減收」要唔要動池

| 選項 | 含義 |
| --- | --- |
| **C1** | disposition 只動月費／credit；池不變（補回先消耗） |
| **C2** | 「減收／轉結餘」同時 `remaining--` 或凍結（視為放棄該堂權益） |
| **C3** | 轉結餘可兌換成**下月池 top_up**（金額→堂數） |

**建議須產品顯式揀**（對抗強烈質疑 C1）：

- 若選 **C1**：文件同 UI 必須講明「減收／轉結餘＝錢帳，**唔等於**放棄可上課次」；Phase C 對帳**必須**顯示 disposition／credit，禁止只比已付−top_up 就綠燈。對外**禁止**用「交 N 堂＝嚟 N 堂」掩蓋 C1。  
- 若要前線口號成立：傾向 **C2** 或限期開 **C3**（須有主人，禁止「另開無期」）。

---

## 5. 分期（Phases）

### Phase 0 — 前置（母題，唔算本計劃工時但係閘）

- [ ] 母題 Wave 2 出門檻（宣告事件＋消耗／返還＋入口收斂＋`2627` 驗證）  
- [ ] 鎖 §4.1–4.4 產品句並回寫母題 backlog  
- [ ] `26SM` 抽樣回歸（母題 Wave 1 未勾項）

**出口：** `2627` 上「有池、有宣告、點名會扣／還」；支付仍未抬池。

### Phase A — 支付 → 權益（閉環左半）

**目標：** 已確認收款嘅 `lesson_count` 成為池可消耗額度嘅權威增額來源（P1）。

| 項 | 做法 |
| --- | --- |
| 事件 | **新 reason／新表**（對抗：現行 `entitlement_consumption_events` CHECK 僅 `consumed`／`reinstated`，不可「reuse + payment」蒙混） |
| 觸發 | 統一 RPC／服務：`markPaymentReceived`、`insertPaymentRecord(已收款)`、`createMonthlyTuitionPayment` **同一邊界**寫收據＋top_up；半成功須可偵測＋可重跑 |
| 冪等 | `UNIQUE(payment_detail_id, event_type)`（或同等）；同一明細只 top_up 一次 |
| 作廢 | void 與 clawback **同邊界**（Edge／RPC 對稱）；未消耗全額 clawback；**部分已消耗**須寫死：拒整單作廢 **或** 只 clawback 未消耗部分＋工單（二選一，簽核） |
| 命名空間 | 解析優先序寫死（active enrollment → charge 月 → 明細）；推唔到 → **拒 top_up 且拒建／維持無 active 宣告**，唔入錯池 |
| 報讀鑄池 | 骨架語意拍板：`remaining=0` 直至 top_up，**或** `max(骨架,已付)` 擇一；禁止同 Wave1 排程滿池並存 |
| 存量 | cutover：已存在 2627 池點樣對齊已付（reset／扣虛增／只認事件）——§12 必交 |
| remint | 改包裝**禁止**硬刪已有支付事件嘅池；改 void＋轉移／重掛事件（對抗：`remintPoolAfterPeriodChange`） |
| 新增排程 | **唔**再 `remaining++`；建宣告前 **原子** 查／鎖餘額 |
| UI | 收款成功提示「已增加 N 堂權益」；學生／班詳情可見池餘 |

**不做：** 改 `payment_details` 強制 FK 到 pool（可加可空 `entitlement_pool_id` 方便稽核，非必須第一刀）。

**出口：**

- [ ] 新收款（含月費 M1）→ 池 `remaining` 增加且可重跑冪等（三入口皆測）  
- [ ] 作廢路徑與 clawback 對稱（含部分消耗用例）  
- [ ] 無餘額唔能對 `2627` 建 active 宣告（DB／服務層，唔只 UI）  
- [ ] cutover 後：`sum(top_up)-sum(consumed)+已解釋調整 = remaining`  
- [ ] 改包裝 remint 唔蒸發已付稽核

### Phase B — 請假／補回與宣告政策收口

**目標：** 請假唔再係「只預填」外掛；同宣告生命週期一致（仍保留 leave 表為事件源）。

| 項 | 做法 |
| --- | --- |
| 政策 | 套用 §4.3 選定項；回寫母題 §3.7／Wave 2 |
| 調堂 | `makeup_schedule_id` 寫入時必建／確保宣告繼承 `pool_id` |
| 取消請假／清調堂 | void 補回宣告＋既有出席 Confirm；返還跟點名規則 |
| 入口 | 所有「誰應到」唔再依賴 leave guest 作為唯一手段（guest 可作過渡，宣告為準） |

**出口：** 請假→調堂→點名扣池 一條路徑無雙扣；取消請假無孤兒計費。

### Phase C — 營運對帳面（閉環可觀察）

**目標：** 行政一眼見到四個數對唔對。

| 面板（建議學生×班×學年） | 欄 |
| --- | --- |
| 已付堂 | Σ payment_details.lesson_count（非作廢） |
| 已 top_up | Σ 池增額事件 |
| 已消耗 | Σ entitlement_consumed |
| 池剩餘 | remaining |
| 未點名宣告 | active declarations 數 |
| 錢處置 | 相關 leave disposition／未用 credit（對抗：C1 必須可見） |
| 差異 | 已付 − top_up；top_up −（消耗＋剩餘）；**已解釋例外清單有上限** |

入口建議：學生詳情／班別財務區／獨立「權益對帳」頁（角色：admin／manager／alien）。櫃檯若仍用「已付≤已上」須標「非權益真帳」。

**出口：** 約定抽樣範圍（唔止一班）差異＝0 或例外≤上限且每筆有 reason；見 §10。

### Phase D — 取消堂／學費處置與池（可選加固）

- 取消堂：§4.5 X1／X2  
- disposition：§4.6 維持 C1 或升級  
- `pending_lessons` → 顯式「清欠轉 top_up」工具  

**出口：** 文件化 runbook；無自動退款。

### Phase E — 會計閉環（明確另案；本檔只留位）

- 預收／已消課收入認列  
- 與 `entitlement_consumed` 對照但**分開事件名**  
- **須有負責人＋口徑文件**；未定前禁止開工  
- 防詮釋漂移：Phase C／報表文案禁用「已賺／認列」指消耗；CODEOWNERS 或 review checklist 擋 `revenue_*` 欄名 sneak-in  

---

## 6. 明確不做（本閉環計劃）

- 收入認列欄位／`revenue_*` 事件名  
- 欠費門禁系統化  
- 計糧改讀池（可讀宣告作出勤，但唔反向定義權益）  
- 原班連堂分節點名、連堂請假預設 UX（另題）  
- 一次切 `26SM`（跟母題 Wave 4）  
- 全量 `db push`；migration 單檔套用  
- 在 §12 修稿閘未過時開工 Phase A／改支付寫入  

---

## 7. 風險與防護

| ID | 風險 | 防護 |
| --- | --- | --- |
| L1 | 排程抬池＋收據抬池雙計 | 停排程抬＋§12 cutover；feature flag／硬閘防半部署 |
| L2 | 作廢收據但已消耗／部分消耗 | 拒整單或 partial clawback 寫死；void≡clawback 同 RPC |
| L3 | 明細唔知入邊個池 | 解析序＋拒 top_up／拒宣告；唔默認最大池 |
| L4 | 月費 lesson_count 同宣告偏離 | Phase C；原子拒超賣宣告 |
| L5 | disposition 誤當扣池／C1 假閉環 | 簽核 C1 或 C2；對帳含 credit；UI 文案 |
| L6 | 母題未完就改支付 | Phase 0＋§12；計劃狀態 draft 禁 A |
| L7 | 事件 CHECK／無冪等鍵 | 新 schema＋UNIQUE；禁 reuse 蒙混 |
| L8 | remint 硬刪蒸發已付 | 禁止 DELETE 有支付事件嘅池 |
| L9 | 三入口半成功 | 統一邊界；半成功可偵測重跑 |
| L10 | §10 被抽樣／例外遊戲 | 抽樣範圍＋例外上限；全收款路徑測冪等 |
| L11 | 標題誇大／雙計劃真相 | 未過閘稱「支付增額」；BACKLOG 一列 |
| L12 | 消耗被當收入 | Phase E owner＋文案禁則 |

---

## 8. 建議回寫／索引（拍板後）

1. 本檔狀態 → `open`（僅當 §4 字母已填＋§12 勾完可開工項）。  
2. 母題 backlog／計劃：刪或改「支付後增額無期後續」；Wave 2 §8.1 抬池句與 P1 對齊。  
3. `docs/product/BACKLOG.md`：**必須揀**「獨立一列」或「併入母題」——禁止長期雙真相。  
4. As-built Canvas 可加「目標實線／對抗紅線」頁（可選）。  

---

## 9. 建議決策回覆格式（方便改稿）

```text
4.1 池來源：P1（或 P2／P3）— 簽核人／日期：
4.2 月費：M1（或 M2／M3）
4.3 請假宣告：B（或 A / C…）
4.4 valid_to：只返還不延期
4.5 取消堂：X1+X2
4.6 結餘／減收：C1 或 C2 或 C3（若 C1：確認對帳必顯示 disposition）
作廢部分消耗：拒整單 / partial clawback
骨架 remaining：0 直至 top_up / max(骨架,已付)
BACKLOG：獨立一列 / 併入母題
Phase 0 後先做 A→B→C；D 另排
```

---

## 10. 成功定義（支付增額／營運鏈 Done）

**同時成立**先可對內稱本波次完成；**對外慎用「營運閉環」**（見文首）：

1. `2627`：**已確認收據堂數** ↔ **池 top_up** 可對帳；三收款入口冪等；作廢／clawback 對稱（含部分消耗用例）。  
2. 有餘額先可以有 active 宣告（**服務／DB 層強制**）；補回／改期唔靠日期推期數。  
3. 點名計費扣池、改非計費返還；請假本身唔偷扣。  
4. 行政對帳屏含：已付／top_up／消耗／剩餘／未點名宣告／**disposition·credit**；約定抽樣範圍內差異＝0 或例外≤上限。  
5. 文件＋UI 寫明消耗 ≠ 收入；無 `revenue_*` sneak-in。  
6. §4 產品字母已簽；§12 修稿閘已勾。  

**唔算 Done：** 只一班綠燈、例外無上限、C1 未上對帳、母題 Wave 2 未出、cutover 未跑、仍稱「排程抬池＋收據抬池」雙源。

---

## 11. 對抗性檢查（2026-08-04）

三角度並行審查；以下為合併結論。狀態：已吸納入 §4／Phase A／§7／§10／§12；**發現仍有效直至修稿閘勾完**。

### 11.1 總判

計劃「要有支付→池實線」方向成立，但**以原稿狀態開工有高風險**。三面共識：

1. P1 與母題 Wave 1／2「排程抬池」未解 → 雙計或錯基線  
2. C1 令「交 N 堂」口號與錢處置永久不一致  
3. 「營運閉環 Done」定義過寬、可被遊戲  

### 11.2 產品／前線

**致命／高**

- 月費 M1 假設收據堂數＝可上堂；`lesson_count` 填錯、遲交費 `$50`、先 charge 後收據 → 池少堂、缺名、前線怪系統  
- 作廢 vs 已點名：拒作廢逼 workaround → money≠lessons 日常化  
- C1：減收／轉結餘前線話「呢堂唔計」但池仍可上 → 三本數（credit／池／點名）解釋唔到  
- P1 與母題 Wave 2「加排程抬池」敘事打架 → 開學加堂週必爆  
- 試堂轉正、贈堂、partial pay：top_up 規則空白  

**中**

- 提早繳費：有池仍要控「本月唔上紙」——閉環≠自動出現  
- 取消堂／「請假而不需補回」扣池：UI 未教易 double pain  
- Phase C 只服 admin；WhatsApp／手動加名未收斂前繼續改紙  
- 2627／26SM 雙路徑訓練成本被低估  

**低**

- `valid_to` 過期有餘額用不了；連堂 2 堂口頭易錯；pending 與池兩本債；prod 零 2627 就讀時抽樣＝空轉  

**直接質疑：** P1 把最唔可靠輸入（收據堂數）升格真源，卻無同級產品句；C1＋「交 N 堂」標語互相打臉；§10 排除太多仍可對外講完成。

### 11.3 技術／資料完整性

**致命／高**

- Wave1 已按排程 inflate `remaining`；無 cutover 公式即 Phase A 再 top_up → 超已付  
- 事件 CHECK 不容 top_up／clawback；無 `payment_detail_id` 唯一鍵 → 重試雙計  
- 三收款入口無統一事務 → 已收款、池未增永久漂移  
- `payment_details` 缺 package／enrollment；多報讀錯池；報讀建池失敗只 `console.warn`  
- `remintPoolAfterPeriodChange` 硬刪池 → 已付稽核蒸發  
- 宣告不查餘額／無 FOR UPDATE → 超賣；連堂單位 vs `lesson_count` 未對齊  
- 部分消耗後 clawback 未定義；void Edge vs 前端 top_up 可不對稱  

**中**

- 骨架「0 或下限」vs `max(骨架,已付)` 未拍板  
- leave disposition 唔碰宣告；C1＋M1 可能「錢用結餘、池仍加堂」  
- Phase C 式：`initial` 語意、adjustments 來源不清  
- RLS 可手改 remaining；過期池 reinstated 後可否再宣告未定  

**低**

- Phase 0 無 schema feature flag；pending→top_up 押後變第二增額源；Wave2 消耗未上就開 A → 池只增不減對帳失真  

**直接質疑：** 無存量遷移＋remint 策略＝首日雙計；事件／冪等／void 未落 schema；宣告不受餘額約束則「收據真源」資料面不成立。

### 11.4 範圍／會計邊界／治理

**致命／高**

- 「營運閉環」標題大於實際出口（半鏈＋C1）→ 假閉環背書  
- 母題「不改收款寫入／支付增額後續」被本檔 P1／M1 建議預設默認翻案，無簽核欄  
- C1 制度化 money≠lessons；Phase C 若不含 disposition 會綠燈  
- Phase E 無 owner；詮釋漂移（消耗當收入）紙盾擋唔住  

**中**

- Phase 0 閘靠願望（文件狀態／CODEOWNERS）非機制  
- BACKLOG 併／拆未揀 → 雙計劃雙真相  
- §10 可被「一班＋例外」遊戲  

**低**

- Phase B 收母題未鎖請假句可能拖垮「先 A」敘事  
- Phase D pending→top_up 再打 P1「收據唯一真源」  
- 標題七環、Done 可不含 D／E → 廣告＞契約  

**直接質疑：** draft 已寫成開工路徑＝範圍越權；C1＋E 留位下稱閉環係兩邊討好；§10 應改成無簽核／無 disposition 政策／無全路徑冪等＝**禁止 Done**。

### 11.5 跨角度共識（修稿優先序）

| # | 問題 | 處置落點 |
| --- | --- | --- |
| 1 | 雙源抬池＋無 cutover | §4.1、§12、母題 Wave2 對齊 |
| 2 | P1／M1 未簽核當預設 | §4 簽核欄、§9、文首降名 |
| 3 | C1 假閉環 | §4.6、Phase C、§10 |
| 4 | 宣告唔原子受餘額約束 | Phase A、§12 |
| 5 | §10／標題可遊戲 | §10、文首、§12 |

---

## 12. 修稿閘（未過禁止 Phase A）

開工 Phase A／改任何支付寫入前，下列全部勾選：

- [ ] **§4 產品字母已填＋簽核人／日期**（含 4.1–4.6；作廢部分消耗；骨架 remaining）  
- [ ] **BACKLOG 一列真相**（獨立或併入母題已揀；母題「支付增額無期後續」已改）  
- [ ] **母題 Wave 2 出門檻**（宣告事件＋消耗／返還＋入口；`26SM` 抽樣）  
- [ ] **停 gated 排程抬 `remaining`**（含計劃／程式與 Wave 2 §8.1 對齊）  
- [ ] **Cutover 書面公式＋驗收 SQL**（既有 2627 池 vs 已付）  
- [ ] **事件 schema**：top_up／clawback（或新表）、CHECK、`UNIQUE(payment_detail_id, event_type)`  
- [ ] **三收款入口同一事務邊界**＋半成功重跑策略  
- [ ] **命名空間解析序**＋推唔到則拒 top_up／拒 active 宣告  
- [ ] **建宣告原子餘額約束**（服務或 DB）  
- [ ] **remint**：禁止硬刪有支付事件嘅池  
- [ ] **void≡clawback 同邊界**；部分消耗策略已選  
- [ ] **若選 C1**：對帳必含 disposition／credit；UI 禁用誤導「交 N＝嚟 N」掩蓋錢處置  
- [ ] **§10 抽樣範圍＋例外上限**已寫死數字／規則  
- [ ] **Phase E**：負責人姓名或「明確無負責人故禁用收入詮釋」寫入  

未全勾：本檔維持 `draft`；工程只可繼續母題 Wave 2–4，**不可**稱支付閉環開工。