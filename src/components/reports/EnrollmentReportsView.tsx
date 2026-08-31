import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { BarChart3, Download, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tag } from "@/components/ui/tag"
import { StaggerItem, StaggerList } from "@/components/ui/stagger-list"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { classKindLabel } from "@/lib/privateClassKind"
import { statusToTagTone } from "@/lib/statusTag"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"
import type { AcademicYearOption } from "@/services/classQueries"
import {
 downloadEnrollmentReportCsv,
 exportClassHeadcountCsv,
 exportOverallStudentCsv,
 exportSubjectHeadcountCsv,
 exportTeacherHeadcountCsv,
 fetchEnrollmentReport,
 fetchEnrollmentReportAcademicYears,
 fetchOverallStudentAnalysis,
 type ClassHeadcountRow,
 type ClassKindFilter,
 type EnrollmentReportPayload,
 type OverallStudentAnalysis,
 type StatusBucket,
 type SubjectHeadcountRow,
 type TeacherHeadcountRow,
} from "@/services/enrollmentReportQueries"

type TabId = "overall" | "subject" | "class" | "teacher"

const emptyReport: EnrollmentReportPayload = {
 subjects: [],
 classes: [],
 teachers: [],
 totals: { classCount: 0, enrollmentCount: 0, distinctStudents: 0 },
}

const emptyOverall: OverallStudentAnalysis = {
 totalStudents: 0,
 enrolledStudents: 0,
 buckets: { registration: [], enrollment: [], activity: [], academicStage: [] },
}

function todayYmd(): string {
 return new Date().toISOString().slice(0, 10)
}

function BucketPanel({ title, buckets }: { title: string; buckets: StatusBucket[] }) {
 const sum = buckets.reduce((s, b) => s + b.count, 0)
 return (
  <section className="rounded-xl border border-border bg-card p-4 shadow-sm md:p-5">
   <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>
   {sum === 0 ? (
    <p className="text-sm text-muted-foreground">尚無資料</p>
   ) : (
    <ul className="space-y-2">
     {buckets.map((b) => (
      <li key={b.label} className="flex items-center justify-between gap-3 text-sm">
       <span className="text-muted-foreground">{b.label}</span>
       <span className="font-semibold tabular-nums text-foreground">{b.count}</span>
      </li>
     ))}
    </ul>
   )}
  </section>
 )
}

function SummaryStat({ label, value }: { label: string; value: number }) {
 return (
  <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
   <p className="text-xs text-muted-foreground">{label}</p>
   <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
  </div>
 )
}

export function EnrollmentReportsView() {
 const [years, setYears] = useState<AcademicYearOption[]>([])
 const [academicYearId, setAcademicYearId] = useState("")
 const [classKind, setClassKind] = useState<ClassKindFilter>("all")
 const [tab, setTab] = useState<TabId>("overall")
 const [report, setReport] = useState<EnrollmentReportPayload>(emptyReport)
 const [overall, setOverall] = useState<OverallStudentAnalysis>(emptyOverall)
 const [loading, setLoading] = useState(true)
 const [err, setErr] = useState<string | null>(null)
 const [yearsReady, setYearsReady] = useState(false)

 useEffect(() => {
  if (!isSupabaseConfigured) {
   setYearsReady(true)
   return
  }
  let cancelled = false
  ;(async () => {
   try {
    const opts = await fetchEnrollmentReportAcademicYears()
    if (cancelled) return
    setYears(opts)
    const current = opts.find((y) => y.is_current) ?? opts[0]
    setAcademicYearId(current?.id ?? "")
   } catch (e) {
    if (!cancelled) {
     reportUserFacingError(e, { source: "EnrollmentReportsView.loadYears", setErr })
    }
   } finally {
    if (!cancelled) setYearsReady(true)
   }
  })()
  return () => {
   cancelled = true
  }
 }, [])

 const load = useCallback(async () => {
  if (!isSupabaseConfigured) {
   setReport(emptyReport)
   setOverall(emptyOverall)
   setLoading(false)
   return
  }
  if (!yearsReady) return
  setLoading(true)
  setErr(null)
  try {
   const [reportData, overallData] = await Promise.all([
    academicYearId
     ? fetchEnrollmentReport({ academicYearId, classKind })
     : Promise.resolve(emptyReport),
    fetchOverallStudentAnalysis(),
   ])
   setReport(reportData)
   setOverall(overallData)
  } catch (e) {
   reportUserFacingError(e, { source: "EnrollmentReportsView.load", setErr })
   setReport(emptyReport)
   setOverall(emptyOverall)
  } finally {
   setLoading(false)
  }
 }, [academicYearId, classKind, yearsReady])

 useEffect(() => {
  void load()
 }, [load])

 const yearLabel = useMemo(
  () => years.find((y) => y.id === academicYearId)?.label ?? "—",
  [years, academicYearId]
 )

 const onExport = () => {
  const ymd = todayYmd()
  if (tab === "overall") {
   downloadEnrollmentReportCsv(`整體學生人數_${ymd}.csv`, exportOverallStudentCsv(overall))
   return
  }
  if (tab === "subject") {
   downloadEnrollmentReportCsv(
    `每科人數_${yearLabel}_${ymd}.csv`,
    exportSubjectHeadcountCsv(report.subjects)
   )
   return
  }
  if (tab === "class") {
   downloadEnrollmentReportCsv(
    `每班人數_${yearLabel}_${ymd}.csv`,
    exportClassHeadcountCsv(report.classes)
   )
   return
  }
  downloadEnrollmentReportCsv(
   `每位老師報讀人數_${yearLabel}_${ymd}.csv`,
   exportTeacherHeadcountCsv(report.teachers)
  )
 }

 return (
  <div className="space-y-6 md:p-6">
   <header className="flex flex-wrap items-end justify-between gap-4">
    <div>
     <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
      <BarChart3 className="h-8 w-8 text-primary" aria-hidden />
      人數報表
     </h1>
     <p className="mt-1 hidden max-w-2xl text-sm text-muted-foreground md:block">
      行政／外星人專用：統計就讀中報讀人數（每科、每班、每位老師）與整體學生主檔分佈。學年篩選只影響報讀聚合，不影響整體學生分析。
     </p>
    </div>
    <div className="flex flex-wrap items-center gap-2">
     <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onExport}
      disabled={loading || !isSupabaseConfigured}
     >
      <Download className="mr-1.5 h-4 w-4" />
      匯出 CSV
     </Button>
     <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => void load()}
      disabled={!isSupabaseConfigured || loading}
     >
      <RefreshCw className={cn("mr-1.5 h-4 w-4", loading && "animate-spin")} />
      重新整理
     </Button>
    </div>
   </header>

   {!isSupabaseConfigured ? (
    <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
     尚未設定 Supabase，無法載入報表。
    </p>
   ) : null}

   {err ? (
    <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
     {err}
    </p>
   ) : null}

   <div className="flex flex-wrap items-end gap-3">
    <label className="block min-w-[10rem]">
     <span className="mb-1.5 block text-xs font-medium text-muted-foreground">學年</span>
     <Select
      value={academicYearId}
      onChange={(e) => setAcademicYearId(e.target.value)}
      disabled={!yearsReady || years.length === 0}
     >
      {years.length === 0 ? <option value="">尚無學年</option> : null}
      {years.map((y) => (
       <option key={y.id} value={y.id}>
        {y.label}
        {y.is_current ? "（目前）" : ""}
       </option>
      ))}
     </Select>
    </label>
    <label className="block min-w-[9rem]">
     <span className="mb-1.5 block text-xs font-medium text-muted-foreground">班別類型</span>
     <Select
      value={classKind}
      onChange={(e) => setClassKind(e.target.value as ClassKindFilter)}
     >
      <option value="all">全部</option>
      <option value="group">專科班</option>
      <option value="private">私人課程</option>
     </Select>
    </label>
    {loading ? <span className="pb-2 text-sm text-muted-foreground">載入中…</span> : null}
   </div>

   <Tabs value={tab} onValueChange={(v) => setTab(v as TabId)}>
    <TabsList>
     <TabsTrigger value="overall">整體學生</TabsTrigger>
     <TabsTrigger value="subject">每科人數</TabsTrigger>
     <TabsTrigger value="class">每班人數</TabsTrigger>
     <TabsTrigger value="teacher">每位老師</TabsTrigger>
    </TabsList>

    <TabsContent value="overall" className="space-y-4">
     <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryStat label="學生總數" value={overall.totalStudents} />
      <SummaryStat label="在讀人數" value={overall.enrolledStudents} />
      <SummaryStat
       label="已註冊"
       value={overall.buckets.registration.find((b) => b.label === "已註冊")?.count ?? 0}
      />
      <SummaryStat
       label="活躍生"
       value={overall.buckets.activity.find((b) => b.label === "活躍生")?.count ?? 0}
      />
     </div>
     <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <BucketPanel title="註冊狀態" buckets={overall.buckets.registration} />
      <BucketPanel title="在讀狀態" buckets={overall.buckets.enrollment} />
      <BucketPanel title="活躍狀態" buckets={overall.buckets.activity} />
      <BucketPanel title="學業階段" buckets={overall.buckets.academicStage} />
     </div>
     <p className="text-xs text-muted-foreground">整體分析依學生主檔，不受上方學年／班別類型篩選影響。</p>
    </TabsContent>

    <TabsContent value="subject" className="space-y-4">
     <div className="grid gap-3 sm:grid-cols-3">
      <SummaryStat label="科目數" value={report.subjects.length} />
      <SummaryStat label="報讀筆數" value={report.totals.enrollmentCount} />
      <SummaryStat label="不重複學生" value={report.totals.distinctStudents} />
     </div>
     <SubjectTable rows={report.subjects} loading={loading} />
    </TabsContent>

    <TabsContent value="class" className="space-y-4">
     <div className="grid gap-3 sm:grid-cols-3">
      <SummaryStat label="班別數" value={report.totals.classCount} />
      <SummaryStat label="就讀中報讀" value={report.totals.enrollmentCount} />
      <SummaryStat label="不重複學生" value={report.totals.distinctStudents} />
     </div>
     <ClassTable rows={report.classes} loading={loading} />
    </TabsContent>

    <TabsContent value="teacher" className="space-y-4">
     <div className="grid gap-3 sm:grid-cols-3">
      <SummaryStat label="老師數" value={report.teachers.length} />
      <SummaryStat label="報讀筆數" value={report.totals.enrollmentCount} />
      <SummaryStat label="不重複學生" value={report.totals.distinctStudents} />
     </div>
     <TeacherTable rows={report.teachers} loading={loading} />
    </TabsContent>
   </Tabs>
  </div>
 )
}

function SubjectTable({ rows, loading }: { rows: SubjectHeadcountRow[]; loading: boolean }) {
 if (loading && rows.length === 0) {
  return <p className="text-sm text-muted-foreground">載入中…</p>
 }
 if (rows.length === 0) {
  return <p className="text-sm text-muted-foreground">此篩選下尚無科目報讀資料。</p>
 }
 return (
  <div className="overflow-x-auto rounded-xl border border-border">
   <table className="w-full min-w-[36rem] text-left text-sm">
    <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
     <tr>
      <th className="px-3 py-2 font-medium">科目</th>
      <th className="px-3 py-2 font-medium">代碼</th>
      <th className="px-3 py-2 font-medium text-right">班別數</th>
      <th className="px-3 py-2 font-medium text-right">報讀筆數</th>
      <th className="px-3 py-2 font-medium text-right">學生人數</th>
     </tr>
    </thead>
    <StaggerList as="tbody">
     {rows.map((r) => (
      <StaggerItem key={r.subjectKey} as="tr" className="border-b border-border/70 last:border-0">
       <td className="px-3 py-2 font-medium">{r.subjectName}</td>
       <td className="px-3 py-2 text-muted-foreground">{r.subjectCode ?? "—"}</td>
       <td className="px-3 py-2 text-right tabular-nums">{r.classCount}</td>
       <td className="px-3 py-2 text-right tabular-nums">{r.enrollmentCount}</td>
       <td className="px-3 py-2 text-right tabular-nums font-semibold">{r.studentCount}</td>
      </StaggerItem>
     ))}
    </StaggerList>
   </table>
  </div>
 )
}

function ClassTable({ rows, loading }: { rows: ClassHeadcountRow[]; loading: boolean }) {
 if (loading && rows.length === 0) {
  return <p className="text-sm text-muted-foreground">載入中…</p>
 }
 if (rows.length === 0) {
  return <p className="text-sm text-muted-foreground">此篩選下尚無班別。</p>
 }
 return (
  <div className="overflow-x-auto rounded-xl border border-border">
   <table className="w-full min-w-[40rem] text-left text-sm">
    <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
     <tr>
      <th className="px-3 py-2 font-medium">班別</th>
      <th className="px-3 py-2 font-medium">科目</th>
      <th className="px-3 py-2 font-medium">類型</th>
      <th className="px-3 py-2 font-medium">老師</th>
      <th className="px-3 py-2 font-medium text-right">就讀中人數</th>
     </tr>
    </thead>
    <StaggerList as="tbody">
     {rows.map((r) => (
      <StaggerItem key={r.classId} as="tr" className="border-b border-border/70 last:border-0">
       <td className="px-3 py-2">
        <Link
         to={`/Classes/${r.classId}`}
         className="font-medium text-primary underline-offset-2 hover:underline"
        >
         {r.courseCodeFull?.trim() || "（未命名班別）"}
        </Link>
       </td>
       <td className="px-3 py-2 text-muted-foreground">{r.subjectLabel}</td>
       <td className="px-3 py-2">
        <Tag tone={statusToTagTone(classKindLabel(r.classKind))}>
         {classKindLabel(r.classKind)}
        </Tag>
       </td>
       <td className="px-3 py-2">{r.teacherName ?? "—"}</td>
       <td className="px-3 py-2 text-right tabular-nums font-semibold">{r.studentCount}</td>
      </StaggerItem>
     ))}
    </StaggerList>
   </table>
  </div>
 )
}

function TeacherTable({ rows, loading }: { rows: TeacherHeadcountRow[]; loading: boolean }) {
 if (loading && rows.length === 0) {
  return <p className="text-sm text-muted-foreground">載入中…</p>
 }
 if (rows.length === 0) {
  return <p className="text-sm text-muted-foreground">此篩選下尚無老師班務。</p>
 }
 return (
  <div className="overflow-x-auto rounded-xl border border-border">
   <table className="w-full min-w-[32rem] text-left text-sm">
    <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
     <tr>
      <th className="px-3 py-2 font-medium">老師</th>
      <th className="px-3 py-2 font-medium text-right">班別數</th>
      <th className="px-3 py-2 font-medium text-right">報讀筆數</th>
      <th className="px-3 py-2 font-medium text-right">學生人數</th>
     </tr>
    </thead>
    <StaggerList as="tbody">
     {rows.map((r) => (
      <StaggerItem
       key={r.teacherId ?? `name:${r.teacherName}`}
       as="tr"
       className="border-b border-border/70 last:border-0"
      >
       <td className="px-3 py-2 font-medium">
        {r.teacherId ? (
         <Link
          to={`/Teachers/${r.teacherId}`}
          className="text-primary underline-offset-2 hover:underline"
         >
          {r.teacherName}
         </Link>
        ) : (
         r.teacherName
        )}
       </td>
       <td className="px-3 py-2 text-right tabular-nums">{r.classCount}</td>
       <td className="px-3 py-2 text-right tabular-nums">{r.enrollmentCount}</td>
       <td className="px-3 py-2 text-right tabular-nums font-semibold">{r.studentCount}</td>
      </StaggerItem>
     ))}
    </StaggerList>
   </table>
  </div>
 )
}
