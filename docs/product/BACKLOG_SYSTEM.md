# Backlog 紀錄制度（可搬用說明）

給另一個專案／agent：套用同一套「工程 backlog」時讀本檔即可。  
本制度＝**純 Markdown、repo 內、面向工程與 agent**；不是產品看板（非 Jira／Linear）。

來源專案實作：`docs/product/BACKLOG.md`（索引）＋ `docs/product/topics/<topic>.md`（分題）。

**決策者工作習慣**（點樣用 backlog 拍板、何時先不實作）：見 [`BACKLOG_WORK_HABITS.md`](./BACKLOG_WORK_HABITS.md)。

---

## 1. 目標與原則

| 原則 | 說明 |
| --- | --- |
| 一索引、多分題 | 索引只放一句現況；長文、方案、邊界寫分題 |
| 未做／已做分表 | `open`／`in_progress` 與 `done`／`cancelled` **禁止混同一張表** |
| 一列一真相 | 同一主題長期只應有一條 backlog 列；唔好「母題＋獨立列」雙真相 |
| 步驟與稽核外置 | 實作步驟 → `plans/`；調查／對抗／模擬 → `audits/`；唔塞進索引 |
| Agent 讀檔階梯 | 問未做只掃 open 表；做主題先開分題；audits／已完成預設唔掃 |

**本檔不是待辦清單。** 待辦真相永遠在目標專案的 `BACKLOG.md`「進行中／未完成」表。

---

## 2. 目錄結構

```
docs/
  BACKLOG.md                 # 唯一索引（狀態總覽＋讀檔習慣＋維護約定）
  BACKLOG_SYSTEM.md          # 本說明（制度本身；可選保留）
  backlog/
    <topic>.md               # 分題詳情（kebab-case slug）
  plans/                     # 可選：現行實作／設計步驟
    YYYY-MM-DD-<slug>.md
  audits/                    # 可選：已完成調查（對抗、模擬、盤點）
    YYYY-MM-DD-<slug>.md
```

| 路徑 | 職責 | 何時讀 |
| --- | --- | --- |
| `docs/product/BACKLOG.md` | 工程主題目錄；狀態＋一句摘要 | 「有咩未做」／list backlog |
| `docs/product/topics/<topic>.md` | 範圍、結論、待決、進度、相關連結 | 做該主題時 |
| `docs/product/plans/…` | 現行實作步驟、設計稿、驗收 checklist | 僅 `in_progress` 且要跟步驟；**只開現行計劃** |
| `docs/product/audits/…` | 已完成調查結果 | 對對抗、查「點解咁決定」、或用戶點名 |
| 規範／營運／構想（各自檔） | 政策、UI 規範、`FUTURE_*.md` 等 | 索引用「想找…」表指過去；**唔當待辦列** |

---

## 3. 索引設計（`docs/product/BACKLOG.md`）

### 3.1 頁頂應有

1. **定位一句**：本檔＝工程主題目錄，不是產品看板，也不是 UI／營運規範正文。  
2. **「想找…」導航表**（可選但建議）：把規範、plans、audits、營運文件分開，避免 backlog 變雜物箱。  
3. **Agent 讀檔習慣**（建議原文級寫死，見 §6）。  
4. **維護約定**（見 §3.3）。

### 3.2 兩張表

#### 進行中／未完成（日常待辦真相）

| 狀態 | 優先 | 主題 | 摘要 | 詳情 |
| --- | --- | --- | --- | --- |
| `open` 或 `in_progress` | 高／中／低 | 短名 | **一句**現況（可含阻塞／餘項關鍵字） | 連 `backlog/<topic>.md`；可選再連 plan／audit／產物 |

#### 已完成／已取消（純備查）

同一欄位結構；狀態為 `done` 或 `cancelled`。  
表上註明：**唔係待辦**；完成日以分題檔為準。

### 3.3 維護約定（寫進索引）

- **新主題**：加一列到「進行中／未完成」＋（可選）`docs/product/topics/<topic>.md`
- **開始做**：狀態改 `in_progress`；若有實作計畫，連到 `docs/product/plans/…`
- **完成或取消**：狀態改 `done`／`cancelled`，**整列移到「已完成／已取消」表**（可留分題檔備查，勿默默刪）
- 本索引只放一句摘要；長表／方案放分題檔
- **唔好**把 `done`／`cancelled` 同未做完項混喺同一張表

### 3.4 狀態語意

| 狀態 | 意思 |
| --- | --- |
| `open` | 已立案、未開工（含 idea） |
| `in_progress` | 正在做；通常有現行 plan 或分題內「下一步」 |
| `done` | 本期範圍已收；餘項若另開主題則另列 |
| `cancelled` | 不做；保留分題說明原因（例：改走另一方案） |

---

## 4. 分題詳情（`docs/product/topics/<topic>.md`）

### 4.1 命名

- 檔名：`kebab-case` slug，對齊主題（例：`payroll-engine.md`、`mobile-ui.md`）
- 標題：人讀短名（可繁中）

### 4.2 開頭欄位表（建議固定）

```markdown
# <主題名>

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open`／`in_progress`／`done`／`cancelled`（可附完成日或一句現況） |
| 優先 | 高／中／低 |
| 範圍 | 本期做咩 |
| 不含 | 明確邊界，防 scope creep |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
```

常用可選欄：立案日、觸發、實作計劃、舊計劃（已取代）、相關路由、營運文件連結。

### 4.3 正文區塊（按需要，唔強制齊）

| 區塊 | 用途 |
| --- | --- |
| 結論 | 而家真相（一句到一段） |
| 待決 | 開工前要拍板 |
| 待做／下一步 | 摘要 checklist |
| 已完成／進度日誌 | 按日或按波次（`in_progress`／`done` 常用） |
| 既有產物 | 報告、docx、腳本等 |
| 相關 | 跨主題、政策、程式路徑 |

**短 idea**：結論＋待決＋待做即可。  
**大型主題**：分題掛現行 plan；舊 plan 標「已取代」；調查結果連 audits，唔複製全文進分題。

---

## 5. 與 plans／audits 的分層

| 層 | 寫咩 | 禁止 |
| --- | --- | --- |
| BACKLOG 列 | 一句現況＋連結 | 長表、完整方案、逐步 checklist |
| 分題 | 主題真相、邊界、餘項、決策摘要 | 把每次對抗全文貼入 |
| `plans/YYYY-MM-DD-…` | 步驟、設計、驗收 | 當永久「有咩未做」清單；舊 review 系列當現行步驟 |
| `audits/YYYY-MM-DD-…` | 調查／對抗／模擬結果 | 預設當待辦勾選 |

計劃檔命名建議：`YYYY-MM-DD-<slug>.md`。  
同一主題可有多份 plan；分題只指向**現行**那份，並註明舊份已取代。

---

## 6. Agent 讀檔階梯（建議寫進目標專案 AGENTS／索引）

原文級約定（可直接貼）：

1. 問「有咩未做」／list backlog → **只讀「進行中／未完成」表**（`open`／`in_progress`）；**停**；勿開分題、勿把已完成表當成待辦。  
2. 做某個主題 → 先開該列 `backlog/<topic>.md`；僅當 `in_progress` 且需要步驟時再開**現行** `plans/…`；唔開同主題舊 review／adversarial 系列。  
3. 「想找」表同 `audits/` 連結＝備查索引；預設唔開，除非對對抗結果、查「點解咁決定」、或使用者點名續做該波。  
4. 已完成／已取消表同其連結：備查用，日常任務唔掃。

目標專案的 `AGENTS.md`（或同等）可加一行：

> 問未做 → `docs/product/BACKLOG.md`「進行中／未完成」。做主題 → 該列 `docs/product/topics/<topic>.md`（＋現行 `docs/product/plans/`）。

---

## 7. 新專案最小落地步驟

1. 建立 `docs/product/BACKLOG.md`（用下方骨架）。  
2. 建立 `docs/product/topics/`（可先空）。  
3. （可選）預留 `docs/product/plans/`、`docs/product/audits/`。  
4. 在 agent 指引寫入 §6 讀檔階梯。  
5. 第一個真實主題：索引加一列＋寫一分題檔。

### 7.1 `BACKLOG.md` 最小骨架

```markdown
# 工程待跟進（Backlog）

本檔＝工程主題目錄，不是產品看板，也不是規範正文。

**Agent 讀檔**：
- 問未做 → 只讀「進行中／未完成」；停。
- 做主題 → 開該列 `backlog/<topic>.md`；需要步驟再開現行 `plans/…`。
- `audits/` 與已完成表：備查；日常唔掃。

## 維護約定

- 新主題：加列到「進行中／未完成」＋可選 `docs/product/topics/<topic>.md`
- 開始做：狀態改 `in_progress`；有計劃連 `docs/product/plans/…`
- 完成或取消：改 `done`／`cancelled`，整列移到「已完成／已取消」
- 索引只放一句摘要；長文放分題
- 唔好把已完成項同未做項混同一張表

## 進行中／未完成

| 狀態 | 優先 | 主題 | 摘要 | 詳情 |
| --- | --- | --- | --- | --- |

## 已完成／已取消

備查用；唔係待辦。

| 狀態 | 優先 | 主題 | 摘要 | 詳情 |
| --- | --- | --- | --- | --- |
```

### 7.2 分題最小骨架

```markdown
# <主題名>

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open` |
| 優先 | 中 |
| 範圍 | … |
| 不含 | … |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |

## 結論

…

## 待決

1. …

## 待做（摘要）

1. …

## 相關

- …
```

---

## 8. 日常操作速查

| 情境 | 動作 |
| --- | --- |
| 想到新功能／債 | 索引加 `open` 列；需要邊界就寫分題 |
| 開工 | 列改 `in_progress`；複雜則開 `plans/YYYY-MM-DD-…` 並連上 |
| 進度變了 | 更新索引**一句摘要**＋分題「結論／下一步」 |
| 本期做完 | 分題標 `done`（可寫完成日）；整列搬到已完成表 |
| 決定不做 | 分題寫原因；狀態 `cancelled`；整列搬到已完成表 |
| 調查／對抗 | 寫 `audits/…`；分題／索引只加連結，唔當新待辦除非另開 open 項 |
| 計劃被取代 | 新 plan 檔；分題改連現行；舊 plan 標題或分題註「已取代」 |

---

## 9. 反模式（避免）

- 把規範全文、UI 說明、營運政策塞進 backlog 當「待辦」  
- `done` 留在「進行中」表「方便回顧」  
- 索引摘要寫成長段落或完整 checklist  
- 同一問題兩條 open 列、兩份「現行」plan 並存  
- Agent 為「全面了解」預讀全部 audits／已完成分題  
- 完成後刪除分題檔（應保留備查；取消亦然）

---

## 10. 參考實作（本 repo）

| 檔 | 說明 |
| --- | --- |
| [`BACKLOG.md`](./BACKLOG.md) | 現行索引 |
| [`backlog/`](./backlog/) | 分題實例（短 idea → 大型進行中／已完成皆有） |
| [`plans/`](./plans/) | 實作計劃命名與掛接方式 |
| [`audits/`](./audits/) | 調查備查；預設唔當待辦 |
| [`AGENTS.md`](../AGENTS.md) | 「讀檔階梯」一句入口 |

搬去新專案時：可只抄本檔＋§7 骨架；不必複製本專案既有分題內容。
