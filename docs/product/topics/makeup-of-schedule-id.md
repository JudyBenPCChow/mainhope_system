# 補回關聯正規欄（`makeup_of_schedule_id`）

| 欄位 | 值 |
| --- | --- |
| 狀態 | `open`（待決未拍板；**未開工**） |
| 優先 | 中 |
| 範圍 | 將「此加堂補回哪一堂取消堂」從 `schedules.remarks` 字串，改為 `schedules.makeup_of_schedule_id` 外鍵；過渡雙寫／雙讀；排程備註改為人手輸入 |
| 不含 | 廢除補回關係；清除 `26SM` 歷史 `remarks`；分批補回產品（M14／M16／M18）本身；學生請假 `leave_makeup_records.makeup_schedule_id`；改點名入場；非常規排程 3.1／3.2 |
| 索引 | [`BACKLOG.md`](../BACKLOG.md) |
| 立案 | 2026-10-20：全專案檢查發現排程備註整欄覆寫可抹掉 `makeup_of=`；產品傾向正規外鍵 |
| 母題 | [`summer-enrollment-roster-consistency.md`](./summer-enrollment-roster-consistency.md) §5.8（標記留低）；[`nonstandard-scheduling.md`](./nonstandard-scheduling.md)；[`makeup-special-cases.md`](./makeup-special-cases.md) M05／X07／Y13 |
| 政策 | [`ATTENDANCE_BILLING.md`](../../policies/attendance/ATTENDANCE_BILLING.md)（現文仍寫備註標記，落地後須改） |
| 規則 | [`.cursor/rules/makeup-of-marker.mdc`](../../.cursor/rules/makeup-of-marker.mdc) |

## 一句

系統關聯不該活在職員可編的備註裡。真源改為指向取消堂的外鍵；`remarks` 只留人手文字。歷史備註標記保留作檔案，不准刪。

## 開工閘（agent 必讀）

**討論與寫本分題可即開。** 下列待決未圈選前：**不要**寫 migration、不要改安排補堂寫入、不要清 `remarks`。

| 本波 | 對上一個工程 | 完成條件 |
| --- | --- | --- |
| 產品拍板（下方待決） | 無擋 | 本檔「待決」每一列有圈選 |
| Schema＋backfill＋雙寫 | 待決已圈 | 單檔 migration 已套 production；歷史列對帳通過 |
| 備註畫面不再暴露標記 | Schema 已上 | 詳情頁人手備註儲存不碰外鍵 |
| 讀取收斂＋（可選）唯一索引 | 對帳無重複、分批補回與唯一約束已拍板 | 查重／跟進／期數／名冊政策以欄為準 |

可選、不擋本題開工：若只要先堵住覆寫、外鍵稍後才做，見下方待決 O1。那是另一條短修，仍須保留 `makeup_of=` 字串。

X07「不准廢除 `makeup_of=`」仍然成立：不准刪關係、不准清 `26SM` 備註。本題是把真源正規化，不是廢標記。

## 現況問題

安排補堂把機械標記寫進 `schedules.remarks`（例：`makeup_of=<取消堂id>；補回 YYYY-MM-DD；原因：…`）。排程詳情「排程備註」是整段文字框，儲存時 `updateSchedule({ remarks })` 原樣覆寫，沒有合併或保護標記。

抹掉之後：同一取消堂可再安排一次補回；老師取消堂跟進會當成未補。`2627` 點名紙入場不靠此標記（靠宣告繼承），所以畫面上看不出壞了。

`teaching_notes` 已是老師教學紀錄，與營運 `remarks` 分開。標記誤放在 `remarks`，不是缺第三個備註欄。`is_extra_lesson` 只表示加堂，不能表示「補回哪一堂」。

## 已定（2026-10-20 討論）

| # | 決定 |
| --- | --- |
| D1 | 目標模型是 **`schedules.makeup_of_schedule_id uuid NULL REFERENCES schedules(id)`**，不是再加一格文字存 `makeup_of=`。 |
| D2 | 欄義：這堂加堂補回哪一堂**已取消**排程。空值＝不是「安排補堂」那條全班補回關係。 |
| D3 | **不准**清除 `26SM` 歷史 `remarks`，不准從安排補堂拿掉這段關係。搬倉＝另存正規欄，不是滅跡。 |
| D4 | 學生請假調堂繼續用 `leave_makeup_records.makeup_schedule_id`，與本欄分開。 |
| D5 | 普通加堂、逐人調堂、老師請假精靈走出的格：**不填**本欄（與現況「那些路徑不寫 `makeup_of=`」一致）。 |
| D6 | `2627` 點名入場仍靠宣告繼承，不改為靠此外鍵。 |
| D7 | 本題**不是** X07 的翻案。規則／playbook 落地後改寫成「真源在欄；備註標記只作歷史／過渡」。 |

## 待決（擋 Schema）

圈選後才開工。建議項供拍板，不是已定。

| # | 要決定 | 選項 | 建議 |
| --- | --- | --- | --- |
| O1 | 外鍵之前，要不要先做備註寫入保護（合併標記、文字框不顯示機械字串） | **(A)** 先短修再做外鍵 **(B)** 不做短修，直接外鍵同一輪收口 **(C)** 只做短修、外鍵暫緩 | **B**（已傾向外鍵則一次做完畫面；若外鍵排期長才用 A） |
| O2 | 刪除原取消堂時外鍵行為 | **(A)** `ON DELETE RESTRICT`（有補回指向則不能刪原堂） **(B)** `ON DELETE SET NULL`（刪原堂則關聯消失） | **A**（B 等於再抹標記） |
| O3 | 是否禁止「補回堂再被另一堂當 makeup_of」、禁止自己指向自己 | **(A)** check 禁止 **(B)** 只靠程式 | **A** |
| O4 | 唯一約束：同一取消堂最多一堂未取消的補回 | **(A)** 開欄當日就加部分唯一索引（`WHERE` 補回堂未取消） **(B)** 先加欄＋backfill＋對帳，確認無重複、並拍板 O5 後再加 **(C)** 永不加唯一，只靠應用查重 | **B**（現況可能已有重複；分批補回未定） |
| O5 | 未上線的「分批補回」（目錄：刻意不寫 `makeup_of=`）與本欄的關係 | **(A)** 分批永遠 NULL，全班「安排補堂」才填欄；唯一約束可在 O4＝B 之後加 **(B)** 分批也要填欄（則不能用「一取消堂一未取消補回」） **(C)** 分批另用型別／多對多表 | **A**（對齊目錄現句；若日後改 B／C 須先拆唯一） |
| O6 | 雙寫 `remarks` 標記寫到何時 | **(A)** 直到讀取全部收斂、對帳通過，再停寫新標記（歷史字串仍留） **(B)** 開欄當日只寫外鍵、不再寫新標記（讀取仍 dual-read） **(C)** 永遠雙寫 | **A** |
| O7 | `補回 YYYY-MM-DD` 字串（暑期期數後備） | **(A)** 期數改 join 原堂 `scheduled_date`；字串留在歷史備註、新寫可不寫 **(B)** 新寫仍附在 `remarks` **(C)** 另開 `makeup_of_original_date` 欄 | **A**（有外鍵後原堂日期就是真源；不准為了「整齊」去清舊字串） |
| O8 | 誰可以寫入／清空此外鍵 | **(A)** 只准「安排補堂」及明示的修正路徑；通用 `updateSchedule`／備註畫面不准 patch **(B)** 排程詳情可改 | **A** |
| O9 | 補回日訂錯（Y13）：取消舊補回再安排 | **(A)** 維持現流程；唯一約束必須**不含**已取消的補回列 **(B)** 另做「改補回日」專用動作（本題不做） | **A**（B 另題） |
| O10 | 跟進表「老師取消堂已安排」口徑（M18） | **(A)** 本題不改；有外鍵＝全班安排補堂才算，精靈逐人調堂仍可能顯示未安排 **(B)** 本題一併改口徑（有外鍵 **或** 應到生皆已調堂／錄影／不補回） | **A**（B 屬補堂例子／非常規排程，不要綁死本題） |
| O11 | 整堂補回現非資料庫交易（新堂已插入、宣告一半失敗則查重擋重試） | **(A)** 本題不改交易；重試改為補宣告而非再 insert **(B)** 本題順便包成交易 | **A**（交易屬宣告題） |
| O12 | 畫面 | **(A)** 唯讀一句「此堂補回＜原堂日期＞取消堂」＋人手備註框 **(B)** 可選另一堂取消堂來改指 | **A** |

## 副作用與必須一併改的讀寫點

漏改任何一處，過渡期會比現在更難查（欄與備註不一致）。

程式／SQL（現讀 `remarks` 解析或 `LIKE '%makeup_of=%'`）：

- `src/services/scheduleMakeupQueries.ts`（寫入＋查重）
- `src/lib/scheduleMakeupMarkers.ts`（過渡期仍要解析舊備註）
- `src/lib/scheduleRosterPolicy.ts`（補回堂不可剔人、`class_all`）
- `src/services/scheduleRosterQueries.ts`（`26SM` 期數沿用原堂日期）
- `src/services/adminSlaReminderQueries.ts`、`src/lib/adminSlaReminders.ts`
- `src/lib/adminOpsAssistant/rules.ts`
- `src/services/withdrawFromScheduleQueries.ts`（標籤「補回」）
- `src/components/schedule/ScheduleDetailView.tsx`（備註覆寫路徑）
- `.cursor/skills/leave-makeup-followup/queries.md`
- `.cursor/skills/frontdesk-makeup-trial-ops/`（保留標記、改掛宿主班）

文件（落地後改，不是開工前改）：`ATTENDANCE_BILLING.md`、`.cursor/rules/makeup-of-marker.mdc`、`AGENTS.md` 鐵則一句、補堂例子 M05／X07 用詞、2627 指引若有備註標記句。

前台 skill 現允許把補回格 `class_id` 改到 0 人宿主、**保留**標記。外鍵仍成立；名冊政策仍是 `class_all`。誤掛回有人班時，外鍵不會阻止全班上紙——這不是外鍵能防的。

## 歷史資料如何收口（不准令現有關聯消失）

原則：**複製進外鍵，不要搬移、不要刪備註。** `2627` 與 `26SM` 同一套 backfill，不要等學年結束，也不要只做「還未發生」的新堂。

今日（2026-10-20）production 掃描：

| 學年 | 備註含 `makeup_of=` | 未取消 | 可填外鍵（原堂仍在） | 備註 |
| --- | --- | --- | --- | --- |
| `2627` | 33 | 32 | 33（原堂皆在且皆為取消） | 補回日 2026-09-03–11-06；**沒有未取消重複** |
| `26SM` | 35 | 32 | 34 | 1 筆原堂已消失（該補回列本身已取消）；2 組「取消補回＋未取消補回」同指一堂，部分唯一索引可過 |
| 班無學年 | 10 | 9 | 9 | 1 筆原堂已消失（補回列已取消） |

合計 78 筆標記。**不要**為 `2627` 其餘 55 堂取消、但備註沒有 `makeup_of=` 的列發明外鍵——那些可能是未補、逐人調堂、或不走「安排補堂」。外鍵只收口**已經寫過標記**的關係。

做法：

1. 加可空 `makeup_of_schedule_id`，**先不加唯一索引**。`ON DELETE RESTRICT`。
2. `UPDATE`：從該列 `remarks` 解析 UUID，且 `schedules` 仍有該 id，才寫入外鍵。原堂不存在 → 欄維持 NULL，**remarks 原樣留下**（現有 2 筆）。
3. **禁止** `UPDATE remarks` 去掉 `makeup_of=`／`補回 YYYY-MM-DD`。人手句子與標記繼續共存於舊列。
4. 讀取長期 dual-read：`COALESCE(欄, 解析備註)`。這樣即使某列漏填欄，查重與 `26SM` 期數仍在。
5. 新「安排補堂」雙寫欄＋備註，直到讀取點改完並對帳通過。
6. 對帳：`2627` 33、`26SM` 可填的 34、無學年 9，欄必須等於解析結果；2 筆原堂消失列允許欄空、備註仍在。
7. 確認無「同一取消堂兩堂未取消補回」後，才加部分唯一索引（`WHERE` 補回堂未取消）。現況 0 組 live 重複，`26SM` 那兩組舊取消補回不會擋。

這樣 `2627` 已上過／已排的補回不會丟，`26SM` 暑期歷史點名後備也不會丟。外鍵是多一份真源，不是覆蓋真源。

## 建議落地順序（拍板後）

1. 可空外鍵，`ON DELETE` 依 O2。從現有備註 backfill。雙寫、雙讀。**先不加唯一索引**（除非 O4＝A）。
2. 備註框只編人手文字；儲存不碰外鍵。顯示 O12 唯讀關係。
3. 對帳：欄 vs 備註解析、重複補回、原堂已消失、自己指自己。
4. O4／O5 允許後再加部分唯一索引。
5. 讀取收斂到外鍵；歷史 `remarks` 標記留檔，不再當真源。停寫新標記（O6＝A）。

## 明確不做

- 第二個文字欄專存 `makeup_of=` 字串
- 開欄當日清掉歷史備註標記
- 用 `is_extra_lesson` 或 `roster_policy` 代替「補回哪一堂」
- 把學生請假調堂寫進本欄
- 未拍板 O5 就把分批補回填進本欄並加死唯一約束
