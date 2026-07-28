import type { OverallStudentAnalysis } from "@/services/enrollmentReportQueries"
import type { MisalignedLessonBalanceRow } from "@/services/pendingLessonQueries"

export type ClassKindFilter = "all" | "group" | "private"

export type MgmtDashboardFilters = {
 dateFrom: string
 dateTo: string
 classKind: ClassKindFilter
 /** 科目／課程（subjects.id） */
 subjectIds: string[]
 teacherIds: string[]
 /** 班別（classes.id）；系統尚無校區主檔，以班別代替「班級／校區」維度 */
 classIds: string[]
}

/** KPI 營運狀態：綠／橙／紅 */
export type KpiStatus = "正常" | "注意" | "警示"

export type KpiBreakdownItem = {
 label: string
 value: number
}

export type KpiCardModel = {
 id: string
 label: string
 value: number
 format: "hkd" | "count" | "percent"
 /** 環比（同上期長度） */
 deltaPct: number | null
 /** 同比（去年同期；無資料時 null） */
 yoyPct: number | null
 /** 與目標差距（正＝高於目標／負＝低於；百分比或金額語意由 targetGapUnit 決定） */
 targetGap: number | null
 targetGapUnit: "percent" | "hkd" | "count" | null
 status: KpiStatus
 tone: "default" | "success" | "warning" | "destructive"
 hint?: string | null
 /** 迷你趨勢（由舊→新） */
 sparkline?: number[]
 /** 卡內細分（例如上堂人次：初中小組／高中小組／一對一） */
 breakdown?: KpiBreakdownItem[]
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

export type FunnelStage = {
 stage: string
 count: number
 /** 相對上一階段轉化率；首階段為 null */
 conversionPct: number | null
}

export type RevenueSeriesPoint = {
 label: string
 amount: number
 /** 目標線（無目標時可省略） */
 target?: number | null
}

export type NamedCount = { label: string; count: number }

export type WithdrawalAnalysis = {
 bySubject: NamedCount[]
 byTeacher: NamedCount[]
 byClass: NamedCount[]
 byDate: NamedCount[]
}

export type UnpaidOverdueRow = {
 id: string
 studentName: string
 paymentDate: string
 amount: number
 overdueDays: number
 status: string
 followUpStatus: "待跟進" | "跟進中" | "已聯繫" | "—"
}

export type OpsAlertCategory =
 | "unpaid"
 | "withdraw"
 | "lowAttendance"
 | "nearFull"
 | "teacherLoad"
 | "conversionDrop"

export type OpsAlertItem = {
 id: string
 category: OpsAlertCategory
 severity: "注意" | "警示"
 title: string
 detail: string
 href?: string
 count?: number
}

export type MgmtDashboardPayload = {
 /** ISO 或本地可讀時間字串，顯示 as of */
 asOf: string
 kpis: KpiCardModel[]
 revenueSeries: RevenueSeriesPoint[]
 funnel: FunnelStage[]
 withdrawalAnalysis: WithdrawalAnalysis
 unpaidOverdue: UnpaidOverdueRow[]
 opsAlerts: OpsAlertItem[]
 /** 第四層 drill-down 明細（保留既有分布資料） */
 distribution: {
  bySubject: NamedCount[]
  byClassKind: NamedCount[]
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
  recentWithdrawals: {
   id: string
   studentName: string
   classLabel: string
   effectiveDate: string
  }[]
 }
}

/** 點 KPI／圖表後的 drill-down 焦點 */
export type DrilldownFocus =
 | { type: "kpi"; kpiId: string }
 | { type: "analysis"; panel: "revenue" | "funnel" | "withdrawal" | "unpaid" }
 | { type: "alert"; category: OpsAlertCategory }
 | null
