import {
 type AcademicYearPeriodRow,
 type ClassEnrollmentConfig,
} from "@/lib/enrollmentPeriod"
import { supabase } from "@/lib/supabaseClient"
import { DEFAULT_ID_CHUNK, forEachIdChunk } from "@/lib/supabaseInChunks"

const EMPTY_CLASS_CONFIG: ClassEnrollmentConfig = {
 courseMode: "regular",
 academicYearId: null,
 academicYearLabel: null,
}

function mapPeriodRow(row: Record<string, unknown>): AcademicYearPeriodRow {
 return {
  id: String(row.id),
  academicYearId: String(row.academic_year_id),
  periodCode: Number(row.period_code) as 1 | 2,
  label: String(row.label ?? ""),
  startDate: String(row.start_date ?? "").slice(0, 10),
  endDate: String(row.end_date ?? "").slice(0, 10),
 }
}

function mapClassEnrollmentConfigRow(row: Record<string, unknown>): ClassEnrollmentConfig {
 const course = row.courses as Record<string, unknown> | null
 const year = row.academic_years as Record<string, unknown> | null
 const mode = course?.course_mode != null ? String(course.course_mode) : "regular"
 return {
  courseMode: mode === "summer_two_period" ? "summer_two_period" : "regular",
  academicYearId: row.academic_year_id != null ? String(row.academic_year_id) : null,
  academicYearLabel: year?.label != null ? String(year.label) : null,
 }
}

export async function fetchAcademicYearPeriods(
 academicYearId: string
): Promise<AcademicYearPeriodRow[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("academic_year_periods")
  .select("id, academic_year_id, period_code, label, start_date, end_date")
  .eq("academic_year_id", academicYearId)
  .order("period_code", { ascending: true })
 if (error) throw error
 return (data ?? []).map((r) => mapPeriodRow(r as Record<string, unknown>))
}

export async function fetchClassEnrollmentConfig(classId: string): Promise<ClassEnrollmentConfig> {
 if (!supabase) return { ...EMPTY_CLASS_CONFIG }
 const { data, error } = await supabase
  .from("classes")
  .select("academic_year_id, academic_years ( label ), courses ( course_mode )")
  .eq("id", classId)
  .maybeSingle()
 if (error) throw error
 if (!data) return { ...EMPTY_CLASS_CONFIG }
 return mapClassEnrollmentConfigRow(data as Record<string, unknown>)
}

/** 批次讀取班別報讀設定（日視圖 roster 等用；缺列時回傳 regular） */
export async function fetchClassEnrollmentConfigsByIds(
 classIds: string[]
): Promise<Map<string, ClassEnrollmentConfig>> {
 const m = new Map<string, ClassEnrollmentConfig>()
 for (const id of classIds) m.set(id, { ...EMPTY_CLASS_CONFIG })
 if (!supabase || classIds.length === 0) return m

 const chunks = await forEachIdChunk(classIds, DEFAULT_ID_CHUNK, async (slice) => {
  const { data, error } = await supabase!
   .from("classes")
   .select("id, academic_year_id, academic_years ( label ), courses ( course_mode )")
   .in("id", slice)
  if (error) throw error
  return data ?? []
 })
 for (const data of chunks) {
  for (const row of data) {
   const r = row as Record<string, unknown>
   const id = String(r.id ?? "")
   if (!id) continue
   m.set(id, mapClassEnrollmentConfigRow(r))
  }
 }
 return m
}
