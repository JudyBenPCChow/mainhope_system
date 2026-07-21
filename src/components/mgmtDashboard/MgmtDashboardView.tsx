import { useCallback, useEffect, useState } from "react"
import { BarChart3, Loader2, RefreshCw } from "lucide-react"

import {
 EnrollmentFunnelChart,
 RevenueTrendChart,
} from "@/components/mgmtDashboard/charts/MgmtCharts"
import { MgmtAlertsTable } from "@/components/mgmtDashboard/MgmtAlertsTable"
import { MgmtDashboardFilterBar } from "@/components/mgmtDashboard/MgmtDashboardFilterBar"
import { MgmtDistributionTabs } from "@/components/mgmtDashboard/MgmtDistributionTabs"
import { MgmtStatCard } from "@/components/mgmtDashboard/MgmtStatCard"
import type { MgmtDashboardFilters, MgmtDashboardPayload } from "@/components/mgmtDashboard/types"
import { Button } from "@/components/ui/button"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import {
 defaultMgmtDashboardFilters,
 downloadMgmtDashboardCsv,
 exportMgmtDashboardCsv,
 fetchMgmtDashboard,
} from "@/services/mgmtDashboardQueries"
import { fetchAllTeachers } from "@/services/teacherQueries"

const emptyPayload: MgmtDashboardPayload = {
 kpis: [],
 revenueSeries: [],
 funnel: [],
 distribution: {
  bySubject: [],
  byClassKind: [],
  statusBuckets: {
   registration: [],
   enrollment: [],
   activity: [],
   academicStage: [],
  },
  classFill: [],
  byTeacher: [],
 },
 alerts: { unpaid: [], lessonGaps: [], nearFullClasses: [] },
}

export function MgmtDashboardView() {
 const [filters, setFilters] = useState<MgmtDashboardFilters>(defaultMgmtDashboardFilters)
 const [data, setData] = useState<MgmtDashboardPayload>(emptyPayload)
 const [loading, setLoading] = useState(true)
 const [err, setErr] = useState<string | null>(null)
 const [teacherOptions, setTeacherOptions] = useState<{ value: string; label: string }[]>([])

 const load = useCallback(async () => {
  setLoading(true)
  setErr(null)
  try {
   const payload = await fetchMgmtDashboard(filters)
   setData(payload)
  } catch (e) {
   reportUserFacingError(e, { source: "MgmtDashboardView.load", setErr })
   setData(emptyPayload)
  } finally {
   setLoading(false)
  }
 }, [filters])

 useEffect(() => {
  void load()
 }, [load])

 useEffect(() => {
  let cancelled = false
  ;(async () => {
   try {
    if (!isSupabaseConfigured) return
    const teachers = await fetchAllTeachers()
    if (cancelled) return
    setTeacherOptions(
     teachers
      .filter((t) => t.status !== "非在職")
      .map((t) => ({
       value: t.id,
       label: t.abbr ? `${t.full_name}（${t.abbr}）` : t.full_name,
      }))
    )
   } catch {
    /* 導師篩選失敗不阻斷主畫面 */
   }
  })()
  return () => {
   cancelled = true
  }
 }, [])

 const onExport = () => {
  const csv = exportMgmtDashboardCsv(data, filters)
  downloadMgmtDashboardCsv(`營運總覽_${filters.dateFrom}_${filters.dateTo}.csv`, csv)
 }

 return (
  <div className="flex min-h-0 flex-1 flex-col gap-6 p-6">
   <div className="flex flex-wrap items-start justify-between gap-4">
    <div>
     <div className="flex items-center gap-2">
      <BarChart3 className="h-6 w-6 text-primary" aria-hidden />
      <h1 className="text-2xl font-semibold tracking-tight">營運總覽</h1>
     </div>
     <p className="mt-2 hidden max-w-2xl text-sm text-muted-foreground md:block">
      管理層只讀儀表板：一屏看健康度、二屏看原因、三屏看明細。消堂價值按每堂扣堂 × 報讀期單堂價加總。不在此修改業務資料。
      {!isSupabaseConfigured ? "（尚未設定 Supabase，目前顯示示範資料。）" : null}
     </p>
    </div>
    <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
     {loading ? (
      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
     ) : (
      <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
     )}
     重新整理
    </Button>
   </div>

   <MgmtDashboardFilterBar
    filters={filters}
    onChange={setFilters}
    teacherOptions={teacherOptions}
    onExport={onExport}
   />

   {err ? (
    <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
     {err}
    </div>
   ) : null}

   {loading && data.kpis.length === 0 ? (
    <div className="flex min-h-[30vh] items-center justify-center text-sm text-muted-foreground">
     <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
     載入營運數據…
    </div>
   ) : (
    <>
     <section>
      <h2 className="sr-only">關鍵指標</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
       {data.kpis.map((card) => (
        <MgmtStatCard key={card.id} card={card} />
       ))}
      </div>
     </section>

     <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
       <h2 className="text-base font-semibold">收款趨勢</h2>
       <p className="mt-1 text-sm text-muted-foreground">篩選區間內已收款（按月）</p>
       <div className="mt-3">
        <RevenueTrendChart data={data.revenueSeries} />
       </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
       <h2 className="text-base font-semibold">招生漏斗</h2>
       <p className="mt-1 text-sm text-muted-foreground">試堂 → 新報讀（區間）→ 在讀（快照）</p>
       <div className="mt-3">
        <EnrollmentFunnelChart data={data.funnel} />
       </div>
      </div>
     </section>

     <MgmtDistributionTabs distribution={data.distribution} />
     <MgmtAlertsTable alerts={data.alerts} />
    </>
   )}
  </div>
 )
}
