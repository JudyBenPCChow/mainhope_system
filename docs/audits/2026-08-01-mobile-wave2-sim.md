# 流動裝置 · 波次 2 高頻頁改動模擬報告（2026-08-01）

| 欄位 | 值 |
| --- | --- |
| 日期 | 2026-08-01 |
| 範圍 | 波次 2：Inbox 卡片、Leave 卡片＋FilterSheet、老師開放 `MobileDayViewGrid`、`TeacherWeekTimetable` 按日卡片；附帶覆核波次 1 M1（橫幅 `5rem`） |
| 方法 | **程式碼＋尺寸算術模擬**（非真機／非 Playwright）；依 CSS class、`useIsMobile`（&lt;768）與常見 viewport 推演 |
| 裝置集合 | 與 [波次 1 模擬](./2026-08-01-mobile-shell-wave1-sim.md) §1 相同 |
| 跟進 | [mobile-ui.md](../backlog/mobile-ui.md) |

## 總評

波次 2 四項主目標在 D1–D6（MobileLayout）下**達標**：列表不再強制 `min-w` 橫滑；請假篩選走 bottom sheet；老師可開週曆日視圖；時間表改按日卡片。  
發現 **3 個低嚴重度體驗取捨**（非擋操作）：請假卡片功能面簡化、日視圖七日 strip 觸控偏窄、時間表七日空檔仍佔位捲動。波次 1 **M1 覆核 Pass**。

---

## 1. 模擬裝置

| ID | 代表機 | CSS 視口 (W×H) | safe-area 假設 | MobileLayout？ | 主欄內容寬（約） |
| --- | --- | --- | --- | --- | --- |
| D1 | iPhone SE（3rd） | 375×667 | top/bottom 0 | 是 | `max-w-lg`＋`px-4` → ~343px |
| D2 | iPhone 14／15 | 390×844 | top≈47、bottom≈34 | 是 | ~358px |
| D3 | iPhone 14／15 Pro Max | 430×932 | 同上量級 | 是 | ~398px |
| D4 | Pixel 類 | 412×915 | bottom≈0～24 | 是 | ~380px |
| D5 | 橫向小手機 | 667×375 | 視機而定 | 是（極矮） | 受 `max-w-lg`／`sm:max-w-xl`；可視高度緊 |
| D6 | 大機接近桌面門檻 | 767×1024 | 0 | 仍係 MobileLayout | ~`max-w-xl`（≥640） |
| D7 | iPad 直向 | 768×1024 | 0 | **否**（桌面 Layout） | 側欄＋寬主欄；波次 2 走**桌面表格** |

算術假設：`1rem = 16px`；底欄粗算同波次 1（無 safe ≈4.6rem；有 home 條 ≈6.25rem）。

---

## 2. 改動與分支（與闊度關係）

| 表面 | 手機（&lt;768） | 桌面（≥768，D7） |
| --- | --- | --- |
| Inbox | 卡片列表；詳情整頁替換列表 | `min-w-[640px]` 表 |
| Leave | 狀態 chips + FilterSheet + 卡片 | inline 篩選 + `min-w-[1180px]` 表 |
| Schedule 日／週曆 | `allowMobileDayView = true` → `MobileDayViewGrid`（行政／老師） | 既有 `DayViewGrid` |
| TeacherWeekTimetable | 按日 `Link` 卡片（含空日） | `min-w-[720px]` 週格 |

層級（波次 1 已定，波次 2 Leave FilterSheet 沿用）：FilterSheet `250` ＜ Dialog `260` ＜ Confirm `270` ＜ Date／Select `320`。

---

## 3. 場景模擬

### 3.1 Inbox 手機卡片（無橫滑表）

| 裝置 | 預期 | 推演 | 結果 |
| --- | --- | --- | --- |
| D1–D4 | 卡片寬≈主欄；標題／`line-clamp-2` 正文可讀；「查看」可點 | 無 `min-w`；`flex-wrap` Tag 換行 | **Pass** |
| D5 | 列表＋篩選＋底欄擠矮屏 | 靠主區垂直捲；詳情另頁（非 Dialog）唔搶高度 | **Pass**（體驗緊） |
| D6 | 同手機分支 | 仍 `isMobile`；略寬較鬆 | **Pass** |
| D7 | 桌面表 | `min-w-[640px]`，768 主欄通常夠；唔當波次 2 回歸 | **Pass**（預期） |

附註：營運「類型」仍 inline `Select`（非 FilterSheet）；單欄＋checkbox，D1 可 wrap，**Pass**。觸控高度 `size="sm"` 未達 §14 `h-10` → 見 §4 W2-3。

### 3.2 Leave 卡片＋FilterSheet

| 裝置 | 卡片列表 | FilterSheet | 詳情 Dialog |
| --- | --- | --- | --- |
| D1 | 雙欄 meta grid 約 343px；狀態 Tag＋詳情／刪除 | `max-h: min(88vh,40rem)`≈587；4 個欄位＋套用鈕，可捲 | Dialog `max-h` 波次 1 已證可捲 |
| D2／D3 | 更鬆；safe-area 由 sheet `pb` 處理 | 同左 | 同左 |
| D5 | 卡片短高可捲 | sheet 高≈330，內容捲動 | Dialog 矮屏靠捲 |
| D6 | 同手機 | `md:hidden` 唔影響（仍 &lt;768） | **Pass** |
| D7 | 桌面大表 | FilterSheet 不渲染 | **Pass**（預期） |

狀態 chips（全部／待補課／已補課／放棄補課）：`flex-wrap`；D1 預計 **2 行**，仍可點 → **Pass**（略密）。

深連結 `#leave-record-*`：`id` 掛在 `<article>` → scrollIntoView **Pass**。

Leave 開 FilterSheet 再開詳情 Dialog：`250` ＜ `260` → **Pass**（同波次 1 §3.4）。Date Input 面板 `z≥320` → **Pass**（唔被 sheet 裁）。

| 結果（版面） | **Pass** |
| 結果（功能面） | 卡片**無**學費 Select／補課格子／狀態 Select；須「詳情」→ 見 **W2-1** |

### 3.3 老師／行政 Schedule → `MobileDayViewGrid`

| 裝置 | 寬向 | 高向 | 結果 |
| --- | --- | --- | --- |
| D1–D4 | 無大表橫滑；課室×節次**直向**堆疊 | 多課室時捲動長（行政較重；老師 scope 通常較短） | **Pass**（目標：可視化可用） |
| D1 | 七日 strip `grid-cols-7` ≈343／7 ≈**49px／格**（含 gap 更窄） | 觸控寬偏緊 | **Pass／Risk 低** → **W2-2** |
| D5 | 寬夠；strip 舒適 | 可視高 375 − header／底欄後餘量少，節次列表長捲 | **Pass**（體驗緊） |
| D6 | 同手機分支 | 充裕 | **Pass** |
| D7 | 桌面 DayViewGrid | — | **Pass**（預期） |

老師開放後：`/Schedule?view=day` 唔再被降級「按日期」→ **Pass**（相對波次前功能缺口）。

「只看使用中」可縮短空課室列表；預設若未開，行政全日多課室仍長 → 既有 MobileDayView 行為，**非波次 2 回歸**。

### 3.4 TeacherWeekTimetable 按日卡片

| 裝置 | 推演 | 結果 |
| --- | --- | --- |
| D1–D4 | 無 `min-w-[720px]`；每日一節＋空日「沒有排程」佔位 | **Pass**；空週捲動偏長 → **W2-4** |
| D5 | 週標題／跳至日期 `flex-wrap`；列表短高長捲 | **Pass**（緊） |
| D6 | 同手機 | **Pass** |
| D7 | 週格表 | **Pass**（預期） |

導航：上一週／下一週 `size="icon"`；日期 `min-w-[10.5rem]` 可 wrap → **Pass**。

### 3.5 波次 1 M1 覆核（更新橫幅 vs 底欄）

橫幅：`bottom-[calc(5rem+env(safe-area-inset-bottom))]`（80px＋safe）。

| 裝置 | 底欄高（約） | 橫幅 bottom | 會否蓋底欄 |
| --- | --- | --- | --- |
| D1 | ~74px（4.6rem） | 80px | **否**（約 6px 餘量）→ **Pass** |
| D2／D3 | ~100px | 80＋34≈114 | **否** → **Pass** |
| D4 | ~74–88 | 80（＋少量 safe） | **否／極貼** → **Pass** |
| D7 | 無底欄 | `md:bottom-0` | **Pass** |

### 3.6 主區 `max-w-lg`（旁證）

D1–D6 主欄仍鎖窄殼。波次 2 列表已改卡片／直向日視圖，**唔再被 `max-w-lg` 逼出橫滑表**（對本波目標）。一對一／營運總覽等未改頁仍受影響 → backlog 下一波。

---

## 4. 清單

| ID | 嚴重度 | 發現 | 建議 |
| --- | --- | --- | --- |
| W2-1 | 低 | Leave 手機卡片省略學費／補課連結／狀態 inline 編輯；日常改補堂須開詳情 | 可接受；若行政常在手機改學費，再加卡片次要列或快捷 |
| W2-2 | 低 | `MobileDayViewGrid` 七日 strip 在 D1 每格約 &lt;50px 寬 | 可接受；必要時改橫滑日期或加大 hit area |
| W2-3 | 低 | Inbox／Leave「查看／詳情」仍 `Button size="sm"`，未對齊 §14 `h-10` | 共用觸控高度波次再統一 |
| W2-4 | 低 | 時間表手機固定 7 日區塊（含全日無課） | 可接受；可選「只顯示有課日子」壓縮空檔 |
| — | — | Inbox／Leave／老師日視圖／時間表：**無擋操作橫滑回歸** | **無需為達標再改** |
| M1 | — | 橫幅 vs 底欄 | **覆核 Pass**（已修 `5rem`） |

---

## 5. 結論

| 問題（波次 2） | 多裝置模擬 |
| --- | --- |
| Inbox 無手機替代 | **OK**（D1–D6 卡片） |
| Leave 大表／篩選擠 | **OK**（卡片＋FilterSheet）；功能面見 W2-1 |
| 老師不能用日視圖 | **OK**（`allowMobileDayView`） |
| TeacherTimetable 週格橫滑 | **OK**（按日卡片）；空日捲動見 W2-4 |
| 更新橫幅蓋底欄（M1） | **OK** |

**可以當波次 2 可用**；無中高嚴重度版面／層級失敗。真機抽樣建議：

1. **D1 375**：行政 Inbox 開詳情、Leave 篩選＋開詳情 Dialog、確認橫幅唔蓋底欄  
2. **D2 有 Home Indicator**：同上＋老師 `/Schedule`「週曆」點日期  
3. **D5 橫向 667×375**：Leave FilterSheet、時間表按日列表可捲  
4. **老師底欄時間表**：有課／無課各一週，確認唔再出現 720px 橫滑格  

下一步（非本報告必修）：一對一、營運總覽、外星人底欄頁；以及 W2-1～W2-4 若產品要再收斂。
