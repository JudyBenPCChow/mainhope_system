# 營運文件瀏覽頁（應用內）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open`（idea；未開工） |
| 優先 | 低 |
| 範圍 | 後台新增路由頁，供**行政以上**角色在系統內閱讀營運文件（政策／前線指引／說明書選篇） |
| 角色（暫定） | `admin`／`manager`／`alien`；**不含** `teacher` |
| 不含 | 對外公開文件站、老師端閱讀、即時編輯 Markdown、取代 Desktop／repo 內 `docs/` 維護流程 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 靈感來源 | 逾期罰款前線指引等營運文檔需方便接待／管理層查閱（2026-08-01） |

## 結論

而家營運文件在 repo `docs/`（如 [`OPS_POLICIES.md`](../policies/_INDEX.md)、[`manual/TUITION_LATE_FEE_FRONTLINE.md`](../playbooks/frontdesk/TUITION_LATE_FEE_FRONTLINE.md)），前線要離開系統另開檔。構想：加一頁**應用內目錄＋閱讀**，方便行政以上快速查規條。

**僅 idea**；產品範圍（白名單邊幾篇、側欄放邊、要否搜尋／列印）開工前再定。

## 待決（開工前）

1. 文件白名單：只掛「前線必讀」還是整份 OPS 索引
2. 內容來源：build 時打包 Markdown、還是另存結構化內容
3. 路由／側欄名稱與 `navStructure` 分組（管理層 vs 行政）
4. 與阿Po 知識庫是否去重

## 待做（摘要）

1. 產品拍板角色與文件清單  
2. 路由＋側欄（roles 限 admin／manager／alien）  
3. 列表＋單篇閱讀 UI（跟現有 UI 規範）  
4. （可選）搜尋、列印、最近閱讀  

## 相關

- 營運政策索引：[`OPS_POLICIES.md`](../policies/_INDEX.md)
- 系統說明書：[`SYSTEM_MANUAL.md`](../playbooks/_INDEX.md)
- 角色：[`mgmtRole.ts`](../../src/lib/mgmtRole.ts)、[`navStructure.ts`](../../src/lib/navStructure.ts)
