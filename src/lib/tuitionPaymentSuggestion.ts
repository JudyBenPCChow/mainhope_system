/**
 * 繳費建議堂數。
 * 專科／私人行級：該班本期未扣排程數（不減尚餘）。
 * 舊公式 suggestedTuitionLessons 僅保留給對帳／測試，收款登記不再用。
 */

/** 該行班別本期未扣排程數；0 表示此班本期沒有未扣堂，不是「全組不用收」。 */
export function suggestedClassPeriodPendingLessons(pendingUnits: number): number {
 return Number.isFinite(pendingUnits) ? Math.max(0, pendingUnits) : 0
}

/** @deprecated 行級不再減池餘；保留公式單測。 */
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
