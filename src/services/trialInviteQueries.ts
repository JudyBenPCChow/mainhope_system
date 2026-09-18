import { forEachIdChunk, DEFAULT_ID_CHUNK } from "@/lib/supabaseInChunks"
import { supabase } from "@/lib/supabaseClient"
import {
  aggregateRecentTrialSubjects,
  recentTrialSubjectCutoffYmd,
  type RecentTrialSessionInput,
} from "@/lib/trialInviteRecentSubjects"
import { trialInviteTypeOrDefault, type TrialInviteType } from "@/lib/trialInviteTypes"

export type TrialInviteTokenStatus =
  | "open"
  | "submitted"
  | "approved"
  | "expired"
  | "voided"

export type TrialInviteRequestStatus =
  | "submitted"
  | "approved"
  | "rejected"
  | "cancelled"

export type TrialInviteIdentity = {
  full_name: string
  student_code: string
  grade: string
  school: string
}

export type TrialInviteScheduleOption = {
  id: string
  scheduled_date: string
  start_time: string
  end_time: string
  session_number: number | null
}

export type TrialInviteClassOption = {
  id: string
  class_kind: "group" | "homework" | string
  subject: string
  subject_code: string
  subject_category: string
  course_code_full: string
  course_name: string
  teacher_name: string
  day_of_week: string
  time_slot: string
  schedules: TrialInviteScheduleOption[]
}

export type TrialInviteElectiveOption = {
  code: string
  name_zh: string
  short_name: string
  /** 目前學年有專科班（不問家長年級／該班是否納入試堂名單） */
  offered?: boolean
}

export type TrialInviteRequestLine = {
  id: string
  class_id: string
  schedule_id: string
  class_label: string
  scheduled_date: string | null
  start_time: string | null
  end_time: string | null
}

export type TrialInviteSubmittedRequest = {
  id: string
  status: TrialInviteRequestStatus
  parent_note: string | null
  elected_subject_codes: string[]
  created_at: string
  lines: TrialInviteRequestLine[]
}

export type TrialInviteTokenRow = {
  id: string
  token: string
  student_id: string
  status: TrialInviteTokenStatus
  trial_type: TrialInviteType
  expires_at: string
  submitted_at: string | null
  approved_at: string | null
  created_at: string
  reused?: boolean
}

export type TrialInvitePublicSession = TrialInviteTokenRow & {
  identity: TrialInviteIdentity
  classes: TrialInviteClassOption[]
  requires_elective_survey: boolean
  elective_subject_options: TrialInviteElectiveOption[]
  submitted_request: TrialInviteSubmittedRequest | null
}

export type TrialInviteRequestListRow = {
  id: string
  token_id: string
  student_id: string
  status: TrialInviteRequestStatus
  parent_note: string | null
  elected_subject_codes: string[]
  reject_reason: string | null
  trial_type: string | null
  counts_toward_headcount: boolean | null
  created_at: string
  reviewed_at: string | null
  lines: TrialInviteRequestLine[]
  student_name: string
  student_code: string
  student_grade: string
}

function rpcError(error: { message?: string } | null): Error {
  return new Error(error?.message ?? "操作失敗")
}

function asTokenRow(raw: Record<string, unknown>): TrialInviteTokenRow {
  return {
    id: String(raw.id ?? ""),
    token: String(raw.token ?? ""),
    student_id: String(raw.student_id ?? ""),
    status: String(raw.status ?? "open") as TrialInviteTokenStatus,
    trial_type: trialInviteTypeOrDefault(
      raw.trial_type != null ? String(raw.trial_type) : null
    ),
    expires_at: String(raw.expires_at ?? ""),
    submitted_at: raw.submitted_at != null ? String(raw.submitted_at) : null,
    approved_at: raw.approved_at != null ? String(raw.approved_at) : null,
    created_at: String(raw.created_at ?? ""),
    reused: raw.reused === true,
  }
}

function asSchedule(raw: Record<string, unknown>): TrialInviteScheduleOption {
  return {
    id: String(raw.id ?? ""),
    scheduled_date: String(raw.scheduled_date ?? "").slice(0, 10),
    start_time: String(raw.start_time ?? "").slice(0, 5),
    end_time: String(raw.end_time ?? "").slice(0, 5),
    session_number:
      raw.session_number == null || raw.session_number === ""
        ? null
        : Number(raw.session_number),
  }
}

function asClass(raw: Record<string, unknown>): TrialInviteClassOption {
  const schedulesRaw = Array.isArray(raw.schedules) ? raw.schedules : []
  return {
    id: String(raw.id ?? ""),
    class_kind: String(raw.class_kind ?? ""),
    subject: String(raw.subject ?? ""),
    subject_code: String(raw.subject_code ?? "").toUpperCase(),
    subject_category: String(raw.subject_category ?? "other"),
    course_code_full: String(raw.course_code_full ?? ""),
    course_name: String(raw.course_name ?? ""),
    teacher_name: String(raw.teacher_name ?? ""),
    day_of_week: String(raw.day_of_week ?? "").trim(),
    time_slot: String(raw.time_slot ?? "").trim(),
    schedules: schedulesRaw.map((s) =>
      asSchedule((s ?? {}) as Record<string, unknown>)
    ),
  }
}

function asElectiveOption(raw: Record<string, unknown>): TrialInviteElectiveOption {
  const name = String(raw.name_zh ?? "")
  return {
    code: String(raw.code ?? "").toUpperCase(),
    name_zh: name,
    short_name: String(raw.short_name ?? name),
    offered: raw.offered === true ? true : raw.offered === false ? false : undefined,
  }
}

function asStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((x) => String(x ?? "").trim().toUpperCase())
    .filter(Boolean)
}

function asLine(raw: Record<string, unknown>): TrialInviteRequestLine {
  return {
    id: String(raw.id ?? ""),
    class_id: String(raw.class_id ?? ""),
    schedule_id: String(raw.schedule_id ?? ""),
    class_label: String(raw.class_label ?? ""),
    scheduled_date:
      raw.scheduled_date != null ? String(raw.scheduled_date).slice(0, 10) : null,
    start_time: raw.start_time != null ? String(raw.start_time).slice(0, 5) : null,
    end_time: raw.end_time != null ? String(raw.end_time).slice(0, 5) : null,
  }
}

function asSubmittedRequest(raw: unknown): TrialInviteSubmittedRequest | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
  const o = raw as Record<string, unknown>
  const linesRaw = Array.isArray(o.lines) ? o.lines : []
  return {
    id: String(o.id ?? ""),
    status: String(o.status ?? "submitted") as TrialInviteRequestStatus,
    parent_note: o.parent_note != null ? String(o.parent_note) : null,
    elected_subject_codes: asStringArray(o.elected_subject_codes),
    created_at: String(o.created_at ?? ""),
    lines: linesRaw.map((l) => asLine((l ?? {}) as Record<string, unknown>)),
  }
}

export function trialInvitePublicUrl(token: string, origin = window.location.origin): string {
  return `${origin}/TrialInvite/${encodeURIComponent(token)}`
}

export async function createTrialInviteTokens(
  studentIds: string[],
  trialType: TrialInviteType
): Promise<TrialInviteTokenRow[]> {
  if (!supabase) throw new Error("Supabase 未設定")
  const ids = [...new Set(studentIds.map((id) => id.trim()).filter(Boolean))]
  if (ids.length === 0) return []

  const chunks = await forEachIdChunk(ids, DEFAULT_ID_CHUNK, async (slice) => {
    const { data, error } = await supabase!.rpc("trial_invite_create", {
      p_student_ids: slice,
      p_trial_type: trialType,
    })
    if (error) throw rpcError(error)
    const arr = Array.isArray(data) ? data : []
    return arr.map((row) => asTokenRow((row ?? {}) as Record<string, unknown>))
  })
  return chunks.flat()
}

export async function getTrialInviteSession(token: string): Promise<TrialInvitePublicSession> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { data, error } = await supabase.rpc("trial_invite_get", {
    p_token: token.trim(),
  })
  if (error) throw rpcError(error)
  const raw = (data ?? {}) as Record<string, unknown>
  const identityRaw =
    raw.identity && typeof raw.identity === "object" && !Array.isArray(raw.identity)
      ? (raw.identity as Record<string, unknown>)
      : {}
  const classesRaw = Array.isArray(raw.classes) ? raw.classes : []
  const electivesRaw = Array.isArray(raw.elective_subject_options)
    ? raw.elective_subject_options
    : []
  return {
    ...asTokenRow(raw),
    identity: {
      full_name: String(identityRaw.full_name ?? ""),
      student_code: String(identityRaw.student_code ?? ""),
      grade: String(identityRaw.grade ?? ""),
      school: String(identityRaw.school ?? ""),
    },
    requires_elective_survey: raw.requires_elective_survey === true,
    elective_subject_options: electivesRaw.map((e) =>
      asElectiveOption((e ?? {}) as Record<string, unknown>)
    ),
    classes: classesRaw.map((c) => asClass((c ?? {}) as Record<string, unknown>)),
    submitted_request: asSubmittedRequest(raw.submitted_request),
  }
}

export async function submitTrialInviteSession(
  token: string,
  lines: { class_id: string; schedule_id: string }[],
  parentNote?: string | null,
  electedSubjectCodes?: string[] | null
): Promise<TrialInvitePublicSession> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { data, error } = await supabase.rpc("trial_invite_submit", {
    p_token: token.trim(),
    p_lines: lines,
    p_parent_note: parentNote?.trim() || null,
    p_elected_subject_codes: electedSubjectCodes?.length
      ? electedSubjectCodes.map((c) => c.trim().toUpperCase()).filter(Boolean)
      : [],
  })
  if (error) throw rpcError(error)
  const raw = (data ?? {}) as Record<string, unknown>
  const identityRaw =
    raw.identity && typeof raw.identity === "object" && !Array.isArray(raw.identity)
      ? (raw.identity as Record<string, unknown>)
      : {}
  const classesRaw = Array.isArray(raw.classes) ? raw.classes : []
  const electivesRaw = Array.isArray(raw.elective_subject_options)
    ? raw.elective_subject_options
    : []
  return {
    ...asTokenRow(raw),
    identity: {
      full_name: String(identityRaw.full_name ?? ""),
      student_code: String(identityRaw.student_code ?? ""),
      grade: String(identityRaw.grade ?? ""),
      school: String(identityRaw.school ?? ""),
    },
    requires_elective_survey: raw.requires_elective_survey === true,
    elective_subject_options: electivesRaw.map((e) =>
      asElectiveOption((e ?? {}) as Record<string, unknown>)
    ),
    classes: classesRaw.map((c) => asClass((c ?? {}) as Record<string, unknown>)),
    submitted_request: asSubmittedRequest(raw.submitted_request),
  }
}

export async function voidTrialInviteToken(token: string): Promise<TrialInviteTokenRow> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { data, error } = await supabase.rpc("trial_invite_void", {
    p_token: token.trim(),
  })
  if (error) throw rpcError(error)
  return asTokenRow((data ?? {}) as Record<string, unknown>)
}

export async function reviewTrialInviteRequest(params: {
  requestId: string
  action: "approve" | "reject"
  countsTowardHeadcount?: boolean
  trialType?: string
  rejectReason?: string | null
}): Promise<{
  request_id: string
  status: string
  trial_sessions_created?: number
  trial_session_ids: string[]
}> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { data, error } = await supabase.rpc("trial_invite_review", {
    p_request_id: params.requestId,
    p_action: params.action,
    p_counts_toward_headcount:
      params.action === "approve" ? Boolean(params.countsTowardHeadcount) : null,
    p_trial_type: params.trialType ?? "免費試堂",
    p_reject_reason: params.rejectReason ?? null,
  })
  if (error) throw rpcError(error)
  const raw = (data ?? {}) as Record<string, unknown>
  const idsRaw = raw.trial_session_ids
  return {
    request_id: String(raw.request_id ?? ""),
    status: String(raw.status ?? ""),
    trial_sessions_created:
      raw.trial_sessions_created != null ? Number(raw.trial_sessions_created) : undefined,
    trial_session_ids: Array.isArray(idsRaw)
      ? idsRaw.map((id) => String(id)).filter(Boolean)
      : [],
  }
}

export async function fetchUnpaidInviteTrialIds(params: {
  studentId: string
  classIds: string[]
}): Promise<string[]> {
  if (!supabase) throw new Error("Supabase 未設定")
  const classIds = [...new Set(params.classIds.map((id) => id.trim()).filter(Boolean))]
  if (!params.studentId || classIds.length === 0) return []
  const { data, error } = await supabase
    .from("trial_sessions")
    .select("id, status, payment_id")
    .eq("student_id", params.studentId)
    .in("class_id", classIds)
    .is("payment_id", null)
    .eq("remarks", "試堂邀請核准")
  if (error) throw error
  return (data ?? [])
    .filter((row) => {
      const status = String((row as { status?: string }).status ?? "")
      return !status.includes("完成") && !status.includes("取消")
    })
    .map((row) => String((row as { id: string }).id))
}

function asEmbeddedRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function asRecentTrialSessionInput(raw: Record<string, unknown>): RecentTrialSessionInput | null {
  const studentId = String(raw.student_id ?? "").trim()
  if (!studentId) return null
  const cls = asEmbeddedRecord(raw.classes)
  const course = asEmbeddedRecord(cls?.courses)
  const subjectRow = asEmbeddedRecord(course?.subjects)
  return {
    studentId,
    trialDate: String(raw.trial_date ?? "").slice(0, 10),
    status: String(raw.status ?? ""),
    classKind: cls?.class_kind != null ? String(cls.class_kind) : "",
    subject: cls?.subject != null ? String(cls.subject) : "",
    subjectId: subjectRow?.id != null ? String(subjectRow.id) : null,
    subjectCode: subjectRow?.code != null ? String(subjectRow.code) : null,
  }
}

/** 職員名冊：半年內未取消的專科班／功課輔導班試堂科目（與公開目錄隱藏同一時間窗）。 */
export async function fetchRecentInviteTrialSubjects(): Promise<Map<string, string[]>> {
  if (!supabase) return new Map()
  const cutoff = recentTrialSubjectCutoffYmd()
  const { data, error } = await supabase
    .from("trial_sessions")
    .select(
      "student_id, trial_date, status, classes!inner ( class_kind, subject, courses ( subjects ( id, code ) ) )"
    )
    .gte("trial_date", cutoff)
    .not("status", "ilike", "%取消%")
    .in("classes.class_kind", ["group", "homework"])
  if (error) throw rpcError(error)
  const rows = (data ?? [])
    .map((row) => asRecentTrialSessionInput(row as Record<string, unknown>))
    .filter((row): row is RecentTrialSessionInput => row != null)
  return aggregateRecentTrialSubjects(rows, { cutoffYmd: cutoff })
}

export async function fetchTrialInviteTokensByStudentIds(
  studentIds: string[]
): Promise<TrialInviteTokenRow[]> {
  if (!supabase) throw new Error("Supabase 未設定")
  const ids = [...new Set(studentIds.map((id) => id.trim()).filter(Boolean))]
  if (ids.length === 0) return []

  const chunks = await forEachIdChunk(ids, DEFAULT_ID_CHUNK, async (slice) => {
    const { data, error } = await supabase!
      .from("trial_invite_tokens")
      .select("id, token, student_id, status, trial_type, expires_at, submitted_at, approved_at, created_at")
      .in("student_id", slice)
      .order("created_at", { ascending: false })
    if (error) throw rpcError(error)
    return (data ?? []).map((row) => asTokenRow(row as Record<string, unknown>))
  })

  const byStudent = new Map<string, TrialInviteTokenRow>()
  for (const row of chunks.flat()) {
    const prev = byStudent.get(row.student_id)
    if (!prev) {
      byStudent.set(row.student_id, row)
      continue
    }
    // Prefer active (open/submitted), else newest
    const prevActive = prev.status === "open" || prev.status === "submitted"
    const nextActive = row.status === "open" || row.status === "submitted"
    if (nextActive && !prevActive) byStudent.set(row.student_id, row)
  }
  return [...byStudent.values()]
}

export async function fetchTrialInviteRequests(
  statuses: TrialInviteRequestStatus[] = ["submitted"]
): Promise<TrialInviteRequestListRow[]> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { data, error } = await supabase
    .from("trial_invite_requests")
    .select(
      "id, token_id, student_id, status, parent_note, elected_subject_codes, reject_reason, trial_type, counts_toward_headcount, created_at, reviewed_at, trial_invite_request_lines ( id, class_id, schedule_id, class_label, schedules ( scheduled_date, start_time, end_time ) ), students ( full_name, student_code, grade )"
    )
    .in("status", statuses)
    .order("created_at", { ascending: true })
  if (error) throw rpcError(error)

  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>
    const student =
      r.students && typeof r.students === "object" && !Array.isArray(r.students)
        ? (r.students as Record<string, unknown>)
        : {}
    const linesRaw = Array.isArray(r.trial_invite_request_lines)
      ? r.trial_invite_request_lines
      : []
    return {
      id: String(r.id ?? ""),
      token_id: String(r.token_id ?? ""),
      student_id: String(r.student_id ?? ""),
      status: String(r.status ?? "submitted") as TrialInviteRequestStatus,
      parent_note: r.parent_note != null ? String(r.parent_note) : null,
      elected_subject_codes: asStringArray(r.elected_subject_codes),
      reject_reason: r.reject_reason != null ? String(r.reject_reason) : null,
      trial_type: r.trial_type != null ? String(r.trial_type) : null,
      counts_toward_headcount:
        r.counts_toward_headcount == null ? null : Boolean(r.counts_toward_headcount),
      created_at: String(r.created_at ?? ""),
      reviewed_at: r.reviewed_at != null ? String(r.reviewed_at) : null,
      student_name: String(student.full_name ?? ""),
      student_code: String(student.student_code ?? ""),
      student_grade: String(student.grade ?? ""),
      lines: linesRaw.map((ln) => {
        const l = (ln ?? {}) as Record<string, unknown>
        const sch =
          l.schedules && typeof l.schedules === "object" && !Array.isArray(l.schedules)
            ? (l.schedules as Record<string, unknown>)
            : {}
        return asLine({
          ...l,
          scheduled_date: sch.scheduled_date,
          start_time: sch.start_time,
          end_time: sch.end_time,
        })
      }),
    }
  })
}

export type TrialInviteCatalogScheduleControl = {
  id: string
  scheduledDate: string
  startTime: string
  endTime: string
  sessionNumber: number | null
  excluded: boolean
}

export type TrialInviteCatalogEnrolledStudent = {
  id: string
  fullName: string
  studentCode: string
}

export type TrialInviteCatalogClassControl = {
  id: string
  label: string
  classKind: string
  courseCodeFull: string
  listed: boolean
  teacherId: string | null
  dayOfWeek: string
  timeSlot: string
  enrolledStudents: TrialInviteCatalogEnrolledStudent[]
  schedules: TrialInviteCatalogScheduleControl[]
}

export type TrialInviteCatalogTeacherControl = {
  id: string | null
  name: string
  participating: boolean
  classes: TrialInviteCatalogClassControl[]
}

export type TrialInviteCatalogControls = {
  academicYearLabel: string
  teachers: TrialInviteCatalogTeacherControl[]
}

function classControlLabel(row: Record<string, unknown>): string {
  const course =
    row.courses && typeof row.courses === "object" && !Array.isArray(row.courses)
      ? (row.courses as Record<string, unknown>)
      : {}
  const courseName = String(course.course_name ?? "").trim()
  const subject = String(row.subject ?? "").trim()
  const code = String(row.course_code_full ?? "").trim()
  const base = courseName || subject || "未命名班別"
  return code ? `${base}（${code}）` : base
}

/** 目前學年的專科／功輔班＋未來堂次，供後台控管公開試堂名單。 */
export async function fetchTrialInviteCatalogControls(): Promise<TrialInviteCatalogControls> {
  if (!supabase) throw new Error("Supabase 未設定")

  const { data: yearRow, error: yearErr } = await supabase
    .from("academic_years")
    .select("id, label")
    .eq("is_current", true)
    .maybeSingle()
  if (yearErr) throw rpcError(yearErr)
  const academicYearId = yearRow?.id != null ? String(yearRow.id) : ""
  const academicYearLabel = yearRow?.label != null ? String(yearRow.label).trim() : ""
  if (!academicYearId || !academicYearLabel) {
    throw new Error("找不到目前學年")
  }

  const { data: classRows, error: classErr } = await supabase
    .from("classes")
    .select(
      "id, class_kind, subject, course_code_full, teacher_id, trial_invite_listed, status, day_of_week, time_slot, courses ( course_name ), teachers ( id, full_name, abbr, trial_invite_participating )"
    )
    .in("class_kind", ["group", "homework"])
    .eq("academic_year_id", academicYearId)
    .order("course_code_full", { ascending: true })
  if (classErr) throw rpcError(classErr)

  const classes = (classRows ?? [])
    .map((row) => row as Record<string, unknown>)
    .filter((row) => !String(row.status ?? "").includes("已結束"))

  const classIds = classes.map((c) => String(c.id))
  const scheduleByClass = new Map<string, TrialInviteCatalogScheduleControl[]>()
  const enrolledByClass = new Map<string, TrialInviteCatalogEnrolledStudent[]>()

  if (classIds.length > 0) {
    const today = new Date().toISOString().slice(0, 10)
    await Promise.all([
      forEachIdChunk(classIds, DEFAULT_ID_CHUNK, async (slice) => {
        const { data, error } = await supabase!
          .from("schedules")
          .select(
            "id, class_id, scheduled_date, start_time, end_time, session_number, status, trial_invite_excluded"
          )
          .in("class_id", slice)
          .gte("scheduled_date", today)
          .order("scheduled_date", { ascending: true })
          .order("start_time", { ascending: true })
        if (error) throw rpcError(error)
        for (const raw of data ?? []) {
          const s = raw as Record<string, unknown>
          if (String(s.status ?? "").includes("取消")) continue
          const classId = String(s.class_id ?? "")
          if (!classId) continue
          const list = scheduleByClass.get(classId) ?? []
          list.push({
            id: String(s.id),
            scheduledDate: String(s.scheduled_date ?? ""),
            startTime: String(s.start_time ?? "").slice(0, 5),
            endTime: String(s.end_time ?? "").slice(0, 5),
            sessionNumber: s.session_number != null ? Number(s.session_number) : null,
            excluded: Boolean(s.trial_invite_excluded),
          })
          scheduleByClass.set(classId, list)
        }
      }),
      forEachIdChunk(classIds, DEFAULT_ID_CHUNK, async (slice) => {
        const { data, error } = await supabase!
          .from("student_class_enrollments")
          .select("class_id, students ( id, full_name, student_code )")
          .in("class_id", slice)
          .eq("status", "就讀中")
        if (error) throw rpcError(error)
        for (const raw of data ?? []) {
          const r = raw as Record<string, unknown>
          const classId = String(r.class_id ?? "")
          if (!classId) continue
          const st =
            r.students && typeof r.students === "object" && !Array.isArray(r.students)
              ? (r.students as Record<string, unknown>)
              : null
          const fullName = String(st?.full_name ?? "").trim() || "—"
          const list = enrolledByClass.get(classId) ?? []
          list.push({
            id: String(st?.id ?? ""),
            fullName,
            studentCode: String(st?.student_code ?? "").trim(),
          })
          enrolledByClass.set(classId, list)
        }
      }),
    ])
    for (const list of enrolledByClass.values()) {
      list.sort((a, b) => a.fullName.localeCompare(b.fullName, "zh-Hant"))
    }
  }

  const byTeacher = new Map<string, TrialInviteCatalogTeacherControl>()

  for (const row of classes) {
    const teacher =
      row.teachers && typeof row.teachers === "object" && !Array.isArray(row.teachers)
        ? (row.teachers as Record<string, unknown>)
        : null
    const teacherId = row.teacher_id != null ? String(row.teacher_id) : null
    const key = teacherId ?? "__none__"
    let group = byTeacher.get(key)
    if (!group) {
      const abbr = teacher ? String(teacher.abbr ?? "").trim() : ""
      const fullName = teacher ? String(teacher.full_name ?? "").trim() : ""
      group = {
        id: teacherId,
        name: teacherId ? fullName || abbr || "未命名老師" : "未指定老師",
        participating: teacherId
          ? teacher?.trial_invite_participating !== false
          : true,
        classes: [],
      }
      byTeacher.set(key, group)
    }

    group.classes.push({
      id: String(row.id),
      label: classControlLabel(row),
      classKind: String(row.class_kind ?? ""),
      courseCodeFull: String(row.course_code_full ?? ""),
      listed: row.trial_invite_listed !== false,
      teacherId,
      dayOfWeek: String(row.day_of_week ?? "").trim(),
      timeSlot: String(row.time_slot ?? "").trim(),
      enrolledStudents: enrolledByClass.get(String(row.id)) ?? [],
      schedules: scheduleByClass.get(String(row.id)) ?? [],
    })
  }

  const teachers = [...byTeacher.values()].sort((a, b) => {
    if (a.id == null && b.id != null) return 1
    if (a.id != null && b.id == null) return -1
    return a.name.localeCompare(b.name, "zh-Hant")
  })
  return { academicYearLabel, teachers }
}

export async function setTrialInviteTeacherParticipating(
  teacherId: string,
  participating: boolean
): Promise<void> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { error } = await supabase.rpc("trial_invite_set_teacher_participating", {
    p_teacher_id: teacherId,
    p_participating: participating,
  })
  if (error) throw rpcError(error)
}

export async function setTrialInviteClassListed(
  classId: string,
  listed: boolean
): Promise<void> {
  await setTrialInviteClassesListed([classId], listed)
}

export async function setTrialInviteClassesListed(
  classIds: string[],
  listed: boolean
): Promise<number> {
  if (!supabase) throw new Error("Supabase 未設定")
  const ids = [...new Set(classIds.map((id) => id.trim()).filter(Boolean))]
  if (ids.length === 0) return 0
  const chunks = await forEachIdChunk(ids, DEFAULT_ID_CHUNK, async (slice) => {
    const { data, error } = await supabase!.rpc("trial_invite_set_classes_listed", {
      p_class_ids: slice,
      p_listed: listed,
    })
    if (error) throw rpcError(error)
    return Number(data ?? slice.length)
  })
  return chunks.reduce((sum, n) => sum + n, 0)
}

export async function setTrialInviteScheduleExcluded(
  scheduleId: string,
  excluded: boolean
): Promise<void> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { error } = await supabase.rpc("trial_invite_set_schedule_excluded", {
    p_schedule_id: scheduleId,
    p_excluded: excluded,
  })
  if (error) throw rpcError(error)
}
