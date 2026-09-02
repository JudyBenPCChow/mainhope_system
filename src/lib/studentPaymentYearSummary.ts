import { academicYearOrderKey } from "@/lib/academicYearAccess"
import { academicYearLabelsForPaymentGuard } from "@/lib/academicYearSoftGuard"
import { academicYearLabelFromStartDate } from "@/lib/courseCode"
import { listCurrentEnrollmentYearLabels } from "@/lib/enrollmentYearDisplay"
import {
 homeworkCoverageMonths,
 isHomeworkPaymentDetailSkipLessons,
 normalizeYearMonth,
} from "@/lib/homeworkTutoringFees"
import { resolveClassKind, type ClassKind } from "@/lib/privateClassKind"

const RECEIVED_STATUS = "已收款"
const UNLABELED_YEAR = "未標學年"
const PRODUCT_LINE_TAG_ORDER: ClassKind[] = ["group", "private", "homework"]

export type PaymentYearDetailFields = {
 lessonCount: number | null
 coverageStartMonth: string | null
 description: string | null
 classKind: string | null
 classSubject: string | null
 academicYearLabel: string | null
}

export type PaymentYearFields = {
 id: string
 payment_date: string
 created_at: string
 status: string
 details: PaymentYearDetailFields[]
}

export type PaymentYearContext = {
 asOfYmd: string
 currentYearLabels: string[]
 currentYearStart: string
 currentYearEnd: string
}

export type PaymentYearPartition<T> = {
 current: T[]
 past: T[]
}

export type CurrentYearPaidSummary = {
 specialistLessons: number
 privateLessons: number
 homeworkMonths: string[]
}

export type AcademicYearDateInput = {
 label: string
 start_date?: string | null
 end_date?: string | null
 is_current?: boolean | null
}

function localTodayYmd(): string {
 const d = new Date()
 return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function ymd(raw: string | null | undefined): string {
 return (raw ?? "").trim().slice(0, 10)
}

function kindOf(detail: PaymentYearDetailFields): ClassKind {
 return resolveClassKind(detail.classKind, detail.classSubject)
}

function inferYearDatesFromLabel(label: string): { start: string; end: string } | null {
 const t = label.trim()
 if (/^\d{4}$/.test(t)) {
  const startY = 2000 + Number(t.slice(0, 2))
  const endY = 2000 + Number(t.slice(2, 4))
  if (!Number.isFinite(startY) || !Number.isFinite(endY)) return null
  return { start: `${startY}-09-01`, end: `${endY}-06-30` }
 }
 const sm = /^(\d{2})SM$/i.exec(t)
 if (!sm) return null
 const y = 2000 + Number(sm[1])
 if (!Number.isFinite(y)) return null
 return { start: `${y}-07-01`, end: `${y}-08-31` }
}

function yearDates(
 years: AcademicYearDateInput[],
 label: string
): { start: string; end: string } | null {
 const match = years.find((y) => y.label.trim() === label)
 const start = ymd(match?.start_date)
 const end = ymd(match?.end_date)
 if (start && end) return { start, end }
 return inferYearDatesFromLabel(label)
}

/** 學年窗跟日期起迄，不跟 is_current。私人本年窗用 asOf 所屬學年。 */
export function buildPaymentYearContext(
 years: AcademicYearDateInput[],
 asOfYmd?: string | null
): PaymentYearContext {
 const asOf = ymd(asOfYmd) || localTodayYmd()
 const currentYearLabels = listCurrentEnrollmentYearLabels(asOf)
 const windowLabel = academicYearLabelFromStartDate(asOf)
 const dates = yearDates(years, windowLabel) ?? inferYearDatesFromLabel(windowLabel)
 return {
  asOfYmd: asOf,
  currentYearLabels,
  currentYearStart: dates?.start ?? asOf,
  currentYearEnd: dates?.end ?? asOf,
 }
}

function paymentDateInCurrentWindow(paymentDate: string, ctx: PaymentYearContext): boolean {
 const d = ymd(paymentDate)
 if (!d) return false
 return d >= ctx.currentYearStart && d <= ctx.currentYearEnd
}

function homeworkMonthsFromDetail(detail: PaymentYearDetailFields): string[] {
 const start = normalizeYearMonth(detail.coverageStartMonth)
 if (!start) return []
 const n = Number(detail.lessonCount)
 const count = Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1
 return homeworkCoverageMonths(start, count)
}

function homeworkMonthInCurrentYear(ym: string, ctx: PaymentYearContext): boolean {
 return ctx.currentYearLabels.includes(academicYearLabelFromStartDate(`${ym}-01`))
}

function isHomeworkDetail(detail: PaymentYearDetailFields): boolean {
 return isHomeworkPaymentDetailSkipLessons({
  coverageStartMonth: detail.coverageStartMonth,
  description: detail.description,
  classKind: detail.classKind,
 })
}

function isCurrentYearDetail(detail: PaymentYearDetailFields, paymentDate: string, ctx: PaymentYearContext): boolean {
 const kind = kindOf(detail)
 if (isHomeworkDetail(detail)) {
  const months = homeworkMonthsFromDetail(detail)
  if (months.some((ym) => homeworkMonthInCurrentYear(ym, ctx))) return true
  const label = (detail.academicYearLabel ?? "").trim()
  return Boolean(label) && ctx.currentYearLabels.includes(label)
 }
 if (kind === "private") return paymentDateInCurrentWindow(paymentDate, ctx)
 const label = (detail.academicYearLabel ?? "").trim()
 return Boolean(label) && ctx.currentYearLabels.includes(label)
}

function isCurrentYearReceipt<T extends PaymentYearFields>(row: T, ctx: PaymentYearContext): boolean {
 if (row.details.length === 0) return false
 return row.details.some((d) => isCurrentYearDetail(d, row.payment_date, ctx))
}

function compareReceiptsNewestFirst<T extends PaymentYearFields>(a: T, b: T): number {
 const da = ymd(a.payment_date)
 const db = ymd(b.payment_date)
 if (da !== db) return db.localeCompare(da)
 return (b.created_at ?? "").localeCompare(a.created_at ?? "")
}

export function partitionPaymentsByAcademicYear<T extends PaymentYearFields>(
 receipts: T[],
 ctx: PaymentYearContext
): PaymentYearPartition<T> {
 const current: T[] = []
 const past: T[] = []
 for (const row of receipts) {
  if (isCurrentYearReceipt(row, ctx)) current.push(row)
  else past.push(row)
 }
 current.sort(compareReceiptsNewestFirst)
 past.sort(compareReceiptsNewestFirst)
 return { current, past }
}

function addPositiveLessons(n: number | null | undefined): number {
 const v = Number(n)
 return Number.isFinite(v) && v > 0 ? v : 0
}

export function summarizeCurrentYearPayments<T extends PaymentYearFields>(
 receipts: T[],
 ctx: PaymentYearContext
): CurrentYearPaidSummary {
 let specialistLessons = 0
 let privateLessons = 0
 const homeworkSet = new Set<string>()
 for (const row of receipts) {
  if (row.status !== RECEIVED_STATUS) continue
  for (const detail of row.details) {
   if (!isCurrentYearDetail(detail, row.payment_date, ctx)) continue
   if (isHomeworkDetail(detail)) {
    for (const ym of homeworkMonthsFromDetail(detail)) {
     if (homeworkMonthInCurrentYear(ym, ctx)) homeworkSet.add(ym)
    }
    continue
   }
   const kind = kindOf(detail)
   if (kind === "private") {
    privateLessons += addPositiveLessons(detail.lessonCount)
    continue
   }
   specialistLessons += addPositiveLessons(detail.lessonCount)
  }
 }
 return {
  specialistLessons,
  privateLessons,
  homeworkMonths: [...homeworkSet].sort(),
 }
}

export function formatCurrentHomeworkPaidText(monthsYm: string[]): string {
 const unique = [...new Set(monthsYm.map((m) => normalizeYearMonth(m)).filter(Boolean))].sort()
 const listed = unique
  .map((ym) => `${Number(ym.slice(5, 7))} 月`)
  .join("、")
 return `本學年已繳 ${unique.length} 個月（${listed}）`
}

function receiptYearGroupLabel<T extends PaymentYearFields>(row: T): string {
 const labels = academicYearLabelsForPaymentGuard({
  classYearLabels: row.details.map((d) => d.academicYearLabel),
  coverageStartMonths: row.details.map((d) => d.coverageStartMonth),
  paymentDateYmd: ymd(row.payment_date),
  hasClassLines: row.details.length > 0,
 })
 if (labels.length === 0) return UNLABELED_YEAR
 return [...labels].sort((a, b) => academicYearOrderKey(b) - academicYearOrderKey(a))[0] ?? UNLABELED_YEAR
}

export function groupPastPaymentsByAcademicYear<T extends PaymentYearFields>(
 receipts: T[]
): { label: string; items: T[] }[] {
 const map = new Map<string, T[]>()
 const sorted = [...receipts].sort(compareReceiptsNewestFirst)
 for (const row of sorted) {
  const label = receiptYearGroupLabel(row)
  const list = map.get(label) ?? []
  list.push(row)
  map.set(label, list)
 }
 return [...map.entries()]
  .sort((a, b) => {
   if (a[0] === UNLABELED_YEAR) return 1
   if (b[0] === UNLABELED_YEAR) return -1
   return academicYearOrderKey(b[0]) - academicYearOrderKey(a[0])
  })
  .map(([label, items]) => ({ label, items }))
}

export function paymentProductLineTags<T extends PaymentYearFields>(row: T): string[] {
 const seen = new Set<ClassKind>()
 for (const detail of row.details) {
  seen.add(kindOf(detail))
 }
 return PRODUCT_LINE_TAG_ORDER.filter((k) => seen.has(k)).map((k) => {
  if (k === "private") return "私人課程"
  if (k === "homework") return "功輔"
  return "專科班"
 })
}
