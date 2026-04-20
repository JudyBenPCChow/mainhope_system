import {
  academicYearLabelFromStartDate,
  coalesceCourseCodeForDb,
  courseCodePrefix,
  gradeChineseToCode,
  incrementCourseCodeSeed,
  normalizeCourseCode,
  subjectChineseToAbbr,
  validateCourseCode,
} from "@/lib/courseCode"
import { supabase } from "@/lib/supabaseClient"
import { logMgmtAuditAction } from "@/services/mgmtGodViewQueries"
import { pickStudentContactRaw } from "@/lib/whatsappReminder"
import { fetchRosterForRollCall, fetchTrialStudentsForSchedule } from "@/services/attendanceQueries"

export type ClassRecord = {
  id: string
  course_code: string | null
  subject: string
  grade: string[] | null
  day_of_week: string | null
  time_slot: string | null
  teacher_id: string | null
  teacher_name: string | null
  classroom_id: string | null
  classroom_name: string | null
  capacity: number | null
  price_per_lesson: number | null
  start_date: string | null
  end_date: string | null
  status: string
  created_at: string
  updated_at: string
}

function mapClassRow(row: Record<string, unknown>): ClassRecord {
  const t = row.teachers as { id?: string; full_name?: string } | null
  const r = row.classrooms as { id?: string; name?: string } | null
  const g = row.grade
  return {
    id: String(row.id),
    course_code: row.course_code != null ? String(row.course_code) : null,
    subject: String(row.subject ?? ""),
    grade: Array.isArray(g) ? (g as string[]) : null,
    day_of_week: row.day_of_week != null ? String(row.day_of_week) : null,
    time_slot: row.time_slot != null ? String(row.time_slot) : null,
    teacher_id: row.teacher_id != null ? String(row.teacher_id) : null,
    teacher_name: t?.full_name ?? null,
    classroom_id: row.classroom_id != null ? String(row.classroom_id) : null,
    classroom_name: r?.name ?? null,
    capacity: row.capacity != null ? Number(row.capacity) : null,
    price_per_lesson: row.price_per_lesson != null ? Number(row.price_per_lesson) : null,
    start_date: row.start_date != null ? String(row.start_date) : null,
    end_date: row.end_date != null ? String(row.end_date) : null,
    status: String(row.status ?? "進行中"),
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  }
}

export async function fetchAllClasses(): Promise<ClassRecord[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from("classes")
    .select("*, teachers ( id, full_name ), classrooms ( id, name )")
    .order("course_code", { ascending: true })
  if (error) throw error
  return (data ?? []).map((x) => mapClassRow(x as Record<string, unknown>))
}

export async function getClassById(id: string): Promise<ClassRecord | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from("classes")
    .select("*, teachers ( id, full_name ), classrooms ( id, name )")
    .eq("id", id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return mapClassRow(data as Record<string, unknown>)
}

async function fetchNextSeedForCoursePrefix(prefix: string): Promise<number> {
  if (!supabase) return 1000
  const { data, error } = await supabase.from("classes").select("course_code").like("course_code", `${prefix}%`)
  if (error) throw error
  let max = 999
  for (const r of data ?? []) {
    const code = (r as { course_code?: string | null }).course_code
    if (code == null) continue
    const s = String(code)
    if (!s.startsWith(prefix)) continue
    const tail = s.slice(prefix.length)
    if (/^\d{4}$/.test(tail)) max = Math.max(max, Number(tail))
  }
  return Math.min(Math.max(max + 1, 1000), 9999)
}

async function allocateDuplicateCourseCode(src: ClassRecord): Promise<string | null> {
  const normalized = normalizeCourseCode(src.course_code)
  if (normalized && validateCourseCode(normalized).ok) {
    const bumped = incrementCourseCodeSeed(normalized)
    if (bumped) return bumped
  }
  const year = academicYearLabelFromStartDate(src.start_date)
  const g0 = src.grade?.[0]
  const gradeCode = g0 ? gradeChineseToCode(g0) : null
  const abbr = subjectChineseToAbbr(src.subject)
  if (!gradeCode || !abbr) return null
  const prefix = courseCodePrefix(year, gradeCode, abbr)
  const next = await fetchNextSeedForCoursePrefix(prefix)
  return `${prefix}${String(next).padStart(4, "0")}`
}

export async function insertClass(
  row: Partial<ClassRecord> & { subject: string }
): Promise<ClassRecord> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { data, error } = await supabase
    .from("classes")
    .insert({
      subject: row.subject,
      course_code: coalesceCourseCodeForDb(row.course_code ?? null),
      grade: row.grade ?? null,
      day_of_week: row.day_of_week ?? null,
      time_slot: row.time_slot ?? null,
      teacher_id: row.teacher_id ?? null,
      classroom_id: row.classroom_id ?? null,
      capacity: row.capacity ?? null,
      price_per_lesson: row.price_per_lesson ?? null,
      start_date: row.start_date ?? null,
      end_date: row.end_date ?? null,
      status: row.status ?? "進行中",
    })
    .select("*, teachers ( id, full_name ), classrooms ( id, name )")
    .single()
  if (error) throw error
  return mapClassRow(data as Record<string, unknown>)
}

export async function updateClass(
  id: string,
  patch: Partial<Omit<ClassRecord, "id" | "created_at" | "teacher_name" | "classroom_name">>
): Promise<ClassRecord> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { teacher_name: _tn, classroom_name: _cn, id: _id, created_at: _ca, ...rest } =
    patch as Record<string, unknown>
  const payload: Record<string, unknown> = { ...rest, updated_at: new Date().toISOString() }
  if ("course_code" in patch) {
    payload.course_code = coalesceCourseCodeForDb(patch.course_code ?? null)
  }
  const { data, error } = await supabase
    .from("classes")
    .update(payload)
    .eq("id", id)
    .select("*, teachers ( id, full_name ), classrooms ( id, name )")
    .single()
  if (error) throw error
  return mapClassRow(data as Record<string, unknown>)
}

export async function deleteClass(id: string): Promise<void> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { error } = await supabase.from("classes").delete().eq("id", id)
  if (error) throw error
}

export async function duplicateClass(id: string): Promise<ClassRecord> {
  const src = await getClassById(id)
  if (!src) throw new Error("找不到班別")
  const newCode = await allocateDuplicateCourseCode(src)
  if (!newCode) {
    throw new Error(
      "無法自動產生新課程編號：請確認原班有合法編號可遞增種子，或已設定「年級／科目」以利依簡稱產生編號。"
    )
  }
  return insertClass({
    subject: src.subject,
    course_code: newCode,
    grade: src.grade,
    day_of_week: src.day_of_week,
    time_slot: src.time_slot,
    teacher_id: src.teacher_id,
    classroom_id: src.classroom_id,
    capacity: src.capacity,
    price_per_lesson: src.price_per_lesson,
    start_date: src.start_date,
    end_date: src.end_date,
    status: src.status,
  })
}

export type ClassStudentRow = {
  enrollmentId: string
  studentId: string
  fullName: string
  grade: string | null
  school: string | null
  enrollDate: string | null
  status: string
  contactPhone: string | null
}

export async function fetchClassStudents(classId: string): Promise<ClassStudentRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from("student_class_enrollments")
    .select("id, status, enroll_date, student_id, students ( full_name, grade, school, whatsapp, parent_phone )")
    .eq("class_id", classId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>
    const st = r.students as Record<string, unknown> | null
    return {
      enrollmentId: String(r.id),
      studentId: String(r.student_id),
      fullName: st?.full_name != null ? String(st.full_name) : "—",
      grade: st?.grade != null ? String(st.grade) : null,
      school: st?.school != null ? String(st.school) : null,
      enrollDate: r.enroll_date != null ? String(r.enroll_date) : null,
      status: String(r.status ?? "就讀中"),
      contactPhone: pickStudentContactRaw({
        whatsapp: st?.whatsapp != null ? String(st.whatsapp) : null,
        parent_phone: st?.parent_phone != null ? String(st.parent_phone) : null,
      }),
    }
  })
}

export type ClassScheduleRow = {
  id: string
  scheduled_date: string
  start_time: string | null
  end_time: string | null
  status: string
}

export async function fetchClassSchedules(classId: string): Promise<ClassScheduleRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from("schedules")
    .select("id, scheduled_date, start_time, end_time, status")
    .eq("class_id", classId)
    .order("scheduled_date", { ascending: true })
    .order("start_time", { ascending: true })
  if (error) throw error
  return (data ?? []).map((r) => {
    const row = r as Record<string, unknown>
    return {
      id: String(row.id),
      scheduled_date: String(row.scheduled_date ?? ""),
      start_time: row.start_time != null ? String(row.start_time) : null,
      end_time: row.end_time != null ? String(row.end_time) : null,
      status: String(row.status ?? "預定"),
    }
  })
}

export async function insertScheduleRow(opts: {
  class_id: string | null
  teacher_id: string | null
  scheduled_date: string
  start_time?: string | null
  end_time?: string | null
  status?: string
  classroom_id?: string | null
  remarks?: string | null
}): Promise<string> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { data, error } = await supabase
    .from("schedules")
    .insert({
      class_id: opts.class_id,
      teacher_id: opts.teacher_id,
      classroom_id: opts.classroom_id ?? null,
      scheduled_date: opts.scheduled_date,
      start_time: opts.start_time ?? null,
      end_time: opts.end_time ?? null,
      status: opts.status ?? "預定",
      remarks: opts.remarks ?? null,
    })
    .select("id")
    .single()
  if (error) throw error
  const id = String((data as { id: string }).id)
  void logMgmtAuditAction({
    action: "新增排程",
    detail: `schedule_id=${id}; class_id=${opts.class_id ?? "null"}; date=${opts.scheduled_date}`,
  })
  return id
}

export async function insertScheduleForClass(
  classId: string,
  teacherId: string | null,
  row: {
    scheduled_date: string
    start_time?: string | null
    end_time?: string | null
    status?: string
    classroom_id?: string | null
  }
): Promise<void> {
  await insertScheduleRow({
    class_id: classId,
    teacher_id: teacherId,
    scheduled_date: row.scheduled_date,
    start_time: row.start_time,
    end_time: row.end_time,
    status: row.status,
    classroom_id: row.classroom_id,
  })
}

export async function updateSchedule(
  id: string,
  patch: Partial<{
    status: string
    start_time: string | null
    end_time: string | null
    classroom_id: string | null
    remarks: string | null
  }>
): Promise<void> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { error } = await supabase
    .from("schedules")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) throw error
  void logMgmtAuditAction({
    action: "更新排程",
    detail: `schedule_id=${id}; patch=${JSON.stringify(patch)}`,
  })
}

export async function deleteSchedule(id: string): Promise<void> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { error } = await supabase.from("schedules").delete().eq("id", id)
  if (error) throw error
  void logMgmtAuditAction({
    action: "刪除排程",
    detail: `schedule_id=${id}`,
  })
}

export type ScheduleDetailRecord = {
  id: string
  scheduled_date: string
  start_time: string | null
  end_time: string | null
  status: string
  remarks: string | null
  class_id: string | null
  class_subject: string
  course_code: string | null
  teacher_id: string | null
  teacher_name: string | null
  classroom_id: string | null
  classroom_name: string | null
  /** 課室是否標為線上（網課） */
  classroom_is_online: boolean
}

export type ScheduleDetailStudent = {
  studentId: string
  fullName: string
  englishName: string | null
  /** 就讀中優先；其餘為當日紀錄中出現的學生 */
  source: "就讀" | "試堂" | "當日紀錄"
  contactPhone: string | null
}

export type ScheduleDetailLeaveRow = {
  id: string
  studentId: string
  studentName: string
  leaveReason: string | null
  makeupType: string | null
  makeupScheduleId: string | null
  status: string
  linkedToThisSchedule: boolean
}

export type ScheduleDetailMakeupHereRow = {
  leaveId: string
  studentId: string
  studentName: string
  leaveDate: string
  makeupType: string | null
  status: string
}

export type ScheduleDetailAttendanceRow = {
  studentId: string
  studentName: string
  status: string
  remarks: string | null
}

export type ScheduleDetailContext = {
  students: ScheduleDetailStudent[]
  leaves: ScheduleDetailLeaveRow[]
  makeupsHere: ScheduleDetailMakeupHereRow[]
  attendance: ScheduleDetailAttendanceRow[]
}

export const EMPTY_SCHEDULE_DETAIL_CONTEXT: ScheduleDetailContext = {
  students: [],
  leaves: [],
  makeupsHere: [],
  attendance: [],
}

/** 排程詳情頁：學生、請假、來此補堂、當日出勤列 */
export async function fetchScheduleDetailContext(
  scheduleId: string,
  classId: string,
  lessonDate: string
): Promise<ScheduleDetailContext> {
  const empty: ScheduleDetailContext = {
    students: [],
    leaves: [],
    makeupsHere: [],
    attendance: [],
  }
  if (!supabase) return empty

  const orFilter = `schedule_id.eq.${scheduleId},and(class_id.eq.${classId},leave_date.eq.${lessonDate})`

  const [roster, trials, leavesRes, makeupsRes, attRes] = await Promise.all([
    fetchRosterForRollCall(classId),
    fetchTrialStudentsForSchedule(scheduleId),
    supabase
      .from("leave_makeup_records")
      .select(
        "id, student_id, schedule_id, leave_date, leave_reason, makeup_type, makeup_schedule_id, status, students ( full_name, english_name )"
      )
      .or(orFilter)
      .order("created_at", { ascending: true }),
    supabase
      .from("leave_makeup_records")
      .select(
        "id, student_id, leave_date, leave_reason, makeup_type, status, students ( full_name, english_name )"
      )
      .eq("makeup_schedule_id", scheduleId)
      .order("leave_date", { ascending: true }),
    supabase
      .from("attendance_details")
      .select("student_id, status, remarks, students ( full_name, english_name )")
      .eq("class_id", classId)
      .eq("attendance_date", lessonDate)
      .order("created_at", { ascending: true }),
  ])

  if (leavesRes.error) throw leavesRes.error
  if (makeupsRes.error) throw makeupsRes.error
  if (attRes.error) throw attRes.error

  type Src = ScheduleDetailStudent["source"]
  const rank = (s: Src) => (s === "就讀" ? 0 : s === "試堂" ? 1 : 2)

  const byId = new Map<string, ScheduleDetailStudent>()

  const upsertStudent = (
    studentId: string,
    fullName: string,
    englishName: string | null,
    source: Src,
    contactPhone: string | null = null
  ) => {
    const prev = byId.get(studentId)
    if (!prev) {
      byId.set(studentId, { studentId, fullName, englishName, source, contactPhone })
      return
    }
    const phone = contactPhone || prev.contactPhone || null
    if (rank(source) < rank(prev.source)) {
      byId.set(studentId, { studentId, fullName, englishName, source, contactPhone: phone })
    } else {
      byId.set(studentId, { ...prev, contactPhone: phone })
    }
  }

  for (const r of roster) {
    upsertStudent(r.studentId, r.fullName, r.englishName, "就讀", r.contactPhone)
  }
  for (const t of trials) {
    upsertStudent(t.studentId, t.fullName, t.englishName, "試堂", t.contactPhone)
  }

  const leaves = (leavesRes.data ?? []).map((row) => {
    const r = row as Record<string, unknown>
    const st = r.students as Record<string, unknown> | null
    const sid = String(r.student_id)
    const name = st?.full_name != null ? String(st.full_name) : "—"
    const en = st?.english_name != null ? String(st.english_name) : null
    upsertStudent(sid, name, en, "當日紀錄", null)
    return {
      id: String(r.id),
      studentId: sid,
      studentName: name,
      leaveReason: r.leave_reason != null ? String(r.leave_reason) : null,
      makeupType: r.makeup_type != null ? String(r.makeup_type) : null,
      makeupScheduleId: r.makeup_schedule_id != null ? String(r.makeup_schedule_id) : null,
      status: String(r.status ?? ""),
      linkedToThisSchedule: r.schedule_id != null ? String(r.schedule_id) === scheduleId : false,
    }
  })

  const makeupsHere = (makeupsRes.data ?? []).map((row) => {
    const r = row as Record<string, unknown>
    const st = r.students as Record<string, unknown> | null
    const sid = String(r.student_id)
    const name = st?.full_name != null ? String(st.full_name) : "—"
    const en = st?.english_name != null ? String(st.english_name) : null
    upsertStudent(sid, name, en, "當日紀錄", null)
    return {
      leaveId: String(r.id),
      studentId: sid,
      studentName: name,
      leaveDate: String(r.leave_date ?? ""),
      makeupType: r.makeup_type != null ? String(r.makeup_type) : null,
      status: String(r.status ?? ""),
    }
  })

  const attendance = (attRes.data ?? []).map((row) => {
    const r = row as Record<string, unknown>
    const st = r.students as Record<string, unknown> | null
    const sid = String(r.student_id)
    const name = st?.full_name != null ? String(st.full_name) : "—"
    const en = st?.english_name != null ? String(st.english_name) : null
    upsertStudent(sid, name, en, "當日紀錄", null)
    return {
      studentId: sid,
      studentName: name,
      status: String(r.status ?? ""),
      remarks: r.remarks != null ? String(r.remarks) : null,
    }
  })

  const students = [...byId.values()].sort((a, b) =>
    a.fullName.localeCompare(b.fullName, "zh-Hant")
  )

  return { students, leaves, makeupsHere, attendance }
}

export async function getScheduleById(id: string): Promise<ScheduleDetailRecord | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from("schedules")
    .select(
      "id, scheduled_date, start_time, end_time, status, remarks, class_id, teacher_id, classroom_id, classes ( subject, course_code ), teachers ( full_name ), classrooms ( id, name, is_online )"
    )
    .eq("id", id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const r = data as Record<string, unknown>
  const cls = r.classes as Record<string, unknown> | null
  const tch = r.teachers as Record<string, unknown> | null
  const crm = r.classrooms as Record<string, unknown> | null
  const cid = r.class_id != null ? String(r.class_id) : null
  return {
    id: String(r.id),
    scheduled_date: String(r.scheduled_date ?? ""),
    start_time: r.start_time != null ? String(r.start_time) : null,
    end_time: r.end_time != null ? String(r.end_time) : null,
    status: String(r.status ?? ""),
    remarks: r.remarks != null ? String(r.remarks) : null,
    class_id: cid,
    class_subject: cls?.subject != null ? String(cls.subject) : "—",
    course_code: cls?.course_code != null ? String(cls.course_code) : null,
    teacher_id: r.teacher_id != null ? String(r.teacher_id) : null,
    teacher_name: tch?.full_name != null ? String(tch.full_name) : null,
    classroom_id: r.classroom_id != null ? String(r.classroom_id) : null,
    classroom_name: crm?.name != null ? String(crm.name) : null,
    classroom_is_online: Boolean(crm?.is_online),
  }
}

export async function fetchTeacherOptions(): Promise<{ id: string; label: string }[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from("teachers").select("id, full_name").order("full_name")
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: String((r as { id: string }).id),
    label: String((r as { full_name: string }).full_name),
  }))
}

export async function fetchClassroomOptions(): Promise<{ id: string; label: string }[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from("classrooms").select("id, name").order("name")
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: String((r as { id: string }).id),
    label: String((r as { name: string }).name),
  }))
}
