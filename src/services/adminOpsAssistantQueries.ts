import { formatUnknownError } from "@/lib/formatUnknownError"
import { EMPTY_ADMIN_OPS_CONTEXT } from "@/lib/adminOpsAssistant/types"
import type {
  AdminOpsChatContext,
  AdminOpsChoice,
  AdminOpsPendingExecute,
  AdminOpsWorkflow,
  CreateClassScheduleSlots,
} from "@/lib/adminOpsAssistant/types"
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient"

export type AdminOpsMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  displayContent?: string
  choices?: AdminOpsChoice[]
  suggestions?: string[]
  pendingExecute?: AdminOpsPendingExecute | null
}

export type SendAdminOpsChatInput = {
  messages: Pick<AdminOpsMessage, "role" | "content">[]
  opsContext: AdminOpsChatContext
}

export type SendAdminOpsChatResult =
  | {
      ok: true
      reply: string
      suggestions: string[]
      choices: AdminOpsChoice[]
      opsContext: AdminOpsChatContext
      pendingExecute: AdminOpsPendingExecute | null
    }
  | { ok: false; message: string }

function mapInvokeError(error: unknown, data: unknown): string {
  if (data && typeof data === "object" && data !== null) {
    const err = (data as { error?: unknown }).error
    if (typeof err === "string" && err.trim()) return err.trim()
  }
  return formatUnknownError(error)
}

async function readFunctionErrorBody(error: unknown, response?: Response): Promise<string | null> {
  const res = response ?? (error as { context?: Response } | null)?.context
  if (!res || typeof res.json !== "function") return null
  try {
    const body = (await res.clone().json()) as { error?: unknown }
    if (typeof body.error === "string" && body.error.trim()) return body.error.trim()
  } catch {
    // ignore
  }
  return null
}

function normalizeChoices(raw: unknown): AdminOpsChoice[] {
  if (!Array.isArray(raw)) return []
  const out: AdminOpsChoice[] = []
  for (const item of raw) {
    if (!item || typeof item !== "object") continue
    const id = String((item as AdminOpsChoice).id ?? "").trim()
    const label = String((item as AdminOpsChoice).label ?? "").trim()
    const payload = String((item as AdminOpsChoice).payload ?? "").trim()
    if (!id || !label || !payload) continue
    out.push({ id, label, payload })
  }
  return out
}

function normalizeSuggestions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.map((s) => String(s ?? "").trim()).filter(Boolean).slice(0, 6)
}

const WORKFLOWS: AdminOpsWorkflow[] = [
  "idle",
  "clarify_scope",
  "delete_empty_class",
  "change_fixed_slot",
  "swap_slots",
  "create_class_schedule",
  "replace_empty_slot",
]

function normalizeOpsContext(raw: unknown): AdminOpsChatContext {
  if (!raw || typeof raw !== "object") return { ...EMPTY_ADMIN_OPS_CONTEXT }
  const o = raw as AdminOpsChatContext
  const workflow = WORKFLOWS.includes(o.workflow) ? o.workflow : "idle"
  const slots = o.slots && typeof o.slots === "object" ? o.slots : {}
  return { workflow, slots }
}

function asString(v: unknown): string | undefined {
  const s = String(v ?? "").trim()
  return s ? s : undefined
}

function normalizeCreateSlots(raw: unknown): CreateClassScheduleSlots {
  if (!raw || typeof raw !== "object") return {}
  const o = raw as CreateClassScheduleSlots
  return {
    academic_year_id: asString(o.academic_year_id),
    academic_year_label: asString(o.academic_year_label),
    subject_id: asString(o.subject_id),
    subject_name: asString(o.subject_name),
    course_id: asString(o.course_id),
    course_label: asString(o.course_label),
    grade_label: asString(o.grade_label),
    grade_code: asString(o.grade_code),
    teacher_id: asString(o.teacher_id),
    teacher_label: asString(o.teacher_label),
    classroom_id: asString(o.classroom_id),
    classroom_label: asString(o.classroom_label),
    day_of_week: asString(o.day_of_week),
    time_slot: asString(o.time_slot),
    consecutive_lesson: typeof o.consecutive_lesson === "boolean" ? o.consecutive_lesson : undefined,
    first_lesson_date: asString(o.first_lesson_date),
    enroll_student_id: asString(o.enroll_student_id),
    enroll_student_label: asString(o.enroll_student_label),
    inherit_from_class_id: asString(o.inherit_from_class_id),
  }
}

function normalizePendingExecute(raw: unknown): AdminOpsPendingExecute | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as AdminOpsPendingExecute
  const previewLines = Array.isArray(o.previewLines)
    ? o.previewLines.map((l) => String(l ?? "").trim()).filter(Boolean)
    : []
  if (o.workflow === "delete_empty_class" && o.classId) {
    return { workflow: "delete_empty_class", classId: String(o.classId), previewLines }
  }
  if (
    o.workflow === "change_fixed_slot" &&
    o.classId &&
    (o.mode === "update_times" || o.mode === "regenerate_dates")
  ) {
    return {
      workflow: "change_fixed_slot",
      classId: String(o.classId),
      mode: o.mode,
      newDayOfWeek: String(o.newDayOfWeek ?? ""),
      newTimeSlot: String(o.newTimeSlot ?? ""),
      newClassroomId: o.newClassroomId ? String(o.newClassroomId) : null,
      keepCancelledAndMakeup: Boolean(o.keepCancelledAndMakeup),
      previewLines,
    }
  }
  if (o.workflow === "swap_slots" && o.classAId && o.classBId) {
    return {
      workflow: "swap_slots",
      classAId: String(o.classAId),
      classBId: String(o.classBId),
      previewLines,
    }
  }
  if (o.workflow === "create_class_schedule") {
    return {
      workflow: "create_class_schedule",
      slots: normalizeCreateSlots(o.slots),
      previewLines,
    }
  }
  if (
    o.workflow === "replace_empty_slot" &&
    (o.step === "delete" || o.step === "create") &&
    o.deleteClassId
  ) {
    return {
      workflow: "replace_empty_slot",
      step: o.step,
      deleteClassId: String(o.deleteClassId),
      createSlots: normalizeCreateSlots(o.createSlots),
      previewLines,
    }
  }
  return null
}

export async function sendAdminOpsChatMessage(
  input: SendAdminOpsChatInput
): Promise<SendAdminOpsChatResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, message: "尚未設定 Supabase，班務助手無法連線。" }
  }

  const { data, error, response } = await supabase.functions.invoke("admin-ops-assistant", {
    body: {
      action: "chat",
      messages: input.messages.map((m) => ({ role: m.role, content: m.content })),
      opsContext: input.opsContext,
    },
  })

  if (error) {
    const detail = await readFunctionErrorBody(error, response)
    return { ok: false, message: detail ?? mapInvokeError(error, data) }
  }

  if (data && typeof data === "object" && data !== null) {
    const payload = data as {
      reply?: unknown
      error?: unknown
      suggestions?: unknown
      choices?: unknown
      opsContext?: unknown
      pendingExecute?: unknown
    }
    if (typeof payload.error === "string" && payload.error.trim()) {
      return { ok: false, message: payload.error.trim() }
    }
    if (typeof payload.reply === "string" && payload.reply.trim()) {
      return {
        ok: true,
        reply: payload.reply.trim(),
        suggestions: normalizeSuggestions(payload.suggestions),
        choices: normalizeChoices(payload.choices),
        opsContext: normalizeOpsContext(payload.opsContext),
        pendingExecute: normalizePendingExecute(payload.pendingExecute),
      }
    }
  }

  return { ok: false, message: "班務助手回覆格式異常。" }
}
