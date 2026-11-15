import {
 ENTITLEMENT_ADJUSTMENT_REASON_LABELS,
 type EntitlementAdjustmentReasonCode,
} from "@/lib/entitlementAdjustment"
import { entitlementNamespaceLabel, type EntitlementCourseGroup } from "@/lib/entitlementNamespace"
import { formatClassLabel } from "@/lib/courseLabel"
import { supabase } from "@/lib/supabaseClient"

export type EntitlementPoolSummary = {
 id: string
 studentId: string
 classId: string
 classLabel: string
 packageType: string
 remainingLessons: number
 initialLessons: number
 sourceEnrollmentId: string
}

export type EntitlementAdjustmentRow = {
 id: string
 adjustmentBatchId: string
 poolId: string
 studentId: string
 classId: string
 classLabel: string
 deltaLessons: number
 reasonCode: EntitlementAdjustmentReasonCode
 reasonLabel: string
 notes: string
 beforeRemaining: number
 afterRemaining: number
 relatedPoolId: string | null
 createdByEmail: string | null
 createdByName: string | null
 createdAt: string
}

function poolDisplayLabel(raw: Record<string, unknown>): string {
 const cls = raw.classes as Record<string, unknown> | null
 const course = cls?.courses as Record<string, unknown> | null
 const classLabel = formatClassLabel({
  subject: cls?.subject != null ? String(cls.subject) : "",
  courseCode: cls?.course_code_full != null ? String(cls.course_code_full) : null,
  courseName: course?.course_name != null ? String(course.course_name) : null,
 })
 const courseGroup = String(raw.course_group ?? "group_specialist") as EntitlementCourseGroup
 const namespaceKey = String(raw.namespace_key ?? "")
 const sharesAcrossClasses =
  courseGroup === "group_specialist" && namespaceKey !== "" && !namespaceKey.startsWith("class:")
 return entitlementNamespaceLabel({ courseGroup, namespaceKey, sharesAcrossClasses }, classLabel)
}

function mapPoolSummary(
 raw: Record<string, unknown>,
 classLabel: string
): EntitlementPoolSummary {
 return {
  id: String(raw.id),
  studentId: String(raw.student_id),
  classId: raw.class_id != null ? String(raw.class_id) : "",
  classLabel,
  packageType: String(raw.package_type ?? ""),
  remainingLessons: Number(raw.remaining_lessons ?? 0),
  initialLessons: Number(raw.initial_lessons ?? 0),
  sourceEnrollmentId: raw.source_enrollment_id != null ? String(raw.source_enrollment_id) : "",
 }
}

export async function fetchPoolsForStudent(
 studentId: string
): Promise<EntitlementPoolSummary[]> {
 if (!supabase || !studentId) return []
 const { data, error } = await supabase
  .from("student_entitlement_pools")
  .select(
   "id, student_id, class_id, package_type, remaining_lessons, initial_lessons, source_enrollment_id, course_group, namespace_key, classes ( subject, course_code_full, courses ( course_name ) )"
  )
  .eq("student_id", studentId)
  .order("created_at", { ascending: false })
 if (error) throw error
 return (data ?? []).map((row) => {
  const raw = row as Record<string, unknown>
  return mapPoolSummary(raw, poolDisplayLabel(raw))
 })
}

export async function fetchRecentPoolAdjustments(opts?: {
 studentId?: string
 limit?: number
}): Promise<EntitlementAdjustmentRow[]> {
 if (!supabase) return []
 const limit = Math.min(Math.max(opts?.limit ?? 30, 1), 100)
 let q = supabase
  .from("entitlement_pool_adjustments")
  .select(
   "id, adjustment_batch_id, pool_id, student_id, class_id, delta_lessons, reason_code, notes, related_pool_id, before_remaining, after_remaining, created_by_email, created_by_name, created_at, classes ( subject, course_code_full, courses ( course_name ) )"
  )
  .order("created_at", { ascending: false })
  .limit(limit)
 if (opts?.studentId) q = q.eq("student_id", opts.studentId)
 const { data, error } = await q
 if (error) throw error
 return (data ?? []).map((row) => {
  const raw = row as Record<string, unknown>
  const cls = raw.classes as Record<string, unknown> | null
  const course = cls?.courses as Record<string, unknown> | null
  const reasonCode = String(raw.reason_code) as EntitlementAdjustmentReasonCode
  return {
   id: String(raw.id),
   adjustmentBatchId: String(raw.adjustment_batch_id),
   poolId: String(raw.pool_id),
   studentId: String(raw.student_id),
   classId: String(raw.class_id),
   classLabel: formatClassLabel({
    subject: cls?.subject != null ? String(cls.subject) : "",
    courseCode: cls?.course_code_full != null ? String(cls.course_code_full) : null,
    courseName: course?.course_name != null ? String(course.course_name) : null,
   }),
   deltaLessons: Number(raw.delta_lessons ?? 0),
   reasonCode,
   reasonLabel: ENTITLEMENT_ADJUSTMENT_REASON_LABELS[reasonCode] ?? reasonCode,
   notes: String(raw.notes ?? ""),
   beforeRemaining: Number(raw.before_remaining ?? 0),
   afterRemaining: Number(raw.after_remaining ?? 0),
   relatedPoolId: raw.related_pool_id != null ? String(raw.related_pool_id) : null,
   createdByEmail: raw.created_by_email != null ? String(raw.created_by_email) : null,
   createdByName: raw.created_by_name != null ? String(raw.created_by_name) : null,
   createdAt: String(raw.created_at ?? ""),
  }
 })
}

/** 單池增減堂數（G2a／其他）；delta 可正可負，不可為 0。僅外星人。 */
export async function adjustEntitlementPool(opts: {
 poolId: string
 deltaLessons: number
 reasonCode: EntitlementAdjustmentReasonCode
 notes: string
 relatedPaymentId?: string | null
}): Promise<EntitlementPoolSummary> {
 if (!supabase) throw new Error("Supabase 未設定")
 const notes = opts.notes.trim()
 if (notes.length < 2) throw new Error("請填寫調動原因備註（至少 2 字）")
 const delta = Number(opts.deltaLessons)
 if (!Number.isFinite(delta) || delta === 0 || !Number.isInteger(delta)) {
  throw new Error("調動堂數須為非 0 整數")
 }

 const { data: pool, error: poolErr } = await supabase
  .from("student_entitlement_pools")
  .select("id, student_id")
  .eq("id", opts.poolId)
  .maybeSingle()
 if (poolErr) throw poolErr
 if (!pool) throw new Error("找不到已繳堂數記錄")

 const { error } = await supabase.rpc("adjust_entitlement_pool", {
  p_pool_id: opts.poolId,
  p_delta_lessons: delta,
  p_reason_code: opts.reasonCode,
  p_notes: notes,
  p_related_payment_id: opts.relatedPaymentId ?? undefined,
 })
 if (error) throw error

 const pools = await fetchPoolsForStudent(String((pool as { student_id: string }).student_id))
 const updated = pools.find((p) => p.id === opts.poolId)
 if (!updated) throw new Error("調動後無法重讀已繳堂數")
 return updated
}

/** 由來源池搬堂去目標池（G2b／轉科／送親友）；兩邊學生可不同（送親友）。僅外星人。 */
export async function transferEntitlementLessons(opts: {
 fromPoolId: string
 toPoolId: string
 lessons: number
 reasonCode: EntitlementAdjustmentReasonCode
 notes: string
}): Promise<{ from: EntitlementPoolSummary; to: EntitlementPoolSummary }> {
 if (!supabase) throw new Error("Supabase 未設定")
 const notes = opts.notes.trim()
 if (notes.length < 2) throw new Error("請填寫搬堂原因備註（至少 2 字）")
 const lessons = Number(opts.lessons)
 if (!Number.isFinite(lessons) || lessons <= 0 || !Number.isInteger(lessons)) {
  throw new Error("搬堂數須為正整數")
 }
 if (opts.fromPoolId === opts.toPoolId) throw new Error("來源池同目標池不可相同")

 const { data: rows, error } = await supabase
  .from("student_entitlement_pools")
  .select("id, student_id")
  .in("id", [opts.fromPoolId, opts.toPoolId])
 if (error) throw error
 const from = (rows ?? []).find((r) => String((r as { id: string }).id) === opts.fromPoolId)
 const to = (rows ?? []).find((r) => String((r as { id: string }).id) === opts.toPoolId)
 if (!from || !to) throw new Error("找不到來源或目標已繳堂數記錄")

 const { error: rpcErr } = await supabase.rpc("transfer_entitlement_lessons", {
  p_from_pool_id: opts.fromPoolId,
  p_to_pool_id: opts.toPoolId,
  p_lessons: lessons,
  p_reason_code: opts.reasonCode,
  p_notes: notes,
 })
 if (rpcErr) throw rpcErr

 const fromPools = await fetchPoolsForStudent(String((from as { student_id: string }).student_id))
 const toPools = await fetchPoolsForStudent(String((to as { student_id: string }).student_id))
 const fromSummary = fromPools.find((p) => p.id === opts.fromPoolId)
 const toSummary = toPools.find((p) => p.id === opts.toPoolId)
 if (!fromSummary || !toSummary) throw new Error("搬堂後無法重讀已繳堂數")
 return { from: fromSummary, to: toSummary }
}
