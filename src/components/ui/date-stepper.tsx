import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { addDaysYmd, isYmd } from "@/lib/weekdayUtils"
import { cn } from "@/lib/utils"

type DateStepperProps = {
 value: string
 onChange: (ymd: string) => void
 disabled?: boolean
 id?: string
 name?: string
 required?: boolean
 className?: string
 inputClassName?: string
 "aria-label"?: string
}

/** 單日選擇：左右箭嘴換日前／後一日，中間為共用 DateInput。 */
export function DateStepper({
 value,
 onChange,
 disabled,
 id,
 name,
 required,
 className,
 inputClassName,
 "aria-label": ariaLabel = "日期",
}: DateStepperProps) {
 const canShift = !disabled && isYmd(value)

 const shift = (delta: number) => {
  if (!isYmd(value)) return
  onChange(addDaysYmd(value, delta))
 }

 return (
  <div className={cn("flex items-center gap-2", className)}>
   <Button
    type="button"
    variant="outline"
    size="icon"
    className="h-10 w-10 shrink-0"
    aria-label="前一日"
    disabled={!canShift}
    onClick={() => shift(-1)}
   >
    <ChevronLeft className="h-5 w-5" aria-hidden />
   </Button>
   <Input
    type="date"
    id={id}
    name={name}
    required={required}
    disabled={disabled}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    aria-label={ariaLabel}
    className={cn("h-10 w-[12rem] cursor-pointer text-sm", inputClassName)}
   />
   <Button
    type="button"
    variant="outline"
    size="icon"
    className="h-10 w-10 shrink-0"
    aria-label="後一日"
    disabled={!canShift}
    onClick={() => shift(1)}
   >
    <ChevronRight className="h-5 w-5" aria-hidden />
   </Button>
  </div>
 )
}
