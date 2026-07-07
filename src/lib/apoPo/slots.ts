import type { ClassRecord } from "@/services/classQueries"
import type { CreateClassSlots } from "@/lib/apoPo/types"

/** 將阿Po 對話收集嘅 slots 轉成 insertClass 參數 */
export function poSlotsToInsertPayload(
  slots: CreateClassSlots
): Partial<ClassRecord> & { subject: string } {
  const subject = String(slots.subject_name ?? "").trim()
  if (!subject) throw new Error("缺少科目名稱")
  if (!slots.course_id) throw new Error("缺少課程")
  if (!slots.academic_year_id) throw new Error("缺少學年")

  return {
    subject,
    subject_id: slots.subject_id,
    subject_code: slots.subject_code,
    academic_year_id: slots.academic_year_id,
    academic_year_label: slots.academic_year_label,
    grade_code: slots.grade_label ?? slots.grade_code,
    course_id: slots.course_id,
    teacher_id: slots.teacher_id ? slots.teacher_id : null,
    day_of_week: slots.day_of_week ?? null,
    time_slot: slots.time_slot ?? null,
    lesson_slots_per_session: slots.consecutive_lesson ? 2 : 1,
    status: slots.status ?? "進行中",
  }
}
