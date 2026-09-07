/**
 * 出席列上的老師歸屬文案：實際授課 vs 代堂原任。
 */

export function attendanceIsSubstitute(row: {
  originalTeacherId?: string | null
}): boolean {
  return Boolean(row.originalTeacherId)
}

export function formatAttendanceTeacherLine(row: {
  teacherName?: string | null
  originalTeacherName?: string | null
}): string | null {
  const taught = row.teacherName?.trim() || null
  if (!taught) return null
  const original = row.originalTeacherName?.trim() || null
  if (original && original !== taught) return `${taught}（代 ${original}）`
  return taught
}
