import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Link, useLocation } from "react-router-dom"
import { ArrowUpRight, Banknote, CalendarDays, ChevronDown, HandCoins } from "lucide-react"

import { money } from "@/components/payments/paymentsUi"
import {
 TuitionChaseDuePair,
 TuitionChaseStatusTag,
} from "@/components/payments/tuitionChaseDueUi"
import {
 PreviewError,
 PreviewLoading,
 PreviewStat,
} from "@/components/recordPreview/previewUi"
import { Button } from "@/components/ui/button"
import { Tag } from "@/components/ui/tag"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { statusToTagTone } from "@/lib/statusTag"
import {
 defaultTuitionChasePoolKey,
 formatTuitionChaseSubjectSubtotals,
} from "@/lib/tuitionChaseDetail"
import {
 formatTuitionChaseScheduleDate,
 formatTuitionChaseTimeRange,
 tuitionChaseBalanceWhy,
 tuitionChaseSuggestedOnceCaption,
} from "@/lib/tuitionChaseLabels"
import { studentDetailLinkState } from "@/lib/studentDetailNav"
import { cn } from "@/lib/utils"
import {
 fetchTuitionChaseStudentDetail,
 type TuitionChasePeriodRef,
 type TuitionChasePoolDetail,
 type TuitionChaseScheduleLine,
 type TuitionChaseStudentRow,
} from "@/services/tuitionChaseQueries"

function sumLineUnits(lines: TuitionChaseScheduleLine[]): number {
 return lines.reduce((n, l) => n + l.units, 0)
}

function ScheduleLines(props: {
 lines: TuitionChaseScheduleLine[]
 emptyText: string
 showStatus?: boolean
}) {
 if (props.lines.length === 0) {
  return <p className="text-sm text-muted-foreground">{props.emptyText}</p>
 }
 const subtotals = formatTuitionChaseSubjectSubtotals(props.lines)
 return (
  <>
   {subtotals ? (
    <p className="mb-1.5 text-xs text-muted-foreground">{subtotals}</p>
   ) : null}
   <ul className="space-y-1.5">
    {props.lines.map((line) => {
     const time = formatTuitionChaseTimeRange(line.startTime, line.endTime)
     return (
      <li key={line.scheduleId} className="text-sm">
       <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="tabular-nums">{formatTuitionChaseScheduleDate(line.scheduledDate)}</span>
        {time ? <span className="text-muted-foreground tabular-nums">{time}</span> : null}
        <span>{line.classLabel}</span>
        <span className="tabular-nums text-muted-foreground">{line.units} 堂</span>
        {props.showStatus && line.attendanceStatus ? (
         <Tag tone={statusToTagTone(line.attendanceStatus)} size="sm">
          {line.attendanceStatus}
         </Tag>
        ) : null}
       </div>
      </li>
     )
    })}
   </ul>
  </>
 )
}

function DetailSection(props: {
 title: string
 icon: typeof Banknote
 defaultOpen: boolean
 children: ReactNode
}) {
 const [open, setOpen] = useState(props.defaultOpen)
 const Icon = props.icon
 return (
  <section className="rounded-xl border border-border bg-card p-3">
   <button
    type="button"
    className="flex w-full items-center gap-1.5 text-left"
    aria-expanded={open}
    onClick={() => setOpen((v) => !v)}
   >
    <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
    <h3 className="min-w-0 flex-1 text-xs font-semibold">{props.title}</h3>
    <ChevronDown
     className={cn(
      "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
      !open && "-rotate-90"
     )}
     aria-hidden
    />
   </button>
   {open ? <div className="mt-2">{props.children}</div> : null}
  </section>
 )
}

export function TuitionChasePreviewPanel(props: {
 row: TuitionChaseStudentRow
 poolKey?: string | null
 currentPeriod: TuitionChasePeriodRef | null
 nextPeriod: TuitionChasePeriodRef | null
 academicYearLabel?: string
 showBack?: boolean
 onClose?: () => void
}) {
 const location = useLocation()
 const { row } = props
 const thisPeriodLabel = props.currentPeriod?.label ?? "本期"
 const nextPeriodLabel = props.nextPeriod?.label ?? "下期"

 const [poolKey, setPoolKey] = useState(
  () => props.poolKey ?? defaultTuitionChasePoolKey(row.pools)
 )
 const [detail, setDetail] = useState<TuitionChasePoolDetail | null>(null)
 const [detailsByPool, setDetailsByPool] = useState<Map<string, TuitionChasePoolDetail>>(
  () => new Map()
 )
 const [loading, setLoading] = useState(true)
 const [err, setErr] = useState<string | null>(null)

 const poolKeySig = row.pools.map((p) => p.poolKey).join("|")
 const periodSig = `${props.currentPeriod?.index ?? ""}|${props.nextPeriod?.index ?? ""}`

 useEffect(() => {
  setPoolKey(props.poolKey ?? defaultTuitionChasePoolKey(row.pools))
 }, [row.studentId, props.poolKey, poolKeySig, row.pools])

 const pool = useMemo(
  () => row.pools.find((p) => p.poolKey === poolKey) ?? row.pools[0] ?? null,
  [row.pools, poolKey]
 )

 useEffect(() => {
  let cancelled = false
  setLoading(true)
  setErr(null)
  setDetailsByPool(new Map())
  setDetail(null)
  void (async () => {
   try {
    const list = await fetchTuitionChaseStudentDetail({
     studentId: row.studentId,
     pools: row.pools,
     currentPeriod: props.currentPeriod,
     nextPeriod: props.nextPeriod,
     academicYearLabel: props.academicYearLabel,
    })
    if (cancelled) return
    const map = new Map(list.map((d) => [d.poolKey, d]))
    setDetailsByPool(map)
   } catch (e) {
    if (cancelled) return
    reportUserFacingError(e, { source: "TuitionChasePreviewPanel.load", setErr })
    setDetailsByPool(new Map())
   } finally {
    if (!cancelled) setLoading(false)
   }
  })()
  return () => {
   cancelled = true
  }
 }, [
  row.studentId,
  poolKeySig,
  row.pools,
  periodSig,
  props.currentPeriod,
  props.nextPeriod,
  props.academicYearLabel,
 ])

 useEffect(() => {
  setDetail(pool ? detailsByPool.get(pool.poolKey) ?? null : null)
 }, [pool, detailsByPool])

 const detailHref = `/Students/${row.studentId}?tab=tuitionChase${
  pool ? `&pool=${encodeURIComponent(pool.poolKey)}` : ""
 }`

 const dueThis = pool?.thisPeriodDueLessons ?? row.thisPeriodDueLessons
 const dueNext = pool?.nextPeriodDueLessons ?? row.nextPeriodDueLessons
 const suggested = pool?.suggestedLessons ?? row.suggestedLessons
 const remainingKnown = pool?.remainingKnown ?? row.remainingKnown
 const remaining = pool?.remainingLessons ?? row.remainingLessons
 const pendingUnits = detail ? sumLineUnits(detail.thisPeriodPending) : (pool?.thisPeriodPendingUnits ?? 0)
 const deductedUnits = detail ? sumLineUnits(detail.deducted) : (pool?.thisPeriodDeductedUnits ?? 0)
 const nondeductUnits = detail
  ? sumLineUnits(detail.thisPeriodNondeduct)
  : (pool?.thisPeriodNondeductUnits ?? 0)
 const nextUnits = detail ? sumLineUnits(detail.nextPeriod) : (pool?.nextPeriodUnits ?? 0)
 const paidLessonTotal = detail ? detail.payments.reduce((n, p) => n + p.lessonCount, 0) : null
 const paidLineCount = detail?.payments.length ?? null
 const pendingSubtotals = detail ? formatTuitionChaseSubjectSubtotals(detail.thisPeriodPending) : ""
 const nextSubtotals = detail ? formatTuitionChaseSubjectSubtotals(detail.nextPeriod) : ""
 const whyText = pool
  ? tuitionChaseBalanceWhy({
     thisPeriodLabel,
     nextPeriodLabel,
     remainingLessons: pool.remainingLessons,
     thisPeriodPendingUnits: pendingUnits,
     thisPeriodDueLessons: pool.thisPeriodDueLessons,
     remainingAfterThisPeriod: pool.remainingAfterThisPeriod,
     nextPeriodUnits: nextUnits,
     nextPeriodDueLessons: pool.nextPeriodDueLessons,
     remainingKnown: pool.remainingKnown,
     thisPeriodDeductedUnits: deductedUnits,
     thisPeriodNondeductUnits: nondeductUnits,
    })
  : null

 return (
  <div className="flex min-h-full flex-col text-sm">
   {props.showBack ? (
    <div className="border-b border-border px-3 py-2">
     <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={props.onClose}>
      返回名單
     </Button>
    </div>
   ) : null}
   <header className="px-3 pb-3 pt-3 pr-10">
    <p className="text-xs font-medium text-muted-foreground">學費詳情</p>
    <div className="mt-1 flex flex-wrap items-center gap-2">
     <h2 className="text-xl font-bold leading-tight">{row.studentName}</h2>
     <TuitionChaseStatusTag status={row.status} />
    </div>
    <p className="mt-1 text-xs text-muted-foreground">
     {[row.studentCode, row.grade, row.englishName].filter(Boolean).join(" · ") || "—"}
    </p>
   </header>

   <div className="flex-1 space-y-3 px-3 pb-3">
    {row.pools.length > 1 ? (
     <div className="flex flex-wrap gap-1.5">
      {row.pools.map((p) => {
       const active = pool?.poolKey === p.poolKey
       return (
        <button
         key={p.poolKey}
         type="button"
         className={cn(
          "rounded-full border px-2.5 py-1 text-xs",
          active
           ? "border-primary bg-primary/5 text-foreground"
           : "border-border text-muted-foreground hover:bg-muted/50"
         )}
         aria-pressed={active}
         onClick={() => setPoolKey(p.poolKey)}
        >
         {p.label}
         {!p.remainingKnown
          ? " · 未有結餘資料"
          : p.thisPeriodDueLessons > 0
            ? ` · 本期 ${p.thisPeriodDueLessons}`
            : p.nextPeriodDueLessons > 0
              ? ` · 下期 ${p.nextPeriodDueLessons}`
              : " · 不用收"}
        </button>
       )
      })}
     </div>
    ) : pool ? (
     <p className="text-xs font-medium text-muted-foreground">{pool.label}</p>
    ) : null}

    {pool ? (
     <>
      <TuitionChaseDuePair
       thisPeriodLabel={thisPeriodLabel}
       nextPeriodLabel={nextPeriodLabel}
       thisPeriodDueLessons={dueThis}
       nextPeriodDueLessons={dueNext}
       remainingLessons={remaining}
       remainingKnown={remainingKnown}
      />
      {whyText ? (
       <p className="text-xs leading-relaxed text-foreground">{whyText}</p>
      ) : null}
      <p className="text-xs text-muted-foreground">
       {tuitionChaseSuggestedOnceCaption(suggested)}
      </p>
      <div className="grid grid-cols-2 gap-2">
       <PreviewStat
        label={`${thisPeriodLabel}已扣`}
        value={`${deductedUnits} 堂`}
        hint="本期已點名且計費的堂。"
       />
       <PreviewStat
        label={`${thisPeriodLabel}還會扣`}
        value={`${pendingUnits} 堂`}
        hint="本期尚未點名、仍會扣的排程。"
       />
       <PreviewStat
        label={`${nextPeriodLabel}會扣`}
        value={`${nextUnits} 堂`}
        hint="下期未取消排程單位（尚未扣）。"
       />
       <PreviewStat
        label="已收款堂數"
        value={paidLessonTotal == null ? "…" : `${paidLessonTotal} 堂`}
        hint="此組別已收款學費行堂數加總（含已扣），與尚餘不同。優惠／罰款不計。"
       />
      </div>
      {pendingSubtotals || nextSubtotals ? (
       <p className="text-xs text-muted-foreground">
        {pendingSubtotals ? `還會扣 ${pendingSubtotals}` : ""}
        {pendingSubtotals && nextSubtotals ? " · " : ""}
        {nextSubtotals ? `會扣 ${nextSubtotals}` : ""}
       </p>
      ) : null}
     </>
    ) : (
     <p className="text-sm text-muted-foreground">沒有已繳堂數組別。</p>
    )}

    {err ? <PreviewError message={err} /> : null}
    {loading ? <PreviewLoading /> : null}

    {!loading && pool ? (
     <>
      <DetailSection
       title={
        paidLineCount != null && paidLessonTotal != null
         ? `已收款（${paidLineCount} 筆 · ${paidLessonTotal} 堂）`
         : "已收款"
       }
       icon={Banknote}
       defaultOpen={false}
      >
       {!detail || detail.payments.length === 0 ? (
        <p className="text-sm text-muted-foreground">沒有此組別的已收款學費明細。</p>
       ) : (
        <ul className="space-y-2">
         {detail.payments.map((p, i) => (
          <li key={`${p.paymentId}-${p.classLabel}-${i}`} className="text-sm">
           <div className="flex flex-wrap items-baseline justify-between gap-x-2">
            <span>
             {p.paymentDate || "—"}
             {p.receiptNumber ? ` · ${p.receiptNumber}` : ""}
            </span>
            {p.amount != null ? <span className="tabular-nums">{money(p.amount)}</span> : null}
           </div>
           <p className="text-xs text-muted-foreground">
            {p.classLabel}
            {p.lessonCount > 0 ? ` · ${p.lessonCount} 堂` : ""}
            {p.description ? ` · ${p.description}` : ""}
           </p>
          </li>
         ))}
        </ul>
       )}
       <p className="mt-2 text-xs">
        <Link
         to={`/PaymentHistory?studentId=${encodeURIComponent(row.studentId)}`}
         className="font-medium text-primary hover:underline"
        >
         繳費紀錄
        </Link>
       </p>
      </DetailSection>

      <DetailSection
       title={`${thisPeriodLabel}已扣${deductedUnits != null ? `（${deductedUnits} 堂）` : ""}`}
       icon={CalendarDays}
       defaultOpen={false}
      >
       <ScheduleLines
        lines={detail?.deducted ?? []}
        emptyText={`${thisPeriodLabel}尚未扣堂。`}
        showStatus
       />
      </DetailSection>

      <DetailSection
       title={`${thisPeriodLabel}還會扣（${pendingUnits} 堂）`}
       icon={HandCoins}
       defaultOpen={false}
      >
       <ScheduleLines
        lines={detail?.thisPeriodPending ?? []}
        emptyText={`${thisPeriodLabel}沒有還會扣的排程。`}
       />
       {nondeductUnits > 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">
         另有 {nondeductUnits} 堂已點名但不扣（事假／病假）。
        </p>
       ) : null}
      </DetailSection>

      <DetailSection
       title={`${nextPeriodLabel}會扣（${nextUnits} 堂）`}
       icon={CalendarDays}
       defaultOpen={false}
      >
       <ScheduleLines
        lines={detail?.nextPeriod ?? []}
        emptyText={`${nextPeriodLabel}沒有會扣的排程。`}
       />
      </DetailSection>
     </>
    ) : null}
   </div>

   <div className="sticky bottom-0 z-[1] space-y-2 border-t border-border bg-card/95 px-3 py-3 backdrop-blur-sm">
     <Button asChild className="w-full">
      <Link to={`/Payments?studentId=${encodeURIComponent(row.studentId)}`}>
       收款登記
       <ArrowUpRight />
      </Link>
     </Button>
     <Button asChild variant="outline" className="w-full">
      <Link to={detailHref} state={studentDetailLinkState(location)}>
       開完整詳情
      </Link>
     </Button>
    </div>
  </div>
 )
}
