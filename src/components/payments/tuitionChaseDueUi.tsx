import { HintTooltip } from "@/components/ui/tooltip"
import { Tag } from "@/components/ui/tag"
import {
 formatTuitionChaseDueLessons,
 formatTuitionChaseUnpaidLessons,
 TUITION_CHASE_REMAINING_HINT,
 tuitionChaseQueueStatusLabel,
} from "@/lib/tuitionChaseLabels"
import { statusToTagTone } from "@/lib/statusTag"
import type { TuitionChaseQueueStatus } from "@/lib/tuitionChaseDue"
import { cn } from "@/lib/utils"

export function TuitionChaseStatusTag({ status }: { status: TuitionChaseQueueStatus }) {
 const label = tuitionChaseQueueStatusLabel(status)
 return (
  <Tag tone={statusToTagTone(label)} size="sm">
   {label}
  </Tag>
 )
}

export function TuitionChaseDueNumber(props: {
 label: string
 lessons: number
 /** 本期欠＝warning；下期欠＝info */
 emphasize?: "warning" | "info"
}) {
 const due = props.lessons > 0
 return (
  <div>
   <div className="text-[11px] text-muted-foreground">{props.label}</div>
   <div
    className={cn(
     "text-base font-semibold tabular-nums leading-tight",
     due && props.emphasize === "warning" && "text-warning",
     due && props.emphasize === "info" && "text-info",
     !due && "text-muted-foreground"
    )}
   >
    {formatTuitionChaseDueLessons(props.lessons)}
   </div>
  </div>
 )
}

/** 名單表格用：只要交數字；不用收時可附短因。 */
export function TuitionChaseDueCell(props: {
 lessons: number
 emphasize?: "warning" | "info"
 reason?: string | null
}) {
 const due = props.lessons > 0
 return (
  <span
   className={cn(
    "inline-flex flex-col items-end",
    due && props.emphasize === "warning" && "text-warning",
    due && props.emphasize === "info" && "text-info",
    !due && "text-muted-foreground"
   )}
  >
   <span className="tabular-nums font-medium">{formatTuitionChaseDueLessons(props.lessons)}</span>
   {props.reason ? <span className="mt-0.5 text-[11px] font-normal leading-snug">{props.reason}</span> : null}
  </span>
 )
}

/** 名單表格用：尚餘可扣堂數；負數淡紅並用人話。 */
export function TuitionChaseRemainingCell(props: {
 remainingLessons: number
 remainingKnown: boolean
}) {
 if (!props.remainingKnown) {
  return <span className="text-muted-foreground">未有結餘資料</span>
 }
 const unpaid = formatTuitionChaseUnpaidLessons(props.remainingLessons)
 return (
  <div
   className={cn(
    props.remainingLessons < 0
     ? "-mx-1 rounded-md bg-destructive/10 px-1.5 py-0.5"
     : null
   )}
  >
   <div
    className={cn(
     "tabular-nums font-medium",
     props.remainingLessons < 0 ? "text-destructive" : "text-foreground"
    )}
   >
    {props.remainingLessons} 堂
   </div>
   {unpaid ? <p className="text-[11px] text-destructive">{unpaid}</p> : null}
  </div>
 )
}

/** 前台主問題：本期要不要收、下期要不要收；可附尚餘可扣堂數。 */
export function TuitionChaseDuePair(props: {
 thisPeriodLabel: string
 nextPeriodLabel: string
 thisPeriodDueLessons: number
 nextPeriodDueLessons: number
 remainingLessons?: number
 remainingKnown?: boolean
 className?: string
}) {
 const remainingKnown = props.remainingKnown !== false
 const unpaid =
  remainingKnown && props.remainingLessons != null
   ? formatTuitionChaseUnpaidLessons(props.remainingLessons)
   : null
 return (
  <div className={cn("flex flex-wrap gap-x-6 gap-y-1", props.className)}>
   <TuitionChaseDueNumber
    label={`${props.thisPeriodLabel}要交`}
    lessons={props.thisPeriodDueLessons}
    emphasize="warning"
   />
   <TuitionChaseDueNumber
    label={`${props.nextPeriodLabel}要交`}
    lessons={props.nextPeriodDueLessons}
    emphasize="info"
   />
   {props.remainingLessons != null || props.remainingKnown === false ? (
    <div>
     <HintTooltip hint={TUITION_CHASE_REMAINING_HINT}>
      <div className="cursor-help text-[11px] text-muted-foreground underline decoration-dotted underline-offset-2">
       尚餘可扣堂數
      </div>
     </HintTooltip>
     {remainingKnown ? (
      <div
       className={cn(
        props.remainingLessons != null && props.remainingLessons < 0
         ? "-mx-1 rounded-md bg-destructive/10 px-1.5 py-0.5"
         : null
       )}
      >
       <div
        className={cn(
         "text-base font-semibold tabular-nums leading-tight",
         props.remainingLessons != null && props.remainingLessons < 0
          ? "text-destructive"
          : "text-foreground"
        )}
       >
        {props.remainingLessons} 堂
       </div>
       {unpaid ? <p className="text-[11px] text-destructive">{unpaid}</p> : null}
      </div>
     ) : (
      <div className="text-base font-semibold leading-tight text-muted-foreground">未有結餘資料</div>
     )}
    </div>
   ) : null}
  </div>
 )
}
