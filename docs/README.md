# 明學文件總門牌

**先睇呢一頁。** 唔使記檔名；問自己「想做咩」再入對應櫃。

| 我想… | 去邊 | 改咩 |
| --- | --- | --- |
| 查營運規則（可唔可以／必須） | [`policies/_INDEX.md`](policies/_INDEX.md) | 只改 `policies/` |
| 查公司術語同定義 | [`meta/TERMINOLOGY.md`](meta/TERMINOLOGY.md) | 同步 `.cursor/rules/terminology.mdc`（見該檔維護節） |
| 教同事點操作（畫面點撳） | [`playbooks/_INDEX.md`](playbooks/_INDEX.md) | 只改 `playbooks/` |
| 睇給同事的系統更新 | [`playbooks/SYSTEM_UPDATES.md`](playbooks/SYSTEM_UPDATES.md) | 說「產出更新總結」加一則 |
| 搵本年校曆／時間表／學年指引 | [`year/2627/`](year/2627/README.md) | 只改 `year/<學年>/` |
| 睇仲有咩工程未做 | [`product/BACKLOG.md`](product/BACKLOG.md) | 以 `main` 為準；feature 唔改索引表 |
| 用語／agent／UI／RLS 習慣 | [`meta/`](meta/README.md) | 開發約定；**員工用語表**在 [`meta/TERMINOLOGY.md`](meta/TERMINOLOGY.md) |
| 拎 docx／PDF 發佈物 | [`generated/`](generated/README.md) | **唔人手改**；由 md 腳本重出 |

## 鐵則（一句）

**立法喺 `policies/` → 操作喺 `playbooks/` → 學年包喺 `year/` → 二进制喺 `generated/`。**  
工程過程（backlog／topics／handoffs）唔當員工讀本真相。

## 目錄一覽

```text
docs/
  README.md              ← 你而家喺呢度
  policies/              已簽收規則（must / must-not）
  playbooks/             前線／財務點做
  year/2627/             本學年實例（指引、校曆物料、時間表）
  product/               工程 backlog／topics
  meta/                  用語、agent、UI、RLS、handoffs
  generated/             docx／pdf 產出（非真相）
```

舊路徑（例如昔日 `docs/OPS_POLICIES.md`、`docs/BACKLOG.md`）仍留 stub，跟連結去新址即可。完整對照見 [`PATH_MAP.md`](PATH_MAP.md)。
