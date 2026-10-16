import { addDaysYmd, todayYmdLocal } from "@/lib/weekdayUtils"
import {
 compareAdminSlaReminders,
 formatStudentLeaveReminderText,
 formatTeacherCancelReminderText,
 formatTrialUnpaidReminderText,
 gradeLabelFromClassCourseCode,
 isOverdueStudentLeaveMakeup,
 isOverdueTeacherCancelWithoutMakeup,
 isTrialUnpaidOnChaseWindow,
 coveredCancelledScheduleIds,
 reminderClassPhrase,
 teacherCancelMakeupHref,
 trialUnpaidCollectHref,
 type AdminSlaReminderItem,
 type AdminSlaReminderKind,
 type MakeupRemarkRow,
 type StudentLeaveReminderRow,
 type TeacherCancelReminderRow,
 type TrialUnpaidReminderRow,
} from "@/lib/adminSlaReminders"
import { supabase } from "@/lib/supabaseClient"

export type AdminSlaReminderList = {
 items: AdminSlaReminderItem[]
 /** 查詢失敗的類別。items 仍可能包含其餘成功項目。 */
 failedKinds: AdminSlaReminderKind[]
}

function asKind(value: unknown): string | null {
 if (value == null) return null
 if (Array.isArray(value)) return asKind(value[0])
 if (typeof value === "object" && value && "class_kind" in value) {
  const kind = (value as { class_kind?: unknown }).class_kind
  return kind != null ? String(kind) : null
 }
 return null
}

function asText(value: unknown): string | null {
 if (value == null) return null
 const text = String(value).trim()
 return text || null
}

function nestedText(value: unknown, key: string): string | null {
 if (value == null) return null
 if (Array.isArray(value)) return nestedText(value[0], key)
 if (typeof value === "object" && value && key in value) {
  return asText((value as Record<string, unknown>)[key])
 }
 return null
}

function classBits(classes: unknown): { kind: string | null; phrase: string } {
 const subject = nestedText(classes, "subject")
 const code = nestedText(classes, "course_code_full")
 const courseName = nestedText(nestedRecord(classes, "courses"), "course_name")
 const subjectLabel =
  subject && !/一對一|一對二|單對單/.test(subject) ? subject : courseName || subject
 return {
  kind: asKind(classes),
  phrase: reminderClassPhrase(gradeLabelFromClassCourseCode(code), subjectLabel),
 }
}

function nestedRecord(value: unknown, key: string): unknown {
 if (value == null) return null
 if (Array.isArray(value)) return nestedRecord(value[0], key)
 if (typeof value === "object" && value && key in value) {
  return (value as Record<string, unknown>)[key]
 }
 return null
}

async function windowStart(today: string): Promise<string> {
 if (!supabase) return addDaysYmd(today, -120)
 const { data, error } = await supabase
  .from("academic_years")
  .select("label, start_date, end_date")
  .lte("start_date", today)
  .gte("end_date", today)
 if (error || !data?.length) return addDaysYmd(today, -120)
 const rows = data.map((row) => ({
  label: String(row.label ?? ""),
  start: String(row.start_date ?? ""),
 }))
 const regular = rows.filter((row) => row.start && !/SM$/i.test(row.label))
 const pool = regular.length > 0 ? regular : rows.filter((row) => row.start)
 pool.sort((a, b) => b.start.localeCompare(a.start))
 return pool[0]?.start || addDaysYmd(today, -120)
}

async function selectPages(
 build: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>
): Promise<unknown[]> {
 const pageSize = 1000
 const out: unknown[] = []
 for (let from = 0; from < 5000; from += pageSize) {
  const { data, error } = await build(from, from + pageSize - 1)
  if (error) throw new Error(error.message)
  const rows = data ?? []
  out.push(...rows)
  if (rows.length < pageSize) break
 }
 return out
}

async function listStudentLeaves(today: string, start: string): Promise<AdminSlaReminderItem[]> {
 if (!supabase) throw new Error("Supabase 未設定")
 const cutoff = addDaysYmd(today, -(7 + 1))
 const rows = await selectPages((from, to) =>
  supabase!
   .from("leave_makeup_records")
   .select(
    "id, student_id, class_id, leave_date, leave_reason, makeup_type, makeup_date, makeup_schedule_id, status, students(full_name), classes(class_kind, subject, course_code_full, courses(course_name), teachers(full_name))"
   )
   .gte("leave_date", start)
   .lte("leave_date", cutoff)
   .order("leave_date", { ascending: true })
   .range(from, to)
 )
 const seen = new Set<string>()
 const items: AdminSlaReminderItem[] = []
 for (const raw of rows) {
  const row = raw as Record<string, unknown>
  const bits = classBits(row.classes)
  const mapped: StudentLeaveReminderRow = {
   leaveDate: String(row.leave_date ?? ""),
   leaveReason: asText(row.leave_reason),
   makeupType: asText(row.makeup_type),
   makeupDate: asText(row.makeup_date),
   makeupScheduleId: asText(row.makeup_schedule_id),
   status: asText(row.status),
   classKind: bits.kind,
  }
  if (!isOverdueStudentLeaveMakeup(mapped, today)) continue
  const key = `${asText(row.student_id) ?? ""}|${asText(row.class_id) ?? ""}|${mapped.leaveDate}`
  if (seen.has(key)) continue
  seen.add(key)
  const id = String(row.id ?? "")
  items.push({
   id: `leave-${id}`,
   kind: "leave",
   href: `/LeaveManagement?record=${encodeURIComponent(id)}`,
   sortDate: mapped.leaveDate,
   text: formatStudentLeaveReminderText({
    teacherName: nestedText(nestedRecord(row.classes, "teachers"), "full_name"),
    gradeLabel: null,
    subject: bits.phrase,
    studentName: nestedText(row.students, "full_name"),
    leaveDate: mapped.leaveDate,
   }),
  })
 }
 return items
}

async function listTeacherCancels(today: string, start: string): Promise<AdminSlaReminderItem[]> {
 if (!supabase) throw new Error("Supabase 未設定")
 const [cancels, makeups] = await Promise.all([
  selectPages((from, to) =>
   supabase!
    .from("schedules")
    .select(
     "id, class_id, scheduled_date, cancel_reason, classes(class_kind, subject, course_code_full, courses(course_name)), teachers!schedules_teacher_id_fkey(full_name)"
    )
    .eq("status", "取消")
    .gte("scheduled_date", start)
    .lte("scheduled_date", today)
    .order("scheduled_date", { ascending: true })
    .range(from, to)
  ),
  selectPages((from, to) =>
   supabase!
    .from("schedules")
    .select("remarks, status")
    .gte("scheduled_date", start)
    .like("remarks", "%makeup_of=%")
    .order("scheduled_date", { ascending: true })
    .range(from, to)
  ),
 ])
 const covered = coveredCancelledScheduleIds(
  makeups.map((raw) => {
   const row = raw as Record<string, unknown>
   const mapped: MakeupRemarkRow = {
    remarks: asText(row.remarks),
    status: asText(row.status),
   }
   return mapped
  })
 )
 const items: AdminSlaReminderItem[] = []
 for (const raw of cancels) {
  const row = raw as Record<string, unknown>
  const bits = classBits(row.classes)
  const mapped: TeacherCancelReminderRow = {
   id: String(row.id ?? ""),
   scheduledDate: String(row.scheduled_date ?? ""),
   cancelReason: asText(row.cancel_reason),
   classKind: bits.kind,
  }
  if (!isOverdueTeacherCancelWithoutMakeup(mapped, covered, today)) continue
  items.push({
   id: `cancel-${mapped.id}`,
   kind: "cancel",
   href: teacherCancelMakeupHref({
    classId: asText(row.class_id),
    scheduleId: mapped.id,
    scheduledDate: mapped.scheduledDate,
   }),
   sortDate: mapped.scheduledDate,
   text: formatTeacherCancelReminderText({
    teacherName: nestedText(row.teachers, "full_name"),
    gradeLabel: null,
    subject: bits.phrase,
    scheduledDate: mapped.scheduledDate,
   }),
  })
 }
 return items
}

function paymentStatusOf(value: unknown): string | null {
 if (Array.isArray(value)) return paymentStatusOf(value[0])
 if (value && typeof value === "object" && "status" in value) {
  return asText((value as { status?: unknown }).status)
 }
 return null
}

async function listTrials(today: string): Promise<AdminSlaReminderItem[]> {
 if (!supabase) throw new Error("Supabase 未設定")
 const through = addDaysYmd(today, 3)
 const { data, error } = await supabase
  .from("trial_sessions")
  .select(
   "id, trial_date, status, payment_id, student_id, class_id, trial_type, students(full_name), classes(class_kind, subject, course_code_full, courses(course_name)), payments!payment_id(status)"
  )
  .gte("trial_date", today)
  .lte("trial_date", through)
 if (error) throw new Error(error.message)
 const items: AdminSlaReminderItem[] = []
 for (const raw of data ?? []) {
  const row = raw as Record<string, unknown>
  const mapped: TrialUnpaidReminderRow = {
   trialDate: String(row.trial_date ?? ""),
   status: asText(row.status),
   paymentId: asText(row.payment_id),
   paymentStatus: paymentStatusOf(row.payments),
  }
  if (!isTrialUnpaidOnChaseWindow(mapped, today)) continue
  const bits = classBits(row.classes)
  const studentId = asText(row.student_id)
  items.push({
   id: `trial-${String(row.id ?? "")}`,
   kind: "trial",
   href: trialUnpaidCollectHref({
    studentId,
    classId: asText(row.class_id),
    trialType: asText(row.trial_type),
   }),
   sortDate: mapped.trialDate,
   text: formatTrialUnpaidReminderText({
    studentName: nestedText(row.students, "full_name"),
    gradeLabel: null,
    subject: bits.phrase,
    trialDate: mapped.trialDate,
   }),
  })
 }
 return items
}

/** 行政常用工作：一筆一筆已過期或今日要追的事項。 */
export async function fetchAdminSlaReminders(today = todayYmdLocal()): Promise<AdminSlaReminderList> {
 const start = await windowStart(today).catch(() => addDaysYmd(today, -120))
 const [leaves, cancels, trials] = await Promise.all([
  listStudentLeaves(today, start).then((items) => ({ items, ok: true as const })).catch(() => ({
   items: [] as AdminSlaReminderItem[],
   ok: false as const,
  })),
  listTeacherCancels(today, start).then((items) => ({ items, ok: true as const })).catch(() => ({
   items: [] as AdminSlaReminderItem[],
   ok: false as const,
  })),
  listTrials(today).then((items) => ({ items, ok: true as const })).catch(() => ({
   items: [] as AdminSlaReminderItem[],
   ok: false as const,
  })),
 ])
 const failedKinds: AdminSlaReminderKind[] = []
 if (!leaves.ok) failedKinds.push("leave")
 if (!cancels.ok) failedKinds.push("cancel")
 if (!trials.ok) failedKinds.push("trial")
 const merged = [...leaves.items, ...cancels.items, ...trials.items].sort(compareAdminSlaReminders)
 return { items: merged, failedKinds }
}
