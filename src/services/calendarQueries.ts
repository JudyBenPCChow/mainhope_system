import { formatMgmtActorLabel, getMgmtRole } from "@/lib/mgmtRole"
import { supabase } from "@/lib/supabaseClient"
import { getTeacherScopeTeacherId } from "@/lib/teacherScope"

export type CalendarEventStatus = "in_progress" | "done"

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
 tags: string[]
 latestUpdatePreview: string | null
 latestUpdateAt: string | null
}

export type CalendarEventUpdateRow = {
 id: string
 eventId: string
 body: string
 createdByLabel: string | null
 createdAt: string
}

export type CalendarTeacherOption = { id: string; label: string; abbr: string | null }
export type CalendarStudentOption = { id: string; label: string }

export type CalendarParticipantOptions = {
 teachers: CalendarTeacherOption[]
 students: CalendarStudentOption[]
}

type RawEvent = Record<string, unknown>

type EventParticipantPatch = {
 teacherIds: string[]
 studentIds: string[]
}

function todoActorLabel(): string {
 if (typeof localStorage === "undefined") return "系統"
 return formatMgmtActorLabel(getMgmtRole())
}

export function normalizeTodoTags(tags: string[]): string[] {
 const seen = new Set<string>()
 const out: string[] = []
 for (const raw of tags) {
  const t = raw.trim()
  if (!t || seen.has(t)) continue
  seen.add(t)
  out.push(t)
 }
 return out
}

function asEvent(row: RawEvent): CalendarEventRow {
 const statusRaw = String(row.status ?? "in_progress")
 const status: CalendarEventStatus = statusRaw === "done" ? "done" : "in_progress"
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
  tags: [],
  latestUpdatePreview: null,
  latestUpdateAt: null,
 }
}

function canEditTodoMetadata(): boolean {
 return getMgmtRole() === "admin" || getMgmtRole() === "alien"
}

async function assertTeacherAssignedForEvent(eventId: string): Promise<void> {
 const teacherId = getTeacherScopeTeacherId()
 if (!teacherId) throw new Error("無法確認老師身分。")
 if (!supabase) throw new Error("Supabase 未設定")
 const { data, error } = await supabase
  .from("calendar_event_teachers")
  .select("teacher_id")
  .eq("event_id", eventId)
  .eq("teacher_id", teacherId)
  .maybeSingle()
 if (error) throw error
 if (!data) throw new Error("您未被指派至此待辦，無法新增跟進。")
}

export async function canAddTodoUpdate(event: Pick<CalendarEventRow, "id" | "teacherIds">): Promise<boolean> {
 const role = getMgmtRole()
 if (role === "admin" || role === "alien") return true
 if (role !== "teacher") return false
 const teacherId = getTeacherScopeTeacherId()
 return Boolean(teacherId && event.teacherIds.includes(teacherId))
}

async function appendParticipantsAndTags(events: CalendarEventRow[]): Promise<CalendarEventRow[]> {
 if (!supabase || events.length === 0) return events
 const ids = events.map((e) => e.id)
 const [tRes, sRes, tagRes, updateRes] = await Promise.all([
  supabase.from("calendar_event_teachers").select("event_id, teacher_id").in("event_id", ids),
  supabase.from("calendar_event_students").select("event_id, student_id").in("event_id", ids),
  supabase.from("calendar_event_tags").select("event_id, tag").in("event_id", ids),
  supabase
   .from("calendar_event_updates")
   .select("event_id, body, created_at")
   .in("event_id", ids)
   .order("created_at", { ascending: false }),
 ])
 if (tRes.error) throw tRes.error
 if (sRes.error) throw sRes.error
 if (tagRes.error) throw tagRes.error
 if (updateRes.error) throw updateRes.error

 const byId = new Map(events.map((e) => [e.id, e]))
 for (const row of tRes.data ?? []) {
  const eid = String((row as { event_id: string }).event_id)
  const tid = String((row as { teacher_id: string }).teacher_id)
  byId.get(eid)?.teacherIds.push(tid)
 }
 for (const row of sRes.data ?? []) {
  const eid = String((row as { event_id: string }).event_id)
  const sid = String((row as { student_id: string }).student_id)
  byId.get(eid)?.studentIds.push(sid)
 }
 for (const row of tagRes.data ?? []) {
  const eid = String((row as { event_id: string }).event_id)
  const tag = String((row as { tag: string }).tag)
  const ev = byId.get(eid)
  if (ev && !ev.tags.includes(tag)) ev.tags.push(tag)
 }
 for (const row of updateRes.data ?? []) {
  const eid = String((row as { event_id: string }).event_id)
  const ev = byId.get(eid)
  if (!ev || ev.latestUpdateAt) continue
  ev.latestUpdatePreview = String((row as { body: string }).body)
  ev.latestUpdateAt = String((row as { created_at: string }).created_at)
 }
 return events
}

export async function fetchCalendarParticipantOptions(
 studentIds?: string[]
): Promise<CalendarParticipantOptions> {
 if (!supabase) return { teachers: [], students: [] }
 const teacherScope = getTeacherScopeTeacherId()
 const tRes = await supabase.from("teachers").select("id, full_name, abbr").order("full_name", { ascending: true })
 if (tRes.error) throw tRes.error

 const teachers = (tRes.data ?? []).map((x) => {
  const r = x as { id: string; full_name: string | null; abbr: string | null }
  const abbrRaw = r.abbr != null ? String(r.abbr).trim() : ""
  return { id: String(r.id), label: String(r.full_name ?? ""), abbr: abbrRaw || null }
 })

 if (teacherScope) {
  if (!studentIds?.length) return { teachers, students: [] }
  const sRes = await supabase
   .from("students")
   .select("id, full_name, student_code")
   .in("id", studentIds)
   .order("full_name", { ascending: true })
  if (sRes.error) throw sRes.error
  return {
   teachers,
   students: (sRes.data ?? []).map((x) => {
    const r = x as { id: string; full_name: string | null; student_code: string | null }
    const name = String(r.full_name ?? "")
    const code = r.student_code != null ? String(r.student_code).trim() : ""
    return { id: String(r.id), label: code ? `${name} (${code})` : name }
   }),
  }
 }

 const sRes = await supabase.from("students").select("id, full_name, student_code").order("full_name", { ascending: true })
 if (sRes.error) throw sRes.error

 return {
  teachers,
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
 opt?: { teacherId?: string | null; status?: CalendarEventStatus | null; tags?: string[] }
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

 if (opt?.tags && opt.tags.length > 0) {
  const normalized = normalizeTodoTags(opt.tags)
  const { data: tagRows, error: tagError } = await supabase
   .from("calendar_event_tags")
   .select("event_id")
   .in("tag", normalized)
  if (tagError) throw tagError
  const tagEventIds = [...new Set((tagRows ?? []).map((r) => String((r as { event_id: string }).event_id)))]
  if (tagEventIds.length === 0) return []
  eventIdFilter = eventIdFilter
   ? eventIdFilter.filter((id) => tagEventIds.includes(id))
   : tagEventIds
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
 if (opt?.status) q = q.eq("status", opt.status)
 if (getMgmtRole() === "teacher") q = q.or("visibility.eq.teachers,visibility.eq.private")

 const { data, error } = await q
 if (error) throw error
 const events = (data ?? []).map((r) => asEvent(r as RawEvent))
 return appendParticipantsAndTags(events)
}

export async function getCalendarEventById(id: string): Promise<CalendarEventRow | null> {
 if (!supabase) return null
 const { data, error } = await supabase
  .from("calendar_events")
  .select("id, title, description, category, event_date, start_time, end_time, all_day, status, visibility, created_by, created_at, updated_at")
  .eq("id", id)
  .maybeSingle()
 if (error) throw error
 if (!data) return null
 const [event] = await appendParticipantsAndTags([asEvent(data as RawEvent)])
 return event
}

export async function listCalendarEventsForStudent(
 studentId: string,
 opt?: { status?: CalendarEventStatus; limit?: number }
): Promise<CalendarEventRow[]> {
 if (!supabase) return []
 const { data: rel, error: relErr } = await supabase
  .from("calendar_event_students")
  .select("event_id")
  .eq("student_id", studentId)
 if (relErr) throw relErr
 const ids = (rel ?? []).map((r) => String((r as { event_id: string }).event_id))
 if (ids.length === 0) return []

 let q = supabase
  .from("calendar_events")
  .select("id, title, description, category, event_date, start_time, end_time, all_day, status, visibility, created_by, created_at, updated_at")
  .in("id", ids)
  .order("event_date", { ascending: false })
  .order("updated_at", { ascending: false })

 if (opt?.status) q = q.eq("status", opt.status)
 if (opt?.limit) q = q.limit(opt.limit)

 const { data, error } = await q
 if (error) throw error
 const events = (data ?? []).map((r) => asEvent(r as RawEvent))
 return appendParticipantsAndTags(events)
}

export async function listCalendarEventUpdates(eventId: string): Promise<CalendarEventUpdateRow[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("calendar_event_updates")
  .select("id, event_id, body, created_by_label, created_at")
  .eq("event_id", eventId)
  .order("created_at", { ascending: false })
 if (error) throw error
 return (data ?? []).map((row) => {
  const r = row as {
   id: string
   event_id: string
   body: string
   created_by_label: string | null
   created_at: string
  }
  return {
   id: String(r.id),
   eventId: String(r.event_id),
   body: String(r.body),
   createdByLabel: r.created_by_label != null ? String(r.created_by_label) : null,
   createdAt: String(r.created_at),
  }
 })
}

async function replaceParticipants(eventId: string, patch: EventParticipantPatch): Promise<void> {
 if (!supabase) return
 const [d1, d3] = await Promise.all([
  supabase.from("calendar_event_teachers").delete().eq("event_id", eventId),
  supabase.from("calendar_event_students").delete().eq("event_id", eventId),
 ])
 if (d1.error) throw d1.error
 if (d3.error) throw d3.error

 if (patch.teacherIds.length > 0) {
  const { error } = await supabase
   .from("calendar_event_teachers")
   .insert(patch.teacherIds.map((teacherId) => ({ event_id: eventId, teacher_id: teacherId })))
  if (error) throw error
 }
 if (patch.studentIds.length > 0) {
  const { error } = await supabase
   .from("calendar_event_students")
   .insert(patch.studentIds.map((studentId) => ({ event_id: eventId, student_id: studentId })))
  if (error) throw error
 }
}

export async function replaceCalendarEventTags(eventId: string, tags: string[]): Promise<void> {
 if (!supabase) return
 if (!canEditTodoMetadata()) throw new Error("專班老師僅可檢視待辦事項。")
 const normalized = normalizeTodoTags(tags)
 const { error: delErr } = await supabase.from("calendar_event_tags").delete().eq("event_id", eventId)
 if (delErr) throw delErr
 if (normalized.length === 0) return
 const { error } = await supabase
  .from("calendar_event_tags")
  .insert(normalized.map((tag) => ({ event_id: eventId, tag })))
 if (error) throw error
}

export async function insertCalendarEvent(input: {
 title: string
 category?: string
 eventDate: string
 startTime?: string | null
 endTime?: string | null
 allDay?: boolean
 status?: CalendarEventStatus
 visibility?: "private" | "teachers"
 teacherIds?: string[]
 studentIds?: string[]
 tags?: string[]
 createdBy?: string | null
}): Promise<CalendarEventRow> {
 if (!supabase) throw new Error("Supabase 未設定")
 if (!canEditTodoMetadata()) throw new Error("專班老師僅可檢視待辦事項。")
 const { data, error } = await supabase
  .from("calendar_events")
  .insert({
   title: input.title.trim(),
   description: null,
   category: input.category?.trim() || "一般",
   event_date: input.eventDate,
   start_time: input.startTime?.trim() || null,
   end_time: input.endTime?.trim() || null,
   all_day: Boolean(input.allDay),
   status: input.status ?? "in_progress",
   visibility: input.visibility ?? "private",
   created_by: input.createdBy ?? null,
  })
  .select("id, title, description, category, event_date, start_time, end_time, all_day, status, visibility, created_by, created_at, updated_at")
  .single()
 if (error) throw error
 const row = asEvent(data as RawEvent)
 await replaceParticipants(row.id, {
  teacherIds: input.teacherIds ?? [],
  studentIds: input.studentIds ?? [],
 })
 if (input.tags && input.tags.length > 0) {
  await replaceCalendarEventTags(row.id, input.tags)
 }
 const [withMeta] = await appendParticipantsAndTags([row])
 return withMeta
}

export async function updateCalendarEvent(
 id: string,
 patch: {
  title?: string
  category?: string
  eventDate?: string
  startTime?: string | null
  endTime?: string | null
  allDay?: boolean
  status?: CalendarEventStatus
  visibility?: "private" | "teachers"
  teacherIds?: string[]
  studentIds?: string[]
  tags?: string[]
 }
): Promise<CalendarEventRow> {
 if (!supabase) throw new Error("Supabase 未設定")
 if (!canEditTodoMetadata()) throw new Error("專班老師僅可檢視待辦事項。")
 const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
 if (patch.title !== undefined) payload.title = patch.title.trim()
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

 if (patch.teacherIds || patch.studentIds) {
  await replaceParticipants(id, {
   teacherIds: patch.teacherIds ?? [],
   studentIds: patch.studentIds ?? [],
  })
 }
 if (patch.tags) {
  await replaceCalendarEventTags(id, patch.tags)
 }
 const [withMeta] = await appendParticipantsAndTags([asEvent(data as RawEvent)])
 return withMeta
}

export async function insertCalendarEventUpdate(eventId: string, body: string): Promise<CalendarEventUpdateRow> {
 if (!supabase) throw new Error("Supabase 未設定")
 const trimmed = body.trim()
 if (!trimmed) throw new Error("請輸入跟進內容。")

 const role = getMgmtRole()
 if (role === "teacher") {
  await assertTeacherAssignedForEvent(eventId)
 } else if (!canEditTodoMetadata()) {
  throw new Error("無權限新增跟進。")
 }

 const { data, error } = await supabase
  .from("calendar_event_updates")
  .insert({
   event_id: eventId,
   body: trimmed,
   created_by_label: todoActorLabel(),
  })
  .select("id, event_id, body, created_by_label, created_at")
  .single()
 if (error) throw error

 await supabase.from("calendar_events").update({ updated_at: new Date().toISOString() }).eq("id", eventId)

 const r = data as {
  id: string
  event_id: string
  body: string
  created_by_label: string | null
  created_at: string
 }
 return {
  id: String(r.id),
  eventId: String(r.event_id),
  body: String(r.body),
  createdByLabel: r.created_by_label != null ? String(r.created_by_label) : null,
  createdAt: String(r.created_at),
 }
}

export async function deleteCalendarEvent(id: string): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 if (!canEditTodoMetadata()) throw new Error("專班老師僅可檢視待辦事項。")
 const { error } = await supabase.from("calendar_events").delete().eq("id", id)
 if (error) throw error
}
