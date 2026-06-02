/**
 * 新版課程顯示碼（classes.course_code_full）：
 * 學年-科目代碼+年級+課程序號-班號
 * 例：2526-MATHF11001-A
 */

/** 主體：學年-科目代碼+年級+種子-班號（學年可為 2526 或 26SM） */
export const COURSE_CODE_REGEX =
 /^(\d{4}|\d{2}SM)-([A-Z0-9]{2,8})([A-Z][1-9]\d?)(\d{4})-([A-Z][0-9]?)$/i

/** 中文年級 → 編號用年級碼 */
export const GRADE_TO_COURSE_CODE: Record<string, string> = {
 小一: "P1",
 小二: "P2",
 小三: "P3",
 小四: "P4",
 小五: "P5",
 小六: "P6",
 中一: "F1",
 中二: "F2",
 中三: "F3",
 中四: "F4",
 中五: "F5",
 中六: "F6",
}

/**
 * 科目代碼映射（標準字典，23 科）。
 * 鍵為標準 name_zh（與 DB public.subjects.name_zh 一致），並保留少量常用簡名別名。
 * DB 的 subjects 表才是唯一真實來源；此映射僅供前端工具函式使用。
 */
export const SUBJECT_TO_COURSE_ABBR: Record<string, string> = {
 中國語文: "CHI",
 英國語文: "ENG",
 "數學（必修部份）": "MATH",
 綜合科學: "SCI",
 中國歷史: "CHIS",
 歷史: "HIST",
 地理: "GEOG",
 經濟: "ECON",
 中國文學: "CLIT",
 旅遊與款待: "THS",
 物理: "PHY",
 化學: "CHEM",
 生物: "BIO",
 "資訊及通訊科技 (ICT)": "ICT",
 設計與應用科技: "DAT",
 "企業、會計與財務概論": "BAFS",
 視覺藝術: "VA",
 音樂: "MUS",
 體育: "PE",
 健康管理與社會關懷: "HMSC",
 "數學延伸部分（單元一 M1）": "M1",
 "數學延伸部分（單元二 M2）": "M2",
 功課輔導: "HWK",

 // 常用簡名別名（向後相容）
 中文: "CHI",
 英文: "ENG",
 數學: "MATH",
 中史: "CHIS",
 M1: "M1",
 M2: "M2",
}

export function normalizeCourseCode(raw: string | null | undefined): string | null {
 if (raw == null) return null
 const upper = String(raw).toUpperCase().trim()
 const compact = upper.replace(/\s+/g, "")
 const safe = compact.replace(/[^A-Z0-9-]/g, "")
 return safe.length ? safe : null
}

export function validateCourseCode(code: string): { ok: true } | { ok: false; message: string } {
 const m = code.match(COURSE_CODE_REGEX)
 if (!m) {
  return {
   ok: false,
   message: "課程顯示碼格式需為 YYYY-SUBJECT+GRADE+SEQ-SECTION，例如：2526-MATHF11001-A。",
  }
 }
 const seed = Number(m[4] ?? "0")
 if (seed < 1000 || seed > 9999) {
  return { ok: false, message: "種子碼須為 1000–9999 的四位數字。" }
 }
 return { ok: true }
}

/**
 * 由日期推算學年 label（與 public.academic_years 一致）：
 * - 7–8 月 → YYSM（如 2026-07-15 → 26SM）
 * - 9 月–翌年 6 月 → YYZZ（如 2025-09-01 → 2526）
 */
export function academicYearLabelFromStartDate(ymd: string | null | undefined): string {
 const resolve = (year: number, month: number): string => {
  if (month === 7 || month === 8) {
   return `${String(year).slice(-2)}SM`
  }
  const startY = month >= 9 ? year : year - 1
  return `${String(startY).slice(-2)}${String(startY + 1).slice(-2)}`
 }

 if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
  const d = new Date()
  return resolve(d.getFullYear(), d.getMonth() + 1)
 }
 const y = Number(ymd.slice(0, 4))
 const m = Number(ymd.slice(5, 7))
 if (Number.isNaN(y) || Number.isNaN(m)) {
  return academicYearLabelFromStartDate(null)
 }
 return resolve(y, m)
}

export function gradeChineseToCode(gradeLabel: string | null | undefined): string | null {
 if (!gradeLabel) return null
 const t = gradeLabel.trim()
 return GRADE_TO_COURSE_CODE[t] ?? null
}

export function subjectChineseToAbbr(subject: string | null | undefined): string | null {
 if (!subject) return null
 const t = subject.trim()
 return SUBJECT_TO_COURSE_ABBR[t] ?? null
}

/** 學年 + 年級碼 + 科目簡稱（不含種子） */
export function courseCodePrefix(
 academicYear: string,
 gradeCode: string,
 subjectAbbr: string
): string {
 return `${academicYear}-${subjectAbbr.toUpperCase()}${gradeCode}`
}

/** 若符合格式，將種子碼 +1（用於複製班別）；已達 9999 則回傳 null */
export function incrementCourseCodeSeed(code: string): string | null {
 const m = code.match(COURSE_CODE_REGEX)
 if (!m) return null
 const seed = Number(m[4] ?? "0")
 if (seed >= 9999) return null
 const next = seed + 1
 return `${m[1]}-${m[2]}${m[3]}${String(next).padStart(4, "0")}-${m[5]}`
}

/** 寫入資料庫前：空白 → null；有值則僅允許合法編號 */
export function coalesceCourseCodeForDb(raw: string | null | undefined): string | null {
 const n = normalizeCourseCode(raw)
 if (n == null) return null
 const v = validateCourseCode(n)
 if (!v.ok) throw new Error(v.message)
 return n
}
