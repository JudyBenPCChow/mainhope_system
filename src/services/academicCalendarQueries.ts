import { assertAcademicYearEditableForDate } from "@/lib/academicYearEditGuard"
import { supabase } from "@/lib/supabaseClient"

export type AcademicCalendarClosure = {
 id: string
 academicYearId: string
 closureDate: string
 name: string
 notes: string | null
}

function mapClosure(row: Record<string, unknown>): AcademicCalendarClosure {
 return {
  id: String(row.id),
  academicYearId: String(row.academic_year_id),
  closureDate: String(row.closure_date ?? "").slice(0, 10),
  name: String(row.name ?? ""),
  notes: row.notes != null ? String(row.notes) : null,
 }
}

export async function fetchAcademicCalendarClosures(
 academicYearId: string
): Promise<AcademicCalendarClosure[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("academic_calendar_closures")
  .select("id, academic_year_id, closure_date, name, notes")
  .eq("academic_year_id", academicYearId)
  .order("closure_date", { ascending: true })
 if (error) throw error
 return (data ?? []).map((row) => mapClosure(row as Record<string, unknown>))
}

export async function fetchAcademicCalendarClosureMap(
 academicYearId: string
): Promise<Map<string, AcademicCalendarClosure>> {
 const rows = await fetchAcademicCalendarClosures(academicYearId)
 return new Map(rows.map((row) => [row.closureDate, row]))
}

export async function saveAcademicCalendarClosure(input: {
 id?: string
 academicYearId: string
 closureDate: string
 name: string
 notes?: string | null
}): Promise<string> {
 if (!supabase) throw new Error("Supabase 未設定")
 const name = input.name.trim()
 if (!input.closureDate) throw new Error("請選擇校舍假期日期")
 if (!name) throw new Error("請輸入校舍假期名稱")
 assertAcademicYearEditableForDate(input.closureDate)
 const payload = {
  academic_year_id: input.academicYearId,
  closure_date: input.closureDate,
  name,
  notes: input.notes?.trim() || null,
  updated_at: new Date().toISOString(),
 }
 if (input.id) {
  const { error } = await supabase
   .from("academic_calendar_closures")
   .update(payload)
   .eq("id", input.id)
  if (error) throw error
  return input.id
 }
 const { data, error } = await supabase
  .from("academic_calendar_closures")
  .upsert(payload, { onConflict: "academic_year_id,closure_date" })
  .select("id")
  .single()
 if (error) throw error
 return String((data as { id: string }).id)
}

export async function importAcademicCalendarClosures(
 academicYearId: string,
 rows: Array<{ closureDate: string; name: string; notes?: string | null }>
): Promise<number> {
 if (!supabase) throw new Error("Supabase 未設定")
 const unique = new Map<string, { closureDate: string; name: string; notes?: string | null }>()
 for (const row of rows) {
  const closureDate = row.closureDate.slice(0, 10)
  const name = row.name.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(closureDate) || !name) continue
  assertAcademicYearEditableForDate(closureDate)
  unique.set(closureDate, { ...row, closureDate, name })
 }
 const values = [...unique.values()]
 if (values.length === 0) throw new Error("找不到有效校曆資料")
 const { error } = await supabase.from("academic_calendar_closures").upsert(
  values.map((row) => ({
   academic_year_id: academicYearId,
   closure_date: row.closureDate,
   name: row.name,
   notes: row.notes?.trim() || null,
   updated_at: new Date().toISOString(),
  })),
  { onConflict: "academic_year_id,closure_date" }
 )
 if (error) throw error
 return values.length
}

export async function deleteAcademicCalendarClosure(id: string, closureDate: string): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 assertAcademicYearEditableForDate(closureDate)
 const { error } = await supabase.from("academic_calendar_closures").delete().eq("id", id)
 if (error) throw error
}
