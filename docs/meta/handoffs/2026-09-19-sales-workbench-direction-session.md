# Session HANDOFF：銷售工作台方向（新舊方案＋舊年科目＋現況盤點）

| 欄位 | 值 |
| --- | --- |
| 日期 | 2026-09-19 |
| 主題／backlog | 新方案 [`docs/product/topics/student-enrollment-history-sales.md`](../../product/topics/student-enrollment-history-sales.md)（`open`，未入 git）。舊方案在工作樹 [`docs/product/topics/sales-followup.md`](/Users/hoiyingfan/Desktop/mainhope_sales-followup/docs/product/topics/sales-followup.md)（`in_progress`，未 commit）。**統一分題尚未寫**。兩邊都未進 `BACKLOG.md` |
| 分支／工作樹 | 本檔在 `main`（`/Users/hoiyingfan/Desktop/mainhope_system`）。舊方案在 `/Users/hoiyingfan/Desktop/mainhope_sales-followup`，分支 `feature/sales-followup`，比 `origin/main` 落後 34 個提交 |
| 取代 | 同日 [`2026-09-19-sales-scheme-merge-session.md`](./2026-09-19-sales-scheme-merge-session.md) 的「請使用者拍板入口」已過時。衝突表仍可當背景，**勿再問宣傳配對是否為找人真源** |
| 相關資料工程 | [`2026-09-19-onedrive-historical-subject-backfill-session.md`](./2026-09-19-onedrive-historical-subject-backfill-session.md)（2324–2526 科目回填；**dry-run 未跑、未寫入 production**） |

## 目標

- 把「歷年科目／宣傳配對」與「前台銷售跟進」整成可開工的第三條路，並把 OneDrive 舊年紀錄與現有頁面重疊一併算進去。
- 本會話只做討論與方向。**沒有改程式、沒有改分題、沒有 commit、沒有查庫、沒有匯入 OneDrive。**

## 使用者已同意（勿再問）

上一輪四題，使用者說「你提及的問題都正確」：

1. 日常入口＝**新的銷售工作台**；宣傳配對只負責配班。
2. **全體在讀加科拿掉**；只出「缺了以前讀過的專科」。
3. 退讀挽回改成 **退讀該科、該科現在沒有就讀中**（不是整個人退光才算）。
4. 活動檔仍可留（見下方待拍板：第一波一檔還是多檔）。

另外：不必只採用新或舊方案，**可以重新設計一頁**。

## 已完成（本會話結論）

方向如下。尚未寫回分題，**不是已簽收產品句**；但新會話不要從「新 vs 舊二選一」重開討論。

### 產品形狀

- **銷售工作台**（建議路由仍 `/SalesFollowUp`，側欄「學生與報讀」）：每日找人、記接觸、主責、下次聯絡日、回來月、階段。列單位＝**學生 × 缺的專科**，不是一人一類。
- **宣傳配對** `/PromotionMatch`：配班、年級／時段、海報、該班 WhatsApp。補與工作台同一 predicate、近／遠層、`?studentId=`。**不當每日佇列、不做階段。**
- **學生詳情**：新分頁「歷年科目」（報讀班別之後）＝舊年科目語境；基本資料保留銷售摘要（接觸／階段／下次聯絡／主責／興趣特點）。**不改**「報讀班別」營運卡片。清單不加「未續：中文」篩選或標籤。

舊方案可搬：活動、階段、接觸（含聯絡對象身分）、主責、下次聯絡日、今日待回訪、興趣／特點、WhatsApp 短範本、報讀閉環、四表（分題稱已在 production，**未查庫**）。

必須改寫：`classifySalesFollowupStudent`（一人一類 → 一人多科未續）。在**最新 `main`** 搬跟進層，**不要**把落後 34 個提交的分支原樣合併。

### 名單規則（按科；禁止日曆）

- **現已讀該專科**＝`2627`、就讀中、專科班、同一 `subjectId` 且非空。私人課程、功課輔導班不使該科已續。`subjectId` 空不得判未續。
- **禁止**用 `isCollectableEnrollment`（繳費頁仍用它）。
- **單堂不算曾讀**；暑期第一期／第二期／兩期全報算。不可用 `isFullTermEnrollment`（會誤殺單期）。
- 功輔排除以科目 `HWK` 及班別代碼 `HWKP` 為準，不靠 `class_kind`。

原因標籤（同一 predicate）：

| 標籤 | 誰 |
| --- | --- |
| 未報該科 | 曾讀該專科，2627 該科無就讀中，且 2627 沒有其他專科 |
| 缺科 | 同上，但 2627 已有其他專科 |
| 退讀該科 | 2627 該專科曾報而退讀，現在該科無就讀中 |

報讀閉環也要按科：報了中文只收中文這條。

### 近／遠層（已因 OneDrive 修正）

舊結論「預設只看 26SM」**作廢**。暑期沒來是常態；2627 續報主力是 2526 常規舊生。近層改為寫死常數（舊方案「上一常規＋上一暑期」的意思，不用日曆）：

| 層 | 曾讀來源 | 載入 |
| --- | --- | --- |
| **近（預設）** | `26SM` 非單堂專科 ＋ `2526` 專科（系統報讀或 `legacy_student_subject_enrollments`，排除功輔） | 開頁 |
| **遠（可選）** | `2324`、`2425`（幾乎全是 OneDrive） | 按需；未開不查全表 |

「曾讀」只當正面證據：來源科目格空白 ≠ 沒讀過。寧可漏。遠層入口須看得見人數。

OneDrive 回填（**尚未寫入**）：計劃 208 人、455 條事實；`source_system = onedrive_xlsx`；沿用 `legacy_student_subject_enrollments`；不造老師／報讀日期。2526 會與既有 Notion 142 列互補，匯入 SQL 已按同學年同科去重。歷年科目畫面：正式報讀列（26SM 起）欄位齊；legacy 標「舊紀錄」，OneDrive 期間可對應學年標籤顯示，仍不填老師。

近層可在匯入前開工（26SM 報讀＋ Notion 2526）。**遠層與完整 2526 科目等 dry-run 核完再匯入。**

### 現有功能：重疊與不要合併

真正打架的只有「找舊生再報專科」三處口徑不一致：學生管理「活躍生」（說明誤寫用於找出未續報）、宣傳配對、舊 `/SalesFollowUp`。日後改活躍生說明，清單不加第二套銷售篩選。

**不要併進工作台**：試堂紀錄／試堂邀請／名單控管（另一條漏斗；「已流失」只用於試堂）、家長報讀申請、前台精靈、增退紀錄（審計，可當退讀事實來源）、人數報表、營運總覽退讀／欠費、學費追收、話術庫、收件匣、聯絡資料更新（8 月一次性；宜從側欄收起，見 `dead-surface-cleanup.md`，不當銷售子檔）。

側欄「學生與報讀」已有十項。工作台當早上開機頁；宣傳配對當配班工具；試堂維持獨立。聯絡更新／試堂邀請／銷售跟進的表不必合成一張 schema。

班別、排程、點名、功輔、收費、計糧與本題無關，不要為回流去改。首頁常用三鍵不必加銷售跟進。

## 未完成／卡住

1. **兩件待拍板**（其餘入口問題已同意，勿重問四題）：
   - 工作台第一波：多檔活動（開學續報／10 月加科），還是先一檔「本學年專科回流」？（建議預設：先一檔）
   - 試堂邀請要不要在工作台列上露出入口？（建議預設：不露出，當另一條路）
2. 統一分題未寫；兩份舊分題產品句尚未收斂。
3. OneDrive dry-run 未跑；四表是否已在 production 未查。
4. `scripts/import_onedrive_student_subjects.py` 在 `main` 工作樹未追蹤；`/tmp` 產物會被清，可重建。

## 下一步（給新會話）

1. 讀本檔。不要開工改碼。不要從新／舊方案二選一重開。
2. 請使用者答上面兩件待拍板，或確認採用建議預設。
3. 拍板後先寫**一份**統一分題（可改寫 `student-enrollment-history-sales.md`，或新開 `sales-workbench.md` 並把兩份舊檔指向它）。**Feature 不改 `BACKLOG.md`。**
4. 實作前：查庫核對 `sales_campaigns` 四表；OneDrive 按該手交跑 dry-run，核完才 import。遠層不要在匯入前假裝有 2324／2425。
5. 在最新 `main` 開 branch 搬跟進層並改寫歸類／predicate；舊 worktree 只當參考，不 merge。

## 開局必讀（精簡）

- `AGENTS.md`
- **本檔**（方向真相，直至寫進分題）
- [`docs/product/topics/student-enrollment-history-sales.md`](../../product/topics/student-enrollment-history-sales.md) 與 [`sales-followup.md`](/Users/hoiyingfan/Desktop/mainhope_sales-followup/docs/product/topics/sales-followup.md)（規格細節；口徑以本檔近／遠層與工作台為準）
- 若做資料：[`2026-09-19-onedrive-historical-subject-backfill-session.md`](./2026-09-19-onedrive-historical-subject-backfill-session.md)

## 勿再踩

- 不要再搜名叫「流失率」的分題；舊方案就是銷售跟進。
- 不要把空班、暑期未續常規、學期完仍就讀中當成缺陷。
- **`SNFNL` 在 `students.old_student_id`，不是 `student_code`。**
- OneDrive 腳本與本題**有關**（同日較早的 merge handoff 寫「無關」已過時）。`__pycache__` 仍不要納入。
- 不要改 `isCollectableEnrollment`。不要用 `isFullTermEnrollment` 判斷曾讀。
- 不要把 `feature/sales-followup` 原樣合入。

## 明確唔做

- 不改 `BACKLOG.md`。
- 不實作、不 commit、不開 PR、不套 migration、不跑 OneDrive import（除非使用者明天明確叫做資料）。
- 不合併試堂流失與專科回流名單。
- 不把全體今學年就讀中灌進加科。
- 本檔不複製兩份分題的完整產品句與驗收清單。
