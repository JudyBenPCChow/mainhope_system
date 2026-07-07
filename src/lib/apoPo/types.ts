export type CreateClassSlots = {
  academic_year_id?: string
  academic_year_label?: string
  subject_id?: string
  subject_name?: string
  subject_code?: string
  grade_label?: string
  grade_code?: string
  course_id?: string
  course_label?: string
  teacher_id?: string
  teacher_label?: string
  day_of_week?: string
  time_slot?: string
  consecutive_lesson?: boolean
  status?: string
}

export type PoChatContext = {
  workflow: "idle" | "create_class"
  slots: CreateClassSlots
}

export const EMPTY_PO_CONTEXT: PoChatContext = {
  workflow: "idle",
  slots: {},
}

export type PoChoice = {
  id: string
  label: string
  payload: string
}

export type PoPendingExecute = {
  workflow: "create_class"
  slots: CreateClassSlots
  previewLines: string[]
}
