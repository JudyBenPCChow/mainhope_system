import { supabase } from "@/lib/supabaseClient"
import type { TableUpdate } from "@/types/db"
import { normalizeTeacherEmploymentStatus } from "@/services/teacherQueries"

export type HomeworkTutoringTeacherAccess = {
  id: string
  name: string
  subjectLabel: string
  enabled: boolean
  /** 純功輔側欄（隱藏專科項目）；僅在 enabled 時有意義 */
  tutorOnly: boolean
  employed: boolean
}

function subjectLabel(speciality: unknown): string {
  if (!Array.isArray(speciality) || speciality.length === 0) return "—"
  return speciality.map((s) => String(s)).join("、")
}

export async function fetchHomeworkTutoringTeacherAccess(): Promise<
  HomeworkTutoringTeacherAccess[]
> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from("teachers")
    .select(
      "id, full_name, subject_speciality, status, homework_tutoring_nav, homework_tutor_only"
    )
    .order("full_name", { ascending: true })
  if (error) throw error
  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>
    const employed =
      normalizeTeacherEmploymentStatus(r.status != null ? String(r.status) : null) === "在職"
    const enabled = Boolean(r.homework_tutoring_nav)
    return {
      id: String(r.id),
      name: String(r.full_name ?? ""),
      subjectLabel: subjectLabel(r.subject_speciality),
      enabled,
      tutorOnly: enabled && Boolean(r.homework_tutor_only),
      employed,
    }
  })
}

export type TeacherHomeworkNavFlagsRow = {
  homeworkTutoringNavVisible: boolean
  homeworkTutorOnly: boolean
}

export async function getTeacherHomeworkNavFlags(
  teacherId: string
): Promise<TeacherHomeworkNavFlagsRow> {
  if (!supabase) {
    return { homeworkTutoringNavVisible: false, homeworkTutorOnly: false }
  }
  const { data, error } = await supabase
    .from("teachers")
    .select("homework_tutoring_nav, homework_tutor_only")
    .eq("id", teacherId)
    .maybeSingle()
  if (error) throw error
  const row = data as {
    homework_tutoring_nav?: boolean
    homework_tutor_only?: boolean
  } | null
  const nav = Boolean(row?.homework_tutoring_nav)
  return {
    homeworkTutoringNavVisible: nav,
    homeworkTutorOnly: nav && Boolean(row?.homework_tutor_only),
  }
}

export async function getTeacherHomeworkTutoringNav(teacherId: string): Promise<boolean> {
  const flags = await getTeacherHomeworkNavFlags(teacherId)
  return flags.homeworkTutoringNavVisible
}

export async function setTeacherHomeworkTutoringNav(
  teacherId: string,
  enabled: boolean
): Promise<void> {
  if (!supabase) throw new Error("Supabase 未設定")
  const patch: Record<string, unknown> = {
    homework_tutoring_nav: enabled,
    updated_at: new Date().toISOString(),
  }
  // 關入口時一併關掉純功輔，避免殘留不一致
  if (!enabled) patch.homework_tutor_only = false
  const { error } = await supabase.from("teachers").update(patch as TableUpdate<"teachers">).eq("id", teacherId)
  if (error) throw error
}

export async function setTeacherHomeworkTutorOnly(
  teacherId: string,
  tutorOnly: boolean
): Promise<void> {
  if (!supabase) throw new Error("Supabase 未設定")
  const patch: Record<string, unknown> = {
    homework_tutor_only: tutorOnly,
    updated_at: new Date().toISOString(),
  }
  // 開純功輔時確保有功輔入口
  if (tutorOnly) patch.homework_tutoring_nav = true
  const { error } = await supabase.from("teachers").update(patch as TableUpdate<"teachers">).eq("id", teacherId)
  if (error) throw error
}
