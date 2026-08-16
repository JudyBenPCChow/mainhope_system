# 前台規模／流程更新（試堂原則）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `done` |
| 優先 | 高 |
| 範圍 | 把 **G3 試堂／優惠定案**寫入前線流程、手冊、阿Po、系統行為（出單閘點名紙、免費亦跳收款、計人頭手選 UX、半價＝正價＋優惠 50% 等） |
| 不含 | 會計收入認列；營運總覽 KPI **實作**（規格見另題）；G2 更正頁文件同步（另題）；**前台培訓／員工 WhatsApp 發佈**（非工程） |
| 營運總則 | [`TRIAL_RECEIPT_BEFORE_ROSTER.md`](../../policies/enrollment/TRIAL_RECEIPT_BEFORE_ROSTER.md)（已掛 [`OPS_POLICIES.md`](../../policies/_INDEX.md)；**已系統化**） |
| 前線操作 | [`TRIAL_RECEIPT_FRONTLINE.md`](../../playbooks/frontdesk/TRIAL_RECEIPT_FRONTLINE.md) |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 產品草稿 | [`trial-promo-receipt-frontline-wip.md`](./trial-promo-receipt-frontline-wip.md)（**已遷 playbook**） |
| 母題 | [`summer-enrollment-roster-consistency.md`](./summer-enrollment-roster-consistency.md) §5.6／G3 |
| 立案 | 2026-08-11 |
| 上次更新 | 2026-08-16 |

## 結論（給 agent／產品）

**2026-08-16 結案。** T1–T4 已關。核心工程、playbook、2627 §11、老師試堂收件匣、阿Po 已跟出單先上紙。計／唔計人頭由計糧／排程人數跟 `counts_toward_headcount`（唔做點名紙每人標籤）。培訓／發佈唔屬本工程。

## 已拍板原則（必須列入更新）

1. **試堂一定要有學費單**（含 $0 免費試堂；事實上可不收款；畫面仍跟現行收據流程，最多唔印畀家長）。
2. **免費試堂堂數填 1**（入可用堂；唔做「純觀摩堂數 0」）。
3. **未出單／未確認 → 唔入權益池，亦唔上點名紙**。
4. 正價／半價／$0 三種路徑都走**收款登記**；試堂頁唔內嵌收錢。
5. **計人頭**同收錢／入池分開；**無預設，每次手選**。
6. 老師：點名紙標試堂；**另收試堂通知**（收件匣）。
7. 贈堂（非試堂）：開學費單（可 $0）＋堂數；成本統計口徑跟試堂優惠。
8. **半價試堂**：學費行填**正價**，優惠欄 **off 50%**；禁只填半價實收。

## 系統現況 vs 目標

| 點 | 狀態 |
| --- | --- |
| 半價／原價建立試堂 → `/Payments` | ✅ 維持；帶 `trialPay`／`classId` |
| 免費／體驗建立後跳收款出 $0 單 | ✅ |
| 點名紙：確認收款先上紙 | ✅ RPC＋client＋fallback |
| 計人頭手選（無預設） | ✅ 試堂頁＋前台精靈；欄 `counts_toward_headcount` |
| 半價＝正價＋目錄 50% 優惠 | ✅ `試堂半價（50%）` |
| 母題／WIP／總則舊「掛勾即上紙」 | ✅ 已改寫 |
| 2627 指引 §11 | ✅ v1.2 出單先上紙；v1.9 老師收件匣 |
| playbook | ✅ [`TRIAL_RECEIPT_FRONTLINE.md`](../../playbooks/frontdesk/TRIAL_RECEIPT_FRONTLINE.md) |
| ATTENDANCE 舊「免費可不經收款」 | ✅ 已跟政策 |
| 點名紙顯示計／唔計標籤 | ✅ 吸收：人數／計糧跟旗標（`rosterHeadcountForSchedule`）；點名紙只標「試堂」 |
| 老師試堂收件匣通知 | ✅ 確認收款後 `trial_confirmed`（migration `20260816120000`） |
| 阿Po | ✅ `apoKnowledge`／`apoHowtoGuides` 已跟出單先上紙 |
| 前台培訓／員工發佈 | — 非工程；唔填 |

## 待做（摘要）

全部工程項已關。員工 WhatsApp／列印發佈見 [`2627-regular-year-ops-guide.md`](./2627-regular-year-ops-guide.md)（另題）。

## 相關

- 營運總則：[`TRIAL_RECEIPT_BEFORE_ROSTER.md`](../../policies/enrollment/TRIAL_RECEIPT_BEFORE_ROSTER.md)
- 前線操作：[`TRIAL_RECEIPT_FRONTLINE.md`](../../playbooks/frontdesk/TRIAL_RECEIPT_FRONTLINE.md)
- 試堂前線 WIP（已遷）：[`trial-promo-receipt-frontline-wip.md`](./trial-promo-receipt-frontline-wip.md)
- 營運總覽 KPI 規格：[`mgmt-dashboard-kpi-spec.md`](./mgmt-dashboard-kpi-spec.md)
- 政策索引：[`OPS_POLICIES.md`](../../policies/_INDEX.md)
