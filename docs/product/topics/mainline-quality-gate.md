# 主線品質閘（技術債 P0-3）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `done`（2026-08-16：CI 綠＋`main` ruleset 要求該 check；阿Po 留） |
| 優先 | 高 |
| 來源 | 2026-08-14 全盤檢視 P0-3＋P2-3；由 [`tech-debt-hardening.md`](./tech-debt-hardening.md) 拆出獨立討論 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 稽核 | [`2026-08-14-tech-debt-review.md`](../audits/2026-08-14-tech-debt-review.md) |
| 相關 | [`dead-surface-cleanup.md`](./dead-surface-cleanup.md)（沙盒路由／刪檔另題；本檔只決定檢查包唔包沙盒） |
| 不含 | RLS／localStorage 權限（P0-1／P0-2）；leaked password（P0-4）；拆 god files；家長 Portal E2E；全面 Playwright |

本檔＝獨立討論方案。權限硬化見母題；沙盒**檔案刪唔刪**見死碼主題。此處只處理：檢查幾時跑、跑乜、紅燈可唔可以進主線。

## 白話（一句）

PR 合併進 `main` 必須 CI 綠；直推 `main` 仍會先入再跑檢查。

## 現況

**2026-08-16：** `.github/workflows/ci.yml` 於 pull request 同 push 去 main 跑 `lint` → `typecheck:test` → `test` → `ui:check` → `build`（Actions 已綠）。`tsconfig.test.json`＋`npm run typecheck:test` 已加。阿Po／每日 `apo-check.yml` 今輪唔刪。GitHub **branch ruleset** 已 target `main`，必過 check＝`lint · typecheck:test · test · ui:check · build`。

**2026-08-15 熄紅燈後（本機）：** `npm run lint` 0 error（仍有 warning）；`npm test` 95 pass／2 skip；`npm run ui:check` 通過；`npm run build` 通過（`tsc -b && vite build`）。

**2026-08-14 量過（歷史）：**

- 唯一自動任務：`.github/workflows/apo-check.yml`，每日跑阿Po 離線對答。**唔喺 pull request**，亦唔跑 lint／test／build／`ui:check`。
- `npm run lint`：37 error（正式碼 + 沙盒）。
- `npm test`：94 pass、**1 fail**、2 skip。
- `npm run ui:check`：7 違規（3 正式頁 Tag + 4 沙盒）。
- `tsconfig.app.json` 排除 `*.test.ts`，`tsc -b` 唔檢查測試。
- Playwright 在 dependencies，0 條劇本、0 npm script。

---

## 成因

唯一 workflow 係每日阿Po。應用有冇壞，無人被逼喺合併前核對。

紅燈細節：

- 失敗測試：`writableStudentIdsFromRosterContext 合併報讀與試堂`（`attendanceLifecycleQueries.test.ts`）。測試仍當「未出單嘅試堂可以寫點名」；程式 `activeTrialsForSchedules` 已要求 `paymentId`（出單先上紙）。
- lint／ui:check 紅住仍可合併。
- 阿Po 離線對答同點名／收款正確性無關。

### 呢條失敗測試幾時有？點解營運睇唔到？

- 2026-07-24：倉庫先有 `npm test`。
- 2026-07-31：測試檔誕生（當時測刪點名，唔係試堂出單）。
- **2026-08-01**：加上而家失敗嗰條（commit `0cf8c025`，訊息 `111`）。
- **2026-08-11**：產品改「出單先上紙」；測試冇跟。
- **從來冇自動跑、冇通知。** 要有人喺電腦打 `npm test` 先有結果。GitHub 每日只跑阿Po。所以營運可以完全唔知有呢條網。

---

## 影響

- 校規改咗，舊檢查仍紅，無人必須停。
- 大檔再改點名／收款，壞咗可能要前線先發現。
- 過咗阿Po ≠ 應用冇壞。

**lint 37 error 會唔會令而家前線壞掉？** 幾乎唔會。多數係未用變數、`prefer-const`、PDF 標題全形空格、多餘 try/catch。清佢哋係為咗加閘時唔好無端擋所有改動，唔係修已發生嘅營運故障。

---

## 沙盒同正式頁（討論結論草案）

**唔刪正式頁。** `ui:check` 三個正式命中（HK 成本兩個檔、請假管理 Tag）＝改樣式去跟 `statusToTagTone`，唔係刪頁。

沙盒盤點（2026-08-15）：

| 沙盒 | 主站而家 | 接真實 SQL？ | 備註 |
| --- | --- | --- | --- |
| 功課輔導 | 要登入：`/prototype/HomeworkTutoring` | 否 | 8 月 1 日加回路由 |
| 聯絡更新活動 | 要登入：`/prototype/ContactUpdateCampaign` | 否 | 8 月 4 日；死碼主題標暫緩勿刪檔 |
| 首頁 wayfinding | **免登入**：`/prototype/HomeWayfinding` | 否 | 8 月 6 日 |
| 計糧 UI 預覽 | 只 DEV 或特登開關：`/PayrollUiPreview` | 否 | |
| `sandbox/payroll-ui/` | 獨立 deploy，唔係主站側欄 | 否 | |
| 聯絡表單、前台精靈、點名紙、老師請假、收件匣通知、中學出席 prototype | 檔仍在，**主站路由已無掛** | 否 | 可留作日後改 UI |
| **計糧正式頁 `/Payroll`** | 前線用 `PayrollView`（`src/components/payroll/`） | **有** | 2026-08-15 由沙盒拉出正式畫面；**唔再當示範頁** |

點解你強調「唔好上線、唔好連 SQL」仍然出現主站網址：agent 為方便喺同一個網站撳睇，把沙盒寫進正式 `App.tsx`。側欄冇入口 ≠ 網址唔存在。7 月 31 日曾拆 `/prototype/*`，之後又加返；死碼主題仍寫「沙盒路由已下線」，已過時。假資料所以而家唔會改壞學費表；問題係示範頁同正式檢查綁埋、示範網址喺正式站。

**已簽收（2026-08-15）：** 計糧 UI 拉出 `src/components/payroll/`（方案 1）。其餘沙盒**檔案留**；eslint ignore `src/prototypes/**`；`ui:check` 跳過目錄名 `prototypes`。主站要唔要拆 `/prototype/…` 路由交死碼主題／產品另決。未點頭唔刪沙盒檔。

---

## 改善方案（要做／加乜、點解）

順序：**先令現況變綠，再加閘**——否則一加自動檢查，主線即全紅、人人繞過。

### A. 先熄紅燈（2026-08-15 已做）

1. 修好唯一失敗測試。改測試去鎖定現行校規（無單＝唔入紙），唔好改返舊行為。點解：呢條係而家唯一會捉「點名紙同收費規則一唔一致」嘅網。
2. 清 lint error（正式碼；沙盒跟「排除」就唔使為閘而改示範頁）。點解：閘一開 error 擋所有改動。
3. 修正式頁 Tag 映射（請假、HK 成本、計糧學生 HC）。點解：書面 UI 鐵則要用機械執行；違規卻無後果＝規範只係紙。
4. 沙盒排除出 lint／`ui:check`（見上表）；計糧由沙盒遷出。點解：用示範頁拖死收款／點名修復係錯重心。

### B. 加「要上主線先跑」嘅檢查

5. ~~加 `ci.yml`~~ **已完成 2026-08-16**（`.github/workflows/ci.yml`；PR／push main；唔跑阿Po）。
6. 五個指令：lint 捉筆誤；typecheck:test 鎖測試型別；test 鎖校規；ui:check 執行畫面鐵則；build 令組唔過嘅唔當可交同事（唔好等到 Vercel 先爆）。
7. 第一期只擋 error，唔擋 eslint warning。點解：45 條 warning 一齊擋會逼人抄捷徑。
8. **GitHub 網站**該 repo → Settings → Branches：規定上述 job 必須綠先可合併。點解：只加 workflow 唔開必過，紅燈仍可進主線。呢項喺 GitHub 網頁 set，唔喺 md／yml 就自動生效。

兩層唔好混淆：跑乜野＝倉庫 `.github/workflows/`；紅燈可唔可以照合併＝GitHub Settings → Branches。

### C. 測試自己都要正確

9. ~~測試檔納入 TypeScript 檢查~~ **已完成**（`tsconfig.test.json`；`npm run typecheck:test`；CI 另步。`tsc -b`／Vercel build 仍跳過測試檔）。
10. CI 用同一條 `npm test`（`vitest run`）。點解：部機同閘結果要一致。

### C2. P2-3 風險導向測試（合併入本題）

現況只有 16 個 test file／約 2,020 行，相對 src 約 115,618 行；單靠「CI 會跑」唔代表關鍵流程已有網。

本題不設全庫 coverage 百分比門檻，但每次改以下規則必須先補針對性 regression：

- 點名資格／試堂出單／權益消耗及返還
- 收款、作廢、權益更正
- 計糧計算、審閱、結算
- 角色 capability／RLS 拒絕案例

Playwright 只保留少量跨層 smoke 候選；唔喺本題一次過補全面 E2E。

### D. 用唔著嘅工具

11. Playwright：**暫留、唔入 CI。** `scripts/payroll-ui-screenshots.mjs`、`scripts/generatePosterSamples.mjs` 用本機 Chromium；本主題唔新寫 E2E。
12. **阿Po／IT狗／工作台今輪留。** 每日 `apo-check.yml` 唔刪、唔塞進 PR 必過。刪阿Po ≠ 有品質閘。

### E. 明確唔做

- 唔靠「記得跑 `npm test`」代替閘。
- 唔加測試覆蓋率門檻（而家約 1.7% 行數，一加只會迫人寫空測試）。
- 唔拆 god files、唔開家長 Portal E2E。
- 唔刪正式頁；唔未經同意刪沙盒檔。

---

## 待決

1. ~~每日阿Po workflow~~ **留**（同事會用 IT狗；今輪唔刪產品、唔刪每日檢查）。
2. ~~沙盒檢查排除~~ **已做**（其餘 `src/prototypes/**` 剔出；計糧已遷正式）。主站 `/prototype/…` 拆唔拆另題。
3. ~~GitHub branch protection~~ **已做**（branch ruleset target `main`；Require status checks＝CI job）。
4. ~~Playwright~~ **暫留、唔入 CI**（截圖／海報腳本有用）。
5. ~~加 `ci.yml`~~ **已做**。

## 建議波次（僅本主題）

| 步 | 做 |
| --- | --- |
| 1 | ~~熄紅燈~~ **已完成 2026-08-15**（測試跟出單先上紙；正式 lint／Tag；計糧遷出；其餘沙盒剔出檢查） |
| 2 | ~~加 `ci.yml`~~ **已完成 2026-08-16** |
| 3 | ~~GitHub 開 branch protection~~ **已完成 2026-08-16**（ruleset target `main`） |
| 4 | ~~測試檔納入 typecheck~~ **已完成**；其後高風險改動先補針對性 regression（過程約束，唔一次過補網） |
| 5 | ~~刪 `apo-check.yml`~~ **今輪唔做** |
