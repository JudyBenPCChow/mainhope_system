# 流動裝置 · 波次 1 殼層改動模擬報告（2026-08-01）

| 欄位 | 值 |
| --- | --- |
| 日期 | 2026-08-01 |
| 範圍 | 波次 1：阿Po z-index、更新橫幅、Dialog max-h／safe-area、FilterSheet／NavDrawer vs Dialog |
| 方法 | **程式碼＋尺寸算術模擬**（非真機／非 Playwright）；依 CSS class 與常見 viewport 推演 |
| 裝置集合 | 見 §1 |
| 跟進 | [mobile-ui.md](../backlog/mobile-ui.md) |

## 總評

波次 1 四項主目標在各流動寬度下**大致達標**：詳情／點名紙會蓋住阿Po；Dialog 可捲動；篩選 sheet 唔再蓋 Dialog。  
發現 **1 個中低風險（M1）**：更新橫幅原 `bottom: 3.75rem` 可能略蓋底欄——**已於同日改為 ~`5rem`＋safe-area**。

---

## 1. 模擬裝置

| ID | 代表機 | CSS 視口 (W×H) | safe-area 假設 | MobileLayout？ |
| --- | --- | --- | --- | --- |
| D1 | iPhone SE（3rd） | 375×667 | top/bottom 0 | 是（&lt;768） |
| D2 | iPhone 14／15 | 390×844 | top≈47、bottom≈34 | 是 |
| D3 | iPhone 14／15 Pro Max | 430×932 | 同上量級 | 是 |
| D4 | Pixel 類 | 412×915 | bottom≈0～24 | 是 |
| D5 | 橫向小手機 | 667×375 | 視機而定 | 是（極矮） |
| D6 | 大機接近桌面門檻 | 767×1024 | 0 | 仍係 MobileLayout |
| D7 | iPad 直向 | 768×1024 | 0 | **否**（≥768 → 桌面 Layout） |

---

## 2. 改動後層級（與闊度無關）

| 層 | z | 結果 |
| --- | --- | --- |
| 阿Po FAB／對話 | 90 | |
| 更新橫幅 | 100 | 蓋阿Po（更新優先）✓ |
| DetailLayer／RollCallSheet | 200 | 蓋阿Po ✓ |
| FilterSheet／NavDrawer | 250 | |
| Dialog | 260／261 | 蓋 FilterSheet ✓ |
| Confirm | 270／271 | |
| Select／Date | 320 | |

**全裝置 Pass**（z-index 不依賴 viewport）。

---

## 3. 場景模擬

### 3.1 阿Po vs 學生詳情／排程點名紙

| 裝置 | 預期 | 推演 | 結果 |
| --- | --- | --- | --- |
| D1–D6 | sheet（200）蓋 FAB（90） | portal sheet 全螢幕；FAB 被擋、唔可點穿 | **Pass** |
| D7 桌面 | 同上 | 桌面 Layout 同樣掛阿Po `z-90` | **Pass** |

阿Po 開對話時面板 `max-h-[min(52vh,28rem)]`：D5 橫向 375 高 → 約 195px 訊息區，仍可捲；唔影響 sheet 層級。

### 3.2 更新橫幅 vs 底欄

底欄高度粗算（`pt-1` + `py-2` + icon `h-8` + 11px 字 + `pb`）：

| 裝置 | 底欄高（約） | 橫幅 `bottom` | 會否蓋底欄 |
| --- | --- | --- | --- |
| D1（無 notch） | ~4.6rem（~74px） | `3.75rem`（60px） | **可能蓋約 14px**（圖示／字下緣） |
| D2／D3（home 條） | ~6.25rem（~100px） | `3.75rem+34px`≈94px | **可能蓋數 px** |
| D4 | ~4.6～5.5rem | `3.75rem`（+少量 safe） | **輕微風險** |
| D7 桌面 | 無底欄 | `md:bottom-0` | **Pass**（貼底合理） |

| 結果 | **Fail／Risk（中低）** — 避開底欄意圖正確，但 `3.75rem` 偏緊 |

建議（未改 code）：改 `bottom-[calc(5rem+env(safe-area-inset-bottom))]` 或 `5.25rem`，對齊阿Po 錨點量級。

### 3.3 Dialog 矮螢幕／safe-area

`max-h-[min(90dvh,calc(100dvh-2rem))]` + `overflow-y-auto` + safe-area padding。

| 裝置 | max-h 約 | 置中後 | 結果 |
| --- | --- | --- | --- |
| D1 667 高 | min(600,635)=600 | 上下約有餘量 | **Pass** |
| D2 844 高 | ~760 | 充裕 | **Pass** |
| D5 375 高 | min(337,343)=337 | 靠捲動；可開 | **Pass**（體驗緊） |
| D6 1024 高 | 受 90dvh | 充裕 | **Pass** |

附註：`sm:`（≥640）會套 `sm:pt-6`／`sm:w-full`，D6（767）仍 MobileLayout 但已食到 `sm`——可接受，非回歸。

關閉鈕 `absolute top-4`：有大 top safe-area 時仍喺 Dialog 盒內，**Pass**。

### 3.4 FilterSheet 開住再開 Dialog／Confirm

| 裝置 | FilterSheet 250 vs Dialog 260 | 結果 |
| --- | --- | --- |
| D1–D6 | Dialog 在上 | **Pass** |
| Confirm 270 | 再高過 Dialog | **Pass** |

### 3.5 更新橫幅 + 阿Po 同時

| 裝置 | z | 垂直 |
| --- | --- | --- |
| 全部 | 橫幅 100 &gt; 阿Po 90 → 橫幅蓋對話／FAB | **Pass**（更新優先） |
| 垂直 | 橫幅底 `3.75rem+safe`；阿Po 底 `5.75rem+safe`；橫幅向上長可叠住阿Po 下緣 | 可接受 |

### 3.6 主區 `max-w-lg`（非波次 1，旁證）

D1–D6 主欄仍 `max-w-lg`（32rem）——時間表橫滑問題**仍在**，屬波次 2／3，唔當波次 1 回歸。

---

## 4. 清單

| ID | 嚴重度 | 發現 | 建議 |
| --- | --- | --- | --- |
| M1 | 中低 | 更新橫幅 `3.75rem` 可能略蓋底欄（D1 最明顯） | **已修**：加大至 ~`5rem`＋safe-area |
| — | — | 阿Po／Dialog／FilterSheet 主目標 | **無需再改**（波次 1） |

---

## 5. 結論

| 問題（波次 1） | 多裝置模擬 |
| --- | --- |
| 阿Po 蓋詳情／點名 | **OK** |
| 更新橫幅蓋底欄 | **已修 M1**（`5rem`＋safe） |
| Dialog 矮螢幕 | **OK**（橫向極矮靠捲動） |
| FilterSheet 蓋 Dialog | **OK** |

**可以當波次 1 可用**；M1 已收斂。真機抽樣建議：SE 375、有 Home Indicator 嘅 iPhone、橫向 667×375 各開一次學生詳情＋篩選＋Confirm。
