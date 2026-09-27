export type AdminOpsWorkflow =
  | "idle"
  | "clarify_scope"
  | "delete_empty_class"
  | "change_fixed_slot"
  | "swap_slots"
  | "create_class_schedule"
  | "replace_empty_slot"

export type SlotChangeWriteMode = "update_times" | "regenerate_dates"

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

export type ChangeSlotSlots = {
  class_id?: string
  class_label?: string
  course_code?: string
  new_day_of_week?: string
  new_time_slot?: string
  new_classroom_id?: string
  new_classroom_label?: string
  keep_cancelled_and_makeup?: boolean
}

export type DeleteEmptySlots = {
  class_id?: string
  class_label?: string
  course_code?: string
}

export type SwapSlots = {
  class_a_id?: string
  class_a_label?: string
  class_b_id?: string
  class_b_label?: string
}

export type ReplaceEmptySlots = {
  delete_class_id?: string
  delete_class_label?: string
  create?: CreateClassScheduleSlots
  delete_confirmed?: boolean
}

export type AdminOpsSlots =
  | Record<string, never>
  | DeleteEmptySlots
  | ChangeSlotSlots
  | SwapSlots
  | CreateClassScheduleSlots
  | ReplaceEmptySlots

export type AdminOpsChatContext = {
  workflow: AdminOpsWorkflow
  slots: AdminOpsSlots
}

export const EMPTY_ADMIN_OPS_CONTEXT: AdminOpsChatContext = {
  workflow: "idle",
  slots: {},
}

export type AdminOpsChoice = {
  id: string
  label: string
  payload: string
}

export type AdminOpsPendingExecute =
  | {
      workflow: "delete_empty_class"
      classId: string
      previewLines: string[]
    }
  | {
      workflow: "change_fixed_slot"
      classId: string
      mode: SlotChangeWriteMode
      newDayOfWeek: string
      newTimeSlot: string
      newClassroomId: string | null
      keepCancelledAndMakeup: boolean
      previewLines: string[]
    }
  | {
      workflow: "swap_slots"
      classAId: string
      classBId: string
      previewLines: string[]
    }
  | {
      workflow: "create_class_schedule"
      slots: CreateClassScheduleSlots
      previewLines: string[]
    }
  | {
      workflow: "replace_empty_slot"
      step: "delete" | "create"
      deleteClassId: string
      createSlots: CreateClassScheduleSlots
      previewLines: string[]
    }

export type AdminOpsIntent =
  | "clarify_scope"
  | "delete_empty_class"
  | "change_fixed_slot"
  | "swap_slots"
  | "create_class_schedule"
  | "replace_empty_slot"
  | "cancel"
  | "unknown"
