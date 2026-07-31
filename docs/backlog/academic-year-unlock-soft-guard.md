# 撤學年硬鎖＋輕量防呆

| 欄位 | 值 |
| --- | --- |
| 狀態 | `done` |
| 優先 | 高 |
| 範圍 | 後台寫入路徑：清 `assertAcademicYearEditable*`／`canEditAcademicYear*` 硬擋；非當期 confirm；audit 標記 |
| 不含 | 整固舊學年鎖（A1b／A2／L1–L15／ADV 路線已廢棄）；家長 Portal；改 RLS 角色模型 |
| 取代 | [academic-year-lock.md](./academic-year-lock.md)（整固專題 → `cancelled`） |
| 決策依據 | [audits/2026-07-31-academic-year-lock-rethink.md](../audits/2026-07-31-academic-year-lock-rethink.md)；兩邊顧問對齊「撤鎖＋confirm＋audit」 |
| 索引 | [BACKLOG.md](../BACKLOG.md) |
| 盤點日期 | 2026-07-31 |
| 完成日期 | 2026-07-31 |

## 結論

學年硬鎖（`isAcademicYearReadOnly`／`assertAcademicYearEditable*`）成本高過收益：誤操作防呆可用更輕手段；RLS／既有角色限制仍係底線。  
**不整固**舊鎖；改為**撤硬鎖**＋**非當期 confirm**＋**audit 標記**。黃警報橫幅隨撤鎖自然消失，**不單獨做 A1a**。

風險定價：唔係「零風險」，而係「低風險誤改舊年」——用 confirm＋audit 覆蓋。

## 產品確認

已確認：無外部審計／合規要求強制鎖定已結算學年；以 confirm＋audit＋既有 RLS 取代硬鎖。

## 營運須知（現行）

- **唔會**再因「舊學年」而整頁唯讀或擋儲存。
- 改**非目前／下一學年**資料時，系統會彈確認框並記稽核；確認前請核對學年／日期。
- 政策正文（給營運／行政）：[`ACADEMIC_YEARS.md`](../ACADEMIC_YEARS.md) §1.1；索引：[`OPS_POLICIES.md`](../OPS_POLICIES.md)。

## 工作項

| 狀態 | ID | 工作 |
| --- | --- | --- |
| done | U0 | 產品確認無合規強制；改 `ACADEMIC_YEARS.md` |
| done | U1 | service 層 `assertAcademicYearEditable*` 改為 audit-only（不再拋錯） |
| done | U2 | UI：清 `canEditAcademicYear*`／`yearLocked` 硬擋與黃橫幅 |
| done | U3 | 共用：`confirmNonCurrentAcademicYearWrite`（目前／下一學年以外） |
| done | U4 | `mgmt_audit_log`：`non_current_academic_year_write`／`_confirmed` |
| done | U5 | deprecate `academicYearEditGuard` 硬鎖 API；文件指向本政策 |
| cancelled | — | A1b＋A2 學年鎖整固（見舊專題） |

## 程式錨點

- `src/lib/academicYearSoftGuard.ts`
- `src/lib/academicYearEditGuard.ts`（assert → note-only）
- `src/lib/mgmtRole.ts`（`isAcademicYearReadOnly` 恒 `false`）

## 明確不做

- 30 日過渡窗、`2526` 遷移常數、T-B／teacher cutoff 可配置整固  
- 單獨 A1a UX 專案（撤鎖時一併清橫幅）  
- DB 層學年 RLS（L15）

## 相關稽核鏈（只讀備查）

```
docs/audits/2026-07-31-academic-year-lock-review.md
docs/audits/2026-07-31-academic-year-lock-review-consultant.md
docs/audits/2026-07-31-academic-year-lock-team-response.md
docs/audits/2026-07-31-academic-year-lock-review-consultant-response.md
docs/audits/2026-07-31-academic-year-lock-adversarial.md
docs/audits/2026-07-31-academic-year-lock-adversarial-ruling.md
docs/audits/2026-07-31-academic-year-lock-rethink.md
```
