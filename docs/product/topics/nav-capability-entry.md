# 側欄／入口（IA1）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open` |
| 優先 | 中 |
| 範圍 | 側欄、首頁、按鈕展示改跟 capability；定邊啲功能出日常入口 |
| 不含 | RLS／寫入授權（已喺 P0-1／P0-2 關帳）；阿Po Edge 帳戶帽（技術債本期不做） |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 來源 | 2026-08-15 決策 IA1；自 [`tech-debt-hardening.md`](./tech-debt-hardening.md) 拆出（2026-08-20） |
| 相關 | [`p0-1-authorization-decisions.md`](./p0-1-authorization-decisions.md)、[`navStructure.ts`](../../../src/lib/navStructure.ts) |

## 結論

「邊個可以改資料」已跟 DB capability。側欄同首頁**仍然**用 `navStructure` 寫死嘅角色清單，刻意未改：公理 1 之下管理層已有行政全部寫入能力，若入口即刻跟 capability，管理層會突然見到前台精靈、收款、點名等日常入口——產品唔要。

Deep-link 而家只靠 `RequireCapabilities`。所以：**側欄隱藏 ≠ 打網址開唔到**。有該頁 capability 嘅角色（例如管理層有 `audit.read_all`）可以開報錯／系統日志等 nav 標「只外星人」嘅頁。唔當安全洞（寫入仍 RLS）；係入口同守衛兩套清單。

## 待決（開工前）

1. 邊啲 capability 出側欄／首頁（尤其管理層：前台、收款、點名、報錯）。
2. 老師／財務現有收窄入口係咪維持角色清單，定改 capability 白名單。
3. 隱藏但仍允許 deep-link，定連路由都收窄到同側欄一致。

## 待做

1. 拍板入口矩陣（功能 × 邊個角色「日常見到」）。
2. `navStructure`／首頁卡片改讀 `profile.activeCapabilities`（或獨立展示表，唔好當保安）。
3. 對照 `App.tsx` 路由 capability，決定隱藏項是否同時收 deep-link。
