/** 與 src/lib/courseLabel.ts classDisplayName 一致：班名優先課程名稱，其次科目 */

export function classDisplayName(params: {
  subject?: unknown
  courseName?: unknown
}): string {
  const name = String(params.courseName ?? "").trim()
  if (name !== "") return name
  return String(params.subject ?? "").trim() || "—"
}

function classRowKey(row: Record<string, unknown>): string {
  const head = classDisplayName({
    subject: row.subject,
    courseName: row.class_name ?? row.course_name,
  })
  const dow = String(row.day_of_week ?? "").trim()
  const slot = String(row.time_slot ?? "").trim()
  return `${head}|${dow}|${slot}`
}

function classListHead(row: Record<string, unknown>, rows: Record<string, unknown>[]): string {
  const head = classDisplayName({
    subject: row.subject,
    courseName: row.class_name ?? row.course_name,
  })
  const key = classRowKey(row)
  const dupes = rows.filter((r) => classRowKey(r) === key).length
  if (dupes > 1) {
    const section = String(row.section_code ?? "").trim()
    if (section !== "") return `${head}（${section}班）`
  }
  return head
}

export function formatClassListLine(
  row: Record<string, unknown>,
  rows: Record<string, unknown>[],
  index: number
): string {
  const head = classListHead(row, rows)
  const dow = String(row.day_of_week ?? "").trim()
  const slot = String(row.time_slot ?? "").trim()
  const time = [dow, slot].filter(Boolean).join(" ")
  const enrolled = Number(row.enrolled_count ?? 0)
  const timePart = time ? `（${time}）` : ""
  return `${index + 1}. ${head}${timePart}｜就讀 ${enrolled} 人`
}

export function formatEnrollmentListLine(
  row: Record<string, unknown>,
  rows: Record<string, unknown>[],
  index: number
): string {
  const head = classListHead(row, rows)
  const dow = String(row.day_of_week ?? "").trim()
  const slot = String(row.time_slot ?? "").trim()
  const time = [dow, slot].filter(Boolean).join(" ")
  const status = String(row.enrollment_status ?? row.status ?? "").trim() || "—"
  const teacher = String(row.teacher_name ?? "").trim()
  const timePart = time ? `（${time}）` : ""
  const teacherPart = teacher ? `｜${teacher}` : ""
  return `${index + 1}. ${head}${timePart}｜${status}${teacherPart}`
}
