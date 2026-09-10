/**
 * 學費追收畫面用詞：前台要先看到「本期／下期要不要收、收多少堂」。
 */
import { entitlementNamespaceLabel, type EntitlementNamespace } from "@/lib/entitlementNamespace"
import type { TuitionChaseQueueStatus } from "@/lib/tuitionChaseDue"
import { weekdayLabelFromYmd } from "@/lib/weekdayUtils"

export const TUITION_CHASE_REMAINING_HINT =
 "此組別已繳而未扣。同一級專科班共用，私人課程分開。"

export function tuitionChaseQueueStatusLabel(status: TuitionChaseQueueStatus): string {
 if (status === "now") return "現在要追"
 if (status === "next") return "下期要追"
 if (status === "unknown") return "未有結餘資料"
 return "已預繳"
}

/** 要交堂數：0＝不用收（是非題），>0＝堂數。 */
export function formatTuitionChaseDueLessons(n: number): string {
 return n > 0 ? `${n} 堂` : "不用收"
}

export function formatTuitionChaseUnpaidLessons(remainingLessons: number): string | null {
 if (!(remainingLessons < 0)) return null
 return `已上課未付款 ${Math.abs(remainingLessons)} 堂`
}

/** 排程列日期：M/D（週幾），例如 9/10（四）。 */
export function formatTuitionChaseScheduleDate(ymd: string): string {
 const wd = weekdayLabelFromYmd(ymd)
 const short = wd ? wd.replace("星期", "") : ""
 const parts = ymd.split("-")
 const m = parts[1]
 const d = parts[2]
 if (!m || !d) return ymd
 return `${Number(m)}/${Number(d)}${short ? `（${short}）` : ""}`
}

export function formatTuitionChaseTimeRange(start: string | null, end: string | null): string {
 if (start && end) return `${start}–${end}`
 return start ?? ""
}

export function formatTuitionChaseRemainingAfterThisPeriod(
 remainingAfterThisPeriod: number,
 remainingKnown: boolean
): string {
 if (!remainingKnown) return "未有結餘資料"
 if (remainingAfterThisPeriod < 0) return `尚欠 ${Math.abs(remainingAfterThisPeriod)} 堂`
 return `${remainingAfterThisPeriod} 堂`
}

export function tuitionChaseSuggestedOnceCaption(lessons: number): string {
 if (lessons <= 0) return "兩期均不用另收。"
 return `可一次收齊 ${lessons} 堂（兩期，非硬性）。`
}

export function tuitionChasePoolLabel(
 ns: Pick<EntitlementNamespace, "courseGroup" | "namespaceKey" | "sharesAcrossClasses">,
 classLabels: readonly string[]
): string {
 const subjects = [...new Set(classLabels.map((s) => s.trim()).filter(Boolean))]
 const base = entitlementNamespaceLabel(ns, subjects[0] ?? "")
 if (ns.courseGroup === "group_specialist" && ns.sharesAcrossClasses && subjects.length > 0) {
  return `${base} · ${subjects.join("、")}`
 }
 return base
}

/** 名單組別欄：班別編號＋報讀班名（私人課程常無編號）。 */
export type TuitionChaseEnrolledClass = {
 classId: string
 courseCode: string | null
 displayName: string
}

export function formatTuitionChaseEnrolledClass(
 c: Pick<TuitionChaseEnrolledClass, "courseCode" | "displayName">
): string {
 const name = c.displayName.trim() || "—"
 const code = (c.courseCode ?? "").trim()
 return code ? `${code} ${name}` : name
}

export function sortTuitionChaseEnrolledClasses(
 classes: readonly TuitionChaseEnrolledClass[]
): TuitionChaseEnrolledClass[] {
 return [...classes].sort((a, b) => {
  const ca = (a.courseCode ?? "").localeCompare(b.courseCode ?? "", "zh-Hant")
  if (ca !== 0) return ca
  return a.displayName.localeCompare(b.displayName, "zh-Hant")
 })
}

export function tuitionChaseInventoryCaption(params: {
 remainingLessons: number
 thisPeriodPendingUnits: number
 nextPeriodUnits: number
 thisPeriodLabel: string
 nextPeriodLabel: string
 remainingAfterThisPeriod?: number
 remainingKnown?: boolean
}): string {
 if (params.remainingKnown === false) {
  return `未有結餘資料 · ${params.thisPeriodLabel}還會扣 ${params.thisPeriodPendingUnits} · ${params.nextPeriodLabel}會扣 ${params.nextPeriodUnits}`
 }
 const unpaid = formatTuitionChaseUnpaidLessons(params.remainingLessons)
 const remainingBit = unpaid
  ? `尚餘可扣堂數 ${params.remainingLessons}（${unpaid}）`
  : `尚餘可扣堂數 ${params.remainingLessons}`
 const base = `${remainingBit} · ${params.thisPeriodLabel}還會扣 ${params.thisPeriodPendingUnits} · ${params.nextPeriodLabel}會扣 ${params.nextPeriodUnits}`
 if (params.remainingAfterThisPeriod == null) return base
 if (params.remainingAfterThisPeriod < 0) {
  return `${base} · 扣完本期後尚欠 ${Math.abs(params.remainingAfterThisPeriod)} 堂`
 }
 return `${base} · 扣完本期後尚餘 ${params.remainingAfterThisPeriod} 堂`
}

export type TuitionChaseSkipInventory = {
 remainingLessons: number
 remainingAfterThisPeriod: number
 thisPeriodPendingUnits: number
 thisPeriodDueLessons: number
 thisPeriodDeductedUnits?: number
 thisPeriodNondeductUnits?: number
 remainingKnown?: boolean
}

/** 名單「不用收」下方短因：尚餘已夠／先前已繳未用／請假不扣／已扣完／無排程。 */
export function tuitionChaseThisPeriodSkipReason(params: TuitionChaseSkipInventory): string | null {
 if (params.thisPeriodDueLessons > 0) return null
 if (params.remainingKnown === false) return "未有結餘資料"
 const pending = params.thisPeriodPendingUnits
 if (pending > 0) {
  if (params.remainingAfterThisPeriod > 0) return "先前已繳未用完"
  return "尚餘已夠本期"
 }
 const deducted = params.thisPeriodDeductedUnits ?? 0
 const leave = params.thisPeriodNondeductUnits ?? 0
 if (leave > 0 && deducted === 0) return "本期請假不扣"
 if (leave > 0) return "本期已扣完（另有請假）"
 if (deducted > 0) return "本期已扣完"
 return "本期沒有排程"
}

function tuitionChaseThisPeriodWhyPart(params: TuitionChaseSkipInventory & { thisPeriodLabel: string }): string {
 const rem = params.remainingLessons
 const pending = params.thisPeriodPendingUnits
 const dueThis = params.thisPeriodDueLessons
 const deducted = params.thisPeriodDeductedUnits
 const leave = params.thisPeriodNondeductUnits
 if (dueThis > 0) {
  if (rem < 0) {
   return `已上課未付款 ${Math.abs(rem)} 堂，${params.thisPeriodLabel}要收 ${dueThis} 堂`
  }
  return `${params.thisPeriodLabel}要收 ${dueThis} 堂：尚餘 ${rem} 堂不夠還會扣 ${pending} 堂`
 }
 if (pending > 0) {
  if (params.remainingAfterThisPeriod > 0) {
   return `${params.thisPeriodLabel}不用收：尚餘 ${rem} 堂已夠還會扣 ${pending} 堂，扣完本期後仍有 ${params.remainingAfterThisPeriod} 堂（先前已繳未用完）`
  }
  return `${params.thisPeriodLabel}不用收：尚餘 ${rem} 堂剛好覆蓋還會扣 ${pending} 堂`
 }
 if (leave != null && leave > 0 && (deducted == null || deducted === 0)) {
  return `${params.thisPeriodLabel}不用收：本期 ${leave} 堂已點事假／病假，不扣堂數`
 }
 if (leave != null && leave > 0 && deducted != null && deducted > 0) {
  return `${params.thisPeriodLabel}不用收：本期已扣完 ${deducted} 堂；另有 ${leave} 堂事假／病假不扣`
 }
 if (deducted != null && deducted > 0) {
  return `${params.thisPeriodLabel}不用收：本期已扣完 ${deducted} 堂`
 }
 if (deducted != null || leave != null) {
  return `${params.thisPeriodLabel}不用收：本期沒有排程`
 }
 return `${params.thisPeriodLabel}不用收：本期沒有還會扣的堂`
}

/** 解釋「不用收」是尚餘已夠、先前已繳未用、請假不扣，還是本期已扣完／無堂。一句，放在要交數字下方。 */
export function tuitionChaseBalanceWhy(
 params: TuitionChaseSkipInventory & {
  thisPeriodLabel: string
  nextPeriodLabel: string
  nextPeriodUnits: number
  nextPeriodDueLessons: number
 }
): string {
 if (params.remainingKnown === false) {
  return "未有結餘資料，無法計算要交堂數。"
 }
 const thisPart = tuitionChaseThisPeriodWhyPart(params)
 const nextPart = (() => {
  if (params.nextPeriodDueLessons > 0) return `${params.nextPeriodLabel}要收 ${params.nextPeriodDueLessons} 堂`
  if (params.nextPeriodUnits === 0) return `${params.nextPeriodLabel}沒有會扣的堂`
  return `${params.nextPeriodLabel}不用收`
 })()
 return `${thisPart}；${nextPart}。`
}
