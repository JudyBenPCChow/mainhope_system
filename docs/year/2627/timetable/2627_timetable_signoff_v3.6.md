# 2627 常規時間表 ver. 3.6 — 營運簽收紀錄

| 欄位 | 值 |
| --- | --- |
| 方案版本 | **ver. 3.6**（2026-08-21） |
| 簽收日期 | **2026-08-28** |
| 簽收狀態 | **有條件簽收**（71 小組班方案；7 班待決時段另開 3.7 前可先用 v3.6 餘下格） |
| 簽收範圍 | 方案正文、老師附件、周時間表、空房表、班號 CSV |
| 不含 | Cyndi Ng 一對一高中英文預留格（非小組班）；功輔編更（另題 H11） |

## 簽收產物

| 文件 | 路徑 |
| --- | --- |
| 方案 | [`versions/v3.6/2627_timetable_scheme_v3.6.md`](versions/v3.6/2627_timetable_scheme_v3.6.md) |
| 老師一周表 | [`versions/v3.6/2627_timetable_teachers_week_v3.6.md`](versions/v3.6/2627_timetable_teachers_week_v3.6.md) |
| 周時間表 | [`versions/v3.6/2627_timetable_weekly_v3.6.md`](versions/v3.6/2627_timetable_weekly_v3.6.md) |
| 空房 | [`versions/v3.6/2627_timetable_empty_rooms_v3.6.md`](versions/v3.6/2627_timetable_empty_rooms_v3.6.md) |
| 班號 CSV | [`versions/v3.6/2627_timetable_class_codes_v3.6.csv`](versions/v3.6/2627_timetable_class_codes_v3.6.csv) |

## Production 對照（2026-08-28 覆核）

| 項目 | 數量 |
| --- | --- |
| 方案小組班 | 71 |
| Production 已入（含功輔占位） | 67 → 補入 7 班中文後 **74**（71 專科＋1 功輔占位＋2 方案外舊班待核） |
| 排程 | 每班約 43 堂（已扣附件甲校舍假） |

**2026-08-28 補入 7 班**（v3.6 CSV 有、prod 缺）：

| 班別顯示碼 | 老師 | 星期 | 時段 |
| --- | --- | --- | --- |
| 2627-CHIS5001-C | Christine Fan | 星期一 | 19:00–20:15 |
| 2627-CHIS6001-C | Christine Fan | 星期五 | 17:45–19:00 |
| 2627-CHIS4001-C | Christine Fan | 星期五 | 19:00–20:15 |
| 2627-CHIS3001-F | Billy Shek | 星期六 | 16:30–17:45 |
| 2627-CHIS2001-G | Billy Shek | 星期六 | 17:45–19:00 |
| 2627-CHIS2001-F | Katie Lee | 星期日 | 15:15–16:30 |
| 2627-CHIS1001-F | Katie Lee | 星期日 | 16:30–17:45 |

**Prod 多出、CSV v3.6 無**（保留不刪；待營運確認是否留用）：`2627-CHIS4001-A`、`2627-CHIS5001-B`。

## 有條件簽收 — 待決（另開 3.7 前不得移動已鎖老師格）

| # | 待決 | 備註 |
| --- | --- | --- |
| 1 | Rafael 企會財時段 | 收到後另開版 |
| 2 | Henry Wong 星期三 | 收到後另開版 |
| 3 | Billy Shek 星期五 | 收到後另開版 |
| 4 | Phoebe Tam 星期二 | 收到後另開版 |
| 5 | 中六英文第二班 | 方案 §6 |
| 6 | Christine 中四／中五中文第三班 | 方案 §6 |
| 7 | Cheryl M2 | 方案 §6 |

**已鎖班別時間**（不得為待決項挪格）：Cyndi Ng、Emma Cai、Liam Lai、Leo Chan。

## 下游解阻

- 權益池 E2E：71 專科班齊後可做**全科驗收**（見 [`2627_ENTITLEMENT_E2E_RUNBOOK.md`](../../playbooks/ops/2627_ENTITLEMENT_E2E_RUNBOOK.md)）。
- 員工營運指引**不載**本時間表；時間表另發。

## 簽收確認

| 角色 | 確認 | 日期 |
| --- | --- | --- |
| 營運／管理層 | 有條件簽收 ver. 3.6 | 2026-08-28 |
| 工程 | CSV 對 prod 差異已補入腳本 | 2026-08-28 |
