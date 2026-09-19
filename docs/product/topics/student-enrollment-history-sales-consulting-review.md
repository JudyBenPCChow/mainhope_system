# 顧問評審：歷年科目（銷售回流）

| 欄位 | 值 |
| --- | --- |
| 性質 | 外部顧問評審，非內部定案文件 |
| 評審對象 | [`student-enrollment-history-sales.md`](./student-enrollment-history-sales.md)（2026-09-19 立案版） |
| 日期 | 2026-09-19 |
| 評審角度 | 產品口徑一致性、資料可信度、銷售名單精準度 |
| 方法 | 逐條核對現行程式碼與 DB schema，非只讀文件 |

---

## 一、結論

**現況診斷準確，方向正確，但新口徑有內部矛盾，建議先收窄再開工。**

文件對「宣傳配對現況缺口」嘅四條診斷，我逐條核對過程式碼，全部成立。呢部分做得好，係一份有做功課嘅方案。

但文件自己引入嘅新口徑，同佢自己訂立嘅「完整閉環（宣傳配對＋學生檔）」互相打架：同一個學生，兩個畫面會得出相反結論。另外有一個時序陷阱，會令新功能喺招生旺季自動失效。

**建議：拍板句 1 同 5 之間要補一條「單一口徑」約束；未補之前唔好開工。**

---

## 二、已核實正確嘅部分

| 文件講法 | 核實結果 | 依據 |
| --- | --- | --- |
| 「曾讀本科」只算 26SM 就讀中專科 | ✅ 成立 | `promotionMatchQueries.ts:100` |
| 不含 2526 正式報讀科目 | ✅ 成立（2526 只出一個 boolean） | `promotionMatchQueries.ts:266` |
| 不含已退讀 | ✅ 成立（連 fetch 都寫死只取就讀中） | `promotionMatchQueries.ts:135` |
| 按學生不列出該生未續科目 | ✅ 成立 | `StudentMatchBundle` 無此欄 |
| `legacy_student_subject_enrollments` 表已有 `subject_id` | ✅ 成立，且與 `courses.subject_id` 指向同一張 `subjects` 表 | migration `20260721163734:23` |
| 學生詳情「報讀班別」不改 | ✅ 合理，該頁已有本學年／過往／已退讀三分 | `enrollmentYearDisplay.ts:47` |
| 任教老師用 `classes.teacher_id`，非代堂 | ✅ 成立（代堂係 `schedules.original_teacher_id`） | `classQueries.ts:946` |
| `?studentId=` 需要新做 | ✅ 成立，宣傳配對現時完全無讀 URL 參數 | `PromotionMatchView.tsx` |
| 「本學年有報」語意描述 | ✅ 描述準確 | `enrollmentYearDisplay.ts:35` |

---

## 三、核心問題（按嚴重程度）

### 3.1 「未續」與「現未讀本科」係兩個 predicate —— 閉環本身斷開

文件一句話講「完整閉環＝宣傳配對（行動）＋學生檔歷年科目（語境）」，但兩邊算「有無報」用嘅係唔同嘢：

| 表面 | 用嘅 predicate | 依據 |
| --- | --- | --- |
| 未續（新功能） | `isCollectableEnrollment` —— 睇**日曆**，且 `classKind === "private"` 直接回 true | `enrollmentYearDisplay.ts:35` |
| 現未讀本科（現有） | `hasCurrentSubject` —— 睇**寫死常數 "2627"** ＋ 就讀中 | `promotionMatch.ts:251` |

**具體反例（私人課程橫跨學年係常態）：**

一個學生 2526 有一對一中文（`classKind: private`）：

- 宣傳配對：`hasCurrentSubject("CHI")` → 2526 ≠ 2627 → **false** → 佢出現喺 2627 中文班宣傳名單，標「現未讀本科」
- 學生檔：`isCollectableEnrollment({ classKind: "private" })` → **true** → 本學年有報中文 → **不算未續**

同一學生，一邊叫你去追，另一邊話已續。清單標籤同宣傳配對講相反嘅話，銷售同事會先信邊個？

### 3.2 暑假（7–8 月）「未續」會自動清空 —— 正好係招生旺季

`academicYearLabelFromStartDate` 喺 7／8 月回 `26SM`，`listCurrentEnrollmentYearLabels` 就回 `["26SM", "2627"]`（`courseCode.ts:174`、`enrollmentYearDisplay.ts:10-16`）。

於是明年 7–8 月，一個只讀咗 26SM 中文、未報 2627 嘅學生，`isCollectableEnrollment` 回 **true** → 未續標籤消失。但宣傳配對寫死 2627，照樣當佢「尚未報讀 2627」。

**銷售最需要呢張名單嗰兩個月，清單同宣傳配對講相反嘅話；9 月開學又自己彈返出嚟。** 呢個唔係資料問題，係把一個日期依賴引入去一個跨學年運作嘅閉環度。

文件有提「學年常數寫死」，但當佢係既有狀況描述；實際上係**新功能自己帶入去嘅**。

### 3.3 「曾讀」無時間下限 —— 同文件自己引用嘅零售類比相反

拍板句 1 定義「曾讀＝目標學年以外嘅正式報讀」，**無下限**。中一讀過中文、之後三年讀英數讀得開心嘅學生，年年都會出現喺中文回流名單。

文件 §同類產品 引零售區隔（「曾買該品、本期沒買」）做參考 —— 但零售區隔通常有 window（近 90 日／上一季），正正係令佢有轉化率嗰個元素。**引咗個類比，掉咗令佢成立嗰個 window。**

原本 26SM 係高 recency 定義，擴到全學年係一個靜默嘅 precision／recall 交換。名單越長越唔準，而呢個係 WhatsApp 直接接觸家長嘅動作 —— 誤觸嘅代價係家長觀感，唔係單單一個數字。

---

## 四、其他缺口

| 項目 | 問題 |
| --- | --- |
| **單堂／單期未定義** | `isFullTermEnrollment`（`promotionMatch.ts:34`）已存在但文件完全無用。一個 26SM 單堂中文今日已經算「曾讀」，擴到全學年之後噪音會放大。要明文寫「單堂不算曾讀」。 |
| **legacy row 撐唔起驗收條件** | 拍板句 4 要「學年、任教老師、報讀日期齊」，但 legacy 表只有 `period_start`／`period_end`（2026-01-01～06-30），無學年標籤、無老師、無班別。驗收條件對 legacy 來源嘅 row **根本無法達成**，要另定顯示方式。 |
| **`class_kind === "group"` 唔係功輔嘅保證** | `resolveClassKind` 只會由 subject regex 推 `private`，**唔會推 `homework`**（`privateClassKind.ts:52-60`）。一個 `class_kind` 係 `null` 或 `"group"` 嘅功輔班，會直接通過 `isPromotableTargetGroupClass` 入到 2627 專科宣傳名單。拍板句 3 係資料假設，唔係程式保證。 |
| **`course_id` 可為 null → 假陽性** | `classes.course_id` 係 `on delete set null`（migration `20260507194000:43`），而 `subject_id` 只經 `courses.subjects` 取得（`classQueries.ts:124`）。無掛 course 嘅班 → `subjectId` null → 學生明明報咗 2627 中文都會被標「未續：中文」。**假陽性係銷售名單最傷嘅錯** —— 叫同事去追一個已經報咗嘅人。 |
| **清單標籤粒度不夾** | 現有標籤係 `enrollmentClassLabel` ＝ 課程名＋course code（course-level，`studentQueries.ts:794`）；新標籤「未續：中文」係 subject-level。兩個並排會唔一致。且 `fetchEnrollmentSubjectsByStudentIds` 無 select `subject_id`，要加 join。 |
| **詳情取老師名要加 join** | `ENROLLMENT_CLASS_EMBED` 有 `teacher_id` 但無 `teachers(full_name)`（`studentQueries.ts:750`）。現時報讀班別頁不顯示老師，所以係新增工作。 |
| **legacy 匯入未證實跑過** | repo 內無 report、無 apply 紀錄；匯入 script 係 regex 配 Notion 自由文字，而且**包含「功課輔導」→ HWK**。驗收寫「2526 legacy 同科亦出現」之前，應先確認表內有 row 及科目分佈。 |
| **開工閘未含資料驗證** | 文件寫「無擋路工程」。程式上成立，但**資料上未驗**：legacy 表有無資料、有幾多班無 `course_id`、有無 `class_kind` 異常嘅功輔班 —— 三者都會直接影響驗收。建議加入開工閘。 |

---

## 五、建議

### 5.1 最小修正：未續與「現未讀本科」共用同一 predicate

建議改為釘死常數，不用日曆：

```
就讀中 && isPromotionTargetYear(academicYearLabel) && subjectId 相同
```

一次過解決 3.1 同 3.2。

**注意**：不要改 `isCollectableEnrollment` 本身 —— 佢仲有繳費頁用途（`PaymentsPageView.tsx:585`）。應另立一個宣傳配對專用 predicate。

**私人課程點算要明文拍板**：我傾向「私人中文不算已續中文」，因為產品線不同（同拍板句 3 一致）。

### 5.2 「曾讀」分層

建議至少分兩層，預設 filter 留在熱層：

- **熱**：上一個完整學期曾讀（即現行 26SM 口徑，或最近一個曾讀學年）
- **冷**：歷年曾讀（含 legacy）

`promotionMatch.ts` 已有 `isHotFullTerm` 呢種分層慣例可以照跟。

### 5.3 假陽性防護

凡是 `subjectId` 為 null 的報讀，**不得**用作判斷「未續」——寧可漏，不可錯報。因為錯報的代價係同事白做一次接觸＋家長覺得混亂。

---

## 六、開工前要答嘅問題

1. 私人課程（一對一／一對二）屬唔屬於「同一科已續」？
2. 「曾讀」要唔要設時間下限？定分熱／冷兩層？
3. 單堂／單期報讀算唔算「曾讀」？
4. legacy 2526 row 在「歷年科目」分頁點顯示（無學年／無老師／無日期）？
5. `legacy_student_subject_enrollments` 實際有幾多 row？科目分佈？功輔（HWK）佔幾多？
6. production 有無 `class_kind` 非 `homework` 嘅功輔班？有無無 `course_id` 嘅 2627 專科班？

---

## 七、總評

文件嘅**現況盤點質素高**，四條缺口全部核實成立，值得保留。

問題出在**擴充口徑時沒有同步統一 predicate**，導致新舊表面互相矛盾；加上把日期依賴引入跨學年閉環，同「曾讀」無時間界，會令名單喺最需要嘅時候最唔準。

以上三點都在產品口徑層面，不是實作難度問題 —— 補齊第六節六條問題，方案就可以開工。
