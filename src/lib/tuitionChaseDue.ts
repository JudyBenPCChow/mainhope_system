/**
 * 學費追收：以已繳堂數尚餘對本期還會扣／下期會扣，算出要交堂數。
 * 不看收款日。產品見 docs/product/topics/tuition-chase-list.md
 */

export type TuitionChaseDue = {
 thisPeriodDueLessons: number
 remainingAfterThisPeriod: number
 nextPeriodDueLessons: number
 suggestedLessons: number
}

export type TuitionChaseQueueStatus = "now" | "next" | "prepaid" | "unknown"

export function tuitionChaseDueFromInventory(params: {
 remainingLessons: number
 thisPeriodPendingUnits: number
 nextPeriodUnits: number
}): TuitionChaseDue {
 const remaining = Number.isFinite(params.remainingLessons) ? params.remainingLessons : 0
 const pending = Number.isFinite(params.thisPeriodPendingUnits)
  ? Math.max(0, params.thisPeriodPendingUnits)
  : 0
 const next = Number.isFinite(params.nextPeriodUnits) ? Math.max(0, params.nextPeriodUnits) : 0
 const thisPeriodDueLessons = Math.max(0, pending - remaining)
 const remainingAfterThisPeriod = remaining - pending
 const nextPeriodDueLessons = Math.max(0, next - Math.max(0, remainingAfterThisPeriod))
 return {
  thisPeriodDueLessons,
  remainingAfterThisPeriod,
  nextPeriodDueLessons,
  suggestedLessons: thisPeriodDueLessons + nextPeriodDueLessons,
 }
}

export function tuitionChaseQueueStatus(
 due: Pick<TuitionChaseDue, "thisPeriodDueLessons" | "nextPeriodDueLessons">,
 remainingKnown = true
): TuitionChaseQueueStatus {
 if (!remainingKnown) return "unknown"
 if (due.thisPeriodDueLessons > 0) return "now"
 if (due.nextPeriodDueLessons > 0) return "next"
 return "prepaid"
}

/** 已預繳且各組別均有結餘，才可預設隱藏。缺池列必須留在名單。 */
export function isHideableTuitionChasePrepaid(row: {
 status: TuitionChaseQueueStatus
 pools: readonly { remainingKnown: boolean }[]
}): boolean {
 return row.status === "prepaid" && row.pools.every((p) => p.remainingKnown)
}
