# 功輔小學部場次（2627）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `done` |
| 優先 | 高 |
| 範圍 | 獨立小學 homework 班＋同一 `/HomeworkTutoring` 學部切換；小學月費三日／四日／五日；10 月編更；中小學場次至 20:00 |
| 不含 | 宣傳／試堂公開表改動；按學部老師 ACL；強制轉既有中學班內小學生；自動調走 17E 專科班 |
| 索引 | 已於 main 搬 [`BACKLOG.md`](../BACKLOG.md) |
| 上次更新 | 2026-10-04 |
| 相關 | [`homework-tutoring.md`](./homework-tutoring.md)、[`HOMEWORK_TUTORING_MONTHLY_FEE.md`](../../policies/payments/HOMEWORK_TUTORING_MONTHLY_FEE.md)、[`SCHEDULING_RULES.md`](../../policies/scheduling/SCHEDULING_RULES.md) §4 |

## 開工閘

| 本波 | 對上一個 | 完成條件 |
| --- | --- | --- |
| 小學部接入 | 功輔產品已關帳 | 可開工 |

## 定案摘要

- 班：`2627-HWKP1099-A`（`class_kind=homework`），預設 **17E**，`15:30–20:00`，由 2026-10-01。
- 中學：`2627-HWKS1099-A` 預設單室 **17D**；結束改 **20:00**；課室可調、不綁死雙室。
- 月費：三日 $2,500／四日 $2,700／五日 $2,800；12／2 四分三。
- UI：同一功輔頁頂部學部切換；老師可跨學部編更。
- 既有小學生暫留中學班（收費仍跟中一）。
- 10 月小學部不固定一室：17E 全日（15:15–20:00）有空則留 17E（三、五）；星期一、二、四 17E 被中文專科佔用，佔室改英仙座（當日唯一全日有空的課室）。10 月 11 日為星期日，無佔室列。專科班未調走。

## 進度

- [x] production 種班＋10 月編更＋Mark／Katie 功輔入口
- [x] migration idempotent
- [x] fetchHomeworkClasses＋學部切換＋小學價目
- [x] 政策／ops-guide／vault 鏡像
- [x] 10 月小學佔室按當日空房寫入（三五 17E；一二四英仙座）
- [x] 合 PR 後於 main 搬 BACKLOG（PR #189）
