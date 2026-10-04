import { formatClassLabel } from "@/lib/courseLabel"
import { supabase } from "@/lib/supabaseClient"
import { DEFAULT_ID_CHUNK, forEachIdChunk } from "@/lib/supabaseInChunks"

export const CLASS_LABEL_LOOKUP_SELECT =
 "id, subject, course_code_full, teacher_id, courses ( course_name ), teachers ( full_name )"

export type ClassLabelPatch = {
 class_subject: string
 course_code_full: string | null
 teacher_id: string | null
 teacher_name: string | null
}

export function classLabelPatchFromClassRow(cls: Record<string, unknown>): ClassLabelPatch {
 const course = cls.courses as Record<string, unknown> | null
 const tch = cls.teachers as Record<string, unknown> | null
 const code = cls.course_code_full != null ? String(cls.course_code_full) : null
 const subject = cls.subject != null ? String(cls.subject) : "—"
 const courseName = course?.course_name != null ? String(course.course_name) : null
 return {
  class_subject: formatClassLabel({ subject, courseCode: code, courseName }),
  course_code_full: code,
  teacher_id: cls.teacher_id != null ? String(cls.teacher_id) : null,
  teacher_name: tch?.full_name != null ? String(tch.full_name) : null,
 }
}

/** 以 class_id 直查班別主檔，避免列表 embed 過濾把班名蓋掉。 */
export async function fetchClassLabelPatchesByIds(ids: string[]): Promise<Map<string, ClassLabelPatch>> {
 const byClassId = new Map<string, ClassLabelPatch>()
 if (!supabase) return byClassId
 const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))]
 if (unique.length === 0) return byClassId
 const chunks = await forEachIdChunk(unique, DEFAULT_ID_CHUNK, async (slice) => {
  const { data, error } = await supabase!.from("classes").select(CLASS_LABEL_LOOKUP_SELECT).in("id", slice)
  if (error) throw error
  return data ?? []
 })
 for (const row of chunks.flat()) {
  const r = row as Record<string, unknown>
  byClassId.set(String(r.id), classLabelPatchFromClassRow(r))
 }
 return byClassId
}
