# 管理員桌面預覽側板

| 欄位 | 值 |
| --- | --- |
| 狀態 | `in_progress`（正式已接線；沙盒／假資料已刪） |
| 優先 | 低 |
| 範圍 | 管理員桌面：列表撳行→右側 slide-in **簡單預覽**；「開完整詳情」→ B 頂欄＋分頁 |
| 角色 | **admin** 同 **alien**（QA）用預覽側板；manager／老師撳行仍去完整頁 |
| 不含 | 流動裝置（維持 `DetailLayerShell` bottom sheet）；側板內嵌收款表單；幼「釘學生」欄 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 工程位置 | 本工作樹 `mainhope_context_rail`；branch `cursor/cloud-agent-1787954165945-ptsrv` |

## 開工閘

無對上未完成工程擋路。正式殼：`Layout.tsx` 並排 `RecordPreviewRail`；學生／班別／老師桌面詳情用 `AdaptiveDetailLayer`（無遮罩）。預覽只經 `studentQueries`／`classQueries`／`teacherQueries` 等 service，唔用假資料。

## 結論（產品約束；2026-08-31 正式）

只限 admin／alien 預覽側板；**唔用 hover**；快捷唔內嵌收款表單（連 `/Payments?studentId=`、`/LeaveManagement?studentId=`）。  
列表撳學生／班別／老師 → 當頁右側 slide-in 簡單預覽；「開完整詳情」→ 該實體完整頁 **B 頂欄＋分頁**。流動裝置維持 bottom sheet。

## 正式實作

| 職責 | 檔 |
| --- | --- |
| slide-in 右欄 | [`RecordPreviewRail`](../../../src/components/recordPreview/RecordPreviewRail.tsx)＋[`Layout.tsx`](../../../src/components/Layout.tsx) 並排 |
| 學生預覽 | [`StudentPreviewPanel`](../../../src/components/recordPreview/StudentPreviewPanel.tsx) ← `getStudentById`／`fetchEnrollmentsForStudent` |
| 班別預覽 | [`ClassPreviewPanel`](../../../src/components/recordPreview/ClassPreviewPanel.tsx) ← `getClassById`／`fetchClassStudents` |
| 老師預覽 | [`TeacherPreviewPanel`](../../../src/components/recordPreview/TeacherPreviewPanel.tsx) ← `getTeacherById`／`fetchTeacherClasses` |
| 列表撳行 | [`useOpenStudentRecord`](../../../src/components/recordPreview/recordPreviewContext.tsx)／`useOpenClassRecord`／`useOpenTeacherRecord`：admin／alien 開預覽；其餘 navigate 完整頁 |
| 完整頁 B | 學生／班別／老師桌面白卡頂欄；[`AdaptiveDetailLayer`](../../../src/components/detail/DetailLayerShell.tsx) 取消桌面遮罩 |

2026-08-31 已刪：`src/prototypes/adminContextRail/`、`/prototype/AdminContextRail`、`sandbox/admin-context-rail/`、`sandbox/record-page-layouts/`、`public/admin-context-rail.html`、`public/record-page-layouts.html`。

## 待決

側板闊而家 `min(26rem, 42vw)`；要改再講。幼「釘學生」欄唔做（改列表撳行預覽）。

## 待做

1. **已做**（2026-08-29 實機＋2026-08-31 去沙盒）：學生／班別／老師列表 → 預覽側板；關聯預覽留頁；完整頁桌面 B 頂欄；流動裝置維持 sheet；老師桌面 overlay 已取消。§14 Overlay 已更新。假資料／示範頁已刪。
2. 樣式微調（側板闊）可另開；唔擋正式使用。
3. 完整頁改普通頁後，學生詳情紀錄頁：見 [`student-detail-record-page.md`](./student-detail-record-page.md)（**2026-09-01 已拍板並開工**）。

## 業界慣例（從邊度開詳情）

類似產品有共識，唔係「一律跳去列表」亦唔係「只有一種 overlay」。

| 入口 | 常見做法 | 例子 |
| --- | --- | --- |
| 該實體自己嘅列表 | 撳行→右／側板並排；再撳另一行就換內容 | [Nutanix Side panel](https://ds.nutanix.design/patterns/side-panel)；[HubSpot index Preview](https://knowledge.hubspot.com/records/preview-a-record) |
| 另一個實體頁（班別入面嘅學生、關聯聯絡人） | **留喺呢一頁**開預覽側板；要做齊先「開完整紀錄」 | HubSpot [Preview an associated record](https://knowledge.hubspot.com/records/preview-a-record#preview-an-associated-record) |
| 要全部 tab／長工作流 | 去該實體自己嘅完整頁；側板只放摘要＋常用 | Nutanix：側板 header 有連去 full page；**唔好**把詳情頁全部抄入側板 |

唔好做：班別頁撳學生 → 跳去學生列表再開側板（掉咗班別上下文）。  
老師／學生／班別當同一類「紀錄」用同一套殼（HubSpot 各 object 共用 Preview）。  
[Linear Peek](https://linear.app/docs/peek) 係列表快捷預覽，唔係完整 issue 頁。

## 樣式方向（2026-08-29 網上參考）

現時預覽側板只講「而家呢個學生／班／老師」；去其他頁用快捷連去現有路由，唔同檢查器搶位。舊沙盒曾把釘資料同快捷上下兩截塞同一欄，文獻多數**分開**。

### A. 純檢查器（Details / Inspector）

右欄只顯示已固定學生：身份、狀態、電話、報讀；動作只有「開完整學生頁」等次要掣。列表保持高亮同一人。適合：一邊睇名單、一邊對資料。  
參考：[UX Patterns — Details panel](https://uxpatternsguide.com/patterns/details-panel/)（唔好變成表單／過濾器／全域導航）；[Salt Side panel](https://www.saltdesignsystem.com/salt/components/side-panel/examples)（右錨、主欄仍可操作）；[CodeFronts dual sidebar](https://codefronts.com/layouts/css-sidebar-layouts/dual-sidebar/)（Notion／Discord 級：左導航＋右情境）。

### B. 圖示軌＋分頁（Cursor／VS Code／Gemba RHP）

摺起剩 ~40px 直向圖示；撳先展開內容。釘學生同一頁籤、快捷另一頁籤；可拖闊、記住闊度。適合：要永久有入口、但唔想預設食 22.5rem。  
參考：[Gemba Right-Hand Panel](https://gembacore.github.io/gemba-core/design/rhp/)（摺＝只留軌；冷啟動預設收起）；[shadcn Resizable](https://www.shadcn.io/ui/resizable)（可拖、可摺、記住闊度）。

### C. 滑入側板（用先開、用完可關）

唔永遠佔闊。按「固定」先從右滑入。適合：釘學生係偶發、多數時間要最大表。同「跨頁都要見到釘資料」有張力——要另做摺起後嘅小入口。

C 有兩種動效，唔好當同一樣：

| 變體 | 主欄點 | 背景可唔可以繼續用 |
| --- | --- | --- |
| **Slide-over（蓋住）** | 被半透明遮罩擋住 | 通常唔得；撳遮罩／Esc 關 |
| **Slide-in（推開）** | 縮窄讓位，無遮罩 | 得；表同側板並排 |

**建議對照（頁內有掣＋源碼，2024–2026）：**

1. IBM Carbon **兩種一齊試**（同一套件、最易睇分別）  
   - [Slide over](https://ibm-products.carbondesignsystem.com/?path=/story/ibm-products-components-side-panel-sidepanel--slide-over)＝蓋住  
   - [Slide in](https://ibm-products.carbondesignsystem.com/?path=/story/ibm-products-components-side-panel-sidepanel--slide-in)＝推開主欄  
   撳 Canvas 入面嘅 Open；右側 Controls 可改 size。
2. [Ant Design Drawer — Preview drawer](https://ant.design/components/drawer#components-drawer-demo-render-in-current)（v6，2026）：列表撳人→右滑出預覽，最似「固定學生」。同頁有 [Resizable](https://ant.design/components/drawer#components-drawer-demo-resizable)（可拖闊）、[Custom Placement](https://ant.design/components/drawer#components-drawer-demo-placement)、每例「Expand」睇碼／開 CodeSandbox。
3. [MUI Drawer](https://mui.com/material-ui/react-drawer/)：頁頂 **Open drawer**＝temporary 蓋住；向下 **Persistent drawer**＝推開（較近我哋「開住就留」）。每段 Edit code。
4. [Fluent UI v9 Drawer](https://react.fluentui.dev/?path=/docs/components-drawer--docs)：Storybook 左邊揀 Overlay vs Inline。
5. 較新、頁內可撳 Open 睇動畫＋Copy code：  
   - [shadcn Sheet](https://ui.shadcn.com/docs/components/sheet)（Side：right）  
   - [coss Sheet](https://coss.com/ui/docs/components/sheet)（2025–26、Base UI）  
   - [HeroUI Drawer](https://heroui.com/docs/react/components/drawer)  
   - [Chakra Drawer](https://www.chakra-ui.com/docs/components/drawer)（Placement：end＝右；另有 Non-Modal）  
   - [Park UI Drawer](https://park-ui.com/docs/components/drawer)  
   - [Mantine Drawer](https://mantine.dev/core/drawer/)
6. **HTML／Tailwind（同我哋前端棧最近）**：[Flowbite Right drawer](https://flowbite.com/docs/components/drawer/#right-drawer)（頁內 Show right drawer＋可複製 HTML）；[DaisyUI drawer](https://daisyui.com/components/drawer/)。

模式說明：[UX Patterns — Drawer](https://uxpatternsguide.com/patterns/drawer/)；企業用法：[Nutanix Side panel](https://ds.nutanix.design/patterns/side-panel)（無互動 demo）。  
Atlassian Drawer 已標 [deprecated](https://atlassian.design/components/drawer/examples)，唔跟。

### D. 學生紀錄頁自己三欄（殼維持兩欄）

「固定」＝去／留在學生工作頁：左屬性、中時間線／工作、右關聯班別。App 殼唔加永久右欄。適合：一次做完呢個學生（收款、請假），少要一邊睇全表一邊釘住。  
參考：[HubSpot record page](https://knowledge.hubspot.com/records/work-with-records)（紀錄頁左／中／右）；[Docyrus CRM detail](https://www.skills.sh/docyrus/design-skills/docyrus-crm-like-detail-page-design)（屬性欄＋分頁工作區）。

### E. 主從分欄（郵件／Slack：名單｜詳情）

學生管理變成左名單、右／中詳情，唔係全 app 第三欄。切去班別就冇呢條分欄。適合：只喺學生列表要對資料；**唔滿足**「切班別右欄仍在」除非另做全域釘。  
參考：[CodeFronts three-pane workspace](https://codefronts.com/layouts/css-sidebar-layouts/three-pane-workspace/)（Slack／IDE：icon rail ＋ list ＋ body）。

### 唔好照抄

[Carbon UI shell right panel](https://carbondesignsystem.com/components/UI-shell-right-panel/usage/)＝頂欄系統動作（通知／產品切換），**唔係**學生情境；同我哋要解決嘅問題唔同。

產品實例（自己開嚟睇）：Linear／GitHub PR 右欄＝而家呢張單嘅屬性，唔係全域釘；Cursor 次欄＝圖示軌＋可摺，唔係上下兩截混用。
