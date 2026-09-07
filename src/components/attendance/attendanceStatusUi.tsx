import { Tooltip } from "@/components/ui/tooltip"
import {
 ATTENDANCE_STATUS_HELP,
 BILLABLE_ATTENDANCE_OPTIONS,
 NON_BILLABLE_ATTENDANCE_OPTIONS,
 type AttendanceStatusLabel,
} from "@/lib/attendanceBilling"
import { cn } from "@/lib/utils"

export function attendanceStatusActiveClass(status: AttendanceStatusLabel): string {
 switch (status) {
  case "現場":
   return "border-success bg-success text-white shadow-sm ring-2 ring-success/30"
  case "錄影回放":
   return "border-info bg-info text-info-foreground shadow-sm ring-2 ring-info/30"
  case "zoom實時網課":
   return "border-neutral-700 bg-neutral-700 text-white shadow-sm ring-2 ring-neutral-700/30"
  case "no show":
   return "border-destructive bg-destructive text-white shadow-sm ring-2 ring-destructive/30"
  case "請假而不需補回":
   return "border-warning bg-warning text-warning-foreground shadow-sm ring-2 ring-warning/40"
  case "事假":
   return "border-warning/80 bg-warning/25 text-warning shadow-sm ring-2 ring-warning/25"
  case "病假":
   return "border-warning bg-warning/40 text-warning shadow-sm ring-2 ring-warning/30"
 }
}

export function AttendanceStatusOptionButton({
 status,
 active,
 disabled,
 onSelect,
 compact,
}: {
 status: AttendanceStatusLabel
 active: boolean
 disabled?: boolean
 onSelect: () => void
 compact?: boolean
}) {
 const button = (
  <button
   type="button"
   disabled={disabled}
   onClick={onSelect}
   className={cn(
    "rounded-lg border font-medium transition-all duration-150 active:scale-[0.97] disabled:opacity-50",
    compact ? "px-2 py-1 text-xs" : "min-h-11 px-3 py-2 text-sm",
    active
     ? attendanceStatusActiveClass(status)
     : "border-border bg-background text-muted-foreground hover:bg-muted/60"
   )}
  >
   {status}
  </button>
 )

 return (
  <Tooltip delay={200}>
   {disabled ? <span className="inline-flex">{button}</span> : button}
   <Tooltip.Content className="max-w-xs text-left leading-relaxed" placement="bottom">
    <p className="mb-0.5 font-semibold">{status}</p>
    <p>{ATTENDANCE_STATUS_HELP[status]}</p>
   </Tooltip.Content>
  </Tooltip>
 )
}

export function AttendanceStatusPicker({
 value,
 disabled,
 onSelect,
 compact,
}: {
 value: string | undefined
 disabled?: boolean
 onSelect: (status: AttendanceStatusLabel) => void
 compact?: boolean
}) {
 return (
  <div className="space-y-2">
   <div>
    <p className="mb-1 text-xs font-medium text-muted-foreground">會扣堂</p>
    <div className={cn("flex flex-wrap gap-1.5", compact ? "gap-1" : "gap-1.5")}>
     {BILLABLE_ATTENDANCE_OPTIONS.map((opt) => (
      <AttendanceStatusOptionButton
       key={opt}
       status={opt}
       active={value === opt}
       disabled={disabled}
       compact={compact}
       onSelect={() => onSelect(opt)}
      />
     ))}
    </div>
   </div>
   <div>
    <p className="mb-1 text-xs font-medium text-muted-foreground">不扣堂</p>
    <div className={cn("flex flex-wrap gap-1.5", compact ? "gap-1" : "gap-1.5")}>
     {NON_BILLABLE_ATTENDANCE_OPTIONS.map((opt) => (
      <AttendanceStatusOptionButton
       key={opt}
       status={opt}
       active={value === opt}
       disabled={disabled}
       compact={compact}
       onSelect={() => onSelect(opt)}
      />
     ))}
    </div>
   </div>
  </div>
 )
}
