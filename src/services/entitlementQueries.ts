import {
 enrollmentPeriodToPackageType,
 type EntitlementPackageType,
} from "@/lib/entitlementPackage"
import {
 fetchAcademicYearPeriods,
 isSingleSessionEnrollment,
 isSummerTwoPeriodMode,
 normalizeEnrollmentPeriod,
 resolvePeriodCodeFromDate,
 type EnrollmentFormValue,
} from "@/lib/enrollmentPeriod"
import { usesEntitlementRosterModel } from "@/lib/rosterEligibilityGate"
import { DEFAULT_ID_CHUNK, forEachIdChunk } from "@/lib/supabaseInChunks"
import { supabase } from "@/lib/supabaseClient"

export type EntitlementPoolRow = {
 id: string
 studentId: string
 classId: string
 academicYearId: string
 packageType: EntitlementPackageType
 sourceEnrollmentId: string
 initialLessons: number
 remainingLessons: number
 validFrom: string | null
 validTo: string | null
 createdAt: string
 updatedAt: string
}

export type AttendanceDeclarationRow = {
 id: string
 scheduleId: string
 studentId: string
 poolId: string
 status: "active" | "void" | "superseded"
 supersededBy: string | null
 sourceEventType: string | null
 sourceEventId: string | null
 manualReason: string | null
 createdAt: string
}

export type DeclarationSourceEventType =
 | "enrollment_auto"
 | "class_reschedule"
 | "student_makeup"
 | "session_bind"
 | "manual_roster_add"
 | "backfill"

function mapPool(row: Record<string, unknown>): EntitlementPoolRow {
 return {
  id: String(row.id),
  studentId: String(row.student_id),
  classId: String(row.class_id),
  academicYearId: String(row.academic_year_id),
  packageType: String(row.package_type) as EntitlementPackageType,
  sourceEnrollmentId: String(row.source_enrollment_id),
  initialLessons: Number(row.initial_lessons ?? 0),
  remainingLessons: Number(row.remaining_lessons ?? 0),
  validFrom: row.valid_from != null ? String(row.valid_from).slice(0, 10) : null,
  validTo: row.valid_to != null ? String(row.valid_to).slice(0, 10) : null,
  createdAt: String(row.created_at ?? ""),
  updatedAt: String(row.updated_at ?? ""),
 }
}

function mapDeclaration(row: Record<string, unknown>): AttendanceDeclarationRow {
 const status = String(row.status ?? "active")
 return {
  id: String(row.id),
  scheduleId: String(row.schedule_id),
  studentId: String(row.student_id),
  poolId: String(row.pool_id),
  status:
   status === "void" || status === "superseded"
    ? status
    : "active",
  supersededBy: row.superseded_by != null ? String(row.superseded_by) : null,
  sourceEventType: row.source_event_type != null ? String(row.source_event_type) : null,
  sourceEventId: row.source_event_id != null ? String(row.source_event_id) : null,
  manualReason: row.manual_reason != null ? String(row.manual_reason) : null,
  createdAt: String(row.created_at ?? ""),
 }
}

function lessonUnits(slots: number | null | undefined): number {
 return Number(slots) === 2 ? 2 : 1
}

type ScheduleLessonRow = {
 id: string
 scheduledDate: string
 cancelled: boolean
 lessonSlots: number
}

async function fetchClassScheduleLessonRows(classId: string): Promise<ScheduleLessonRow[]> {
 if (!supabase) return []
 const { data: classRow, error: classErr } = await supabase
  .from("classes")
  .select("lesson_slots_per_session")
  .eq("id", classId)
  .maybeSingle()
 if (classErr) throw classErr
 const classSlots = lessonUnits(
  (classRow as { lesson_slots_per_session?: number | null } | null)?.lesson_slots_per_session
 )

 const { data, error } = await supabase
  .from("schedules")
  .select("id, scheduled_date, status")
  .eq("class_id", classId)
  .order("scheduled_date", { ascending: true })
 if (error) throw error
 return (data ?? []).map((raw) => {
  const row = raw as Record<string, unknown>
  const status = String(row.status ?? "")
  return {
   id: String(row.id),
   scheduledDate: String(row.scheduled_date ?? "").slice(0, 10),
   cancelled: status.includes("取消"),
   lessonSlots: classSlots,
  }
 })
}

async function resolveEnrollmentPackageContext(opts: {
 enrollmentId: string
 classId: string
 enrollmentPeriod: EnrollmentFormValue | null
}): Promise<{
 academicYearId: string
 academicYearLabel: string | null
 packageType: EntitlementPackageType
} | null> {
 if (!supabase) return null
 const { data, error } = await supabase
  .from("classes")
  .select("academic_year_id, academic_years ( label ), courses ( course_mode )")
  .eq("id", opts.classId)
  .maybeSingle()
 if (error) throw error
 if (!data) return null
 const row = data as Record<string, unknown>
 const year = row.academic_years as Record<string, unknown> | null
 const academicYearId = row.academic_year_id != null ? String(row.academic_year_id) : null
 if (!academicYearId) return null
 const academicYearLabel = year?.label != null ? String(year.label) : null
 return {
  academicYearId,
  academicYearLabel,
  packageType: enrollmentPeriodToPackageType(opts.enrollmentPeriod),
 }
}

/** 計算某包裝應對應的未來／期內排程（用於鑄池與自動宣告） */
export async function resolvePackageScheduleTargets(opts: {
 classId: string
 packageType: EntitlementPackageType
 academicYearId: string
 enrollDate: string | null
 scheduleIds?: string[]
}): Promise<{ scheduleIds: string[]; lessonUnits: number }> {
 if (opts.packageType === "single_lesson") {
  const ids = [...new Set((opts.scheduleIds ?? []).filter(Boolean))]
  if (ids.length === 0) return { scheduleIds: [], lessonUnits: 0 }
  if (!supabase) return { scheduleIds: ids, lessonUnits: ids.length }
  const { data: classRow, error: classErr } = await supabase
   .from("classes")
   .select("lesson_slots_per_session")
   .eq("id", opts.classId)
   .maybeSingle()
  if (classErr) throw classErr
  const per = lessonUnits(
   (classRow as { lesson_slots_per_session?: number | null } | null)?.lesson_slots_per_session
  )
  return { scheduleIds: ids, lessonUnits: ids.length * per }
 }

 const schedules = await fetchClassScheduleLessonRows(opts.classId)
 const enrollDate = (opts.enrollDate ?? "").slice(0, 10)
 let filtered = schedules.filter((s) => !s.cancelled)
 if (enrollDate) {
  filtered = filtered.filter((s) => s.scheduledDate >= enrollDate)
 }

 if (
  opts.packageType === "summer_phase_1"
  || opts.packageType === "summer_phase_2"
  || opts.packageType === "summer_full"
 ) {
  const periods = await fetchAcademicYearPeriods(opts.academicYearId)
  if (opts.packageType === "summer_phase_1" || opts.packageType === "summer_phase_2") {
   const code = opts.packageType === "summer_phase_1" ? 1 : 2
   filtered = filtered.filter((s) => resolvePeriodCodeFromDate(s.scheduledDate, periods) === code)
  }
 }

 const scheduleIds = filtered.map((s) => s.id)
 const units = filtered.reduce((sum, s) => sum + s.lessonSlots, 0)
 return { scheduleIds, lessonUnits: units }
}

export async function fetchActiveDeclarationsForSchedules(
 scheduleIds: string[]
): Promise<AttendanceDeclarationRow[]> {
 const ids = [...new Set(scheduleIds.filter(Boolean))]
 if (!supabase || ids.length === 0) return []
 const out: AttendanceDeclarationRow[] = []
 await forEachIdChunk(ids, DEFAULT_ID_CHUNK, async (chunk) => {
  const { data, error } = await supabase!
   .from("attendance_declarations")
   .select(
    "id, schedule_id, student_id, pool_id, status, superseded_by, source_event_type, source_event_id, manual_reason, created_at"
   )
   .in("schedule_id", chunk)
   .eq("status", "active")
  if (error) throw error
  for (const raw of data ?? []) {
   out.push(mapDeclaration(raw as Record<string, unknown>))
  }
 })
 return out
}

export async function fetchPoolsByEnrollmentIds(
 enrollmentIds: string[]
): Promise<Map<string, EntitlementPoolRow>> {
 const ids = [...new Set(enrollmentIds.filter(Boolean))]
 const map = new Map<string, EntitlementPoolRow>()
 if (!supabase || ids.length === 0) return map
 await forEachIdChunk(ids, DEFAULT_ID_CHUNK, async (chunk) => {
  const { data, error } = await supabase!
   .from("student_entitlement_pools")
   .select(
    "id, student_id, class_id, academic_year_id, package_type, source_enrollment_id, initial_lessons, remaining_lessons, valid_from, valid_to, created_at, updated_at"
   )
   .in("source_enrollment_id", chunk)
  if (error) throw error
  for (const raw of data ?? []) {
   const pool = mapPool(raw as Record<string, unknown>)
   map.set(pool.sourceEnrollmentId, pool)
  }
 })
 return map
}

/**
 * 為報讀鑄造／重同步權益池，並為目標排程建立 active 宣告（idempotent）。
 * 僅在 usesEntitlementRosterModel 的學年執行；否則 no-op。
 */
export async function ensureEntitlementPoolAndDeclarations(opts: {
 enrollmentId: string
 studentId: string
 classId: string
 enrollmentPeriod: EnrollmentFormValue | null
 enrollDate?: string | null
 scheduleIds?: string[]
 sourceEventType?: DeclarationSourceEventType
}): Promise<EntitlementPoolRow | null> {
 if (!supabase) return null

 const ctx = await resolveEnrollmentPackageContext({
  enrollmentId: opts.enrollmentId,
  classId: opts.classId,
  enrollmentPeriod: opts.enrollmentPeriod,
 })
 if (!ctx || !usesEntitlementRosterModel(ctx.academicYearLabel)) return null

 const targets = await resolvePackageScheduleTargets({
  classId: opts.classId,
  packageType: ctx.packageType,
  academicYearId: ctx.academicYearId,
  enrollDate: opts.enrollDate ?? null,
  scheduleIds: opts.scheduleIds,
 })

 const existingMap = await fetchPoolsByEnrollmentIds([opts.enrollmentId])
 let pool = existingMap.get(opts.enrollmentId) ?? null
 const now = new Date().toISOString()

 if (!pool) {
  const { data, error } = await supabase
   .from("student_entitlement_pools")
   .insert({
    student_id: opts.studentId,
    class_id: opts.classId,
    academic_year_id: ctx.academicYearId,
    package_type: ctx.packageType,
    source_enrollment_id: opts.enrollmentId,
    initial_lessons: targets.lessonUnits,
    remaining_lessons: targets.lessonUnits,
    updated_at: now,
   })
   .select(
    "id, student_id, class_id, academic_year_id, package_type, source_enrollment_id, initial_lessons, remaining_lessons, valid_from, valid_to, created_at, updated_at"
   )
   .single()
  if (error) throw error
  pool = mapPool(data as Record<string, unknown>)
 } else if (
  targets.lessonUnits > pool.initialLessons
  && pool.remainingLessons === pool.initialLessons
 ) {
  // 尚無消耗時，允許因新增排程而抬高 initial／remaining
  const { data, error } = await supabase
   .from("student_entitlement_pools")
   .update({
    initial_lessons: targets.lessonUnits,
    remaining_lessons: targets.lessonUnits,
    package_type: ctx.packageType,
    updated_at: now,
   })
   .eq("id", pool.id)
   .select(
    "id, student_id, class_id, academic_year_id, package_type, source_enrollment_id, initial_lessons, remaining_lessons, valid_from, valid_to, created_at, updated_at"
   )
   .single()
  if (error) throw error
  pool = mapPool(data as Record<string, unknown>)
 }

 if (targets.scheduleIds.length === 0) return pool

 const existing = await fetchActiveDeclarationsForSchedules(targets.scheduleIds)
 const already = new Set(
  existing
   .filter((d) => d.studentId === opts.studentId && d.poolId === pool!.id)
   .map((d) => d.scheduleId)
 )

 const toInsert = targets.scheduleIds
  .filter((scheduleId) => !already.has(scheduleId))
  .map((scheduleId) => ({
   schedule_id: scheduleId,
   student_id: opts.studentId,
   pool_id: pool!.id,
   status: "active",
   source_event_type: opts.sourceEventType ?? "enrollment_auto",
   updated_at: now,
  }))

 if (toInsert.length > 0) {
  // 若同堂已有其他 active 宣告（理論上同生唯一），略過衝突列
  const { error } = await supabase.from("attendance_declarations").insert(toInsert)
  if (error) {
   // unique partial index 衝突：逐筆 upsert 式忽略
   if (!String(error.message).includes("attendance_declarations_active_schedule_student")) {
    throw error
   }
   for (const row of toInsert) {
    const { error: oneErr } = await supabase.from("attendance_declarations").insert(row)
    if (
     oneErr
     && !String(oneErr.message).includes("attendance_declarations_active_schedule_student")
    ) {
     throw oneErr
    }
   }
  }
 }

 return pool
}

async function classLabel(classId: string): Promise<string | null> {
 if (!supabase) return null
 const { data, error } = await supabase
  .from("classes")
  .select("academic_years ( label )")
  .eq("id", classId)
  .maybeSingle()
 if (error) throw error
 const year = (data as { academic_years?: { label?: string } | null } | null)?.academic_years
 return year?.label != null ? String(year.label) : null
}

/** 單堂改掛後：void 舊宣告、為新 schedule 建宣告（同池） */
export async function syncSingleLessonDeclarations(opts: {
 enrollmentId: string
 studentId: string
 classId: string
 scheduleIds: string[]
}): Promise<void> {
 if (!supabase) return
 const label = await classLabel(opts.classId)
 if (!usesEntitlementRosterModel(label)) return

 const pools = await fetchPoolsByEnrollmentIds([opts.enrollmentId])
 const pool = pools.get(opts.enrollmentId) ?? null
 if (!pool) {
  await ensureEntitlementPoolAndDeclarations({
   enrollmentId: opts.enrollmentId,
   studentId: opts.studentId,
   classId: opts.classId,
   enrollmentPeriod: "單堂",
   scheduleIds: opts.scheduleIds,
   sourceEventType: "session_bind",
  })
  return
 }

 const { data: activeRows, error: activeErr } = await supabase
  .from("attendance_declarations")
  .select("id, schedule_id")
  .eq("student_id", opts.studentId)
  .eq("pool_id", pool.id)
  .eq("status", "active")
 if (activeErr) throw activeErr

 const wanted = new Set(opts.scheduleIds)
 const now = new Date().toISOString()
 const toVoid = (activeRows ?? []).filter(
  (r) => !wanted.has(String((r as { schedule_id: string }).schedule_id))
 )
 if (toVoid.length > 0) {
  const { error } = await supabase
   .from("attendance_declarations")
   .update({ status: "void", updated_at: now })
   .in(
    "id",
    toVoid.map((r) => String((r as { id: string }).id))
   )
  if (error) throw error
 }

 await ensureEntitlementPoolAndDeclarations({
  enrollmentId: opts.enrollmentId,
  studentId: opts.studentId,
  classId: opts.classId,
  enrollmentPeriod: "單堂",
  scheduleIds: opts.scheduleIds,
  sourceEventType: "session_bind",
 })
}

/** 報讀形式變更：void 舊池相關宣告後重鑄 */
export async function remintPoolAfterPeriodChange(opts: {
 enrollmentId: string
 studentId: string
 classId: string
 enrollmentPeriod: EnrollmentFormValue | null
 enrollDate?: string | null
 scheduleIds?: string[]
}): Promise<void> {
 if (!supabase) return
 const label = await classLabel(opts.classId)
 if (!usesEntitlementRosterModel(label)) return

 const existing = await fetchPoolsByEnrollmentIds([opts.enrollmentId])
 const oldPool = existing.get(opts.enrollmentId)
 if (oldPool) {
  const { error: delDeclErr } = await supabase
   .from("attendance_declarations")
   .delete()
   .eq("pool_id", oldPool.id)
  if (delDeclErr) throw delDeclErr
  const { error: delErr } = await supabase
   .from("student_entitlement_pools")
   .delete()
   .eq("id", oldPool.id)
  if (delErr) throw delErr
 }

 await ensureEntitlementPoolAndDeclarations({
  enrollmentId: opts.enrollmentId,
  studentId: opts.studentId,
  classId: opts.classId,
  enrollmentPeriod: opts.enrollmentPeriod,
  enrollDate: opts.enrollDate,
  scheduleIds: opts.scheduleIds,
  sourceEventType: "enrollment_auto",
 })
}

export function normalizePeriodForPool(
 value: string | null | undefined
): EnrollmentFormValue | null {
 return normalizeEnrollmentPeriod(value)
}

export { isSingleSessionEnrollment, isSummerTwoPeriodMode }
