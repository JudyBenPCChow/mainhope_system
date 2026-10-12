#!/usr/bin/env python3
"""由 OneDrive 歷年《Student & Class Info》抽「學生 × 科目 × 學年」歷史事實。

背景：系統 26SM 才啟用，26SM 之前的報讀紀錄只在舊試算表。本 script 讀
`Student List` 分頁的 `Subject1`–`Subject5`，配對鍵用 `Student No`
（`SNFNL####`）對 `public.students.old_student_id`，唔用姓名模糊配對。

（注意：舊系統的 `SNFNL****` 已唔再係 `students.student_code`——後者現為 8 位
純數字。詳見 `docs/policies/enrollment/STUDENT_CODE.md`。）

預設只產生報告；SQL 亦一併產生，但唔會連線寫入（本機只有 anon key）。
需要 service role 時才用 --apply-rest（沿用 import_legacy_student_subjects.py 慣例）。

用法：
    python3 scripts/import_onedrive_student_subjects.py
    python3 scripts/import_onedrive_student_subjects.py --out-dir /tmp/backfill
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
import sys
import zipfile
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path
from typing import Any
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUT = Path(os.environ.get("ONEDRIVE_IMPORT_OUTPUT_DIR", "/tmp/mainhope-onedrive-import"))

ONEDRIVE = Path(
    "/Users/hoiyingfan/Library/CloudStorage/"
    "OneDrive-共用文件庫－MainHopeEducation/Main Hope Education - 文件"
)

# 學年標籤 → (來源檔, 學年期間)。學年期間用「9 月 1 日至翌年 8 月 31 日」，
# 因為 legacy_student_subject_enrollments.period_start/period_end 皆為 not null，
# 而來源檔只有學年（無逐科起訖日）。
#
# 注意：2526 已在 production 有 Notion 匯入的 142 列（期間 2026-01-01–2026-06-30）。
# 該批以**姓名**配對，本批以**學生編號**配對；兩者互補（實測 Notion 缺 27 人）。
# 但同一學生同一科會有兩列（期間不同，唯一鍵擋不住），故匯入 SQL 加了
# 「同學年內 (student_id, subject_id) 已存在就跳過」的護欄。2526 唔沿用 Notion
# 期間，因為本檔快照日期係 2025-08-01，早過 Notion 期間起點，照抄會與事實不符。
SOURCES: dict[str, dict[str, Any]] = {
    "2324": {
        "path": ONEDRIVE / "過往學年資料/2023-24 Regular/Student & Class Info 2023-2024.xlsx",
        "period_start": date(2023, 9, 1),
        "period_end": date(2024, 8, 31),
    },
    "2425": {
        "path": ONEDRIVE / "24-25 學年/Student & Class Info 2024-2025 (20241207）.xlsx",
        "period_start": date(2024, 9, 1),
        "period_end": date(2025, 8, 31),
    },
    "2526": {
        "path": ONEDRIVE / "25-26學年/Student & Class Info 2025-2026 (20250801）.xlsx",
        "period_start": date(2025, 9, 1),
        "period_end": date(2026, 8, 31),
    },
}

SHEET_NAME = "Student List"
NO_IDX, NAME_IDX, GRADE_IDX, STATUS_IDX = 1, 3, 9, 4
SUBJECT_IDX = [13, 14, 15, 16, 17]
CODE_RE = re.compile(r"^SNFNL\d+$")

# 來源值 → 科目代碼（對應 supabase/migrations/20260602160000_subjects_short_name.sql 的 23 科）
SUBJECT_VALUE_MAP: dict[str, str] = {
    "math": "MATH", "matth": "MATH",              # Matth = Math 錯字
    "eng": "ENG",
    "chi": "CHI",
    "phy": "PHY",
    "chem": "CHEM",
    "bio": "BIO",
    "is": "SCI", "科學": "SCI", "綜合科學": "SCI",
    "m1": "M1", "m2": "M2",
    "bafs": "BAFS", "企會財": "BAFS",
    "biochem": "SCI",                              # 用戶 2026-09-19 確認＝綜合科學
    "百人": "ENG", "北區百人": "ENG",              # 用戶 2026-09-19 確認＝英文科
    "econ": "ECON", "經濟": "ECON",
    "geog": "GEOG", "地理": "GEOG",
    "hist": "HIST", "歷史": "HIST",
    "chis": "CHIS", "中史": "CHIS",
    "clit": "CLIT", "文學": "CLIT",
    "ict": "ICT",
    "ths": "THS", "旅款": "THS",
    "va": "VA", "視藝": "VA",
    "mus": "MUS", "音樂": "MUS",
    "pe": "PE", "體育": "PE",
    "hmsc": "HMSC", "健管": "HMSC",
    "dat": "DAT", "設計": "DAT",
    # 功課輔導：入表但冷層按 subjects.code = 'HWK' 排除
    "hw": "HWK", "功課班": "HWK", "功課輔導": "HWK", "功輔": "HWK",
}

# 明確非科目：唔入表，但要出現在報告（唔可以靜默丟棄）
NON_SUBJECT_VALUES: set[str] = set()

# 已知無對應科目，須人手拍板（現時為空；有發現就加，唔好靜默丟棄）
KNOWN_UNMAPPED: dict[str, str] = {}

# 唔匯入的學生編號。SNFNL0268 跨年換咗人（2324 鄭蘊倩 / 2425 李卓楠），
# 無法判斷系統內呢個 code 屬邊個；用戶 2026-09-19 指示不理會此紀錄。
EXCLUDED_STUDENT_CODES = {"SNFNL0268"}
EXCLUDED_STUDENT_REASON = "Student No 跨年換人，無法確定系統內屬誰（用戶指示不理會）"


# ---------------------------------------------------------------- xlsx 讀取
# openpyxl 對部分舊檔的 stylesheet 會 raise；以下用 zip + ElementTree 直接讀。
NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
RNS = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
PRNS = "{http://schemas.openxmlformats.org/package/2006/relationships}"


def _col_index(ref: str | None) -> int:
    match = re.match(r"([A-Z]+)", ref or "")
    if not match:
        return 0
    value = 0
    for char in match.group(1):
        value = value * 26 + (ord(char) - 64)
    return value - 1


def _shared_strings(zf: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in zf.namelist():
        return []
    root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
    return ["".join(t.text or "" for t in si.iter(f"{NS}t")) for si in root.findall(f"{NS}si")]


def _sheet_target(zf: zipfile.ZipFile, wanted: str) -> str | None:
    workbook = ET.fromstring(zf.read("xl/workbook.xml"))
    rels = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
    rid_to_target = {
        rel.get("Id"): rel.get("Target") for rel in rels.findall(f"{PRNS}Relationship")
    }
    for sheet in workbook.find(f"{NS}sheets").findall(f"{NS}sheet"):
        if sheet.get("name") == wanted:
            target = rid_to_target.get(sheet.get(f"{RNS}id"), "")
            if target.startswith("/"):
                return target[1:]
            return target if target.startswith("xl/") else f"xl/{target}"
    return None


def read_sheet(path: Path, sheet_name: str) -> list[list[str]]:
    """讀單一分頁。注意：Student No 欄是跑到 Excel 上限的位置公式，
    所以呼叫方必須自行用「有無中文名」過濾真學生。"""
    with zipfile.ZipFile(path) as zf:
        target = _sheet_target(zf, sheet_name)
        if target is None:
            raise KeyError(f"{path.name} 無 {sheet_name!r} 分頁")
        sst = _shared_strings(zf)
        root = ET.fromstring(zf.read(target))
        rows: list[list[str]] = []
        for tr in root.iter(f"{NS}row"):
            cells: dict[int, str] = {}
            for cell in tr.findall(f"{NS}c"):
                idx = _col_index(cell.get("r"))
                if cell.get("t") == "inlineStr":
                    value = "".join(t.text or "" for t in cell.iter(f"{NS}t"))
                else:
                    node = cell.find(f"{NS}v")
                    value = node.text if node is not None and node.text is not None else ""
                    if cell.get("t") == "s" and value != "":
                        try:
                            value = sst[int(value)]
                        except (ValueError, IndexError):
                            value = ""
                cells[idx] = value
            width = max(cells) + 1 if cells else 0
            rows.append([cells.get(i, "") for i in range(width)])
        return rows


def cell(row: list[str], index: int) -> str:
    if index >= len(row):
        return ""
    value = row[index]
    return value.strip() if isinstance(value, str) else ("" if value in ("", None) else str(value).strip())


def normalize_subject(raw: str) -> tuple[str | None, str]:
    """回 (subject_code 或 None, 備註)。"""
    key = raw.strip().lower()
    # 去掉「3day hw」「3-Days HW」「5DAYS HW」之類前綴，全部歸 HWK
    if re.fullmatch(r"\d+\s*-?\s*days?\s*hw", key):
        return "HWK", "按堂數計的功輔班"
    if key in NON_SUBJECT_VALUES:
        return None, "非科目（計劃／推廣名稱）"
    if key in SUBJECT_VALUE_MAP:
        return SUBJECT_VALUE_MAP[key], ""
    if key in KNOWN_UNMAPPED:
        return None, KNOWN_UNMAPPED[key]
    return None, "無法辨識"


# ---------------------------------------------------------------- 抽取
def extract() -> tuple[list[dict[str, Any]], dict[str, Any]]:
    facts: list[dict[str, Any]] = []
    notes: dict[str, Any] = {
        "per_year": {}, "missing_files": [], "unmapped": [], "excluded": [], "deduped": []
    }

    for year, spec in SOURCES.items():
        path: Path = spec["path"]
        if not path.is_file():
            notes["missing_files"].append(str(path))
            continue
        rows = read_sheet(path, SHEET_NAME)
        seen: set[tuple[str, str]] = set()
        year_stats: dict[str, Any] = {
            "file": path.name,
            "rows_scanned": len(rows),
            "students_with_code": 0,
            "students_with_subjects": 0,
            "facts": 0,
            "deduped_cells": 0,
            "status": Counter(),
        }
        for row_no, row in enumerate(rows[1:], start=2):
            code = cell(row, NO_IDX)
            name_zh = cell(row, NAME_IDX)
            # Student No 是位置公式，只有連中文名一齊出現才算真學生
            if not CODE_RE.match(code) or not name_zh:
                continue
            if code in EXCLUDED_STUDENT_CODES:
                notes["excluded"].append(
                    {"year": year, "student_code": code, "name_zh": name_zh,
                     "raw": [cell(row, i) for i in SUBJECT_IDX if cell(row, i)],
                     "reason": EXCLUDED_STUDENT_REASON}
                )
                continue
            year_stats["students_with_code"] += 1
            raw_values = [cell(row, i) for i in SUBJECT_IDX]
            raw_values = [v for v in raw_values if v]
            if raw_values:
                year_stats["students_with_subjects"] += 1
            for raw in raw_values:
                subject_code, note = normalize_subject(raw)
                if subject_code is None:
                    notes["unmapped"].append(
                        {"year": year, "student_code": code, "name_zh": name_zh,
                         "raw": raw, "note": note, "row": row_no}
                    )
                    continue
                key = (code, subject_code)
                if key in seen:
                    # 同一學生同年同一科填咗兩格（例如 Subject1=Eng、Subject3=eng，
                    # 或 百人 與 北區百人 同指英文）。記落嚟，唔好靜默掉。
                    year_stats["deduped_cells"] += 1
                    notes["deduped"].append(
                        {"year": year, "student_code": code, "name_zh": name_zh,
                         "raw": raw, "kept_as": subject_code}
                    )
                    continue
                seen.add(key)
                facts.append({
                    "academic_year": year,
                    "student_code": code,
                    "student_name_zh": name_zh,
                    "grade": cell(row, GRADE_IDX),
                    "status": cell(row, STATUS_IDX),
                    "raw_subject": raw,
                    "subject_code": subject_code,
                    "source_file": path.name,
                    "source_sheet": SHEET_NAME,
                    "source_row": row_no,
                    "period_start": spec["period_start"].isoformat(),
                    "period_end": spec["period_end"].isoformat(),
                })
            if cell(row, STATUS_IDX):
                year_stats["status"][cell(row, STATUS_IDX)] += 1
        year_stats["facts"] = sum(1 for f in facts if f["academic_year"] == year)
        year_stats["status"] = dict(year_stats["status"])
        notes["per_year"][year] = year_stats

    return facts, notes


# ---------------------------------------------------------------- 輸出
def write_csv(facts: list[dict[str, Any]], path: Path) -> None:
    fields = ["academic_year", "student_code", "student_name_zh", "grade", "status",
              "raw_subject", "subject_code", "source_file", "source_sheet", "source_row",
              "period_start", "period_end"]
    with path.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(facts)


def write_report(facts: list[dict[str, Any]], notes: dict[str, Any], path: Path) -> None:
    by_year: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for fact in facts:
        by_year[fact["academic_year"]].append(fact)

    lines: list[str] = []
    lines.append("# OneDrive 歷年科目回填：抽取報告")
    lines.append("")
    lines.append("配對鍵：`Student No`（`SNFNL####`）→ `public.students.old_student_id`。")
    lines.append("未連線 production，故本報告只含來源端事實；配對率要跑 dry-run SQL 才知。")
    lines.append("（`students.student_code` 現為 8 位純數字，唔可以用嚟配 SNFNL。）")
    lines.append("")

    lines.append("## 一、逐年覆蓋")
    lines.append("")
    lines.append("| 學年 | 來源檔 | 真學生 | 有科目 | 抽出事實 | 年內重複格 | 狀態欄 |")
    lines.append("| --- | --- | ---: | ---: | ---: | ---: | --- |")
    for year in SOURCES:
        stats = notes["per_year"].get(year)
        if not stats:
            lines.append(f"| {year} | （缺檔） | – | – | – | – | – |")
            continue
        lines.append(
            f"| {year} | {stats['file']} | {stats['students_with_code']} | "
            f"{stats['students_with_subjects']} | {stats['facts']} | "
            f"{stats['deduped_cells']} | {stats['status'] or '（空）'} |"
        )
    lines.append("")
    lines.append("「有科目」＝該年 `Subject1`–`Subject5` 至少一格有值。其餘學生在來源檔")
    lines.append("本身無科目紀錄（多為 `inactive`），非本 script 漏抽。")
    lines.append("")

    lines.append("## 二、科目分佈（已正規化）")
    lines.append("")
    codes = sorted({f["subject_code"] for f in facts})
    lines.append("| 科目 | " + " | ".join(SOURCES) + " | 合計 |")
    lines.append("| --- |" + " ---: |" * (len(SOURCES) + 1))
    for code in codes:
        counts = [sum(1 for f in by_year[y] if f["subject_code"] == code) for y in SOURCES]
        lines.append(f"| {code} | " + " | ".join(str(c) for c in counts) + f" | {sum(counts)} |")
    lines.append("")

    lines.append("## 三、原始值 → 科目代碼對照")
    lines.append("")
    pairs = Counter((f["raw_subject"], f["subject_code"]) for f in facts)
    for (raw, code), count in sorted(pairs.items(), key=lambda kv: (-kv[1], kv[0])):
        lines.append(f"- `{raw}` → `{code}`（{count}）")
    lines.append("")

    if notes["unmapped"] or notes["excluded"] or notes["deduped"]:
        lines.append("## 四、未入表嘅嘢（**唔可以靜默丟棄**）")
        lines.append("")

    if notes["deduped"]:
        lines.append("**合併咗嘅重複格**（同一學生同年同一科填咗多過一格，只入一條）：")
        lines.append("")
        lines.append("| 學年 | 學生編號 | 姓名 | 被合併嘅值 | 併入 |")
        lines.append("| --- | --- | --- | --- | --- |")
        for item in notes["deduped"]:
            lines.append(
                f"| {item['year']} | `{item['student_code']}` | {item['name_zh']} | "
                f"`{item['raw']}` | `{item['kept_as']}` |"
            )
        lines.append("")

    if notes["unmapped"]:
        lines.append("**無法辨識嘅科目值：**")
        lines.append("")
        grouped = Counter((u["raw"], u["note"]) for u in notes["unmapped"])
        lines.append("| 原始值 | 原因 | 次數 | 涉及學年 |")
        lines.append("| --- | --- | ---: | --- |")
        for (raw, note), count in grouped.most_common():
            years = sorted({u["year"] for u in notes["unmapped"] if u["raw"] == raw})
            lines.append(f"| `{raw}` | {note} | {count} | {', '.join(years)} |")
        lines.append("")

    if notes["excluded"]:
        lines.append("**排除嘅學生（整個人跳過）：**")
        lines.append("")
        lines.append("| 學年 | 學生編號 | 姓名 | 原科目格 | 原因 |")
        lines.append("| --- | --- | --- | --- | --- |")
        for item in notes["excluded"]:
            lines.append(
                f"| {item['year']} | `{item['student_code']}` | {item['name_zh']} | "
                f"{item['raw'] or '（無）'} | {item['reason']} |"
            )
        lines.append("")

    lines.append("## 五、重複學生（跨年）")
    lines.append("")
    names: dict[str, set[str]] = defaultdict(set)
    for fact in facts:
        names[fact["student_code"]].add(fact["student_name_zh"])
    conflicts = {c: n for c, n in names.items() if len(n) > 1}
    if conflicts:
        lines.append("**同一 Student No 跨年出現唔同姓名** —— 位置公式改動過 row 次序，須人手核對：")
        lines.append("")
        for code, name_set in sorted(conflicts.items()):
            detail = ", ".join(
                f"{y}:{sorted({f['student_name_zh'] for f in by_year[y] if f['student_code'] == code})}"
                for y in SOURCES if any(f["student_code"] == code for f in by_year[y])
            )
            lines.append(f"- `{code}` → {detail}")
        lines.append("")
    else:
        lines.append("無。")
        lines.append("")

    multi = sum(1 for c in names if sum(1 for f in facts if f["student_code"] == c) > 1)
    lines.append(f"共 {len(names)} 名學生、{len(facts)} 條事實；其中 {multi} 名跨多個學年。")
    lines.append("")

    if notes["missing_files"]:
        lines.append("## 六、缺檔")
        lines.append("")
        for item in notes["missing_files"]:
            lines.append(f"- {item}")
        lines.append("")

    path.write_text("\n".join(lines), encoding="utf-8")


def sql_literal(value: Any) -> str:
    if value is None:
        return "null"
    return "'" + str(value).replace("'", "''") + "'"


def _fact_values(facts: list[dict[str, Any]]) -> list[str]:
    return [
        "(" + ", ".join([
            sql_literal(fact["academic_year"]),
            sql_literal(fact["student_code"]),
            sql_literal(fact["student_name_zh"]),
            sql_literal(fact["subject_code"]),
            sql_literal(fact["raw_subject"]),
            sql_literal(fact["source_file"]),
            sql_literal(fact["period_start"]),
            sql_literal(fact["period_end"]),
        ]) + ")"
        for fact in facts
    ]


SQL_HEADER = """-- 由 scripts/import_onedrive_student_subjects.py 產生
-- 執行：npx supabase db query --linked --file <此檔>
begin;

create temporary table onedrive_facts (
  academic_year text not null,
  student_code text not null,  -- 來源檔的 Student No（SNFNL####）；配對 students.old_student_id
  student_name_zh text not null,
  subject_code text not null,
  raw_subject text not null,
  source_file text not null,
  period_start date not null,
  period_end date not null
) on commit drop;

insert into onedrive_facts values
"""

# 配對用 students.old_student_id（舊系統 SNFNL 學號）。
#
# 注意：唔可以用 students.student_code——佢而家係 8 位純數字（例：20261483），
# SNFNL 已搬到 old_student_id（見 docs/policies/enrollment/STUDENT_CODE.md）。
# old_student_id 無唯一索引，所以用 lateral 聚合配對數，>1 就當 ambiguous 唔入。
# 同時核對姓名：SNFNL 源自位置公式，row 次序改過就會漂，姓名唔夾唔入。
SQL_MATCH = """;

create temporary table onedrive_matched on commit drop as
select
  f.*,
  m.student_id,
  m.match_count,
  m.matched_name,
  sub.id as subject_id,
  case
    when m.match_count = 0 then 'unmatched_old_student_id'
    when m.match_count > 1 then 'ambiguous_old_student_id'
    when btrim(m.matched_name) <> f.student_name_zh then 'name_mismatch'
    when sub.id is null then 'unmatched_subject'
    else 'matched'
  end as match_status
from onedrive_facts f
left join lateral (
  select
    count(*)::int as match_count,
    min(s.id::text)::uuid as student_id,
    min(btrim(s.full_name)) as matched_name
  from public.students s
  where btrim(s.old_student_id) = f.student_code
) m on true
left join public.subjects sub on upper(sub.code) = f.subject_code;
"""

SQL_REPORT = """
select jsonb_pretty(jsonb_build_object(
  'old_student_id_coverage', (
    select jsonb_build_object(
      'students_total', count(*)::int,
      'with_old_student_id', count(old_student_id)::int
    ) from public.students
  ),
  'duplicate_old_student_ids', coalesce((
    select jsonb_agg(jsonb_build_object('old_student_id', k, 'n', n))
    from (
      select btrim(old_student_id) as k, count(*)::int as n
      from public.students
      where nullif(btrim(old_student_id), '') is not null
      group by btrim(old_student_id) having count(*) > 1
      order by k limit 50
    ) d
  ), '[]'::jsonb),
  'status_counts', (
    select jsonb_object_agg(match_status, n)
    from (select match_status, count(*)::int as n from onedrive_matched group by match_status) c
  ),
  'matched_facts', (select count(*) from onedrive_matched where match_status = 'matched'),
  'problem_total', (select count(*) from onedrive_matched where match_status <> 'matched'),
  'per_year', (
    select jsonb_object_agg(academic_year, jsonb_build_object(
      'facts', n, 'students', students))
    from (
      select academic_year, count(*)::int as n, count(distinct student_id)::int as students
      from onedrive_matched where match_status = 'matched' group by academic_year
    ) y
  ),
  'will_skip_already_present', (
    select count(*)
    from onedrive_matched m
    where m.match_status = 'matched'
      and exists (
        select 1 from public.legacy_student_subject_enrollments h
        where h.student_id = m.student_id
          and h.subject_id = m.subject_id
          and h.period_start <= m.period_end
          and h.period_end >= m.period_start
      )
  ),
  -- 只列首 100 條；總數見 problem_total
  'problems_sample', coalesce((
    select jsonb_agg(jsonb_build_object(
      'year', academic_year, 'code', student_code, 'name', student_name_zh,
      'raw', raw_subject, 'status', match_status))
    from (
      select * from onedrive_matched where match_status <> 'matched'
      order by match_status, academic_year, student_code limit 100
    ) p
  ), '[]'::jsonb)
)) as report;
"""

SQL_IMPORT_BODY = """
create temporary table onedrive_batches on commit drop as
select
  academic_year,
  min(source_file) || ' [' || academic_year || ']' as source_filename,
  period_start,
  period_end,
  count(*)::int as total_source_rows,
  count(*) filter (where match_status <> 'matched')::int as unmatched_count
from onedrive_matched
group by academic_year, period_start, period_end;

insert into public.legacy_import_batches (
  source_system, source_filename, period_start, period_end,
  total_source_rows, imported_rows, unmatched_count, duplicate_count
)
select 'onedrive_xlsx', source_filename, period_start, period_end,
       total_source_rows, 0, unmatched_count, 0
from onedrive_batches;

-- 護欄：同學年內同一 (學生, 科目) 已存在（例如 2526 的 Notion 匯入）就跳過，
-- 否則同一科會出現兩列、歷年科目分頁重複。
create temporary table onedrive_to_insert on commit drop as
select m.*, b.id as import_batch_id
from onedrive_matched m
join onedrive_batches ob on ob.academic_year = m.academic_year
join public.legacy_import_batches b
  on b.source_filename = ob.source_filename and b.source_system = 'onedrive_xlsx'
where m.match_status = 'matched'
  and not exists (
    select 1
    from public.legacy_student_subject_enrollments h
    where h.student_id = m.student_id
      and h.subject_id = m.subject_id
      and h.period_start <= m.period_end
      and h.period_end >= m.period_start
  );

insert into public.legacy_student_subject_enrollments (
  student_id, subject_id, period_start, period_end,
  source_system, source_student_ref, source_student_name,
  source_subject_label, import_batch_id
)
select student_id, subject_id, period_start, period_end,
       'onedrive_xlsx', student_code, student_name_zh, raw_subject, import_batch_id
from onedrive_to_insert
on conflict (student_id, subject_id, period_start, period_end) do nothing;

update public.legacy_import_batches b
set imported_rows = (
  select count(*) from public.legacy_student_subject_enrollments h where h.import_batch_id = b.id
)
where b.source_system = 'onedrive_xlsx';

select
  (select count(*) from onedrive_matched where match_status = 'matched') as matched_facts,
  (select count(*) from onedrive_to_insert) as inserted_after_guard,
  (select count(*) from onedrive_matched where match_status = 'matched')
    - (select count(*) from onedrive_to_insert) as skipped_already_present;

select * from public.legacy_import_batches where source_system = 'onedrive_xlsx';
"""


def write_dry_run_sql(facts: list[dict[str, Any]], path: Path) -> None:
    """只核對、唔寫入（結尾 rollback）。先跑此檔，核完才跑匯入檔。"""
    path.write_text(
        SQL_HEADER + ",\n".join(_fact_values(facts)) + SQL_MATCH + SQL_REPORT + "\nrollback;\n",
        encoding="utf-8",
    )


def write_import_sql(facts: list[dict[str, Any]], path: Path) -> None:
    path.write_text(
        SQL_HEADER + ",\n".join(_fact_values(facts)) + SQL_MATCH + SQL_IMPORT_BODY + "\ncommit;\n",
        encoding="utf-8",
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()
    args.out_dir.mkdir(parents=True, exist_ok=True)

    facts, notes = extract()
    if not facts:
        print("無抽出任何事實，請檢查來源檔。", file=sys.stderr)
        return 1

    csv_path = args.out_dir / "onedrive_student_subjects_facts.csv"
    report_path = args.out_dir / "onedrive_student_subjects_report.md"
    dry_run_path = args.out_dir / "onedrive_student_subjects_dry_run.sql"
    import_path = args.out_dir / "onedrive_student_subjects_import.sql"
    write_csv(facts, csv_path)
    write_report(facts, notes, report_path)
    write_dry_run_sql(facts, dry_run_path)
    write_import_sql(facts, import_path)

    print(json.dumps({
        "facts": len(facts),
        "students": len({f["student_code"] for f in facts}),
        "csv": str(csv_path),
        "report": str(report_path),
        "dry_run_sql": str(dry_run_path),
        "import_sql": str(import_path),
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
