/**
 * 課程編號（classes.course_code）全站規則：僅大寫英文 A–Z 與數字，無中文或符號。
 * 格式：學年（4 位） + 年級碼 + 科目英文簡稱（2–6 字母） + 種子碼（4 位，1000–9999）
 * 例：2526F6CHI1001 → 2526 學年、中六（F6）、中文（CHI）、第 1001 班／序號
 */

/** 主體：學年 + 年級 + 科目簡稱 + 種子；年級為 F1–F6／S1–S6／P1–P6（Form / Senior / Primary） */
export const COURSE_CODE_REGEX =
 /^(\d{4})((?:F|S|P)[1-6])([A-Z]{2,6})(\d{4})$/

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

/** 常見科目中文名 → 英文簡稱（大寫）；未列者可於班別表單手動輸入完整編號 */
export const SUBJECT_TO_COURSE_ABBR: Record<string, string> = {
 中文: "CHI",
 英文: "ENG",
 數學: "MAT",
 數學延伸: "MME",
 物理: "PHY",
 化學: "CHEM",
 生物: "BIO",
 經濟: "ECON",
 公社: "ISC",
 公民: "CSD",
 地理: "GEO",
 歷史: "HIST",
 中史: "CHS",
 資訊: "ICT",
 音樂: "MUS",
 視藝: "VA",
 體育: "PE",
}

export function normalizeCourseCode(raw: string | null | undefined): string | null {
 if (raw == null) return null
 const s = String(raw)
  .toUpperCase()
  .replace(/[^A-Z0-9]/g, "")
  .trim()
 return s.length ? s : null
}

export function validateCourseCode(code: string): { ok: true } | { ok: false; message: string } {
 const m = code.match(COURSE_CODE_REGEX)
 if (!m) {
  return {
   ok: false,
   message:
    "課程編號須為全大寫英文及數字，格式：4 位學年 + 年級碼（F1–F6／S1–S6／P1–P6）+ 2–6 個英文字母科目簡稱 + 4 位種子碼（1000–9999）。例：2526F6CHI1001。",
  }
 }
 const seed = Number(m[4])
 if (seed < 1000 || seed > 9999) {
  return { ok: false, message: "種子碼須為 1000–9999 的四位數字。" }
 }
 return { ok: true }
}

/** 由班別開始日推算學年標籤（9 月起算新學年），如 2025-09-01 → 2526 */
export function academicYearLabelFromStartDate(ymd: string | null | undefined): string {
 if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
  const d = new Date()
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const startY = m >= 9 ? y : y - 1
  return `${String(startY).slice(-2)}${String(startY + 1).slice(-2)}`
 }
 const y = Number(ymd.slice(0, 4))
 const m = Number(ymd.slice(5, 7))
 if (Number.isNaN(y) || Number.isNaN(m)) {
  return academicYearLabelFromStartDate(null)
 }
 const startY = m >= 9 ? y : y - 1
 return `${String(startY).slice(-2)}${String(startY + 1).slice(-2)}`
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
 return `${academicYear}${gradeCode}${subjectAbbr.toUpperCase()}`
}

/** 若符合格式，將種子碼 +1（用於複製班別）；已達 9999 則回傳 null */
export function incrementCourseCodeSeed(code: string): string | null {
 const m = code.match(COURSE_CODE_REGEX)
 if (!m) return null
 const seed = Number(m[4])
 if (seed >= 9999) return null
 const next = seed + 1
 return `${m[1]}${m[2]}${m[3]}${String(next).padStart(4, "0")}`
}

/** 寫入資料庫前：空白 → null；有值則僅允許合法編號 */
export function coalesceCourseCodeForDb(raw: string | null | undefined): string | null {
 const n = normalizeCourseCode(raw)
 if (n == null) return null
 const v = validateCourseCode(n)
 if (!v.ok) throw new Error(v.message)
 return n
}
