import { isBillableAttendanceStatus } from "@/lib/attendanceBilling"
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
import { suggestedTuitionLessons } from "@/lib/tuitionPaymentSuggestion"
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
 | "class_cancelled"

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
 *
 * 主波定案：報讀鑄**空池**（initial／remaining＝0）；排程只建宣告、**永不抬池**。
 * 堂數只經學費確認收款 top_up。
 */
export async function ensureEntitlementPoolAndDeclarations(opts: {
 enrollmentId: string
 studentId: string
 classId: string
 enrollmentPeriod: EnrollmentFormValue | null
 enrollDate?: string | null
 scheduleIds?: string[]
 sourceEventType?: DeclarationSourceEventType
 /**
  * @deprecated 主波後忽略；排程永不抬池。保留參數以免舊呼叫爆。
  */
 allowRaisePool?: boolean
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
    initial_lessons: 0,
    remaining_lessons: 0,
    updated_at: now,
   })
   .select(
    "id, student_id, class_id, academic_year_id, package_type, source_enrollment_id, initial_lessons, remaining_lessons, valid_from, valid_to, created_at, updated_at"
   )
   .single()
  if (error) throw error
  pool = mapPool(data as Record<string, unknown>)
 } else if (pool.packageType !== ctx.packageType) {
  const { data, error } = await supabase
   .from("student_entitlement_pools")
   .update({
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

async function insertActiveDeclarationsIgnoringConflicts(
 rows: Array<{
  schedule_id: string
  student_id: string
  pool_id: string
  status: string
  source_event_type: string
  source_event_id?: string | null
  updated_at: string
 }>
): Promise<void> {
 if (!supabase || rows.length === 0) return
 const { error } = await supabase.from("attendance_declarations").insert(rows)
 if (!error) return
 if (!String(error.message).includes("attendance_declarations_active_schedule_student")) {
  throw error
 }
 for (const row of rows) {
  const { error: oneErr } = await supabase.from("attendance_declarations").insert(row)
  if (
   oneErr
   && !String(oneErr.message).includes("attendance_declarations_active_schedule_student")
  ) {
   throw oneErr
  }
 }
}

/** 軟取消／作廢：將排程上 active 宣告改 void（不改池餘額） */
export async function voidActiveDeclarationsForSchedules(
 scheduleIds: string[],
 opts?: { studentIds?: string[] }
): Promise<number> {
 const ids = [...new Set(scheduleIds.filter(Boolean))]
 if (!supabase || ids.length === 0) return 0
 const now = new Date().toISOString()
 let voided = 0
 await forEachIdChunk(ids, DEFAULT_ID_CHUNK, async (chunk) => {
  let q = supabase!
   .from("attendance_declarations")
   .update({ status: "void", updated_at: now })
   .in("schedule_id", chunk)
   .eq("status", "active")
  const studentIds = opts?.studentIds?.filter(Boolean)
  if (studentIds && studentIds.length > 0) {
   q = q.in("student_id", studentIds)
  }
  const { data, error } = await q.select("id")
  if (error) throw error
  voided += (data ?? []).length
 })
 return voided
}

/**
 * 退讀：void 該生該班自生效日起（含）未取消排程上的 active 宣告；不改池餘額。
 * 預約退讀（status 仍就讀中）亦應呼叫，避免生效日後堂仍掛宣告。
 */
export async function voidStudentDeclarationsOnClassFromDate(opts: {
 studentId: string
 classId: string
 fromDate: string
}): Promise<number> {
 if (!supabase) return 0
 const fromDate = opts.fromDate.slice(0, 10)
 if (!/^\d{4}-\d{2}-\d{2}$/.test(fromDate)) return 0

 const { data: schedules, error } = await supabase
  .from("schedules")
  .select("id, scheduled_date, status")
  .eq("class_id", opts.classId)
  .gte("scheduled_date", fromDate)
 if (error) throw error

 const scheduleIds = (schedules ?? [])
  .filter((raw) => {
   const status = String((raw as { status?: string }).status ?? "")
   return !status.includes("取消")
  })
  .map((raw) => String((raw as { id: string }).id))
 if (scheduleIds.length === 0) return 0

 return voidActiveDeclarationsForSchedules(scheduleIds, {
  studentIds: [opts.studentId],
 })
}

/**
 * 全班改期／補回：原堂 active（或取消後已 void）→ void；新堂建 active，繼承原 pool_id（補回≠轉池）。
 * 注意：軟取消已先 void 原堂宣告，故補回時須讀 void 列以繼承 pool。
 */
export async function inheritDeclarationsAcrossSchedules(
 pairs: Array<{ fromScheduleId: string; toScheduleId: string }>,
 opts: {
  sourceEventType: DeclarationSourceEventType
  sourceEventId?: string | null
 }
): Promise<number> {
 if (!supabase || pairs.length === 0) return 0
 const fromIds = [...new Set(pairs.map((p) => p.fromScheduleId).filter(Boolean))]
 if (fromIds.length === 0) return 0

 const sourceDecls: AttendanceDeclarationRow[] = []
 await forEachIdChunk(fromIds, DEFAULT_ID_CHUNK, async (chunk) => {
  const { data, error } = await supabase!
   .from("attendance_declarations")
   .select(
    "id, schedule_id, student_id, pool_id, status, superseded_by, source_event_type, source_event_id, manual_reason, created_at"
   )
   .in("schedule_id", chunk)
   .in("status", ["active", "void"])
  if (error) throw error
  for (const raw of data ?? []) {
   sourceDecls.push(mapDeclaration(raw as Record<string, unknown>))
  }
 })
 if (sourceDecls.length === 0) return 0

 // 同生同原堂：優先 active，否則取最新 void
 const bestByKey = new Map<string, AttendanceDeclarationRow>()
 for (const d of sourceDecls) {
  const key = `${d.scheduleId}|${d.studentId}`
  const prev = bestByKey.get(key)
  if (!prev) {
   bestByKey.set(key, d)
   continue
  }
  if (prev.status === "active") continue
  if (d.status === "active") {
   bestByKey.set(key, d)
   continue
  }
  if (d.createdAt > prev.createdAt) bestByKey.set(key, d)
 }
 const decls = [...bestByKey.values()]

 const toByFrom = new Map(pairs.map((p) => [p.fromScheduleId, p.toScheduleId]))
 const now = new Date().toISOString()
 const stillActive = decls.filter((d) => d.status === "active").map((d) => d.id)
 if (stillActive.length > 0) {
  await forEachIdChunk(stillActive, DEFAULT_ID_CHUNK, async (chunk) => {
   const { error } = await supabase!
    .from("attendance_declarations")
    .update({ status: "void", updated_at: now })
    .in("id", chunk)
   if (error) throw error
  })
 }

 const toInsert = decls
  .map((d) => {
   const toId = toByFrom.get(d.scheduleId)
   if (!toId) return null
   return {
    schedule_id: toId,
    student_id: d.studentId,
    pool_id: d.poolId,
    status: "active",
    source_event_type: opts.sourceEventType,
    source_event_id: opts.sourceEventId ?? null,
    updated_at: now,
   }
  })
  .filter((row): row is NonNullable<typeof row> => row != null)

 await insertActiveDeclarationsIgnoringConflicts(toInsert)
 return toInsert.length
}

async function resolvePoolIdForStudentClass(
 studentId: string,
 classId: string,
 preferScheduleId?: string | null
): Promise<string | null> {
 if (!supabase) return null
 if (preferScheduleId) {
  const { data, error } = await supabase
   .from("attendance_declarations")
   .select("pool_id")
   .eq("student_id", studentId)
   .eq("schedule_id", preferScheduleId)
   .eq("status", "active")
   .maybeSingle()
  if (error) throw error
  if (data?.pool_id) return String(data.pool_id)
  // 請假日可能已 void：取最近一則同堂宣告的池
  const { data: anyDecl, error: anyErr } = await supabase
   .from("attendance_declarations")
   .select("pool_id")
   .eq("student_id", studentId)
   .eq("schedule_id", preferScheduleId)
   .order("created_at", { ascending: false })
   .limit(1)
   .maybeSingle()
  if (anyErr) throw anyErr
  if (anyDecl?.pool_id) return String(anyDecl.pool_id)
 }

 const { data: pools, error: poolErr } = await supabase
  .from("student_entitlement_pools")
  .select("id, remaining_lessons, created_at")
  .eq("student_id", studentId)
  .eq("class_id", classId)
  .order("created_at", { ascending: true })
 if (poolErr) throw poolErr
 const rows = (pools ?? []) as Array<{ id: string; remaining_lessons?: number }>
 if (rows.length === 0) return null
 const withBalance = rows.find((r) => Number(r.remaining_lessons ?? 0) > 0)
 return String((withBalance ?? rows[0]!).id)
}

/**
 * 個別請假調堂：補回堂建／改掛宣告（繼承原池）；清調堂則 void 補回堂宣告。
 * 請假日本身宣告預設保留（預填事／病假不扣）。
 */
export async function syncStudentMakeupDeclaration(opts: {
 studentId: string
 classId: string
 leaveScheduleId?: string | null
 leaveRecordId?: string | null
 prevMakeupScheduleId?: string | null
 nextMakeupScheduleId?: string | null
}): Promise<void> {
 if (!supabase) return
 const label = await classLabel(opts.classId)
 if (!usesEntitlementRosterModel(label)) return

 const prev = opts.prevMakeupScheduleId?.trim() || null
 const next = opts.nextMakeupScheduleId?.trim() || null
 if (prev && prev !== next) {
  await voidActiveDeclarationsForSchedules([prev], { studentIds: [opts.studentId] })
 }
 if (!next) return

 const poolId = await resolvePoolIdForStudentClass(
  opts.studentId,
  opts.classId,
  opts.leaveScheduleId ?? null
 )
 if (!poolId) return

 const existing = await fetchActiveDeclarationsForSchedules([next])
 if (existing.some((d) => d.studentId === opts.studentId)) return

 const now = new Date().toISOString()
 await insertActiveDeclarationsIgnoringConflicts([
  {
   schedule_id: next,
   student_id: opts.studentId,
   pool_id: poolId,
   status: "active",
   source_event_type: "student_makeup",
   source_event_id: opts.leaveRecordId ?? null,
   updated_at: now,
  },
 ])
}

/**
 * 班別新增／批次排程後：為就讀中＋gated 報讀補缺宣告（預設不抬池）。
 */
export async function syncDeclarationsAfterSchedulesAdded(classId: string): Promise<void> {
 if (!supabase || !classId) return
 const label = await classLabel(classId)
 if (!usesEntitlementRosterModel(label)) return

 const { data: enrs, error } = await supabase
  .from("student_class_enrollments")
  .select("id, student_id, enrollment_period, enroll_date")
  .eq("class_id", classId)
  .eq("status", "就讀中")
 if (error) throw error
 if (!enrs || enrs.length === 0) return

 const sessionMap = new Map<string, string[]>()
 const singleIds: string[] = []
 for (const raw of enrs) {
  const period = normalizeEnrollmentPeriod(
   (raw as { enrollment_period?: string | null }).enrollment_period
  )
  if (isSingleSessionEnrollment(period)) singleIds.push(String((raw as { id: string }).id))
 }
 if (singleIds.length > 0) {
  await forEachIdChunk(singleIds, DEFAULT_ID_CHUNK, async (chunk) => {
   const { data, error: sessErr } = await supabase!
    .from("student_enrollment_sessions")
    .select("enrollment_id, schedule_id")
    .in("enrollment_id", chunk)
   if (sessErr) throw sessErr
   for (const row of data ?? []) {
    const r = row as { enrollment_id: string; schedule_id: string }
    const list = sessionMap.get(r.enrollment_id) ?? []
    list.push(String(r.schedule_id))
    sessionMap.set(r.enrollment_id, list)
   }
  })
 }

 for (const raw of enrs) {
  const e = raw as {
   id: string
   student_id: string
   enrollment_period: string | null
   enroll_date: string | null
  }
  const period = normalizeEnrollmentPeriod(e.enrollment_period)
  try {
   await ensureEntitlementPoolAndDeclarations({
    enrollmentId: e.id,
    studentId: e.student_id,
    classId,
    enrollmentPeriod: period,
    enrollDate: e.enroll_date,
    scheduleIds: isSingleSessionEnrollment(period) ? sessionMap.get(e.id) : undefined,
    sourceEventType: "enrollment_auto",
    allowRaisePool: false,
   })
  } catch (err) {
   console.error("syncDeclarationsAfterSchedulesAdded failed", e.id, err)
  }
 }
}

/** 營運消耗／返還（≠ 收入認列）；僅 gated 學年 */
export async function applyEntitlementConsumptionDelta(opts: {
 studentId: string
 scheduleId: string
 classId: string
 attendanceDetailId?: string | null
 previousStatus: string | null | undefined
 nextStatus: string | null | undefined
 /** 本堂單位；預設 1 */
 lessonUnits?: number
}): Promise<void> {
 if (!supabase) return
 const label = await classLabel(opts.classId)
 if (!usesEntitlementRosterModel(label)) return

 const wasBillable = isBillableAttendanceStatus(opts.previousStatus)
 const isBillable = isBillableAttendanceStatus(opts.nextStatus)
 if (wasBillable === isBillable) return

 const units = opts.lessonUnits != null && opts.lessonUnits > 0 ? opts.lessonUnits : 1
 const delta = isBillable && !wasBillable ? -units : units

 const { data: decl, error: declErr } = await supabase
  .from("attendance_declarations")
  .select("id, pool_id")
  .eq("student_id", opts.studentId)
  .eq("schedule_id", opts.scheduleId)
  .eq("status", "active")
  .maybeSingle()
 if (declErr) throw declErr
 let poolId = decl?.pool_id != null ? String(decl.pool_id) : null
 const declarationId = decl?.id != null ? String(decl.id) : null
 if (!poolId) {
  poolId = await resolvePoolIdForStudentClass(opts.studentId, opts.classId, opts.scheduleId)
 }
 if (!poolId) return

 const { data: poolRow, error: poolErr } = await supabase
  .from("student_entitlement_pools")
  .select("id, remaining_lessons")
  .eq("id", poolId)
  .maybeSingle()
 if (poolErr) throw poolErr
 if (!poolRow) return

 const remaining = Number(
  (poolRow as { remaining_lessons?: number }).remaining_lessons ?? 0
 )
 const nextRemaining = remaining + delta
 const now = new Date().toISOString()
 const { error: updErr } = await supabase
  .from("student_entitlement_pools")
  .update({ remaining_lessons: nextRemaining, updated_at: now })
  .eq("id", poolId)
 if (updErr) throw updErr

 const { error: evErr } = await supabase.from("entitlement_consumption_events").insert({
  pool_id: poolId,
  student_id: opts.studentId,
  schedule_id: opts.scheduleId,
  attendance_detail_id: opts.attendanceDetailId ?? null,
  declaration_id: declarationId,
  delta_lessons: delta,
  reason: delta < 0 ? "entitlement_consumed" : "entitlement_reinstated",
 })
 if (evErr) throw evErr
}

/** 報讀形式變更：唔硬刪有事件嘅池；原地改 package＋重同步宣告 */
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
  const { count, error: cntErr } = await supabase
   .from("entitlement_consumption_events")
   .select("id", { count: "exact", head: true })
   .eq("pool_id", oldPool.id)
  if (cntErr) throw cntErr
  if ((count ?? 0) > 0) {
   // 已有支付／消耗事件：禁止 DELETE 池；只重同步宣告同 package
   await ensureEntitlementPoolAndDeclarations({
    enrollmentId: opts.enrollmentId,
    studentId: opts.studentId,
    classId: opts.classId,
    enrollmentPeriod: opts.enrollmentPeriod,
    enrollDate: opts.enrollDate,
    scheduleIds: opts.scheduleIds,
    sourceEventType: "enrollment_auto",
   })
   return
  }
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

/**
 * 確認收款後：學費明細 lesson_count → 對應班權益池 top_up（冪等）。
 * 罰款喺 payment_late_fee_items，唔經此路徑。無班／非 gated 學年／堂數≤0 → 略過。
 */
export async function topUpEntitlementsForPayment(opts: {
 paymentId: string
 studentId: string
}): Promise<{ toppedUpDetails: number; lessonsAdded: number }> {
 if (!supabase) return { toppedUpDetails: 0, lessonsAdded: 0 }

 const { data: details, error: dErr } = await supabase
  .from("payment_details")
  .select("id, class_id, lesson_count, description")
  .eq("payment_id", opts.paymentId)
 if (dErr) throw dErr

 let toppedUpDetails = 0
 let lessonsAdded = 0
 const now = new Date().toISOString()

 for (const raw of details ?? []) {
  const detailId = String((raw as { id: unknown }).id)
  const classId =
   (raw as { class_id?: string | null }).class_id != null
    ? String((raw as { class_id: string }).class_id)
    : ""
  const lessons = Number((raw as { lesson_count?: unknown }).lesson_count ?? 0)
  if (!classId || !Number.isFinite(lessons) || lessons <= 0) continue

  const label = await classLabel(classId)
  if (!usesEntitlementRosterModel(label)) continue

  const { data: existingEv, error: exErr } = await supabase
   .from("entitlement_consumption_events")
   .select("id")
   .eq("payment_detail_id", detailId)
   .eq("reason", "entitlement_top_up")
   .maybeSingle()
  if (exErr) throw exErr
  if (existingEv) continue

  const { data: enr, error: enrErr } = await supabase
   .from("student_class_enrollments")
   .select("id, enrollment_period, enroll_date")
   .eq("student_id", opts.studentId)
   .eq("class_id", classId)
   .eq("status", "就讀中")
   .maybeSingle()
  if (enrErr) throw enrErr
  if (!enr) {
   console.warn(
    `[topUpEntitlementsForPayment] 無就讀中報讀，略過抬池 payment_detail=${detailId} class=${classId}`
   )
   continue
  }

  const enrollmentId = String((enr as { id: string }).id)
  const period = normalizeEnrollmentPeriod(
   (enr as { enrollment_period?: string | null }).enrollment_period ?? null
  )
  const pool = await ensureEntitlementPoolAndDeclarations({
   enrollmentId,
   studentId: opts.studentId,
   classId,
   enrollmentPeriod: period,
   enrollDate: (enr as { enroll_date?: string | null }).enroll_date ?? null,
   sourceEventType: "enrollment_auto",
  })
  if (!pool) continue

  const { data: poolRow, error: poolErr } = await supabase
   .from("student_entitlement_pools")
   .select("id, initial_lessons, remaining_lessons")
   .eq("id", pool.id)
   .maybeSingle()
  if (poolErr) throw poolErr
  if (!poolRow) continue

  const initial = Number((poolRow as { initial_lessons?: number }).initial_lessons ?? 0)
  const remaining = Number((poolRow as { remaining_lessons?: number }).remaining_lessons ?? 0)
  const { error: updErr } = await supabase
   .from("student_entitlement_pools")
   .update({
    initial_lessons: initial + lessons,
    remaining_lessons: remaining + lessons,
    updated_at: now,
   })
   .eq("id", pool.id)
  if (updErr) throw updErr

  const { error: evErr } = await supabase.from("entitlement_consumption_events").insert({
   pool_id: pool.id,
   student_id: opts.studentId,
   schedule_id: null,
   attendance_detail_id: null,
   declaration_id: null,
   payment_detail_id: detailId,
   delta_lessons: lessons,
   reason: "entitlement_top_up",
  })
  if (evErr) {
   // 唯一鍵衝突＝已抬過（併發）；視為成功
   if (!String(evErr.message).includes("entitlement_events_payment_detail_reason")) {
    throw evErr
   }
   continue
  }

  toppedUpDetails += 1
  lessonsAdded += lessons
 }

 return { toppedUpDetails, lessonsAdded }
}

/**
 * 作廢單據後：對該單已 top_up 嘅學費明細做 clawback（冪等；可令池短暫變負）。
 */
export async function clawbackEntitlementsForPayment(opts: {
 paymentId: string
 studentId: string
}): Promise<{ clawedBackDetails: number; lessonsRemoved: number }> {
 if (!supabase) return { clawedBackDetails: 0, lessonsRemoved: 0 }

 const { data: details, error: dErr } = await supabase
  .from("payment_details")
  .select("id")
  .eq("payment_id", opts.paymentId)
 if (dErr) throw dErr
 const detailIds = (details ?? []).map((r) => String((r as { id: unknown }).id))
 if (detailIds.length === 0) return { clawedBackDetails: 0, lessonsRemoved: 0 }

 const { data: topUps, error: tErr } = await supabase
  .from("entitlement_consumption_events")
  .select("id, pool_id, payment_detail_id, delta_lessons")
  .in("payment_detail_id", detailIds)
  .eq("reason", "entitlement_top_up")
 if (tErr) throw tErr

 let clawedBackDetails = 0
 let lessonsRemoved = 0
 const now = new Date().toISOString()

 for (const raw of topUps ?? []) {
  const paymentDetailId = String((raw as { payment_detail_id: unknown }).payment_detail_id)
  const poolId = String((raw as { pool_id: unknown }).pool_id)
  const lessons = Number((raw as { delta_lessons?: unknown }).delta_lessons ?? 0)
  if (!Number.isFinite(lessons) || lessons <= 0) continue

  const { data: existingCb, error: cbExErr } = await supabase
   .from("entitlement_consumption_events")
   .select("id")
   .eq("payment_detail_id", paymentDetailId)
   .eq("reason", "entitlement_clawback")
   .maybeSingle()
  if (cbExErr) throw cbExErr
  if (existingCb) continue

  const { data: poolRow, error: poolErr } = await supabase
   .from("student_entitlement_pools")
   .select("id, initial_lessons, remaining_lessons")
   .eq("id", poolId)
   .maybeSingle()
  if (poolErr) throw poolErr
  if (!poolRow) continue

  const initial = Number((poolRow as { initial_lessons?: number }).initial_lessons ?? 0)
  const remaining = Number((poolRow as { remaining_lessons?: number }).remaining_lessons ?? 0)
  const { error: updErr } = await supabase
   .from("student_entitlement_pools")
   .update({
    initial_lessons: Math.max(0, initial - lessons),
    remaining_lessons: remaining - lessons,
    updated_at: now,
   })
   .eq("id", poolId)
  if (updErr) throw updErr

  const { error: evErr } = await supabase.from("entitlement_consumption_events").insert({
   pool_id: poolId,
   student_id: opts.studentId,
   schedule_id: null,
   attendance_detail_id: null,
   declaration_id: null,
   payment_detail_id: paymentDetailId,
   delta_lessons: -lessons,
   reason: "entitlement_clawback",
  })
  if (evErr) {
   if (!String(evErr.message).includes("entitlement_events_payment_detail_reason")) {
    throw evErr
   }
   continue
  }

  clawedBackDetails += 1
  lessonsRemoved += lessons
 }

  return { clawedBackDetails, lessonsRemoved }
}

/** 收款建議：本月會扣堂排程單位 − 池餘（可為 0；可調）。非 gated 學年回 null。 */
export async function fetchTuitionPaymentSuggestion(opts: {
 studentId: string
 classId: string
 /** YYYY-MM；預設本月 */
 yearMonth?: string
}): Promise<{
 suggestedLessons: number
 chargeableUnits: number
 remainingLessons: number
} | null> {
 if (!supabase) return null
 const label = await classLabel(opts.classId)
 if (!usesEntitlementRosterModel(label)) return null

 const ym = (opts.yearMonth ?? new Date().toISOString().slice(0, 7)).slice(0, 7)
 if (!/^\d{4}-\d{2}$/.test(ym)) return null
 const from = `${ym}-01`
 const lastDay = new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)), 0).getDate()
 const to = `${ym}-${String(lastDay).padStart(2, "0")}`

 const { data: classRow, error: cErr } = await supabase
  .from("classes")
  .select("lesson_slots_per_session")
  .eq("id", opts.classId)
  .maybeSingle()
 if (cErr) throw cErr
 const perSession = lessonUnits(
  (classRow as { lesson_slots_per_session?: number | null } | null)?.lesson_slots_per_session
 )

 const { data: schedRows, error: sErr } = await supabase
  .from("schedules")
  .select("id, status")
  .eq("class_id", opts.classId)
  .gte("scheduled_date", from)
  .lte("scheduled_date", to)
 if (sErr) throw sErr

 let chargeableUnits = 0
 for (const raw of schedRows ?? []) {
  const status = String((raw as { status?: string }).status ?? "")
  if (status.includes("取消")) continue
  chargeableUnits += perSession
 }

 const { data: poolRows, error: pErr } = await supabase
  .from("student_entitlement_pools")
  .select("remaining_lessons, source_enrollment_id")
  .eq("student_id", opts.studentId)
  .eq("class_id", opts.classId)
 if (pErr) throw pErr

 let remainingLessons = 0
 if (poolRows && poolRows.length > 0) {
  const { data: enr, error: eErr } = await supabase
   .from("student_class_enrollments")
   .select("id")
   .eq("student_id", opts.studentId)
   .eq("class_id", opts.classId)
   .eq("status", "就讀中")
   .maybeSingle()
  if (eErr) throw eErr
  const enrId = enr ? String((enr as { id: string }).id) : null
  const match = enrId
   ? poolRows.find(
      (r) => String((r as { source_enrollment_id: unknown }).source_enrollment_id) === enrId
     )
   : poolRows[0]
  remainingLessons = Number(
   (match as { remaining_lessons?: number } | undefined)?.remaining_lessons ?? 0
  )
 }

 return {
  suggestedLessons: suggestedTuitionLessons({
   chargeableScheduleUnits: chargeableUnits,
   remainingLessons,
  }),
  chargeableUnits,
  remainingLessons,
 }
}

export { isSingleSessionEnrollment, isSummerTwoPeriodMode }
