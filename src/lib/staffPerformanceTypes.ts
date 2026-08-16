import type { KpiCardModel } from "@/lib/mgmtDashboardTypes"

export type ClassKindFilter = "all" | "group" | "private"
export type PeriodMode = "month" | "quarter"
export type StudentTypeFilter = "all" | "new" | "returning"

export type StaffPerformanceFilters = {
  periodMode: PeriodMode
  /** YYYY-MM；月份模式使用 */
  monthKey: string
  /** 年份；季度模式使用 */
  year: number
  /** 1–4；季度模式使用 */
  quarter: number
  subjectIds: string[]
  teacherIds: string[]
  classKind: ClassKindFilter
  gradeIds: string[]
  studentType: StudentTypeFilter
  classIds: string[]
  /** 預設 true：KPI／排行／明細排除 Mark Yu、Christine Fan（老闆） */
  excludeOwners: boolean
}

export type StaffPerformanceRow = {
  teacherId: string
  teacherName: string
  teacherAbbr: string | null
  revenue: number
  laborCost: number | null
  laborMissing: boolean
  grossProfit: number | null
  grossMargin: number | null
  laborCostRatio: number | null
  teachingHours: number
  revenuePerHour: number | null
  profitPerHour: number | null
  studentCount: number
  retentionRate: number | null
  absenceRate: number | null
  withdrawalCount: number
  anomalyTags: string[]
}

export type StaffAnomalyCard = {
  id: string
  severity: "注意" | "警示"
  title: string
  detail: string
  teacherId?: string
  href?: string
}

export type StaffMonthlyPoint = {
  month: string
  revenue: number
  laborCost: number | null
  profit: number | null
}

export type StaffTeacherTrend = {
  teacherId: string
  teacherName: string
  months: StaffMonthlyPoint[]
}

export type StaffHeatCell = {
  teacherId: string
  teacherName: string
  month: string
  laborCostRatio: number | null
  revenue: number
  laborCost: number | null
}

export type StaffPerformancePayload = {
  asOf: string
  dateFrom: string
  dateTo: string
  periodLabel: string
  laborSourceNote: string
  kpis: KpiCardModel[]
  rows: StaffPerformanceRow[]
  monthlyTrend: StaffTeacherTrend[]
  heatCells: StaffHeatCell[]
  anomalies: StaffAnomalyCard[]
  classOptions: { value: string; label: string }[]
}
