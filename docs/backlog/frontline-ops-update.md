# 前台規模／流程更新（試堂原則）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `in_progress` |
| 優先 | 高 |
| 範圍 | 把 **G3 試堂／優惠定案**寫入前線流程、手冊、阿Po、系統行為（出單閘點名紙、免費亦跳收款、計人頭手選 UX、半價＝正價＋優惠 50% 等）；培訓／發佈前台同事跟新原則 |
| 不含 | 會計收入認列；營運總覽 KPI **實作**（規格見另題）；G2 更正頁文件同步（另題） |
| 營運總則 | [`TRIAL_RECEIPT_BEFORE_ROSTER.md`](../TRIAL_RECEIPT_BEFORE_ROSTER.md)（已掛 [`OPS_POLICIES.md`](../OPS_POLICIES.md)；**核心已系統化**） |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 產品草稿 | [`trial-promo-receipt-frontline-wip.md`](./trial-promo-receipt-frontline-wip.md)（**產品已拍板**） |
| 母題 | [`summer-enrollment-roster-consistency.md`](./summer-enrollment-roster-consistency.md) §5.6／G3 |
| 立案 | 2026-08-11 |
| 上次更新 | 2026-08-11（核心工程已上：閘紙／$0／計人頭／半價50%） |

## 結論（給 agent／產品）

T1–T4 已關。**核心工程 2026-08-11 已落地**（migration `20260811023000`）。餘：manual 發佈、阿Po、2627 §11 舊句、點名紙人頭標籤、老師通知核對。

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
| 2627 指引 §11 免費可不經付費 | ⬜ 待同步 |
| 點名紙顯示計／唔計標籤 | ⬜ 資料已有 |
| 老師試堂收件匣通知 | ⬜ 另核 |

## 待做（摘要）

1. ~~核心工程~~  
2. WIP 遷入 `docs/manual/`＋員工發佈  
3. 文件：ATTENDANCE／阿Po；**2627 指引 §11 舊句**  
4. 前台培訓  
5. （可選）點名紙計人頭標籤；老師通知核對  

## 相關

- 營運總則：[`TRIAL_RECEIPT_BEFORE_ROSTER.md`](../TRIAL_RECEIPT_BEFORE_ROSTER.md)
- 試堂前線 WIP：[`trial-promo-receipt-frontline-wip.md`](./trial-promo-receipt-frontline-wip.md)
- 營運總覽 KPI 規格：[`mgmt-dashboard-kpi-spec.md`](./mgmt-dashboard-kpi-spec.md)
- 政策索引：[`OPS_POLICIES.md`](../OPS_POLICIES.md)
