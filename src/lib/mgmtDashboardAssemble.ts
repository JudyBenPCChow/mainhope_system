import type {
 AttendanceVisitBreakdown,
 FunnelStage,
 KpiCardModel,
 KpiStatus,
 LoadResult,
 MgmtDashboardFilters,
 MgmtDashboardPayload,
 NearFullClassRow,
 OpsAlertItem,
 RecentWithdrawalRow,
 RevenueSeriesPoint,
 UnpaidAlertRow,
 UnpaidOverdueRow,
 WithdrawalAnalysis,
} from "@/lib/mgmtDashboardTypes"
import { isLoadOk } from "@/lib/mgmtDashboardTypes"
import { classKindLabel } from "@/lib/privateClassKind"

export { isLoadOk }
export type { AttendanceVisitBreakdown, LoadResult }

export const LOAD_FAILED_LABEL = "資料未能載入"
export const CSV_LOAD_FAILED = "未能載入"

export const EMPTY_WITHDRAWAL_ANALYSIS: WithdrawalAnalysis = {
 bySubject: [],
 byTeacher: [],
 byClass: [],
 byDate: [],
}

export const EMPTY_ATTENDANCE: AttendanceVisitBreakdown = {
 total: 0,
 juniorGroup: 0,
 seniorGroup: 0,
 oneToOne: 0,
}

const CORE_KPI_IDS = new Set([
 "revenue",
 "enroll",
 "withdraw",
 "enrolled",
 "enrollmentSeats",
 "attendanceVisits",
 "conversion",
])

export function asOk<T>(value: T): LoadResult<T> {
 return { ok: value }
}

export function asError<T = never>(error: string): LoadResult<T> {
 return { error }
}

export function preferLoadResult<T>(primary: LoadResult<T>, fallback: LoadResult<T>): LoadResult<T> {
 if (isLoadOk(primary)) return primary
 if (isLoadOk(fallback)) return fallback
 return primary
}

export function deltaPct(current: number, previous: number): number | null {
 if (previous === 0) return current === 0 ? 0 : null
 return Math.round(((current - previous) / previous) * 1000) / 10
}

function kpiStatusFromTone(tone: KpiCardModel["tone"]): KpiStatus {
 if (tone === "destructive") return "警示"
 if (tone === "warning") return "注意"
 return "正常"
}

export function errorKpi(
 id: string,
 label: string,
 format: KpiCardModel["format"]
): KpiCardModel {
 return {
  id,
  label,
  value: 0,
  format,
  deltaPct: null,
  yoyPct: null,
  targetGap: null,
  targetGapUnit: null,
  status: "注意",
  tone: "warning",
  hint: LOAD_FAILED_LABEL,
  loadState: "error",
 }
}

export type SettledDashboardInput = {
 asOf: string
 revenue: LoadResult<number>
 prevRevenue: LoadResult<number>
 revenueSeries: LoadResult<RevenueSeriesPoint[]>
 unpaid: LoadResult<{ amount: number; count: number }>
 enroll: LoadResult<number>
 prevEnroll: LoadResult<number>
 withdraw: LoadResult<number>
 prevWithdraw: LoadResult<number>
 trials: LoadResult<number>
 prevTrials: LoadResult<number>
 convertedTrials: LoadResult<number>
 prevConvertedTrials: LoadResult<number>
 enrolledStudents: LoadResult<number>
 enrollmentSeats: LoadResult<number>
 attendanceVisits: LoadResult<AttendanceVisitBreakdown>
 prevAttendanceTotal: LoadResult<number>
 teacherLoadAvg: LoadResult<number | null>
 withdrawalAnalysis: LoadResult<WithdrawalAnalysis>
 recentWithdrawals: LoadResult<RecentWithdrawalRow[]>
 unpaidAlerts: LoadResult<UnpaidAlertRow[]>
  unpaidOverdue: LoadResult<UnpaidOverdueRow[]>
  lessonGaps: MgmtDashboardPayload["alerts"]["lessonGaps"]
  nearFullClasses: LoadResult<NearFullClassRow[]>
 distribution: MgmtDashboardPayload["distribution"]
 includeLowAttendancePlaceholder: boolean
}

function conversionRate(trials: number, converted: number): number | null {
 return trials > 0 ? Math.round((converted / trials) * 1000) / 10 : null
}

export function assembleFunnel(
 trials: LoadResult<number>,
 converted: LoadResult<number>,
 enrolledStudents: LoadResult<number>
): LoadResult<FunnelStage[]> {
 if (!isLoadOk(trials) || !isLoadOk(converted) || !isLoadOk(enrolledStudents)) {
  return asError(LOAD_FAILED_LABEL)
 }
 const trialCount = trials.ok
 const convertedCount = converted.ok
 const trialToEnroll =
  trialCount > 0
   ? Math.round((convertedCount / trialCount) * 1000) / 10
   : convertedCount > 0
     ? null
     : 0
 return asOk([
  { stage: "試堂", count: trialCount, conversionPct: null },
  { stage: "已轉化", count: convertedCount, conversionPct: trialToEnroll },
  { stage: "在讀", count: enrolledStudents.ok, conversionPct: null },
 ])
}

function assembleConversionDelta(
 trials: LoadResult<number>,
 converted: LoadResult<number>,
 prevTrials: LoadResult<number>,
 prevConverted: LoadResult<number>
): LoadResult<number | null> {
 if (!isLoadOk(trials) || !isLoadOk(converted)) return asError(LOAD_FAILED_LABEL)
 const conversion = conversionRate(trials.ok, converted.ok)
 if (!isLoadOk(prevTrials) || !isLoadOk(prevConverted)) return asOk(null)
 const prevConversion = conversionRate(prevTrials.ok, prevConverted.ok)
 if (conversion == null || prevConversion == null) return asOk(null)
 return asOk(deltaPct(conversion, prevConversion))
}

export function assembleOpsAlerts(input: {
 unpaid: LoadResult<{ amount: number; count: number }>
 recentWithdrawals: LoadResult<RecentWithdrawalRow[]>
 nearFullClasses: LoadResult<NearFullClassRow[]>
 highLoadTeachers: LoadResult<{ name: string; enrollmentCount: number }[]>
 conversionDelta: LoadResult<number | null>
 includeLowAttendancePlaceholder: boolean
}): { items: OpsAlertItem[]; error: string | null } {
 const items: OpsAlertItem[] = []
 let sourceFailed = false

 if (!isLoadOk(input.unpaid)) sourceFailed = true
 else if (input.unpaid.ok.count > 0) {
  items.push({
   id: "live-unpaid",
   category: "unpaid",
   severity: input.unpaid.ok.count >= 10 ? "警示" : "注意",
   title: "欠費學生需跟進",
   detail: `待繳費／待收款 ${input.unpaid.ok.count} 筆，合計 HK$ ${input.unpaid.ok.amount.toLocaleString("en-HK")}`,
   href: "/PaymentHistory",
   count: input.unpaid.ok.count,
  })
 }

 if (!isLoadOk(input.recentWithdrawals)) sourceFailed = true
 else if (input.recentWithdrawals.ok.length > 0) {
  const n = input.recentWithdrawals.ok.length
  items.push({
   id: "live-withdraw",
   category: "withdraw",
   severity: n >= 5 ? "警示" : "注意",
   title: "近區間退讀名單",
   detail: `篩選區間內退讀 ${n} 人`,
   count: n,
  })
 }

 if (!isLoadOk(input.nearFullClasses)) sourceFailed = true
 else if (input.nearFullClasses.ok.length > 0) {
  items.push({
   id: "live-near-full",
   category: "nearFull",
   severity: "注意",
   title: "滿班／接近滿班",
   detail: `有 ${input.nearFullClasses.ok.length} 個班別滿班率 ≥ 90%`,
   href: "/Classes",
   count: input.nearFullClasses.ok.length,
  })
 }

 if (!isLoadOk(input.highLoadTeachers)) sourceFailed = true
 else if (input.highLoadTeachers.ok.length > 0) {
  const names = input.highLoadTeachers.ok
   .slice(0, 3)
   .map((t) => `${t.name}（${t.enrollmentCount}）`)
   .join("、")
  items.push({
   id: "live-teacher-load",
   category: "teacherLoad",
   severity: "注意",
   title: "導師負荷過高",
   detail: names,
   count: input.highLoadTeachers.ok.length,
  })
 }

 if (!isLoadOk(input.conversionDelta)) sourceFailed = true
 else if (input.conversionDelta.ok != null && input.conversionDelta.ok <= -5) {
  items.push({
   id: "live-conversion",
   category: "conversionDrop",
   severity: input.conversionDelta.ok <= -10 ? "警示" : "注意",
   title: "轉化率異常下降",
   detail: `試堂→報讀轉化率環比 ${input.conversionDelta.ok}%`,
   count: 1,
  })
 }

 if (input.includeLowAttendancePlaceholder) {
  items.push({
   id: "live-low-attendance-placeholder",
   category: "lowAttendance",
   severity: "注意",
   title: "低出席班別",
   detail: "出勤彙總尚未串接；點此區塊可於日後接上低出席名單",
   count: 0,
  })
 }

 return {
  items,
  error: sourceFailed ? "部分警示未能載入" : null,
 }
}

export function assembleKpis(input: SettledDashboardInput): KpiCardModel[] {
 const cards: KpiCardModel[] = []

 const revenue = input.revenue
 if (!isLoadOk(revenue)) {
  cards.push(errorKpi("revenue", "已收款", "hkd"))
 } else {
  const prevRevenue = input.prevRevenue
  const prev = isLoadOk(prevRevenue) ? prevRevenue.ok : null
  const revenueTone: KpiCardModel["tone"] =
   prev != null && prev > 0 && revenue.ok < prev * 0.9 ? "warning" : "success"
  const revenueTargetGap =
   prev != null && prev > 0
    ? Math.round(((revenue.ok - prev) / prev) * 1000) / 10
    : null
  const series = input.revenueSeries
  const sparkline = isLoadOk(series)
   ? series.ok.map((r) => Math.round(r.amount / 1000))
   : undefined
  cards.push({
   id: "revenue",
   label: "已收款",
   value: revenue.ok,
   format: "hkd",
   deltaPct: prev != null ? deltaPct(revenue.ok, prev) : null,
   yoyPct: null,
   targetGap: revenueTargetGap,
   targetGapUnit: "percent",
   status: kpiStatusFromTone(revenueTone),
   tone: revenueTone,
   sparkline,
   hint: revenueTargetGap == null ? "尚無上期對比目標" : "相對上期目標",
   loadState: "ready",
  })
 }

 const enroll = input.enroll
 if (!isLoadOk(enroll)) {
  cards.push(errorKpi("enroll", "新報讀", "count"))
 } else {
  const prevEnroll = input.prevEnroll
  const prev = isLoadOk(prevEnroll) ? prevEnroll.ok : null
  cards.push({
   id: "enroll",
   label: "新報讀",
   value: enroll.ok,
   format: "count",
   deltaPct: prev != null ? deltaPct(enroll.ok, prev) : null,
   yoyPct: null,
   targetGap: null,
   targetGapUnit: null,
   status: "正常",
   tone: "success",
   loadState: "ready",
  })
 }

 const withdraw = input.withdraw
 if (!isLoadOk(withdraw)) {
  cards.push(errorKpi("withdraw", "退讀", "count"))
 } else {
  const prevWithdraw = input.prevWithdraw
  const prev = isLoadOk(prevWithdraw) ? prevWithdraw.ok : null
  const withdrawTone: KpiCardModel["tone"] =
   withdraw.ok >= 5 ? "destructive" : withdraw.ok > 0 ? "warning" : "default"
  cards.push({
   id: "withdraw",
   label: "退讀",
   value: withdraw.ok,
   format: "count",
   deltaPct: prev != null ? deltaPct(withdraw.ok, prev) : null,
   yoyPct: null,
   targetGap: 3 - withdraw.ok,
   targetGapUnit: "count",
   status: kpiStatusFromTone(withdrawTone),
   tone: withdrawTone,
   hint: "目標 ≤ 3（placeholder）",
   loadState: "ready",
  })
 }

 const enrolledStudents = input.enrolledStudents
 if (!isLoadOk(enrolledStudents)) {
  cards.push(errorKpi("enrolled", "在讀學生", "count"))
 } else {
  cards.push({
   id: "enrolled",
   label: "在讀學生",
   value: enrolledStudents.ok,
   format: "count",
   deltaPct: null,
   yoyPct: null,
   targetGap: null,
   targetGapUnit: null,
   status: "正常",
   tone: "default",
   hint: "全站快照（人數）",
   loadState: "ready",
  })
 }

 const enrollmentSeats = input.enrollmentSeats
 if (!isLoadOk(enrollmentSeats)) {
  cards.push(errorKpi("enrollmentSeats", "在讀人次", "count"))
 } else {
  cards.push({
   id: "enrollmentSeats",
   label: "在讀人次",
   value: enrollmentSeats.ok,
   format: "count",
   deltaPct: null,
   yoyPct: null,
   targetGap: null,
   targetGapUnit: null,
   status: "正常",
   tone: "default",
   hint: "報讀科目加總（1 人報 2 科＝2）",
   loadState: "ready",
  })
 }

 const attendance = input.attendanceVisits
 if (!isLoadOk(attendance)) {
  cards.push(errorKpi("attendanceVisits", "本月上堂總人次", "count"))
 } else {
  const prevAtt = input.prevAttendanceTotal
  const prev = isLoadOk(prevAtt) ? prevAtt.ok : null
  cards.push({
   id: "attendanceVisits",
   label: "本月上堂總人次",
   value: attendance.ok.total,
   format: "count",
   deltaPct: prev != null ? deltaPct(attendance.ok.total, prev) : null,
   yoyPct: null,
   targetGap: null,
   targetGapUnit: null,
   status: "正常",
   tone: "success",
   hint: "篩選區間內實際到課人次",
   breakdown: [
    { label: "初中專科班", value: attendance.ok.juniorGroup },
    { label: "高中專科班", value: attendance.ok.seniorGroup },
    { label: "私人課程", value: attendance.ok.oneToOne },
   ],
   loadState: "ready",
  })
 }

 const trials = input.trials
 const converted = input.convertedTrials
 if (!isLoadOk(trials) || !isLoadOk(converted)) {
  cards.push(errorKpi("conversion", "報讀轉化率", "percent"))
 } else {
  const conversion = conversionRate(trials.ok, converted.ok)
  const prevTrials = input.prevTrials
  const prevConverted = input.prevConvertedTrials
  const prevConversion =
   isLoadOk(prevTrials) && isLoadOk(prevConverted)
    ? conversionRate(prevTrials.ok, prevConverted.ok)
    : null
  const conversionDelta =
   conversion != null && prevConversion != null ? deltaPct(conversion, prevConversion) : null
  const conversionTone: KpiCardModel["tone"] =
   conversion == null
    ? "default"
    : conversion < 50
      ? "destructive"
      : conversion < 65
        ? "warning"
        : "success"
  cards.push({
   id: "conversion",
   label: "報讀轉化率",
   value: conversion ?? 0,
   format: "percent",
   deltaPct: conversionDelta,
   yoyPct: null,
   targetGap: conversion != null ? Math.round((conversion - 65) * 10) / 10 : null,
   targetGapUnit: "percent",
   status: conversion == null ? "注意" : kpiStatusFromTone(conversionTone),
   tone: conversion == null ? "warning" : conversionTone,
   hint: conversion == null ? "無法計算（缺試堂數）" : "試堂 cohort 轉化；目標 65%",
   loadState: "ready",
  })
 }

 const teacherLoad = input.teacherLoadAvg
 if (!isLoadOk(teacherLoad)) {
  cards.push(errorKpi("teacherLoad", "導師平均負荷", "count"))
 } else {
  const avg = teacherLoad.ok
  const loadTone: KpiCardModel["tone"] = avg != null && avg > 39 ? "warning" : "default"
  cards.push({
   id: "teacherLoad",
   label: "導師平均負荷",
   value: avg ?? 0,
   format: "count",
   deltaPct: null,
   yoyPct: null,
   targetGap: avg != null ? Math.round((39 - avg) * 10) / 10 : null,
   targetGapUnit: "count",
   status: kpiStatusFromTone(loadTone),
   tone: loadTone,
   hint: avg == null ? "尚無導師負荷資料" : "平均報讀人次；目標 ≤ 39",
   loadState: "ready",
  })
 }

 return cards
}

function bindGroup<T>(primary: LoadResult<unknown>, value: LoadResult<T>): LoadResult<T> {
 if (!isLoadOk(primary)) return asError(primary.error)
 return value
}

export function payloadHasPartialFailure(payload: Omit<MgmtDashboardPayload, "partialLoadFailed">): boolean {
 if (payload.kpis.some((k) => k.loadState === "error")) return true
 if (!isLoadOk(payload.revenueSeries)) return true
 if (!isLoadOk(payload.funnel)) return true
 if (!isLoadOk(payload.withdrawalAnalysis)) return true
 if (!isLoadOk(payload.unpaidOverdue)) return true
 if (payload.opsAlertsError) return true
 if (!isLoadOk(payload.alerts.unpaid)) return true
 if (!isLoadOk(payload.alerts.lessonGaps)) return true
 if (!isLoadOk(payload.alerts.nearFullClasses)) return true
 if (!isLoadOk(payload.alerts.recentWithdrawals)) return true
 return false
}

export function assembleDashboardPayload(input: SettledDashboardInput): MgmtDashboardPayload {
 const kpis = assembleKpis(input)
 const funnel = assembleFunnel(input.trials, input.convertedTrials, input.enrolledStudents)
 const conversionDelta = assembleConversionDelta(
  input.trials,
  input.convertedTrials,
  input.prevTrials,
  input.prevConvertedTrials
 )
 const highLoadTeachers: LoadResult<{ name: string; enrollmentCount: number }[]> = isLoadOk(
  input.teacherLoadAvg
 )
  ? asOk(
     input.distribution.byTeacher
      .filter((t) => t.enrollmentCount > 39)
      .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
      .map((t) => ({ name: t.name, enrollmentCount: t.enrollmentCount }))
    )
  : asError(input.teacherLoadAvg.error)

 const ops = assembleOpsAlerts({
  unpaid: input.unpaid,
  recentWithdrawals: input.recentWithdrawals,
  nearFullClasses: input.nearFullClasses,
  highLoadTeachers,
  conversionDelta,
  includeLowAttendancePlaceholder: input.includeLowAttendancePlaceholder,
 })

 const unpaidGroupFailed = !isLoadOk(input.unpaid) || !isLoadOk(input.unpaidAlerts)
 const unpaidOverdue = unpaidGroupFailed
  ? asError(LOAD_FAILED_LABEL)
  : input.unpaidOverdue
 const unpaidAlerts = unpaidGroupFailed ? asError(LOAD_FAILED_LABEL) : input.unpaidAlerts

 const revenueSeries = bindGroup(input.revenue, input.revenueSeries)

 const draft: Omit<MgmtDashboardPayload, "partialLoadFailed"> = {
  asOf: input.asOf,
  kpis,
  revenueSeries,
  funnel,
  withdrawalAnalysis: input.withdrawalAnalysis,
  unpaidOverdue,
  opsAlerts: ops.items,
  opsAlertsError: ops.error,
  distribution: input.distribution,
  alerts: {
   unpaid: unpaidAlerts,
   lessonGaps: input.lessonGaps,
   nearFullClasses: input.nearFullClasses,
   recentWithdrawals: input.recentWithdrawals,
  },
 }

 return { ...draft, partialLoadFailed: payloadHasPartialFailure(draft) }
}

export function mergeMgmtDashboardPayload(
 summary: MgmtDashboardPayload,
 full: MgmtDashboardPayload
): MgmtDashboardPayload {
 const kpis = full.kpis.map((fullCard) => {
  const sumCard = summary.kpis.find((k) => k.id === fullCard.id)
  if (
   sumCard &&
   fullCard.loadState === "error" &&
   sumCard.loadState !== "error" &&
   CORE_KPI_IDS.has(fullCard.id)
  ) {
   return sumCard
  }
  return fullCard
 })

 const draft: Omit<MgmtDashboardPayload, "partialLoadFailed"> = {
  asOf: full.asOf || summary.asOf,
  kpis,
  revenueSeries: preferLoadResult(full.revenueSeries, summary.revenueSeries),
  funnel: preferLoadResult(full.funnel, summary.funnel),
  withdrawalAnalysis: full.withdrawalAnalysis,
  unpaidOverdue: preferLoadResult(full.unpaidOverdue, summary.unpaidOverdue),
  opsAlerts: full.opsAlerts.length > 0 ? full.opsAlerts : summary.opsAlerts,
  opsAlertsError: full.opsAlertsError ?? summary.opsAlertsError,
  distribution: full.distribution,
  alerts: {
   unpaid: preferLoadResult(full.alerts.unpaid, summary.alerts.unpaid),
   lessonGaps: full.alerts.lessonGaps,
   nearFullClasses: full.alerts.nearFullClasses,
   recentWithdrawals: full.alerts.recentWithdrawals,
  },
 }

 return { ...draft, partialLoadFailed: payloadHasPartialFailure(draft) }
}

function csvKpiValue(card: KpiCardModel): string | number {
 if (card.loadState === "error") return CSV_LOAD_FAILED
 return card.value
}

export function exportMgmtDashboardCsv(
 payload: MgmtDashboardPayload,
 filters: MgmtDashboardFilters
): string {
 const lines: string[] = []
 const cell = (v: string | number) => {
  const s = String(v)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
 }
 lines.push(["篩選起日", "篩選迄日", "課種", "科目數", "導師數", "班別數"].map(cell).join(","))
 lines.push(
  [
   filters.dateFrom,
   filters.dateTo,
   filters.classKind === "all" ? "全部" : classKindLabel(filters.classKind),
   filters.subjectIds.length,
   filters.teacherIds.length,
   filters.classIds.length,
  ]
   .map(cell)
   .join(",")
 )
 lines.push("")
 lines.push(["KPI", "數值", "環比%", "同比%", "目標差", "狀態"].map(cell).join(","))
 for (const k of payload.kpis) {
  const failed = k.loadState === "error"
  lines.push(
   [
    k.label,
    csvKpiValue(k),
    failed ? "" : (k.deltaPct ?? ""),
    failed ? "" : (k.yoyPct ?? ""),
    failed ? "" : (k.targetGap ?? ""),
    failed ? CSV_LOAD_FAILED : k.status,
   ]
    .map(cell)
    .join(",")
  )
 }
 lines.push("")
 lines.push(["月份", "已收款"].map(cell).join(","))
 if (!isLoadOk(payload.revenueSeries)) {
  lines.push([CSV_LOAD_FAILED, ""].map(cell).join(","))
 } else {
  for (const r of payload.revenueSeries.ok) {
   lines.push([r.label, r.amount].map(cell).join(","))
  }
 }
 lines.push("")
 lines.push(["漏斗階段", "人數"].map(cell).join(","))
 if (!isLoadOk(payload.funnel)) {
  lines.push([CSV_LOAD_FAILED, ""].map(cell).join(","))
 } else {
  for (const f of payload.funnel.ok) {
   lines.push([f.stage, f.count].map(cell).join(","))
  }
 }
 lines.push("")
 lines.push(["待繳費學生", "日期", "金額", "狀態"].map(cell).join(","))
 if (!isLoadOk(payload.alerts.unpaid)) {
  lines.push([CSV_LOAD_FAILED, "", "", ""].map(cell).join(","))
 } else {
  for (const u of payload.alerts.unpaid.ok) {
   lines.push([u.studentName, u.paymentDate, u.amount, u.status].map(cell).join(","))
  }
 }
 return lines.join("\n")
}
