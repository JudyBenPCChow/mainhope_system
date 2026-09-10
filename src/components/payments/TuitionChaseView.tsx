import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { HandCoins, RefreshCw, Search } from "lucide-react"

import {
 AdminPageHeading,
 adminPageHeaderLayoutClass,
} from "@/components/detail/AdminPageHeader"
import { AdminWorkspaceNav } from "@/components/detail/AdminWorkspaceNav"
import {
 StickyListLead,
 StickyListShell,
 stickyTableBodyClass,
 stickyTableHeadCellClass,
 stickyTableHeadClass,
 stickyTableHeadRowClass,
 stickyTableWrapClass,
} from "@/components/list/StickyListShell"
import { TuitionChasePreviewPanel } from "@/components/payments/TuitionChasePreviewPanel"
import {
 TuitionChaseDueCell,
 TuitionChaseRemainingCell,
 TuitionChaseStatusTag,
} from "@/components/payments/tuitionChaseDueUi"
import {
 getTuitionChaseListDataCache,
 isTuitionChaseListCacheFresh,
 setTuitionChaseListDataCache,
} from "@/components/payments/tuitionChaseListState"
import {
 useOpenStudentRecord,
 useRecordPreview,
} from "@/components/recordPreview/recordPreviewContext"
import { SoftArchiveScopeBanner } from "@/components/softArchive/SoftArchiveScopeBanner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StaggerRows } from "@/components/ui/stagger-list"
import { useIsMobile } from "@/hooks/use-mobile"
import { ADMIN_WORKSPACE_DESCRIPTION } from "@/lib/adminNavigation"
import { useAuth } from "@/lib/authBootstrap"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { usesSharedAppShell } from "@/lib/mgmtRole"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { defaultTuitionChasePoolKey } from "@/lib/tuitionChaseDetail"
import type { TuitionChaseQueueStatus } from "@/lib/tuitionChaseDue"
import { formatTuitionChaseEnrolledClass, tuitionChaseThisPeriodSkipReason } from "@/lib/tuitionChaseLabels"
import { specialistTuitionPeriodCaption } from "@/lib/specialistTuitionPeriods"
import { cn } from "@/lib/utils"
import { todayYmdLocal } from "@/lib/weekdayUtils"
import {
 fetchTuitionChaseList,
 type TuitionChaseListResult,
 type TuitionChasePeriodRef,
 type TuitionChasePoolRow,
 type TuitionChaseStudentRow,
} from "@/services/tuitionChaseQueries"

type QueueFilter = TuitionChaseQueueStatus | "all"

function matchesSearch(row: TuitionChaseStudentRow, q: string): boolean {
 if (!q) return true
 const hay = [
  row.studentName,
  row.englishName ?? "",
  row.studentCode ?? "",
  row.grade ?? "",
  ...row.pools.map((p) => p.label),
  ...row.pools.flatMap((p) =>
   (p.classes ?? []).map((c) => formatTuitionChaseEnrolledClass(c))
  ),
 ]
  .join(" ")
  .toLowerCase()
 return hay.includes(q.toLowerCase())
}

function ChasePoolClasses(props: { pool: TuitionChasePoolRow }) {
 const { pool } = props
 const classes = pool.classes ?? []
 if (classes.length === 0) {
  return <span>{pool.label}</span>
 }
 return (
  <div className="space-y-0.5">
   {classes.map((c) => (
    <div key={c.classId} className="leading-snug [overflow-wrap:anywhere]">
     {c.courseCode ? (
      <span className="mr-1.5 font-mono text-xs tabular-nums text-muted-foreground">
       {c.courseCode}
      </span>
     ) : null}
     <span>{c.displayName}</span>
    </div>
   ))}
  </div>
 )
}

function queueEmptyText(filter: QueueFilter, searching: boolean): string {
 if (searching) return "沒有符合搜尋的學生。"
 if (filter === "now") return "目前沒有本期未繳清的學生。"
 if (filter === "next") return "沒有本期已繳清、下期仍要追的學生。"
 if (filter === "unknown") return "沒有未有結餘資料的組別。"
 if (filter === "prepaid") return "沒有已預繳學生。"
 return "沒有符合篩選條件的學生。"
}

function ChaseStudentTableCells(props: {
 row: TuitionChaseStudentRow
 showStatus: boolean
 onSelectPool: (poolKey: string) => void
 onOpenStudent: (studentId: string) => void
}) {
 const { row } = props
 const meta = [row.studentCode, row.grade, row.englishName].filter(Boolean).join(" · ")
 return (
  <>
   <td className="min-w-0 align-top px-3 py-2.5">
    <div className="flex flex-wrap items-center gap-2">
     <button
      type="button"
      className="font-medium text-primary hover:underline"
      onClick={(e) => {
       e.stopPropagation()
       props.onOpenStudent(row.studentId)
      }}
     >
      {row.studentName}
     </button>
     {props.showStatus ? <TuitionChaseStatusTag status={row.status} /> : null}
    </div>
    {meta ? <div className="mt-0.5 text-xs text-muted-foreground">{meta}</div> : null}
   </td>
   <td className="min-w-0 align-top px-3 py-2.5 text-sm">
    {row.pools.length === 0 ? (
     <span className="text-muted-foreground">—</span>
    ) : row.pools.length === 1 ? (
     <ChasePoolClasses pool={row.pools[0]!} />
    ) : (
     <div className="space-y-1.5">
      {row.pools.map((p) => (
       <button
        key={p.poolKey}
        type="button"
        className="block w-full text-left text-muted-foreground hover:text-foreground"
        onClick={(e) => {
         e.stopPropagation()
         props.onSelectPool(p.poolKey)
        }}
       >
        <ChasePoolClasses pool={p} />
       </button>
      ))}
     </div>
    )}
   </td>
   <td className="align-top whitespace-nowrap px-3 py-2.5 text-right">
    <TuitionChaseDueCell
     lessons={row.thisPeriodDueLessons}
     emphasize="warning"
     reason={tuitionChaseThisPeriodSkipReason({
      remainingLessons: row.remainingLessons,
      remainingAfterThisPeriod: row.remainingLessons - row.thisPeriodPendingUnits,
      thisPeriodPendingUnits: row.thisPeriodPendingUnits,
      thisPeriodDueLessons: row.thisPeriodDueLessons,
      thisPeriodDeductedUnits: row.thisPeriodDeductedUnits ?? 0,
      thisPeriodNondeductUnits: row.thisPeriodNondeductUnits ?? 0,
      remainingKnown: row.remainingKnown,
     })}
    />
   </td>
   <td className="align-top whitespace-nowrap px-3 py-2.5 text-right">
    <TuitionChaseDueCell lessons={row.nextPeriodDueLessons} emphasize="info" />
   </td>
   <td className="align-top whitespace-nowrap px-3 py-2.5 text-right">
    <div className="flex justify-end">
     <TuitionChaseRemainingCell
      remainingLessons={row.remainingLessons}
      remainingKnown={row.remainingKnown}
     />
    </div>
   </td>
   <td className="align-top whitespace-nowrap px-3 py-2.5 text-right">
    <Button type="button" variant="outline" size="sm" asChild>
     <Link
      to={`/Payments?studentId=${encodeURIComponent(row.studentId)}`}
      onClick={(e) => e.stopPropagation()}
     >
      收款
     </Link>
    </Button>
   </td>
  </>
 )
}

export function TuitionChaseView() {
 const { role } = useAuth()
 const openStudent = useOpenStudentRecord()
 const {
  preview,
  replacePreview,
  closePreview,
  enabled: previewEnabled,
 } = useRecordPreview()
 const initialCache = useMemo(() => getTuitionChaseListDataCache(), [])
 const [rows, setRows] = useState<TuitionChaseStudentRow[]>(() => initialCache?.rows ?? [])
 const [hiddenOlderCount, setHiddenOlderCount] = useState(() => initialCache?.hiddenOlderCount ?? 0)
 const [opsYearLabels, setOpsYearLabels] = useState<string[]>(() => initialCache?.opsYearLabels ?? [])
 const [currentPeriod, setCurrentPeriod] = useState<TuitionChasePeriodRef | null>(
  () => initialCache?.currentPeriod ?? null
 )
 const [nextPeriod, setNextPeriod] = useState<TuitionChasePeriodRef | null>(
  () => initialCache?.nextPeriod ?? null
 )
 const [includeOlderYears, setIncludeOlderYears] = useState(
  () => initialCache?.includeOlderYears ?? false
 )
 const [queueFilter, setQueueFilter] = useState<QueueFilter>("now")
 const [loading, setLoading] = useState(() => initialCache == null)
 const [err, setErr] = useState<string | null>(null)
 const [searchInput, setSearchInput] = useState("")
 const [searchDebounced, setSearchDebounced] = useState("")
 const [mobileStudentId, setMobileStudentId] = useState<string | null>(null)
 const [mobilePoolKey, setMobilePoolKey] = useState<string | null>(null)
 const isMobile = useIsMobile()

 useEffect(() => {
  const t = window.setTimeout(() => setSearchDebounced(searchInput.trim()), 300)
  return () => window.clearTimeout(t)
 }, [searchInput])

 const applyListResult = useCallback(
  (result: TuitionChaseListResult) => {
   setRows(result.rows)
   setHiddenOlderCount(result.hiddenOlderCount)
   setOpsYearLabels(result.opsYearLabels)
   setCurrentPeriod(result.currentPeriod)
   setNextPeriod(result.nextPeriod)
   setTuitionChaseListDataCache({
    includeOlderYears,
    todayYmd: todayYmdLocal(),
    rows: result.rows,
    hiddenOlderCount: result.hiddenOlderCount,
    opsYearLabels: result.opsYearLabels,
    currentPeriod: result.currentPeriod,
    nextPeriod: result.nextPeriod,
   })
  },
  [includeOlderYears]
 )

 const load = useCallback(
  async (opts?: { silent?: boolean }) => {
   if (!isSupabaseConfigured) {
    setRows([])
    setHiddenOlderCount(0)
    setOpsYearLabels([])
    setCurrentPeriod(null)
    setNextPeriod(null)
    setLoading(false)
    return
   }
   const cached = getTuitionChaseListDataCache()
   if (!opts?.silent) setLoading(true)
   setErr(null)
   try {
    const result = await fetchTuitionChaseList({ includeOlderYears })
    applyListResult(result)
   } catch (e) {
    reportUserFacingError(e, { source: "TuitionChaseView.load", setErr })
    if (!cached) {
     setRows([])
     setHiddenOlderCount(0)
    }
   } finally {
    setLoading(false)
   }
  },
  [includeOlderYears, applyListResult]
 )

 useEffect(() => {
  const cached = getTuitionChaseListDataCache()
  if (isTuitionChaseListCacheFresh(includeOlderYears, todayYmdLocal())) return
  const yearScopeChanged = cached != null && cached.includeOlderYears !== includeOlderYears
  void load({ silent: cached != null && !yearScopeChanged })
 }, [includeOlderYears, load])

 const chasePreview = preview?.kind === "tuitionChase" ? preview : null
 const selectedStudentId = previewEnabled
  ? chasePreview?.id ?? null
  : mobileStudentId

 const selectedRow = useMemo(() => {
  const id = selectedStudentId
  if (!id) return null
  return rows.find((r) => r.studentId === id) ?? (chasePreview?.row ?? null)
 }, [rows, selectedStudentId, chasePreview])

 const handleSelect = useCallback(
  (row: TuitionChaseStudentRow, poolKey?: string) => {
   const nextPool = poolKey ?? defaultTuitionChasePoolKey(row.pools) ?? undefined
   if (previewEnabled) {
    if (chasePreview?.id === row.studentId && !poolKey) {
     closePreview()
     return
    }
    replacePreview({
     kind: "tuitionChase",
     id: row.studentId,
     poolKey: nextPool,
     row,
     currentPeriod,
     nextPeriod,
     academicYearLabel: opsYearLabels[0],
    })
    return
   }
   if (mobileStudentId === row.studentId && !poolKey) {
    setMobileStudentId(null)
    setMobilePoolKey(null)
    return
   }
   setMobileStudentId(row.studentId)
   setMobilePoolKey(nextPool ?? null)
  },
  [
   previewEnabled,
   chasePreview,
   closePreview,
   replacePreview,
   currentPeriod,
   nextPeriod,
   opsYearLabels,
   mobileStudentId,
  ]
 )

 const closeMobileDetail = useCallback(() => {
  setMobileStudentId(null)
  setMobilePoolKey(null)
 }, [])

 useEffect(() => {
  if (!previewEnabled || !chasePreview) return
  const row = rows.find((r) => r.studentId === chasePreview.id)
  if (!row) {
   closePreview()
   return
  }
  if (row !== chasePreview.row) {
   replacePreview({ ...chasePreview, row })
  }
 }, [rows, previewEnabled, chasePreview, closePreview, replacePreview])

 useEffect(() => {
  if (previewEnabled) return
  if (mobileStudentId && !rows.some((r) => r.studentId === mobileStudentId)) {
   closeMobileDetail()
  }
 }, [rows, previewEnabled, mobileStudentId, closeMobileDetail])

 useEffect(() => {
  if (previewEnabled || !mobileStudentId) return
  const onKey = (e: KeyboardEvent) => {
   if (e.key === "Escape") closeMobileDetail()
  }
  window.addEventListener("keydown", onKey)
  return () => window.removeEventListener("keydown", onKey)
 }, [previewEnabled, mobileStudentId, closeMobileDetail])

 const searched = useMemo(
  () => rows.filter((r) => matchesSearch(r, searchDebounced)),
  [rows, searchDebounced]
 )

 const chipCounts = useMemo(() => {
  let now = 0
  let next = 0
  let unknown = 0
  let prepaid = 0
  let nowThisLessons = 0
  let nextLessons = 0
  let thisPeriodDuePeople = 0
  let nextPeriodDuePeople = 0
  for (const r of searched) {
   if (r.thisPeriodDueLessons > 0) thisPeriodDuePeople += 1
   if (r.nextPeriodDueLessons > 0) nextPeriodDuePeople += 1
   if (r.status === "now") {
    now += 1
    nowThisLessons += r.thisPeriodDueLessons
   } else if (r.status === "next") {
    next += 1
    nextLessons += r.nextPeriodDueLessons
   } else if (r.status === "unknown") {
    unknown += 1
   } else if (r.status === "prepaid") {
    prepaid += 1
   }
  }
  return {
   all: searched.length,
   now,
   next,
   unknown,
   prepaid,
   nowThisLessons,
   nextLessons,
   thisPeriodDuePeople,
   nextPeriodDuePeople,
  }
 }, [searched])

 useEffect(() => {
  if (searchDebounced.length > 0) setQueueFilter("all")
 }, [searchDebounced])

 useEffect(() => {
  if (searchDebounced.length > 0) return
  if (queueFilter === "unknown" && chipCounts.unknown === 0) {
   setQueueFilter("now")
  }
 }, [queueFilter, chipCounts.unknown, searchDebounced])

 const visibleRows = useMemo(() => {
  if (queueFilter === "all") return searched
  return searched.filter((r) => r.status === queueFilter)
 }, [searched, queueFilter])

 const searching = searchDebounced.length > 0
 const sharedShell = usesSharedAppShell(role)
 const thisPeriodCaption = specialistTuitionPeriodCaption(currentPeriod)
 const nextPeriodCaption = specialistTuitionPeriodCaption(nextPeriod)
 const hasPeriodTable = Boolean(currentPeriod || nextPeriod)
 const mobileDetail = !previewEnabled && isMobile && Boolean(selectedRow)

 const refreshButton = (
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
 )

 const chips: { key: QueueFilter; label: string; count: number; hide?: boolean }[] = [
  { key: "now", label: "現在要追", count: chipCounts.now },
  { key: "next", label: "下期要追", count: chipCounts.next },
  { key: "unknown", label: "未有結餘資料", count: chipCounts.unknown, hide: chipCounts.unknown === 0 },
  { key: "prepaid", label: "已預繳", count: chipCounts.prepaid },
  { key: "all", label: "全部", count: chipCounts.all },
 ]

 return (
  <StickyListShell
   sticky={!isMobile && !mobileDetail}
   header={
    <>
     {!isSupabaseConfigured ? (
      <div
       role="alert"
       className="rounded-lg border border-warning/50 bg-warning/10 px-3 py-2 text-sm text-warning"
      >
       請設定 <code className="rounded bg-muted px-1">.env</code> 內 Supabase 後重啟
       dev。
      </div>
     ) : null}

     {err ? (
      <div
       role="alert"
       className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
      >
       {err}
      </div>
     ) : null}

     <div className={sharedShell ? "space-y-6" : undefined}>
      <div
       className={
        sharedShell
         ? adminPageHeaderLayoutClass
         : "flex flex-wrap items-end justify-between gap-4"
       }
      >
       {sharedShell ? (
        <AdminPageHeading
         eyebrow="行政工作"
         title="學費追收"
         description={ADMIN_WORKSPACE_DESCRIPTION.payments}
        />
       ) : (
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
         <HandCoins className="h-8 w-8 text-primary" aria-hidden />
         學費追收
        </h1>
       )}
       {refreshButton}
      </div>
      {sharedShell ? <AdminWorkspaceNav workspace="payments" /> : null}
     </div>
    </>
   }
  >
   <StickyListLead>
    <SoftArchiveScopeBanner
     hiddenCount={includeOlderYears ? 0 : hiddenOlderCount}
     description={`已隱藏 ${hiddenOlderCount} 位沒有本學年（${opsYearLabels.join("、") || "—"}）就讀中報讀的學生；各欄數字仍只計本學年（資料仍在，並非刪除）`}
     onShow={() => setIncludeOlderYears(true)}
    />

    {hasPeriodTable && !mobileDetail ? (
     <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
       {thisPeriodCaption ? <span>本期：{thisPeriodCaption}</span> : null}
       {nextPeriodCaption ? (
        <span>下期：{nextPeriodCaption}</span>
       ) : (
        <span>本學年已無下期</span>
       )}
       <span className="w-full">
        本期＝仍未上完的最早一期，不是今日剛開始的那一期。
       </span>
       <span>
        現在要追{" "}
        <strong className="tabular-nums text-foreground">{chipCounts.now}</strong> 人
        {chipCounts.nowThisLessons > 0 ? (
         <>
          {" · "}
          <strong className="tabular-nums text-foreground">{chipCounts.nowThisLessons}</strong> 堂
         </>
        ) : null}
       </span>
       <span>
        下期要追{" "}
        <strong className="tabular-nums text-foreground">{chipCounts.next}</strong> 人
        {chipCounts.nextLessons > 0 ? (
         <>
          {" · "}
          <strong className="tabular-nums text-foreground">{chipCounts.nextLessons}</strong> 堂
         </>
        ) : null}
       </span>
       <span>
        本期要交{" "}
        <strong className="tabular-nums text-foreground">{chipCounts.thisPeriodDuePeople}</strong>{" "}
        人
        {nextPeriod ? (
         <>
          {" · "}
          下期要交{" "}
          <strong className="tabular-nums text-foreground">
           {chipCounts.nextPeriodDuePeople}
          </strong>{" "}
          人
         </>
        ) : null}
       </span>
      </div>
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
       <div className="flex flex-wrap gap-2">
        {chips
         .filter((c) => !c.hide)
         .map((c) => (
          <button
           key={c.key}
           type="button"
           onClick={() => setQueueFilter(c.key)}
           className={cn(
            "rounded-full border px-3 py-1.5 text-sm font-medium",
            queueFilter === c.key
             ? "border-primary bg-primary text-primary-foreground"
             : "border-border bg-background hover:bg-muted/60"
           )}
          >
           {c.label} {c.count}
          </button>
         ))}
       </div>
       <div className="relative min-w-[12rem] flex-1 lg:max-w-sm">
        <Search
         className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
         aria-hidden
        />
        <Input
         className="h-9 pl-9"
         value={searchInput}
         onChange={(e) => setSearchInput(e.target.value)}
         placeholder="搜尋姓名／學號／年級／班別"
         aria-label="搜尋學生或班別"
        />
       </div>
      </div>
     </div>
    ) : null}
   </StickyListLead>

   {loading ? (
    <p className="py-8 text-center text-sm text-muted-foreground">載入中…</p>
   ) : !hasPeriodTable ? (
    <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
     本頁只適用常規專科班／私人課程的期數追收；功課輔導班是月費，請走收款登記。本學年沒有期數表或學年已完課，不要當成常規第一期。
    </p>
   ) : rows.length === 0 ? (
    <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
     目前沒有符合範圍的就讀中學生。
    </p>
   ) : mobileDetail && selectedRow ? (
    <div className="-mx-5 overflow-hidden rounded-xl border border-border bg-card sm:-mx-[1.875rem]">
     <TuitionChasePreviewPanel
      key={selectedRow.studentId}
      row={selectedRow}
      poolKey={mobilePoolKey}
      currentPeriod={currentPeriod}
      nextPeriod={nextPeriod}
      academicYearLabel={opsYearLabels[0]}
      showBack
      onClose={closeMobileDetail}
     />
    </div>
   ) : visibleRows.length === 0 ? (
    <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
     {queueEmptyText(queueFilter, searching)}
    </p>
   ) : (
    <div className={stickyTableWrapClass}>
     <table className="w-full min-w-[48rem] table-fixed border-separate border-spacing-0 text-sm isolate">
      <thead className={stickyTableHeadClass}>
       <tr className={cn(stickyTableHeadRowClass, "text-xs font-medium text-muted-foreground")}>
        <th className={cn(stickyTableHeadCellClass, "w-[22%] px-3 py-2")}>學生</th>
        <th className={cn(stickyTableHeadCellClass, "w-[28%] px-3 py-2")}>組別</th>
        <th className={cn(stickyTableHeadCellClass, "w-[12%] whitespace-nowrap px-3 py-2 text-right")}>
         本期要交
        </th>
        <th className={cn(stickyTableHeadCellClass, "w-[12%] whitespace-nowrap px-3 py-2 text-right")}>
         下期要交
        </th>
        <th className={cn(stickyTableHeadCellClass, "w-[16%] whitespace-nowrap px-3 py-2 text-right")}>
         尚餘可扣堂數
        </th>
        <th className={cn(stickyTableHeadCellClass, "w-[10%] whitespace-nowrap px-3 py-2 text-right")}>
         收款
        </th>
       </tr>
      </thead>
      <StaggerRows
       className={cn(stickyTableBodyClass, "[&_td]:border-b [&_td]:border-border")}
       items={visibleRows}
       keyFn={(row) => row.studentId}
       itemClassName={(row) =>
        cn(
         "cursor-pointer",
         selectedStudentId === row.studentId && "bg-info/15"
        )
       }
       itemProps={(row) => ({
        onClick: () => handleSelect(row),
       })}
       render={(row) => (
        <ChaseStudentTableCells
         row={row}
         showStatus={queueFilter === "all"}
         onSelectPool={(poolKey) => handleSelect(row, poolKey)}
         onOpenStudent={openStudent}
        />
       )}
      />
     </table>
    </div>
   )}
  </StickyListShell>
 )
}
