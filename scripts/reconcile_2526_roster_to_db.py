#!/usr/bin/env python3
"""
拉取 Supabase students / classes，與 2526 課程及班別 CSV 做對照，
產出 import-output/reconcile_report.json 與 reconcile_report.md。

用法（專案根目錄）：
  python3 scripts/reconcile_2526_roster_to_db.py [CSV路徑]
"""

from __future__ import annotations

import csv
import importlib.util
import json
import re
import ssl
import sys
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "import-output"
DEFAULT_CSV = Path(
    "/Users/hoiyingfan/Downloads/私人和共用/"
    "【2526】課程及班別 25273b60cb028020b6a9f9b45f2c52b3_all.csv"
)


def _load_importer():
    p = ROOT / "scripts" / "import_2526_roster.py"
    spec = importlib.util.spec_from_file_location("roster_importer", p)
    m = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(m)
    return m


def load_env() -> tuple[str, str]:
    m = _load_importer()
    return m.load_env()


def supabase_fetch_all(sb_url: str, key: str, path_base: str) -> list[dict[str, Any]]:
    """path_base 例如 students?select=id,full_name"""
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    page = 1000
    offset = 0
    out: list[dict[str, Any]] = []
    while True:
        path = f"{path_base}&limit={page}&offset={offset}"
        full = f"{sb_url.rstrip('/')}/rest/v1/{path}"
        req = urllib.request.Request(
            full,
            headers={"apikey": key, "Authorization": f"Bearer {key}"},
        )
        opener = urllib.request.build_opener(urllib.request.HTTPSHandler(context=ctx))
        with opener.open(req, timeout=120) as resp:
            rows = json.loads(resp.read().decode())
        if not rows:
            break
        out.extend(rows)
        if len(rows) < page:
            break
        offset += page
    return out


def norm_ws(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").strip())


def strip_trailing_teacher_code(title: str) -> str:
    """去掉班名尾端英文代碼／縮寫（如 CFAN、MYU、PHEB、LIAM）。"""
    t = norm_ws(title)
    t = re.sub(r"[\s　]+$", "", t)
    # 尾端 2+ 大寫字母，或 CamelCase 單字
    for _ in range(3):
        t2 = re.sub(
            r"(?:[\s　]+)?(?:[A-Z]{2,}|[A-Z][a-z]+)\s*$",
            "",
            t,
        ).strip()
        if t2 == t:
            break
        t = t2
    return t


def strip_roster_group_suffix(title: str) -> str:
    """如：北區百人英文科星期三組 → 北區百人英文科"""
    t = title
    t = re.sub(r"星期[一二三四五六日天]組\s*$", "", t).strip()
    return t


def roster_match_keys(title: str) -> list[str]:
    raw = strip_trailing_teacher_code(title)
    raw = strip_roster_group_suffix(raw)
    keys: list[str] = []
    t = norm_ws(raw)
    if t:
        keys.append(t)
    m = re.match(r"^(.+?)（(.+)）$", t)
    if m:
        a, b = m.group(1).strip(), m.group(2).strip()
        keys.extend([f"{a}{b}", f"{b}{a}", a, b])
    seen: set[str] = set()
    out: list[str] = []
    for k in keys:
        k = norm_ws(k)
        if k and k not in seen:
            seen.add(k)
            out.append(k)
    return out


def grade_tokens(grades: list[str] | None) -> set[str]:
    s: set[str] = set()
    if not grades:
        return s
    for g in grades:
        x = norm_ws(str(g))
        if not x:
            continue
        s.add(x)
        s.add(x.replace("級", ""))
        m = re.match(r"^(小|中)([一二三四五六])", x.replace("級", ""))
        if m:
            s.add(f"{m[1]}{m[2]}")
    return s


def db_match_keys(c: dict[str, Any]) -> list[str]:
    garr = c.get("grade")
    if not isinstance(garr, list):
        garr = []
    subj = norm_ws(str(c.get("subject") or ""))
    keys: list[str] = []
    if len(garr) == 1:
        keys.append(f"{norm_ws(str(garr[0]))}{subj}")
    joined = "".join(norm_ws(str(x)) for x in garr)
    if joined:
        keys.append(f"{joined}{subj}")
        keys.append(f"{subj}{joined}")
    if subj and not keys:
        keys.append(subj)
    seen: set[str] = set()
    out: list[str] = []
    for k in keys:
        k = norm_ws(k)
        if k and k not in seen:
            seen.add(k)
            out.append(k)
    return out


def norm_time_slot(s: str | None) -> str | None:
    if not s or not str(s).strip():
        return None
    t = str(s).strip().replace("：", ":").replace("－", "-").replace("—", "-")
    return t or None


def parse_csv_rows(imp: Any, csv_path: Path) -> list[dict[str, Any]]:
    with csv_path.open(newline="", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    parsed: list[dict[str, Any]] = []
    for i, row in enumerate(rows):
        title = norm_ws(row.get("班別名稱", "") or "")
        course = norm_ws(row.get("課程名稱", "") or "")
        if not title and not course:
            continue
        names = imp.split_student_names(row.get("學生名單", "") or "")
        grades = imp.parse_grades(row.get("適用年級", "") or "")
        tg = imp.infer_grade_from_title(title)
        subject = imp.subject_from_row(row)
        raw_week = (row.get("逢星期", "") or "").strip()
        day = imp.canonical_weekdays(raw_week)
        slot = norm_time_slot(row.get("時間", "") or "")
        parsed.append(
            {
                "row_index": i + 2,
                "title": title or course,
                "student_names": names,
                "grade_arr": grades if grades else ([tg] if tg else []),
                "day_of_week": day,
                "raw_week": raw_week,
                "time_slot": slot,
                "subject_inferred": subject,
            }
        )
    return parsed


def build_db_key_index(classes: list[dict[str, Any]]) -> dict[str, list[str]]:
    key_to_ids: dict[str, list[str]] = {}
    for c in classes:
        cid = str(c["id"])
        for k in db_match_keys(c):
            key_to_ids.setdefault(k, []).append(cid)
    return key_to_ids


def match_class_by_keys(
    title: str, key_index: dict[str, list[str]]
) -> tuple[str | None, str, list[str]]:
    """回傳 (class_id or None, 方式, 候選 id 列表)。"""
    rk = roster_match_keys(title)
    hits: set[str] = set()
    for k in rk:
        for cid in key_index.get(k, []):
            hits.add(cid)
    if len(hits) == 1:
        return next(iter(hits)), "班名鍵精確/括號變體", list(hits)
    if len(hits) > 1:
        return None, "班名鍵多筆候選", list(hits)
    return None, "班名鍵無命中", []


def score_soft_match(pr: dict[str, Any], c: dict[str, Any]) -> int:
    score = 0
    r_day = pr.get("day_of_week") or ""
    c_day = str(c.get("day_of_week") or "")
    if r_day and c_day:
        parts = [norm_ws(p) for p in re.split(r"[,，]", r_day) if norm_ws(p)]
        if any(p in c_day for p in parts):
            score += 35
        elif c_day in r_day:
            score += 30
    r_slot = pr.get("time_slot")
    c_slot = str(c.get("time_slot") or "")
    if r_slot and c_slot and r_slot == c_slot:
        score += 35
    elif r_slot and c_slot and (r_slot in c_slot or c_slot in r_slot):
        score += 20
    r_sub = pr.get("subject_inferred") or ""
    c_sub = str(c.get("subject") or "")
    if r_sub and c_sub and (r_sub in c_sub or c_sub in r_sub):
        score += 25
    r_g = set(grade_tokens(pr.get("grade_arr")))
    c_g = grade_tokens(c.get("grade") if isinstance(c.get("grade"), list) else None)
    if r_g and c_g and (r_g & c_g):
        score += 20
    return score


def soft_pick_class(pr: dict[str, Any], classes: list[dict[str, Any]]) -> tuple[str | None, int, list[str]]:
    scores: list[tuple[int, str]] = []
    for c in classes:
        sc = score_soft_match(pr, c)
        scores.append((sc, str(c["id"])))
    if not scores:
        return None, 0, []
    max_sc = max(s[0] for s in scores)
    if max_sc < 55:
        return None, max_sc, [x[1] for x in sorted(scores, reverse=True)[:5]]
    top_ids = [cid for sc, cid in scores if sc == max_sc]
    if len(top_ids) == 1:
        return top_ids[0], max_sc, top_ids
    return None, max_sc, top_ids


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    csv_path = Path(args[0]) if args else DEFAULT_CSV
    if not csv_path.is_file():
        print(f"找不到 CSV：{csv_path}", file=sys.stderr)
        return 1

    imp = _load_importer()
    sb_url, sb_key = load_env()

    students = supabase_fetch_all(sb_url, sb_key, "students?select=id,full_name,student_code")
    classes = supabase_fetch_all(
        sb_url, sb_key, "classes?select=id,subject,grade,day_of_week,time_slot,course_code_full"
    )
    parsed = parse_csv_rows(imp, csv_path)

    name_to_ids: dict[str, list[str]] = {}
    for s in students:
        fn = norm_ws(str(s.get("full_name") or ""))
        if not fn:
            continue
        name_to_ids.setdefault(fn, []).append(str(s["id"]))

    key_index = build_db_key_index(classes)

    roster_links: list[dict[str, Any]] = []
    unmatched_classes: list[dict[str, Any]] = []
    ambiguous_classes: list[dict[str, Any]] = []
    unmatched_students: set[str] = set()
    ambiguous_students: dict[str, list[str]] = {}

    for pr in parsed:
        title = pr["title"]
        cid, how, cands = match_class_by_keys(title, key_index)
        method = how
        soft_score = 0
        row_class_ambiguous = False

        if how == "班名鍵多筆候選":
            ambiguous_classes.append(
                {
                    "row_index": pr["row_index"],
                    "title": title,
                    "reason": "班名鍵多筆候選",
                    "candidate_class_ids": cands,
                }
            )
            cid = None
            method = how
            row_class_ambiguous = True
        elif cid is None and how == "班名鍵無命中":
            sc_id, sc_val, sc_cands = soft_pick_class(pr, classes)
            soft_score = sc_val
            if sc_id:
                cid, method = sc_id, f"模糊(分數{sc_val})"
                cands = [sc_id]
            elif sc_val >= 55 and len(sc_cands) > 1:
                ambiguous_classes.append(
                    {
                        "row_index": pr["row_index"],
                        "title": title,
                        "reason": "模糊比對同分多候選",
                        "soft_score": sc_val,
                        "candidate_class_ids": sc_cands,
                    }
                )
                cands = sc_cands
                method = "模糊同分多候選"
                row_class_ambiguous = True
            else:
                cands = sc_cands

        if cid is None and not row_class_ambiguous:
            unmatched_classes.append(
                {
                    "row_index": pr["row_index"],
                    "title": title,
                    "day_of_week": pr.get("day_of_week"),
                    "raw_week": pr.get("raw_week"),
                    "time_slot": pr.get("time_slot"),
                    "grade_arr": pr.get("grade_arr"),
                    "subject_inferred": pr.get("subject_inferred"),
                    "soft_best_score": soft_score,
                    "top_soft_score_class_ids": cands[:8] if isinstance(cands, list) else [],
                }
            )
            method = how if how != "班名鍵無命中" else "模糊仍無法唯一"

        for sn in pr["student_names"]:
            ids = name_to_ids.get(sn, [])
            st_match: str | None = None
            st_how = ""
            if len(ids) == 1:
                st_match, st_how = ids[0], "姓名唯一"
            elif len(ids) > 1:
                st_how = "姓名重複多筆"
                ambiguous_students.setdefault(sn, list(ids))
            else:
                st_how = "資料庫無此姓名"
                unmatched_students.add(sn)

            roster_links.append(
                {
                    "csv_row": pr["row_index"],
                    "class_title_csv": title,
                    "class_id_db": cid,
                    "class_match_method": method if cid else method,
                    "student_name_csv": sn,
                    "student_id_db": st_match,
                    "student_match_note": st_how,
                }
            )

    report = {
        "source_csv": str(csv_path),
        "db_student_count": len(students),
        "db_class_count": len(classes),
        "csv_class_rows": len(parsed),
        "unmatched_student_names": sorted(unmatched_students),
        "ambiguous_student_names": {k: v for k, v in sorted(ambiguous_students.items())},
        "unmatched_classes": unmatched_classes,
        "ambiguous_class_keys": ambiguous_classes,
        "roster_links_sample": roster_links[:40],
        "roster_links_total": len(roster_links),
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "reconcile_report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    md: list[str] = []
    md.append("# 2526 課程 CSV 與資料庫對照報告\n")
    md.append(f"- 資料庫學生筆數：**{len(students)}** ｜班別筆數：**{len(classes)}**\n")
    md.append(f"- CSV 班別列數：**{len(parsed)}** ｜展開後學生–班關係列數：**{len(roster_links)}**\n")
    md.append("\n## 學生姓名對不到資料庫（需在庫內新增或改名後再對）\n")
    if unmatched_students:
        for n in sorted(unmatched_students):
            md.append(f"- {n}\n")
    else:
        md.append("- （無）\n")
    md.append("\n## 學生姓名重名（多個 id，報告內已全列；匯入時須指定其一）\n")
    if ambiguous_students:
        for n, ids in sorted(ambiguous_students.items()):
            md.append(f"- **{n}**：`{'`, `'.join(ids)}`\n")
    else:
        md.append("- （無）\n")
    md.append("\n## 班別對不到資料庫（請與我核對：班名／時段／星期是否與系統不一致）\n")
    if unmatched_classes:
        for u in unmatched_classes:
            md.append(
                f"- 第 **{u['row_index']}** 列：**{u['title']}** "
                f"｜星期：`{u.get('day_of_week')}` ｜時間：`{u.get('time_slot')}` "
                f"｜年級：`{u.get('grade_arr')}` ｜推斷科目：`{u.get('subject_inferred')}`\n"
            )
    else:
        md.append("- （無）\n")
    md.append("\n## 班別鍵／模糊比對多筆候選（須人工指定 class id）\n")
    if ambiguous_classes:
        for a in ambiguous_classes:
            extra = f"（{a['reason']}，分數 {a.get('soft_score')}）" if a.get("reason") else ""
            md.append(
                f"- 第 **{a['row_index']}** 列：**{a['title']}**{extra} → 候選：`{a['candidate_class_ids']}`\n"
            )
    else:
        md.append("- （無）\n")
    md.append(
        "\n完整逐筆關係（含已對上 id）見同目錄 **reconcile_roster_links.json**（全量）；"
        "摘要統計見 **reconcile_report.json**。\n"
    )

    (OUT_DIR / "reconcile_report.md").write_text("".join(md), encoding="utf-8")

    # 寫出完整 links 另檔（可能較大）
    (OUT_DIR / "reconcile_roster_links.json").write_text(
        json.dumps(roster_links, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print(f"已寫入 {OUT_DIR / 'reconcile_report.md'}")
    print(f"已寫入 {OUT_DIR / 'reconcile_report.json'}")
    print(f"已寫入 {OUT_DIR / 'reconcile_roster_links.json'}（全量關係列）")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())