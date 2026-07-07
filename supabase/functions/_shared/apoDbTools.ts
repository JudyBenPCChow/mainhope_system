import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2"

export type AssistantDbContext = {
  userRole: string
  teacherId: string | null
}

export type ApoContextPatch = {
  lastStudentId?: string | null
  lastStudentName?: string | null
  lastTopic?: string | null
  summary?: string | null
}

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
      name: "search_students",
      description: "按中文姓名、英文姓名或學號搜尋學生（模糊匹配）。查詢具名學生前必先呼叫。",
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
]

export const APO_DB_TOOLS_PROMPT = `
## 資料庫查詢（唯讀）

你可透過工具即時查詢系統資料（只讀，不可寫入）。適用場景：
- 學生今日有冇堂、幾點、邊班、已請假未
- 學生狀態（在讀、活躍、報讀班別）
- 學生最近出席紀錄
- 今日請假名單、班別點名名單
- 老師今日排程（teacher 角色）
- 未來試堂（admin／teacher／alien）
- 已繳／已上堂數與追收學費提示（僅 admin／alien）

**流程：**
1. 用戶提到具名學生時，先 \`search_students\`；若多名候選須列出請用戶確認。
2. 再用 \`student_today_lessons\`、\`student_profile\` 等取得細節。
3. 根據查詢結果回答；**不可捏造**資料庫沒有的內容。
4. 仍不可回傳電話、地址；不可代為修改資料。

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
        enrollments: Array.isArray(result.enrollments) ? result.enrollments.slice(0, 12) : [],
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
    if (p.lastTopic) out.lastTopic = p.lastTopic
    if (p.summary) out.summary = p.summary
  }
  return out
}

export function formatContextHint(ctx: ApoContextPatch | undefined): string {
  if (!ctx) return ""
  const parts: string[] = []
  if (ctx.lastStudentName && ctx.lastStudentId) {
    parts.push(`當前討論學生：${ctx.lastStudentName}（id: ${ctx.lastStudentId}）`)
  }
  if (ctx.summary) parts.push(ctx.summary)
  if (ctx.lastTopic) parts.push(`上次查詢類型：${ctx.lastTopic}`)
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
    switch (name) {
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
      default:
        return JSON.stringify({ ok: false, error: `未知工具：${name}` })
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return JSON.stringify({ ok: false, error: msg })
  }
}
