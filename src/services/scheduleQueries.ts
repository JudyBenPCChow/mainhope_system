import { supabase } from "@/lib/supabaseClient"
import { addDaysYmd, localYmd } from "@/services/teacherQueries"

export type ScheduleManageRow = {
  id: string
  scheduled_date: string
  start_time: string | null
  end_time: string | null
  status: string
  remarks: string | null
  class_id: string | null
  subject: string
  course_code: string | null
  /** 班別固定上課日（來自 classes.day_of_week） */
  class_day_of_week: string | null
  /** 班別固定時段（來自 classes.time_slot） */
  class_time_slot: string | null
  teacher_id: string | null
  teacher_name: string | null
  classroom_id: string | null
  classroom_name: string | null
  enrollCount: number
}

export type ScheduleAlerts = {
  trial: boolean
  makeup: boolean
  leave: boolean
  record: boolean
}

function mapScheduleRow(
  row: Record<string, unknown>,
  enrollMap: Map<string, number>
): ScheduleManageRow {
  const cls = row.classes as Record<string, unknown> | null
  const tch = row.teachers as Record<string, unknown> | null
  const rm = row.classrooms as Record<string, unknown> | null
  const cidRaw = row.class_id
  const cid = cidRaw != null ? String(cidRaw) : null
  return {
    id: String(row.id),
    scheduled_date: String(row.scheduled_date ?? ""),
    start_time: row.start_time != null ? String(row.start_time) : null,
    end_time: row.end_time != null ? String(row.end_time) : null,
    status: String(row.status ?? "預定"),
    remarks: row.remarks != null ? String(row.remarks) : null,
    class_id: cid,
    subject: cls?.subject != null ? String(cls.subject) : "（無班別）",
    course_code: cls?.course_code != null ? String(cls.course_code) : null,
    class_day_of_week: cls?.day_of_week != null ? String(cls.day_of_week) : null,
    class_time_slot: cls?.time_slot != null ? String(cls.time_slot) : null,
    teacher_id: row.teacher_id != null ? String(row.teacher_id) : null,
    teacher_name: tch?.full_name != null ? String(tch.full_name) : null,
    classroom_id: row.classroom_id != null ? String(row.classroom_id) : null,
    classroom_name: rm?.name != null ? String(rm.name) : null,
    enrollCount: cid ? enrollMap.get(cid) ?? 0 : 0,
  }
}

export async function fetchEnrollmentCountByClass(classIds: string[]): Promise<Map<string, number>> {
  const m = new Map<string, number>()
  if (!supabase || classIds.length === 0) return m
  const { data, error } = await supabase
    .from("student_class_enrollments")
    .select("class_id")
    .in("class_id", classIds)
    .eq("status", "就讀中")
  if (error) throw error
  for (const row of data ?? []) {
    const cid = String((row as { class_id: string }).class_id)
    m.set(cid, (m.get(cid) ?? 0) + 1)
  }
  return m
}

export async function fetchSchedulesInRange(
  fromYmd: string,
  toYmd: string,
  opts?: { teacherId?: string | null }
): Promise<ScheduleManageRow[]> {
  if (!supabase) return []
  let q = supabase
    .from("schedules")
    .select(
      "id, scheduled_date, start_time, end_time, status, remarks, class_id, teacher_id, classroom_id, classes ( subject, course_code, day_of_week, time_slot ), teachers ( full_name ), classrooms ( name )"
    )
    .gte("scheduled_date", fromYmd)
    .lte("scheduled_date", toYmd)
  if (opts?.teacherId) q = q.eq("teacher_id", opts.teacherId)
  const { data, error } = await q.order("scheduled_date", { ascending: true }).order("start_time", { ascending: true })
  if (error) throw error
  const rows = (data ?? []) as Record<string, unknown>[]
  const classIds = [
    ...new Set(
      rows
        .map((r) => (r.class_id != null ? String(r.class_id) : null))
        .filter((x): x is string => x != null)
    ),
  ]
  const enrollMap = await fetchEnrollmentCountByClass(classIds)
  return rows.map((r) => mapScheduleRow(r, enrollMap))
}

export async function fetchScheduleAlerts(
  schedules: { id: string; class_id: string | null; scheduled_date: string }[]
): Promise<Map<string, ScheduleAlerts>> {
  const map = new Map<string, ScheduleAlerts>()
  for (const s of schedules) {
    map.set(s.id, { trial: false, makeup: false, leave: false, record: false })
  }
  if (!supabase || schedules.length === 0) return map

  const ids = schedules.map((s) => s.id)
  const dates = [...new Set(schedules.map((s) => s.scheduled_date))]
  const classIds = [...new Set(schedules.map((s) => s.class_id).filter((x): x is string => x != null))]

  const [trialsRes, leavesLinkedRes, leavesOrphanRes, remarksRes] = await Promise.all([
    supabase.from("trial_sessions").select("schedule_id").in("schedule_id", ids),
    supabase
      .from("leave_makeup_records")
      .select("schedule_id, makeup_type, status, leave_reason")
      .in("schedule_id", ids),
    classIds.length
      ? supabase
          .from("leave_makeup_records")
          .select("class_id, leave_date, leave_reason, makeup_type, schedule_id, status")
          .in("leave_date", dates)
          .in("class_id", classIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[], error: null as null }),
    supabase.from("schedules").select("id, remarks").in("id", ids),
  ])

  for (const row of trialsRes.data ?? []) {
    const sid = String((row as { schedule_id: string }).schedule_id)
    const a = map.get(sid)
    if (a) a.trial = true
  }

  for (const row of leavesLinkedRes.data ?? []) {
    const sid = String((row as { schedule_id: string }).schedule_id)
    const a = map.get(sid)
    if (!a) continue
    a.leave = true
    const makeupType = String((row as { makeup_type?: string }).makeup_type ?? "")
    const st = String((row as { status?: string }).status ?? "")
    const reason = String((row as { leave_reason?: string }).leave_reason ?? "")
    if (makeupType.includes("補") || st.includes("補") || reason.includes("補堂")) a.makeup = true
  }

  for (const row of leavesOrphanRes.data ?? []) {
    const r = row as {
      class_id: string
      leave_date: string
      schedule_id: string | null
      leave_reason?: string | null
      makeup_type?: string | null
      status?: string | null
    }
    if (r.schedule_id) continue
    const reason = String(r.leave_reason ?? "")
    const mk = String(r.makeup_type ?? "")
    const st = String(r.status ?? "")
    for (const s of schedules) {
      if (!s.class_id || s.class_id !== r.class_id || s.scheduled_date !== r.leave_date) continue
      const a = map.get(s.id)
      if (!a) continue
      if (reason.includes("病") || reason.includes("事假") || reason.includes("請假") || reason.includes("假")) {
        a.leave = true
      }
      if (mk.includes("補") || st.includes("補") || reason.includes("補")) a.makeup = true
    }
  }

  for (const row of remarksRes.data ?? []) {
    const r = row as { id: string; remarks: string | null }
    const rem = r.remarks ?? ""
    if (rem.includes("錄影") || rem.includes("錄像") || rem.includes("錄音")) {
      const a = map.get(String(r.id))
      if (a) a.record = true
    }
  }

  return map
}

export type ScheduleStatsSnapshot = {
  todayLessonCount: number
  pendingCancelledCount: number
  todayStudentHeadcount: number
}

/** 儀表板數字：以「今天」為準，與目前列表日期區間無關；專班老師可傳 teacherId 僅計自己的排程 */
export async function fetchScheduleStatsSnapshot(teacherId?: string | null): Promise<ScheduleStatsSnapshot> {
  const empty: ScheduleStatsSnapshot = {
    todayLessonCount: 0,
    pendingCancelledCount: 0,
    todayStudentHeadcount: 0,
  }
  if (!supabase) return empty

  const today = localYmd()

  const [todayLessons, pendingCancel, todaySchedRows] = await Promise.all([
    (() => {
      let q = supabase
        .from("schedules")
        .select("id", { count: "exact", head: true })
        .eq("scheduled_date", today)
        .not("status", "ilike", "%取消%")
      if (teacherId) q = q.eq("teacher_id", teacherId)
      return q
    })(),
    (() => {
      let q = supabase
        .from("schedules")
        .select("id", { count: "exact", head: true })
        .gte("scheduled_date", today)
        .ilike("status", "%取消%")
      if (teacherId) q = q.eq("teacher_id", teacherId)
      return q
    })(),
    (() => {
      let q = supabase
        .from("schedules")
        .select("class_id")
        .eq("scheduled_date", today)
        .not("status", "ilike", "%取消%")
      if (teacherId) q = q.eq("teacher_id", teacherId)
      return q
    })(),
  ])

  const classIds = [
    ...new Set(
      (todaySchedRows.data ?? [])
        .map((r) => (r as { class_id: string | null }).class_id)
        .filter((x): x is string => x != null && x !== "")
    ),
  ]
  const enrollMap = await fetchEnrollmentCountByClass(classIds)
  let todayStudentHeadcount = 0
  for (const cid of classIds) {
    todayStudentHeadcount += enrollMap.get(cid) ?? 0
  }

  return {
    todayLessonCount: todayLessons.count ?? 0,
    pendingCancelledCount: pendingCancel.count ?? 0,
    todayStudentHeadcount,
  }
}

export function scheduleRangeEnd(startYmd: string, daysInclusive: number): string {
  return addDaysYmd(startYmd, daysInclusive - 1)
}

export { localYmd }
