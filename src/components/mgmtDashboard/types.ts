import type { OverallStudentAnalysis } from "@/services/enrollmentReportQueries"
import type { MisalignedLessonBalanceRow } from "@/services/pendingLessonQueries"

export type ClassKindFilter = "all" | "group" | "private"

export type MgmtDashboardFilters = {
 dateFrom: string
 dateTo: string
 classKind: ClassKindFilter
 teacherIds: string[]
}

export type KpiCardModel = {
 id: string
 label: string
 value: number
 format: "hkd" | "count" | "percent"
 deltaPct: number | null
 tone: "default" | "success" | "warning" | "destructive"
 /** 次要說明，例如消堂價值旁的「共 N 堂」 */
 hint?: string | null
}

export type UnpaidAlertRow = {
 id: string
 studentName: string
 paymentDate: string
 amount: number
 status: string
}

export type NearFullClassRow = {
 classId: string
 label: string
 enrolled: number
 capacity: number
 fillPct: number
}

export type MgmtDashboardPayload = {
 kpis: KpiCardModel[]
 revenueSeries: { label: string; amount: number }[]
 funnel: { stage: string; count: number }[]
 distribution: {
  bySubject: { label: string; count: number }[]
  byClassKind: { label: string; count: number }[]
  statusBuckets: OverallStudentAnalysis["buckets"]
  classFill: {
   classId: string
   label: string
   enrolled: number
   capacity: number | null
   fillPct: number | null
  }[]
  byTeacher: { teacherId: string; name: string; enrollmentCount: number }[]
 }
 alerts: {
  unpaid: UnpaidAlertRow[]
  lessonGaps: MisalignedLessonBalanceRow[]
  nearFullClasses: NearFullClassRow[]
 }
}
