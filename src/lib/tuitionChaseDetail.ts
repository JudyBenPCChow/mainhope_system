/**
 * 學費追收右側詳情：款項歸組、扣堂分桶（已扣／本期還會扣／下期會扣）。
 * 產品見 docs/product/topics/tuition-chase-list.md
 */
import { namespacesEqual, type EntitlementNamespace } from "@/lib/entitlementNamespace"

export type ChaseScheduleBucket = "deducted" | "thisPeriodPending" | "nextPeriod" | "skip"

export type ChaseAttendanceMark = "billable" | "nondeduct"

/** 調堂／改期補回：宣告可能落在非就讀班，但仍扣同一已繳堂數組別。 */
export const CROSS_CLASS_CHASE_DECLARATION_SOURCES = [
 "student_makeup",
 "class_reschedule",
] as const

export type ChaseDeclarationPoolRef = {
 studentId: string
 academicYearId: string | null
 courseGroup: string
 namespaceKey: string
}

/**
 * 專科追收計哪幾堂：以 active 宣告為準，不是該班全部排程。
 * 就讀班的宣告（單堂只會有已綁的堂）；調堂／改期補回可在別班，但須同一池。
 * 退讀班殘留的 enrollment_auto 不計。
 */
export function chaseDeclarationAppliesToPool(opts: {
 classId: string
 poolClassIds: ReadonlySet<string>
 sourceEventType: string | null | undefined
 declarationPool: ChaseDeclarationPoolRef | null
 pool: {
  studentId: string
  academicYearId: string
  namespace: Pick<EntitlementNamespace, "courseGroup" | "namespaceKey">
 }
}): boolean {
 if (opts.poolClassIds.has(opts.classId)) return true
 const src = String(opts.sourceEventType ?? "").trim()
 if (!(CROSS_CLASS_CHASE_DECLARATION_SOURCES as readonly string[]).includes(src)) return false
 const dp = opts.declarationPool
 if (!dp) return false
 if (dp.studentId !== opts.pool.studentId) return false
 if (dp.courseGroup !== opts.pool.namespace.courseGroup) return false
 if (dp.namespaceKey !== opts.pool.namespace.namespaceKey) return false
 if (dp.academicYearId && dp.academicYearId !== opts.pool.academicYearId) return false
 return true
}

export function classifyChaseSchedule(opts: {
 scheduledDate: string
 currentPeriodDates: ReadonlySet<string>
 nextPeriodDates: ReadonlySet<string>
 attendance?: ChaseAttendanceMark
}): ChaseScheduleBucket {
 const d = String(opts.scheduledDate ?? "").slice(0, 10)
 if (opts.currentPeriodDates.has(d)) {
  if (opts.attendance === "billable") return "deducted"
  if (opts.attendance === "nondeduct") return "skip"
  return "thisPeriodPending"
 }
 if (opts.nextPeriodDates.has(d)) return "nextPeriod"
 return "skip"
}

export function paymentDetailMatchesPool(opts: {
 pool: { academicYearId: string; namespace: EntitlementNamespace }
 detail: {
  academicYearId: string | null
  namespace: EntitlementNamespace
  skipLessons?: boolean
  lessonCount?: number
 }
}): boolean {
 if (opts.detail.skipLessons) return false
 if (opts.detail.namespace.courseGroup === "homework") return false
 if (opts.detail.namespace.courseGroup === "trial") return false
 if (opts.detail.lessonCount != null && !isTuitionChaseTuitionLessonCount(opts.detail.lessonCount)) {
  return false
 }
 if (!namespacesEqual(opts.detail.namespace, opts.pool.namespace)) return false
 if (!opts.detail.academicYearId) {
  return opts.pool.namespace.courseGroup === "private"
 }
 return opts.detail.academicYearId === opts.pool.academicYearId
}

/** 已收款堂數只計學費行（優惠／罰款／月費堂數為 0 者不入）。 */
export function isTuitionChaseTuitionLessonCount(lessonCount: number | null | undefined): boolean {
 return Number.isFinite(lessonCount) && Number(lessonCount) >= 1
}

export function tuitionChaseSubjectSubtotals(
 lines: readonly { classLabel: string; units: number }[]
): { label: string; units: number }[] {
 const map = new Map<string, number>()
 for (const line of lines) {
  const label = line.classLabel.trim() || "（未命名）"
  map.set(label, (map.get(label) ?? 0) + line.units)
 }
 return [...map.entries()]
  .map(([label, units]) => ({ label, units }))
  .sort((a, b) => a.label.localeCompare(b.label, "zh-Hant"))
}

export function formatTuitionChaseSubjectSubtotals(
 lines: readonly { classLabel: string; units: number }[]
): string {
 return tuitionChaseSubjectSubtotals(lines)
  .map((row) => `${row.label} ${row.units} 堂`)
  .join("、")
}

export function defaultTuitionChasePoolKey(
 pools: readonly { poolKey: string; suggestedLessons: number; remainingKnown?: boolean }[]
): string | null {
 const due = pools.find((p) => p.suggestedLessons > 0)
 if (due) return due.poolKey
 const missing = pools.find((p) => p.remainingKnown === false)
 return missing?.poolKey ?? pools[0]?.poolKey ?? null
}
