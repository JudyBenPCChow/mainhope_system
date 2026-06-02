/**
 * 課程模板碼（courses.course_code_base）：科目代碼 + 年級碼 + 三位種子
 * 例：CHIS4001 = CHI + S4 + 001
 *
 * 班別顯示碼（classes.course_code_full）：
 * 學年-科目代碼+年級+種子-班號
 * 例：2526-CHIS4001-A
 */

export const PRIMARY_GRADE_CODES = ["P1", "P2", "P3", "P4", "P5", "P6"] as const
export const SECONDARY_GRADE_CODES = ["S1", "S2", "S3", "S4", "S5", "S6"] as const
export const ALL_GRADE_CODES = [...PRIMARY_GRADE_CODES, ...SECONDARY_GRADE_CODES] as const

export const DEFAULT_COURSE_SEQ = 1
export const COURSE_SEQ_MIN = 1
export const COURSE_SEQ_MAX = 999
export const COURSE_SEQ_PAD = 3

/** 主體：學年-科目代碼+年級+種子-班號（學年可為 2526 或 26SM） */
export const COURSE_CODE_REGEX =
 /^(\d{4}|\d{2}SM)-([A-Z0-9]{2,8})([A-Z][1-9]\d?)(\d{3})-([A-Z][0-9]?)$/i

/** 中文年級 → 編號用年級碼 */
export const GRADE_TO_COURSE_CODE: Record<string, string> = {
 小一: "P1",
 小二: "P2",
 小三: "P3",
 小四: "P4",
 小五: "P5",
 小六: "P6",
 中一: "S1",
 中二: "S2",
 中三: "S3",
 中四: "S4",
 中五: "S5",
 中六: "S6",
}

/**
 * 科目代碼映射（標準字典，23 科）。
 * 鍵為標準 name_zh（與 DB public.subjects.name_zh 一致），並保留少量常用簡名別名。
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

/** 舊中學年級碼 F1–F6 → 新標準 S1–S6 */
export function normalizeGradeCode(raw: string | null | undefined): string {
 const g = (raw ?? "").trim().toUpperCase()
 const legacy = /^F([1-6])$/.exec(g)
 if (legacy) return `S${legacy[1]}`
 return g
}

export function clampCourseSeq(seq: number | null | undefined): number {
 if (seq == null || !Number.isFinite(seq)) return DEFAULT_COURSE_SEQ
 return Math.min(Math.max(Math.floor(seq), COURSE_SEQ_MIN), COURSE_SEQ_MAX)
}

/** 種子碼顯示／寫入：001–999 */
export function formatCourseSeq(seq: number): string {
 return String(clampCourseSeq(seq)).padStart(COURSE_SEQ_PAD, "0")
}

/** 課程模板碼（不含學年、班號） */
export function buildCourseCodeBase(
 subjectCode: string,
 gradeCode: string,
 courseSeq: number
): string {
 const grade = normalizeGradeCode(gradeCode)
 return `${subjectCode.toUpperCase()}${grade}${formatCourseSeq(courseSeq)}`
}

/** 班別完整顯示碼 */
export function buildClassCourseCodeFull(
 academicYearLabel: string,
 subjectCode: string,
 gradeCode: string,
 courseSeq: number,
 sectionCode: string
): string {
 return `${academicYearLabel}-${buildCourseCodeBase(subjectCode, gradeCode, courseSeq)}-${sectionCode}`
}

/**
 * 從舊顯示碼尾碼解析種子：支援新三位（001）與舊四位（1001→1）。
 */
export function parseCourseSeqFromCodeSuffix(code: string | null | undefined): number {
 if (!code) return DEFAULT_COURSE_SEQ
 const s = String(code).replace(/[^0-9]/g, "")
 if (!s) return DEFAULT_COURSE_SEQ
 const m3 = s.match(/(\d{3})$/)
 if (m3) {
  const n = Number(m3[1])
  if (n >= COURSE_SEQ_MIN && n <= COURSE_SEQ_MAX) return n
 }
 const m4 = s.match(/(\d{4})$/)
 if (m4) {
  const n = Number(m4[1])
  if (n >= 1000 && n <= 9999) return clampCourseSeq(n - 1000)
  if (n >= COURSE_SEQ_MIN && n <= COURSE_SEQ_MAX) return n
 }
 return DEFAULT_COURSE_SEQ
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
   message: "課程顯示碼格式需為 YYYY-SUBJECT+GRADE+SEQ-SECTION，例如：2526-CHIS4001-A。",
  }
 }
 const seed = Number(m[4] ?? "0")
 if (seed < COURSE_SEQ_MIN || seed > COURSE_SEQ_MAX) {
  return { ok: false, message: "種子碼須為 001–999 的三位數字。" }
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
 return `${academicYear}-${subjectAbbr.toUpperCase()}${normalizeGradeCode(gradeCode)}`
}

/** 若符合格式，將種子碼 +1；已達 999 則回傳 null */
export function incrementCourseCodeSeed(code: string): string | null {
 const m = code.match(COURSE_CODE_REGEX)
 if (!m) return null
 const seed = Number(m[4] ?? "0")
 if (seed >= COURSE_SEQ_MAX) return null
 const next = seed + 1
 return `${m[1]}-${m[2]}${m[3]}${formatCourseSeq(next)}-${m[5]}`
}

/** 寫入資料庫前：空白 → null；有值則僅允許合法編號 */
export function coalesceCourseCodeForDb(raw: string | null | undefined): string | null {
 const n = normalizeCourseCode(raw)
 if (n == null) return null
 const v = validateCourseCode(n)
 if (!v.ok) throw new Error(v.message)
 return n
}
