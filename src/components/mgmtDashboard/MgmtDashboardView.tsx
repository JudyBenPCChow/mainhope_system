import { useCallback, useEffect, useRef, useState } from "react"
import { BarChart3, Loader2 } from "lucide-react"

import { MgmtAnalysisSection } from "@/components/mgmtDashboard/MgmtAnalysisSection"
import { MgmtDashboardFilterBar } from "@/components/mgmtDashboard/MgmtDashboardFilterBar"
import { MgmtDetailTablesSection } from "@/components/mgmtDashboard/MgmtDetailTablesSection"
import { MgmtOpsAlertsSection } from "@/components/mgmtDashboard/MgmtOpsAlertsSection"
import { MgmtStatCard } from "@/components/mgmtDashboard/MgmtStatCard"
import type {
 DrilldownFocus,
 MgmtDashboardFilters,
 MgmtDashboardPayload,
} from "@/components/mgmtDashboard/types"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { fetchSubjectOptions } from "@/services/classQueries"
import {
 defaultMgmtDashboardFilters,
 downloadMgmtDashboardCsv,
 exportMgmtDashboardCsv,
 fetchMgmtDashboard,
 fetchMgmtDashboardSummary,
 mergeMgmtDashboardPayload,
} from "@/services/mgmtDashboardQueries"
import { fetchAllTeachers } from "@/services/teacherQueries"

const emptyPayload: MgmtDashboardPayload = {
 asOf: "",
 kpis: [],
 revenueSeries: { ok: [] },
 funnel: { ok: [] },
 withdrawalAnalysis: { ok: { bySubject: [], byTeacher: [], byClass: [], byDate: [] } },
 unpaidOverdue: { ok: [] },
 opsAlerts: [],
 opsAlertsError: null,
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
 alerts: { unpaid: { ok: [] }, lessonGaps: { ok: [] }, nearFullClasses: { ok: [] }, recentWithdrawals: { ok: [] } },
 partialLoadFailed: false,
}

export function MgmtDashboardView() {
 const [filters, setFilters] = useState<MgmtDashboardFilters>(defaultMgmtDashboardFilters)
 const [data, setData] = useState<MgmtDashboardPayload>(emptyPayload)
 const [loading, setLoading] = useState(true)
 const [detailsLoading, setDetailsLoading] = useState(false)
 const [err, setErr] = useState<string | null>(null)
 const [teacherOptions, setTeacherOptions] = useState<{ value: string; label: string }[]>([])
 const [subjectOptions, setSubjectOptions] = useState<{ value: string; label: string }[]>([])
 const [classOptions, setClassOptions] = useState<{ value: string; label: string }[]>([])
 const [focus, setFocus] = useState<DrilldownFocus>(null)
 const detailRef = useRef<HTMLDivElement | null>(null)
 const loadGenRef = useRef(0)

 const load = useCallback(async () => {
  const gen = ++loadGenRef.current
  setLoading(true)
  setDetailsLoading(true)
  setErr(null)
  setData(emptyPayload)
  try {
   const summary = await fetchMgmtDashboardSummary(filters)
   if (gen !== loadGenRef.current) return
   setData(summary)
   setLoading(false)
   if (summary.partialLoadFailed) {
    reportUserFacingError(new Error("部分指標未能載入"), {
     source: "MgmtDashboardView.load",
     setErr,
     userMessage: "部分指標未能載入，可按重新整理再試。",
    })
   }

   const payload = await fetchMgmtDashboard(filters)
   if (gen !== loadGenRef.current) return
   const merged = mergeMgmtDashboardPayload(summary, payload)
   setData(merged)
   if (merged.partialLoadFailed) {
    reportUserFacingError(new Error("部分指標未能載入"), {
     source: "MgmtDashboardView.load",
     setErr,
     userMessage: "部分指標未能載入，可按重新整理再試。",
    })
   }
   const fill = merged.distribution.classFill
   setClassOptions(
    fill.map((c) => ({
     value: c.classId,
     label: c.label,
    }))
   )
  } catch (e) {
   if (gen !== loadGenRef.current) return
   reportUserFacingError(e, { source: "MgmtDashboardView.load", setErr })
   setData((prev) => (prev.kpis.length > 0 ? prev : emptyPayload))
  } finally {
   if (gen === loadGenRef.current) {
    setLoading(false)
    setDetailsLoading(false)
   }
  }
 }, [filters])

 useEffect(() => {
  void load()
 }, [load])

 useEffect(() => {
  let cancelled = false
  ;(async () => {
   try {
    if (!isSupabaseConfigured) {
     setSubjectOptions([
      { value: "en", label: "英文" },
      { value: "math", label: "數學" },
      { value: "chi", label: "中文" },
     ])
     setTeacherOptions([
      { value: "t1", label: "陳老師" },
      { value: "t2", label: "李老師" },
      { value: "t3", label: "王老師" },
     ])
     return
    }
    const [teachers, subjects] = await Promise.all([
     fetchAllTeachers(),
     fetchSubjectOptions(),
    ])
    if (cancelled) return
    setTeacherOptions(
     teachers
      .filter((t) => t.status !== "非在職")
      .map((t) => ({
       value: t.id,
       label: t.abbr ? `${t.full_name}（${t.abbr}）` : t.full_name,
      }))
    )
    setSubjectOptions(
     subjects.map((s) => ({
      value: s.id,
      label: s.name_zh || s.code,
     }))
    )
   } catch {
    /* 篩選選項失敗不阻斷主畫面 */
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

 const selectFocus = (next: DrilldownFocus) => {
  setFocus(next)
  requestAnimationFrame(() => {
   detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  })
 }

 return (
  <div className="flex min-h-0 flex-1 flex-col gap-8 p-6">
   <header className="space-y-2">
    <div className="flex items-center gap-2">
     <BarChart3 className="h-6 w-6 text-primary" aria-hidden />
     <h1 className="text-2xl font-semibold tracking-tight">營運總覽</h1>
    </div>
    <p className="max-w-3xl text-sm text-muted-foreground">
     營運決策中台：先看健康度 KPI，再看收款／招生／流失／欠費原因，最後處理警示與跟進清單。
     {!isSupabaseConfigured ? "（尚未設定 Supabase，目前顯示示範資料。）" : null}
    </p>
   </header>

   <MgmtDashboardFilterBar
    filters={filters}
    onChange={setFilters}
    subjectOptions={subjectOptions}
    teacherOptions={teacherOptions}
    classOptions={classOptions}
    onExport={onExport}
    onRefresh={() => void load()}
    loading={loading || detailsLoading}
    asOf={data.asOf || null}
   />

   {err ? (
    <div
     role="alert"
     className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
    >
     {err}
    </div>
   ) : null}

   {loading && data.kpis.length === 0 ? (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
     <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
     載入營運數據…
    </div>
   ) : (
    <>
     <section className="space-y-3">
      <div>
       <h2 className="text-lg font-semibold tracking-tight">總覽 KPI</h2>
       <p className="mt-1 text-sm text-muted-foreground">
        6–8 個決策指標：本期數值、環比／同比、目標差距與狀態；點擊可下鑽明細
       </p>
      </div>
      {data.kpis.length === 0 ? (
       <div className="rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground shadow-sm">
        目前無法計算 KPI（請調整篩選或稍後再試）
       </div>
      ) : (
       <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.kpis.slice(0, 8).map((card) => (
         <MgmtStatCard
          key={card.id}
          card={card}
          selected={focus?.type === "kpi" && focus.kpiId === card.id}
          onSelect={() => selectFocus({ type: "kpi", kpiId: card.id })}
         />
        ))}
       </div>
      )}
     </section>

     {detailsLoading ? (
      <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
       <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
       正在載入分析圖表與跟進清單…
      </p>
     ) : null}

     <MgmtAnalysisSection
      data={data}
      loading={detailsLoading}
      focus={focus}
      onFocus={selectFocus}
     />

     <MgmtOpsAlertsSection
      alerts={data.opsAlerts}
      error={data.opsAlertsError}
      focus={focus}
      onFocus={selectFocus}
     />

     <div ref={detailRef}>
      <MgmtDetailTablesSection data={data} focus={focus} />
     </div>
    </>
   )}
  </div>
 )
}
