import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2"

export type AssistantDbContext = {
  userRole: string
  teacherId: string | null
}

export type ApoContextPatch = {
  lastStudentId?: string | null
  lastStudentName?: string | null
  lastTeacherId?: string | null
  lastTeacherName?: string | null
  lastTopic?: string | null
  summary?: string | null
  /** 分頁名單：下一頁 offset（用戶答「繼續」時帶入） */
  listOffset?: number | null
  listTotal?: number | null
  listHasMore?: boolean | null
}

export const APO_LIST_PAGE_SIZE = 20

type ToolDef = {
  type: "function"
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

export const APO_DB_TOOL_DEFINITIONS: ToolDef[] = [
  {
    type: "function",
    function: {
      name: "search_teachers",
      description: "按中文或英文姓名搜尋老師（模糊匹配）。查詢老師班別、老師資料前必先呼叫；唔好用 search_students 查老師。",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "老師姓名關鍵字" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "teacher_classes",
      description: "查詢指定老師負責嘅班別列表（科目、代碼、星期、時段、就讀人數）。需 teacher_id（來自 search_teachers）。",
      parameters: {
        type: "object",
        properties: {
          teacher_id: { type: "string", description: "老師 UUID" },
        },
        required: ["teacher_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_students",
      description: "按中文姓名、英文姓名或學號搜尋學生（模糊匹配）。僅用於學生；若用戶問老師請用 search_teachers。",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "學生姓名或學號關鍵字" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "student_today_lessons",
      description: "查詢學生指定日期（預設今日香港）應上課堂次、時間、請假與點名狀態。",
      parameters: {
        type: "object",
        properties: {
          student_id: { type: "string", description: "學生 UUID（來自 search_students）" },
          date: { type: "string", description: "YYYY-MM-DD，省略則為今日" },
        },
        required: ["student_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "student_profile",
      description: "查詢學生基本資料、四維狀態與報讀班別列表（不含電話地址）。",
      parameters: {
        type: "object",
        properties: {
          student_id: { type: "string", description: "學生 UUID" },
        },
        required: ["student_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "student_tuition",
      description: "查詢學生已繳堂數、計費出席堂數、是否需追收學費。僅 admin／alien 可用。",
      parameters: {
        type: "object",
        properties: {
          student_id: { type: "string", description: "學生 UUID" },
        },
        required: ["student_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "student_recent_attendance",
      description: "查詢學生最近出席／點名紀錄。",
      parameters: {
        type: "object",
        properties: {
          student_id: { type: "string", description: "學生 UUID" },
          limit: { type: "integer", description: "筆數，預設 10，最多 30" },
        },
        required: ["student_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "teacher_day_schedule",
      description: "查詢專班老師指定日期（預設今日）的課堂排程與各班就讀人數。僅 teacher 角色。",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "YYYY-MM-DD，省略則為今日" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "teacher_day_attendance",
      description:
        "查詢指定老師在指定日期（預設今日香港）各堂嘅點名狀態：已點名／未點名、出席／缺席／請假人數。admin 可查任意老師；teacher 只查自己。",
      parameters: {
        type: "object",
        properties: {
          teacher_id: { type: "string", description: "老師 UUID（來自 search_teachers 或上下文）" },
          date: { type: "string", description: "YYYY-MM-DD，省略則為今日" },
        },
        required: ["teacher_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "today_leaves",
      description: "查詢指定日期（預設今日）的請假學生名單。",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "YYYY-MM-DD，省略則為今日" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "class_roster",
      description: "按班別科目或課程代碼查詢今日（或指定日）點名名單與出席狀態。",
      parameters: {
        type: "object",
        properties: {
          class_query: { type: "string", description: "班別科目關鍵字或 course_code_full 片段" },
          date: { type: "string", description: "YYYY-MM-DD，省略則為今日" },
        },
        required: ["class_query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "upcoming_trials",
      description: "查詢未來數日內的試堂預約。",
      parameters: {
        type: "object",
        properties: {
          days: { type: "integer", description: "往後天數，預設 7，最多 30" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "pending_makeups",
      description:
        "查詢待補課名單（同請假管理「待補課」分頁：未完成、未放棄）。每頁 20 筆；has_more 為 true 時告知用戶可繼續。專班老師只看到自己班別。",
      parameters: {
        type: "object",
        properties: {
          offset: { type: "integer", description: "分頁偏移，預設 0；用戶答「繼續」時用 next_offset" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "overdue_tuition_list",
      description:
        "查詢需追收學費的在讀／活躍學生名單（計費出席堂數 ≥ 已繳堂數）。每頁 20 筆；僅 admin／alien。不回傳金額。",
      parameters: {
        type: "object",
        properties: {
          offset: { type: "integer", description: "分頁偏移，預設 0；用戶答「繼續」時用 next_offset" },
        },
      },
    },
  },
]

export type ApoToolDef = (typeof APO_DB_TOOL_DEFINITIONS)[number]

const TEACHER_DENIED_TOOL_NAMES = new Set([
  "search_teachers",
  "teacher_classes",
  "student_tuition",
  "overdue_tuition_list",
])

const MY_TEACHER_CLASSES_TOOL: ApoToolDef = {
  type: "function",
  function: {
    name: "my_teacher_classes",
    description: "查詢我（目前登入專班老師）負責的所有班別。專班老師查自己班別時用此工具。",
    parameters: { type: "object", properties: {} },
  },
}

/** 依角色回傳可用 tools（專班老師唔會見到查其他老師／繳費工具） */
export function toolsForRole(userRole: string): ApoToolDef[] {
  if (userRole === "teacher") {
    const base = APO_DB_TOOL_DEFINITIONS.filter((t) => !TEACHER_DENIED_TOOL_NAMES.has(t.function.name))
    return [...base, MY_TEACHER_CLASSES_TOOL]
  }
  return [...APO_DB_TOOL_DEFINITIONS]
}

function assertToolAllowed(toolName: string, ctx: AssistantDbContext): string | null {
  if (ctx.userRole === "teacher" && TEACHER_DENIED_TOOL_NAMES.has(toolName)) {
    return JSON.stringify({ ok: false, error: "你沒有權限使用此查詢功能" })
  }
  if (toolName === "my_teacher_classes" && ctx.userRole !== "teacher") {
    return JSON.stringify({ ok: false, error: "此功能僅供專班老師使用" })
  }
  if (toolName === "teacher_day_schedule" && ctx.userRole !== "teacher") {
    return JSON.stringify({ ok: false, error: "此功能僅供專班老師使用" })
  }
  if (toolName === "teacher_day_attendance" && ctx.userRole === "teacher") {
    if (!ctx.teacherId) {
      return JSON.stringify({ ok: false, error: "老師身分未設定" })
    }
  }
  return null
}

export const APO_DB_TOOLS_PROMPT = `
## 資料庫查詢（唯讀）

你可透過工具即時查詢系統資料（只讀，不可寫入）。

**admin／alien**：search_teachers → teacher_classes 查任意老師班別。
**專班老師**：只用 my_teacher_classes、teacher_day_schedule 查自己；search_students 只會返回自己班學生；不可用 search_teachers、student_tuition、overdue_tuition_list。

適用場景：
- 老師班別（admin 用 search_teachers；teacher 用 my_teacher_classes）
- 老師今日各堂點名狀態（teacher_day_attendance；必須先查再答，不可憑班別星期時間推斷）
- 學生今日上堂、請假、狀態、出席
- 今日請假名單、待補課名單、班別點名名單
- 未來試堂
- 追收學費名單（admin／alien）

**分頁名單**（pending_makeups、overdue_tuition_list）：每頁 20 筆；若 has_more 為 true，必須告知用戶仲有幾多筆未列出，並問是否繼續；用戶答「繼續」時用 next_offset 再查。

**流程：**
1. 問**老師**班別：admin 用 search_teachers → teacher_classes；teacher 用 my_teacher_classes。
2. 問**學生**：search_students → student_*；**禁止**用 search_students 查老師。
3. 根據查詢結果回答；不可捏造。

lesson_state 含義：expected=應上堂、on_leave=已請假、excused=請假已點、absent=缺席、cancelled=排程取消、marked=已點名其他狀態。
`.trim()

function createServiceClient(): SupabaseClient | null {
  const url = Deno.env.get("SUPABASE_URL")
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

function strArg(args: Record<string, unknown>, key: string): string | null {
  const v = args[key]
  if (v == null) return null
  const s = String(v).trim()
  return s.length > 0 ? s : null
}

function intArg(args: Record<string, unknown>, key: string, fallback: number): number {
  const v = args[key]
  if (v == null || v === "") return fallback
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : fallback
}

async function rpcJson(
  client: SupabaseClient,
  fn: string,
  params: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const { data, error } = await client.rpc(fn, params)
  if (error) {
    return { ok: false, error: error.message }
  }
  if (data && typeof data === "object") {
    return data as Record<string, unknown>
  }
  return { ok: false, error: "查詢無回傳" }
}

function pickStudent(row: Record<string, unknown>) {
  return {
    id: row.id,
    student_code: row.student_code,
    full_name: row.full_name,
    english_name: row.english_name,
    grade: row.grade,
    enrollment_status: row.enrollment_status,
    activity_status: row.activity_status,
  }
}

/** 精簡 tool 回傳，減少餵俾 LLM 的 token */
export function trimToolResult(
  toolName: string,
  result: Record<string, unknown>
): Record<string, unknown> {
  if (result.ok === false) return { ok: false, error: result.error }

  switch (toolName) {
    case "search_teachers": {
      const teachers = Array.isArray(result.teachers) ? result.teachers.slice(0, 8) : []
      return {
        ok: true,
        count: result.count,
        teachers: teachers.map((t) => {
          const r = t as Record<string, unknown>
          return {
            id: r.id,
            full_name: r.full_name,
            english_name: r.english_name,
            status: r.status,
            class_count: r.class_count,
          }
        }),
      }
    }
    case "teacher_classes":
      return {
        ok: true,
        teacher: result.teacher,
        teacher_id: result.teacher_id,
        class_count: result.class_count,
        classes: Array.isArray(result.classes)
          ? result.classes.slice(0, 20).map((c) => {
              const row = c as Record<string, unknown>
              return {
                class_id: row.class_id,
                class_name: row.class_name ?? row.course_name,
                course_name: row.course_name,
                subject: row.subject,
                section_code: row.section_code,
                course_code_full: row.course_code_full,
                day_of_week: row.day_of_week,
                time_slot: row.time_slot,
                status: row.status,
                enrolled_count: row.enrolled_count,
              }
            })
          : [],
      }
    case "my_teacher_classes":
      return trimToolResult("teacher_classes", result)
    case "search_students": {
      const students = Array.isArray(result.students) ? result.students.slice(0, 5) : []
      return {
        ok: true,
        count: result.count,
        students: students.map((s) => pickStudent(s as Record<string, unknown>)),
      }
    }
    case "student_today_lessons":
      return {
        ok: true,
        date: result.date,
        student_id: result.student_id,
        lesson_count: result.lesson_count,
        lessons: Array.isArray(result.lessons) ? result.lessons.slice(0, 8) : [],
      }
    case "student_profile":
      return {
        ok: true,
        student: result.student,
        enrollment_count: result.enrollment_count,
        enrollments: Array.isArray(result.enrollments)
          ? result.enrollments.slice(0, 12).map((e) => {
              const row = e as Record<string, unknown>
              return {
                enrollment_id: row.enrollment_id,
                enrollment_status: row.enrollment_status,
                enroll_date: row.enroll_date,
                enrollment_period: row.enrollment_period,
                class_id: row.class_id,
                class_name: row.class_name ?? row.course_name,
                course_name: row.course_name,
                subject: row.subject,
                section_code: row.section_code,
                course_code_full: row.course_code_full,
                day_of_week: row.day_of_week,
                time_slot: row.time_slot,
                teacher_name: row.teacher_name,
              }
            })
          : [],
      }
    case "student_tuition":
      return {
        ok: true,
        student_id: result.student_id,
        paid_lessons: result.paid_lessons,
        attended_lessons: result.attended_lessons,
        needs_tuition_arrears: result.needs_tuition_arrears,
      }
    case "student_recent_attendance":
      return {
        ok: true,
        student_id: result.student_id,
        records: Array.isArray(result.records) ? result.records.slice(0, 8) : [],
      }
    case "teacher_day_schedule":
      return {
        ok: true,
        date: result.date,
        schedule_count: result.schedule_count,
        schedules: Array.isArray(result.schedules) ? result.schedules.slice(0, 12) : [],
      }
    case "teacher_day_attendance":
      return {
        ok: true,
        date: result.date,
        teacher: result.teacher,
        teacher_id: result.teacher_id,
        class_count: result.class_count,
        classes: Array.isArray(result.classes) ? result.classes.slice(0, 12) : [],
      }
    case "today_leaves":
      return {
        ok: true,
        date: result.date,
        leave_count: result.leave_count,
        leaves: Array.isArray(result.leaves) ? result.leaves.slice(0, 20) : [],
      }
    case "class_roster":
      return {
        ok: true,
        date: result.date,
        class: result.class,
        student_count: result.student_count,
        roster: Array.isArray(result.roster) ? result.roster.slice(0, 30) : [],
      }
    case "upcoming_trials":
      return {
        ok: true,
        from_date: result.from_date,
        to_date: result.to_date,
        trial_count: result.trial_count,
        trials: Array.isArray(result.trials) ? result.trials.slice(0, 15) : [],
      }
    case "pending_makeups":
    case "overdue_tuition_list":
      return {
        ok: true,
        total_count: result.total_count,
        offset: result.offset,
        limit: result.limit,
        has_more: result.has_more,
        next_offset: result.next_offset,
        record_count: result.record_count,
        records: Array.isArray(result.records) ? result.records.slice(0, APO_LIST_PAGE_SIZE) : [],
      }
    default:
      return result
  }
}

export function extractContextPatch(
  toolName: string,
  result: Record<string, unknown>
): ApoContextPatch {
  if (result.ok === false) return {}

  const patch: ApoContextPatch = { lastTopic: toolName }

  if (toolName === "search_teachers" && Array.isArray(result.teachers)) {
    const list = result.teachers as Record<string, unknown>[]
    if (list.length === 1) {
      patch.lastTeacherId = String(list[0].id ?? "")
      patch.lastTeacherName = String(list[0].english_name ?? list[0].full_name ?? "")
      patch.summary = `討論老師：${patch.lastTeacherName}`
    } else if (list.length > 1) {
      patch.summary = `搜尋到 ${list.length} 名候選老師`
    }
    return patch
  }

  if (toolName === "teacher_classes" || toolName === "my_teacher_classes") {
    const teacher = result.teacher as Record<string, unknown> | undefined
    if (teacher) {
      patch.lastTeacherId = String(result.teacher_id ?? teacher.id ?? "")
      patch.lastTeacherName = String(teacher.english_name ?? teacher.full_name ?? "")
      patch.summary = `老師 ${patch.lastTeacherName} 有 ${result.class_count ?? 0} 個班別`
    }
    return patch
  }

  if (toolName === "teacher_day_attendance") {
    const teacher = result.teacher as Record<string, unknown> | undefined
    if (teacher) {
      patch.lastTeacherId = String(result.teacher_id ?? teacher.id ?? "")
      patch.lastTeacherName = String(teacher.english_name ?? teacher.full_name ?? "")
    }
    patch.summary = `查詢 ${patch.lastTeacherName ?? "老師"} ${result.date ?? "今日"} 點名（${result.class_count ?? 0} 堂）`
    return patch
  }

  if (toolName === "search_students" && Array.isArray(result.students)) {
    const list = result.students as Record<string, unknown>[]
    if (list.length === 1) {
      patch.lastStudentId = String(list[0].id ?? "")
      patch.lastStudentName = String(list[0].full_name ?? "")
      patch.summary = `討論學生：${patch.lastStudentName}`
    } else if (list.length > 1) {
      patch.summary = `搜尋到 ${list.length} 名候選學生`
    }
    return patch
  }

  const sid = result.student_id != null ? String(result.student_id) : null
  if (sid) patch.lastStudentId = sid

  const student = result.student as Record<string, unknown> | undefined
  if (student?.full_name) {
    patch.lastStudentName = String(student.full_name)
    patch.summary = `討論學生：${patch.lastStudentName}`
  }

  if (toolName === "student_today_lessons") {
    patch.summary = `查詢 ${patch.lastStudentName ?? "學生"} 今日上堂（${result.lesson_count ?? 0} 堂）`
  }

  if (toolName === "pending_makeups" || toolName === "overdue_tuition_list") {
    const total = Number(result.total_count ?? 0)
    const offset = Number(result.offset ?? 0)
    const shown = Number(result.record_count ?? 0)
    patch.listOffset = result.next_offset != null ? Number(result.next_offset) : null
    patch.listTotal = total
    patch.listHasMore = result.has_more === true
    const label = toolName === "pending_makeups" ? "待補課" : "追收學費"
    patch.summary = `${label}名單：第 ${offset + 1}–${offset + shown} 筆，共 ${total} 筆`
    return patch
  }

  return patch
}

export function mergeContextPatches(
  base: ApoContextPatch | undefined,
  ...patches: ApoContextPatch[]
): ApoContextPatch {
  const out: ApoContextPatch = { ...(base ?? {}) }
  for (const p of patches) {
    if (p.lastStudentId) out.lastStudentId = p.lastStudentId
    if (p.lastStudentName) out.lastStudentName = p.lastStudentName
    if (p.lastTeacherId) out.lastTeacherId = p.lastTeacherId
    if (p.lastTeacherName) out.lastTeacherName = p.lastTeacherName
    if (p.lastTopic) out.lastTopic = p.lastTopic
    if (p.summary) out.summary = p.summary
    if (p.listOffset != null) out.listOffset = p.listOffset
    if (p.listTotal != null) out.listTotal = p.listTotal
    if (p.listHasMore != null) out.listHasMore = p.listHasMore
  }
  return out
}

export function formatContextHint(ctx: ApoContextPatch | undefined): string {
  if (!ctx) return ""
  const parts: string[] = []
  if (ctx.lastStudentName && ctx.lastStudentId) {
    parts.push(`當前討論學生：${ctx.lastStudentName}（id: ${ctx.lastStudentId}）`)
  }
  if (ctx.lastTeacherName && ctx.lastTeacherId) {
    parts.push(`當前討論老師：${ctx.lastTeacherName}（id: ${ctx.lastTeacherId}）`)
  }
  if (ctx.summary) parts.push(ctx.summary)
  if (ctx.lastTopic) parts.push(`上次查詢類型：${ctx.lastTopic}`)
  if (ctx.listHasMore && ctx.listOffset != null) {
    parts.push(`名單尚有更多（下次 offset=${ctx.listOffset}）`)
  }
  return parts.join("；")
}

export async function executeApoDbTool(
  name: string,
  args: Record<string, unknown>,
  ctx: AssistantDbContext
): Promise<string> {
  const client = createServiceClient()
  if (!client) {
    return JSON.stringify({ ok: false, error: "資料庫連線未設定" })
  }

  const role = ctx.userRole || "admin"
  const teacherId = ctx.teacherId

  try {
    const denied = assertToolAllowed(name, ctx)
    if (denied) return denied

    switch (name) {
      case "my_teacher_classes": {
        if (ctx.userRole !== "teacher" || !ctx.teacherId) {
          return JSON.stringify({ ok: false, error: "僅專班老師可查自己的班別" })
        }
        const result = await rpcJson(client, "apo_assistant_teacher_classes", {
          p_teacher_id: ctx.teacherId,
          p_user_role: ctx.userRole,
          p_scope_teacher_id: ctx.teacherId,
        })
        return JSON.stringify(trimToolResult("my_teacher_classes", result))
      }
      case "search_teachers": {
        const query = strArg(args, "query")
        if (!query) return JSON.stringify({ ok: false, error: "缺少 query" })
        const result = await rpcJson(client, "apo_assistant_search_teachers", {
          p_query: query,
          p_user_role: role,
          p_teacher_id: teacherId,
        })
        return JSON.stringify(trimToolResult(name, result))
      }
      case "teacher_classes": {
        const tid = strArg(args, "teacher_id")
        if (!tid) return JSON.stringify({ ok: false, error: "缺少 teacher_id" })
        const result = await rpcJson(client, "apo_assistant_teacher_classes", {
          p_teacher_id: tid,
          p_user_role: role,
          p_scope_teacher_id: teacherId,
        })
        return JSON.stringify(trimToolResult(name, result))
      }
      case "search_students": {
        const query = strArg(args, "query")
        if (!query) return JSON.stringify({ ok: false, error: "缺少 query" })
        const result = await rpcJson(client, "apo_assistant_search_students", {
          p_query: query,
          p_user_role: role,
          p_teacher_id: teacherId,
        })
        return JSON.stringify(trimToolResult(name, result))
      }
      case "student_today_lessons": {
        const studentId = strArg(args, "student_id")
        if (!studentId) return JSON.stringify({ ok: false, error: "缺少 student_id" })
        const result = await rpcJson(client, "apo_assistant_student_today_lessons", {
          p_student_id: studentId,
          p_date: strArg(args, "date"),
          p_user_role: role,
          p_teacher_id: teacherId,
        })
        return JSON.stringify(trimToolResult(name, result))
      }
      case "student_profile": {
        const studentId = strArg(args, "student_id")
        if (!studentId) return JSON.stringify({ ok: false, error: "缺少 student_id" })
        const result = await rpcJson(client, "apo_assistant_student_profile", {
          p_student_id: studentId,
          p_user_role: role,
          p_teacher_id: teacherId,
        })
        return JSON.stringify(trimToolResult(name, result))
      }
      case "student_tuition": {
        const studentId = strArg(args, "student_id")
        if (!studentId) return JSON.stringify({ ok: false, error: "缺少 student_id" })
        const result = await rpcJson(client, "apo_assistant_student_tuition", {
          p_student_id: studentId,
          p_user_role: role,
          p_teacher_id: teacherId,
        })
        return JSON.stringify(trimToolResult(name, result))
      }
      case "student_recent_attendance": {
        const studentId = strArg(args, "student_id")
        if (!studentId) return JSON.stringify({ ok: false, error: "缺少 student_id" })
        const result = await rpcJson(client, "apo_assistant_student_attendance", {
          p_student_id: studentId,
          p_limit: intArg(args, "limit", 8),
          p_user_role: role,
          p_teacher_id: teacherId,
        })
        return JSON.stringify(trimToolResult(name, result))
      }
      case "teacher_day_schedule": {
        const result = await rpcJson(client, "apo_assistant_teacher_schedule", {
          p_date: strArg(args, "date"),
          p_user_role: role,
          p_teacher_id: teacherId,
        })
        return JSON.stringify(trimToolResult(name, result))
      }
      case "teacher_day_attendance": {
        const tid =
          role === "teacher" && teacherId
            ? teacherId
            : strArg(args, "teacher_id")
        if (!tid) return JSON.stringify({ ok: false, error: "缺少 teacher_id" })
        const result = await rpcJson(client, "apo_assistant_teacher_day_attendance", {
          p_teacher_id: tid,
          p_date: strArg(args, "date"),
          p_user_role: role,
          p_scope_teacher_id: teacherId,
        })
        return JSON.stringify(trimToolResult(name, result))
      }
      case "today_leaves": {
        const result = await rpcJson(client, "apo_assistant_today_leaves", {
          p_date: strArg(args, "date"),
          p_user_role: role,
          p_teacher_id: teacherId,
        })
        return JSON.stringify(trimToolResult(name, result))
      }
      case "class_roster": {
        const classQuery = strArg(args, "class_query")
        if (!classQuery) return JSON.stringify({ ok: false, error: "缺少 class_query" })
        const result = await rpcJson(client, "apo_assistant_class_roster", {
          p_class_query: classQuery,
          p_date: strArg(args, "date"),
          p_user_role: role,
          p_teacher_id: teacherId,
        })
        return JSON.stringify(trimToolResult(name, result))
      }
      case "upcoming_trials": {
        const result = await rpcJson(client, "apo_assistant_upcoming_trials", {
          p_days: intArg(args, "days", 7),
          p_user_role: role,
          p_teacher_id: teacherId,
        })
        return JSON.stringify(trimToolResult(name, result))
      }
      case "pending_makeups": {
        const result = await rpcJson(client, "apo_assistant_pending_makeups", {
          p_offset: intArg(args, "offset", 0),
          p_limit: APO_LIST_PAGE_SIZE,
          p_user_role: role,
          p_teacher_id: teacherId,
        })
        return JSON.stringify(trimToolResult(name, result))
      }
      case "overdue_tuition_list": {
        const result = await rpcJson(client, "apo_assistant_overdue_tuition_list", {
          p_offset: intArg(args, "offset", 0),
          p_limit: APO_LIST_PAGE_SIZE,
          p_user_role: role,
          p_teacher_id: teacherId,
        })
        return JSON.stringify(trimToolResult(name, result))
      }
      default:
        return JSON.stringify({ ok: false, error: `未知工具：${name}` })
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return JSON.stringify({ ok: false, error: msg })
  }
}
