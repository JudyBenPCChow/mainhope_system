import { formatUnknownError } from "@/lib/formatUnknownError"
import { assertAcademicYearEditable, assertAcademicYearEditableForDate } from "@/lib/academicYearEditGuard"
import { supabase } from "@/lib/supabaseClient"
import { weekdayLabelFromYmd } from "@/lib/weekdayUtils"
import { timeSlotSelectValueFromStored } from "@/components/classes/classesUi"
import { KANBAN_DAY_COLUMNS } from "@/components/classes/classesUi"
import {
 LESSON_SLOT_INDICES,
 lessonSlotLabel,
} from "@/lib/lessonSlots"

function timeSlotsEqual(a: string, b: string): boolean {
 return a === b || a.replace(/\u2013/g, "-") === b.replace(/\u2013/g, "-")
}

/** 寫入 DB 前統一為標準時段標籤（en-dash） */
export function canonicalAvailabilityTimeSlot(raw: string): string {
 const t = raw.trim()
 const fromOptions = timeSlotSelectValueFromStored(t)
 if (fromOptions) return fromOptions
 const idx = LESSON_SLOT_INDICES.find((i) => timeSlotsEqual(lessonSlotLabel(i), t))
 if (idx != null) return lessonSlotLabel(idx)
 return t
}

export function slotIndexForStoredTimeSlot(time_slot: string): number {
 const c = canonicalAvailabilityTimeSlot(time_slot)
 return LESSON_SLOT_INDICES.findIndex((i) => lessonSlotLabel(i) === c)
}

export type TeacherAvailabilitySlot = {
 id: string
 teacher_id: string
 teacher_name: string | null
 teacher_abbr: string | null
 academic_year_id: string
 academic_year_label: string | null
 available_date: string
 time_slot: string
 notes: string | null
 status: string
 assigned_class_id: string | null
}

export type AvailabilityPatternCell = {
 day_of_week: string
 time_slot: string
 dates: string[]
 count: number
}

export type AcademicYearRange = {
 id: string
 label: string
 start_date: string
 end_date: string
 is_current: boolean
}

function mapSlot(row: Record<string, unknown>): TeacherAvailabilitySlot {
 const t = row.teachers as Record<string, unknown> | null
 const y = row.academic_years as Record<string, unknown> | null
 return {
  id: String(row.id),
  teacher_id: String(row.teacher_id),
  teacher_name: t?.full_name != null ? String(t.full_name) : null,
  teacher_abbr: t?.abbr != null ? String(t.abbr) : null,
  academic_year_id: String(row.academic_year_id),
  academic_year_label: y?.label != null ? String(y.label) : null,
  available_date: String(row.available_date ?? "").slice(0, 10),
  time_slot: canonicalAvailabilityTimeSlot(String(row.time_slot ?? "")),
  notes: row.notes != null ? String(row.notes) : null,
  status: String(row.status ?? "可分配"),
  assigned_class_id: row.assigned_class_id != null ? String(row.assigned_class_id) : null,
 }
}

export async function fetchAcademicYearsWithDates(): Promise<AcademicYearRange[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("academic_years")
  .select("id, label, start_date, end_date, is_current")
  .order("start_date", { ascending: false })
 if (error) throw new Error(formatUnknownError(error))
 return (data ?? []).map((r) => {
  const row = r as Record<string, unknown>
  return {
   id: String(row.id),
   label: String(row.label ?? ""),
   start_date: String(row.start_date ?? ""),
   end_date: String(row.end_date ?? ""),
   is_current: Boolean(row.is_current),
  }
 })
}

export async function fetchAvailabilityInRange(
 fromYmd: string,
 toYmd: string,
 filters?: { academicYearId?: string; teacherId?: string; status?: string }
): Promise<TeacherAvailabilitySlot[]> {
 if (!supabase) return []
 let q = supabase
  .from("teacher_availability_slots")
  .select(
   "*, teachers ( id, full_name, abbr ), academic_years ( id, label )"
  )
  .gte("available_date", fromYmd)
  .lte("available_date", toYmd)
  .order("available_date", { ascending: true })
  .order("time_slot", { ascending: true })
 if (filters?.academicYearId) q = q.eq("academic_year_id", filters.academicYearId)
 if (filters?.teacherId) q = q.eq("teacher_id", filters.teacherId)
 if (filters?.status) q = q.eq("status", filters.status)
 const { data, error } = await q
 if (error) throw new Error(formatUnknownError(error))
 return (data ?? []).map((r) => mapSlot(r as Record<string, unknown>))
}

export async function fetchAvailabilityPatternSummary(
 teacherId: string,
 academicYearId: string
): Promise<AvailabilityPatternCell[]> {
 const years = await fetchAcademicYearsWithDates()
 const year = years.find((y) => y.id === academicYearId)
 if (!year) return []
 const slots = await fetchAvailabilityInRange(year.start_date, year.end_date, {
  academicYearId,
  teacherId,
 })
 const map = new Map<string, string[]>()
 for (const s of slots) {
  const dow = weekdayLabelFromYmd(s.available_date)
  if (!dow) continue
  const key = `${dow}\t${s.time_slot}`
  const list = map.get(key) ?? []
  list.push(s.available_date)
  map.set(key, list)
 }
 const out: AvailabilityPatternCell[] = []
 for (const [key, dates] of map) {
  const [day_of_week, time_slot] = key.split("\t")
  out.push({
   day_of_week: day_of_week!,
   time_slot: time_slot!,
   dates: dates.sort(),
   count: dates.length,
  })
 }
 out.sort((a, b) => {
  const di = KANBAN_DAY_COLUMNS.indexOf(a.day_of_week as (typeof KANBAN_DAY_COLUMNS)[number])
  const dj = KANBAN_DAY_COLUMNS.indexOf(b.day_of_week as (typeof KANBAN_DAY_COLUMNS)[number])
  if (di !== dj) return di - dj
  return a.time_slot.localeCompare(b.time_slot)
 })
 return out
}

async function fetchSlotsForTeacherOnDate(teacherId: string, dateYmd: string): Promise<TeacherAvailabilitySlot[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("teacher_availability_slots")
  .select("*, teachers ( id, full_name, abbr ), academic_years ( id, label )")
  .eq("teacher_id", teacherId)
  .eq("available_date", dateYmd.slice(0, 10))
 if (error) throw new Error(formatUnknownError(error))
 return (data ?? []).map((r) => mapSlot(r as Record<string, unknown>))
}

export async function insertAvailabilitySlot(opts: {
 teacher_id: string
 academic_year_id: string
 available_date: string
 time_slot: string
 notes?: string | null
}): Promise<TeacherAvailabilitySlot> {
 if (!supabase) throw new Error("Supabase 未設定")
 const years = await fetchAcademicYearsWithDates()
 const year = years.find((y) => y.id === opts.academic_year_id)
 if (!year) throw new Error("找不到學年")
 assertAcademicYearEditable(year.label, year.end_date)
 const dateYmd = opts.available_date.slice(0, 10)
 const timeSlot = canonicalAvailabilityTimeSlot(opts.time_slot)

 const existingOnDate = await fetchSlotsForTeacherOnDate(opts.teacher_id, dateYmd)
 const duplicate = existingOnDate.find((s) => timeSlotsEqual(s.time_slot, timeSlot))
 if (duplicate) {
  if (duplicate.status === "已分配") {
   throw new Error("此日期與時段已登記，且已分配予班別。")
  }
  return duplicate
 }

 const { data, error } = await supabase
  .from("teacher_availability_slots")
  .insert({
   teacher_id: opts.teacher_id,
   academic_year_id: opts.academic_year_id,
   available_date: dateYmd,
   time_slot: timeSlot,
   notes: opts.notes ?? null,
   status: "可分配",
  })
  .select("*, teachers ( id, full_name, abbr ), academic_years ( id, label )")
  .single()
 if (error) {
  const msg = formatUnknownError(error)
  if (/duplicate key|unique constraint/i.test(msg)) {
   throw new Error("此日期與時段已登記，請刷新頁面查看。")
  }
  throw new Error(msg)
 }
 return mapSlot(data as Record<string, unknown>)
}

export async function updateAvailabilitySlot(
 id: string,
 patch: { notes?: string | null; status?: string }
): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { error } = await supabase
  .from("teacher_availability_slots")
  .update({ ...patch, updated_at: new Date().toISOString() })
  .eq("id", id)
 if (error) throw new Error(formatUnknownError(error))
}

export async function deleteAvailabilitySlot(id: string): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { data, error: fetchErr } = await supabase
  .from("teacher_availability_slots")
  .select("status, available_date, academic_years ( label, end_date )")
  .eq("id", id)
  .single()
 if (fetchErr) throw new Error(formatUnknownError(fetchErr))
 const row = data as {
  status: string
  available_date?: string
  academic_years?: { label?: string; end_date?: string } | null
 }
 if (row.status === "已分配") {
  throw new Error("已分配的檔期不可刪除；請先取消相關班別。")
 }
 const ay = row.academic_years
 if (ay?.label) {
  assertAcademicYearEditable(ay.label, ay.end_date ?? null)
 } else {
  assertAcademicYearEditableForDate(row.available_date ?? "")
 }
 const { error } = await supabase.from("teacher_availability_slots").delete().eq("id", id)
 if (error) throw new Error(formatUnknownError(error))
}

export async function datesWithAvailability(params: {
 teacherId: string
 academicYearId: string
 dayOfWeek: string | string[]
 timeSlot: string
}): Promise<string[]> {
 const years = await fetchAcademicYearsWithDates()
 const year = years.find((y) => y.id === params.academicYearId)
 if (!year) return []
 const daySet = new Set(
  (Array.isArray(params.dayOfWeek) ? params.dayOfWeek : [params.dayOfWeek])
   .map((d) => d.trim())
   .filter(Boolean)
 )
 if (daySet.size === 0) return []
 const timeSlot = canonicalAvailabilityTimeSlot(params.timeSlot)
 const slots = await fetchAvailabilityInRange(year.start_date, year.end_date, {
  academicYearId: params.academicYearId,
  teacherId: params.teacherId,
  status: "可分配",
 })
 return slots
  .filter(
   (s) => {
    const dow = weekdayLabelFromYmd(s.available_date)
    return dow != null && daySet.has(dow) && timeSlotsEqual(s.time_slot, timeSlot)
   }
  )
  .map((s) => s.available_date)
  .sort()
}

/** 多個時段皆「可分配」的日期（交集） */
export async function datesWithAllAvailabilitySlots(params: {
 teacherId: string
 academicYearId: string
 dayOfWeek: string | string[]
 timeSlots: string[]
}): Promise<string[]> {
 if (params.timeSlots.length === 0) return []
 let result: string[] | null = null
 for (const timeSlot of params.timeSlots) {
  const dates = await datesWithAvailability({
   teacherId: params.teacherId,
   academicYearId: params.academicYearId,
   dayOfWeek: params.dayOfWeek,
   timeSlot,
  })
  if (result == null) {
   result = dates
  } else {
   const set = new Set(dates)
   result = result.filter((d) => set.has(d))
  }
 }
 return result ?? []
}

export async function markAvailabilityForScheduleDates(params: {
 classId: string
 teacherId: string
 timeSlot: string
 dates: string[]
}): Promise<void> {
 if (!supabase || params.dates.length === 0) return
 const timeSlot = canonicalAvailabilityTimeSlot(params.timeSlot)
 const now = new Date().toISOString()
 for (const ymd of params.dates) {
  const onDate = await fetchSlotsForTeacherOnDate(params.teacherId, ymd)
  const slot = onDate.find(
   (s) => timeSlotsEqual(s.time_slot, timeSlot) && s.status === "可分配"
  )
  if (!slot) continue
  const { error } = await supabase
   .from("teacher_availability_slots")
   .update({
    status: "已分配",
    assigned_class_id: params.classId,
    updated_at: now,
   })
   .eq("id", slot.id)
  if (error) throw new Error(formatUnknownError(error))
 }
}

export async function releaseAvailabilityForClass(classId: string): Promise<void> {
 if (!supabase) return
 const { error } = await supabase
  .from("teacher_availability_slots")
  .update({
   status: "可分配",
   assigned_class_id: null,
   updated_at: new Date().toISOString(),
  })
  .eq("assigned_class_id", classId)
 if (error) throw new Error(formatUnknownError(error))
}

export async function isAvailabilitySlotFree(params: {
 teacherId: string
 availableDate: string
 timeSlot: string
}): Promise<boolean> {
 if (!supabase) return false
 const onDate = await fetchSlotsForTeacherOnDate(params.teacherId, params.availableDate)
 const slot = onDate.find((s) => timeSlotsEqual(s.time_slot, params.timeSlot))
 if (!slot) return true
 return slot.status === "可分配"
}

export { timeSlotsEqual, slotIndexForStoredTimeSlot as slotIndexForTimeSlot }
