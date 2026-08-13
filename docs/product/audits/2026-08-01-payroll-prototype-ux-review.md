# 計糧沙盒 UI/UX 審查

> 日期：2026-08-01  
> 審查對象：`mainhope-payroll-ui-sandbox.vercel.app` + `src/prototypes/payroll/` 源碼  
> 審查角色：財務 Cody + 管理層 Mark  
> 前提：沙盒已實現 finance-ui-review.md 的大部分建議；本審查聚焦**仍可改善的 UX 細節**

---

## 0. 先說好的：原型已解決的關鍵問題

在進入改善建議前，必須先確認這個原型已經做對了很多事：

| 功能 | 實現 |
|---|---|
| 月結齊備度（點名／費率／Cody／代堂） | `buildMonthReadiness()` — 四項硬軟檢查 |
| 逐節證據鏈（學生狀態、原價時點、班型快照、公式、科目 pool） | `LessonCard` metadata 區塊 |
| 分成制審計（個人 60% + pool 10%，含 pool item 清單） | `SplitAuditPanel` |
| 跨模式拆分（Leo/Judy 的 HC + 功課班） | `ModeStreamsPanel` |
| 固定月薪證據（金額、生效期間） | `SalaryEvidencePanel` |
| MPF band 逐步展示 | `mpfBandSteps()` + `TeacherPayFooter` |
| 代堂雙邊標記（代入／代出） | `LessonCard` substitute tags + anomaly list |
| 母名單含 $0 教師 | Cheryl、Emma、Phoebe 在列表中 |
| 版本管理（計算版本號、截止時間） | `VersionBar` + `CalcVersionMeta` |
| CSV 雙格式（對帳用／銀行轉賬用） | `mockCsv.ts` |
| 管理層抽查清單 | `buildManagerSpotChecks()` |
| 提交確認對話框（摘要＋未清項） | `FinancePayrollView` submit dialog |
| 財務／管理層雙版面 | `FinancePayrollView` + `ManagerPayrollView` |

這些不是小功能。原型的方向是對的。

---

## 1. 資訊架構：財務工作台太長

`FinancePayrollView.tsx` 747 行，單一頁面承載了：
- 齊備度
- 摘要 tiles
- 異常列表
- 篩選按鈕
- 教師總表
- 教師明細（展開）
- 人手調整
- Cody 工時

**問題**：Cody 審核 16 人時，上下滾動距離極長。選了老師看明細，總表就看不到了。

**建議**：

```
桌面佈局改為左右分欄：

┌──────────────────────┬──────────────────────────┐
│  左欄（40%）          │  右欄（60%）              │
│                      │                          │
│  齊備度（收合）       │  所選教師明細              │
│  摘要 tiles          │  • 子摘要                 │
│  異常列表            │  • SplitAuditPanel       │
│  篩選按鈕            │  • TeacherLessonStats     │
│  教師總表（可捲動）   │  • TeacherPayFooter       │
│                      │  • Cody WFH（如適用）      │
│                      │                          │
└──────────────────────┴──────────────────────────┘

手機：左欄全寬，點教師後右欄以 bottom sheet 或 push 進入
```

這樣 Cody 選取不同老師時，總表保持在視線內，不需來回 scroll。

---

## 2. 教師總表的「已審」狀態不夠顯眼

目前已審是 checkbox。勾了和沒勾的視覺差異太小。Cody 掃視 16 人時，不容易一眼看出「還有誰未審」。

**建議**：

- 未審的行左側加一條 3px 黃色邊框標記
- 已審的行綠色邊框
- 有異常且未審的行紅色邊框
- 表頭加一個「未審：5/16」計數器，點擊過濾未審

---

## 3. 異常 deep-link 的交互可更直接

目前異常列表點擊會選中該老師。這是對的。但：

- 點擊後還需要人手展開該老師的明細，再 scroll 到出事那節
- 沒有「直接跳到那節」的一鍵操作

**建議**：

異常列表每項加兩個動作：
- 「檢視教師」— 目前行為（選中 + 展開）
- 「直達課節」— 選中教師 + 自動展開 + scrollIntoView 到該 LessonCard + highlight 動畫

---

## 4. Cody 工時的「示範核准」按鈕混淆

目前 Cody WFH 區塊有三個元素：時數輸入、「申報工時」、「示範核准並計入」。

**問題**：「示範核准並計入」按鈕的存在暗示 Cody 可以自己核准自己的工時。正式版中這按鈕不應該出現（或應 disabled 並提示「需管理層核准」）。

**建議**：

正式版：
- Cody 只能「申報工時」（submit）
- 按鈕文字改為「提交工時予管理層核准」
- 提交後狀態變為「已提交，待 Mark/Christine 核准」
- 此時金額仍顯示「—」或「待核准」
- 管理層在 ManagerPayrollView 看到待核准工時，核准後金額才生效
- 移除「示範核准」按鈕

---

## 5. 提交對話框欠「我已確認」強制勾選

目前提交 dialog 列出摘要數字和未清項，但沒有強制 Cody 逐項確認。

**建議**：

提交 dialog 內加一個 mini-checklist：
```
提交前確認：
☐ 已核對全部 16 位教師的逐節計薪明細
☐ 已確認分成制原價池（Mark Yu、Christine Fan）
☐ 已確認代堂歸屬（Liam Lai → Kenneth Li）
☐ 已確認 Cody Cheong 工時申報狀態
☐ 已確認 MPF 計算（Mark、Christine、Sophie、Katie）
☐ 已知悉 1 項已排除項目將由 Mark Yu 跟進：
   • Natalie Kwok — S4 中文 8/12 未點名

[ ] 本人（Cody Cheong）確認以上所有項目已如實核對。
    如有遺漏，願承擔責任。

未勾選最後一項時，「確認提交」按鈕 disabled。
```

---

## 6. 版本欄（VersionBar）未被充分利用

`VersionBar` 有 `onViewDiff` prop 但目前未接入實際 diff 數據。重算後只顯示「版本 #3」+ timestamp，Cody 看不到**改了什麼**。

**建議**：

重算後自動彈出 diff modal（或在 VersionBar 旁顯示紅點 badge 提示「有差異」）：

```
重算差異（版本 #2 → #3）
2026-08-03 14:00 重算

變動：3 人 5 節

• Natalie Kwok — S4 中文 8/12：HC 3→4，+$70
• Liam Lai — S2 數學 8/15：代堂歸屬更正（Kenneth→Liam），+$290
• Cody Cheong — WFH 工時已補：+$600
• Billy Shek — S1 英文 8/8：補點名完成，+$120

以上已自動更新至當前版本。審核狀態已重置，請重新審核上述教師。
```

---

## 7. 管理層核實頁的「抽查」體驗

`buildManagerSpotChecks()` 產生三個抽查項，但目前只在 anomaly alerts 區塊顯示為可點擊項。Mark 的體驗是：

- 點擊抽查項 → 選中該老師
- 但不會自動展開堂數明細
- Mark 需要再點「展開堂數明細（抽查）」按鈕

**建議**：

點擊抽查項時，自動：
1. 選中該老師
2. 展開堂數明細
3. scroll 到相關的 `SplitAuditPanel` 或 `LessonCard`
4. 在該區塊顯示一個短暫的 highlight 動畫

這樣 Mark 點一下就能看到抽查所需的證據，不需三步操作。

---

## 8. 手機適配

目前原型在手機上的問題：

- 教師總表 9 欄太寬，需橫向 scroll
- 左右分欄在手機必然要 stacking
- Cody WFH 輸入區和教師明細混在一起
- sticky footer 在手機上佔用寶貴空間

**建議**（手機版）：

- 教師總表改卡片式：每教師一張卡片，顯示頭像縮寫、姓名、模式、金額、異常標記
- 左右 swipe 切換教師（類似 Tinder 但 for audit）
- 摘要 tiles 改 2×2 或 2×3 網格
- sticky footer 收合為 FAB（floating action button），只在可提交時浮現
- 異常列表預設收合，有異常時顯示紅色 badge

---

## 9. 篩選器狀態反饋

目前篩選按鈕是 toggle 式（「全部」「異常」「未審」…），但：
- 選了哪個 filter 的視覺反饋不夠強
- 沒有顯示「當前篩選下：X 人」

**建議**：

- 當前 active filter 用 filled 樣式（非 outlined）
- filter bar 右側顯示「顯示 5/16 人」
- 加一個「已審」filter（目前只有「未審」）

---

## 10. 鍵盤快捷鍵

Cody 審核 16 人時，純滑鼠操作效率低。

**建議**：

- `J` / `K`：上下移動選擇教師
- `Enter`：展開／收合所選教師明細
- `R`：標記／取消已審
- `X`：排除／取消排除
- `Space`：往下 scroll 一頁（在教師明細內）
- `?`：顯示快捷鍵清單

這些快捷鍵只在 finance view 生效，manager view 不需要。

---

## 11. 微交互細節

| 現狀 | 建議 |
|---|---|
| 標記已審時無動畫 | checkbox 打勾時加一個短暫的綠色 pulse |
| 提交成功後無明確反饋 | 提交後 toast：「已提交予管理層核實。Mark Yu 將收到通知。」 |
| Cody 工時輸入後金額不即時更新 | 輸入時數後，旁邊即時顯示預估金額（$60 × N = $X） |
| LessonCard 的學生名單如果很長 | 預設顯示前 5 人 +「還有 3 人」展開 |
| 人手調整金額無格式驗證 | 輸入非數字時邊框變紅 + 提示「請輸入有效金額」 |

---

## 12. 彙總：優先改善建議

| 優先 | 建議 | 影響 |
|---|---|---|
| 🔴 P0 | 左右分欄（桌面），解決 scroll 距離過長 | 審核效率 |
| 🔴 P0 | 重算 diff modal（接入實際數據） | 審計可信度 |
| 🔴 P0 | 提交前強制 mini-checklist | 責任界線 |
| 🟡 P1 | 已審狀態視覺強化（邊框顏色 + 計數器） | 掃視效率 |
| 🟡 P1 | 異常 deep-link 直達課節（非只選老師） | 操作步數 |
| 🟡 P1 | 管理層抽查點擊自動展開 + scroll + highlight | 管理層體驗 |
| 🟡 P1 | Cody 工時移除「示範核准」按鈕 | 職責分離 |
| 🟢 P2 | 手機卡片式佈局 | 手機可用性 |
| 🟢 P2 | 鍵盤快捷鍵 J/K/Enter/R/X | 審核效率 |
| 🟢 P2 | 篩選計數器 + active state | 掃視效率 |
| 🟢 P2 | 微交互（pulse、toast、即時預估） | 操作信心 |
