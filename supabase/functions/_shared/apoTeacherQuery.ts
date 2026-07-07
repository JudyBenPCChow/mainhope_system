/** 從用戶訊息抽取老師姓名關鍵字 */

export function isTeacherRelatedQuery(text: string): boolean {
  const t = text.trim()
  if (/老師|teacher/i.test(t)) return true
  if (/係老師|是老師|做老師/.test(t)) return true
  if (/班別|邊班|乜班|有咩班|哪些班|什么班|嘅班|的班/.test(t) && /[A-Za-z]{2,}/.test(t)) return true
  if (/點名/.test(t) && /[A-Za-z]{2,}/.test(t)) return true
  return false
}

export function extractTeacherNameQuery(text: string): string | null {
  const t = text.trim()

  const attendanceName = extractTeacherNameFromAttendanceQuery(t)
  if (attendanceName) return attendanceName

  const patterns = [
    /^([A-Za-z][A-Za-z\s.'-]{1,50}?)\s*有(?:咩|什麼|哪些|乜)班/,
    /^([A-Za-z][A-Za-z\s.'-]{1,50}?)\s*.{0,8}班別/,
    /老師\s*[：:]?\s*([A-Za-z][A-Za-z\s.'-]+?)(?:\s*(嘅|的|既|有|系|係|是|班|老師|$))/i,
    /([A-Za-z][A-Za-z\s.'-]{2,50}?)\s*(嘅|的|既)?\s*(班別|班)/i,
    /(?:查|查詢|問)\s*(?:老師)?\s*([A-Za-z][A-Za-z\s.'-]{2,50})/i,
    /([A-Za-z][A-Za-z\s.'-]{2,50})\s*(系|係|是)\s*老師/i,
    /老師\s+([A-Za-z][A-Za-z\s.'-]{2,50})/i,
  ]

  for (const re of patterns) {
    const m = t.match(re)
    if (m?.[1]) {
      const name = m[1].trim().replace(/\s+(嘅|的|既|班別|班)$/i, "")
      if (name.length >= 2) return name
    }
  }

  return null
}

/** 例：Mark Yu 今日點名狀態如何？ */
export function extractTeacherNameFromAttendanceQuery(text: string): string | null {
  const t = text.trim()
  const patterns = [
    /^([A-Za-z][A-Za-z\s.'-]{1,50}?)\s+(?:今日|今天).{0,24}點名/,
    /^([A-Za-z][A-Za-z\s.'-]{1,50}?)\s+.{0,24}點名狀態/,
  ]
  for (const re of patterns) {
    const m = t.match(re)
    if (m?.[1]) {
      const name = m[1].trim()
      if (name.length >= 2) return name
    }
  }
  return null
}
