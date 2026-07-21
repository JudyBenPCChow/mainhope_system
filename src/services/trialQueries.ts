import { supabase } from "@/lib/supabaseClient"
import { formatClassLabel } from "@/lib/courseLabel"
import {
 LESSON_SLOT_DURATION_MIN,
 intervalsOverlapMinutes,
 parseHm,
} from "@/lib/lessonSlots"
import { localYmd } from "@/services/scheduleQueries"
import { fetchConsecutiveScheduleIds } from "@/services/classQueries"
import { addDaysYmd } from "@/services/teacherQueries"

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
}

function mapRow(r: Record<string, unknown>): TrialManageRow {
 const st = r.students as Record<string, unknown> | null
 const cls = r.classes as Record<string, unknown> | null
 const tch = cls?.teachers as Record<string, unknown> | null
 const sc = r.schedules as Record<string, unknown> | null
 const pay = r.payments as Record<string, unknown> | null
 const sub = cls?.subject != null ? String(cls.subject) : "—"
 const course = cls?.courses as Record<string, unknown> | null
 const courseName = course?.course_name != null ? String(course.course_name) : null
 const code = cls?.course_code_full != null ? String(cls.course_code_full) : null
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
 }
}

export async function fetchTrialsWithRelations(): Promise<TrialManageRow[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("trial_sessions")
  .select(
   "id, student_id, class_id, schedule_id, trial_date, trial_type, status, remarks, payment_id, students ( full_name, grade ), classes ( subject, course_code_full, courses ( course_name ), teacher_id, teachers ( full_name ) ), schedules ( scheduled_date, start_time, end_time ), payments ( receipt_number )"
  )
  .order("trial_date", { ascending: false })
  .order("created_at", { ascending: false })
 if (error) throw error
 return (data ?? []).map((x) => mapRow(x as Record<string, unknown>))
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

export async function updateTrialSession(id: string, patch: { status?: string; remarks?: string | null }): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { error } = await supabase
  .from("trial_sessions")
  .update({ ...patch, updated_at: new Date().toISOString() })
  .eq("id", id)
 if (error) throw error
}

export async function deleteTrialSession(id: string): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { error } = await supabase.from("trial_sessions").delete().eq("id", id)
 if (error) throw error
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

/** 半價／原價試堂：先開已收款單（lesson_count＝連堂節數），再建立試堂並關聯 payment_id */
export async function insertPaidTrialSession(params: {
 studentId: string
 classId: string
 scheduleId: string
 trialDate: string
 trialType: string
 remarks?: string | null
 paymentMethod: string
 /** 每堂單價（半價請先乘 0.5 再傳入） */
 unitPrice: number
}): Promise<{ paymentId: string; receiptNumber: string | null }> {
 const cat = trialTypeCategory(params.trialType)
 if (cat !== "half" && cat !== "full") {
  throw new Error("僅半價／原價試堂需先收費")
 }
 const scheduleIds = await fetchConsecutiveScheduleIds(params.scheduleId)
 const lessons = Math.max(1, scheduleIds.length)
 const unit = Math.max(0, Number(params.unitPrice))
 const amount = Math.round(unit * lessons * 100) / 100
 if (amount <= 0) throw new Error("試堂金額須大於 0，請確認班別／課程每堂單價")

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
