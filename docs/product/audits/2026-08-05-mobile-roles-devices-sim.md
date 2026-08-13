# 流動裝置 · 三角色跨裝置模擬報告（2026-08-05）

| 欄位 | 值 |
| --- | --- |
| 日期 | 2026-08-05 |
| 範圍 | 行政 `admin`／老師 `teacher`／外星人 `alien`；附帶殼層回歸；對照 [mobile-ui.md](../backlog/mobile-ui.md)「仍欠」 |
| 方法 | **程式碼＋尺寸算術模擬**（非真機／非 Playwright）；四路並行探查後彙整 |
| 裝置集合 | 與 [波次 1](./2026-08-01-mobile-shell-wave1-sim.md) §1 相同 |
| 前次 | [波次 1](./2026-08-01-mobile-shell-wave1-sim.md)／[2](./2026-08-01-mobile-wave2-sim.md)／[3](./2026-08-01-mobile-wave3-private-tutoring-sim.md) |
| 跟進 | [mobile-ui.md](../backlog/mobile-ui.md) |

## 總評

波次 1–3 高頻路徑（殼層層級、Inbox／Leave／一對一卡片、老師時間表／排程日視圖）在 D1–D6 **回歸無惡化**。  
**仍有擋操作級問題**：營運總覽、外星人首頁／報錯／日志維持 `min-w` 大表＋圖表擠壓，無手機簡化。  
**中嚴重度**：老師／行政底欄 IA 捷徑缺口（P3）、Inbox 到達靠「更多／漢堡」、Schedule／Payments 無 FilterSheet、觸控高度未齊 §14、約房多步切換。無新殼層擋操作回歸。

---

## 1. 模擬裝置

| ID | 代表機 | CSS 視口 (W×H) | safe-area 假設 | MobileLayout？ | 主欄內容寬（約） |
| --- | --- | --- | --- | --- | --- |
| D1 | iPhone SE（3rd） | 375×667 | top/bottom 0 | 是 | `max-w-lg`＋`px-4` → ~343px |
| D2 | iPhone 14／15 | 390×844 | top≈47、bottom≈34 | 是 | ~358px |
| D3 | iPhone 14／15 Pro Max | 430×932 | 同上量級 | 是 | ~398px |
| D4 | Pixel 類 | 412×915 | bottom≈0～24 | 是 | ~380px |
| D5 | 橫向小手機 | 667×375 | 視機而定 | 是（極矮） | `sm:max-w-xl` → ~544px；可視高緊 |
| D6 | 大機接近桌面門檻 | 767×1024 | 0 | 仍係 MobileLayout | ~544px |
| D7 | iPad 直向 | 768×1024 | 0 | **否**（桌面 Layout） | 側欄＋寬主欄 |

算術：`1rem = 16px`；斷點 `useIsMobile`＝`<768`（`layoutBreakpoint.ts`）。

---

## 2. 底欄 IA（現況快照）

| 角色 | 底欄 tabs | 相對 backlog 舊述 |
| --- | --- | --- |
| admin | 首頁／點名／**排程**／更多 | backlog「行政無排程」**已過時**；仍無學生／Inbox／收款 |
| teacher | 首頁／點名／時間表／更多 | **無排程**（有時間表）；無 Inbox |
| alien | 首頁／排程／報錯／更多 | 有報錯捷徑；**無 Inbox**／日志 |
| manager | 首頁／排程／收件匣／更多 | （本次非主角色；對照有 Inbox） |
| finance | 首頁／計糧／出席／更多 | （本次非主角色） |

來源：`src/lib/mobileNav.ts`。

---

## 3. 角色場景矩陣

圖例：**Pass**＝可操作；**Risk**＝可用但體驗／發現成本問題；**Fail**＝手機實務難用或強制橫滑擋讀。

### 3.1 行政 admin

| 場景 | D1–D4 | D5 | D6 | D7 |
| --- | --- | --- | --- | --- |
| 殼層／斷點 | Pass | Risk（矮） | Pass | Pass（桌面） |
| 首頁（短標題、隱藏 RevenueChart） | Pass | Risk | Pass | Pass |
| 點名／出席紀錄卡片 | Pass | Risk | Pass | Pass |
| Schedule 日視圖／按日期卡 | Pass | Risk | Pass | Pass（桌面網格） |
| Schedule 篩選（無 FilterSheet） | Risk | Risk | Risk | Pass |
| Payments 長流程 | Risk | Fail | Risk | Pass |
| MgmtDashboard（直開／同元件） | Fail* | Fail* | Risk* | Pass* |
| 底欄：無學生／Inbox／收款 | Risk | Risk | Risk | N/A |

\*營運總覽 nav／`canAccess` 主要給 manager／alien；admin 日常未必進，但**同元件欠手機簡化**（見 M-1）。

### 3.2 老師 teacher

| 場景 | D1–D4 | D5 | D6 | D7 |
| --- | --- | --- | --- | --- |
| TeacherHome 近三日 | Pass | Risk | Pass | Pass（週表） |
| 首頁／底欄→排程捷徑（P3） | **Fail** | **Fail** | **Fail** | Pass（CTA） |
| Scope 提示（多頁只桌面） | Risk／Fail | 同左 | 同左 | Pass |
| TeacherTimetable 按日卡 | Pass | Pass（長捲） | Pass | Pass（週格） |
| `MobileDayViewGrid` | Pass | Risk | Pass | Pass |
| 七日 strip 觸控寬 | Risk（~46–53px） | Pass（較寬） | Pass | N/A |
| PrivateTutoring 預約首屏 | Pass | Risk（Dialog） | Pass | Pass |
| Inbox 卡片 | Pass | Pass | Pass | Pass |
| Inbox 到達（無底欄） | Risk | Risk | Risk | Pass |
| RoomBooking 多步 | Risk | Risk | Risk | Pass |
| 點名底欄 | Pass | Risk | Pass | Pass |

### 3.3 外星人 alien

| 場景 | D1–D4 | D5 | D6 | D7 |
| --- | --- | --- | --- | --- |
| AlienGodViewHome 兩表 | **Fail** | **Fail** | **Fail** | Pass（桌面） |
| SystemIssues | **Fail** | **Fail** | **Fail** | Pass |
| SystemLogs | **Fail** | **Fail** | **Fail** | Pass |
| 底欄→報錯（入口有、內容欠） | Risk | Risk | Risk | N/A |
| 更多→一對一／Leave／Inbox | Pass | Pass | Pass | Pass |
| 更多→MgmtDashboard | **Fail** | **Fail** | Risk | Pass |

可視寬粗算（D1）：Alien 雙重 `p-4` 後表區 ~311px vs `min-w-[640px]`；Issues ~343 vs `min-w-[880px]` → 僅見約四成欄寬。

### 3.4 殼層共用（三角色）

| 項 | D1–D6 | D7 | 相對波次 1–3 |
| --- | --- | --- | --- |
| z-index（阿Po＜Detail＜FilterSheet＜Dialog＜Confirm） | Pass | Pass | **無惡化** |
| 更新橫幅 `5rem`+safe vs 底欄 | Pass | N/A | **無惡化** |
| Dialog max-h／safe-area | Pass | Pass | **無惡化** |
| `max-w-lg` 鎖寬 | 已知中 | 桌面 | 不變 |
| Button／多處觸控 `< h-10` | Risk | Risk | 不變 |
| 雙重 padding／Header「首頁」重複 | 低 | — | 不變 |

---

## 4. 發現項（彙整）

### 高

| ID | 角色 | 頁面 | 問題 | 依據 |
| --- | --- | --- | --- | --- |
| **M-1** | manager／alien（元件共用） | 營運總覽 | 無 `useIsMobile`／卡片；明細僅 `overflow-x-auto`；圖表 `h-52`–`h-64`＋YAxis 56–88px，D1 繪圖區嚴重擠壓 | `MgmtDashboardView.tsx`；`MgmtCharts.tsx`；`MgmtDetailTablesSection.tsx` |
| **M-2** | alien | AlienGodViewHome | 兩表 `min-w-[640px]`；無手機卡片；雙重 padding 再縮 | `AlienGodViewHome.tsx:153,201`（表）；`:74`（`p-4`） |
| **M-3** | alien | SystemIssues | `min-w-[880px]` 八欄表；篩選 inline 無 FilterSheet | `SystemIssuesView.tsx:296`；篩選 `:187-293` |
| **M-4** | alien | SystemLogs | `min-w-[800px]`；同模式 | `SystemLogsView.tsx:263` |

### 中

| ID | 角色 | 頁面 | 問題 | 依據 |
| --- | --- | --- | --- | --- |
| **M-5** | teacher | 底欄／首頁 | **P3**：無排程捷徑；首頁 CTA 列 `md:flex` 手機隱藏；底欄係時間表非 `/Schedule` | `mobileNav.ts:30-36`；`TeacherHomeView.tsx:347-391` |
| **M-6** | teacher | 多頁 | **P3**：scope 提示多處只桌面（`!isMobile`／`md:block`）；排程頁例外有顯示 | `TeacherHomeView`；`RollCallPage`；`AttendanceRecordsPage` |
| **M-7** | teacher／admin／alien | Inbox 到達 | 卡片已適配；老師／行政／外星人**無底欄 Inbox**（manager 有）；靠漢堡 footer／更多 | `mobileNav.ts`；`MobileNavDrawer.tsx` |
| **M-8** | admin | Payments | 無 FilterSheet；長流程全頁捲；模式 pill／觸控矮於 `h-10` | `PaymentsPageView.tsx` |
| **M-9** | 共用 | Schedule | 篩選仍全 inline，**欠 FilterSheet**；老師 chip `h-9` | `ScheduleManagePage.tsx`（篩選段） |
| **M-10** | teacher | RoomBooking | 課室→日→節多步；說明 `hidden md:block` | `RoomBookingView.tsx` |
| **M-11** | 共用 | 觸控 | Button／Input 預設 `h-9`；底欄 icon `h-8`；未齊 §14 `h-10` | `button.tsx`；`MobileBottomNav.tsx` |
| **M-12** | admin | 底欄 IA | 有排程，仍無學生／Inbox／收款捷徑 | `mobileNav.ts:58-65` |

### 低

| ID | 問題 | 備註 |
| --- | --- | --- |
| **M-13** | 雙重 padding；Header／底欄「首頁」重複 | `MobileLayout`＋頁內 `p-4`／`p-6` |
| **M-14** | 七日 strip 觸控 ~46px（D1） | 波次 2 W2-2 殘；可點非擋 |
| **M-15** | 時間表空日佔位長捲；一對一 Dialog 矮屏長捲 | W2-4／W3-2 殘 |
| **M-16** | Class／Teacher／Student 詳情 tab 橫滑 | 不一致 |
| **M-17** | D5 橫向幾乎所有長頁必重捲 | 設計極限，非單頁 bug |
| **M-18** | admin 與 Mgmt nav 語意 | 行政 nav 排除營運總覽；「行政欠 Mgmt」實指**同元件欠適配**（管理層／外星人進） |

波次 2–3 低嚴重度取捨（W2-1～W2-4、W3-1～W3-3）**仍在**，本次未升級。

---

## 5. 已適配回歸（簡表）

| 項 | 結果 |
| --- | --- |
| 殼層 z-index／Dialog／橫幅 `5rem` | Pass |
| Inbox／Leave／PrivateTutoring 卡片＋FilterSheet | Pass（三角色進「更多」同享） |
| Schedule `MobileDayViewGrid`；TeacherWeekTimetable 按日卡 | Pass |
| TeacherHome 近三日；點名底欄／學生卡 `min-h-11` | Pass |
| Students／Classes／Trials／PaymentHistory | Pass（沿用） |
| 行政首頁手機精簡（藏 RevenueChart） | Pass |
| D7 桌面大表路徑 | Pass（預期；非手機簡化） |

---

## 6. 建議下一波（按嚴重度）

1. **MgmtDashboard 手機簡化**（KPI 卡＋關鍵列直向／少圖或簡圖）— 解 M-1；受惠 manager／alien  
2. **外星人專屬頁卡片化**（AlienGodView／Issues／Logs）— 解 M-2～M-4；Issues 可加 FilterSheet  
3. **老師 P3**：底欄或首頁露出 `/Schedule`；scope 文案勿只 `md:` — 解 M-5／M-6  
4. **共用**：Schedule（＋可選 Payments）接 FilterSheet；觸控對齊 `h-10` — 解 M-8／M-9／M-11  
5. 可選：三角色 Inbox 底欄或「更多」置頂捷徑；RoomBooking 減步 — M-7／M-10  

邊緣複雜操作（罰款／大量退讀／多表對帳）維持「回桌面」文案即可。

---

## 7. 方法與限制

- 依 CSS class、`useIsMobile`、viewport 算術推演；**未**跑瀏覽器／Playwright／真機截圖。  
- finance／manager 僅作底欄對照，未做完整場景表。  
- 次要 CRUD／報表（Courses、EnrollmentReports…）仍列 backlog §D，本次未逐頁展開。
