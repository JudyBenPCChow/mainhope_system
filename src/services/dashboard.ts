import {
 intervalsOverlapMinutes,
 LESSON_SLOT_DURATION_MIN,
 LESSON_SLOT_INDICES,
 lessonSlotEndMinute,
 lessonSlotStartMinute,
 parseHm,
} from "@/lib/lessonSlots"
import { supabase } from "@/lib/supabaseClient"
import { PAYMENT_STATUS } from "@/services/paymentQueries"

export type UnpaidRow = {
 id: string
 studentName: string
 paymentDate: string
 amount: number
}

export type TodayScheduleRow = {
 id: string
 title: string
 timeRange: string
 teacherName: string
 status: string
}

export type RecentPaymentRow = {
 id: string
 studentName: string
 paymentDate: string
 method: string
 amount: number
 status: string
}

export type RevenueBar = { label: string; amount: number }

export type StatusSlice = { status: string; count: number; className: string }

/** 首頁左欄：今日課堂卡片 */
export type DashboardTodayClassCard = {
 scheduleId: string
 className: string
 gradeLabel: string
 teacherName: string
 studentNamesLine: string
 classroomName: string
 timeRange: string
 status: string
}

export type DashboardTodoItem = {
 id: string
 title: string
 notes: string | null
}

/** 首頁課室空缺：每欄對應一間課室，occupied 與預設堂數格（09:00 起每格 75 分鐘）對齊 */
export type DashboardRoomVacancyColumn = {
 roomId: string
 roomName: string
 occupied: boolean[]
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
 todayClassCount: number
 /** 狀態為「待繳費」之筆數（出單／通知單；不含「待收款」） */
 pendingPaymentCount: number
 monthRevenue: number
 unpaid: UnpaidRow[]
 unpaidTotal: number
 todaySchedules: TodayScheduleRow[]
 recentPayments: RecentPaymentRow[]
 revenueBars: RevenueBar[]
 studentStatusSlices: StatusSlice[]
 todayClassCards: DashboardTodayClassCard[]
 todosToday: DashboardTodoItem[]
 roomVacancy: DashboardRoomVacancyColumn[]
 todayLeaves: DashboardTodayLeaveRow[]
}

function localYmd(d = new Date()): string {
 const y = d.getFullYear()
 const m = String(d.getMonth() + 1).padStart(2, "0")
 const day = String(d.getDate()).padStart(2, "0")
 return `${y}-${m}-${day}`
}

function firstDayOfMonth(d = new Date()): string {
 return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`
}

function lastDayOfMonth(d = new Date()): string {
 const y = d.getFullYear()
 const mi = d.getMonth()
 const last = new Date(y, mi + 1, 0).getDate()
 return `${y}-${String(mi + 1).padStart(2, "0")}-${String(last).padStart(2, "0")}`
}

function monthKey(d: Date): string {
 return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function emptyPayload(): AdminDashboardPayload {
 return {
  todayClassCount: 0,
  pendingPaymentCount: 0,
  monthRevenue: 0,
  unpaid: [],
  unpaidTotal: 0,
  todaySchedules: [],
  recentPayments: [],
  revenueBars: [],
  studentStatusSlices: [],
  todayClassCards: [],
  todosToday: [],
  roomVacancy: [],
  todayLeaves: [],
 }
}

function pickStudentName(row: Record<string, unknown>): string {
 const s = row.students as Record<string, unknown> | null | undefined
 if (s && typeof s.full_name === "string") return s.full_name
 return "（未知學生）"
}

function formatGrade(g: unknown): string {
 if (Array.isArray(g)) return g.filter((x) => x != null && String(x).trim() !== "").map(String).join("、")
 if (typeof g === "string" && g.trim()) return g
 return "—"
}

/** 排程時段與預設堂數格是否重疊（無結束時間時假設為 75 分鐘堂） */
function scheduleOverlapsLessonSlot(
 start: string | null,
 end: string | null,
 slotIndex: number
): boolean {
 const a = parseHm(start)
 if (a == null) return false
 let b = parseHm(end)
 if (b == null) b = a + LESSON_SLOT_DURATION_MIN
 if (b <= a) b = a + LESSON_SLOT_DURATION_MIN
 const s0 = lessonSlotStartMinute(slotIndex)
 const s1 = lessonSlotEndMinute(slotIndex)
 return intervalsOverlapMinutes(a, b, s0, s1)
}

const SCHEDULE_BOARD_SELECT =
 "id, class_id, classroom_id, start_time, end_time, status, remarks, classes ( subject, course_code, grade ), teachers ( full_name ), classrooms ( name )"

async function loadEnrollmentNameMapForClassIds(
 classIds: string[]
): Promise<Map<string, string[]>> {
 const enrollMap = new Map<string, string[]>()
 if (!supabase || classIds.length === 0) return enrollMap

 const enrollRes = await supabase
  .from("student_class_enrollments")
  .select("class_id, students ( full_name )")
  .eq("status", "就讀中")
  .in("class_id", classIds)

 if (enrollRes.error) {
  console.warn("[dashboard] enrollments:", enrollRes.error.message)
  return enrollMap
 }

 for (const er of enrollRes.data ?? []) {
  const row = er as Record<string, unknown>
  const cid = String(row.class_id)
  const st = row.students as Record<string, unknown> | null
  const name = st?.full_name != null ? String(st.full_name) : null
  if (!name) continue
  const arr = enrollMap.get(cid) ?? []
  arr.push(name)
  enrollMap.set(cid, arr)
 }
 for (const [k, arr] of enrollMap) {
  arr.sort((a, b) => a.localeCompare(b, "zh-Hant"))
  enrollMap.set(k, arr)
 }
 return enrollMap
}

function mapScheduleRowsToTodaySchedules(
 scheduleRows: Record<string, unknown>[]
): TodayScheduleRow[] {
 return scheduleRows.map((row: Record<string, unknown>) => {
  const cls = row.classes as Record<string, unknown> | null | undefined
  const sub =
   typeof cls?.subject === "string"
    ? cls.subject
    : typeof row.remarks === "string" && row.remarks.trim()
     ? row.remarks.trim()
     : "課程"
  const code = typeof cls?.course_code === "string" ? cls.course_code : ""
  const title = code ? `${sub}（${code}）` : sub
  const tch = row.teachers as Record<string, unknown> | null | undefined
  const teacherName = typeof tch?.full_name === "string" ? tch.full_name : "—"
  const st = row.start_time != null ? String(row.start_time) : ""
  const en = row.end_time != null ? String(row.end_time) : ""
  const timeRange = st && en ? `${st} – ${en}` : st || en || "—"
  return {
   id: String(row.id),
   title,
   timeRange,
   teacherName,
   status: String(row.status ?? "預定"),
  }
 })
}

function mapScheduleRowsToDashboardClassCards(
 scheduleRows: Record<string, unknown>[],
 enrollMap: Map<string, string[]>
): DashboardTodayClassCard[] {
 return scheduleRows.map((row) => {
  const cls = row.classes as Record<string, unknown> | null | undefined
  const rem = row.remarks != null ? String(row.remarks).trim() : ""
  const sub = typeof cls?.subject === "string" ? cls.subject : rem || "課程"
  const code = typeof cls?.course_code === "string" ? cls.course_code : ""
  const className = code ? `${sub}（${code}）` : sub
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
   gradeLabel: formatGrade(cls?.grade),
   teacherName,
   studentNamesLine,
   classroomName,
   timeRange,
   status: String(row.status ?? "預定"),
  }
 })
}

/** 指定日期之課堂卡片（管理員首頁左欄換日檢視） */
export async function fetchScheduleBoardForDate(ymd: string): Promise<{
 todayClassCards: DashboardTodayClassCard[]
}> {
 if (!supabase) return { todayClassCards: [] }
 try {
  const schedRes = await supabase
   .from("schedules")
   .select(SCHEDULE_BOARD_SELECT)
   .eq("scheduled_date", ymd)
   .order("start_time", { ascending: true })

  if (schedRes.error) {
   console.warn("[dashboard] schedules:", schedRes.error.message)
   return { todayClassCards: [] }
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
   todayClassCards: mapScheduleRowsToDashboardClassCards(scheduleRows, enrollMap),
  }
 } catch (e) {
  console.error("[dashboard] fetchScheduleBoardForDate", e)
  return { todayClassCards: [] }
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
 const code = typeof cls?.course_code === "string" ? cls.course_code : ""
 return {
  id: String(r.id),
  studentId: String(r.student_id),
  studentName: st?.full_name != null ? String(st.full_name) : "—",
  studentGrade: st?.grade != null ? String(st.grade) : null,
  classLabel: code ? `${sub}（${code}）` : sub,
  teacherName: tch?.full_name != null ? String(tch.full_name) : null,
  timeRange: stt && en ? `${stt}–${en}` : stt || en || null,
  leaveReason: r.leave_reason != null ? String(r.leave_reason) : null,
  scheduleId: r.schedule_id != null ? String(r.schedule_id) : null,
 }
}

/** 管理員首頁儀表板：併行查詢 Supabase；未設定或錯誤時回傳空資料 */
export async function fetchAdminDashboard(): Promise<AdminDashboardPayload> {
 if (!supabase) return emptyPayload()

 const today = localYmd()
 const pStart = firstDayOfMonth()
 const pEnd = lastDayOfMonth()
 const chartAnchor = new Date()
 chartAnchor.setMonth(chartAnchor.getMonth() - 5)
 chartAnchor.setDate(1)
 const chartStart = `${chartAnchor.getFullYear()}-${String(chartAnchor.getMonth() + 1).padStart(2, "0")}-01`

 try {
  const leaveSelect =
   "id, student_id, class_id, schedule_id, leave_date, leave_reason, students ( full_name, grade ), classes ( subject, course_code, teachers ( full_name ) ), schedules!leave_makeup_records_schedule_id_fkey ( scheduled_date, start_time, end_time )"

  const [
   todaySchedCountRes,
   pendingPayCountRes,
   unpaidPendingCountRes,
   monthPayRes,
   unpaidListRes,
   schedTodayRes,
   recentPayRes,
   allStudentsRes,
   paidForChartRes,
   classroomsTop4Res,
   todosRes,
   leaveTodayRes,
  ] = await Promise.all([
   supabase
    .from("schedules")
    .select("id", { count: "exact", head: true })
    .eq("scheduled_date", today),
   supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("status", PAYMENT_STATUS.pendingPay),
   supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .or(`status.eq.${PAYMENT_STATUS.pendingPay},status.eq.${PAYMENT_STATUS.pendingReceive}`),
   supabase
    .from("payments")
    .select("total_amount")
    .eq("status", "已收款")
    .gte("payment_date", pStart)
    .lte("payment_date", pEnd),
   supabase
    .from("payments")
    .select("id, payment_date, total_amount, status, students ( full_name )")
    .or("status.eq.待收款,status.eq.待繳費")
    .order("payment_date", { ascending: true })
    .limit(20),
   supabase
    .from("schedules")
    .select(SCHEDULE_BOARD_SELECT)
    .eq("scheduled_date", today)
    .order("start_time", { ascending: true }),
   supabase
    .from("payments")
    .select(
     "id, payment_date, total_amount, payment_method, status, students ( full_name )"
    )
    .order("payment_date", { ascending: false })
    .limit(8),
   supabase.from("students").select("status"),
   supabase
    .from("payments")
    .select("payment_date, total_amount")
    .eq("status", "已收款")
    .gte("payment_date", chartStart)
    .limit(800),
   supabase.from("classrooms").select("id, name").order("name", { ascending: true }).limit(4),
   supabase
    .from("calendar_events")
    .select("id, title, description")
    .eq("event_date", today)
    .neq("status", "cancelled")
    .order("all_day", { ascending: false })
    .order("start_time", { ascending: true })
    .limit(30),
   supabase.from("leave_makeup_records").select(leaveSelect).eq("leave_date", today),
  ])

  const scheduleRows = (schedTodayRes.data ?? []) as Record<string, unknown>[]
  const scheduleIdsToday = scheduleRows.map((r) => String(r.id))

  const leaveSchedRes =
   scheduleIdsToday.length > 0
    ? await supabase.from("leave_makeup_records").select(leaveSelect).in("schedule_id", scheduleIdsToday)
    : { data: [] as Record<string, unknown>[], error: null }

  const classIds = [
   ...new Set(
    scheduleRows
     .map((r) => r.class_id as string | null | undefined)
     .filter((x): x is string => x != null && x !== "")
   ),
  ]

  const enrollMap = await loadEnrollmentNameMapForClassIds(classIds)

  const todayClassCount = todaySchedCountRes.count ?? 0
  const pendingPaymentCount = pendingPayCountRes.count ?? 0

  let monthRevenue = 0
  if (monthPayRes.data) {
   for (const r of monthPayRes.data) {
    const n = Number((r as { total_amount?: unknown }).total_amount ?? 0)
    if (!Number.isNaN(n)) monthRevenue += n
   }
  }

  const unpaidRows = (unpaidListRes.data ?? []) as Record<string, unknown>[]
  const unpaid: UnpaidRow[] = unpaidRows.map((row) => ({
   id: String(row.id),
   studentName: pickStudentName(row),
   paymentDate: String(row.payment_date ?? ""),
   amount: Number(row.total_amount ?? 0),
  }))
  const unpaidTotal = unpaidPendingCountRes.count ?? unpaid.length

  const todaySchedules = mapScheduleRowsToTodaySchedules(scheduleRows)
  const todayClassCards = mapScheduleRowsToDashboardClassCards(scheduleRows, enrollMap)

  let todosToday: DashboardTodoItem[] = []
  if (!todosRes.error && todosRes.data) {
   todosToday = (todosRes.data as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    title: String(row.title ?? ""),
    notes: row.description != null ? String(row.description) : null,
   }))
  } else if (todosRes.error) {
   console.warn("[dashboard] calendar_events:", todosRes.error.message)
  }

  const topRooms = (classroomsTop4Res.data ?? []) as { id: string; name: string }[]
  const roomVacancy: DashboardRoomVacancyColumn[] = topRooms.map((room) => ({
   roomId: room.id,
   roomName: room.name,
   occupied: LESSON_SLOT_INDICES.map((slotIndex) =>
    scheduleRows.some((row) => {
     if (String(row.classroom_id ?? "") !== room.id) return false
     if (String(row.status ?? "").includes("取消")) return false
     return scheduleOverlapsLessonSlot(
      row.start_time != null ? String(row.start_time) : null,
      row.end_time != null ? String(row.end_time) : null,
      slotIndex
     )
    })
   ),
  }))

  const leaveById = new Map<string, Record<string, unknown>>()
  for (const row of (leaveTodayRes.data ?? []) as Record<string, unknown>[]) {
   leaveById.set(String(row.id), row)
  }
  for (const row of (leaveSchedRes.data ?? []) as Record<string, unknown>[]) {
   leaveById.set(String(row.id), row)
  }
  const todayLeaves = [...leaveById.values()]
   .map(mapLeaveDashboardRow)
   .sort((a, b) => a.studentName.localeCompare(b.studentName, "zh-Hant"))

  const recentPayments: RecentPaymentRow[] = (recentPayRes.data ?? []).map(
   (row: Record<string, unknown>) => ({
    id: String(row.id),
    studentName: pickStudentName(row),
    paymentDate: String(row.payment_date ?? ""),
    method: String(row.payment_method ?? "—"),
    amount: Number(row.total_amount ?? 0),
    status: String(row.status ?? ""),
   })
  )

  // 近 6 個月已收款（依 payment_date 加總）
  const buckets = new Map<string, number>()
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
   const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
   buckets.set(monthKey(d), 0)
  }
  if (paidForChartRes.data) {
   for (const r of paidForChartRes.data as { payment_date?: string; total_amount?: unknown }[]) {
    if (!r.payment_date) continue
    const key = r.payment_date.slice(0, 7)
    if (!buckets.has(key)) continue
    const n = Number(r.total_amount ?? 0)
    if (!Number.isNaN(n)) buckets.set(key, (buckets.get(key) ?? 0) + n)
   }
  }
  const revenueBars: RevenueBar[] = [...buckets.entries()].map(([k, amount]) => {
   const [, m] = k.split("-")
   const mi = Number(m)
   return { label: `${mi}月`, amount }
  })

  const statusColors: Record<string, string> = {
   就讀中: "bg-emerald-500",
   休學: "bg-amber-500",
   退學: "bg-red-500",
   畢業: "bg-sky-400",
   "查詢/試堂": "bg-sky-500",
  }
  const statusCounts = new Map<string, number>()
  if (allStudentsRes.data) {
   for (const r of allStudentsRes.data as { status?: string }[]) {
    const st = r.status ?? "未標示"
    statusCounts.set(st, (statusCounts.get(st) ?? 0) + 1)
   }
  }
  const primarySet = new Set(["就讀中", "休學", "退學", "畢業"])
  const primaryStatuses = ["就讀中", "休學", "退學", "畢業"] as const
  const studentStatusSlices: StatusSlice[] = primaryStatuses.map((st) => ({
   status: st,
   count: statusCounts.get(st) ?? 0,
   className: statusColors[st] ?? "bg-slate-400",
  }))
  for (const [st, c] of statusCounts) {
   if (!primarySet.has(st) && c > 0) {
    studentStatusSlices.push({ status: st, count: c, className: "bg-slate-400" })
   }
  }

  const errs = [
   todaySchedCountRes.error,
   pendingPayCountRes.error,
   unpaidPendingCountRes.error,
   monthPayRes.error,
   unpaidListRes.error,
   schedTodayRes.error,
   recentPayRes.error,
   allStudentsRes.error,
   paidForChartRes.error,
   classroomsTop4Res.error,
   leaveTodayRes.error,
   leaveSchedRes.error,
  ].filter(Boolean)
  if (errs.length) {
   for (const e of errs) {
    const msg = e && typeof e === "object" && "message" in e ? String(e.message) : String(e)
    console.error("[dashboard] supabase:", msg)
   }
  }

  return {
   todayClassCount,
   pendingPaymentCount,
   monthRevenue,
   unpaid,
   unpaidTotal,
   todaySchedules,
   recentPayments,
   revenueBars,
   studentStatusSlices,
   todayClassCards,
   todosToday,
   roomVacancy,
   todayLeaves,
  }
 } catch (e) {
  console.error("[dashboard]", e)
  return emptyPayload()
 }
}
