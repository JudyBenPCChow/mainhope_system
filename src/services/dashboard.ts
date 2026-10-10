import { DEFAULT_ID_CHUNK, forEachIdChunk } from "@/lib/supabaseInChunks"
import { supabase } from "@/lib/supabaseClient"
import { classDisplayName, formatClassLabel } from "@/lib/courseLabel"
import { PAYMENT_STATUS } from "@/services/paymentQueries"

/** 首頁主欄：今日課堂卡片 */
export type DashboardTodayClassCard = {
 scheduleId: string
 className: string
 courseCode: string
 gradeLabel: string
 teacherName: string
 studentNamesLine: string
 classroomName: string
 timeRange: string
 status: string
}

export type DashboardTodayLeaveRow = {
 id: string
 studentId: string
 studentName: string
 studentGrade: string | null
 classLabel: string
 teacherName: string | null
 timeRange: string | null
 leaveReason: string | null
 scheduleId: string | null
}

export type AdminDashboardPayload = {
 /** 當日課堂數。查詢失敗為 null；成功且沒有堂為 0 */
 todayClassCount: number | null
 /** 狀態為「待收款」之筆數（未入帳）。查詢失敗為 null */
 pendingPaymentCount: number | null
 /** 查詢失敗為 null；成功且沒有堂為空陣列 */
 todayClassCards: DashboardTodayClassCard[] | null
 /** 查詢失敗為 null；成功且沒有請假為空陣列 */
 todayLeaves: DashboardTodayLeaveRow[] | null
 /** 僅供上報，畫面不顯示原文 */
 failureDetail: string | null
}

function localYmd(d = new Date()): string {
 const y = d.getFullYear()
 const m = String(d.getMonth() + 1).padStart(2, "0")
 const day = String(d.getDate()).padStart(2, "0")
 return `${y}-${m}-${day}`
}

function emptyPayload(): AdminDashboardPayload {
 return {
  todayClassCount: 0,
  pendingPaymentCount: 0,
  todayClassCards: [],
  todayLeaves: [],
  failureDetail: null,
 }
}

function failedPayload(detail: string): AdminDashboardPayload {
 return {
  todayClassCount: null,
  pendingPaymentCount: null,
  todayClassCards: null,
  todayLeaves: null,
  failureDetail: detail,
 }
}

function supabaseErrorMessage(error: unknown): string {
 if (error && typeof error === "object" && "message" in error) {
  return String((error as { message: unknown }).message)
 }
 return String(error)
}

function formatGrade(g: unknown): string {
 if (Array.isArray(g)) return g.filter((x) => x != null && String(x).trim() !== "").map(String).join("、")
 if (typeof g === "string" && g.trim()) return g
 return "—"
}

const SCHEDULE_BOARD_SELECT =
 "id, class_id, classroom_id, start_time, end_time, status, remarks, classes ( subject, course_code_full, grade, courses ( course_name ) ), teachers!schedules_teacher_id_fkey ( full_name ), classrooms ( name )"

async function loadEnrollmentNameMapForClassIds(
 classIds: string[]
): Promise<Map<string, string[]>> {
 const enrollMap = new Map<string, string[]>()
 if (!supabase || classIds.length === 0) return enrollMap

 try {
  const chunks = await forEachIdChunk(classIds, DEFAULT_ID_CHUNK, async (slice) => {
   const enrollRes = await supabase!
    .from("student_class_enrollments")
    .select("class_id, students ( full_name )")
    .eq("status", "就讀中")
    .in("class_id", slice)
   if (enrollRes.error) throw enrollRes.error
   return enrollRes.data ?? []
  })

  for (const data of chunks) {
   for (const er of data) {
    const row = er as Record<string, unknown>
    const cid = String(row.class_id)
    const st = row.students as Record<string, unknown> | null
    const name = st?.full_name != null ? String(st.full_name) : null
    if (!name) continue
    const arr = enrollMap.get(cid) ?? []
    arr.push(name)
    enrollMap.set(cid, arr)
   }
  }
 } catch (error) {
  console.warn("[dashboard] enrollments:", error instanceof Error ? error.message : error)
  return enrollMap
 }
 for (const [k, arr] of enrollMap) {
  arr.sort((a, b) => a.localeCompare(b, "zh-Hant"))
  enrollMap.set(k, arr)
 }
 return enrollMap
}

function mapScheduleRowsToDashboardClassCards(
 scheduleRows: Record<string, unknown>[],
 enrollMap: Map<string, string[]>
): DashboardTodayClassCard[] {
 return scheduleRows.map((row) => {
  const cls = row.classes as Record<string, unknown> | null | undefined
  const rem = row.remarks != null ? String(row.remarks).trim() : ""
  const sub = typeof cls?.subject === "string" ? cls.subject : rem || "課程"
  const code = typeof cls?.course_code_full === "string" ? cls.course_code_full : ""
  const course = cls?.courses as Record<string, unknown> | null
  const courseName = course?.course_name != null ? String(course.course_name) : null
  const className = classDisplayName({ subject: sub, courseName })
  const tch = row.teachers as Record<string, unknown> | null | undefined
  const teacherName = typeof tch?.full_name === "string" ? tch.full_name : "—"
  const room = row.classrooms as Record<string, unknown> | null | undefined
  const classroomName = typeof room?.name === "string" ? room.name : "未分配"
  const classIdRaw = row.class_id as string | null | undefined
  const classId = classIdRaw != null && classIdRaw !== "" ? String(classIdRaw) : null
  const names = classId ? enrollMap.get(classId) ?? [] : []
  const studentNamesLine = names.length ? names.join("、") : "—"
  const st = row.start_time != null ? String(row.start_time) : ""
  const en = row.end_time != null ? String(row.end_time) : ""
  const timeRange = st && en ? `${st} – ${en}` : st || en || "—"
  return {
   scheduleId: String(row.id),
   className,
   courseCode: code.trim(),
   gradeLabel: formatGrade(cls?.grade),
   teacherName,
   studentNamesLine,
   classroomName,
   timeRange,
   status: String(row.status ?? "正常"),
  }
 })
}

/** 指定日期之課堂卡片（行政首頁主欄換日檢視）。失敗時 ok 為 false，不當成當日沒有堂。 */
export async function fetchScheduleBoardForDate(
 ymd: string
): Promise<{ ok: true; todayClassCards: DashboardTodayClassCard[] } | { ok: false }> {
 if (!supabase) return { ok: true, todayClassCards: [] }
 try {
  const schedRes = await supabase
   .from("schedules")
   .select(SCHEDULE_BOARD_SELECT)
   .eq("scheduled_date", ymd)
   .order("start_time", { ascending: true })

  if (schedRes.error) {
   console.warn("[dashboard] schedules:", schedRes.error.message)
   return { ok: false }
  }

  const scheduleRows = (schedRes.data ?? []) as Record<string, unknown>[]
  const classIds = [
   ...new Set(
    scheduleRows
     .map((r) => r.class_id as string | null | undefined)
     .filter((x): x is string => x != null && x !== "")
   ),
  ]
  const enrollMap = await loadEnrollmentNameMapForClassIds(classIds)
  return {
   ok: true,
   todayClassCards: mapScheduleRowsToDashboardClassCards(scheduleRows, enrollMap),
  }
 } catch (e) {
  console.error("[dashboard] fetchScheduleBoardForDate", e)
  return { ok: false }
 }
}

function mapLeaveDashboardRow(r: Record<string, unknown>): DashboardTodayLeaveRow {
 const st = r.students as Record<string, unknown> | null
 const cls = r.classes as Record<string, unknown> | null
 const tch = cls?.teachers as Record<string, unknown> | null | undefined
 const sc = r.schedules as Record<string, unknown> | null
 const stt = sc?.start_time != null ? String(sc.start_time) : ""
 const en = sc?.end_time != null ? String(sc.end_time) : ""
 const sub = typeof cls?.subject === "string" ? cls.subject : "—"
 const code = typeof cls?.course_code_full === "string" ? cls.course_code_full : ""
 const course = cls?.courses as Record<string, unknown> | null
 const courseName = course?.course_name != null ? String(course.course_name) : null
 return {
  id: String(r.id),
  studentId: String(r.student_id),
  studentName: st?.full_name != null ? String(st.full_name) : "—",
  studentGrade: st?.grade != null ? String(st.grade) : null,
  classLabel: formatClassLabel({ subject: sub, courseCode: code, courseName }),
  teacherName: tch?.full_name != null ? String(tch.full_name) : null,
  timeRange: stt && en ? `${stt}–${en}` : stt || en || null,
  leaveReason: r.leave_reason != null ? String(r.leave_reason) : null,
  scheduleId: r.schedule_id != null ? String(r.schedule_id) : null,
 }
}

/** 行政首頁：今日課堂、今日請假、待收款筆數 */
export async function fetchAdminDashboard(): Promise<AdminDashboardPayload> {
 if (!supabase) return emptyPayload()

 const today = localYmd()

 try {
  const leaveSelect =
   "id, student_id, class_id, schedule_id, leave_date, leave_reason, students ( full_name, grade ), classes ( subject, course_code_full, courses ( course_name ), teachers ( full_name ) ), schedules!leave_makeup_records_schedule_id_fkey ( scheduled_date, start_time, end_time )"

  const [pendingPayCountRes, schedTodayRes, leaveTodayRes] = await Promise.all([
   supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("status", PAYMENT_STATUS.pendingReceive),
   supabase
    .from("schedules")
    .select(SCHEDULE_BOARD_SELECT)
    .eq("scheduled_date", today)
    .order("start_time", { ascending: true }),
   supabase.from("leave_makeup_records").select(leaveSelect).eq("leave_date", today),
  ])

  const failureNotes: string[] = []

  let todayClassCards: DashboardTodayClassCard[] | null = null
  let todayClassCount: number | null = null
  let scheduleRows: Record<string, unknown>[] = []
  if (schedTodayRes.error) {
   const msg = supabaseErrorMessage(schedTodayRes.error)
   console.error("[dashboard] supabase:", msg)
   failureNotes.push(msg)
   failureNotes.push("當日排程未能載入，請假名單未一併顯示")
  } else {
   scheduleRows = (schedTodayRes.data ?? []) as Record<string, unknown>[]
   const classIds = [
    ...new Set(
     scheduleRows
      .map((r) => r.class_id as string | null | undefined)
      .filter((x): x is string => x != null && x !== "")
    ),
   ]
   const enrollMap = await loadEnrollmentNameMapForClassIds(classIds)
   todayClassCards = mapScheduleRowsToDashboardClassCards(scheduleRows, enrollMap)
   todayClassCount = todayClassCards.length
  }

  let pendingPaymentCount: number | null = null
  if (pendingPayCountRes.error) {
   const msg = supabaseErrorMessage(pendingPayCountRes.error)
   console.error("[dashboard] supabase:", msg)
   failureNotes.push(msg)
  } else {
   pendingPaymentCount = pendingPayCountRes.count ?? 0
  }

  let todayLeaves: DashboardTodayLeaveRow[] | null = null
  if (!schedTodayRes.error) {
   if (leaveTodayRes.error) {
    const msg = supabaseErrorMessage(leaveTodayRes.error)
    console.error("[dashboard] supabase:", msg)
    failureNotes.push(msg)
   } else {
    const scheduleIdsToday = scheduleRows.map((r) => String(r.id))
    const leaveSchedRes =
     scheduleIdsToday.length > 0
      ? await supabase.from("leave_makeup_records").select(leaveSelect).in("schedule_id", scheduleIdsToday)
      : { data: [] as Record<string, unknown>[], error: null }

    if (leaveSchedRes.error) {
     const msg = supabaseErrorMessage(leaveSchedRes.error)
     console.error("[dashboard] supabase:", msg)
     failureNotes.push(msg)
    } else {
     const leaveById = new Map<string, Record<string, unknown>>()
     for (const row of (leaveTodayRes.data ?? []) as Record<string, unknown>[]) {
      leaveById.set(String(row.id), row)
     }
     for (const row of (leaveSchedRes.data ?? []) as Record<string, unknown>[]) {
      leaveById.set(String(row.id), row)
     }
     todayLeaves = [...leaveById.values()]
      .map(mapLeaveDashboardRow)
      .sort((a, b) => a.studentName.localeCompare(b.studentName, "zh-Hant"))
    }
   }
  }

  return {
   todayClassCount,
   pendingPaymentCount,
   todayClassCards,
   todayLeaves,
   failureDetail: failureNotes.length > 0 ? failureNotes.join("；") : null,
  }
 } catch (e) {
  console.error("[dashboard]", e)
  return failedPayload(e instanceof Error ? e.message : String(e))
 }
}
