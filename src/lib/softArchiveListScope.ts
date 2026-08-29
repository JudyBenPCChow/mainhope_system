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
