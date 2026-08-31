# 登入洩露密碼保護（Auth）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open` |
| 優先 | 中 |
| 範圍 | Supabase Auth Dashboard：開啟 Leaked password protection；勾 `RLS_ROLLOUT` 收尾 |
| 不含 | RLS 讀寫分離、localStorage 守衛（見 [`tech-debt-hardening.md`](./tech-debt-hardening.md)）；CI 品質閘（見 [`mainline-quality-gate.md`](./mainline-quality-gate.md)）；盜帳善後營運 SOP 另寫 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 來源 | 2026-08-14 技術債檢視原 P0-4；已自硬化主題拆出 |
| 文件 | [`RLS_ROLLOUT.md`](../../meta/RLS_ROLLOUT.md) 收尾第一項 |
| 記錄 | 2026-08-15 自 tech-debt-hardening 分離 |

## 目標（一句）

設密碼／改密碼時，自動拒絕已出現喺公開洩露清單嘅密碼；無程式、無 migration。

## 非技術說明

系統而家**冇**自動檢查員工（同家長若用同一套登入）設嘅密碼，係咪已經喺互聯網洩漏過。

[Have I Been Pwned](https://haveibeenpwned.com/) 收集過往各大服務被入侵後流出嘅密碼（雜湊形式）。開開關後：註冊或改密碼時會對照呢個清單；中咗就拒收，叫人換一條。常見做法唔會把完整密碼明文送出對照。

- **唔代表**明學資料庫已經洩露。
- **唔等於**開完就絕對冇人盜帳（仲有釣魚、共用密碼等）。
- **擋完只係預防之後再設爛密碼**；若懷疑帳號已被人用舊密碼入過，要另做改密、踢其他登入、查異常操作——單開開關唔自動善後。

## 成因

`RLS_ROLLOUT.md` 收尾第一項未做。Phase A–C 程式交付後，Dashboard 設定未跟。2026-08-14 Supabase security advisor 仍 WARN「Leaked Password Protection Disabled」。

## 影響

職員（同共用 Auth 嘅家長）可以設已洩露密碼，降低盜帳門檻。盜到職員帳可觸及後台寫入面（與技術債 P0-1 疊加）。唔擴大公開 RLS 洞。

## 做法

1. Supabase Dashboard（`MainHope_production`）→ Authentication → 開啟 **Leaked password protection**（HaveIBeenPwned）。
2. 勾 [`RLS_ROLLOUT.md`](../../meta/RLS_ROLLOUT.md) 收尾項；記變更紀錄。
3. 可選：同頁確認無 `dev_anon_all_*`／`dev_auth_all_*` 殘留（RLS 收尾另項，唔綁死本主題）。
4. Staging（`mainhope-staging`）若恢復 ACTIVE，兩邊一齊開。

## 驗收

- [ ] Production advisor 不再報 leaked password 關住（或 Dashboard 顯示已開）
- [ ] `RLS_ROLLOUT.md` 收尾第一項已勾
- [ ] （可選）用已知洩露測試密碼改密 → 應被拒
