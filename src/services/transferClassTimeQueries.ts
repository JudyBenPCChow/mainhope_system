import { formatClassLabel } from "@/lib/courseLabel"
import { isRegularAcademicYearLabel } from "@/lib/softArchiveWindow"
import { isBillableAttendanceStatus } from "@/lib/attendanceBilling"
import { resolveClassKind } from "@/lib/privateClassKind"
import { supabase } from "@/lib/supabaseClient"
import {
 formatClassTimeSlot,
 formatTransferClassTimeReason,
 isTransferStartDateBlocked,
 type EnrollmentChangeTimelineInput,
} from "@/lib/transferClassTime"
import {
 isLeaveStatusAbandoned,
 isLeaveStatusDone,
 leaveNeedsMakeupDate,
} from "@/services/leaveQueries"
import {
 insertEnrollment,
 withdrawStudentFromClass,
 type EnrollmentAttendanceChangeOptions,
} from "@/services/studentQueries"

function ymd(raw: string | null | undefined): string {
 return String(raw ?? "").slice(0, 10)
}

function localTodayYmd(d = new Date()): string {
 const y = d.getFullYear()
 const m = String(d.getMonth() + 1).padStart(2, "0")
 const day = String(d.getDate()).padStart(2, "0")
 return `${y}-${m}-${day}`
}

export type TransferLeavePreviewRow = {
 id: string
 leaveDate: string
 leaveReason: string | null
 makeupType: string | null
 makeupDate: string | null
 makeupScheduleId: string | null
 makeupClassId: string | null
 makeupClassLabel: string | null
 makeupSlot: string | null
 arrangedOnTarget: boolean
 attended: boolean
}

export type TransferClassTimeContext = {
 unscheduled: TransferLeavePreviewRow[]
 arrangedOnTarget: TransferLeavePreviewRow[]
 arrangedElsewhere: TransferLeavePreviewRow[]
 attendedOnTargetYmds: string[]
 arrangedOnTargetYmds: string[]
}

type MakeupScheduleMeta = {
 scheduledDate: string | null
 classId: string | null
 classLabel: string | null
 slot: string | null
}

function mapLeavePreview(
 raw: Record<string, unknown>,
 toClassId: string,
 attendedIds: Set<string>,
 makeupMeta: Map<string, MakeupScheduleMeta>
): TransferLeavePreviewRow {
 const makeupScheduleId = raw.makeup_schedule_id != null ? String(raw.makeup_schedule_id) : null
 const meta = makeupScheduleId ? makeupMeta.get(makeupScheduleId) : undefined
 const makeupClassId = meta?.classId ?? null
 const makeupDate = ymd(raw.makeup_date != null ? String(raw.makeup_date) : meta?.scheduledDate)
 return {
  id: String(raw.id),
  leaveDate: ymd(raw.leave_date != null ? String(raw.leave_date) : null),
  leaveReason: raw.leave_reason != null ? String(raw.leave_reason) : null,
  makeupType: raw.makeup_type != null ? String(raw.makeup_type) : null,
  makeupDate: makeupDate || null,
  makeupScheduleId,
  makeupClassId,
  makeupClassLabel: meta?.classLabel ?? null,
  makeupSlot: meta?.slot ?? (makeupDate || null),
  arrangedOnTarget: Boolean(makeupClassId && makeupClassId === toClassId),
  attended: Boolean(makeupScheduleId && attendedIds.has(makeupScheduleId)),
 }
}

export async function fetchTransferClassTimeContext(opts: {
 studentId: string
 fromClassId: string
 toClassId: string
}): Promise<TransferClassTimeContext> {
 const empty: TransferClassTimeContext = {
  unscheduled: [],
  arrangedOnTarget: [],
  arrangedElsewhere: [],
  attendedOnTargetYmds: [],
  arrangedOnTargetYmds: [],
 }
 if (!supabase) return empty

 const { data, error } = await supabase
  .from("leave_makeup_records")
  .select("id, leave_date, leave_reason, makeup_type, makeup_date, makeup_schedule_id, status")
  .eq("student_id", opts.studentId)
  .eq("class_id", opts.fromClassId)
  .order("leave_date", { ascending: true })
 if (error) throw error

 const all = ((data ?? []) as Record<string, unknown>[]).filter((row) => {
  const status = String(row.status ?? "")
  return !isLeaveStatusAbandoned(status)
 })
 const open = all.filter((row) => !isLeaveStatusDone(String(row.status ?? "")))

 const makeupIds = all
  .map((row) => (row.makeup_schedule_id != null ? String(row.makeup_schedule_id) : ""))
  .filter(Boolean)
 const makeupMeta = new Map<string, MakeupScheduleMeta>()
 if (makeupIds.length > 0) {
  const { data: scheds, error: schedErr } = await supabase
   .from("schedules")
   .select(
    "id, scheduled_date, class_id, classes ( id, subject, course_code_full, day_of_week, time_slot, courses ( course_name ) )"
   )
   .in("id", makeupIds)
  if (schedErr) throw schedErr
  for (const raw of (scheds ?? []) as Record<string, unknown>[]) {
   const cls = raw.classes as Record<string, unknown> | null
   const course = cls?.courses as Record<string, unknown> | null
   makeupMeta.set(String(raw.id), {
    scheduledDate: raw.scheduled_date != null ? String(raw.scheduled_date) : null,
    classId: raw.class_id != null ? String(raw.class_id) : cls?.id != null ? String(cls.id) : null,
    classLabel: cls
     ? formatClassLabel({
        subject: cls.subject != null ? String(cls.subject) : "",
        courseCode: cls.course_code_full != null ? String(cls.course_code_full) : null,
        courseName: course?.course_name != null ? String(course.course_name) : null,
       })
     : null,
    slot: cls
     ? formatClassTimeSlot(
        cls.day_of_week != null ? String(cls.day_of_week) : null,
        cls.time_slot != null ? String(cls.time_slot) : null
       )
     : null,
   })
  }
 }
 const attendedIds = new Set<string>()
 if (makeupIds.length > 0) {
  const { data: att, error: attErr } = await supabase
   .from("attendance_details")
   .select("schedule_id, status")
   .eq("student_id", opts.studentId)
   .in("schedule_id", makeupIds)
  if (attErr) throw attErr
  for (const row of att ?? []) {
   const scheduleId = String((row as { schedule_id?: string }).schedule_id ?? "")
   const status = String((row as { status?: string }).status ?? "")
   if (scheduleId && isBillableAttendanceStatus(status)) attendedIds.add(scheduleId)
  }
 }

 const unscheduled: TransferLeavePreviewRow[] = []
 const arrangedOnTarget: TransferLeavePreviewRow[] = []
 const arrangedElsewhere: TransferLeavePreviewRow[] = []
 const attendedOnTargetYmds: string[] = []
 const arrangedOnTargetYmds: string[] = []

 for (const raw of all) {
  const row = mapLeavePreview(raw, opts.toClassId, attendedIds, makeupMeta)
  if (row.arrangedOnTarget && row.attended && row.makeupDate) {
   attendedOnTargetYmds.push(row.makeupDate)
  }
 }
 for (const raw of open) {
  const row = mapLeavePreview(raw, opts.toClassId, attendedIds, makeupMeta)
  if (leaveNeedsMakeupDate({
   makeupType: row.makeupType,
   makeupDate: row.makeupDate,
   makeupScheduleId: row.makeupScheduleId,
   status: String(raw.status ?? ""),
  })) {
   unscheduled.push(row)
   continue
  }
  if (!row.makeupDate && !row.makeupScheduleId) {
   unscheduled.push(row)
   continue
  }
  if (row.arrangedOnTarget) {
   if (row.attended) {
    if (row.makeupDate) attendedOnTargetYmds.push(row.makeupDate)
   } else {
    arrangedOnTarget.push(row)
    if (row.makeupDate) arrangedOnTargetYmds.push(row.makeupDate)
   }
   continue
  }
  if (!row.attended) arrangedElsewhere.push(row)
 }

 return {
  unscheduled,
  arrangedOnTarget,
  arrangedElsewhere,
  attendedOnTargetYmds: [...new Set(attendedOnTargetYmds)],
  arrangedOnTargetYmds: [...new Set(arrangedOnTargetYmds)],
 }
}

export async function fetchStudentEnrollmentChangeTimeline(
 studentId: string
): Promise<EnrollmentChangeTimelineInput[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("enrollment_change_events")
  .select(
   "id, action, effective_date, reason, created_at, class_id, classes ( subject, day_of_week, time_slot )"
  )
  .eq("student_id", studentId)
  .order("effective_date", { ascending: false })
  .order("created_at", { ascending: false })
 if (error) throw error
 return ((data ?? []) as Record<string, unknown>[]).map((row) => {
  const cls = row.classes as Record<string, unknown> | null
  return {
   id: String(row.id),
   action: String(row.action ?? "enroll"),
   effectiveDate: ymd(row.effective_date != null ? String(row.effective_date) : null),
   reason: row.reason != null ? String(row.reason) : null,
   classId: String(row.class_id ?? ""),
   subject: cls?.subject != null ? String(cls.subject) : "",
   dayOfWeek: cls?.day_of_week != null ? String(cls.day_of_week) : null,
   timeSlot: cls?.time_slot != null ? String(cls.time_slot) : null,
   createdAt: String(row.created_at ?? ""),
  }
 })
}

type ClassGateRow = {
 id: string
 subject: string
 classKind: string
 academicYearLabel: string | null
 dayOfWeek: string | null
 timeSlot: string | null
}

async function fetchClassGate(classId: string): Promise<ClassGateRow> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { data, error } = await supabase
  .from("classes")
  .select("id, subject, class_kind, day_of_week, time_slot, academic_years ( label )")
  .eq("id", classId)
  .maybeSingle()
 if (error) throw error
 if (!data) throw new Error("找不到班別")
 const row = data as Record<string, unknown>
 const ay = row.academic_years as Record<string, unknown> | null
 return {
  id: String(row.id),
  subject: String(row.subject ?? ""),
  classKind: resolveClassKind(
   row.class_kind != null ? String(row.class_kind) : null,
   row.subject != null ? String(row.subject) : null
  ),
  academicYearLabel: ay?.label != null ? String(ay.label).trim() || null : null,
  dayOfWeek: row.day_of_week != null ? String(row.day_of_week) : null,
  timeSlot: row.time_slot != null ? String(row.time_slot) : null,
 }
}

export async function transferStudentClassTime(opts: {
 studentId: string
 enrollmentId: string
 fromClassId: string
 toClassId: string
 enrollDate: string
 extraReason?: string | null
} & EnrollmentAttendanceChangeOptions): Promise<{ fromWithdrawn: boolean }> {
 if (!supabase) throw new Error("Supabase 未設定")
 if (opts.fromClassId === opts.toClassId) throw new Error("請選擇另一個時段的班別")

 const enrollDate = ymd(opts.enrollDate)
 if (!/^\d{4}-\d{2}-\d{2}$/.test(enrollDate)) throw new Error("請選擇開始報讀的排程")

 const [fromClass, toClass, ctx] = await Promise.all([
  fetchClassGate(opts.fromClassId),
  fetchClassGate(opts.toClassId),
  fetchTransferClassTimeContext({
   studentId: opts.studentId,
   fromClassId: opts.fromClassId,
   toClassId: opts.toClassId,
  }),
 ])

 if (fromClass.classKind !== "group" || toClass.classKind !== "group") {
  throw new Error("轉時間只適用於專科班。轉科或私人課程請用退讀後再報讀")
 }
 if (fromClass.subject !== toClass.subject) {
  throw new Error("轉時間只容許同一科目改時段。轉科請先退讀，再新增報讀")
 }
 if (fromClass.academicYearLabel !== toClass.academicYearLabel) {
  throw new Error("轉時間只適用於同一學年")
 }
 if (
  fromClass.academicYearLabel &&
  !isRegularAcademicYearLabel(fromClass.academicYearLabel)
 ) {
  throw new Error("暑期班請用退讀後再報讀，不使用轉時間")
 }
 if (
  isTransferStartDateBlocked({
   startYmd: enrollDate,
   attendedOnTargetYmds: ctx.attendedOnTargetYmds,
   arrangedOnTargetYmds: ctx.arrangedOnTargetYmds,
  })
 ) {
  throw new Error("報讀第一堂不可選已調堂上過、或尚未完成的新班補堂。請選該堂之後的排程")
 }

 const fromSlot = formatClassTimeSlot(fromClass.dayOfWeek, fromClass.timeSlot)
 const toSlot = formatClassTimeSlot(toClass.dayOfWeek, toClass.timeSlot)
 const reason = formatTransferClassTimeReason({
  fromSlot,
  toSlot,
  extra: opts.extraReason,
 })

 const { data: enr, error: enrErr } = await supabase
  .from("student_class_enrollments")
  .select("id, status, student_id, class_id")
  .eq("id", opts.enrollmentId)
  .maybeSingle()
 if (enrErr) throw enrErr
 if (!enr) throw new Error("找不到報讀紀錄")
 if (String((enr as { student_id: string }).student_id) !== opts.studentId) {
  throw new Error("報讀紀錄與學生不符")
 }
 if (String((enr as { class_id: string }).class_id) !== opts.fromClassId) {
  throw new Error("報讀班別不符")
 }
 if (String((enr as { status: string }).status) !== "就讀中") {
  throw new Error("只有就讀中的專科班可轉時間")
 }

 await withdrawStudentFromClass({
  enrollmentId: opts.enrollmentId,
  studentId: opts.studentId,
  classId: opts.fromClassId,
  effectiveDate: localTodayYmd(),
  reason,
  attendanceAction: opts.attendanceAction,
  deleteAttendanceIds: opts.deleteAttendanceIds,
 })

 try {
  await insertEnrollment(opts.studentId, opts.toClassId, null, undefined, null, {
   enrollDate,
   changeReason: reason,
  })
 } catch (err) {
  const msg = err instanceof Error ? err.message : String(err)
  throw new Error(`原班已退讀，請用新增報讀完成。${msg}`)
 }
 return { fromWithdrawn: true }
}
