import type { ReactNode } from "react"

import { Input } from "@/components/ui/input"
import { ScheduleDateTime, formatStudentNameList } from "@/lib/scheduleDisplay"
import { cn } from "@/lib/utils"

type SessionNumberProps = {
 value: number | null
 editable?: boolean
 saving?: boolean
 onChange?: (value: number) => void
 onSave?: (value: number) => void
}

function SessionNumber({
 value,
 editable,
 saving,
 onChange,
 onSave,
}: SessionNumberProps) {
 if (editable) {
  return (
   <Input
    type="number"
    min={1}
    className="h-9 w-14 shrink-0 border-info/40 text-center text-lg font-bold tabular-nums text-info"
    value={value ?? ""}
    disabled={saving}
    onChange={(e) => {
     const n = parseInt(e.target.value, 10)
     if (!Number.isNaN(n) && n >= 1) onChange?.(n)
    }}
    onBlur={(e) => {
     const n = parseInt(e.target.value, 10)
     if (!Number.isNaN(n) && n >= 1 && n !== value) onSave?.(n)
    }}
    onKeyDown={(e) => {
     if (e.key === "Enter") (e.target as HTMLInputElement).blur()
    }}
    aria-label="堂次"
   />
  )
 }

 if (value == null) return null

 return (
  <span
   className="shrink-0 text-lg font-bold tabular-nums text-info"
   aria-label={`第 ${value} 堂`}
  >
   {value}
  </span>
 )
}

export type ScheduleListCardProps = {
 sessionNumber: number | null
 scheduledDate: string
 startTime: string | null
 endTime: string | null
 attendingNames?: string[]
 leaveNames?: string[]
 /** 學生名單尚在載入：顯示占位，勿當成無人 */
 namesLoading?: boolean
 title?: ReactNode
 subtitle?: ReactNode
 controls?: ReactNode
 editableSessionNumber?: boolean
 savingSessionNumber?: boolean
 onSessionNumberChange?: (value: number) => void
 onSessionNumberSave?: (value: number) => void
 className?: string
}

export function ScheduleListCard({
 sessionNumber,
 scheduledDate,
 startTime,
 endTime,
 attendingNames = [],
 leaveNames = [],
 namesLoading = false,
 title,
 subtitle,
 controls,
 editableSessionNumber,
 savingSessionNumber,
 onSessionNumberChange,
 onSessionNumberSave,
 className,
}: ScheduleListCardProps) {
 return (
  <div
   className={cn(
    "flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/30",
    className
   )}
  >
   <div className="min-w-0 flex-1 space-y-1">
    {subtitle ? <div className="text-sm text-muted-foreground">{subtitle}</div> : null}
    <div className="flex flex-wrap items-center gap-3">
     <SessionNumber
      value={sessionNumber}
      editable={editableSessionNumber}
      saving={savingSessionNumber}
      onChange={onSessionNumberChange}
      onSave={onSessionNumberSave}
     />
     <div className="min-w-0 font-medium text-primary">
      {title ?? (
       <ScheduleDateTime
        date={scheduledDate}
        startTime={startTime}
        endTime={endTime}
       />
      )}
     </div>
    </div>
    {namesLoading ? (
     <p className="text-xs text-muted-foreground">學生名單更新中…</p>
    ) : (
     <>
      {attendingNames.length > 0 ? (
       <p className="text-xs text-muted-foreground">
        {formatStudentNameList(attendingNames)}
       </p>
      ) : null}
      {leaveNames.length > 0 ? (
       <p className="text-xs text-destructive">{formatStudentNameList(leaveNames)}</p>
      ) : null}
     </>
    )}
   </div>
   {controls ? (
    <div className="flex shrink-0 items-center gap-2">{controls}</div>
   ) : null}
  </div>
 )
}
