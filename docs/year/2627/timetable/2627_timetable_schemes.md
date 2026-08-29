# 2627 時間表方案索引

> **排課規則（權威）：** [`../../../policies/scheduling/SCHEDULING_RULES.md`](../../../policies/scheduling/SCHEDULING_RULES.md)

**產出習慣（2026-08-19 起）：** 新一版先出 **md** 審閱；營運決定出檔後先 `python3 scripts/generate_2627_timetable_doc.py --word`（docx 用 Word 內建目錄／頁首頁尾，PDF 由 Word 另存）。4.x 自動加版（4.1、4.2…）。舊版 **md** 保留；舊版 **docx／pdf** 已刪（現行產出只留 v4.0）。

**Folder 結構：** `versions/v<版本>/` 保存各版方案與老師附件；`archive/` 保存早期版本及試排；`assets/fonts/` 保存字型。根目錄只留本索引與排課需求。

## 已定稿 — ver. 4.0（2026-08-24 營運簽收）

| 項目 | 值 |
| --- | --- |
| 方案 | [`md`](versions/v4.0/2627_timetable_scheme_v4.0.md)／[`docx`](versions/v4.0/2627_timetable_scheme_v4.0.docx)／[`pdf`](versions/v4.0/2627_timetable_scheme_v4.0.pdf) |
| 老師一周排程（獨立附件） | [`md`](versions/v4.0/2627_timetable_teachers_week_v4.0.md)／[`docx`](versions/v4.0/2627_timetable_teachers_week_v4.0.docx)／[`pdf`](versions/v4.0/2627_timetable_teachers_week_v4.0.pdf) |
| 周時間表（獨立附件） | [`md`](versions/v4.0/2627_timetable_weekly_v4.0.md)／[`docx`](versions/v4.0/2627_timetable_weekly_v4.0.docx)／[`pdf`](versions/v4.0/2627_timetable_weekly_v4.0.pdf) |
| 空房時間（列表及日視圖1） | [`md`](versions/v4.0/2627_timetable_empty_rooms_v4.0.md)／[`docx`](versions/v4.0/2627_timetable_empty_rooms_v4.0.docx) |
| 班號對照 | [`csv`](versions/v4.0/2627_timetable_class_codes_v4.0.csv) |
| Word／PDF | 已出檔（空房僅 docx） |
| 生成腳本 | [`generate_2627_timetable_doc.py`](../../../../scripts/generate_2627_timetable_doc.py) |
| 已排 | **66** 班（全具名老師）。方案檔或仍標 Cyndi 一對一預留 1 格；**本輪不入庫**，之後人手 |
| 已確認班別時間 | **Cyndi Ng、Emma Cai、Liam Lai、Leo Chan**；後續方案不得改動班別、逢星期或時段，除非收到明確指示 |
| 相對 3.10 | Katie 取消一至四 19:00 四堂（本版 13 班）；中一／中二／中三中文班號由 A 起重編 |

**文件結構：** 方案＝封面列與 3.10 之分別 → 1 排程原則 → 2 各級開科情況（順接＋班數）→ 5 各科各級班別列表 → 6 未排與待排（按老師／按科目）→ 7 所有班別清單 → 附表（本輪回覆與出勤）。周時間表另冊（橫向、一日一頁；標題下直接接表；格內含時段）。

## ver. 3.10（2026-08-23；檔案保留不動）

| 項目 | 值 |
| --- | --- |
| 方案 | [`md`](versions/v3.10/2627_timetable_scheme_v3.10.md) |
| 老師一周排程（獨立附件） | [`md`](versions/v3.10/2627_timetable_teachers_week_v3.10.md) |
| 周時間表（獨立附件） | [`md`](versions/v3.10/2627_timetable_weekly_v3.10.md) |
| 空房時間（列表及日視圖1） | [`md`](versions/v3.10/2627_timetable_empty_rooms_v3.10.md) |
| 班號對照 | [`csv`](versions/v3.10/2627_timetable_class_codes_v3.10.csv) |
| Word／PDF | 已刪（只留 md） |
| 生成腳本 | [`generate_2627_timetable_doc.py`](../../../../scripts/generate_2627_timetable_doc.py) |
| 已排 | **70** 班（全具名老師）。方案檔或仍標 Cyndi 一對一預留 1 格；**本輪不入庫**，之後人手 |
| 已確認班別時間 | **Cyndi Ng、Emma Cai、Liam Lai、Leo Chan**；後續方案不得改動班別、逢星期或時段，除非收到明確指示 |
| 相對 3.9 | Christine 星期六改 12:45 中四、14:00 中五、16:30 中六；不避撞科；中四／中五／中六中文各 2 班 |

**文件結構：** 方案＝封面列與 3.9 之分別 → 1 排程原則 → 2 各級開科情況（順接＋班數）→ 5 各科各級班別列表 → 6 未排與待排（按老師／按科目）→ 7 所有班別清單 → 附表（本輪回覆與出勤）。周時間表另冊（橫向、一日一頁；標題下直接接表；格內含時段）。

## ver. 3.9（2026-08-23；檔案保留不動）

| 項目 | 值 |
| --- | --- |
| 方案 | [`md`](versions/v3.9/2627_timetable_scheme_v3.9.md) |
| 老師一周排程（獨立附件） | [`md`](versions/v3.9/2627_timetable_teachers_week_v3.9.md) |
| 周時間表（獨立附件） | [`md`](versions/v3.9/2627_timetable_weekly_v3.9.md) |
| 空房時間（列表及日視圖1） | [`md`](versions/v3.9/2627_timetable_empty_rooms_v3.9.md) |
| 班號對照 | [`csv`](versions/v3.9/2627_timetable_class_codes_v3.9.csv) |
| Word／PDF | 已刪（只留 md） |
| 生成腳本 | [`generate_2627_timetable_doc.py`](../../../../scripts/generate_2627_timetable_doc.py) |
| 已排 | **70** 班（全具名老師）＋ Cyndi Ng 一對一高中英文預留 1 格 |
| 已確認班別時間 | **Cyndi Ng、Emma Cai、Liam Lai、Leo Chan**；後續方案不得改動班別、逢星期或時段，除非收到明確指示 |
| 相對 3.8 | Christine 取消星期五，只六／日；星期六 12:45／14:00／16:30 三堂；Jackson 12:45 改英仙；Mark 中四數學改 17:45 |

**文件結構：** 方案＝封面列與 3.8 之分別 → 1 排程原則 → 2 各級開科情況（順接＋班數）→ 5 各科各級班別列表 → 6 未排與待排（按老師／按科目）→ 7 所有班別清單 → 附表（本輪回覆與出勤）。周時間表另冊（橫向、一日一頁；標題下直接接表；格內含時段）。

## ver. 3.8（2026-08-23；檔案保留不動）

| 項目 | 值 |
| --- | --- |
| 方案 | [`md`](versions/v3.8/2627_timetable_scheme_v3.8.md) |
| 老師一周排程（獨立附件） | [`md`](versions/v3.8/2627_timetable_teachers_week_v3.8.md) |
| 周時間表（獨立附件） | [`md`](versions/v3.8/2627_timetable_weekly_v3.8.md) |
| 空房時間（列表及日視圖1） | [`md`](versions/v3.8/2627_timetable_empty_rooms_v3.8.md) |
| 班號對照 | [`csv`](versions/v3.8/2627_timetable_class_codes_v3.8.csv) |
| Word／PDF | 未出檔（先 md 審閱） |
| 生成腳本 | [`generate_2627_timetable_doc.py`](../../../../scripts/generate_2627_timetable_doc.py) |
| 已排 | **70** 班（全具名老師）＋ Cyndi Ng 一對一高中英文預留 1 格 |
| 已確認班別時間 | **Cyndi Ng、Emma Cai、Liam Lai、Leo Chan**；後續方案不得改動班別、逢星期或時段，除非收到明確指示 |
| 相對 3.7 | 星期五 16:30 中四中文改中五中文；中四中文只餘星期日一班 |

**文件結構：** 方案＝封面列與 3.7 之分別 → 1 排程原則 → 2 各級開科情況（順接＋班數）→ 5 各科各級班別列表 → 6 未排與待排（按老師／按科目）→ 7 所有班別清單 → 附表（本輪回覆與出勤）。周時間表另冊（橫向、一日一頁；標題下直接接表；格內含時段）。

## ver. 3.7（2026-08-22；檔案保留不動）

| 項目 | 值 |
| --- | --- |
| 方案 | [`md`](versions/v3.7/2627_timetable_scheme_v3.7.md) |
| 老師一周排程（獨立附件） | [`md`](versions/v3.7/2627_timetable_teachers_week_v3.7.md) |
| 周時間表（獨立附件） | [`md`](versions/v3.7/2627_timetable_weekly_v3.7.md) |
| 空房時間（列表及日視圖1） | [`md`](versions/v3.7/2627_timetable_empty_rooms_v3.7.md) |
| 班號對照 | [`csv`](versions/v3.7/2627_timetable_class_codes_v3.7.csv) |
| Word／PDF | 未出檔（先 md 審閱） |
| 生成腳本 | [`generate_2627_timetable_doc.py`](../../../../scripts/generate_2627_timetable_doc.py) |
| 已排 | **70** 班（全具名老師）＋ Cyndi Ng 一對一高中英文預留 1 格 |
| 已確認班別時間 | **Cyndi Ng、Emma Cai、Liam Lai、Leo Chan**；後續方案不得改動班別、逢星期或時段，除非收到明確指示 |
| 相對 3.6 | Christine Fan 改六班（五／六／日）；取消星期一；中文科班號重編；星期五 16:30 中四為平日高中時段例外 |

**文件結構：** 方案＝封面列與 3.6 之分別 → 1 排程原則 → 2 各級開科情況（順接＋班數）→ 5 各科各級班別列表 → 6 未排與待排（按老師／按科目）→ 7 所有班別清單 → 附表（本輪回覆與出勤）。周時間表另冊（橫向、一日一頁；標題下直接接表；格內含時段）。

## ver. 3.6（2026-08-21；檔案保留不動）

| 項目 | 值 |
| --- | --- |
| 方案 | [`md`](versions/v3.6/2627_timetable_scheme_v3.6.md) |
| 老師一周排程（獨立附件） | [`md`](versions/v3.6/2627_timetable_teachers_week_v3.6.md) |
| 周時間表（獨立附件） | [`md`](versions/v3.6/2627_timetable_weekly_v3.6.md) |
| 空房時間（列表及日視圖1） | [`md`](versions/v3.6/2627_timetable_empty_rooms_v3.6.md) |
| 班號對照 | [`csv`](versions/v3.6/2627_timetable_class_codes_v3.6.csv) |
| Word／PDF | 已刪（只留 md） |
| 生成腳本 | [`generate_2627_timetable_doc.py`](../../../../scripts/generate_2627_timetable_doc.py) |
| 已排 | **71** 班（全具名老師）＋ Cyndi Ng 一對一高中英文預留 1 格 |
| 已確認班別時間 | **Cyndi Ng、Emma Cai、Liam Lai、Leo Chan**；後續方案不得改動班別、逢星期或時段，除非收到明確指示 |
| 相對 3.5 | Billy Shek 改只教中二／中三中文；時段改六 16:30 中三、17:45 中二（17E） |

**文件結構：** 方案＝封面列與 3.5 之分別 → 1 排程原則 → 2 各級開科情況（順接＋班數）→ 5 各科各級班別列表 → 6 未排與待排（按老師／按科目）→ 7 所有班別清單 → 附表（本輪回覆與出勤）。周時間表另冊（橫向、一日一頁；標題下直接接表；格內含時段）。

## ver. 3.5（2026-08-20；檔案保留不動）

| 項目 | 值 |
| --- | --- |
| 方案 | [`md`](versions/v3.5/2627_timetable_scheme_v3.5.md) |
| 老師一周排程（獨立附件） | [`md`](versions/v3.5/2627_timetable_teachers_week_v3.5.md) |
| 周時間表（獨立附件） | [`md`](versions/v3.5/2627_timetable_weekly_v3.5.md) |
| 空房時間（列表及日視圖1） | [`md`](versions/v3.5/2627_timetable_empty_rooms_v3.5.md) |
| Word／PDF | 未出檔 |
| 生成腳本 | [`generate_2627_timetable_doc.py`](../../../../scripts/generate_2627_timetable_doc.py) |
| 已排 | **71** 班（全具名老師）＋ Cyndi Ng 一對一高中英文預留 1 格 |
| 已確認班別時間 | **Cyndi Ng、Emma Cai、Liam Lai、Leo Chan**；後續方案不得改動班別、逢星期或時段，除非收到明確指示 |
| 相對 3.4 | 加 Billy Shek 兩班初中中文、Phoebe Tam 科學／化學各級各一 |

**文件結構：** 方案＝封面列與 3.4 之分別 → 1 排程原則 → 2 各級開科情況（順接＋班數）→ 5 各科各級班別列表 → 6 未排與待排（按老師／按科目）→ 7 所有班別清單 → 附表（本輪回覆與出勤）。周時間表另冊（橫向、一日一頁；標題下直接接表；格內含時段）。

## ver. 3.4（2026-08-20；檔案保留不動）

| 項目 | 值 |
| --- | --- |
| 方案 | [`md`](versions/v3.4/2627_timetable_scheme_v3.4.md) |
| 老師一周排程（獨立附件） | [`md`](versions/v3.4/2627_timetable_teachers_week_v3.4.md) |
| 周時間表（獨立附件） | [`md`](versions/v3.4/2627_timetable_weekly_v3.4.md) |
| 空房時間（列表及日視圖1） | [`md`](versions/v3.4/2627_timetable_empty_rooms_v3.4.md) |
| Word／PDF | 未出檔 |
| 生成腳本 | [`generate_2627_timetable_doc.py`](../../../../scripts/generate_2627_timetable_doc.py) |
| 已排 | **63** 班（全具名老師）＋ Cyndi Ng 一對一高中英文預留 1 格 |
| 已確認班別時間 | **Cyndi Ng、Emma Cai、Liam Lai、Leo Chan**；後續方案不得改動班別、逢星期或時段，除非收到明確指示 |
| 相對 3.3 | 加 Liam Lai／Leo Chan 班別時間鎖定；班格不變 |

**文件結構：** 方案＝封面列與 3.3 之分別 → 1 排程原則 → 2 各級開科情況（順接＋班數）→ 5 各科各級班別列表 → 6 未排與待排（按老師／按科目）→ 7 所有班別清單 → 附表（本輪回覆與出勤）。周時間表另冊（橫向、一日一頁；標題下直接接表；格內含時段）。

## ver. 3.3（2026-08-19；檔案保留不動）

| 項目 | 值 |
| --- | --- |
| 方案 | [`md`](versions/v3.3/2627_timetable_scheme_v3.3.md) |
| 老師一周排程（獨立附件） | [`md`](versions/v3.3/2627_timetable_teachers_week_v3.3.md) |
| 周時間表（獨立附件） | [`md`](versions/v3.3/2627_timetable_weekly_v3.3.md) |
| 空房時間（列表及日視圖1） | [`md`](versions/v3.3/2627_timetable_empty_rooms_v3.3.md) |
| 已排 | **63** 班 |
| 已確認班別時間 | **Cyndi Ng、Emma Cai** |
| 相對 3.2 | 方案移除第 8 節周時間表；周時間表改為獨立 md／Word／PDF；班格不變 |

## ver. 3.2（2026-08-19；檔案保留不動）

| 項目 | 值 |
| --- | --- |
| 方案 | [`md`](versions/v3.2/2627_timetable_scheme_v3.2.md) |
| 老師一周排程（獨立附件） | [`md`](versions/v3.2/2627_timetable_teachers_week_v3.2.md) |
| 已排 | **63** 班 |
| 相對 3.1 | Henry Wong 只排星期六 14:00 起連續三堂中四／中五／中六生物；移除星期五兩堂 |

## ver. 3.1（2026-08-19；檔案保留不動）

| 項目 | 值 |
| --- | --- |
| 審閱稿 | [`2627_timetable_scheme_v3.1.md`](versions/v3.1/2627_timetable_scheme_v3.1.md)／老師附件 [`2627_timetable_teachers_week_v3.1.md`](versions/v3.1/2627_timetable_teachers_week_v3.1.md) |
| Word／PDF | 未出檔 |
| 已排 | **64** 班 |
| 相對 3.0 | 移除 Leo Chan 星期日 17:45 中五級物理科（B）；Leo 由 6 班減至 5 班，全部星期六 |

## ver. 3.0（2026-08-19；檔案保留不動）

| 項目 | 值 |
| --- | --- |
| 審閱稿 | [`2627_timetable_scheme_v3.0.md`](versions/v3.0/2627_timetable_scheme_v3.0.md)／老師附件 [`2627_timetable_teachers_week_v3.0.md`](versions/v3.0/2627_timetable_teachers_week_v3.0.md) |
| 紀錄文件 | docx／pdf 已刪 |
| 老師一周排程（獨立附件） | docx／pdf 已刪 |
| 已排 | **65** 班 |
| 相對 2.5 | 加 Henry／Cheryl；Mark 六午膳後連三；Liam 只中二／三；Leo 減至 6；Emma 改中三英文 |

## ver. 2.5（2026-08-18；檔案保留不動）

| 項目 | 值 |
| --- | --- |
| 紀錄文件 | docx／pdf 已刪 |
| 老師一周排程（獨立附件） | docx／pdf 已刪 |
| 已排 | **60** 班 |
| 相對 2.4 | Christine 星期四兩班改星期五；日視圖一日一頁；返學時間灰底；時段空房數；正文改列點 |

## ver. 2.4（2026-08-18；檔案保留不動）

| 項目 | 值 |
| --- | --- |
| 紀錄文件 | docx／pdf 已刪 |
| 老師一周排程（獨立附件） | docx／pdf 已刪 |
| 生成腳本 | [`generate_2627_timetable_doc.py`](../../../../scripts/generate_2627_timetable_doc.py) |
| 已排 | **60** 班（全具名老師）＋ Cyndi Ng 一對一高中英文預留 1 格 |
| 相對 2.3 | 班別不變。同日順接只限五／六／日；第四章加各科／各級合計；新增第五章按科目再按年級列班 |

**文件結構：** 封面列與 2.3 之分別 → 排程原則 → 本輪老師回覆 → 各員工出勤／班數／科目 → 各級各科班數（含合計）→ 各科各級班別 → 未排與待補 → 一周總覽 → 各天詳細表。

## ver. 2.3（2026-08-18；檔案保留不動）

| 項目 | 值 |
| --- | --- |
| 紀錄文件 | docx／pdf 已刪 |
| 老師一周排程（獨立附件） | docx／pdf 已刪 |
| 已排 | **60** 班 |
| 備註 | Katie 排滿 17；Mark 星期六加中五／中六數學；取消 Christine 日中四A、中五B；周視圖不排日灰底、無斜線 |

## ver. 2.2（2026-08-18；檔案保留不動）

| 項目 | 值 |
| --- | --- |
| 紀錄文件 | docx／pdf 已刪 |
| 老師一周排程 | docx／pdf 已刪 |
| 已排 | **56** 班 |
| 備註 | Mark 取消每周 9 班上限；Katie 每周最多 17（當時仍 13）；老師附件標 Katie 空堂／放假斜線 |

## ver. 2.1（2026-08-18；檔案保留不動）

| 項目 | 值 |
| --- | --- |
| 紀錄文件 | docx／pdf 已刪 |
| 老師一周排程 | docx／pdf 已刪 |
| 已排 | **56** 班 |
| 備註 | 連堂跟問卷；Emma 集中星期日；Judy 中六×2＋中五×1；課室優先；取消開會空檔 |

## ver. 2.0（2026-08-18；檔案保留不動）

| 項目 | 值 |
| --- | --- |
| 紀錄文件 | docx／pdf 已刪 |
| 老師一周排程 | docx／pdf 已刪 |
| 已排 | **55** 班 |
| 備註 | 保留 08-12 原 36 班，按 PT 回覆空格加班 |

## 更早一版（2026-08-08；修訂 2026-08-12）

| 項目 | 值 |
| --- | --- |
| 紀錄文件 | docx／pdf 已刪 |
| 老師一周排程 | docx／pdf 已刪 |
| 已排 | **36** 班 |

## 歷史試排（2026-07-31；已過時，僅備查）

| 方案 | 檔案 | 備註 |
| --- | --- | --- |
| A | [`2627_timetable_scheme_a.html`](archive/prototypes/2627_timetable_scheme_a.html) | 含 TBD；Jackson 五＋六 |
| B | [`2627_timetable_scheme_b.html`](archive/prototypes/2627_timetable_scheme_b.html) | 含 TBD；Christine 日／一／三 |
| v3–v5 | [`archive/prototypes/`](archive/prototypes/) | 較早草案 |
