import { formatClassLabel } from "@/lib/courseLabel"
import { getMgmtRole, resolveMgmtDisplayName } from "@/lib/mgmtRole"
import { supabase } from "@/lib/supabaseClient"
import { getTeacherScopeTeacherId } from "@/lib/teacherScope"
import {
 fetchPendingRollCallRemindersForTeacher,
 findSchedulesMissingAttendance,
 type PendingRollCallReminder,
} from "@/services/attendanceQueries"
import { fetchClassesByTeacherId } from "@/services/classQueries"
import {
 fetchEnrollmentChangeEventsList,
 type EnrollmentChangeListRow,
} from "@/services/enrollmentEventQueries"
import { recordInboxEvent, type RecordInboxEventInput } from "@/services/inboxEventWrite"
import { fetchLeaveRowsForClassIds, type TeacherPortalLeaveRow } from "@/services/leaveQueries"
import { fetchSchedulesInRange } from "@/services/scheduleQueries"
import { addDaysYmd, localYmd } from "@/services/teacherQueries"

export { recordInboxEvent }
export type { RecordInboxEventInput }

/** 收件匣事件類型（含衍生項目） */
export type InboxItemType =
 | "schedule_created"
 | "schedule_updated"
 | "schedule_cancelled"
 | "schedule_substitute"
 | "class_updated"
 | "class_teacher_changed"
 | "leave_created"
 | "enrollment_enroll"
 | "enrollment_withdraw"
 | "attendance_reminder"

export type InboxItem = {
 /** 統一鍵：用於已讀（event:…／enrollment:…／leave:…／rollcall:…） */
 sourceKey: string
 eventId: string | null
 type: InboxItemType
 title: string
 body: string | null
 actionPath: string | null
 createdAt: string
 statusLabel: string
 read: boolean
}

export type InboxTypeFilter = "" | InboxItemType

const LOOKBACK_DAYS = 30
const LEAVE_LIMIT = 80
const ENROLLMENT_LIMIT = 120
const EVENT_LIMIT = 200

const TYPE_STATUS_LABEL: Record<InboxItemType, string> = {
 schedule_created: "排程新增",
 schedule_updated: "排程變動",
 schedule_cancelled: "排程取消",
 schedule_substitute: "代堂",
 class_updated: "班別變動",
 class_teacher_changed: "主責變更",
 leave_created: "學生請假",
 enrollment_enroll: "新增報讀",
 enrollment_withdraw: "學生退讀",
 attendance_reminder: "提醒點名",
}

export function inboxTypeLabel(type: InboxItemType): string {
 return TYPE_STATUS_LABEL[type]
}

export function getInboxActorKey(): string {
 const tid = getTeacherScopeTeacherId()
 if (tid) return `teacher:${tid}`
 const role = getMgmtRole() ?? "admin"
 const name = resolveMgmtDisplayName(role)
 return `staff:${role}:${name}`
}

async function fetchReadSourceKeys(actorKey: string): Promise<Set<string>> {
 if (!supabase) return new Set()
 const { data, error } = await supabase
  .from("inbox_reads")
  .select("source_key")
  .eq("actor_key", actorKey)
 if (error) {
  console.warn("[fetchReadSourceKeys]", error.message)
  return new Set()
 }
 return new Set((data ?? []).map((r) => String((r as { source_key: string }).source_key)))
}

export async function markInboxItemRead(sourceKey: string, eventId?: string | null): Promise<void> {
 if (!supabase || !sourceKey) return
 const actorKey = getInboxActorKey()
 const { error } = await supabase.from("inbox_reads").upsert(
  {
   actor_key: actorKey,
   source_key: sourceKey,
   event_id: eventId ?? null,
   read_at: new Date().toISOString(),
  },
  { onConflict: "actor_key,source_key" }
 )
 if (error) throw error
}

export async function markAllInboxItemsRead(items: InboxItem[]): Promise<void> {
 if (!supabase || items.length === 0) return
 const actorKey = getInboxActorKey()
 const unread = items.filter((i) => !i.read)
 if (unread.length === 0) return
 const rows = unread.map((i) => ({
  actor_key: actorKey,
  source_key: i.sourceKey,
  event_id: i.eventId,
  read_at: new Date().toISOString(),
 }))
 const { error } = await supabase.from("inbox_reads").upsert(rows, { onConflict: "actor_key,source_key" })
 if (error) throw error
}

function mapStoredEvent(r: Record<string, unknown>, readKeys: Set<string>): InboxItem {
 const type = String(r.event_type ?? "schedule_updated") as InboxItemType
 const id = String(r.id)
 const sourceKey = `event:${id}`
 return {
  sourceKey,
  eventId: id,
  type,
  title: String(r.title ?? ""),
  body: r.body != null ? String(r.body) : null,
  actionPath: r.action_path != null ? String(r.action_path) : null,
  createdAt: String(r.created_at ?? ""),
  statusLabel: TYPE_STATUS_LABEL[type] ?? "通知",
  read: readKeys.has(sourceKey),
 }
}

function mapEnrollment(r: EnrollmentChangeListRow, readKeys: Set<string>): InboxItem | null {
 if (r.action !== "enroll" && r.action !== "withdraw") return null
 const type: InboxItemType = r.action === "withdraw" ? "enrollment_withdraw" : "enrollment_enroll"
 const sourceKey = `enrollment:${r.id}`
 const verb = r.action === "withdraw" ? "退讀" : "報讀"
 return {
  sourceKey,
  eventId: null,
  type,
  title: `${r.studentName} ${verb} ${r.classLabel}`,
  body: r.reason?.trim() ? `原因：${r.reason}` : `生效日 ${r.effectiveDate}`,
  actionPath: `/Students/${r.studentId}`,
  createdAt: r.createdAt || `${r.effectiveDate}T00:00:00`,
  statusLabel: TYPE_STATUS_LABEL[type],
  read: readKeys.has(sourceKey),
 }
}

function mapLeave(r: TeacherPortalLeaveRow, readKeys: Set<string>): InboxItem {
 const sourceKey = `leave:${r.id}`
 const reason = r.leaveReason?.trim() || "請假"
 return {
  sourceKey,
  eventId: null,
  type: "leave_created",
  title: `${r.studentName} 請假（${reason}）`,
  body: `${r.classLabel} · ${r.leaveDate}${r.status ? ` · ${r.status}` : ""}`,
  actionPath: r.scheduleId ? `/Schedule/${r.scheduleId}` : "/LeaveManagement",
  createdAt: `${r.leaveDate}T12:00:00`,
  statusLabel: TYPE_STATUS_LABEL.leave_created,
  read: readKeys.has(sourceKey),
 }
}

function mapRollCall(r: PendingRollCallReminder, readKeys: Set<string>): InboxItem {
 const sourceKey = `rollcall:${r.scheduleId}`
 const time =
  r.startTime && r.endTime
   ? `${String(r.startTime).slice(0, 5)}–${String(r.endTime).slice(0, 5)}`
   : ""
 return {
  sourceKey,
  eventId: null,
  type: "attendance_reminder",
  title: `尚未點名：${r.classLabel}`,
  body: `${r.scheduledDate}${time ? ` ${time}` : ""}`,
  actionPath: `/Schedule/${r.scheduleId}?rollcall=1`,
  createdAt: `${r.scheduledDate}T${String(r.startTime ?? "08:00").slice(0, 5)}:00`,
  statusLabel: TYPE_STATUS_LABEL.attendance_reminder,
  read: readKeys.has(sourceKey),
 }
}

async function fetchStoredInboxEvents(fromIso: string): Promise<Record<string, unknown>[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("inbox_events")
  .select(
   "id, event_type, title, body, action_path, class_id, schedule_id, student_id, audience_teacher_ids, created_at"
  )
  .gte("created_at", fromIso)
  .order("created_at", { ascending: false })
  .limit(EVENT_LIMIT)
 if (error) {
  console.warn("[fetchStoredInboxEvents]", error.message)
  return []
 }
 return (data ?? []) as Record<string, unknown>[]
}

async function fetchTeacherClassIds(teacherId: string): Promise<string[]> {
 const classes = await fetchClassesByTeacherId(teacherId)
 return classes.map((c) => c.id)
}

async function fetchRollCallReminders(teacherId: string | null): Promise<PendingRollCallReminder[]> {
 const today = localYmd()
 if (teacherId) {
  const [todayList, pastSchedules] = await Promise.all([
   fetchPendingRollCallRemindersForTeacher(teacherId, today),
   fetchSchedulesInRange(addDaysYmd(today, -14), addDaysYmd(today, -1)),
  ])
  const minePast = pastSchedules.filter((s) => {
   if (String(s.status ?? "").includes("取消")) return false
   const tid = s.teacher_id ?? s.original_teacher_id
   return tid === teacherId
  })
  const pastMissing = await findSchedulesMissingAttendance(minePast)
  return [...todayList, ...pastMissing]
 }
 const range = await fetchSchedulesInRange(addDaysYmd(today, -14), today)
 return findSchedulesMissingAttendance(range)
}

async function fetchRecentLeaveRows(opts: {
 teacherClassIds: string[]
 teacherScoped: boolean
 fromYmd: string
}): Promise<TeacherPortalLeaveRow[]> {
 if (opts.teacherScoped) {
  return fetchLeaveRowsForClassIds(opts.teacherClassIds, LEAVE_LIMIT)
 }
 if (!supabase) return []
 const { data, error } = await supabase
  .from("leave_makeup_records")
  .select(
   "id, leave_date, leave_reason, makeup_type, status, schedule_id, students ( full_name ), classes ( subject, course_code_full, courses ( course_name ) )"
  )
  .gte("leave_date", opts.fromYmd)
  .order("leave_date", { ascending: false })
  .limit(LEAVE_LIMIT)
 if (error) {
  console.warn("[fetchRecentLeaveRows]", error.message)
  return []
 }
 return (data ?? []).map((row) => {
  const r = row as Record<string, unknown>
  const st = r.students as Record<string, unknown> | null
  const cls = r.classes as Record<string, unknown> | null
  const sub = cls?.subject != null ? String(cls.subject) : "—"
  const code = cls?.course_code_full != null ? String(cls.course_code_full) : ""
  const course = cls?.courses as Record<string, unknown> | null
  const courseName = course?.course_name != null ? String(course.course_name) : null
  return {
   id: String(r.id),
   studentName: st?.full_name != null ? String(st.full_name) : "—",
   classLabel: formatClassLabel({ subject: sub, courseCode: code, courseName }),
   leaveDate: String(r.leave_date ?? ""),
   leaveReason: r.leave_reason != null ? String(r.leave_reason) : null,
   makeupType: r.makeup_type != null ? String(r.makeup_type) : null,
   status: String(r.status ?? ""),
   scheduleId: r.schedule_id != null ? String(r.schedule_id) : null,
  } satisfies TeacherPortalLeaveRow
 })
}

/**
 * 聚合收件匣：寫入事件 + 增退讀 + 請假 + 點名提醒。
 * 老師僅見自己相關項目；admin／alien 見全部。
 */
export async function fetchInboxFeed(opts?: {
 typeFilter?: InboxTypeFilter
 unreadOnly?: boolean
}): Promise<InboxItem[]> {
 const actorKey = getInboxActorKey()
 const teacherId = getTeacherScopeTeacherId()
 const role = getMgmtRole()
 const isTeacher = role === "teacher" || Boolean(teacherId)
 const fromYmd = addDaysYmd(localYmd(), -(LOOKBACK_DAYS - 1))
 const fromIso = `${fromYmd}T00:00:00`

 const teacherClassIds = isTeacher && teacherId ? await fetchTeacherClassIds(teacherId) : []

 const [readKeys, stored, enrollments, leaves, rollCalls] = await Promise.all([
  fetchReadSourceKeys(actorKey),
  fetchStoredInboxEvents(fromIso),
  fetchEnrollmentChangeEventsList({
   fromYmd,
   limit: ENROLLMENT_LIMIT,
  }),
  fetchRecentLeaveRows({
   teacherClassIds,
   teacherScoped: Boolean(isTeacher && teacherId),
   fromYmd,
  }),
  fetchRollCallReminders(isTeacher ? teacherId : null),
 ])

 let storedScoped = stored
 if (isTeacher && teacherId) {
  const classSet = new Set(teacherClassIds)
  storedScoped = stored.filter((r) => {
   const audience = (r.audience_teacher_ids as string[] | null) ?? []
   if (audience.includes(teacherId)) return true
   const cid = r.class_id != null ? String(r.class_id) : ""
   return cid !== "" && classSet.has(cid)
  })
 }

 let enrollmentScoped = enrollments
 if (isTeacher && teacherId) {
  const classSet = new Set(teacherClassIds)
  enrollmentScoped = enrollments.filter((e) => classSet.has(e.classId))
 }

 const items: InboxItem[] = [
  ...storedScoped.map((r) => mapStoredEvent(r, readKeys)),
  ...enrollmentScoped.map((e) => mapEnrollment(e, readKeys)).filter((x): x is InboxItem => x != null),
  ...leaves.map((l) => mapLeave(l, readKeys)),
  ...rollCalls.map((r) => mapRollCall(r, readKeys)),
 ]

 items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

 let out = items
 const typeFilter = opts?.typeFilter
 if (typeFilter) out = out.filter((i) => i.type === typeFilter)
 if (opts?.unreadOnly) out = out.filter((i) => !i.read)
 return out
}
