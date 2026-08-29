/**
 * 正規課程逾期學費罰款（收款自動加 $50）。
 * 前線口徑：docs/playbooks/frontdesk/TUITION_LATE_FEE_FRONTLINE.md
 */

/** 固定金額；日後可改 config／DB */
export const LATE_FEE_AMOUNT = 50

/** 系統化生效日（含當日） */
export const LATE_FEE_EFFECTIVE_DATE = "2026-10-01"

export const LATE_FEE_LABEL = "逾期罰款"

export function localTodayYmd(): string {
 const d = new Date()
 return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function billingMonthFromYmd(ymd: string): string {
 return ymd.trim().slice(0, 7)
}

export function isLateFeeSystemActive(todayYmd: string = localTodayYmd()): boolean {
 return todayYmd >= LATE_FEE_EFFECTIVE_DATE
}

export function isLateFeeEligibleCourse(params: {
 courseMode: string | null | undefined
 classKind: string | null | undefined
}): boolean {
 const mode = String(params.courseMode ?? "regular").trim()
 const kind = String(params.classKind ?? "group").trim()
 if (kind === "private" || kind === "homework") return false
 if (mode !== "regular") return false
 if (mode.toLowerCase().includes("summer")) return false
 return true
}

export type LateFeePoolRow = {
 classId: string
 courseMode: string
 classKind: string
 paidLessons: number
 billableBefore: number
 billableAfter: number
 coveredForNew: number
 triggerLateFee: boolean
 alreadyHandledMonth: boolean
}

/** 本單應自動加罰的班（已有學費行、trigger、未處理本月、合資格） */
export function selectAutoLateFeeClassIds(params: {
 pools: LateFeePoolRow[]
 tuitionClassIdsOnReceipt: string[]
}): LateFeePoolRow[] {
 const onReceipt = new Set(params.tuitionClassIdsOnReceipt.filter(Boolean))
 return params.pools.filter(
  (p) =>
   onReceipt.has(p.classId) &&
   isLateFeeEligibleCourse(p) &&
   p.triggerLateFee &&
   !p.alreadyHandledMonth
 )
}

export function sumNonWaivedLateFees(
 items: Array<{ amount: number; waived: boolean }>
): number {
 let s = 0
 for (const it of items) {
  if (it.waived) continue
  if (Number.isFinite(it.amount) && it.amount > 0) s += it.amount
 }
 return Math.round(s * 100) / 100
}
