# 非常規排程（加堂／混合補堂）


| 欄位 | 值 |
| --- | --- |
| 狀態 | `open`（只討論、未開工實作） |
| 優先 | 中 |
| 範圍 | 唔入常規「報讀 → 逢星期排程 → 點名紙」嘅排程／上紙個案：偶發加堂、唔屬任何原班嘅混合補堂、以及其後再收嘅同類奇怪格 |
| 不含 | 常規報讀上紙；班加一格逢星期／加堂排程（`is_extra_lesson`，已報讀生自動上紙）；試堂出單上紙；請假**調堂**掛入另一班現有堂；手動加名上紙（權益 P6 **已取消**） |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 立案 | 2026-08-24：由點名紙入場路徑討論拆出 |
| 政策 | [`ATTENDANCE_BILLING.md`](../../policies/attendance/ATTENDANCE_BILLING.md)；[`TRIAL_RECEIPT_BEFORE_ROSTER.md`](../../policies/enrollment/TRIAL_RECEIPT_BEFORE_ROSTER.md) |


---

## 開工閘（agent 必讀）

**討論可即開。** 未拍板前**唔好**改 schema、點名紙入場。手動加名（舊 P6）已取消，唔好當救場入口重開。

| 本波 | 對上一個工程 | 完成條件 |
| --- | --- | --- |
| 收個案＋拍板做／唔做／用現有路徑 | 無擋 | 每條個案有產品句 |
| 實作 | 上表拍板 | 另寫 `plans/`；唔喺權益母題夾做 |

權益母題 [`summer-enrollment-roster-consistency.md`](./summer-enrollment-roster-consistency.md) 仍 `in_progress`（P6 已取消；餘 `26SM`）。本題**唔等**佢關帳先討論。


## 結論（現況，未拍板新路徑）

`2627` 點名紙正規入場只有：報讀宣告、已確認收款試堂、請假調堂掛入**某班已有排程**。加排程唔加已繳堂數。

而家**沒有**「未報讀、偶然讀一次」專用入口，亦**沒有**「一格唔屬於任何原班、專門收齊多班請假生」嘅混合補堂。調堂永遠掛去 host 班現有堂。


## 1. 已有路徑（唔好重造）

| 情況 | 而家做法 | 備註 |
| --- | --- | --- |
| 班多開一格（全班加堂） | 該班加排程，可標 `is_extra_lesson` | 已報讀生自動上紙；唔抬池 |
| 已就讀、指定多上一堂 | 權益簡報「加堂則指定學生」＝**已就讀生**上該班某堂紙 | 例子：已報數學，數學加一堂 |
| 只讀指定堂、仍係報讀 | **單堂報讀** | 正式入口 |
| 未報讀、試一次 | **試堂**：出單確認先上紙 | 定位試，唔係舊生走堂 |
| 請假後坐入另一班某堂 | **調堂**：客人掛 host 排程 | 繼承原班池；連堂綁實際坐入嗰節 |
| 名單缺口、要救場上紙 | **無第四條**（P6 已取消） | 用單堂報讀或調堂；不准點名紙加名 |


## 2. 待討論個案

之後有同類奇怪格，加喺本節，唔散落權益／時間表題。

### 2.1 未報讀、偶然突發讀一次（加堂）

**情景：** 學生唔係呢班報讀生，亦唔係試堂、唔係請假調堂；偶然要上呢一堂一次。

**現況：** 正規只有開**單堂報讀**（再收款入池）。P6 已取消，冇第四條入場。

**待決：** 是否堅持單堂報讀；定另開「走堂一次」。**唔好**用手動加名救場。錢／池／人頭／老師點名紙分別點算。

### 2.2 混合補堂格（唔屬任何原班）

**情景：** 開一格時間＋房＋老師，**唔掛現有專科班**，專門收齊多班請假生一齊補。

**現況：** 模型永遠係請假調堂 → 掛去**某班現有排程**。計糧、連堂綁節、跨班扣錯 host 池，都係呢條假設。

**待決：** 要唔要「無班主」補堂排程；若要，班／課程／池／點名紙／計糧歸邊；同調堂點分。已知限制：跨班補堂掛 host 扣堂可能影響該班池（見 [tuition-late-fee-enforcement.md](./tuition-late-fee-enforcement.md)）。


## 3. 明確暫緩

- 未拍板前唔改 `schedules`／宣告／點名入場。
- 唔把本題當權益 P6（已取消）或 `2627` 時間表 4.1。
- 功輔不補堂（政策另定），唔混入本題。


## 相關

- 報讀／點名權益（P6、宣告、調堂掛 host）：[`summer-enrollment-roster-consistency.md`](./summer-enrollment-roster-consistency.md)
- 權益池簡報（加堂＝指定就讀生上紙）：[`entitlement-pool-per-student-briefing.md`](./entitlement-pool-per-student-briefing.md)
- `2627` 時間表（班格 `is_extra_lesson`）：[`2627-september-timetable.md`](./2627-september-timetable.md)
- 連堂補堂綁節：[`LEAVE_MAKEUP_CONSECUTIVE.md`](../../playbooks/frontdesk/LEAVE_MAKEUP_CONSECUTIVE.md)
- 逾期罰款已知限制（跨班補堂 vs host 池）：[`tuition-late-fee-enforcement.md`](./tuition-late-fee-enforcement.md)
