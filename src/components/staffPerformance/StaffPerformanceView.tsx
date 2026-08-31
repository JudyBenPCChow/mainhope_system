import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2, TrendingUp } from "lucide-react"

import { StaffAnomalyCards } from "@/components/staffPerformance/StaffAnomalyCards"
import { StaffDetailTable } from "@/components/staffPerformance/StaffDetailTable"
import { StaffFilterBar } from "@/components/staffPerformance/StaffFilterBar"
import { StaffKpiCards } from "@/components/staffPerformance/StaffKpiCards"
import { StaffLaborHeatTable } from "@/components/staffPerformance/StaffLaborHeatTable"
import { StaffProfitRanking } from "@/components/staffPerformance/StaffProfitRanking"
import { StaffScatterChart } from "@/components/staffPerformance/StaffScatterChart"
import { StaffTrendChart } from "@/components/staffPerformance/StaffTrendChart"
import type {
  StaffPerformanceFilters,
  StaffPerformancePayload,
} from "@/components/staffPerformance/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { fetchSubjectOptions } from "@/services/classQueries"
import {
  defaultStaffPerformanceFilters,
  downloadStaffPerformanceCsv,
  exportStaffPerformanceCsv,
  fetchStaffPerformance,
} from "@/services/staffPerformanceQueries"
import { fetchAllTeachers } from "@/services/teacherQueries"

const emptyPayload: StaffPerformancePayload = {
  asOf: "",
  dateFrom: "",
  dateTo: "",
  periodLabel: "",
  laborSourceNote: "",
  kpis: [],
  rows: [],
  monthlyTrend: [],
  heatCells: [],
  anomalies: [],
  classOptions: [],
}

export function StaffPerformanceView() {
  const [filters, setFilters] = useState<StaffPerformanceFilters>(defaultStaffPerformanceFilters)
  const [data, setData] = useState<StaffPerformancePayload>(emptyPayload)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [teacherOptions, setTeacherOptions] = useState<{ value: string; label: string }[]>([])
  const [subjectOptions, setSubjectOptions] = useState<{ value: string; label: string }[]>([])
  const loadGenRef = useRef(0)

  const load = useCallback(async () => {
    const gen = ++loadGenRef.current
    setLoading(true)
    setErr(null)
    try {
      const payload = await fetchStaffPerformance(filters)
      if (gen !== loadGenRef.current) return
      setData(payload)
    } catch (e) {
      if (gen !== loadGenRef.current) return
      reportUserFacingError(e, { source: "StaffPerformanceView.load", setErr })
      setData(emptyPayload)
    } finally {
      if (gen === loadGenRef.current) setLoading(false)
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
    const csv = exportStaffPerformanceCsv(data, filters)
    downloadStaffPerformanceCsv(
      `員工績效_${data.dateFrom}_${data.dateTo}.csv`,
      csv
    )
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" aria-hidden />
          <h1 className="text-xl font-semibold tracking-tight">員工績效</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          比較每位老師帶來的課堂收入與人工開支。預設顯示上一個曆月；預設排除老闆（Mark
          Yu、Christine Fan），以免拉高人均與佔比。
        </p>
        {data.laborSourceNote ? (
          <p className="text-xs text-warning">{data.laborSourceNote}</p>
        ) : null}
      </header>

      <StaffFilterBar
        filters={filters}
        onChange={setFilters}
        subjectOptions={subjectOptions}
        teacherOptions={teacherOptions}
        classOptions={data.classOptions}
        onExport={onExport}
        onRefresh={() => void load()}
        loading={loading}
        asOf={data.asOf || null}
        periodLabel={data.periodLabel}
      />

      {err ? (
        <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {err}
        </div>
      ) : null}

      {loading && data.rows.length === 0 ? (
        <div className="flex min-h-[30vh] items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          載入員工績效…
        </div>
      ) : (
        <>
          <StaffKpiCards kpis={data.kpis} loading={loading} />
          <StaffAnomalyCards anomalies={data.anomalies} loading={loading} />

          <Tabs defaultValue="ranking" className="space-y-4">
            <TabsList>
              <TabsTrigger value="ranking">排行榜</TabsTrigger>
              <TabsTrigger value="trend">趨勢分析</TabsTrigger>
              <TabsTrigger value="detail">員工明細</TabsTrigger>
            </TabsList>

            <TabsContent value="ranking" className="space-y-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <h2 className="text-lg font-semibold tracking-tight">收入 vs 人工</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    右下為高效（高收入低人工）；虛線為毛利＝0（收入＝人工）
                  </p>
                  <div className="mt-3">
                    <StaffScatterChart rows={data.rows} loading={loading} />
                  </div>
                </section>
                <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <h2 className="text-lg font-semibold tracking-tight">毛利排行</h2>
                  <p className="mt-1 text-sm text-muted-foreground">收入減人工（需有月結）</p>
                  <div className="mt-3">
                    <StaffProfitRanking rows={data.rows} loading={loading} />
                  </div>
                </section>
              </div>
            </TabsContent>

            <TabsContent value="trend" className="space-y-4">
              <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <h2 className="text-lg font-semibold tracking-tight">月趨勢</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  季度模式可比較最多 5 位老師的月收入
                </p>
                <div className="mt-3">
                  <StaffTrendChart trends={data.monthlyTrend} loading={loading} />
                </div>
              </section>
              <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <h2 className="text-lg font-semibold tracking-tight">人工佔比熱力表</h2>
                <div className="mt-3">
                  <StaffLaborHeatTable cells={data.heatCells} loading={loading} />
                </div>
              </section>
            </TabsContent>

            <TabsContent value="detail">
              <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <h2 className="text-lg font-semibold tracking-tight">員工明細</h2>
                <div className="mt-3">
                  <StaffDetailTable rows={data.rows} loading={loading} />
                </div>
              </section>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
