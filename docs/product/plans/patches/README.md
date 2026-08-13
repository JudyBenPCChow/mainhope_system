# 生命週期孤兒：暫存實作（非上線）

誤早實作已從 **main 工作區撤回**。完整快照留在：

| 位置 | 說明 |
| --- | --- |
| git branch `wip/lifecycle-orphans-impl` | 指向曾含 O0–O6 的 commit（約 `e9a6b243`） |
| `attendanceLifecycleQueries.ts.parked` | 共用掃描／稽核刪除 |
| `scheduleCancelConfirm.ts.parked` | 軟取消 Confirm helper |

**不要**把本目錄當已交付功能。審閱方案請讀上一層 [`2026-07-31-lifecycle-orphans.md`](../2026-07-31-lifecycle-orphans.md)。

日後若方案通過再實作：可自 `wip/lifecycle-orphans-impl` cherry-pick／對照，或還原 `.parked` 檔後按方案修正模擬風險再合入。
