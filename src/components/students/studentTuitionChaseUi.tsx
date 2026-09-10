import type { ReactNode, Ref } from "react"
import { Link } from "react-router-dom"

import { money } from "@/components/payments/paymentsUi"
import { TuitionChaseStatusTag } from "@/components/payments/tuitionChaseDueUi"
import { StaggerItem, StaggerList } from "@/components/ui/stagger-list"
import { Tag } from "@/components/ui/tag"
import { HintTooltip } from "@/components/ui/tooltip"
import { statusToTagTone } from "@/lib/statusTag"
import { formatTuitionChaseSubjectSubtotals } from "@/lib/tuitionChaseDetail"
import { tuitionChaseQueueStatus } from "@/lib/tuitionChaseDue"
import {
 formatTuitionChaseDueLessons,
 formatTuitionChaseRemainingAfterThisPeriod,
 formatTuitionChaseScheduleDate,
 formatTuitionChaseTimeRange,
 formatTuitionChaseUnpaidLessons,
 TUITION_CHASE_REMAINING_HINT,
 tuitionChaseBalanceWhy,
 tuitionChaseSuggestedOnceCaption,
} from "@/lib/tuitionChaseLabels"
import { cn } from "@/lib/utils"
import type {
 TuitionChasePaymentLine,
 TuitionChasePoolDetail,
 TuitionChasePoolRow,
 TuitionChaseScheduleLine,
} from "@/services/tuitionChaseQueries"

function DlRow({
 label,
 hint,
 children,
}: {
 label: string
 hint?: string
 children: ReactNode
}) {
 return (
  <div className="flex items-baseline justify-between gap-3">
   <dt className="text-muted-foreground">
    {hint ? (
     <HintTooltip hint={hint}>
      <span className="cursor-help underline decoration-dotted underline-offset-2">{label}</span>
     </HintTooltip>
    ) : (
     label
    )}
   </dt>
   <dd className="text-right text-foreground">{children}</dd>
  </div>
 )
}

function DueValue({
 lessons,
 emphasize,
}: {
 lessons: number
 emphasize?: "warning" | "info"
}) {
 const due = lessons > 0
 return (
  <span
   className={cn(
    "tabular-nums font-medium",
    due && emphasize === "warning" && "text-warning",
    due && emphasize === "info" && "text-info",
    !due && "text-muted-foreground"
   )}
  >
   {formatTuitionChaseDueLessons(lessons)}
  </span>
 )
}

function RemainingValue({
 remainingLessons,
 remainingKnown,
}: {
 remainingLessons: number
 remainingKnown: boolean
}) {
 if (!remainingKnown) {
  return <span className="text-muted-foreground">未有結餘資料</span>
 }
 const unpaid = formatTuitionChaseUnpaidLessons(remainingLessons)
 return (
  <div
   className={cn(
    remainingLessons < 0 ? "rounded-md bg-destructive/10 px-1.5 py-0.5" : null
   )}
  >
   <div
    className={cn(
     "tabular-nums font-medium",
     remainingLessons < 0 ? "text-destructive" : "text-foreground"
    )}
   >
    {remainingLessons} 堂
   </div>
   {unpaid ? <p className="text-[11px] text-destructive">{unpaid}</p> : null}
  </div>
 )
}

function sumLineUnits(lines: readonly { units: number }[]): number {
 return lines.reduce((n, l) => n + l.units, 0)
}

export function TuitionChaseDueSummaryCard({
 pool,
 thisPeriodLabel,
 nextPeriodLabel,
 pendingUnits,
 nextUnits,
 deductedUnits,
 nondeductUnits,
}: {
 pool: TuitionChasePoolRow
 thisPeriodLabel: string
 nextPeriodLabel: string
 pendingUnits: number
 nextUnits: number
 deductedUnits?: number
 nondeductUnits?: number
}) {
 const whyText = tuitionChaseBalanceWhy({
  thisPeriodLabel,
  nextPeriodLabel,
  remainingLessons: pool.remainingLessons,
  thisPeriodPendingUnits: pendingUnits,
  thisPeriodDueLessons: pool.thisPeriodDueLessons,
  remainingAfterThisPeriod: pool.remainingAfterThisPeriod,
  nextPeriodUnits: nextUnits,
  nextPeriodDueLessons: pool.nextPeriodDueLessons,
  remainingKnown: pool.remainingKnown,
  thisPeriodDeductedUnits: deductedUnits ?? pool.thisPeriodDeductedUnits,
  thisPeriodNondeductUnits: nondeductUnits ?? pool.thisPeriodNondeductUnits,
 })
 return (
  <div className="rounded-xl border border-border bg-card p-4">
   <dl className="space-y-2 text-sm">
    <DlRow label={`${thisPeriodLabel}要交`}>
     <DueValue lessons={pool.thisPeriodDueLessons} emphasize="warning" />
    </DlRow>
    <DlRow label={`${nextPeriodLabel}要交`}>
     <DueValue lessons={pool.nextPeriodDueLessons} emphasize="info" />
    </DlRow>
    <DlRow label="尚餘可扣堂數" hint={TUITION_CHASE_REMAINING_HINT}>
     <RemainingValue
      remainingLessons={pool.remainingLessons}
      remainingKnown={pool.remainingKnown}
     />
    </DlRow>
   </dl>
   <p className="mt-3 text-sm leading-relaxed text-foreground">{whyText}</p>
   <p className="mt-1 text-xs text-muted-foreground">
    {tuitionChaseSuggestedOnceCaption(pool.suggestedLessons)}
   </p>
  </div>
 )
}

export function TuitionChaseInventoryCard({
 pool,
 thisPeriodLabel,
 nextPeriodLabel,
 deductedUnits,
 pendingUnits,
 nextUnits,
 paidLessonTotal,
 pendingSubtotals,
 nextSubtotals,
}: {
 pool: TuitionChasePoolRow
 thisPeriodLabel: string
 nextPeriodLabel: string
 deductedUnits: number | null
 pendingUnits: number
 nextUnits: number
 paidLessonTotal: number | null
 pendingSubtotals: string
 nextSubtotals: string
}) {
 const after = formatTuitionChaseRemainingAfterThisPeriod(
  pool.remainingAfterThisPeriod,
  pool.remainingKnown
 )
 return (
  <div className="rounded-xl border border-border bg-card p-4">
   <dl className="space-y-2 text-sm">
    <DlRow label={`${thisPeriodLabel}已扣`} hint="本期已點名且計費的堂。">
     <span className="tabular-nums font-medium">
      {deductedUnits == null ? "…" : `${deductedUnits} 堂`}
     </span>
    </DlRow>
    <DlRow label={`${thisPeriodLabel}還會扣`} hint="本期尚未點名、仍會扣的排程。">
     <span className="tabular-nums font-medium">{pendingUnits} 堂</span>
    </DlRow>
    <DlRow label={`${nextPeriodLabel}會扣`} hint="下期未取消排程單位（尚未扣）。">
     <span className="tabular-nums font-medium">{nextUnits} 堂</span>
    </DlRow>
    <DlRow
     label="已收款堂數"
     hint="此組別已收款學費行堂數加總（含已扣），與尚餘不同。優惠／罰款不計。"
    >
     <span className="tabular-nums font-medium">
      {paidLessonTotal == null ? "…" : `${paidLessonTotal} 堂`}
     </span>
    </DlRow>
    <DlRow label="扣完本期後尚餘" hint="尚餘減本期還會扣。下期要交由此數對下期會扣計算。">
     <span
      className={cn(
       "tabular-nums font-medium",
       pool.remainingKnown && pool.remainingAfterThisPeriod < 0 && "text-destructive"
      )}
     >
      {after}
     </span>
    </DlRow>
   </dl>
   {pendingSubtotals || nextSubtotals ? (
    <p className="mt-3 text-xs text-muted-foreground">
     {pendingSubtotals ? `還會扣 ${pendingSubtotals}` : ""}
     {pendingSubtotals && nextSubtotals ? " · " : ""}
     {nextSubtotals ? `會扣 ${nextSubtotals}` : ""}
    </p>
   ) : null}
  </div>
 )
}

export function TuitionChasePaymentCards({
 studentId,
 payments,
}: {
 studentId: string
 payments: TuitionChasePaymentLine[] | null
}) {
 const paidLessonTotal = payments ? payments.reduce((n, p) => n + p.lessonCount, 0) : null
 return (
  <div className="space-y-3">
   <div className="flex flex-wrap items-baseline justify-between gap-2">
    <p className="text-sm font-medium">
     {payments
      ? `已收款（${payments.length} 筆 · ${paidLessonTotal} 堂）`
      : "已收款"}
    </p>
    <Link
     to={`/PaymentHistory?studentId=${encodeURIComponent(studentId)}`}
     className="text-sm font-medium text-primary hover:underline"
    >
     繳費紀錄
    </Link>
   </div>
   {payments == null ? (
    <p className="text-sm text-muted-foreground">載入學費明細…</p>
   ) : payments.length === 0 ? (
    <p className="text-sm text-muted-foreground">沒有此組別的已收款學費明細。</p>
   ) : (
    <StaggerList as="div" className="space-y-3">
     {payments.map((p, i) => (
      <StaggerItem
       key={`${p.paymentId}-${p.classLabel}-${i}`}
       as="div"
       className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
      >
       <div>
        {p.amount != null ? (
         <div className="text-lg font-bold tabular-nums">{money(p.amount)}</div>
        ) : null}
        <div className="text-sm text-muted-foreground">
         {p.paymentDate || "—"}
         {p.receiptNumber ? ` · ${p.receiptNumber}` : ""}
        </div>
        <div className="text-xs text-muted-foreground">
         {p.classLabel}
         {p.lessonCount > 0 ? ` · ${p.lessonCount} 堂` : ""}
         {p.description ? ` · ${p.description}` : ""}
        </div>
       </div>
      </StaggerItem>
     ))}
    </StaggerList>
   )}
  </div>
 )
}

export function TuitionChaseScheduleTable({
 title,
 lines,
 emptyText,
 showStatus,
}: {
 title: string
 lines: TuitionChaseScheduleLine[] | null
 emptyText: string
 showStatus?: boolean
}) {
 const cols = showStatus
  ? "sm:grid-cols-[auto_auto_minmax(0,1fr)_auto_auto]"
  : "sm:grid-cols-[auto_auto_minmax(0,1fr)_auto]"
 return (
  <div className="space-y-2">
   <p className="text-sm font-medium">{title}</p>
   {lines == null ? (
    <p className="text-sm text-muted-foreground">載入學費明細…</p>
   ) : lines.length === 0 ? (
    <p className="text-sm text-muted-foreground">{emptyText}</p>
   ) : (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
     <div
      className={cn(
       "hidden gap-x-3 border-b border-border bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground sm:grid",
       cols
      )}
     >
      <span>日期</span>
      <span>時間</span>
      <span>班別</span>
      <span className="text-right">堂數</span>
      {showStatus ? <span className="text-right">狀態</span> : null}
     </div>
     <StaggerList as="ul" className="divide-y divide-border">
      {lines.map((line) => {
       const time = formatTuitionChaseTimeRange(line.startTime, line.endTime)
       return (
        <StaggerItem
         key={line.scheduleId}
         as="li"
         className={cn(
          "grid items-center gap-x-3 gap-y-1 px-4 py-3 text-sm grid-cols-[minmax(0,1fr)_auto]",
          cols
         )}
        >
         <span className="tabular-nums">{formatTuitionChaseScheduleDate(line.scheduledDate)}</span>
         <span className="tabular-nums text-muted-foreground">{time || "—"}</span>
         <span className="min-w-0 truncate font-medium">
          {line.classId ? (
           <Link to={`/Classes/${line.classId}`} className="text-primary hover:underline">
            {line.classLabel}
           </Link>
          ) : (
           line.classLabel
          )}
         </span>
         <span className="text-right tabular-nums text-muted-foreground">{line.units} 堂</span>
         {showStatus ? (
          <span className="col-span-2 text-right sm:col-span-1">
           {line.attendanceStatus ? (
            <Tag tone={statusToTagTone(line.attendanceStatus)} size="sm">
             {line.attendanceStatus}
            </Tag>
           ) : (
            "—"
           )}
          </span>
         ) : null}
        </StaggerItem>
       )
      })}
     </StaggerList>
    </div>
   )}
  </div>
 )
}

export function TuitionChasePoolSection({
 pool,
 detail,
 thisPeriodLabel,
 nextPeriodLabel,
 studentId,
 highlighted,
 sectionRef,
}: {
 pool: TuitionChasePoolRow
 detail: TuitionChasePoolDetail | null
 thisPeriodLabel: string
 nextPeriodLabel: string
 studentId: string
 highlighted: boolean
 sectionRef?: Ref<HTMLElement>
}) {
 const pendingUnits = detail ? sumLineUnits(detail.thisPeriodPending) : pool.thisPeriodPendingUnits
 const deductedUnits = detail ? sumLineUnits(detail.deducted) : pool.thisPeriodDeductedUnits
 const nextUnits = detail ? sumLineUnits(detail.nextPeriod) : pool.nextPeriodUnits
 const paidLessonTotal = detail ? detail.payments.reduce((n, p) => n + p.lessonCount, 0) : null
 const pendingSubtotals = detail ? formatTuitionChaseSubjectSubtotals(detail.thisPeriodPending) : ""
 const nextSubtotals = detail ? formatTuitionChaseSubjectSubtotals(detail.nextPeriod) : ""
 const poolStatus = tuitionChaseQueueStatus(
  {
   thisPeriodDueLessons: pool.thisPeriodDueLessons,
   nextPeriodDueLessons: pool.nextPeriodDueLessons,
  },
  pool.remainingKnown
 )
 const nondeductUnits = detail ? sumLineUnits(detail.thisPeriodNondeduct) : pool.thisPeriodNondeductUnits

 return (
  <section
   ref={sectionRef}
   className={cn(
    "space-y-4",
    highlighted && "rounded-xl border border-primary/40 bg-card p-4 shadow-sm ring-1 ring-primary/20"
   )}
  >
   <div className="flex flex-wrap items-center gap-2">
    <h3 className="text-sm font-semibold">{pool.label}</h3>
    <TuitionChaseStatusTag status={poolStatus} />
   </div>
   <TuitionChaseDueSummaryCard
    pool={pool}
    thisPeriodLabel={thisPeriodLabel}
    nextPeriodLabel={nextPeriodLabel}
    pendingUnits={pendingUnits}
    nextUnits={nextUnits}
    deductedUnits={deductedUnits}
    nondeductUnits={nondeductUnits}
   />
   <TuitionChaseInventoryCard
    pool={pool}
    thisPeriodLabel={thisPeriodLabel}
    nextPeriodLabel={nextPeriodLabel}
    deductedUnits={deductedUnits}
    pendingUnits={pendingUnits}
    nextUnits={nextUnits}
    paidLessonTotal={paidLessonTotal}
    pendingSubtotals={pendingSubtotals}
    nextSubtotals={nextSubtotals}
   />
   <TuitionChasePaymentCards studentId={studentId} payments={detail?.payments ?? null} />
   <TuitionChaseScheduleTable
    title={`${thisPeriodLabel}已扣${deductedUnits != null ? `（${deductedUnits} 堂）` : ""}`}
    lines={detail?.deducted ?? null}
    emptyText={`${thisPeriodLabel}尚未扣堂。`}
    showStatus
   />
   <div className="space-y-2">
    <TuitionChaseScheduleTable
     title={`${thisPeriodLabel}還會扣（${pendingUnits} 堂）`}
     lines={detail?.thisPeriodPending ?? null}
     emptyText={`${thisPeriodLabel}沒有還會扣的排程。`}
    />
    {detail && nondeductUnits > 0 ? (
     <p className="text-xs text-muted-foreground">
      另有 {nondeductUnits} 堂已點名但不扣（事假／病假）。
     </p>
    ) : null}
   </div>
   <TuitionChaseScheduleTable
    title={`${nextPeriodLabel}會扣（${nextUnits} 堂）`}
    lines={detail?.nextPeriod ?? null}
    emptyText={`${nextPeriodLabel}沒有會扣的排程。`}
   />
  </section>
 )
}
