import { supabase } from "@/lib/supabaseClient"
import { formatClassLabel } from "@/lib/courseLabel"
import {
 LESSON_SLOT_DURATION_MIN,
 intervalsOverlapMinutes,
 parseHm,
} from "@/lib/lessonSlots"
import {
 normalizeTrialOutcome,
 trialOutcomeClosed,
 type TrialOutcome,
} from "@/lib/trialOutcome"
import type { CourseMode, EnrollmentFormValue } from "@/lib/enrollmentPeriod"
import { localYmd } from "@/services/scheduleQueries"
import { fetchConsecutiveScheduleIds } from "@/services/classQueries"
import { addDaysYmd } from "@/services/teacherQueries"
import { fetchScheduleIdsThatHaveAttendance } from "@/services/attendanceQueries"
import {
 deleteAttendanceHitsWithAudit,
 fetchAttendanceHitsForStudentSchedules,
 type AttendanceLifecycleHit,
} from "@/services/attendanceLifecycleQueries"

/** 以週一為一週起始（與本地日曆一致） */
export function mondayYmdOfWeekContaining(ymd: string): string {
 const [y, mo, da] = ymd.split("-").map(Number)
 const dt = new Date(y, mo - 1, da)
 const day = dt.getDay()
 const diff = day === 0 ? -6 : 1 - day
 dt.setDate(dt.getDate() + diff)
 return localYmd(dt)
}

export type TrialManageRow = {
 id: string
 student_id: string
 class_id: string
 schedule_id: string
 trial_date: string
 trial_type: string
 status: string
 remarks: string | null
 payment_id: string | null
 receipt_number: string | null
 student_name: string | null
 student_grade: string | null
 class_subject: string | null
 course_code_full: string | null
 teacher_id: string | null
 teacher_name: string | null
 sched_date: string | null
 sched_start: string | null
 sched_end: string | null
 outcome: TrialOutcome
 outcome_reason: string | null
 outcome_note: string | null
 outcome_at: string | null
 converted_enrollment_id: string | null
 converted_payment_id: string | null
 course_mode: CourseMode
 price_per_lesson: number | null
 /** 該試堂排程是否已有點名列 */
 roll_call_done: boolean
}

function mapRow(r: Record<string, unknown>, rollCallDone: boolean): TrialManageRow {
 const st = r.students as Record<string, unknown> | null
 const cls = r.classes as Record<string, unknown> | null
 const tch = cls?.teachers as Record<string, unknown> | null
 const sc = r.schedules as Record<string, unknown> | null
 const pay = r.payments as Record<string, unknown> | null
 const sub = cls?.subject != null ? String(cls.subject) : "—"
 const course = cls?.courses as Record<string, unknown> | null
 const courseName = course?.course_name != null ? String(course.course_name) : null
 const code = cls?.course_code_full != null ? String(cls.course_code_full) : null
 const coursePrice =
  course?.price_per_lesson != null && Number.isFinite(Number(course.price_per_lesson))
   ? Number(course.price_per_lesson)
   : null
 const classPrice =
  cls?.price_per_lesson != null && Number.isFinite(Number(cls.price_per_lesson))
   ? Number(cls.price_per_lesson)
   : null
 return {
  id: String(r.id),
  student_id: String(r.student_id),
  class_id: String(r.class_id),
  schedule_id: String(r.schedule_id),
  trial_date: String(r.trial_date ?? ""),
  trial_type: String(r.trial_type ?? ""),
  status: String(r.status ?? ""),
  remarks: r.remarks != null ? String(r.remarks) : null,
  payment_id: r.payment_id != null ? String(r.payment_id) : null,
  receipt_number: pay?.receipt_number != null ? String(pay.receipt_number) : null,
  student_name: st?.full_name != null ? String(st.full_name) : null,
  student_grade: st?.grade != null ? String(st.grade) : null,
  class_subject: formatClassLabel({ subject: sub, courseCode: code, courseName }),
  course_code_full: code,
  teacher_id: cls?.teacher_id != null ? String(cls.teacher_id) : null,
  teacher_name: tch?.full_name != null ? String(tch.full_name) : null,
  sched_date: sc?.scheduled_date != null ? String(sc.scheduled_date) : null,
  sched_start: sc?.start_time != null ? String(sc.start_time) : null,
  sched_end: sc?.end_time != null ? String(sc.end_time) : null,
  outcome: normalizeTrialOutcome(r.outcome != null ? String(r.outcome) : "open"),
  outcome_reason: r.outcome_reason != null ? String(r.outcome_reason) : null,
  outcome_note: r.outcome_note != null ? String(r.outcome_note) : null,
  outcome_at: r.outcome_at != null ? String(r.outcome_at) : null,
  converted_enrollment_id:
   r.converted_enrollment_id != null ? String(r.converted_enrollment_id) : null,
  converted_payment_id: r.converted_payment_id != null ? String(r.converted_payment_id) : null,
  course_mode: course?.course_mode === "summer_two_period" ? "summer_two_period" : "regular",
  price_per_lesson: classPrice != null && classPrice > 0 ? classPrice : coursePrice,
  roll_call_done: rollCallDone,
 }
}

export async function fetchTrialsWithRelations(): Promise<TrialManageRow[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("trial_sessions")
  .select(
   "id, student_id, class_id, schedule_id, trial_date, trial_type, status, remarks, payment_id, outcome, outcome_reason, outcome_note, outcome_at, converted_enrollment_id, converted_payment_id, students ( full_name, grade ), classes ( subject, course_code_full, price_per_lesson, courses ( course_name, course_mode, price_per_lesson ), teacher_id, teachers ( full_name ) ), schedules ( scheduled_date, start_time, end_time ), payments!payment_id ( receipt_number )"
  )
  .order("trial_date", { ascending: false })
  .order("created_at", { ascending: false })
 if (error) throw error
 const raw = data ?? []
 const scheduleIds = [
  ...new Set(raw.map((x) => String((x as { schedule_id?: string }).schedule_id ?? "")).filter(Boolean)),
 ]
 const attended = await fetchScheduleIdsThatHaveAttendance(scheduleIds)
 return raw.map((x) => {
  const row = x as Record<string, unknown>
  const sid = String(row.schedule_id ?? "")
  return mapRow(row, attended.has(sid))
 })
}

export type TrialDashboardStats = {
 todayCount: number
 weekCount: number
}

export async function fetchTrialDashboardStats(): Promise<TrialDashboardStats> {
 const empty: TrialDashboardStats = { todayCount: 0, weekCount: 0 }
 if (!supabase) return empty
 const today = localYmd()
 const weekStart = mondayYmdOfWeekContaining(today)
 const weekEnd = addDaysYmd(weekStart, 6)
 const [todayRes, weekRes] = await Promise.all([
  supabase.from("trial_sessions").select("id", { count: "exact", head: true }).eq("trial_date", today),
  supabase
   .from("trial_sessions")
   .select("id", { count: "exact", head: true })
   .gte("trial_date", weekStart)
   .lte("trial_date", weekEnd),
 ])
 if (todayRes.error) throw todayRes.error
 if (weekRes.error) throw weekRes.error
 return {
  todayCount: todayRes.count ?? 0,
  weekCount: weekRes.count ?? 0,
 }
}

export async function updateTrialSession(
 id: string,
 patch: { status?: string; remarks?: string | null },
 options?: { deleteAttendanceIds?: string[] }
): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const deleteIds = options?.deleteAttendanceIds?.filter(Boolean) ?? []
 if (deleteIds.length > 0) {
  const hits = await previewTrialAttendanceImpact(id)
  const allow = new Set(deleteIds)
  await deleteAttendanceHitsWithAudit(
   hits.filter((h) => allow.has(h.id)),
   "trial_cancel"
  )
 }
 const { error } = await supabase
  .from("trial_sessions")
  .update({ ...patch, updated_at: new Date().toISOString() })
  .eq("id", id)
 if (error) throw error
}

export async function deleteTrialSession(
 id: string,
 options?: { deleteAttendanceIds?: string[] }
): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const deleteIds = options?.deleteAttendanceIds?.filter(Boolean) ?? []
 if (deleteIds.length > 0) {
  const hits = await previewTrialAttendanceImpact(id)
  const allow = new Set(deleteIds)
  await deleteAttendanceHitsWithAudit(
   hits.filter((h) => allow.has(h.id)),
   "trial_delete"
  )
 }
 const { error } = await supabase.from("trial_sessions").delete().eq("id", id)
 if (error) throw error
}

/** O4：試堂取消／刪除／改期前掃描舊堂出席 */
export async function previewTrialAttendanceImpact(trialId: string): Promise<AttendanceLifecycleHit[]> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { data, error } = await supabase
  .from("trial_sessions")
  .select("student_id, schedule_id")
  .eq("id", trialId)
  .maybeSingle()
 if (error) throw error
 if (!data) throw new Error("找不到試堂紀錄")
 const studentId = String((data as { student_id: string }).student_id)
 const scheduleId = String((data as { schedule_id: string }).schedule_id)
 return fetchAttendanceHitsForStudentSchedules(studentId, [scheduleId])
}

function isTrialStatusOpen(status: string | null | undefined): boolean {
 const s = String(status ?? "")
 return !s.includes("完成") && !s.includes("取消")
}

function parseTrialHm(raw: string | null | undefined): number | null {
 if (!raw) return null
 return parseHm(String(raw).slice(0, 5))
}

function trialSlotBounds(
 startRaw: string | null | undefined,
 endRaw: string | null | undefined
): { a: number; b: number } | null {
 const a = parseTrialHm(startRaw)
 if (a == null) return null
 const end = parseTrialHm(endRaw)
 const b = end == null || end <= a ? a + LESSON_SLOT_DURATION_MIN : end
 return { a, b }
}

export async function insertTrialSession(row: {
 student_id: string
 schedule_id: string
 class_id: string
 trial_date: string
 trial_type: string
 status?: string
 remarks?: string | null
 payment_id?: string | null
}): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")

 const today = localYmd()
 const trialDate = String(row.trial_date ?? "").slice(0, 10)
 if (trialDate && trialDate < today) {
  throw new Error("不可新增過去日期的試堂")
 }

 const { data: enrRows, error: enrErr } = await supabase
  .from("student_class_enrollments")
  .select("id")
  .eq("student_id", row.student_id)
  .eq("class_id", row.class_id)
  .eq("status", "就讀中")
  .limit(1)
 if (enrErr) throw enrErr
 if ((enrRows ?? []).length > 0) {
  throw new Error("此學生已報讀該班別，請直接點名／跟進，無需再新增試堂")
 }

 const scheduleIds = await fetchConsecutiveScheduleIds(row.schedule_id)

 const { data: schedRows, error: schedErr } = await supabase
  .from("schedules")
  .select("id, class_id, scheduled_date, start_time, end_time, status")
  .in("id", scheduleIds)
 if (schedErr) throw schedErr
 const byId = new Map(
  (schedRows ?? []).map((r) => {
   const s = r as {
    id: string
    class_id: string
    scheduled_date: string
    start_time: string | null
    end_time: string | null
    status: string
   }
   return [String(s.id), s] as const
  })
 )
 for (const sid of scheduleIds) {
  const s = byId.get(sid)
  if (!s) throw new Error("試堂排程不存在或已失效")
  if (String(s.class_id) !== row.class_id) {
   throw new Error("試堂排程必須屬於所選班別")
  }
  if (String(s.status ?? "").includes("取消")) {
   throw new Error("不可對已取消的排程新增試堂")
  }
  const d = String(s.scheduled_date ?? "").slice(0, 10)
  if (d && d < today) throw new Error("不可新增過去日期的試堂")
 }

 const { data: existingDup, error: dupErr } = await supabase
  .from("trial_sessions")
  .select("id, status, schedule_id")
  .eq("student_id", row.student_id)
  .in("schedule_id", scheduleIds)
 if (dupErr) throw dupErr
 const openDup = (existingDup ?? []).filter((r) =>
  isTrialStatusOpen((r as { status?: string }).status)
 )
 if (openDup.length > 0) {
  throw new Error("此學生對該排程已有未結案試堂，不可重複新增")
 }

 const { data: otherTrials, error: otherErr } = await supabase
  .from("trial_sessions")
  .select("id, status, schedule_id, schedules ( scheduled_date, start_time, end_time, status )")
  .eq("student_id", row.student_id)
 if (otherErr) throw otherErr
 for (const sid of scheduleIds) {
  const neu = byId.get(sid)!
  const nb = trialSlotBounds(neu.start_time, neu.end_time)
  if (!nb) continue
  const neuDate = String(neu.scheduled_date ?? "").slice(0, 10)
  for (const raw of otherTrials ?? []) {
   const ot = raw as {
    status?: string
    schedule_id?: string
    schedules?: {
     scheduled_date?: string
     start_time?: string | null
     end_time?: string | null
     status?: string
    } | null
   }
   if (!isTrialStatusOpen(ot.status)) continue
   if (scheduleIds.includes(String(ot.schedule_id ?? ""))) continue
   const sc = ot.schedules
   if (!sc) continue
   if (String(sc.status ?? "").includes("取消")) continue
   if (String(sc.scheduled_date ?? "").slice(0, 10) !== neuDate) continue
   const eb = trialSlotBounds(sc.start_time ?? null, sc.end_time ?? null)
   if (!eb) continue
   if (intervalsOverlapMinutes(nb.a, nb.b, eb.a, eb.b)) {
    throw new Error(
     `試堂時段與該生另一未結案試堂衝突（${neuDate} ${String(neu.start_time ?? "").slice(0, 5)}）`
    )
   }
  }
 }

 const { findStudentConflictsWithScheduleSlot } = await import("@/services/studentQueries")
 for (const sid of scheduleIds) {
  const neu = byId.get(sid)!
  const conflicts = await findStudentConflictsWithScheduleSlot({
   studentId: row.student_id,
   scheduleId: sid,
   scheduledDate: String(neu.scheduled_date ?? "").slice(0, 10),
   startTime: neu.start_time,
   endTime: neu.end_time,
   classLabel: "試堂排程",
  })
  if (conflicts.length > 0) {
   const c = conflicts[0]!
   throw new Error(
    `試堂時段與學生已報讀班別衝突：${c.date} ${c.newTime} 與「${c.existingClassLabel}」${c.existingTime}`
   )
  }
 }

 for (const scheduleId of scheduleIds) {
  const { error } = await supabase.from("trial_sessions").insert({
   student_id: row.student_id,
   schedule_id: scheduleId,
   class_id: row.class_id,
   trial_date: row.trial_date,
   trial_type: row.trial_type,
   status: row.status ?? "已預約",
   remarks: row.remarks ?? null,
   payment_id: row.payment_id ?? null,
  })
  if (error) {
   const code = (error as { code?: string }).code
   if (code === "23505") {
    throw new Error("此學生對該排程已有未結案試堂，不可重複新增")
   }
   throw error
  }
 }
}

/** 依每堂收費金額推斷試堂類型（列表篩選／標籤用） */
export function trialTypeFromUnitPrice(
 unitPrice: number,
 classPricePerLesson?: number | null
): string {
 const unit = Math.round(Number(unitPrice) * 100) / 100
 if (!(unit > 0)) return "免費試堂"
 const base =
  classPricePerLesson != null && Number(classPricePerLesson) > 0
   ? Math.round(Number(classPricePerLesson) * 100) / 100
   : null
 if (base != null) {
  const half = Math.round(base * 0.5 * 100) / 100
  if (Math.abs(unit - half) < 0.005) return "半價試堂"
  if (Math.abs(unit - base) < 0.005) return "原價試堂"
 }
 return "原價試堂"
}

/** 付費試堂：先開已收款單（lesson_count＝連堂節數），再建立試堂並關聯 payment_id */
export async function insertPaidTrialSession(params: {
 studentId: string
 classId: string
 scheduleId: string
 trialDate: string
 trialType: string
 remarks?: string | null
 paymentMethod: string
 /** 每堂單價（連堂會按節數加總） */
 unitPrice: number
}): Promise<{ paymentId: string; receiptNumber: string | null }> {
 if (trialTypeCategory(params.trialType) === "free") {
  throw new Error("免費試堂無需先收費，請直接建立試堂")
 }
 const scheduleIds = await fetchConsecutiveScheduleIds(params.scheduleId)
 const lessons = Math.max(1, scheduleIds.length)
 const unit = Math.max(0, Number(params.unitPrice))
 const amount = Math.round(unit * lessons * 100) / 100
 if (amount <= 0) throw new Error("試堂金額須大於 0")

 const { insertPaymentRecord, PAYMENT_STATUS } = await import("@/services/paymentQueries")
 const paymentId = await insertPaymentRecord({
  studentId: params.studentId,
  paymentDate: localYmd(),
  totalAmount: amount,
  subtotalAmount: amount,
  paymentMethod: params.paymentMethod,
  status: PAYMENT_STATUS.received,
  remarks: `試堂（${params.trialType}）`,
  receiptKind: "RC",
  details: [
   {
    classId: params.classId,
    lessonCount: lessons,
    amount,
    description: `試堂 ${params.trialType}`,
   },
  ],
 })

 await insertTrialSession({
  student_id: params.studentId,
  class_id: params.classId,
  schedule_id: params.scheduleId,
  trial_date: params.trialDate,
  trial_type: params.trialType,
  status: "已預約",
  remarks: params.remarks ?? null,
  payment_id: paymentId,
 })

 if (!supabase) throw new Error("Supabase 未設定")
 const { data: pay, error } = await supabase
  .from("payments")
  .select("receipt_number")
  .eq("id", paymentId)
  .maybeSingle()
 if (error) throw error
 return {
  paymentId,
  receiptNumber: pay?.receipt_number != null ? String(pay.receipt_number) : null,
 }
}

export type StudentTrialSummary = {
 id: string
 classId: string
 scheduleId: string
 trialDate: string
 trialType: string
 status: string
 remarks: string | null
 classLabel: string
 scheduleLabel: string
}

/** 學生未結案試堂（前台精靈／學生詳情用） */
export async function fetchOpenTrialsForStudent(studentId: string): Promise<StudentTrialSummary[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("trial_sessions")
  .select(
   "id, class_id, schedule_id, trial_date, trial_type, status, remarks, classes ( subject, course_code_full, courses ( course_name ) ), schedules ( scheduled_date, start_time, end_time )"
  )
  .eq("student_id", studentId)
  .order("trial_date", { ascending: true })
  .order("created_at", { ascending: true })
 if (error) throw error
 return (data ?? [])
  .map((raw) => {
   const r = raw as Record<string, unknown>
   const status = String(r.status ?? "")
   if (!isTrialStatusOpen(status)) return null
   const cls = r.classes as Record<string, unknown> | null
   const course = cls?.courses as Record<string, unknown> | null
   const sub = cls?.subject != null ? String(cls.subject) : "—"
   const code = cls?.course_code_full != null ? String(cls.course_code_full) : null
   const courseName = course?.course_name != null ? String(course.course_name) : null
   const sc = r.schedules as Record<string, unknown> | null
   const date = sc?.scheduled_date != null ? String(sc.scheduled_date) : String(r.trial_date ?? "")
   const start = sc?.start_time != null ? String(sc.start_time).slice(0, 5) : "—"
   const end = sc?.end_time != null ? String(sc.end_time).slice(0, 5) : "—"
   return {
    id: String(r.id),
    classId: String(r.class_id),
    scheduleId: String(r.schedule_id),
    trialDate: String(r.trial_date ?? "").slice(0, 10),
    trialType: String(r.trial_type ?? ""),
    status,
    remarks: r.remarks != null ? String(r.remarks) : null,
    classLabel: formatClassLabel({ subject: sub, courseCode: code, courseName }),
    scheduleLabel: `${date} ${start}–${end}`,
   } satisfies StudentTrialSummary
  })
  .filter((x): x is StudentTrialSummary => x != null)
}

export function trialStatusCategory(status: string): "booked" | "done" | "cancel" {
 const s = status.trim()
 if (s.includes("取消")) return "cancel"
 if (s.includes("完成")) return "done"
 return "booked"
}

export function trialTypeCategory(trialType: string): "free" | "half" | "full" | "other" {
 const t = trialType.trim()
 if (t.includes("免費") || t.includes("體驗")) return "free"
 if (t.includes("半價")) return "half"
 if (t.includes("原價")) return "full"
 return "other"
}

export function trialCanConvert(row: Pick<TrialManageRow, "outcome" | "status">): boolean {
 if (trialOutcomeClosed(row.outcome)) return false
 if (String(row.status).includes("取消")) return false
 return true
}

export function trialConvertBlockedReason(
 row: Pick<TrialManageRow, "outcome" | "status">
): string | null {
 if (row.outcome === "converted") return "已轉正式報讀"
 if (row.outcome === "lost") return "已標流失"
 if (row.outcome === "other") return "已有其他結果"
 if (String(row.status).includes("取消")) return "已取消，不可轉正"
 return null
}

/** 未點名仍可轉正，但 UI 必須先警告（堂數／點名／學費對帳風險） */
export function trialConvertRollCallWarning(
 row: Pick<TrialManageRow, "roll_call_done" | "status">
): string | null {
 if (String(row.status).includes("取消")) return null
 if (row.roll_call_done) return null
 return "學生尚未完成試堂點名。若已收學費但未點名，堂數與出席會對不上。仍要繼續轉正？"
}

export function trialCanRecordLost(
 row: Pick<TrialManageRow, "outcome" | "status">
): boolean {
 if (trialOutcomeClosed(row.outcome)) return false
 return String(row.status).includes("取消")
}

export function trialLostBlockedReason(
 row: Pick<TrialManageRow, "outcome" | "status">
): string | null {
 if (row.outcome === "converted") return "已轉正式報讀"
 if (row.outcome === "lost") return "已標流失"
 if (row.outcome === "other") return "已有其他結果"
 if (!String(row.status).includes("取消")) return "請先取消試堂，再標流失"
 return null
}

export function trialCanRecordOutcome(
 row: Pick<TrialManageRow, "outcome" | "status" | "roll_call_done">
): boolean {
 if (trialOutcomeClosed(row.outcome)) return false
 if (String(row.status).includes("取消")) return true
 return Boolean(row.roll_call_done)
}

export async function recordTrialOutcome(params: {
 trialId: string
 outcome: "lost" | "other"
 reason: string
 note?: string | null
}): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const reason = params.reason.trim()
 if (!reason) throw new Error("請選擇原因／結果")
 const { data: row, error: loadErr } = await supabase
  .from("trial_sessions")
  .select("id, status, outcome")
  .eq("id", params.trialId)
  .maybeSingle()
 if (loadErr) throw loadErr
 if (!row) throw new Error("找不到試堂紀錄")
 const outcome = normalizeTrialOutcome((row as { outcome?: string }).outcome)
 if (trialOutcomeClosed(outcome)) throw new Error("此試堂已有結果，不可重複登記")
 const status = String((row as { status?: string }).status ?? "")
 if (params.outcome === "lost" && !status.includes("取消")) {
  throw new Error("請先取消試堂，再標流失")
 }
 const now = new Date().toISOString()
 const { error } = await supabase
  .from("trial_sessions")
  .update({
   outcome: params.outcome,
   outcome_reason: reason,
   outcome_note: params.note?.trim() || null,
   outcome_at: now,
   status: status.includes("取消") ? status : "已完成",
   updated_at: now,
  })
  .eq("id", params.trialId)
 if (error) throw error
}

/** 試堂轉正式報讀；學費請到 /Payments。未點名可轉，回傳 rollCallPending 供 UI 事前警告。 */
export async function convertTrialToEnrollment(params: {
 trialId: string
 /** 報讀班；省略＝試堂班（可跨班） */
 targetClassId?: string
 enrollmentPeriod: EnrollmentFormValue | null
 scheduleIds?: string[]
 pending?: { owedCount: number; reason?: string; remarks?: string | null } | null
}): Promise<{
 enrollmentId: string
 rollCallPending: boolean
 trialClassId: string
 targetClassId: string
}> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { data: trial, error: trialErr } = await supabase
  .from("trial_sessions")
  .select("id, student_id, class_id, schedule_id, status, outcome")
  .eq("id", params.trialId)
  .maybeSingle()
 if (trialErr) throw trialErr
 if (!trial) throw new Error("找不到試堂紀錄")
 const t = trial as {
  id: string
  student_id: string
  class_id: string
  schedule_id: string
  status: string
  outcome: string | null
 }
 const outcome = normalizeTrialOutcome(t.outcome)
 if (trialOutcomeClosed(outcome)) throw new Error("此試堂已有結果，不可再轉正")
 if (String(t.status).includes("取消")) throw new Error("已取消試堂不可轉正")

 const targetClassId = (params.targetClassId ?? t.class_id).trim()
 if (!targetClassId) throw new Error("請選擇報讀班別")

 const attended = await fetchScheduleIdsThatHaveAttendance([t.schedule_id])
 const rollCallPending = !attended.has(t.schedule_id)

 const { data: enr, error: enrErr } = await supabase
  .from("student_class_enrollments")
  .select("id")
  .eq("student_id", t.student_id)
  .eq("class_id", targetClassId)
  .eq("status", "就讀中")
  .limit(1)
 if (enrErr) throw enrErr
 if ((enr ?? []).length > 0) {
  throw new Error("此學生已報讀該班別")
 }

 const { insertEnrollment } = await import("@/services/studentQueries")
 const enrollmentId = await insertEnrollment(
  t.student_id,
  targetClassId,
  params.enrollmentPeriod,
  params.scheduleIds,
  params.pending ?? null
 )

 const periodLabel =
  params.enrollmentPeriod == null
   ? "報足全期"
   : String(params.enrollmentPeriod)
 const now = new Date().toISOString()
 const crossNote =
  targetClassId !== t.class_id ? "跨班轉化：歸因至新報讀" : null

 // 原試堂班未結案試堂一律標 converted；同班時 insertEnrollment 可能已結案，仍補上 enrollment 連結
 const { data: classTrials, error: openErr } = await supabase
  .from("trial_sessions")
  .select("id, status, outcome, remarks")
  .eq("student_id", t.student_id)
  .eq("class_id", t.class_id)
 if (openErr) throw openErr

 const rows = (classTrials ?? []) as Array<{
  id: string
  status: string
  outcome: string | null
  remarks: string | null
 }>
 const targets = rows.filter((row) => {
  if (row.id === t.id) return true
  const s = String(row.status ?? "")
  const o = normalizeTrialOutcome(row.outcome)
  if (s.includes("取消")) return false
  if (trialOutcomeClosed(o)) return false
  return true
 })

 for (const row of targets) {
  const prevRemarks = (row.remarks ?? "").trim()
  let remarks: string | null = prevRemarks || null
  if (crossNote && !prevRemarks.includes("跨班轉化")) {
   remarks = prevRemarks ? `${prevRemarks}；${crossNote}` : crossNote
  }
  const { error: upErr } = await supabase
   .from("trial_sessions")
   .update({
    outcome: "converted",
    outcome_reason: periodLabel,
    outcome_note: rollCallPending ? "轉正時尚未完成試堂點名" : null,
    outcome_at: now,
    converted_enrollment_id: enrollmentId,
    status: String(row.status).includes("取消") ? row.status : "已完成",
    remarks,
    updated_at: now,
   })
   .eq("id", row.id)
  if (upErr) throw upErr
 }

 const { data: stu, error: stuErr } = await supabase
  .from("students")
  .select("id, registration_status")
  .eq("id", t.student_id)
  .maybeSingle()
 if (stuErr) throw stuErr
 const reg = String((stu as { registration_status?: string } | null)?.registration_status ?? "")
 if (reg.includes("非注冊") || reg.includes("試堂") || reg.includes("查詢")) {
  const { error: regErr } = await supabase
   .from("students")
   .update({ registration_status: "已註冊", updated_at: now })
   .eq("id", t.student_id)
  if (regErr) console.warn("[convertTrialToEnrollment] registration_status", regErr)
 }

 return {
  enrollmentId,
  rollCallPending,
  trialClassId: t.class_id,
  targetClassId,
 }
}

/** 改期：只換 schedule_id／trial_date；status 不變；舊堂名單自然消失 */
export async function rescheduleTrialSession(params: {
 trialId: string
 newScheduleId: string
 deleteOldAttendanceIds?: string[]
}): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { data: trial, error: trialErr } = await supabase
  .from("trial_sessions")
  .select("id, student_id, class_id, schedule_id, status, outcome")
  .eq("id", params.trialId)
  .maybeSingle()
 if (trialErr) throw trialErr
 if (!trial) throw new Error("找不到試堂紀錄")
 const t = trial as {
  id: string
  student_id: string
  class_id: string
  schedule_id: string
  status: string
  outcome: string | null
 }
 if (trialOutcomeClosed(normalizeTrialOutcome(t.outcome))) {
  throw new Error("已有結果的試堂不可改期")
 }
 if (String(t.status).includes("取消")) throw new Error("已取消試堂不可改期")
 if (params.newScheduleId === t.schedule_id) throw new Error("請選擇不同排程")

 const { data: sch, error: schErr } = await supabase
  .from("schedules")
  .select("id, class_id, scheduled_date, status")
  .eq("id", params.newScheduleId)
  .maybeSingle()
 if (schErr) throw schErr
 if (!sch) throw new Error("找不到新排程")
 const s = sch as { id: string; class_id: string; scheduled_date: string; status: string | null }
 if (s.class_id !== t.class_id) throw new Error("改期僅可選同一班別的其他排程")
 if (String(s.status ?? "").includes("取消")) throw new Error("不可改期至已取消排程")

 const today = localYmd()
 const newDate = String(s.scheduled_date).slice(0, 10)
 if (newDate < today) throw new Error("不可改期至過去日期")

 const deleteIds = params.deleteOldAttendanceIds?.filter(Boolean) ?? []
 if (deleteIds.length > 0) {
  const hits = await fetchAttendanceHitsForStudentSchedules(t.student_id, [t.schedule_id])
  const allow = new Set(deleteIds)
  await deleteAttendanceHitsWithAudit(
   hits.filter((h) => allow.has(h.id)),
   "trial_reschedule"
  )
 }

 const { data: clash, error: clashErr } = await supabase
  .from("trial_sessions")
  .select("id, status")
  .eq("student_id", t.student_id)
  .eq("schedule_id", params.newScheduleId)
 if (clashErr) throw clashErr
 const openClash = (clash ?? []).some((row) => {
  if (String((row as { id: string }).id) === t.id) return false
  return isTrialStatusOpen((row as { status?: string }).status)
 })
 if (openClash) throw new Error("該生在此排程已有未結案試堂")

 const { error: upErr } = await supabase
  .from("trial_sessions")
  .update({
   schedule_id: params.newScheduleId,
   trial_date: newDate,
   updated_at: new Date().toISOString(),
  })
  .eq("id", t.id)
 if (upErr) throw upErr
}
