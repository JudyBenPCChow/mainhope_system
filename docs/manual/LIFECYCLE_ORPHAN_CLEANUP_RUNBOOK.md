# 現況清：出席孤兒 runbook（生命週期 A1 驗收）

> 與功能 code 分開。A1 上線／驗收前，對 production（或 staging）已知孤兒做人工核對後刪除。  
> 方案：[`../plans/2026-07-31-lifecycle-orphans.md`](../plans/2026-07-31-lifecycle-orphans.md)  
> **禁止**只憑「點名紙現已無名」就刪——須對照 eligibility。

## 原則

可刪列＝該生在該 `schedule_id` 上有出席，且**變更後**仍無應到資格：

- 無可見報讀（enrollment）
- 無進行中試堂
- 無**其他**請假調堂（`makeup_schedule_id` 指向該堂／連堂 peers；狀態非放棄）

連堂須展開 `consecutive_group_id` peers，勿只刪一節漏一節。

## 建議步驟

1. 用分題／個案的 `student_id`、日期先 `SELECT`（注意年份）。
2. 對每筆 `schedule_id` 人工或另查：該生是否仍應出現在該堂點名紙。
3. 只刪確認「無應到」的列；仍有報讀／其他調堂的列**保留**。
4. 記錄誰／何時／為何／刪了哪些 `attendance_details.id`（可寫 `mgmt_audit_log` 或內部筆記）。
5. 刪後核對該生已上堂數是否回退合理。

## 示例 SQL（先 SELECT，再 DELETE）

```sql
-- 核對實際年份與 student_id，勿照抄
SELECT id, student_id, class_id, schedule_id, attendance_date, status, updated_at
FROM attendance_details
WHERE attendance_date = '2025-07-25'
  AND student_id = '<uuid>';
```

確認無應到後：

```sql
DELETE FROM attendance_details
WHERE id IN ('<id1>', '<id2>');
```

## 林藝涵型

取消請假／補堂後點名紙無名、出席仍在：對該生補堂日兩節（連堂）各一筆，確認無報讀／其他調堂後刪。見 [`../backlog/lifecycle-orphans.md`](../backlog/lifecycle-orphans.md) 個案應急。
