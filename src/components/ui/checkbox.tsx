import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

type CheckboxProps = {
 checked: boolean
 onCheckedChange: (next: boolean) => void
 indeterminate?: boolean
 disabled?: boolean
 "aria-label"?: string
 className?: string
}

export function Checkbox({
 checked,
 onCheckedChange,
 indeterminate = false,
 disabled,
 "aria-label": ariaLabel,
 className,
}: CheckboxProps) {
 return (
  <button
   type="button"
   role="checkbox"
   aria-checked={indeterminate ? "mixed" : checked}
   aria-label={ariaLabel}
   disabled={disabled}
   onClick={(e) => {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) return
    onCheckedChange(indeterminate ? true : !checked)
   }}
   className={cn(
    "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-input bg-background shadow-sm transition-colors",
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
    "disabled:cursor-not-allowed disabled:opacity-50",
    (checked || indeterminate) && "border-primary bg-primary text-primary-foreground",
    className
   )}
  >
   {checked || indeterminate ? <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden /> : null}
  </button>
 )
}
