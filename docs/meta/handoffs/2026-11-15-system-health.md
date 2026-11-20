# 系統健康度稽核紀錄

| 欄位 | 值 |
| --- | --- |
| 日期 | 2026-11-15 |
| 庫 | MainHope_production（`gudmbilboyhouotilrvt`）唯讀 |
| 方法 | 五路並行（營運紀錄、收費／已繳堂數、對抗性 RLS、界面靜態、錯題本復發）＋父層覆核 SQL |
| 營運窗 | 香港 2026-11-01 至 2026-11-15（今日尚未下課不計未點名） |
| 結論 | 沒有 P0。10 月 16 日之後專科計費出席沒有新的少扣或多扣；校舍假期沒有再被標成取消。未關帳的是錢與權限。 |

畫布（可並排開啟）：工作區 `canvases/system-health-2026-11-15.canvas.tsx`。本檔＝文字真源。

## 一句

張馨文半價試堂重複出單 $150；20 口專科已繳堂數 `remaining_lessons` 比事件帳本多合共 58 堂；Data API 可直接改尚餘；功輔月費表對全體老師可讀。點名未完成與試堂待跟進屬前線隊列，不是系統壞。

## 不當缺陷（本輪不列）

對齊 `.cursor/rules/ops-data-check.mdc`：空班、暑期未續常規、學期結束仍就讀中、未繳仍上點名紙、校舍假期當日沒有排程、功輔少於 7 人不開第二房、專科池按年級共用。測試班／老師名含 Test、HWKP 不入前線完成度。未繳名單本次不列。

## 規模

| 指標 | 數量 |
| --- | --- |
| P0 | 0 |
| P1 | 6 |
| P2 | 8 |
| 本月已下課專科整堂未點名 | 20 |
| 已現場試堂結果仍待跟進 | 5 |
| 2627 專科池 | 166 |
| 池 remaining ≠ 事件淨額＋調整 | 22（差距合計 +58 堂） |

---

## P1：錢與權限

### P1-1 張馨文半價試堂連出兩張已收款單

- **確認**：已確認（production 單據）
- **對象**：學生編號 `20262013`；`2627-ENGS4004-B`
- **證據**：`MX-RC-20261016-0004`（10:53，香港支付寶，$150，描述半價試堂）沒有鑄池、沒有掛試堂；7 分鐘後 `MX-RC-20261016-0005`（11:00，$150）才鑄 trial 1 堂並掛 10-17 試堂。試堂列只有一筆。2627 專科「已收款且堂數 > 0 卻無 mint」僅此 1 筆。
- **影響**：多收 $150。
- **建議**：作廢 0004 並退 $150；核對收款精靈可否連按兩次出單。

### P1-2 專科池 remaining 高於事件帳本

- **確認**：已確認（欄位與事件對不上）；未能還原是哪一次 RPC／人手改 remaining 沒寫事件
- **口徑**：`remaining_lessons − Σ entitlement_consumption_events.delta_lessons − Σ entitlement_pool_adjustments`
- **證據**：166 口池中 22 口對不上（21 口 remaining 偏高、1 口偏低，差距合計 +58 堂）。計費出席與消耗事件一致，是欄位未跟。學費追收看 remaining，現況會少計已扣堂、少追收。
- **建議**：以消耗事件重算 remaining。混級 `class:` namespace 殘跡（林芍延／梁景維）與年級共用池分開處理。

前 10 口（已剔除 `class:` 混級合併殘跡）：

| 學生 | 編號 | namespace | remaining | 事件淨額 | 差距 |
| --- | --- | --- | ---: | ---: | ---: |
| 蕭馥鎣 | 20261552 | S6 | 18 | 11 | +7 |
| 朱震軒 | 20261623 | S6 | 27 | 21 | +6 |
| 劉子軒 | 20261884 | S3 | 10 | 5 | +5 |
| 莫麗琪 | 20261968 | S4 | 8 | 4 | +4 |
| 趙佳鑫 | 20261593 | S6 | −1 | −5 | +4 |
| 羅善瀧 | 20261898 | S2 | 9 | 5 | +4 |
| 羅兆斐 | 20261760 | S6 | 9 | 6 | +3 |
| 蔡汶軒 | 20261711 | S6 | 10 | 7 | +3 |
| 黃慧淇 | 20261853 | S6 | 8 | 5 | +3 |
| 林芍延 | 20261931 | S4 | 1 | 3 | +3 |

其餘對不上：葉熙桐 S6 +2、林芍延 `class:` +2、潘子翹 S3 +2、鄧宇童 S3 +2、梁天因 S5 +2、林藝涵 S4 +2、曾穎 S6 +1、吳梓甄 S6 +1、葉梓軒 S4 +1、秦錦怡 S1 +1、梁景維兩口 `class:` +1 與 −1。

### P1-3 同一取消堂寫了兩次 `makeup_of=`，兩人被扣兩堂

- **確認**：已確認
- **證據**：取消堂 `2627-SCIS3001-A` 2026-10-11（老師病假）→ 加堂 `SCIS3001-A` 10/24 與 `CHEMS5001-A` 10/31 均寫同一 `makeup_of=eac0fa6b-ceed-438b-a75b-cf3732d95941`。何迪寶、鄧宇童兩堂皆「現場」，消耗各 −1 兩次；張泳彤只上第一次。未取消標記對數 `n_active=2`，全庫僅此 1 組。
- **建議**：保留兩個 `makeup_of=` 標記本身（見 `.cursor/rules/makeup-of-marker.mdc`）。財務核對 10/31 化學加堂是否應還 1 堂。分批補回不要再寫同一標記。

### P1-4 已繳堂數可經 Data API 直接改

- **確認**：已確認（live `pg_policies`）；未對真人列執行 UPDATE
- **證據**：`student_entitlement_pools` UPDATE＝職員且（`attendance.take` ∨ `students.enroll` ∨ `payments.create` ∨ `entitlements.correct`）。老師另有 `attendance.take`＋`teacher_can_access_class`。Trigger 只禁老師改非 `remaining_lessons` 欄，明確允許改餘額。`apply_attendance_entitlement_delta` 為 DEFINER，擋不住 REST UPDATE。產品 G2 直接改只限外星人。
- **建議**：表 UPDATE 收窄至 `entitlements.correct`；點名消耗只走 DEFINER RPC。

### P1-5 功輔月費 SELECT 用 `classes.read`，全體老師可讀金額

- **確認**：已確認（政策＋seed）；畫面 `/HomeworkTutoring/Fees` 有角色路徑擋，不是 RLS
- **證據**：`homework_tutoring_monthly_charges` SELECT＝`payments.read` ∨ `classes.read` ∨ `is_mgmt_staff()`，無列範圍。老師 seed 有 `classes.read`。違反「老師不可見金錢」。11 月該表 0 列（月費頁已改讀繳費紀錄）；8 月歷史列仍在。
- **建議**：SELECT 改 `payments.read`＋職員；老師不要全表。

### P1-6 PostgREST 1000 列截斷：多處子表仍無翻頁

- **確認**：靜態；2026-10-24 盤點兩期宣告窗最重 80 人已 920 列
- **證據**：追收宣告已日期窗＋翻頁。仍只 `forEachIdChunk`、無 `.order(id)`＋`.range`：`tuitionChaseQueries.ts` `fetchAttendanceMarksByStudentSchedule`、`fetchRemainingIndex`、`fetchScheduleUnitsInRange`；`attendanceQueries.ts` `fetchScheduleIdsWithAttendance`；`staffPerformanceQueries.ts` `fetchEnrollmentsForPricing`（失敗 `console.warn` 後繼續）。分題 [`postgrest-complete-read.md`](../../product/topics/postgrest-complete-read.md) 仍 `open`。
- **建議**：共用翻頁；一頁失敗整次失敗。勿把人數變少當成已修。

---

## P2：資料與界面

| 編號 | 領域 | 標題 | 證據 | 建議 |
| --- | --- | --- | --- | --- |
| P2-1 | 排程 | 專科 2027-06-30 仍有一堂正常排程 | `2627-MATHS3001-E` 星期三 16:30–17:45，`status=正常`、`is_extra_lesson=false`。2027-06-29 專科未取消堂 0。最後上課日應為 2027-06-28 | 刪該列，不要標成取消 |
| P2-2 | 收費 | 鍾梓晴轉正單開成原價試堂，鑄錯池 | `20262009`。10-14 半價單 `MX-RC-20261014-0001` $150 正確鑄 trial；10-24 `MX-RC-20261024-0002` 描述「試堂（原價試堂）」$300 再鑄 trial +1。同日現場扣專科池（remaining −1），trial 尚餘 1 | 把 $300 視為單堂學費：clawback trial、改鑄專科池 |
| P2-3 | 界面 | 進行點名「今日堂數」載入／失敗顯示 0 | `RollCallPage.tsx`：loading 時 `rollCallEntries.length` 為 0；`catch` 把 `schedules` 清成 `[]`，空狀態當成沒有可點名排程 | 載入與失敗顯示「—」；空狀態僅在成功且 0 筆時出現 |
| P2-4 | 界面 | 請假／出席／班別詳情人數卡載入中仍為 0 | `LeaveManagementView`、`AttendanceRecordsPage`、`ClassDetailView`。排程總覽 KPI 已用 `kpiNumberDisplay` | 載入「—」、失敗不要當 0 |
| P2-5 | 界面 | 老師首頁與時間表返回會整表重抓 | `TeacherHomeView`、`TeacherTimetable` 未接 `createListDataCache`。學生／班別／排程主清單已接 | 快取鍵含 `teacherId` 與日期範圍；寫入後 invalidate |
| P2-6 | 資料 | 排程備註整欄覆寫可抹掉 `makeup_of=` | `ScheduleDetailView.saveRemarks` → `updateSchedule({ remarks })`。2026-10-20 稽核已列，仍未修。分題 [`makeup-of-schedule-id.md`](../../product/topics/makeup-of-schedule-id.md) 仍 `open` | 儲存時合併／保護標記 |
| P2-7 | 追收 | 尚餘未知時主數字填 0，畫面變成「不用收」 | `tuitionChaseQueries`：`remainingKnown === false` 時 `thisPeriodDueLessons: 0`；標籤把 0 顯示成不用收 | 未知時顯示「—」，禁止當 0 |
| P2-8 | 權限 | `payroll_runs` UPDATE 條件是 `payroll.read` | 狀態機 trigger 擋住結算／重開；snapshot 等非狀態欄行政可改。行政無 `payroll.prepare` | UPDATE 改 prepare／submit／settle，勿用 read |

其餘靜態 P3（不阻營運）：收款登記推薦人用原生 `<select>`；推薦回贈文案「已付」；新增私人課程錯誤訊息含禁用詞「單對單」（應為一對一／一對二）；人數報表載入前學生總數顯示 0。

---

## 本月營運應跟進（不是系統壞）

範圍：香港 2026-11-01 至 2026-11-15。排除 Test／HWKP／空班。

| 類別 | 數量 | 對象 | 說明 |
| --- | --- | --- | --- |
| 已下課專科整堂未點名 | 20 堂 | Phoebe Tam 10；Cheryl／Christine／Leo 各 2；Jackson、Judy、Katie、Liam 各 1 | 有效宣告 > 0、出席列 0。部分點名 0 |
| 已現場試堂結果仍待跟進 | 5 | 11/12 王梓熹、葉政昊 `MATHS3001-D`；11/13 戴詠瑤 `BIOS5001-A`；11/14 廖映貽 `BIOS5001-B`、李孝言 `MATHS1001-C` | `outcome=open`、狀態已預約、出席「現場」。前台改錄取／不錄取即可 |
| 學生請假補堂未完成 | 24 列 | 未安排 18、已排未上 6 | 已排未來日（例如 11/16、11/24）不必當逾期 |
| 老師請假未安排／已排未上 | 8 班次 | 未安排 6 班次／19 人次；已排未上 2 | 含當日 Cyndi `ENGS6001-A`、`ENGS5004-A` |
| 退讀當日殘留事假 | 1 | 梁景維 `ENGS5004-B` 11/08 | 宣告已 void；範圍內非試堂「無有效宣告」僅此 1 列 |
| 軟取消仍有 active 宣告 | 1 | `M2S5001-A` 11/01，原因「學生請假」，就讀 1 人（艾語涵） | 單人班宜用事假／調堂，不要整堂取消 |
| 試堂名單自動信失敗 | 1 | `trial-followup-pdf`／`target_date=2026-11-03`，Resend 403／1010 | 其後 11/04、06、10、13 已寄出；11 月 `scheduled_email_sends` 121 列、failed 僅 1 |

未繳名單、空班、學期結束仍就讀中，本次不列。

---

## 已確認健康（本輪無復發）

| 檢查 | 結果 |
| --- | --- |
| 校舍假期被標成取消 | 11/01–15 **0**；2627 全年 **0** |
| 計費出席未扣堂 | 10-16 起 2627 專科 **457** 列各扣 1；未扣 0、多扣 0。歷史僅葉梓軒 2026-09-19 `MATHS3001-A`「現場」（[`attendance-marked-not-consumed.md`](../../product/topics/attendance-marked-not-consumed.md) 關帳不補） |
| 同一 `attendance_detail` 多扣 | 0 |
| `attendance_details.schedule_id` 為空 | 0 |
| `academic_years.is_current` | 僅 `2627=true` |
| 同一學生同班兩筆就讀中 | 0 |
| 進行中班別學年不是 2627、且有今日後排程 | 專科／功輔 0（私人課程不綁學年，不列） |
| 常規專科 weekday 45+ 堂 | 進行中、非加堂、非 `makeup_of`：最高 40（26 班） |
| `makeup_schedule_id` 指向取消堂 | 0 |
| 已取消試堂仍留出席 | 範圍內 0 |
| 半價試堂缺折扣行 | 已收款半價 54 筆，缺折扣 0（P1-1／P2-2 除外） |
| 混級專科雙 namespace | 同學生同科同時有 `^[PS][1-6]$` 與 `class:`：**0** |
| 逾期罰款漏加 | 10-16 起已關閉（`LATE_FEE_ENFORCEMENT_SUSPENDED`）；漏加不是缺陷 |
| 代堂改 `classes.teacher_id` | 程式只改該堂 `schedules.teacher_id` |
| 程式抽走 `makeup_of=` | 解析／寫入仍在；風險在人手覆寫備註（P2-6） |
| 敏感表 `is_mgmt_staff()` `FOR ALL` | 已拆：`payments` 讀寫跟 capability；老師無 payments SELECT |
| 老師取消堂 | 表政策寬，**trigger** 禁改 status／日期／老師 |
| 試堂邀請公開 RPC 猜學號 | `trial_invite_get` 只查 token（庫內 111 條皆 64 hex）；提交不開單、不繞收款 |
| 清單 `location.key` 重載 | 無 |
| `fieldset disabled` 包住編輯 | 無 |
| `window.alert`／`confirm` | 無 |
| 點名跟 `is_current` 而非 `scheduled_date` | 無 |

---

## 已知 backlog（本輪無新證據，不另開題）

| 分題 | 說明 |
| --- | --- |
| [`nav-capability-entry.md`](../../product/topics/nav-capability-entry.md) | 側欄跟角色清單、deep-link 跟 capability，兩邊會不齊。不當授權 |
| [`auth-leaked-password-protection.md`](../../product/topics/auth-leaked-password-protection.md) | HaveIBeenPwned 未開；advisors 仍 WARN |
| [`postgrest-complete-read.md`](../../product/topics/postgrest-complete-read.md) | 分題仍 open；P1-6 證明活風險，不另開 |
| [`makeup-of-schedule-id.md`](../../product/topics/makeup-of-schedule-id.md) | 待決；P2-6 即該題短修 |
| [`entitlement-correction-approval.md`](../../product/topics/entitlement-correction-approval.md) | 申請 UI 未開工；與 P1-4 收窄 Data API 分開 |
| 流動裝置 CRUD、試堂邀請餘界面、死碼清理 | 進行中／open，無新洞 |
| 逾期罰款 | 畫面已關；`insertPaymentRecord` 仍接受罰款列；`BACKLOG.md` done 列仍寫 10/1 起生效（與現況不符，勿當已施行） |

---

## 未能驗證

- 各角色實帳瀏覽器；家長 Portal 寫入細部；storage／Edge 非 SQL；服務角色腳本
- 未對真人列做寫入驗證（P1-4／P1-5 政策已足夠定性）
- P1-2 無法還原是哪一次改 remaining 沒寫事件
- `teacher_lesson_reminder_logs` 無 `status` 欄；自動信以 `scheduled_email_sends` 為準
- 老師以 `students.read` 深連結 `/Students` 是否看到全校：屬已知入口與 capability 兩套清單，需實帳

## 相關

- 已繳堂數改為只交事件（P1-2／P1-4 後續討論，未實作）：[`2026-11-15-entitlement-balance-events.md`](./2026-11-15-entitlement-balance-events.md)
- 尚餘改由事件維護（方案已定、未實作）[`entitlement-remaining-event-ledger.md`](../../product/topics/entitlement-remaining-event-ledger.md)
- 錯題本 [`AGENT_LESSONS.md`](../AGENT_LESSONS.md)
- 點名已寫未扣 [`attendance-marked-not-consumed.md`](../../product/topics/attendance-marked-not-consumed.md)
- 校舍假期不是取消堂 [`campus-holiday-not-cancelled.md`](../../product/topics/campus-holiday-not-cancelled.md)
- 混級 namespace [`mixed-class-entitlement-namespace.md`](../../product/topics/mixed-class-entitlement-namespace.md)
- 對抗性權限 skill `.cursor/skills/mainhope-adversarial-audit/`
- 營運異常 skill `.cursor/skills/ops-exception-scan/`
