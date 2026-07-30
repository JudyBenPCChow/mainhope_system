import {
  APO_LIST_PAGE_SIZE,
  executeApoDbTool,
  extractContextPatch,
  mergeContextPatches,
  type ApoContextPatch,
  type AssistantDbContext,
} from "./apoDbTools.ts"
import { extractTeacherNameQuery, isTeacherRelatedQuery } from "./apoTeacherQuery.ts"
import {
  extractClassQueryFromText,
  extractStudentNameQuery,
  isClassRosterQuery,
  isStudentDataQuery,
} from "./apoStudentQuery.ts"

/** 高頻查詢直連 RPC，跳過 tool-selection LLM 回合 */
export async function tryDirectDbQuery(
  text: string,
  ctx: AssistantDbContext,
  chatContext: ApoContextPatch | undefined
): Promise<{ toolName: string; resultJson: string; patch: ApoContextPatch } | null> {
  const t = text.trim()

  // 分頁名單：用戶答「繼續」
  if (isListContinueQuery(t) && chatContext?.listHasMore && chatContext.lastTopic) {
    const offset = chatContext.listOffset ?? APO_LIST_PAGE_SIZE
    if (chatContext.lastTopic === "pending_makeups") {
      return invoke(ctx, "pending_makeups", { offset })
    }
    if (
      chatContext.lastTopic === "overdue_tuition_list" &&
      ctx.userRole !== "teacher"
    ) {
      return invoke(ctx, "overdue_tuition_list", { offset })
    }
  }

  // 專班老師：只查自己班別，唔搜其他老師
  if (ctx.userRole === "teacher") {
    if (ctx.teacherId && (isTeacherRelatedQuery(t) || /我.*班|自己.*班|我的班/.test(t))) {
      return invoke(ctx, "my_teacher_classes", {})
    }
    // 唔執行下方 search_teachers / 其他老師查詢
  } else {
    const teacherName = extractTeacherNameQuery(t) ?? null

    if (teacherName && /點名/.test(t)) {
      const attendanceLookup = await lookupTeacherDayAttendance(ctx, teacherName, chatContext)
      if (attendanceLookup) return attendanceLookup
    }

    const teacherNameForClass =
      teacherName ??
      (chatContext?.lastTeacherName && /佢|她|班別|邊班/.test(t)
        ? chatContext.lastTeacherName
        : null)

    if (teacherNameForClass && (isTeacherRelatedQuery(t) || chatContext?.lastTeacherId || /有(?:咩|什麼|哪些|乜)班|班別/.test(t))) {
      const teacherLookup = await lookupTeacherClasses(ctx, teacherNameForClass, chatContext)
      if (teacherLookup) return teacherLookup
    }

    if (chatContext?.lastTeacherId && /班別|邊班|乜班|有咩班|哪些班/.test(t)) {
      return invoke(ctx, "teacher_classes", { teacher_id: chatContext.lastTeacherId })
    }

    if (
      chatContext?.lastTeacherId &&
      /點名狀態|點名.*如何|有冇點名|未點名|點名未|點咗名未/.test(t)
    ) {
      return invoke(ctx, "teacher_day_attendance", { teacher_id: chatContext.lastTeacherId })
    }
  }

  if (
    ctx.userRole === "teacher" &&
    ctx.teacherId &&
    /點名狀態|點名.*如何|有冇點名|未點名|點名未|點咗名未/.test(t)
  ) {
    return invoke(ctx, "teacher_day_attendance", { teacher_id: ctx.teacherId })
  }

  // 班別點名名單（具班別代碼或科目關鍵字）
  if (isClassRosterQuery(t)) {
    const classQuery = extractClassQueryFromText(t)
    if (classQuery) return invoke(ctx, "class_roster", { class_query: classQuery })
  }

  // 具名學生查詢（唔依賴上下文）；短姓名如「霍健一呢」亦直接搜學生
  // 操作教學（如何／點樣刪除出席等）唔走資料庫搜尋
  {
    const studentName = extractStudentNameQuery(t)
    if (studentName && (isStudentDataQuery(t) || isBareStudentNameQuery(t))) {
      const studentLookup = await lookupStudentData(ctx, studentName, t)
      if (studentLookup) return studentLookup
    }
  }

  if (chatContext?.lastStudentId) {
    const sid = chatContext.lastStudentId
    if (/上堂|上唔上堂|幾點|今日.*堂|洗唔洗/.test(t)) {
      return invoke(ctx, "student_today_lessons", { student_id: sid })
    }
    if (/請假|請咗假|請假未/.test(t)) {
      return invoke(ctx, "student_today_lessons", { student_id: sid })
    }
    if (/狀態|在讀|活躍|報讀|邊班|依家報|而家報|報緊|讀緊|報乜|報咩|報什麼/.test(t)) {
      return invoke(ctx, "student_profile", { student_id: sid })
    }
    if (/出席|點名|最近/.test(t)) {
      return invoke(ctx, "student_recent_attendance", { student_id: sid, limit: 8 })
    }
    if (/繳費|追收|堂數|欠/.test(t) && ctx.userRole !== "teacher") {
      return invoke(ctx, "student_tuition", { student_id: sid })
    }
  }

  if (/今日.*請假|請假.*今日|邊個.*請假|請假名單/.test(t)) {
    return invoke(ctx, "today_leaves", {})
  }

  if (/待補|未補|補課.*未|邊個.*待補/.test(t) && !/如何|點樣|怎樣/.test(t)) {
    return invoke(ctx, "pending_makeups", { offset: 0 })
  }

  if (
    ctx.userRole !== "teacher" &&
    /追收|欠費|邊個.*要追|邊個.*學費|學費.*名單/.test(t) &&
    !/如何|點樣|怎樣/.test(t)
  ) {
    return invoke(ctx, "overdue_tuition_list", { offset: 0 })
  }

  if (/試堂|trial/i.test(t) && !/如何|點樣|怎樣/.test(t)) {
    return invoke(ctx, "upcoming_trials", { days: 7 })
  }

  if (ctx.userRole === "teacher" && /我今日|今日.*堂|今日.*排程|今日有幾堂/.test(t)) {
    return invoke(ctx, "teacher_day_schedule", {})
  }

  return null
}

function isListContinueQuery(text: string): boolean {
  const t = text.trim()
  return /^(繼續|再列|睇多|下一頁|繼續列出)/.test(t) || /^好[，,]?\s*繼續/.test(t)
}

/** 幾乎只有姓名嘅短問（例如「霍健一呢」） */
function isBareStudentNameQuery(text: string): boolean {
  const name = extractStudentNameQuery(text)
  if (!name) return false
  const t = text.trim()
  if (/^[\u4e00-\u9fff]{2,5}[？?！!\s]*$/.test(t)) return true
  if (/^[A-Za-z][A-Za-z\s.'-]{1,40}?[?？!！\s]*$/.test(t) && !/\b(hi|hello|ok)\b/i.test(t)) {
    return true
  }
  return false
}

async function lookupStudentData(
  ctx: AssistantDbContext,
  nameQuery: string,
  text: string
): Promise<{ toolName: string; resultJson: string; patch: ApoContextPatch } | null> {
  const search = await invoke(ctx, "search_students", { query: nameQuery })
  let parsed: Record<string, unknown> = {}
  try {
    parsed = JSON.parse(search.resultJson) as Record<string, unknown>
  } catch {
    return search
  }

  if (parsed.ok === false) return search

  const students = Array.isArray(parsed.students) ? (parsed.students as Record<string, unknown>[]) : []
  if (students.length !== 1) return search

  const sid = String(students[0].id ?? "")
  if (!sid) return search

  let followTool = "student_profile"
  if (/上堂|上唔上|幾點|今日.*堂|今天.*堂|有冇堂|有沒有堂|洗唔洗|請假/.test(text)) {
    followTool = "student_today_lessons"
  } else if (/出席|點名|最近/.test(text)) {
    followTool = "student_recent_attendance"
  } else if (/繳費|追收|堂數|欠/.test(text) && ctx.userRole !== "teacher") {
    followTool = "student_tuition"
  }

  const followArgs: Record<string, unknown> =
    followTool === "student_recent_attendance"
      ? { student_id: sid, limit: 8 }
      : { student_id: sid }

  const follow = await invoke(ctx, followTool, followArgs)
  let followParsed: Record<string, unknown> = {}
  try {
    followParsed = JSON.parse(follow.resultJson) as Record<string, unknown>
  } catch {
    return follow
  }

  return {
    toolName: followTool,
    resultJson: JSON.stringify({
      ok: true,
      search_query: nameQuery,
      search_count: parsed.count,
      student: students[0],
      ...followParsed,
    }),
    patch: mergeContextPatches(search.patch, follow.patch),
  }
}

async function lookupTeacherDayAttendance(
  ctx: AssistantDbContext,
  nameQuery: string,
  chatContext: ApoContextPatch | undefined
): Promise<{ toolName: string; resultJson: string; patch: ApoContextPatch } | null> {
  if (chatContext?.lastTeacherId && chatContext.lastTeacherName) {
    const norm = nameQuery.toLowerCase()
    const last = chatContext.lastTeacherName.toLowerCase()
    if (last.includes(norm) || norm.includes(last)) {
      return invoke(ctx, "teacher_day_attendance", { teacher_id: chatContext.lastTeacherId })
    }
  }

  const search = await invoke(ctx, "search_teachers", { query: nameQuery })
  let parsed: Record<string, unknown> = {}
  try {
    parsed = JSON.parse(search.resultJson) as Record<string, unknown>
  } catch {
    return search
  }

  if (parsed.ok === false) return search

  const teachers = Array.isArray(parsed.teachers) ? (parsed.teachers as Record<string, unknown>[]) : []
  if (teachers.length !== 1) return search

  const tid = String(teachers[0].id ?? "")
  if (!tid) return search

  const attendance = await invoke(ctx, "teacher_day_attendance", { teacher_id: tid })
  const attParsed = JSON.parse(attendance.resultJson) as Record<string, unknown>

  return {
    toolName: "teacher_day_attendance",
    resultJson: JSON.stringify({
      ok: true,
      search_query: nameQuery,
      search_count: parsed.count,
      ...attParsed,
    }),
    patch: mergeContextPatches(search.patch, attendance.patch),
  }
}

async function lookupTeacherClasses(
  ctx: AssistantDbContext,
  nameQuery: string,
  chatContext: ApoContextPatch | undefined
): Promise<{ toolName: string; resultJson: string; patch: ApoContextPatch } | null> {
  if (chatContext?.lastTeacherId && chatContext.lastTeacherName) {
    const norm = nameQuery.toLowerCase()
    const last = chatContext.lastTeacherName.toLowerCase()
    if (last.includes(norm) || norm.includes(last)) {
      return invoke(ctx, "teacher_classes", { teacher_id: chatContext.lastTeacherId })
    }
  }

  const search = await invoke(ctx, "search_teachers", { query: nameQuery })
  let parsed: Record<string, unknown> = {}
  try {
    parsed = JSON.parse(search.resultJson) as Record<string, unknown>
  } catch {
    return search
  }

  if (parsed.ok === false) return search

  const teachers = Array.isArray(parsed.teachers) ? (parsed.teachers as Record<string, unknown>[]) : []
  if (teachers.length !== 1) return search

  const tid = String(teachers[0].id ?? "")
  if (!tid) return search

  const classes = await invoke(ctx, "teacher_classes", { teacher_id: tid })
  const classParsed = JSON.parse(classes.resultJson) as Record<string, unknown>

  return {
    toolName: "teacher_classes",
    resultJson: JSON.stringify({
      ok: true,
      search_query: nameQuery,
      search_count: parsed.count,
      ...classParsed,
    }),
    patch: mergeContextPatches(search.patch, classes.patch),
  }
}

async function invoke(
  ctx: AssistantDbContext,
  toolName: string,
  args: Record<string, unknown>
): Promise<{ toolName: string; resultJson: string; patch: ApoContextPatch }> {
  const resultJson = await executeApoDbTool(toolName, args, ctx)
  let parsed: Record<string, unknown> = {}
  try {
    parsed = JSON.parse(resultJson) as Record<string, unknown>
  } catch {
    // ignore
  }
  return {
    toolName,
    resultJson,
    patch: extractContextPatch(toolName, parsed),
  }
}
