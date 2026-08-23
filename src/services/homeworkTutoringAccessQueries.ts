import { supabase } from "@/lib/supabaseClient"
import { normalizeTeacherEmploymentStatus } from "@/services/teacherQueries"

export type HomeworkTutoringTeacherAccess = {
  id: string
  name: string
  subjectLabel: string
  enabled: boolean
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
    .select("id, full_name, subject_speciality, status, homework_tutoring_nav")
    .order("full_name", { ascending: true })
  if (error) throw error
  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>
    const employed = normalizeTeacherEmploymentStatus(r.status != null ? String(r.status) : null) === "在職"
    return {
      id: String(r.id),
      name: String(r.full_name ?? ""),
      subjectLabel: subjectLabel(r.subject_speciality),
      enabled: Boolean(r.homework_tutoring_nav),
      employed,
    }
  })
}

export async function getTeacherHomeworkTutoringNav(teacherId: string): Promise<boolean> {
  if (!supabase) return false
  const { data, error } = await supabase
    .from("teachers")
    .select("homework_tutoring_nav")
    .eq("id", teacherId)
    .maybeSingle()
  if (error) throw error
  return Boolean((data as { homework_tutoring_nav?: boolean } | null)?.homework_tutoring_nav)
}

export async function setTeacherHomeworkTutoringNav(
  teacherId: string,
  enabled: boolean
): Promise<void> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { error } = await supabase
    .from("teachers")
    .update({ homework_tutoring_nav: enabled, updated_at: new Date().toISOString() })
    .eq("id", teacherId)
  if (error) throw error
}
