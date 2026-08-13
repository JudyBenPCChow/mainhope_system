/**
 * 繳費建議堂數：max(0, 本月會扣堂排程單位 − 池餘)
 * 產品：docs/product/topics/summer-enrollment-roster-consistency.md §4.4／§4.6
 */

export function suggestedTuitionLessons(params: {
 /** 該月該科預期會扣堂嘅排程單位合計 */
 chargeableScheduleUnits: number
 /** 同班同學年包裝池 remaining（可負） */
 remainingLessons: number
}): number {
 const chargeable = Number.isFinite(params.chargeableScheduleUnits)
  ? Math.max(0, params.chargeableScheduleUnits)
  : 0
 const remaining = Number.isFinite(params.remainingLessons) ? params.remainingLessons : 0
 return Math.max(0, chargeable - remaining)
}
