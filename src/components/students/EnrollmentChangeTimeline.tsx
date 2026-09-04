import { Tag } from "@/components/ui/tag"
import { statusToTagTone } from "@/lib/statusTag"
import type { StudentEnrollmentChangeLine } from "@/lib/transferClassTime"

function actionLabel(action: string): string {
 if (action === "enroll") return "報讀"
 if (action === "withdraw") return "退讀"
 if (action === "period_change") return "期數變更"
 if (action === "session_change") return "選堂變更"
 return action
}

type Props = {
 lines: StudentEnrollmentChangeLine[]
 loading?: boolean
}

export function EnrollmentChangeTimeline({ lines, loading }: Props) {
 if (loading) {
  return <p className="text-sm text-muted-foreground">載入報讀變更中…</p>
 }
 if (lines.length === 0) return null
 return (
  <div className="space-y-2 rounded-xl border border-border bg-card p-4 shadow-sm">
   <p className="text-sm font-medium">報讀變更</p>
   <ul className="space-y-2 text-sm">
    {lines.map((line) => (
     <li key={line.id} className="rounded-md border border-border/70 px-3 py-2">
      {line.kind === "transfer" ? (
       <p>
        自 <span className="tabular-nums">{line.effectiveDate}</span> 由 {line.fromSlot} 轉為{" "}
        {line.toSlot}
       </p>
      ) : (
       <div className="flex flex-wrap items-center gap-2">
        <Tag tone={statusToTagTone(actionLabel(line.action))} size="sm">
         {actionLabel(line.action)}
        </Tag>
        <span className="tabular-nums text-muted-foreground">{line.effectiveDate}</span>
        <span>{line.slot}</span>
       </div>
      )}
      {line.reason ? (
       <p className="mt-1 text-xs text-muted-foreground">{line.reason}</p>
      ) : null}
     </li>
    ))}
   </ul>
  </div>
 )
}
