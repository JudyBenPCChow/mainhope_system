/**
 * 列表學年窗 vs 待辦豁免（軟封存波次 4）。
 * 待處理請假／未完成試堂唔因年份窗從待辦消失。
 */

export function leaveStatusExemptFromOpsYearWindow(status: string): boolean {
 const s = status.trim()
 if (s.includes("放棄")) return false
 if (s.includes("已補課") || s.includes("已完成")) return false
 return true
}

export function trialStatusExemptFromOpsYearWindow(status: string): boolean {
 const s = status.trim()
 if (s.includes("取消")) return false
 if (s.includes("完成")) return false
 return true
}

export function rowPassesOpsYearWindow(params: {
 exempt: boolean
 classAcademicYearId: string | null | undefined
 opsYearIds: ReadonlySet<string>
}): boolean {
 if (params.exempt) return true
 const yearId = (params.classAcademicYearId ?? "").trim()
 if (!yearId) return true
 return params.opsYearIds.has(yearId)
}

/** 隱藏筆數＝已關閉總數 − 窗內 − 無學年而保留。任一 count 失敗則 0（唔空表）。 */
export function hiddenOlderCountFromParts(
 allClosed: number | null,
 inWindow: number | null,
 keptWithoutYear: number | null
): number {
 if (allClosed == null || inWindow == null || keptWithoutYear == null) return 0
 return Math.max(0, allClosed - inWindow - keptWithoutYear)
}

/** 營運窗預設生效日：窗起日之後，或空白生效日（避免靜默消失）。 */
export function enrollmentOpsEffectiveDateOrFilter(startYmd: string): string {
 return `effective_date.gte.${startYmd},effective_date.is.null`
}

/** 班別學年 ∈ ops 窗，或學年空白（避免誤藏）。 */
export function academicYearIdOpsOrFilter(yearIds: readonly string[]): string {
 const ids = yearIds.map((id) => id.trim()).filter(Boolean)
 if (ids.length === 0) return "academic_year_id.is.null"
 return `academic_year_id.in.(${ids.join(",")}),academic_year_id.is.null`
}

/**
 * 班別管理學年下拉：只有選到窗外的具體學年先要載入更舊。
 * 「目前學年／已載入學年」只係 vis 篩選，唔觸發全量。
 */
export function classYearFilterRequiresOlderYears(
 filterValue: string,
 opsYearLabels: readonly string[]
): boolean {
 const v = filterValue.trim()
 if (v === "" || v === "current" || v === "all") return false
 if (opsYearLabels.length === 0) return false
 return !opsYearLabels.includes(v)
}

/**
 * 堂數對帳：待補／請假待安排豁免年份窗；已畢業只留豁免列；其餘跟班別學年。
 */
export function lessonBalancePassesOpsWindow(params: {
 pendingLessons: number
 leaveAwaitingMakeupCount: number
 classAcademicYearId: string | null | undefined
 opsYearIds: ReadonlySet<string>
 studentArchived?: boolean
}): boolean {
 if (params.pendingLessons > 0 || params.leaveAwaitingMakeupCount > 0) return true
 if (params.studentArchived) return false
 return rowPassesOpsYearWindow({
  exempt: false,
  classAcademicYearId: params.classAcademicYearId,
  opsYearIds: params.opsYearIds,
 })
}

/** 繳費日常列表：窗起日之後、空白收款日，或待收款／待繳費（唔因年份窗從待辦消失）。 */
export function paymentOpsListOrFilter(params: {
 startYmd: string
 pendingPayStatus: string
 pendingReceiveStatus: string
}): string {
 return [
  `payment_date.gte.${params.startYmd}`,
  "payment_date.is.null",
  `status.eq.${params.pendingPayStatus}`,
  `status.eq.${params.pendingReceiveStatus}`,
 ].join(",")
}

export function formatOpsYearScopeCaption(labels: readonly string[]): string {
 const uniq = [...new Set(labels.map((x) => x.trim()).filter(Boolean))]
 if (uniq.length === 0) return "日常營運窗"
 return `日常營運窗（${uniq.join("、")}）`
}
