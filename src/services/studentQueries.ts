import { normalizeStudentGrade } from "@/lib/studentGrade"
import { classDisplayName, formatClassLabel } from "@/lib/courseLabel"
import { DEFAULT_ID_CHUNK, forEachIdChunk } from "@/lib/supabaseInChunks"
import {
 ENROLLMENT_PERIOD_OPTIONS,
 enrollmentVisibleOnSchedule,
 fetchAcademicYearPeriods,
 fetchClassEnrollmentConfig,
 formatEnrollmentFormLabel,
 isSingleSessionEnrollment,
 isSummerTwoPeriodMode,
 normalizeEnrollmentPeriod,
 resolvePeriodCodeFromDate,
 resolvePriceForEnrollment,
 type EnrollmentFormValue,
 type EnrollmentPeriod,
 type CourseMode,
} from "@/lib/enrollmentPeriod"
import {
 LESSON_SLOT_DURATION_MIN,
 intervalsOverlapMinutes,
 parseHm,
} from "@/lib/lessonSlots"
import { resolveClassKind } from "@/lib/privateClassKind"
import { fetchSessionNumbersByEnrollmentIds } from "@/services/enrollmentSessionQueries"
import { supabase } from "@/lib/supabaseClient"
import { assertClassRecordEditable } from "@/lib/academicYearEditGuard"

function coerceStudentGrade(raw: string | null | undefined): string | null {
 return normalizeStudentGrade(raw)
}

function localYmd(d = new Date()): string {
 const y = d.getFullYear()
 const m = String(d.getMonth() + 1).padStart(2, "0")
 const day = String(d.getDate()).padStart(2, "0")
 return `${y}-${m}-${day}`
}

export type StudentRecord = {
 id: string
 old_student_id: string | null
 student_code: string | null
 full_name: string
 english_name: string | null
 gender: string | null
 date_of_birth: string | null
 grade: string | null
 school: string | null
 registration_status: "已註冊" | "非注冊"
 enrollment_status: "在讀" | "非在讀"
 activity_status: "活躍生" | "非活躍生"
 academic_stage: "中學階段" | "已畢業"
 status: string | null
 parent_name: string | null
 parent_relationship: string | null
 parent_phone: string | null
 parent_phone_country_code: string | null
 student_phone: string | null
 student_phone_country_code: string | null
 whatsapp: string | null
 preferred_contact_method: string | null
 address: string | null
 remarks: string | null
 /** Phase 2 代理人；今次僅預留欄位 */
 assigned_agent_user_id: string | null
 created_at: string
 updated_at: string
}

export const PHONE_COUNTRY_CODES = ["+852", "+86"] as const
export const PREFERRED_CONTACT_METHODS = ["WhatsApp", "WeChat"] as const

export function normalizePhoneCountryCode(value: string | null | undefined): "+852" | "+86" {
 return value === "+86" ? "+86" : "+852"
}

export function registrationStatusLabel(value: "已註冊" | "非注冊"): string {
 return value === "非注冊" ? "非注冊（試堂／查詢）" : "注冊"
}

export function normalizeRegistrationStatus(value: string | null | undefined): "已註冊" | "非注冊" {
 const s = (value ?? "").trim()
 if (/非注冊|僅查詢|查詢|試堂/.test(s)) return "非注冊"
 return "已註冊"
}

export function normalizeEnrollmentStatus(value: string | null | undefined): "在讀" | "非在讀" {
 const s = (value ?? "").trim()
 if (/非在讀|休學|退學|退選|離校/.test(s)) return "非在讀"
 if (/在讀|就讀/.test(s)) return "在讀"
 return "非在讀"
}

export function normalizeActivityStatus(value: string | null | undefined): "活躍生" | "非活躍生" {
 const s = (value ?? "").trim()
 if (/非活躍/.test(s)) return "非活躍生"
 if (/活躍/.test(s)) return "活躍生"
 return "非活躍生"
}

export function normalizeAcademicStage(value: string | null | undefined): "中學階段" | "已畢業" {
 const s = (value ?? "").trim()
 if (/畢業/.test(s) && !/階段/.test(s)) return "已畢業"
 if (s === "中學中") return "中學階段"
 return "中學階段"
}

/** @deprecated 請改用四維分類欄位；保留供舊儀表板／匯入相容 */
export function normalizeStudentStatus(status: string | null): "在讀" | "非在讀" | "非注冊" | "已畢業" {
 const s = (status ?? "").trim()
 if (!s) return "在讀"
 if (/非注冊|查詢|試堂/.test(s)) return "非注冊"
 if (/畢業/.test(s)) return "已畢業"
 if (/非在讀|休學|退學|退選|離校/.test(s)) return "非在讀"
 return "在讀"
}

function threeMonthsAgoYmd(): string {
 const d = new Date()
 d.setMonth(d.getMonth() - 3)
 return localYmd(d)
}

type EnrollmentStateRow = {
 status: string
 enroll_date: string | null
 created_at: string
}

function enrollmentEventYmd(row: EnrollmentStateRow): string {
 const enroll = (row.enroll_date ?? "").trim()
 if (enroll) return enroll.slice(0, 10)
 return (row.created_at ?? "").slice(0, 10)
}

function computeDerivedFromEnrollments(
 registration_status: "已註冊" | "非注冊",
 academic_stage: "中學階段" | "已畢業",
 enrollments: EnrollmentStateRow[]
): {
 enrollment_status: "在讀" | "非在讀"
 activity_status: "活躍生" | "非活躍生"
 status: string
} {
 const recentCutoff = threeMonthsAgoYmd()
 const hasActiveEnrollment = enrollments.some((row) => row.status === "就讀中")
 const hasRecentEnrollment = enrollments.some((row) => enrollmentEventYmd(row) >= recentCutoff)
 let enrollment_status: "在讀" | "非在讀" = hasActiveEnrollment ? "在讀" : "非在讀"
 const activity_status: "活躍生" | "非活躍生" = hasRecentEnrollment ? "活躍生" : "非活躍生"
 if (registration_status === "非注冊") enrollment_status = "非在讀"
 return {
  enrollment_status,
  activity_status,
  status: deriveDisplayStatus({ registration_status, enrollment_status, academic_stage }),
 }
}

function inferStateFromLegacy(status: string | null, grade: string | null | undefined): {
 registration_status: "已註冊" | "非注冊"
 enrollment_status: "在讀" | "非在讀"
 activity_status: "活躍生" | "非活躍生"
 academic_stage: "中學階段" | "已畢業"
} {
 const g = (grade ?? "").trim().toUpperCase()
 const s = normalizeStudentStatus(status)
 if (g === "NA" || g === "GD" || s === "已畢業") {
  return {
   registration_status: "已註冊",
   enrollment_status: "非在讀",
   activity_status: "非活躍生",
   academic_stage: "已畢業",
  }
 }
 if (s === "非注冊") {
  return {
   registration_status: "非注冊",
   enrollment_status: "非在讀",
   activity_status: "非活躍生",
   academic_stage: "中學階段",
  }
 }
 if (s === "在讀") {
  return {
   registration_status: "已註冊",
   enrollment_status: "在讀",
   activity_status: "非活躍生",
   academic_stage: "中學階段",
  }
 }
 return {
  registration_status: "已註冊",
  enrollment_status: "非在讀",
  activity_status: "非活躍生",
  academic_stage: "中學階段",
 }
}

function deriveDisplayStatus(input: {
 registration_status: "已註冊" | "非注冊"
 enrollment_status: "在讀" | "非在讀"
 academic_stage: "中學階段" | "已畢業"
}): string {
 if (input.academic_stage === "已畢業") return "已畢業"
 if (input.registration_status === "非注冊") return "非注冊"
 if (input.enrollment_status === "在讀") return "在讀"
 return "非在讀"
}

const ENROLLMENT_STATE_SELECT = "status, enroll_date, created_at"

async function syncStudentEnrollmentState(studentId: string): Promise<void> {
 if (!supabase) return
 const [{ data: studentRow, error: sErr }, { data: enrRows, error: eErr }] = await Promise.all([
  supabase.from("students").select("registration_status, academic_stage").eq("id", studentId).maybeSingle(),
  supabase.from("student_class_enrollments").select(ENROLLMENT_STATE_SELECT).eq("student_id", studentId),
 ])
 if (sErr) throw sErr
 if (eErr) throw eErr
 if (!studentRow) return

 const registration_status = normalizeRegistrationStatus(
  String((studentRow as Record<string, unknown>).registration_status ?? "已註冊")
 )
 const academic_stage = normalizeAcademicStage(
  String((studentRow as Record<string, unknown>).academic_stage ?? "中學階段")
 )
 const derived = computeDerivedFromEnrollments(
  registration_status,
  academic_stage,
  (enrRows ?? []) as unknown as EnrollmentStateRow[]
 )

 const { error: uErr } = await supabase
  .from("students")
  .update({
   enrollment_status: derived.enrollment_status,
   activity_status: derived.activity_status,
   status: derived.status,
   updated_at: new Date().toISOString(),
  })
  .eq("id", studentId)
 if (uErr) throw uErr
}

function normalizeStudentState(input: {
 registration_status: string | null | undefined
 enrollment_status: string | null | undefined
 activity_status: string | null | undefined
 academic_stage: string | null | undefined
}): {
 registration_status: "已註冊" | "非注冊"
 enrollment_status: "在讀" | "非在讀"
 activity_status: "活躍生" | "非活躍生"
 academic_stage: "中學階段" | "已畢業"
} {
 const registration = normalizeRegistrationStatus(input.registration_status)
 let enrollment = normalizeEnrollmentStatus(input.enrollment_status)
 const activity = normalizeActivityStatus(input.activity_status)
 const stage = normalizeAcademicStage(input.academic_stage)
 if (registration === "非注冊") enrollment = "非在讀"
 return {
  registration_status: registration,
  enrollment_status: enrollment,
  activity_status: activity,
  academic_stage: stage,
 }
}

function asStudent(row: Record<string, unknown>): StudentRecord {
 const grade = coerceStudentGrade(row.grade != null ? String(row.grade) : null)
 const inferred = inferStateFromLegacy(
  row.status != null ? String(row.status) : null,
  grade
 )
 const state = normalizeStudentState({
  registration_status:
   row.registration_status != null ? String(row.registration_status) : inferred.registration_status,
  enrollment_status:
   row.enrollment_status != null ? String(row.enrollment_status) : inferred.enrollment_status,
  activity_status:
   row.activity_status != null ? String(row.activity_status) : inferred.activity_status,
  academic_stage: row.academic_stage != null ? String(row.academic_stage) : inferred.academic_stage,
 })
 return {
  id: String(row.id),
  old_student_id: row.old_student_id != null ? String(row.old_student_id) : null,
  student_code: row.student_code != null ? String(row.student_code) : null,
  full_name: String(row.full_name ?? ""),
  english_name: row.english_name != null ? String(row.english_name) : null,
  gender: row.gender != null ? String(row.gender) : null,
  date_of_birth: row.date_of_birth != null ? String(row.date_of_birth) : null,
  grade,
  school: row.school != null ? String(row.school) : null,
  registration_status: state.registration_status,
  enrollment_status: state.enrollment_status,
  activity_status: state.activity_status,
  academic_stage: state.academic_stage,
  status:
   row.status != null && String(row.status).trim()
    ? String(row.status)
    : deriveDisplayStatus(state),
  parent_name: row.parent_name != null ? String(row.parent_name) : null,
  parent_relationship:
   row.parent_relationship != null ? String(row.parent_relationship) : null,
  parent_phone: row.parent_phone != null ? String(row.parent_phone) : null,
  parent_phone_country_code:
   row.parent_phone_country_code != null ? String(row.parent_phone_country_code) : null,
  student_phone: row.student_phone != null ? String(row.student_phone) : null,
  student_phone_country_code:
   row.student_phone_country_code != null ? String(row.student_phone_country_code) : null,
  whatsapp: row.whatsapp != null ? String(row.whatsapp) : null,
  preferred_contact_method:
   row.preferred_contact_method != null ? String(row.preferred_contact_method) : null,
  address: row.address != null ? String(row.address) : null,
  remarks: row.remarks != null ? String(row.remarks) : null,
  assigned_agent_user_id:
   row.assigned_agent_user_id != null ? String(row.assigned_agent_user_id) : null,
  created_at: String(row.created_at ?? ""),
  updated_at: String(row.updated_at ?? ""),
 }
}

export async function fetchAllStudents(): Promise<StudentRecord[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("students")
  .select("*")
  .order("created_at", { ascending: false })
 if (error) throw error
 return (data ?? []).map((r) => asStudent(r as Record<string, unknown>))
}

export async function getStudentById(id: string): Promise<StudentRecord | null> {
 if (!supabase) return null
 const { data, error } = await supabase.from("students").select("*").eq("id", id).maybeSingle()
 if (error) throw error
 if (!data) return null
 return asStudent(data as Record<string, unknown>)
}

export async function insertStudent(
 row: Partial<StudentRecord> & { full_name: string }
): Promise<StudentRecord> {
 if (!supabase) throw new Error("Supabase 未設定")
 const baseState = normalizeStudentState({
  registration_status: row.registration_status,
  enrollment_status: "非在讀",
  activity_status: "非活躍生",
  academic_stage: row.academic_stage,
 })
 const grade = coerceStudentGrade(row.grade)
 const inferred = inferStateFromLegacy(
  row.status != null ? String(row.status) : null,
  grade
 )
 const state = normalizeStudentState({
  registration_status: row.registration_status ?? inferred.registration_status ?? baseState.registration_status,
  enrollment_status: "非在讀",
  activity_status: "非活躍生",
  academic_stage: row.academic_stage ?? inferred.academic_stage ?? baseState.academic_stage,
 })
 const { data, error } = await supabase
  .from("students")
  .insert({
   full_name: row.full_name,
   english_name: row.english_name ?? null,
   gender: row.gender ?? null,
   date_of_birth: row.date_of_birth ?? null,
   grade,
   school: row.school ?? null,
   registration_status: state.registration_status,
   enrollment_status: state.enrollment_status,
   activity_status: state.activity_status,
   academic_stage: state.academic_stage,
   status: deriveDisplayStatus(state),
   parent_name: row.parent_name ?? null,
   parent_relationship: row.parent_relationship ?? null,
   parent_phone: row.parent_phone ?? null,
   parent_phone_country_code: normalizePhoneCountryCode(row.parent_phone_country_code),
   student_phone: row.student_phone ?? null,
   student_phone_country_code: normalizePhoneCountryCode(row.student_phone_country_code),
   whatsapp: row.whatsapp ?? null,
   preferred_contact_method: row.preferred_contact_method ?? null,
   address: row.address ?? null,
   remarks: row.remarks ?? null,
   student_code: row.student_code ?? null,
  })
  .select("*")
  .single()
 if (error) throw error
 return asStudent(data as Record<string, unknown>)
}

/** PostgREST 唯一鍵衝突碼（學號重複時觸發） */
export function isUniqueViolation(error: unknown): boolean {
 if (!error || typeof error !== "object") return false
 const code = (error as { code?: unknown }).code
 return code === "23505"
}

export async function updateStudent(
 id: string,
 patch: Partial<Omit<StudentRecord, "id" | "created_at">>
): Promise<StudentRecord> {
 if (!supabase) throw new Error("Supabase 未設定")
 const payload: Record<string, unknown> = {
  ...patch,
  updated_at: new Date().toISOString(),
 }
 if (patch.grade !== undefined) {
  payload.grade = coerceStudentGrade(patch.grade)
 }
 delete payload.enrollment_status
 delete payload.activity_status

 const touchesManualState =
  patch.registration_status !== undefined ||
  patch.academic_stage !== undefined ||
  patch.grade !== undefined
 if (touchesManualState) {
  const grade =
   patch.grade !== undefined ? coerceStudentGrade(patch.grade) : undefined
  const inferred = inferStateFromLegacy(
   patch.status != null ? String(patch.status) : null,
   grade ?? null
  )
  const state = normalizeStudentState({
   registration_status:
    patch.registration_status != null ? String(patch.registration_status) : inferred.registration_status,
   enrollment_status: undefined,
   activity_status: undefined,
   academic_stage: patch.academic_stage != null ? String(patch.academic_stage) : inferred.academic_stage,
  })
  payload.registration_status = state.registration_status
  payload.academic_stage = state.academic_stage
 }
 const { data, error } = await supabase
  .from("students")
  .update(payload)
  .eq("id", id)
  .select("*")
  .single()
 if (error) throw error
 if (touchesManualState) {
  await syncStudentEnrollmentState(id)
  const fresh = await getStudentById(id)
  if (!fresh) throw new Error("更新後無法讀取學生")
  return fresh
 }
 return asStudent(data as Record<string, unknown>)
}

export async function deleteStudent(id: string): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { error } = await supabase.from("students").delete().eq("id", id)
 if (error) throw error
}

export type EnrollmentWithClass = {
 id: string
 status: string
 enroll_date: string | null
 enrollmentPeriod: EnrollmentFormValue | null
 /** 單堂報讀的堂號（已排序） */
 sessionNumbers: number[]
 /** 顯示用：第一期報讀／單堂報讀（第3、7堂） */
 enrollmentFormLabel: string
 courseMode: CourseMode
 classId: string
 subject: string
 /** group / private */
 classKind: "group" | "private"
 subjectCode: string | null
 subjectCategory: string | null
 teacherId: string | null
 courseCode: string | null
 courseName: string | null
 dayOfWeek: string | null
 timeSlot: string | null
 pricePerLesson: number | null
}

/** PostgREST embed：只用 baseline + course_name，避免未套用 migration 的欄位令整筆查詢失敗 */
const ENROLLMENT_CLASS_EMBED =
 "classes ( subject, class_kind, course_code_full, day_of_week, time_slot, price_per_lesson, teacher_id, academic_years ( label ), courses ( course_mode, price_per_lesson, price_per_lesson_period_2, price_per_lesson_both_periods, course_name, subjects ( code, name_zh ) ) )"

const ENROLLMENT_ROW_SELECT_BASE =
 `id, status, enroll_date, class_id, ${ENROLLMENT_CLASS_EMBED}`

const ENROLLMENT_ROW_SELECT_WITH_PERIOD =
 `id, status, enroll_date, enrollment_period, class_id, ${ENROLLMENT_CLASS_EMBED}`

async function fetchEnrollmentRowsForStudent(studentId: string): Promise<Record<string, unknown>[]> {
 if (!supabase) return []
 const first = await supabase
  .from("student_class_enrollments")
  .select(ENROLLMENT_ROW_SELECT_WITH_PERIOD)
  .eq("student_id", studentId)
  .order("created_at", { ascending: false })
 const res =
  first.error && /does not exist/i.test(first.error.message)
   ? await supabase
      .from("student_class_enrollments")
      .select(ENROLLMENT_ROW_SELECT_BASE)
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
   : first
 if (res.error) throw res.error
 return (res.data ?? []) as Record<string, unknown>[]
}

function buildClassOptionLabel(row: Record<string, unknown>): string {
 const course = row.courses as Record<string, unknown> | null
 const ay = row.academic_years as Record<string, unknown> | null
 const head = formatClassLabel({
  subject: String(row.subject ?? ""),
  courseCode:
   row.course_code_full != null ? String(row.course_code_full) : null,
  courseName: course?.course_name != null ? String(course.course_name) : null,
 })
 const extras = [
  ay?.label != null ? `${String(ay.label)} 學年` : null,
  row.day_of_week != null ? String(row.day_of_week) : null,
  row.time_slot != null ? String(row.time_slot) : null,
 ].filter((x) => x && String(x).trim() !== "")
 return extras.length > 0 ? `${head} · ${extras.join(" · ")}` : head
}
function enrollmentClassLabel(cls: Record<string, unknown> | null | undefined): string | null {
 if (!cls) return null
 const course = cls.courses as Record<string, unknown> | null | undefined
 const subjectRow = course?.subjects as Record<string, unknown> | null | undefined
 const head = classDisplayName({
  subject: cls.subject != null ? String(cls.subject) : null,
  courseName: course?.course_name != null ? String(course.course_name) : null,
 })
 if (head !== "—") {
  const codeRaw = cls.course_code_full != null ? String(cls.course_code_full).trim() : ""
  return codeRaw ? `${head}（${codeRaw}）` : head
 }
 const nameZh = subjectRow?.name_zh != null ? String(subjectRow.name_zh).trim() : ""
 return nameZh || null
}

function mapEnrollmentWithClassRow(row: Record<string, unknown>): EnrollmentWithClass {
 const cls = row.classes as Record<string, unknown> | null
 const course = cls?.courses as Record<string, unknown> | null
 const subjectRow = course?.subjects as Record<string, unknown> | null
 const courseMode = course?.course_mode === "summer_two_period" ? "summer_two_period" : "regular"
 const enrollmentPeriod = normalizeEnrollmentPeriod(
  row.enrollment_period != null ? String(row.enrollment_period) : null
 )
 const pricePerLesson = resolvePriceForEnrollment({
  enrollmentPeriod,
  classPriceOverride: cls?.price_per_lesson != null ? Number(cls.price_per_lesson) : null,
  coursePrices: {
   pricePerLesson: course?.price_per_lesson != null ? Number(course.price_per_lesson) : null,
   pricePerLessonPeriod2:
    course?.price_per_lesson_period_2 != null ? Number(course.price_per_lesson_period_2) : null,
   pricePerLessonBothPeriods:
    course?.price_per_lesson_both_periods != null
     ? Number(course.price_per_lesson_both_periods)
     : null,
  },
 })
 const subjectLabel = enrollmentClassLabel(cls) ?? "—"
 return {
  id: String(row.id),
  status: String(row.status ?? "就讀中"),
  enroll_date: row.enroll_date != null ? String(row.enroll_date) : null,
  enrollmentPeriod,
  sessionNumbers: [],
  enrollmentFormLabel: formatEnrollmentFormLabel(enrollmentPeriod),
  courseMode,
  classId: String(row.class_id),
  subject: subjectLabel,
  classKind: resolveClassKind(
   cls?.class_kind != null ? String(cls.class_kind) : null,
   cls?.subject != null ? String(cls.subject) : null
  ),
  subjectCode: subjectRow?.code != null ? String(subjectRow.code).trim().toUpperCase() : null,
  subjectCategory: subjectRow?.category != null ? String(subjectRow.category) : null,
  teacherId: cls?.teacher_id != null ? String(cls.teacher_id) : null,
  courseCode:
   cls?.course_code_full != null ? String(cls.course_code_full) : null,
  courseName: course?.course_name != null ? String(course.course_name) : null,
  dayOfWeek: cls?.day_of_week != null ? String(cls.day_of_week) : null,
  timeSlot: cls?.time_slot != null ? String(cls.time_slot) : null,
  pricePerLesson,
 }
}

/** student_id -> 科目標籤（報讀班別） */
export async function fetchEnrollmentSubjectsByStudentIds(
 studentIds: string[]
): Promise<Map<string, string[]>> {
 const map = new Map<string, string[]>()
 if (!supabase || studentIds.length === 0) return map

 const enrollmentSelect =
  "student_id, classes ( subject, course_code_full, courses ( course_name, subjects ( name_zh ) ) )"

 try {
  const chunks = await forEachIdChunk(studentIds, DEFAULT_ID_CHUNK, async (slice) => {
   const { data, error } = await supabase!
    .from("student_class_enrollments")
    .select(enrollmentSelect)
    .in("student_id", slice)
    .eq("status", "就讀中")
   if (error) throw error
   return data ?? []
  })

  for (const data of chunks) {
   for (const row of data) {
    const r = row as Record<string, unknown>
    const sid = String(r.student_id)
    const cls = r.classes as Record<string, unknown> | null
    const sub = enrollmentClassLabel(cls)
    if (!sub) continue
    const arr = map.get(sid) ?? []
    if (!arr.includes(sub)) arr.push(sub)
    map.set(sid, arr)
   }
  }
 } catch (error) {
  console.error("[fetchEnrollmentSubjectsByStudentIds]", error)
 }
 return map
}

/** 儀表板「最新報讀班別」一筆：某學生報讀某班別的事件（依建檔時間新→舊） */
export type RecentClassEnrollment = {
 id: string
 studentId: string
 studentName: string
 classLabel: string
 enrollDate: string | null
 status: string
}

/**
 * 最近的「報讀班別」事件（含既有學生報讀新班別），依 created_at 新→舊。
 * 只計 status='就讀中'（真正報讀，排除已退選/取消）。錯誤時回傳空陣列、不阻斷頁面。
 */
export async function fetchRecentClassEnrollments(
 limit = 5
): Promise<RecentClassEnrollment[]> {
 if (!supabase) return []
 const select =
  "id, status, enroll_date, created_at, student_id, students ( full_name ), classes ( subject, course_code_full, courses ( course_name, subjects ( name_zh ) ) )"
 try {
  const { data, error } = await supabase
   .from("student_class_enrollments")
   .select(select)
   .eq("status", "就讀中")
   .order("created_at", { ascending: false })
   .limit(limit)
  if (error) throw error
  return (data ?? []).map((row) => {
   const r = row as Record<string, unknown>
   const st = r.students as Record<string, unknown> | null
   const cls = r.classes as Record<string, unknown> | null
   return {
    id: String(r.id),
    studentId: String(r.student_id),
    studentName: st?.full_name != null ? String(st.full_name) : "—",
    classLabel: enrollmentClassLabel(cls) ?? "—",
    enrollDate: r.enroll_date != null ? String(r.enroll_date) : null,
    status: String(r.status ?? ""),
   }
  })
 } catch (error) {
  console.error("[fetchRecentClassEnrollments]", error)
  return []
 }
}

export async function fetchEnrollmentsForStudent(
 studentId: string
): Promise<EnrollmentWithClass[]> {
 const rows = await fetchEnrollmentRowsForStudent(studentId)
 const mapped = rows.map((row) => mapEnrollmentWithClassRow(row))
 const singleIds = mapped
  .filter((e) => isSingleSessionEnrollment(e.enrollmentPeriod))
  .map((e) => e.id)
 if (singleIds.length === 0) return mapped
 const sessionMap = await fetchSessionNumbersByEnrollmentIds(singleIds)
 return mapped.map((e) => {
  if (!isSingleSessionEnrollment(e.enrollmentPeriod)) return e
  const sessionNumbers = sessionMap.get(e.id) ?? []
  return {
   ...e,
   sessionNumbers,
   enrollmentFormLabel: formatEnrollmentFormLabel(e.enrollmentPeriod, sessionNumbers),
  }
 })
}

export async function replaceEnrollmentSessions(
 enrollmentId: string,
 scheduleIds: string[]
): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const unique = [...new Set(scheduleIds.filter(Boolean))]
 if (unique.length === 0) throw new Error("單堂報讀請至少選擇一堂")

 const { data: enr, error: enrErr } = await supabase
  .from("student_class_enrollments")
  .select("class_id")
  .eq("id", enrollmentId)
  .maybeSingle()
 if (enrErr) throw enrErr
 const classId = enr ? String((enr as { class_id: string }).class_id) : ""
 if (!classId) throw new Error("找不到報讀紀錄")

 const chunks = await forEachIdChunk(unique, DEFAULT_ID_CHUNK, async (slice) => {
  const { data, error } = await supabase!
   .from("schedules")
   .select("id, class_id")
   .in("id", slice)
  if (error) throw error
  return data ?? []
 })
 const found = new Map<string, string>()
 for (const chunk of chunks) {
  for (const row of chunk) {
   const r = row as { id: string; class_id: string }
   found.set(String(r.id), String(r.class_id))
  }
 }
 for (const scheduleId of unique) {
  const sidClass = found.get(scheduleId)
  if (!sidClass) throw new Error("選堂排程不存在或已失效")
  if (sidClass !== classId) {
   throw new Error("單堂選堂必須屬於此報讀班別，不可選擇其他班的排程")
  }
 }

 const { error: delErr } = await supabase
  .from("student_enrollment_sessions")
  .delete()
  .eq("enrollment_id", enrollmentId)
 if (delErr) throw delErr
 const { error: insErr } = await supabase.from("student_enrollment_sessions").insert(
  unique.map((schedule_id) => ({ enrollment_id: enrollmentId, schedule_id }))
 )
 if (insErr) throw insErr
}

export type InsertEnrollmentPendingOpts = {
 /** 報讀時應享／繳費堂數多於綁定排程時，一併寫入待補堂 */
 owedCount: number
 reason?: string
 remarks?: string | null
}

type ScheduleSlotRow = {
 id: string
 class_id: string
 scheduled_date: string
 start_time: string | null
 end_time: string | null
 class_label: string
}

function parseScheduleHm(raw: string | null | undefined): number | null {
 if (!raw) return null
 return parseHm(String(raw).slice(0, 5))
}

function scheduleSlotBounds(startRaw: string | null, endRaw: string | null): { a: number; b: number } | null {
 const a = parseScheduleHm(startRaw)
 if (a == null) return null
 const end = parseScheduleHm(endRaw)
 const b = end == null || end <= a ? a + LESSON_SLOT_DURATION_MIN : end
 return { a, b }
}

function formatHmLabel(startRaw: string | null, endRaw: string | null): string {
 const bounds = scheduleSlotBounds(startRaw, endRaw)
 if (!bounds) return "—"
 const fmt = (m: number) => {
  const h = Math.floor(m / 60)
  const mm = m % 60
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`
 }
 return `${fmt(bounds.a)}–${fmt(bounds.b)}`
}

async function fetchUpcomingScheduleSlotsForClass(classId: string): Promise<ScheduleSlotRow[]> {
 if (!supabase) return []
 const today = localYmd()
 const { data, error } = await supabase
  .from("schedules")
  .select(
   "id, class_id, scheduled_date, start_time, end_time, status, classes ( subject, course_code_full, courses ( course_name ) )"
  )
  .eq("class_id", classId)
  .gte("scheduled_date", today)
 if (error) throw error
 const out: ScheduleSlotRow[] = []
 for (const raw of data ?? []) {
  const r = raw as Record<string, unknown>
  if (String(r.status ?? "").includes("取消")) continue
  const cls = r.classes as Record<string, unknown> | null
  const course = cls?.courses as Record<string, unknown> | null
  out.push({
   id: String(r.id),
   class_id: String(r.class_id),
   scheduled_date: String(r.scheduled_date ?? "").slice(0, 10),
   start_time: r.start_time != null ? String(r.start_time) : null,
   end_time: r.end_time != null ? String(r.end_time) : null,
   class_label: formatClassLabel({
    subject: cls?.subject != null ? String(cls.subject) : "—",
    courseCode: cls?.course_code_full != null ? String(cls.course_code_full) : null,
    courseName: course?.course_name != null ? String(course.course_name) : null,
   }),
  })
 }
 return out
}

async function filterSlotsForEnrollmentPeriod(
 classId: string,
 enrollmentPeriod: EnrollmentFormValue | null,
 scheduleIds: string[] | undefined,
 slots: ScheduleSlotRow[]
): Promise<ScheduleSlotRow[]> {
 const isSingle = isSingleSessionEnrollment(enrollmentPeriod)
 if (isSingle) {
  const selected = new Set((scheduleIds ?? []).filter(Boolean))
  return slots.filter((s) => selected.has(s.id))
 }
 const config = await fetchClassEnrollmentConfig(classId)
 if (!isSummerTwoPeriodMode(config.courseMode) || !config.academicYearId) {
  return slots
 }
 const periods = await fetchAcademicYearPeriods(config.academicYearId)
 const enrolledScheduleIds = new Set<string>()
 return slots.filter((s) => {
  const code = resolvePeriodCodeFromDate(s.scheduled_date, periods)
  return enrollmentVisibleOnSchedule({
   enrollmentPeriod,
   periodCode: code,
   scheduleId: s.id,
   enrolledScheduleIds,
  })
 })
}

export type EnrollmentScheduleConflict = {
 date: string
 newClassLabel: string
 existingClassLabel: string
 newTime: string
 existingTime: string
}

/** 該生就讀中班別、未來應出席的排程時段（含單堂選堂／暑期期數過濾） */
export async function fetchStudentMustAttendScheduleSlots(
 studentId: string,
 opts?: { excludeClassId?: string | null }
): Promise<ScheduleSlotRow[]> {
 return loadStudentMustAttendSlots(studentId, opts)
}

async function loadStudentMustAttendSlots(
 studentId: string,
 opts?: { excludeClassId?: string | null }
): Promise<ScheduleSlotRow[]> {
 if (!supabase) return []
 const { data: enrs, error: enrErr } = await supabase
  .from("student_class_enrollments")
  .select("id, class_id, enrollment_period")
  .eq("student_id", studentId)
  .eq("status", "就讀中")
 if (enrErr) throw enrErr

 const excludeClassId = opts?.excludeClassId ?? null
 const rows = (enrs ?? []).filter(
  (e) => String((e as { class_id: string }).class_id) !== excludeClassId
 ) as Array<{ id: string; class_id: string; enrollment_period: string | null }>
 if (rows.length === 0) return []

 const enrollmentIds = rows.map((e) => e.id)
 const sessionMap = new Map<string, Set<string>>()
 if (enrollmentIds.length > 0) {
  const chunks = await forEachIdChunk(enrollmentIds, DEFAULT_ID_CHUNK, async (slice) => {
   const { data, error } = await supabase!
    .from("student_enrollment_sessions")
    .select("enrollment_id, schedule_id")
    .in("enrollment_id", slice)
   if (error) throw error
   return data ?? []
  })
  for (const chunk of chunks) {
   for (const row of chunk) {
    const r = row as { enrollment_id: string; schedule_id: string }
    const set = sessionMap.get(r.enrollment_id) ?? new Set<string>()
    set.add(String(r.schedule_id))
    sessionMap.set(r.enrollment_id, set)
   }
  }
 }

 const out: ScheduleSlotRow[] = []
 for (const enr of rows) {
  const period = normalizeEnrollmentPeriod(enr.enrollment_period)
  const classSlots = await fetchUpcomingScheduleSlotsForClass(enr.class_id)
  const scheduleIds = isSingleSessionEnrollment(period)
   ? [...(sessionMap.get(enr.id) ?? [])]
   : undefined
  const visible = await filterSlotsForEnrollmentPeriod(enr.class_id, period, scheduleIds, classSlots)
  out.push(...visible)
 }
 return out
}

function conflictsBetweenTargetAndExisting(
 targetSlots: ScheduleSlotRow[],
 existingSlots: ScheduleSlotRow[]
): EnrollmentScheduleConflict[] {
 const conflicts: EnrollmentScheduleConflict[] = []
 for (const neu of targetSlots) {
  const nb = scheduleSlotBounds(neu.start_time, neu.end_time)
  if (!nb) continue
  for (const ex of existingSlots) {
   if (ex.scheduled_date !== neu.scheduled_date) continue
   if (ex.id === neu.id) continue
   const eb = scheduleSlotBounds(ex.start_time, ex.end_time)
   if (!eb) continue
   if (!intervalsOverlapMinutes(nb.a, nb.b, eb.a, eb.b)) continue
   conflicts.push({
    date: neu.scheduled_date,
    newClassLabel: neu.class_label,
    existingClassLabel: ex.class_label,
    newTime: formatHmLabel(neu.start_time, neu.end_time),
    existingTime: formatHmLabel(ex.start_time, ex.end_time),
   })
  }
 }
 return conflicts
}

/** 檢查擬報讀／加堂時段是否與該生其他就讀中班別重疊 */
export async function findStudentEnrollmentScheduleConflicts(opts: {
 studentId: string
 classId: string
 enrollmentPeriod: EnrollmentFormValue | null
 scheduleIds?: string[]
 /** 更新既有報讀時排除本班 enrollment（避免與自己比） */
 excludeClassId?: string | null
}): Promise<EnrollmentScheduleConflict[]> {
 if (!supabase) return []
 const targetSlots = await filterSlotsForEnrollmentPeriod(
  opts.classId,
  opts.enrollmentPeriod,
  opts.scheduleIds,
  await fetchUpcomingScheduleSlotsForClass(opts.classId)
 )
 if (targetSlots.length === 0) return []

 const excludeClassId = opts.excludeClassId ?? opts.classId
 const existingSlots = await loadStudentMustAttendSlots(opts.studentId, { excludeClassId })
 return conflictsBetweenTargetAndExisting(targetSlots, existingSlots)
}

/**
 * 檢查單一排程（例如補堂目標）是否與該生其他應出席堂次時段重疊。
 * excludeScheduleIds：例如請假當堂，當日不必再當衝突來源。
 */
export async function findStudentConflictsWithScheduleSlot(opts: {
 studentId: string
 scheduleId: string
 scheduledDate: string
 startTime: string | null
 endTime: string | null
 classLabel?: string
 excludeScheduleIds?: string[]
}): Promise<EnrollmentScheduleConflict[]> {
 if (!supabase) return []
 const date = opts.scheduledDate.slice(0, 10)
 const exclude = new Set((opts.excludeScheduleIds ?? []).filter(Boolean))
 exclude.add(opts.scheduleId)

 const mustAttend = (await loadStudentMustAttendSlots(opts.studentId)).filter(
  (s) => s.scheduled_date === date && !exclude.has(s.id)
 )
 const target: ScheduleSlotRow = {
  id: opts.scheduleId,
  class_id: "",
  scheduled_date: date,
  start_time: opts.startTime,
  end_time: opts.endTime,
  class_label: opts.classLabel?.trim() || "補堂排程",
 }
 return conflictsBetweenTargetAndExisting([target], mustAttend)
}

function formatEnrollmentConflictError(conflicts: EnrollmentScheduleConflict[]): string {
 const sample = conflicts
  .slice(0, 3)
  .map(
   (c) =>
    `${c.date} ${c.newTime}（${c.newClassLabel}）與「${c.existingClassLabel}」${c.existingTime}`
  )
  .join("；")
 const more = conflicts.length > 3 ? `…另有 ${conflicts.length - 3} 堂` : ""
 return `報讀時段與學生其他班別衝突（共 ${conflicts.length} 堂）：${sample}${more}`
}

function formatMakeupConflictError(conflicts: EnrollmentScheduleConflict[]): string {
 const sample = conflicts
  .slice(0, 2)
  .map((c) => `${c.date} ${c.newTime} 與「${c.existingClassLabel}」${c.existingTime}`)
  .join("；")
 return `補堂時段與學生其他班別衝突：${sample}`
}

export function describeMakeupTimeConflicts(conflicts: EnrollmentScheduleConflict[]): string {
 return formatMakeupConflictError(conflicts)
}

async function assertNoEnrollmentTimeConflicts(opts: {
 studentId: string
 classId: string
 enrollmentPeriod: EnrollmentFormValue | null
 scheduleIds?: string[]
 excludeClassId?: string | null
}): Promise<void> {
 const conflicts = await findStudentEnrollmentScheduleConflicts(opts)
 if (conflicts.length > 0) throw new Error(formatEnrollmentConflictError(conflicts))
}

/** 報讀成功後：同班未結案試堂標為已完成，避免試堂列表殘留 */
async function closeOpenTrialsAfterEnrollment(studentId: string, classId: string): Promise<void> {
 if (!supabase) return
 const { data, error } = await supabase
  .from("trial_sessions")
  .select("id, status, remarks")
  .eq("student_id", studentId)
  .eq("class_id", classId)
 if (error) throw error
 const open = (data ?? []).filter((row) => {
  const s = String((row as { status?: string }).status ?? "")
  return !s.includes("完成") && !s.includes("取消")
 }) as Array<{ id: string; remarks: string | null }>
 if (open.length === 0) return
 const note = "報讀後自動結案"
 for (const row of open) {
  const prev = (row.remarks ?? "").trim()
  const remarks = prev.includes(note) ? prev : prev ? `${prev}；${note}` : note
  const { error: upErr } = await supabase
   .from("trial_sessions")
   .update({
    status: "已完成",
    remarks,
    updated_at: new Date().toISOString(),
   })
   .eq("id", row.id)
  if (upErr) throw upErr
 }
}

export async function insertEnrollment(
 studentId: string,
 classId: string,
 enrollmentPeriod?: EnrollmentFormValue | null,
 scheduleIds?: string[],
 pending?: InsertEnrollmentPendingOpts | null
): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const today = localYmd()
 const { data: classRow, error: classErr } = await supabase
  .from("classes")
  .select("academic_year_label, start_date")
  .eq("id", classId)
  .maybeSingle()
 if (classErr) throw classErr
 if (classRow) assertClassRecordEditable(classRow as { academic_year_label?: string | null; start_date?: string | null })
 const config = await fetchClassEnrollmentConfig(classId)
 const isSingle = isSingleSessionEnrollment(enrollmentPeriod)
 let periodValue: EnrollmentFormValue | null = null
 if (isSingle) {
  periodValue = "單堂"
  if (!scheduleIds || scheduleIds.length === 0) {
   throw new Error("單堂報讀請至少選擇一堂")
  }
 } else if (
  enrollmentPeriod != null &&
  ENROLLMENT_PERIOD_OPTIONS.includes(enrollmentPeriod as EnrollmentPeriod)
 ) {
  periodValue = enrollmentPeriod as EnrollmentPeriod
 } else if (config.courseMode === "summer_two_period") {
  periodValue = "兩期全報"
 }

 const { data: existingRows, error: existingErr } = await supabase
  .from("student_class_enrollments")
  .select("id, status, updated_at")
  .eq("student_id", studentId)
  .eq("class_id", classId)
  .order("updated_at", { ascending: false })
 if (existingErr) throw existingErr
 const existing = (existingRows ?? []) as Array<{ id: string; status: string }>
 const blocking = existing.find((r) => r.status !== "已退讀")
 if (blocking) {
  throw new Error(
   blocking.status === "就讀中"
    ? "此學生已報讀此班別，請先更改報讀形式，或退讀後再重新報讀"
    : `此學生於此班別仍有報讀（${blocking.status}），請先處理後再報讀`
  )
 }
 const withdrawn = existing.find((r) => r.status === "已退讀")

 await assertNoEnrollmentTimeConflicts({
  studentId,
  classId,
  enrollmentPeriod: periodValue,
  scheduleIds: isSingle ? scheduleIds : undefined,
 })

 let enrollmentId: string
 let createdNew = false
 if (withdrawn) {
  enrollmentId = String(withdrawn.id)
  const { error: reactivateErr } = await supabase
   .from("student_class_enrollments")
   .update({
    status: "就讀中",
    enroll_date: today,
    enrollment_period: periodValue,
    updated_at: new Date().toISOString(),
   })
   .eq("id", enrollmentId)
  if (reactivateErr) throw reactivateErr
  const { error: clearSessErr } = await supabase
   .from("student_enrollment_sessions")
   .delete()
   .eq("enrollment_id", enrollmentId)
  if (clearSessErr) throw clearSessErr
 } else {
  const { data, error } = await supabase
   .from("student_class_enrollments")
   .insert({
    student_id: studentId,
    class_id: classId,
    status: "就讀中",
    enroll_date: today,
    enrollment_period: periodValue,
   })
   .select("id")
   .single()
  if (error) throw error
  enrollmentId = String((data as { id: string }).id)
  createdNew = true
 }

 try {
  if (isSingle && scheduleIds) {
   await replaceEnrollmentSessions(enrollmentId, scheduleIds)
  }
  const sessionLabel =
   isSingle && scheduleIds
    ? `；選堂 ${scheduleIds.length} 堂`
    : ""
  const pendingNote =
   pending && pending.owedCount > 0 ? `；待補 ${pending.owedCount} 堂` : ""
  const { error: evErr } = await supabase.from("enrollment_change_events").insert({
   student_id: studentId,
   class_id: classId,
   enrollment_id: enrollmentId,
   action: "enroll",
   effective_date: today,
   reason: isSingle
    ? `單堂報讀${sessionLabel}${pendingNote}`
    : withdrawn
      ? `退讀後重新報讀${pendingNote}`
      : pendingNote
        ? pendingNote.replace(/^；/, "")
        : null,
   enrollment_period: periodValue,
  })
  if (evErr) throw evErr
  if (pending && pending.owedCount > 0) {
   const { insertPendingLesson } = await import("@/services/pendingLessonQueries")
   await insertPendingLesson({
    studentId,
    classId,
    enrollmentId,
    owedCount: pending.owedCount,
    reason: pending.reason ?? "遲報缺堂",
    remarks: pending.remarks ?? null,
   })
  }
 } catch (err) {
  if (createdNew) {
   await supabase.from("student_class_enrollments").delete().eq("id", enrollmentId)
  } else if (withdrawn) {
   await supabase
    .from("student_class_enrollments")
    .update({
     status: "已退讀",
     updated_at: new Date().toISOString(),
    })
    .eq("id", enrollmentId)
  }
  throw err
 }
 await syncStudentEnrollmentState(studentId)
 try {
  await closeOpenTrialsAfterEnrollment(studentId, classId)
 } catch (trialErr) {
  console.warn("[insertEnrollment] closeOpenTrialsAfterEnrollment", trialErr)
 }
}

export async function updateEnrollmentPeriod(
 id: string,
 enrollmentPeriod: EnrollmentFormValue | null,
 opts: {
  studentId: string
  classId: string
  previousPeriod?: EnrollmentFormValue | null
  scheduleIds?: string[]
 }
): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const today = localYmd()
 const isSingle = isSingleSessionEnrollment(enrollmentPeriod)
 if (isSingle && (!opts.scheduleIds || opts.scheduleIds.length === 0)) {
  throw new Error("單堂報讀請至少選擇一堂")
 }
 await assertNoEnrollmentTimeConflicts({
  studentId: opts.studentId,
  classId: opts.classId,
  enrollmentPeriod: isSingle ? "單堂" : enrollmentPeriod,
  scheduleIds: isSingle ? opts.scheduleIds : undefined,
  excludeClassId: opts.classId,
 })
 const { error } = await supabase
  .from("student_class_enrollments")
  .update({
   enrollment_period: isSingle ? "單堂" : enrollmentPeriod,
   updated_at: new Date().toISOString(),
  })
  .eq("id", id)
 if (error) throw error
 if (isSingle) {
  await replaceEnrollmentSessions(id, opts.scheduleIds!)
 } else {
  const { error: delErr } = await supabase
   .from("student_enrollment_sessions")
   .delete()
   .eq("enrollment_id", id)
  if (delErr) throw delErr
 }
 const prevLabel = formatEnrollmentFormLabel(opts.previousPeriod)
 const nextLabel = formatEnrollmentFormLabel(enrollmentPeriod)
 const { error: evErr } = await supabase.from("enrollment_change_events").insert({
  student_id: opts.studentId,
  class_id: opts.classId,
  enrollment_id: id,
  action: isSingle || isSingleSessionEnrollment(opts.previousPeriod)
   ? "session_change"
   : "period_change",
  effective_date: today,
  reason: `報讀形式：${prevLabel} → ${nextLabel}`,
  enrollment_period: enrollmentPeriod,
 })
 if (evErr) throw evErr
}

/** 更新單堂報讀所選堂數（保持 enrollment_period=單堂） */
export async function updateEnrollmentSessions(
 enrollmentId: string,
 scheduleIds: string[],
 opts: { studentId: string; classId: string }
): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 await assertNoEnrollmentTimeConflicts({
  studentId: opts.studentId,
  classId: opts.classId,
  enrollmentPeriod: "單堂",
  scheduleIds,
  excludeClassId: opts.classId,
 })
 await replaceEnrollmentSessions(enrollmentId, scheduleIds)
 const today = localYmd()
 const { error: evErr } = await supabase.from("enrollment_change_events").insert({
  student_id: opts.studentId,
  class_id: opts.classId,
  enrollment_id: enrollmentId,
  action: "session_change",
  effective_date: today,
  reason: `單堂選堂更新（${scheduleIds.length} 堂）`,
  enrollment_period: "單堂",
 })
 if (evErr) throw evErr
}

export async function updateEnrollment(id: string, status: string, studentId?: string): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { error } = await supabase
  .from("student_class_enrollments")
  .update({ status, updated_at: new Date().toISOString() })
  .eq("id", id)
 if (error) throw error
 if (studentId) await syncStudentEnrollmentState(studentId)
}

export async function deleteEnrollment(id: string): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { error } = await supabase.from("student_class_enrollments").delete().eq("id", id)
 if (error) throw error
}

/**
 * 手誤選錯：硬刪報讀列及其增退事件／選堂明細，不寫入任何新紀錄。
 * 用於誤加學生（與「退讀」不同：退讀會保留歷史）。
 */
export async function purgeMistakenEnrollment(opts: {
 enrollmentId: string
 studentId: string
}): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { data: row, error: fetchErr } = await supabase
  .from("student_class_enrollments")
  .select("id, student_id")
  .eq("id", opts.enrollmentId)
  .maybeSingle()
 if (fetchErr) throw fetchErr
 if (!row) throw new Error("找不到報讀紀錄")
 const enrollmentId = String((row as { id: string }).id)
 const studentId = String((row as { student_id: string }).student_id)
 if (studentId !== opts.studentId) {
  throw new Error("報讀紀錄與學生不符")
 }

 const { error: evErr } = await supabase
  .from("enrollment_change_events")
  .delete()
  .eq("enrollment_id", enrollmentId)
 if (evErr) throw evErr

 const { error: sessErr } = await supabase
  .from("student_enrollment_sessions")
  .delete()
  .eq("enrollment_id", enrollmentId)
 if (sessErr) throw sessErr

 const { error: delErr } = await supabase
  .from("student_class_enrollments")
  .delete()
  .eq("id", enrollmentId)
 if (delErr) throw delErr

 await syncStudentEnrollmentState(studentId)
}

/** 退讀：寫入增退紀錄後將報讀列標為「已退讀」（保留歷史，不硬刪） */
export async function withdrawStudentFromClass(opts: {
 enrollmentId: string
 studentId: string
 classId: string
 effectiveDate: string
 reason: string | null
}): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const reason = opts.reason?.trim() || null
 const { data: evRow, error: e1 } = await supabase
  .from("enrollment_change_events")
  .insert({
   student_id: opts.studentId,
   class_id: opts.classId,
   enrollment_id: opts.enrollmentId,
   action: "withdraw",
   effective_date: opts.effectiveDate,
   reason,
  })
  .select("id")
  .single()
 if (e1) throw e1
 const eventId = String((evRow as { id: string }).id)
 const { error: e2 } = await supabase
  .from("student_class_enrollments")
  .update({ status: "已退讀", updated_at: new Date().toISOString() })
  .eq("id", opts.enrollmentId)
 if (e2) {
  await supabase.from("enrollment_change_events").delete().eq("id", eventId)
  throw e2
 }
 await syncStudentEnrollmentState(opts.studentId)
}

export type ClassEnrollmentChangeEvent = {
 id: string
 action: "enroll" | "withdraw" | "period_change" | "session_change"
 effectiveDate: string
 reason: string | null
 enrollmentPeriod: EnrollmentFormValue | null
 studentId: string
 studentName: string
 createdAt: string
}

/** 班別詳情「增退紀錄」 */
export async function fetchEnrollmentChangeEventsForClass(
 classId: string
): Promise<ClassEnrollmentChangeEvent[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("enrollment_change_events")
  .select(
   "id, action, effective_date, reason, enrollment_period, created_at, student_id, students ( full_name )"
  )
  .eq("class_id", classId)
  .order("effective_date", { ascending: false })
  .order("created_at", { ascending: false })
 if (error) {
  console.warn("[fetchEnrollmentChangeEventsForClass]", error.message)
  return []
 }
 return (data ?? []).map((row) => {
  const r = row as Record<string, unknown>
  const st = r.students as Record<string, unknown> | null
  const actionRaw = String(r.action ?? "enroll")
  const action: ClassEnrollmentChangeEvent["action"] =
   actionRaw === "withdraw"
    ? "withdraw"
    : actionRaw === "period_change"
      ? "period_change"
      : actionRaw === "session_change"
        ? "session_change"
        : "enroll"
  return {
   id: String(r.id),
   action,
   effectiveDate: String(r.effective_date ?? "").slice(0, 10),
   reason: r.reason != null ? String(r.reason) : null,
   enrollmentPeriod: normalizeEnrollmentPeriod(
    r.enrollment_period != null ? String(r.enrollment_period) : null
   ),
   studentId: String(r.student_id),
   studentName: st?.full_name != null ? String(st.full_name) : "—",
   createdAt: String(r.created_at ?? ""),
  }
 })
}

export type ClassOption = {
 id: string
 subject: string
 courseCode: string | null
 label: string
 courseMode: CourseMode
}

export async function fetchClassOptions(): Promise<ClassOption[]> {
 if (!supabase) return []
 /** 學生詳細頁「選擇班別加入」用：排除一對一（應走一對一學生頁建立） */
 const classSelectWithMode =
  "id, subject, class_kind, course_code_full, day_of_week, time_slot, academic_years ( label ), courses ( course_name, course_mode )"
 const classSelectBase =
  "id, subject, class_kind, course_code_full, day_of_week, time_slot, academic_years ( label ), courses ( course_name )"
 const classSelectLegacy =
  "id, subject, course_code_full, day_of_week, time_slot, academic_years ( label ), courses ( course_name )"
 const first = await supabase.from("classes").select(classSelectWithMode).order("subject")
 const second =
  first.error && /does not exist/i.test(first.error.message)
   ? await supabase.from("classes").select(classSelectBase).order("subject")
   : null
 const res =
  second && second.error && /does not exist/i.test(second.error.message)
   ? await supabase.from("classes").select(classSelectLegacy).order("subject")
   : (second ?? first)
 if (res.error) throw res.error
 const out: ClassOption[] = []
 for (const r of (res.data ?? []) as Record<string, unknown>[]) {
  const row = r
  const subject = String(row.subject ?? "")
  if (
   resolveClassKind(
    row.class_kind != null ? String(row.class_kind) : null,
    subject
   ) === "private"
  ) {
   continue
  }
  const course = row.courses as Record<string, unknown> | null
  const courseMode =
   course?.course_mode === "summer_two_period" ? "summer_two_period" : "regular"
  out.push({
   id: String(row.id),
   subject,
   courseCode:
    row.course_code_full != null ? String(row.course_code_full) : null,
   label: buildClassOptionLabel(row),
   courseMode,
  })
 }
 return out
}

export type PaymentRow = {
 id: string
 receipt_number: string | null
 payment_date: string
 total_amount: number
 payment_method: string | null
 status: string
}

export async function fetchPaymentsForStudent(studentId: string): Promise<PaymentRow[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("payments")
  .select("id, receipt_number, payment_date, total_amount, payment_method, status")
  .eq("student_id", studentId)
  .order("payment_date", { ascending: false })
 if (error) throw error
 return (data ?? []).map((r) => {
  const row = r as Record<string, unknown>
  return {
   id: String(row.id),
   receipt_number: row.receipt_number != null ? String(row.receipt_number) : null,
   payment_date: String(row.payment_date ?? ""),
   total_amount: Number(row.total_amount ?? 0),
   payment_method: row.payment_method != null ? String(row.payment_method) : null,
   status: String(row.status ?? ""),
  }
 })
}

export async function insertPaymentForStudent(
 studentId: string,
 row: { total_amount: number; payment_date: string; payment_method?: string; status?: string }
): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { error } = await supabase.from("payments").insert({
  student_id: studentId,
  payment_date: row.payment_date,
  total_amount: row.total_amount,
  payment_method: row.payment_method ?? "現金",
  status: row.status ?? "已收款",
 })
 if (error) throw error
}

export async function deletePayment(id: string): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { error } = await supabase.from("payments").delete().eq("id", id)
 if (error) throw error
}

export type AttendanceRow = {
 id: string
 classId: string
 attendance_date: string
 status: string
 classLabel: string
}

export async function fetchAttendanceForStudent(
 studentId: string
): Promise<AttendanceRow[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("attendance_details")
  .select("id, class_id, attendance_date, status, classes ( subject, course_code_full )")
  .eq("student_id", studentId)
  .order("attendance_date", { ascending: false })
 if (error) throw error
 return (data ?? []).map((row) => {
  const r = row as Record<string, unknown>
  const cls = r.classes as Record<string, unknown> | null
  const sub = cls?.subject != null ? String(cls.subject) : "—"
  const code = cls?.course_code_full != null ? String(cls.course_code_full) : ""
  return {
   id: String(r.id),
   classId: r.class_id != null ? String(r.class_id) : "",
   attendance_date: String(r.attendance_date ?? ""),
   status: String(r.status ?? ""),
   classLabel: code ? `${sub} ${code}` : sub,
  }
 })
}

export type LeaveRow = {
 id: string
 classId: string
 leave_date: string
 leave_reason: string | null
 status: string
 classLabel: string
}

export async function fetchLeaveForStudent(studentId: string): Promise<LeaveRow[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("leave_makeup_records")
  .select("id, class_id, leave_date, leave_reason, status, classes ( subject, course_code_full )")
  .eq("student_id", studentId)
  .order("leave_date", { ascending: false })
 if (error) throw error
 return (data ?? []).map((row) => {
  const r = row as Record<string, unknown>
  const cls = r.classes as Record<string, unknown> | null
  const sub = cls?.subject != null ? String(cls.subject) : "—"
  const code = cls?.course_code_full != null ? String(cls.course_code_full) : ""
  return {
   id: String(r.id),
   classId: r.class_id != null ? String(r.class_id) : "",
   leave_date: String(r.leave_date ?? ""),
   leave_reason: r.leave_reason != null ? String(r.leave_reason) : null,
   status: String(r.status ?? ""),
   classLabel: code ? `${sub} ${code}` : sub,
  }
 })
}

export type HistoryRow = {
 id: string
 kind: "status" | "payment" | "enrollment" | "withdrawal"
 title: string
 subtitle: string
 date: string
 tone: "green" | "blue" | "muted" | "amber"
}

export async function fetchStudentActivity(studentId: string): Promise<HistoryRow[]> {
 const items: HistoryRow[] = []
 if (!supabase) return items

 const [hist, pays, enrs, evWithdraw] = await Promise.all([
  supabase
   .from("student_status_history")
   .select("id, old_status, new_status, changed_date, reason, created_at")
   .eq("student_id", studentId)
   .order("created_at", { ascending: false }),
  supabase
   .from("payments")
   .select("id, total_amount, payment_method, status, payment_date, created_at")
   .eq("student_id", studentId)
   .order("created_at", { ascending: false }),
  supabase
   .from("student_class_enrollments")
   .select(
    "id, status, created_at, classes ( subject, course_code_full )"
   )
   .eq("student_id", studentId)
   .order("created_at", { ascending: false }),
  supabase
   .from("enrollment_change_events")
   .select("id, effective_date, reason, classes ( subject, course_code_full )")
   .eq("student_id", studentId)
   .eq("action", "withdraw")
   .order("created_at", { ascending: false }),
 ])

 if (!hist.error && hist.data) {
  for (const r of hist.data as Record<string, unknown>[]) {
   items.push({
    id: `h-${r.id}`,
    kind: "status",
    title: `狀態變更：${String(r.old_status ?? "—")} → ${String(r.new_status ?? "")}`,
    subtitle: String(r.reason ?? ""),
    date: String(r.changed_date ?? r.created_at ?? "").slice(0, 10),
    tone: "muted",
   })
  }
 }
 if (!pays.error && pays.data) {
  for (const r of pays.data as Record<string, unknown>[]) {
   const amt = Number(r.total_amount ?? 0)
   items.push({
    id: `p-${r.id}`,
    kind: "payment",
    title: `繳費 HKD $${amt.toLocaleString("zh-Hant-TW")}`,
    subtitle: `${String(r.payment_date)} · ${String(r.payment_method ?? "")} · ${String(r.status ?? "")}`,
    date: String(r.payment_date ?? "").slice(0, 10),
    tone: "green",
   })
  }
 }
 if (!enrs.error && enrs.data) {
  for (const r of enrs.data as Record<string, unknown>[]) {
   // 已退讀由 withdraw 事件呈現；手誤清除後此列亦不存在
   if (String(r.status ?? "") === "已退讀") continue
   const cls = r.classes as Record<string, unknown> | null
   const sub = cls?.subject != null ? String(cls.subject) : "—"
   const code = cls?.course_code_full != null ? String(cls.course_code_full) : ""
   items.push({
    id: `e-${r.id}`,
    kind: "enrollment",
    title: `加入班別：${sub}`,
    subtitle: `${code} · 狀態：${String(r.status ?? "")}`,
    date: String(r.created_at ?? "").slice(0, 10),
    tone: "blue",
   })
  }
 }
 if (evWithdraw.error) {
  console.warn("[fetchStudentActivity] enrollment_change_events:", evWithdraw.error.message)
 } else if (evWithdraw.data) {
  for (const r of evWithdraw.data as Record<string, unknown>[]) {
   const cls = r.classes as Record<string, unknown> | null
   const sub = cls?.subject != null ? String(cls.subject) : "—"
   const code = cls?.course_code_full != null ? String(cls.course_code_full) : ""
   const eff = String(r.effective_date ?? "").slice(0, 10)
   const reason = r.reason != null ? String(r.reason) : ""
   items.push({
    id: `w-${r.id}`,
    kind: "withdrawal",
    title: `退讀班別：${sub}${code ? `（${code}）` : ""}`,
    subtitle: [reason ? `原因：${reason}` : "", `生效日：${eff}`].filter(Boolean).join(" · "),
    date: eff,
    tone: "amber",
   })
  }
 }

 items.sort((a, b) => b.date.localeCompare(a.date))
 return items
}

export type StudentTuitionArrearsInfo = {
 paidLessons: number
 attendedLessons: number
 /** 出席堂數 ≥ 已繳費堂數，且非兩者皆為 0 */
 showArrears: boolean
}

/**
 * 依 `payment_details.lesson_count`（僅計 `payments.status = 已收款`）與 `attendance_details` 點名列，
 * 判斷是否顯示「追收學費」：出席堂數 ≥ 已繳費堂數，且（已繳堂數或出席堂數）至少一項大於 0。
 */
/**
 * 改由資料庫 RPC `student_tuition_arrears` 聚合（payment_details / attendance_details 在 DB 端 GROUP BY），
 * 前端僅接收每位學生的已繳堂數與計費出席堂數，避免把明細表全量下載。
 */
export async function fetchStudentTuitionArrearsByStudentIds(
 studentIds: string[]
): Promise<Map<string, StudentTuitionArrearsInfo>> {
 const out = new Map<string, StudentTuitionArrearsInfo>()
 if (!supabase || studentIds.length === 0) return out
 for (const id of studentIds) {
  out.set(id, { paidLessons: 0, attendedLessons: 0, showArrears: false })
 }

 const { data, error } = await supabase.rpc("student_tuition_arrears", {
  p_student_ids: studentIds,
 })
 if (error) {
  console.warn("[fetchStudentTuitionArrearsByStudentIds] rpc", error.message)
  return out
 }

 for (const row of (data ?? []) as Record<string, unknown>[]) {
  const sid = String(row.student_id ?? "")
  if (!out.has(sid)) continue
  const paidLessons = Number(row.paid_lessons ?? 0)
  const attendedLessons = Number(row.attended_lessons ?? 0)
  const showArrears =
   attendedLessons >= paidLessons && !(paidLessons === 0 && attendedLessons === 0)
  out.set(sid, { paidLessons, attendedLessons, showArrears })
 }

 return out
}
