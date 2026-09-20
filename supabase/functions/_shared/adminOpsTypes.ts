export type AdminOpsWorkflow =
  | "idle"
  | "clarify_scope"
  | "delete_empty_class"
  | "change_fixed_slot"
  | "swap_slots"
  | "create_class_schedule"
  | "replace_empty_slot"

export type SlotChangeWriteMode = "update_times" | "regenerate_dates"

export type AdminOpsChoice = {
  id: string
  label: string
  payload: string
}

export type CreateClassScheduleSlots = {
  academic_year_id?: string
  academic_year_label?: string
  subject_id?: string
  subject_name?: string
  course_id?: string
  course_label?: string
  grade_label?: string
  grade_code?: string
  teacher_id?: string
  teacher_label?: string
  classroom_id?: string
  classroom_label?: string
  day_of_week?: string
  time_slot?: string
  consecutive_lesson?: boolean
  first_lesson_date?: string
  enroll_student_id?: string
  enroll_student_label?: string
  inherit_from_class_id?: string
}

export type AdminOpsSlots = Record<string, unknown>

export type AdminOpsChatContext = {
  workflow: AdminOpsWorkflow
  slots: AdminOpsSlots
}

export const EMPTY_ADMIN_OPS_CONTEXT: AdminOpsChatContext = {
  workflow: "idle",
  slots: {},
}

export type AdminOpsPendingExecute = {
  workflow: AdminOpsWorkflow
  previewLines: string[]
  classId?: string
  mode?: SlotChangeWriteMode
  newDayOfWeek?: string
  newTimeSlot?: string
  newClassroomId?: string | null
  keepCancelledAndMakeup?: boolean
  classAId?: string
  classBId?: string
  slots?: CreateClassScheduleSlots
  step?: "delete" | "create"
  deleteClassId?: string
  createSlots?: CreateClassScheduleSlots
}

export type AdminOpsChatResult = {
  reply: string
  suggestions: string[]
  choices: AdminOpsChoice[]
  opsContext: AdminOpsChatContext
  pendingExecute: AdminOpsPendingExecute | null
}

export const CHOICE_PREFIX = "__admin_ops_choice__"

export function buildChoicePayload(field: string, value: string, label?: string): string {
  const core = `${CHOICE_PREFIX}${field}__${value}`
  return label ? `${core}__label__${label}` : core
}

export function parseChoice(text: string): { field: string; value: string; label?: string } | null {
  const t = text.trim()
  if (!t.startsWith(CHOICE_PREFIX)) return null
  const rest = t.slice(CHOICE_PREFIX.length)
  const labelIdx = rest.indexOf("__label__")
  const core = labelIdx >= 0 ? rest.slice(0, labelIdx) : rest
  const label = labelIdx >= 0 ? rest.slice(labelIdx + "__label__".length) : undefined
  const sep = core.indexOf("__")
  if (sep <= 0) return null
  const field = core.slice(0, sep)
  const value = core.slice(sep + 2)
  if (!field || !value) return null
  return { field, value, label }
}
