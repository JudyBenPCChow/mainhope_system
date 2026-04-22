import { getMgmtRole } from "@/lib/mgmtRole"
import { supabase } from "@/lib/supabaseClient"

export type CalendarEventStatus = "todo" | "in_progress" | "done" | "cancelled"

export type CalendarEventRow = {
 id: string
 title: string
 description: string | null
 category: string
 eventDate: string
 startTime: string | null
 endTime: string | null
 allDay: boolean
 status: CalendarEventStatus
 visibility: "private" | "teachers"
 createdBy: string | null
 createdAt: string
 updatedAt: string
 teacherIds: string[]
 userIds: string[]
 studentIds: string[]
}

export type CalendarTeacherOption = { id: string; label: string; abbr: string | null }
export type CalendarUserOption = { id: string; label: string }
export type CalendarStudentOption = { id: string; label: string }

export type CalendarParticipantOptions = {
 teachers: CalendarTeacherOption[]
 users: CalendarUserOption[]
 students: CalendarStudentOption[]
}

type RawEvent = Record<string, unknown>

type EventParticipantPatch = {
 teacherIds: string[]
 userIds: string[]
 studentIds: string[]
}

function asEvent(row: RawEvent): CalendarEventRow {
 const statusRaw = String(row.status ?? "todo")
 const status: CalendarEventStatus =
  statusRaw === "in_progress" || statusRaw === "done" || statusRaw === "cancelled"
   ? statusRaw
   : "todo"
 const visibility = String(row.visibility ?? "private") === "teachers" ? "teachers" : "private"
 return {
  id: String(row.id ?? ""),
  title: String(row.title ?? ""),
  description: row.description != null ? String(row.description) : null,
  category: String(row.category ?? "一般"),
  eventDate: String(row.event_date ?? "").slice(0, 10),
  startTime: row.start_time != null ? String(row.start_time) : null,
  endTime: row.end_time != null ? String(row.end_time) : null,
  allDay: Boolean(row.all_day),
  status,
  visibility,
  createdBy: row.created_by != null ? String(row.created_by) : null,
  createdAt: String(row.created_at ?? ""),
  updatedAt: String(row.updated_at ?? ""),
  teacherIds: [],
  userIds: [],
  studentIds: [],
 }
}

async function appendParticipants(events: CalendarEventRow[]): Promise<CalendarEventRow[]> {
 if (!supabase || events.length === 0) return events
 const ids = events.map((e) => e.id)
 const [tRes, uRes, sRes] = await Promise.all([
  supabase.from("calendar_event_teachers").select("event_id, teacher_id").in("event_id", ids),
  supabase.from("calendar_event_users").select("event_id, user_id").in("event_id", ids),
  supabase.from("calendar_event_students").select("event_id, student_id").in("event_id", ids),
 ])
 if (tRes.error) throw tRes.error
 if (uRes.error) throw uRes.error
 if (sRes.error) throw sRes.error

 const byId = new Map(events.map((e) => [e.id, e]))
 for (const row of tRes.data ?? []) {
  const eid = String((row as { event_id: string }).event_id)
  const tid = String((row as { teacher_id: string }).teacher_id)
  byId.get(eid)?.teacherIds.push(tid)
 }
 for (const row of uRes.data ?? []) {
  const eid = String((row as { event_id: string }).event_id)
  const uid = String((row as { user_id: string }).user_id)
  byId.get(eid)?.userIds.push(uid)
 }
 for (const row of sRes.data ?? []) {
  const eid = String((row as { event_id: string }).event_id)
  const sid = String((row as { student_id: string }).student_id)
  byId.get(eid)?.studentIds.push(sid)
 }
 return events
}

export async function fetchCalendarParticipantOptions(): Promise<CalendarParticipantOptions> {
 if (!supabase) return { teachers: [], users: [], students: [] }
 const [tRes, uRes, sRes] = await Promise.all([
  supabase.from("teachers").select("id, full_name, abbr").order("full_name", { ascending: true }),
  supabase.from("app_users").select("id, display_name, email").order("display_name", { ascending: true }),
  supabase.from("students").select("id, full_name, student_code").order("full_name", { ascending: true }),
 ])
 if (tRes.error) throw tRes.error
 if (uRes.error) throw uRes.error
 if (sRes.error) throw sRes.error

 return {
  teachers: (tRes.data ?? []).map((x) => {
   const r = x as { id: string; full_name: string | null; abbr: string | null }
   const abbrRaw = r.abbr != null ? String(r.abbr).trim() : ""
   return { id: String(r.id), label: String(r.full_name ?? ""), abbr: abbrRaw || null }
  }),
  users: (uRes.data ?? []).map((x) => {
   const r = x as { id: string; display_name: string | null; email: string | null }
   return {
    id: String(r.id),
    label: (r.display_name && String(r.display_name).trim()) || (r.email && String(r.email).trim()) || String(r.id),
   }
  }),
  students: (sRes.data ?? []).map((x) => {
   const r = x as { id: string; full_name: string | null; student_code: string | null }
   const name = String(r.full_name ?? "")
   const code = r.student_code != null ? String(r.student_code).trim() : ""
   return { id: String(r.id), label: code ? `${name} (${code})` : name }
  }),
 }
}

export async function listCalendarEventsInRange(
 fromDate: string,
 toDate: string,
 opt?: { teacherId?: string | null }
): Promise<CalendarEventRow[]> {
 if (!supabase) return []
 let eventIdFilter: string[] | null = null
 if (opt?.teacherId) {
  const { data: relRows, error: relError } = await supabase
   .from("calendar_event_teachers")
   .select("event_id")
   .eq("teacher_id", opt.teacherId)
  if (relError) throw relError
  eventIdFilter = (relRows ?? []).map((r) => String((r as { event_id: string }).event_id))
  if (eventIdFilter.length === 0) return []
 }

 let q = supabase
  .from("calendar_events")
  .select("id, title, description, category, event_date, start_time, end_time, all_day, status, visibility, created_by, created_at, updated_at")
  .gte("event_date", fromDate)
  .lte("event_date", toDate)
  .order("event_date", { ascending: true })
  .order("all_day", { ascending: false })
  .order("start_time", { ascending: true })
  .order("created_at", { ascending: true })

 if (eventIdFilter) q = q.in("id", eventIdFilter)
 if (getMgmtRole() === "teacher") q = q.or("visibility.eq.teachers,visibility.eq.private")

 const { data, error } = await q
 if (error) throw error
 const events = (data ?? []).map((r) => asEvent(r as RawEvent))
 return appendParticipants(events)
}

async function replaceParticipants(eventId: string, patch: EventParticipantPatch): Promise<void> {
 if (!supabase) return
 const [d1, d2, d3] = await Promise.all([
  supabase.from("calendar_event_teachers").delete().eq("event_id", eventId),
  supabase.from("calendar_event_users").delete().eq("event_id", eventId),
  supabase.from("calendar_event_students").delete().eq("event_id", eventId),
 ])
 if (d1.error) throw d1.error
 if (d2.error) throw d2.error
 if (d3.error) throw d3.error

 if (patch.teacherIds.length > 0) {
  const { error } = await supabase
   .from("calendar_event_teachers")
   .insert(patch.teacherIds.map((teacherId) => ({ event_id: eventId, teacher_id: teacherId })))
  if (error) throw error
 }
 if (patch.userIds.length > 0) {
  const { error } = await supabase
   .from("calendar_event_users")
   .insert(patch.userIds.map((userId) => ({ event_id: eventId, user_id: userId })))
  if (error) throw error
 }
 if (patch.studentIds.length > 0) {
  const { error } = await supabase
   .from("calendar_event_students")
   .insert(patch.studentIds.map((studentId) => ({ event_id: eventId, student_id: studentId })))
  if (error) throw error
 }
}

export async function insertCalendarEvent(input: {
 title: string
 description?: string | null
 category?: string
 eventDate: string
 startTime?: string | null
 endTime?: string | null
 allDay?: boolean
 status?: CalendarEventStatus
 visibility?: "private" | "teachers"
 teacherIds?: string[]
 userIds?: string[]
 studentIds?: string[]
 createdBy?: string | null
}): Promise<CalendarEventRow> {
 if (!supabase) throw new Error("Supabase 未設定")
 if (getMgmtRole() === "teacher") throw new Error("專班老師僅可檢視待辦事項。")
 const { data, error } = await supabase
  .from("calendar_events")
  .insert({
   title: input.title.trim(),
   description: input.description?.trim() || null,
   category: input.category?.trim() || "一般",
   event_date: input.eventDate,
   start_time: input.startTime?.trim() || null,
   end_time: input.endTime?.trim() || null,
   all_day: Boolean(input.allDay),
   status: input.status ?? "todo",
   visibility: input.visibility ?? "private",
   created_by: input.createdBy ?? null,
  })
  .select("id, title, description, category, event_date, start_time, end_time, all_day, status, visibility, created_by, created_at, updated_at")
  .single()
 if (error) throw error
 const row = asEvent(data as RawEvent)
 await replaceParticipants(row.id, {
  teacherIds: input.teacherIds ?? [],
  userIds: input.userIds ?? [],
  studentIds: input.studentIds ?? [],
 })
 const [withParticipants] = await appendParticipants([row])
 return withParticipants
}

export async function updateCalendarEvent(
 id: string,
 patch: {
  title?: string
  description?: string | null
  category?: string
  eventDate?: string
  startTime?: string | null
  endTime?: string | null
  allDay?: boolean
  status?: CalendarEventStatus
  visibility?: "private" | "teachers"
  teacherIds?: string[]
  userIds?: string[]
  studentIds?: string[]
 }
): Promise<CalendarEventRow> {
 if (!supabase) throw new Error("Supabase 未設定")
 if (getMgmtRole() === "teacher") throw new Error("專班老師僅可檢視待辦事項。")
 const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
 if (patch.title !== undefined) payload.title = patch.title.trim()
 if (patch.description !== undefined) payload.description = patch.description?.trim() || null
 if (patch.category !== undefined) payload.category = patch.category.trim() || "一般"
 if (patch.eventDate !== undefined) payload.event_date = patch.eventDate
 if (patch.startTime !== undefined) payload.start_time = patch.startTime?.trim() || null
 if (patch.endTime !== undefined) payload.end_time = patch.endTime?.trim() || null
 if (patch.allDay !== undefined) payload.all_day = Boolean(patch.allDay)
 if (patch.status !== undefined) payload.status = patch.status
 if (patch.visibility !== undefined) payload.visibility = patch.visibility

 const { data, error } = await supabase
  .from("calendar_events")
  .update(payload)
  .eq("id", id)
  .select("id, title, description, category, event_date, start_time, end_time, all_day, status, visibility, created_by, created_at, updated_at")
  .single()
 if (error) throw error

 if (patch.teacherIds || patch.userIds || patch.studentIds) {
  await replaceParticipants(id, {
   teacherIds: patch.teacherIds ?? [],
   userIds: patch.userIds ?? [],
   studentIds: patch.studentIds ?? [],
  })
 }
 const [withParticipants] = await appendParticipants([asEvent(data as RawEvent)])
 return withParticipants
}

export async function deleteCalendarEvent(id: string): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 if (getMgmtRole() === "teacher") throw new Error("專班老師僅可檢視待辦事項。")
 const { error } = await supabase.from("calendar_events").delete().eq("id", id)
 if (error) throw error
}
