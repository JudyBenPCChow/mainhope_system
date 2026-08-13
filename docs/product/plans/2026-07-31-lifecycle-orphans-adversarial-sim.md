# 生命週期孤兒 — 實作前對抗性模擬（不寫 code）

> 角色：實作前對抗性檢查（依定案方案逐步「假裝實作」找會炸的縫）  
> 對象：[`2026-07-31-lifecycle-orphans.md`](./2026-07-31-lifecycle-orphans.md)（含審閱 #01／#02 定案）  
> 日期：2026-07-31  
> 狀態：**供決策；未實作**

方法：假設階段 A（O1-audit → O1 → O1t → O6；O2 視 RPC）已按定案落地，用惡意／糊塗／並發操作戳洞。不重複顧問已閉環且方案已寫死的項，除非模擬暴露**定案未覆蓋**的缺口。

---

## 總評

定案足以擋住審閱 #01／#02 的主路徑（清／改調堂攔截、執行順序、audit 拋錯、試堂 lightweight）。  
對抗模擬後仍有 **1 個建議擋實作的 P0**、若干 P1 須寫進方案才准開工。

---

## 🔴 P0 — 建議寫進方案後才實作

### ADV-P0-1：Peers 展開會誤刪「取消請假後仍有應到資格」的出席

**定案**：O1 自 `makeup_schedule_id` 展開同 `consecutive_group_id` 全部 peers，刪該生在 peers 上的出席。

**對抗場景**：

1. 學生已報讀連堂班；某日正常應到兩節（enrollment）。
2. 另有一筆請假調堂，`makeup_schedule_id`＝該連堂**第 1 節**（補回自己班／同班另一時段等）。
3. 當天點名紙以報讀為準（enrollment 優先）；兩節都點了「現場」。
4. 行政取消該筆請假並選「一併刪」→ 掃描 peers → **兩節出席都進刪除清單**。
5. 取消後學生**仍有報讀應到**，但兩節計費出席被刪 → 已上堂數少算、真上課紀錄沒了。

**根因**：Peers 展開假設「該生在 peer 上的出席＝補堂誤寫」，未問「清調堂／刪請假之後，該生是否仍有應到資格（報讀／試堂／其他補堂）」。

**要求（定案補丁）**：

```
候選列 = attendance on peers(oldMakeupScheduleId) for this student
保留列 = 變更後仍 eligible 的 schedule（enrollment ∪ active trial ∪ other makeup）
可刪列 = 候選列 − 保留列
```

Confirm 只列「可刪列」。若可刪為空但 leave 仍要清／刪 → 不刪出席，只改 leave（可提示「出席因仍有報讀／試堂而保留」）。

**未補此規則前，不建議開工 O1 peers 刪除。**

---

## 🟠 P1 — 實作規範必須寫死

### ADV-P1-1：多筆刪除的部分成功

順序：audit → 刪 att₁ → 刪 att₂ 失敗 → leave 未改。

- att₁ 已刪、leave 仍掛舊 makeup → 名冊可能又出現該生，點名可再寫回。
- 重試：掃描可能只剩 att₂；須 **idempotent**（列已不存在＝該筆成功），不可因「0 rows deleted」當失敗中止後又重複 audit 污染。

**規範**：逐筆刪除；`DELETE … WHERE id=?` 找不到列 → 視為已清理；整批結束後再改 leave。Audit 宜「意圖刪除清單」+ 每筆結果，或一筆 audit 含全部 id 與成敗。

### ADV-P1-2：Audit 成功＋出席刪光＋leave 更新失敗

Leave 仍指向已無出席的 makeup；名冊仍有補堂生。  
再度掃描 orphanCount=0 → 可無 Confirm 清調堂（OK）。  
但 audit 已寫「因取消請假刪出席」而請假還在 → 稽核語意偏假。

**規範**：leave 步驟失敗 → 表面錯誤「出席已刪、請假未改，請重試清調堂／刪請假」；禁止靜默當成功。可選：leave 失敗時不視為整單成功（UI 紅字）。

### ADV-P1-3：樂觀鎖 `updated_at` 比對格式

掃描拿到的 timestamptz 與 `.eq('updated_at', snap)` 字串精度（ms／offset）不一致 → 誤判衝突或漏判。

**規範**：樂觀鎖用 `id` + `status` + DB 回傳之 `updated_at` **原字串**；或 `UPDATE … WHERE id=? AND status=? AND updated_at=?` 看 `count`；禁止 JS `new Date` 再 format 後比對。

### ADV-P1-4：Confirm 文案對非計費狀態嚇過火

Makeup 日若點成「事假／病假」（不扣堂），文案仍寫「影響已上堂數」→ 行政不敢刪或亂選保留。

**規範**：清單標是否 `isBillableAttendanceStatus`；僅當存在計費列時強調已上堂數。

### ADV-P1-5：O1t 強制刪出席、無法「取消試堂但保留上課事實」

定案：試堂有出席則單一 Confirm 一併刪（無保留路）。  
對抗：試堂生已上課且已轉正／對帳，行政只想取消錯誤「已預約」狀態列 → **做不到又不刪出席**。

**風險接受或補丁**：Accept 寫進方案；或 O1t 改回兩路（一併刪／只改試堂狀態）。建議：**Accept**（與審閱 #01 一致），文件寫明「要留出席就不要取消／刪該試堂列」。

### ADV-P1-6：點名紙寫回（模擬 9）階段 A 未關門

A 開點名含補堂生、B 一併刪出席、A 再存 → upsert 寫回。

**最低門檻（建議階段 A 搭車）**：`confirmRollCall` 存檔前重拉名冊，或只 upsert server 名冊內學生。未做則寫進「已知限制／必測」，但對抗上這是上線後高概率洞。

### ADV-P1-7：`setLeaveTuitionDisposition`／只改 `makeup_type` 的旁路

列表改學費處理、`setLeaveTuitionDisposition` 可改 `makeup_type` 而不清 `makeup_schedule_id`（現況）。  
O1 矩陣只管 `makeup_schedule_id` patch → 可能出現「類型已非調堂、宿主仍掛」的髒狀態（未必立刻產計費孤兒，但名冊仍有補堂）。

**規範**：凡令「不再是有效調堂」的路徑（含 disposition／type 改離「調堂」）須等同 `next makeup_schedule_id = null` 走掃描矩陣；或强制同時清 schedule／date。

### ADV-P1-8：硬刪排程與 leave FK

`leave_makeup_records.makeup_schedule_id` 與 `attendance_details.schedule_id` 皆 **ON DELETE SET NULL**。  
階段 A 未擋硬刪 → 一鍵製造 O5 才處理的脫鉤列（已知限制）。  

**建議**：階段 A 文件／O6 加「勿硬刪已點名排程；應軟取消」。O3 前不開新硬刪入口也不加強擋則維持 Accept。

---

## 🟡 P2 — 實作時注意即可

| ID | 場景 | 建議 |
| --- | --- | --- |
| ADV-P2-1 | 連堂兩筆請假各綁一節，刪一筆只清一節 | 正確；Confirm 勿暗示「整組請假」 |
| ADV-P2-2 | 精靈一次擋 10 人，訊息含姓名+id | 已定案；UI 需可複製／換行 |
| ADV-P2-3 | 保留出席至 O0 前不可見 | 已 Accept；O6 訓練句要毒 |
| ADV-P2-4 | 樂觀鎖重掃導致 Confirm 疲勞 | 文案顯示「狀態已變，請再確認」 |
| ADV-P2-5 | 暫存 patch 與定案不一致（無 eligibility 過濾） | **禁止**直接 cherry-pick `wip/lifecycle-orphans-impl`／`.parked` 當完工 |
| ADV-P2-6 | O2 未開時林藝涵只能 SQL | 操作手冊放標準 SELECT；年份勿寫死 |

---

## 模擬劇本（ verd：Pass／Fail／Accept）

| # | 劇本 | 期望 | 結果判定 |
| --- | --- | --- | --- |
| S1 | 林藝涵：刪已點名補堂＋一併刪 | 請假與補堂出席皆無；已上堂數回退 | Pass（定案覆蓋） |
| S2 | 改綁調堂日，舊宿主已點、新未點 | Confirm 刪舊；新無列 | Pass |
| S3 | 只改 status「待補課→已完成」 | 不掃出席 | Pass（矩陣） |
| S4 | 清調堂但學生當日仍有報讀連堂出席 | **不可**刪仍應到的出席 | **Fail 除非 ADV-P0-1 補丁** |
| S5 | 一併刪兩節，第二節 RLS／網路失敗 | leave 仍在；可重試；第一節不重複炸 | 需 ADV-P1-1 |
| S6 | Confirm 期間老師改「事假→現場」 | 樂觀鎖擋下重 Confirm | Pass（定案） |
| S7 | 取消試堂已點名 | 只能一併刪 | Accept（ADV-P1-5） |
| S8 | 試堂改期，舊堂有出席 | 同序刪舊（peers） | Pass（#02） |
| S9 | 並發點名寫回 | 可能復活出席 | Fail／Accept：建議 A 搭車修 |
| S10 | 硬刪已點名排程 | schedule_id NULL 孤兒 | Accept 至 O5 |
| S11 | Audit insert 失敗 | 不刪出席、不改 leave | Pass（O1-audit） |
| S12 | 老師精靈遇已點名補堂 | 失敗＋姓名＋leave id | Pass |

---

## 階段 A 建議開工清單（對抗後）

1. **先改方案**：寫入 ADV-P0-1（eligibility 過濾可刪列）。  
2. 寫入 ADV-P1-1～P1-4、P1-7 為實作規範。  
3. ADV-P1-5／P1-8：Accept 聲明。  
4. ADV-P1-6：二選一——階段 A 修點名寫回，或標「已知高風險、必測」。  
5. **O1-audit → O1（含 P0-1）→ O1t → O6**；O2 仍等 RPC。  
6. **不要**直接套用 `docs/product/plans/patches/*.parked`／`wip/lifecycle-orphans-impl` 當完成品。

---

## 結論

| 問題 | 答案 |
| --- | --- |
| 現在可以開工實作嗎？ | **先補 ADV-P0-1 進方案**；否則 peers 刪除有誤傷真上課風險 |
| 顧問 #01／#02 是否足夠？ | 主路徑夠；對抗多挖出「資格感知刪除」與部分成功／文案／旁路 |
| 仍不實作 code？ | 是——本檔只模擬與檢查 |

待你確認 ADV-P0-1 與 P1-6 取捨後，再進入實作。
