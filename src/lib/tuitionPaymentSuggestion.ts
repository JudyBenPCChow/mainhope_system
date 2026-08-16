/**
 * 繳費建議堂數：max(0, 本月會扣堂排程單位 − 池餘)
 * 產品：docs/product/topics/summer-enrollment-roster-consistency.md §4.4／§4.6
 * 2627 專科小組：單位＝該組別（同一級）本月所有就讀班，唔係單科。
 */

export function suggestedTuitionLessons(params: {
 /** 該月該組別（或該班）預期會扣堂嘅排程單位合計 */
 chargeableScheduleUnits: number
 /** 同組別池 remaining（可負） */
 remainingLessons: number
}): number {
 const chargeable = Number.isFinite(params.chargeableScheduleUnits)
  ? Math.max(0, params.chargeableScheduleUnits)
  : 0
 const remaining = Number.isFinite(params.remainingLessons) ? params.remainingLessons : 0
 return Math.max(0, chargeable - remaining)
}
