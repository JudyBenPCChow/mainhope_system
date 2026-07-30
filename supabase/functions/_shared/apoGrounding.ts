import { hkTodayYmd } from "./apoDate.ts"
import { cannotAnswerWithoutDbReply } from "./apoNoHallucination.ts"
import { classDisplayName, formatClassListLine, formatEnrollmentListLine } from "./apoClassLabel.ts"

export type GroundingAnchors = {
  hkToday: string
  dates: Set<string>
  classCodes: Set<string>
  classNames: Set<string>
}

const ISO_DATE_RE = /\b(20\d{2}-\d{2}-\d{2})\b/g
const CLASS_CODE_RE = /\b(\d{2}[A-Z]{2}-[A-Z0-9]+(?:-[A-Z0-9]+)?)\b/gi

function walkJson(value: unknown, onString: (s: string) => void): void {
  if (typeof value === "string") {
    onString(value)
    return
  }
  if (Array.isArray(value)) {
    for (const item of value) walkJson(item, onString)
    return
  }
  if (value && typeof value === "object") {
    for (const v of Object.values(value as Record<string, unknown>)) {
      walkJson(v, onString)
    }
  }
}

/** 從 tool 回傳 JSON 提取可作為「事實錨點」的日期、班名與班別代碼 */
export function buildGroundingAnchors(
  payloads: Record<string, unknown>[],
  hkToday = hkTodayYmd()
): GroundingAnchors {
  const dates = new Set<string>([hkToday])
  const classCodes = new Set<string>()
  const classNames = new Set<string>()

  for (const payload of payloads) {
    if (payload.ok === false) continue

    const classes = payload.classes
    if (Array.isArray(classes)) {
      for (const item of classes) {
        const row = item as Record<string, unknown>
        const name = classDisplayName({
          subject: row.subject,
          courseName: row.class_name ?? row.course_name,
        })
        if (name !== "—") classNames.add(name)
        const code = String(row.course_code_full ?? "").trim()
        if (code) classCodes.add(code.toUpperCase())
      }
    }

    walkJson(payload, (s) => {
      if (/^20\d{2}-\d{2}-\d{2}$/.test(s)) dates.add(s)
      for (const m of s.matchAll(CLASS_CODE_RE)) {
        classCodes.add(m[1].toUpperCase())
      }
    })
  }

  return { hkToday, dates, classCodes, classNames }
}

export function validateReplyAgainstAnchors(
  reply: string,
  anchors: GroundingAnchors
): { ok: boolean; issues: string[] } {
  const issues: string[] = []
  const text = reply.trim()
  if (!text) return { ok: true, issues }

  const mentionedDates = [...text.matchAll(ISO_DATE_RE)].map((m) => m[1])
  for (const d of mentionedDates) {
    if (!anchors.dates.has(d)) {
      issues.push(`回覆日期 ${d} 不在查詢結果內（允許：${[...anchors.dates].sort().join("、")}）`)
    }
  }

  const mentionedCodes = [...text.matchAll(CLASS_CODE_RE)].map((m) => m[1].toUpperCase())
  if (anchors.classCodes.size > 0) {
    for (const code of mentionedCodes) {
      if (!anchors.classCodes.has(code)) {
        issues.push(`回覆班別代碼 ${code} 不在查詢結果內`)
      }
    }
  }

  if (anchors.classNames.size >= 2) {
    for (const name of anchors.classNames) {
      if (!text.includes(name)) {
        issues.push(`回覆未列出班名「${name}」（不可只寫科目或代碼）`)
        break
      }
    }
  }

  return { ok: issues.length === 0, issues }
}

export function dbQueryNoToolsReply(): {
  reply: string
  suggestions: string[]
  paths: { label: string; path: string }[]
} {
  return cannotAnswerWithoutDbReply()
}

export function groundingRetryInstruction(issues: string[]): string {
  return (
    "【系統校正】你上一則回覆包含查詢結果沒有的資料：" +
    issues.join("；") +
    "。請只根據已提供的查詢 JSON 重寫 reply，不可加入查詢結果沒有的日期或班別資料；若資料不足請明確說明。"
  )
}

export function parseToolPayload(json: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(json) as Record<string, unknown>
    if (parsed && typeof parsed === "object") return parsed
  } catch {
    // ignore
  }
  return null
}

export function formatToolResultsForPrompt(
  toolsUsed: string[],
  toolPayloads: Record<string, unknown>[]
): string {
  return toolPayloads
    .map((p, i) => `[系統查詢結果 ${toolsUsed[i] ?? "tool"}]\n${JSON.stringify(p)}`)
    .join("\n\n")
}

type ParsedReply = {
  reply: string
  suggestions: string[]
  paths: { label: string; path: string }[]
}

function formatTeacherClassLine(
  row: Record<string, unknown>,
  rows: Record<string, unknown>[],
  index: number
): string {
  return formatClassListLine(row, rows, index)
}

/** 老師班別列表：由查詢結果直接組裝，避免 LLM 只列科目或代碼 */
export function buildTeacherClassesStructuredReply(
  payload: Record<string, unknown>
): ParsedReply | null {
  if (payload.ok === false) return null

  const classes = Array.isArray(payload.classes) ? payload.classes : []
  const teacher = payload.teacher as Record<string, unknown> | undefined
  const name = String(teacher?.english_name ?? teacher?.full_name ?? "老師")
  const count = Number(payload.class_count ?? classes.length)

  if (count === 0) {
    return {
      reply: `${name} 目前沒有負責中的班別。`,
      suggestions: ["其他老師班別", "如何新增班別？"],
      paths: [{ label: "班別管理", path: "/Classes" }],
    }
  }

  const rows = classes as Record<string, unknown>[]
  const lines = rows.map((c, i) => formatTeacherClassLine(c, rows, i))
  return {
    reply: [
      `${name} 目前有 ${count} 個進行中的班別：`,
      lines.join("\n"),
    ].join("\n"),
    suggestions: [`${name} 今日點名狀態如何？`, "查看某班學生名單", "班別管理"],
    paths: [{ label: "班別管理", path: "/Classes" }],
  }
}

function studentDisplayName(student: Record<string, unknown>): string {
  return String(student.full_name ?? student.english_name ?? "學生")
}

/** 學生報讀班別：由查詢結果直接組裝，避免 LLM 捏造班名或學號 */
export function buildStudentProfileStructuredReply(
  payload: Record<string, unknown>
): ParsedReply | null {
  if (payload.ok === false) return null

  const student = payload.student as Record<string, unknown> | undefined
  if (!student) return null

  const name = studentDisplayName(student)
  const code = String(student.student_code ?? "").trim()
  const codePart = code ? `（學號 ${code}）` : ""

  const enrollments = Array.isArray(payload.enrollments) ? payload.enrollments : []
  const active = enrollments.filter((item) => {
    const row = item as Record<string, unknown>
    return String(row.enrollment_status ?? "").trim() === "就讀中"
  })
  const rows = (active.length > 0 ? active : enrollments) as Record<string, unknown>[]

  if (rows.length === 0) {
    return {
      reply: `${name}${codePart} 目前沒有報讀班別紀錄。`,
      suggestions: ["如何新增報讀班別？", "在讀與活躍有什麼分別？", "今日有邊個請假？"],
      paths: [{ label: "學生管理", path: "/Students" }],
    }
  }

  const lines = rows.map((r, i) => formatEnrollmentListLine(r, rows, i))
  const enStatus = String(student.enrollment_status ?? "").trim()
  const actStatus = String(student.activity_status ?? "").trim()
  const statusBits = [enStatus, actStatus].filter(Boolean)
  const statusSuffix = statusBits.length > 0 ? `\n\n狀態：${statusBits.join("；")}。` : ""

  return {
    reply: [
      `${name}${codePart} 目前報讀 ${rows.length} 個班別：`,
      lines.join("\n"),
      statusSuffix,
    ]
      .join("\n")
      .trim(),
    suggestions: [`${name}今日上唔上堂？`, "最近出席紀錄", "如何新增報讀班別？"],
    paths: [{ label: "學生管理", path: "/Students" }],
  }
}

/** 學生搜尋：只列查詢結果，唔捏造 */
export function buildSearchStudentsStructuredReply(
  payload: Record<string, unknown>
): ParsedReply | null {
  if (payload.ok === false) return null

  const students = Array.isArray(payload.students) ? payload.students : []
  const count = Number(payload.count ?? students.length)

  if (count === 0) {
    return {
      reply: "搵唔到符合嘅學生，請核對姓名或學號。",
      suggestions: ["如何新增學生？", "學號點生成？", "如何進行點名？"],
      paths: [{ label: "學生管理", path: "/Students" }],
    }
  }

  if (count === 1) {
    const row = students[0] as Record<string, unknown>
    const name = String(row.full_name ?? row.english_name ?? "學生")
    const code = String(row.student_code ?? "").trim()
    const codePart = code ? `（學號 ${code}）` : ""
    return {
      reply: `找到 1 位學生：${name}${codePart}。請再具體問，例如「${name}今日上唔上堂？」或「${name}依家報什麼？」。`,
      suggestions: [`${name}今日上唔上堂？`, `${name}依家報什麼？`, "如何進行點名？"],
      paths: [{ label: "學生管理", path: "/Students" }],
    }
  }

  const lines = students.slice(0, 5).map((item, i) => {
    const row = item as Record<string, unknown>
    const name = String(row.full_name ?? row.english_name ?? "—")
    const code = String(row.student_code ?? "").trim()
    return `${i + 1}. ${name}${code ? `（學號 ${code}）` : ""}`
  })
  const more = count > 5 ? `\n（另有 ${count - 5} 位未列出）` : ""

  return {
    reply: `搵到 ${count} 位符合的學生，請講清楚邊一位：\n${lines.join("\n")}${more}`,
    suggestions: ["如何進行點名？", "今日有邊個請假？", "在讀與活躍有什麼分別？"],
    paths: [{ label: "學生管理", path: "/Students" }],
  }
}

/** 學生今日上堂：由查詢結果直接組裝（例如「梁天因今日有冇堂」） */
export function buildStudentTodayLessonsStructuredReply(
  payload: Record<string, unknown>
): ParsedReply | null {
  if (payload.ok === false) {
    const err = String(payload.error ?? "").trim()
    return {
      reply: err || "未能查詢此學生今日上堂資料。",
      suggestions: ["如何進行點名？", "今日有邊個請假？"],
      paths: [{ label: "進行點名", path: "/Attendance" }],
    }
  }

  const student = payload.student as Record<string, unknown> | undefined
  const name =
    String(student?.full_name ?? student?.english_name ?? "").trim() ||
    String(payload.search_query ?? "").trim() ||
    "該學生"
  const date = String(payload.date ?? "").trim() || "今日"
  const lessons = Array.isArray(payload.lessons) ? payload.lessons : []
  const count = Number(payload.lesson_count ?? lessons.length)

  if (count === 0) {
    return {
      reply: `${name} 在 ${date} 沒有排程課堂。`,
      suggestions: [`${name}依家報什麼？`, "今日有邊個請假？", "如何進行點名？"],
      paths: [{ label: "學生管理", path: "/Students" }],
    }
  }

  const stateLabel = (state: string, leaveReason: string, attendance: string): string => {
    if (state === "cancelled") return "已取消"
    if (state === "on_leave") return leaveReason ? `請假（${leaveReason}）` : "請假"
    if (state === "excused") return attendance || "事假／病假"
    if (state === "absent") return "缺席／no show"
    if (state === "marked") return attendance || "已點名"
    return "預計上堂"
  }

  const lines = lessons.slice(0, 8).map((item) => {
    const row = item as Record<string, unknown>
    const label = classDisplayName({
      subject: row.subject,
      courseName: row.course_name ?? row.class_name,
    })
    const start = String(row.start_time ?? "").slice(0, 5)
    const end = String(row.end_time ?? "").slice(0, 5)
    const time = start && end ? `${start}–${end}` : start || "時間待定"
    const room = String(row.classroom_name ?? "").trim()
    const teacher = String(row.teacher_name ?? "").trim()
    const state = stateLabel(
      String(row.lesson_state ?? ""),
      String(row.leave_reason ?? "").trim(),
      String(row.attendance_status ?? "").trim()
    )
    const bits = [`• ${time} ${label}`, state]
    if (teacher) bits.push(teacher)
    if (room) bits.push(room)
    return bits.join("｜")
  })
  const more = count > 8 ? `\n（另有 ${count - 8} 堂未列出）` : ""

  return {
    reply: `${name} 在 ${date} 有 ${count} 堂：\n${lines.join("\n")}${more}`,
    suggestions: [`${name}依家報什麼？`, "今日有邊個請假？", "如何進行點名？"],
    paths: [
      { label: "進行點名", path: "/Attendance" },
      { label: "學生管理", path: "/Students" },
    ],
  }
}

/** LLM 總結失敗時，盡量用 tool 結果組最短事實回覆 */
export function fallbackReplyFromToolPayloads(
  toolsUsed: string[],
  toolPayloads: Record<string, unknown>[]
): ParsedReply | null {
  const last = toolPayloads[toolPayloads.length - 1]
  if (!last) return null
  if (last.ok === false && toolsUsed[toolsUsed.length - 1] !== "student_today_lessons") {
    return null
  }

  const toolName = toolsUsed[toolsUsed.length - 1] ?? ""

  if (toolName === "teacher_classes" || toolName === "my_teacher_classes") {
    return buildTeacherClassesStructuredReply(last)
  }

  if (toolName === "student_profile") {
    return buildStudentProfileStructuredReply(last)
  }

  if (toolName === "search_students") {
    return buildSearchStudentsStructuredReply(last)
  }

  if (toolName === "student_today_lessons") {
    return buildStudentTodayLessonsStructuredReply(last)
  }

  if (toolName === "teacher_day_attendance") {
    if (last.ok === false) return null
    const date = String(last.date ?? "")
    const teacher = last.teacher as Record<string, unknown> | undefined
    const name = String(teacher?.english_name ?? teacher?.full_name ?? "老師")
    const classes = Array.isArray(last.classes) ? last.classes : []
    const count = Number(last.class_count ?? classes.length)
    if (count === 0) {
      return {
        reply: `${name} 在 ${date || "今日"} 沒有排程課堂，因此沒有點名狀態可查。`,
        suggestions: ["前往進行點名", "出席紀錄"],
        paths: [{ label: "進行點名", path: "/Attendance" }],
      }
    }
    const lines = classes.slice(0, 6).map((c) => {
      const row = c as Record<string, unknown>
      const label = classDisplayName({
        subject: row.subject,
        courseName: row.class_name ?? row.course_name,
      })
      const taken = row.attendance_taken === true ? "已點名" : "未點名"
      const present = row.present_count ?? 0
      const enrolled = row.enrolled_count ?? 0
      return `• ${label}：${taken}（出席 ${present}/${enrolled}）`
    })
    return {
      reply: `${name} 在 ${date} 共有 ${count} 堂：\n${lines.join("\n")}`,
      suggestions: ["前往進行點名", "今日請假名單"],
      paths: [{ label: "進行點名", path: "/Attendance" }],
    }
  }

  return null
}
