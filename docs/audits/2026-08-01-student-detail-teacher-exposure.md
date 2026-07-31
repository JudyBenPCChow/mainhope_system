# 學生詳情 · 老師過度暴露報告（R1／R2 定案）

| 欄位 | 值 |
| --- | --- |
| 日期 | 2026-08-01 |
| 範圍 | `mgmt_role=teacher` 經 deep-link 進入 `/Students/:id`（`StudentDetailView`） |
| 方法 | 程式碼盤點＋既有 RLS／路由守衛對照；非真機點擊 |
| 產品定案 | **R1**：老師不可見金錢相關資料／操作；**R2**：老師不可代學生請假（學生詳情） |
| 跟進 | [role-ops-hardening.md](../backlog/role-ops-hardening.md) · [實作計劃](../plans/2026-08-01-student-detail-teacher-hardening.md) |
| 前序 | [老師桌面／手機對照](./2026-07-31-teacher-desktop-mobile-parity.md) W5 · [對抗性稽核](./2026-07-30-role-ops-adversarial.md) |

## 總評

對抗性 P0／P1 **已清**。殘洞集中在**學生詳情**：列表 `/Students` 會 redirect 老師，但詳情路由**無角色守衛**，UI 仍呈現行政級控制台（繳費、價格、新增請假、改報讀等）。DB／RLS 多數已擋老師寫入與付款讀取，但畫面仍「看起來可以做」——屬典型 **UI 旁路／假開放**。

產品今日定案後，本檔鎖定「要收咩、唔收咩」；改法見實作計劃。

---

## 1. 到達路徑（為何老師仍入得去）

| 表面 | 行為 |
| --- | --- |
| 側欄「學生管理」 | nav 僅 `admin`／`alien` |
| `/Students` 列表 | `Students.tsx`：`teacher` → `/Classes` |
| `/Students/:studentId` | **無** `RequireMgmtRoles`；任何持有效 JWT 且 RLS 允許讀該生嘅老師可開 |
| 常見入口 | 班別詳情名冊、點名紀錄、一對一披露等連到學生詳情 |

結論：唔係「老師有學生管理選單」，而係**教學流程 deep-link 開咗成個行政詳情頁**。

---

## 2. 而家老師喺詳情睇到／見到嘅控制

`StudentDetailView` 內僅兩處 `isMgmtStaff()`：刪出席、Parent Portal 邀請。其餘 tab／按鈕對老師**一律顯示**。

### 2.1 金錢（R1 核心）

| 表面 | 暴露 | 老師實際 DB 能力（現行 RLS） |
| --- | --- | --- |
| Tab「繳費紀錄」 | 金額、付款日、方式、單號、狀態、總繳堂數 | `payments` 無 teacher policy → 通常空表／錯，但 UI 仍開 |
| 「新增繳費」 | 導向 `/Payments?studentId=` | 頁有 `RequireMgmtRoles` → 撞 placeholder；**按鈕本身誤導** |
| 「列印」「作廢」 | 詳情內嵌，唔使離頁 | 讀／作廢會失敗（RLS）；UI 仍顯示 |
| 報讀 tab「每節 $…」 | `pricePerLesson` | enrollment SELECT 可能帶價 |
| 報讀餘額「已繳／已綁／待補」 | 堂數帳＝學費節奏訊號 | 部分可讀；屬金錢衍生 |
| 更動紀錄 | 若有付款活動列 | 付款 SELECT 失敗則通常無；仍應假設勿露 |

### 2.2 請假（R2）

| 表面 | 暴露 | 老師實際 DB 能力 |
| --- | --- | --- |
| Tab「請假紀錄」列表 | 自己班／補堂相關請假 | SELECT 允許（合理教學需要） |
| 「新增請假」＋完整精靈 | 班別／堂次／連堂／補堂類型 | `leave_makeup_records` INSERT 僅 mgmt → **寫入會失敗**，UI 仍開 |
| 列點進 `/LeaveManagement` | deep-link | 頁已 guard → placeholder |

### 2.3 其他過度開放（非今日必做，但報告標明）

| 表面 | 問題 |
| --- | --- |
| 基本資料「儲存變更」、親友增刪 | RLS 老師通常無法 UPDATE；UI 像可改全檔 |
| 「新增報讀／退讀／手誤清除」、改 entitled 堂數 | Phase C enrollment 寫入 mgmt only；UI 仍開 |
| 家長電話／地址／備註 | 讀得到聯絡欄；backlog「暫不做」全隱藏，但報告承認敏感 |

---

## 3. 產品定案（2026-08-01）

### R1 — 金錢

> 老師唔應該見到學生太多資料，**特別係金錢**。

| 判決 | 內容 |
| --- | --- |
| **必須收** | 整頁隱藏「繳費紀錄」tab；唔顯示新增／列印／作廢 |
| **必須收** | 報讀表面唔顯示單價（每節 $）、已繳／付款衍生餘額文案與數字 |
| **必須收** | 老師角色唔呼叫付款列表／總繳堂數／作廢相關 fetch（避免空錯與日後 RLS 鬆脫洩漏） |
| **必須收** | 更動紀錄唔展示付款類活動（或老師唔拉付款段） |
| **唔改路由策略** | 仍允許老師 deep-link 入「教學用」學生詳情（點名／請假一覽／未來排程）；**唔**改成整頁 `RequireMgmtRoles`（否則班別名冊鏈會死） |

### R2 — 請假

> 老師**唔可以**幫學生請假。

| 判決 | 內容 |
| --- | --- |
| **必須收** | 學生詳情隱藏「新增請假」及請假 dialog／submit 路徑 |
| **保留** | 請假**一覽**（唯讀）— 教務上要知邊個請咗假 |
| **保留、本票唔動** | **老師請假精靈**（`TeacherLeaveWizard`：老師本人請假／代堂流程）≠「代學生喺學生詳情開請假」；勿混刪 |
| **文件** | 寫明：學生請假／補堂行政入口＝`LeaveManagement`（admin／alien）；老師只讀自己班相關紀錄 |

### 刻意延後（本票不做）

- 家長電話／地址全面對老師隱藏（既有「暫不做」）
- 報讀／基本資料寫入按鈕全面隱藏（建議下一小票；RLS 已擋，優先級低於金錢視覺）
- 新增 `manager` 角色（另題）

---

## 4. 風險若唔改

1. **營運誤導**：老師以為可以收款／作廢／請假，撞 RLS 或 placeholder → 支援成本、以為系統壞。
2. **資料外洩面**：若日後誤開 payments SELECT 給老師，UI 已就緒會即時曝光金額。
3. **信任／合規**：學費屬敏感；「列表藏、詳情露」比完全開放更易被忽略。

---

## 5. 驗收標準（對齊計劃）

老師帳號 deep-link 自己班學生詳情：

- [ ] 無「繳費紀錄」tab；URL／state 無法靠切 tab 見到付款列表
- [ ] 報讀區無「每節 $」、無已繳／付款餘額數字
- [ ] 無「新增請假」；無法開請假 dialog
- [ ] 仍可見：基本資料（現況）、報讀班名／狀態（無價）、上課紀錄、請假一覽、未來排程
- [ ] admin／alien 行為不變（全部 tab／按鈕仍在）
- [ ] 老師請假精靈路徑不受影響

---

## 6. 相關檔案索引

| 觸點 | 路徑 |
| --- | --- |
| 詳情主體 | `src/components/students/StudentDetailView.tsx` |
| 列表 redirect | `src/pages/Students.tsx` |
| 詳情路由 | `src/pages/StudentDetail.tsx`、`src/App.tsx` |
| 角色 helper | `src/lib/mgmtRole.ts`（`isMgmtStaff`） |
| 付款／請假頁守衛 | `RequireMgmtRoles` on Payments／LeaveManagement |
| RLS | `20260615180000_rls_phase_b_teacher_scope.sql` 等 |
