import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"

import type { SortDir } from "@/components/list/listFilterUtils"
import { cn } from "@/lib/utils"

type Props = {
 label: string
 active: boolean
 dir: SortDir
 onToggle: () => void
 className?: string
 children?: React.ReactNode
}

/** 表頭：欄名 + 排序箭嘴；可把 HeaderFilterButton 放在 children */
export function SortableColumnHeader({ label, active, dir, onToggle, className, children }: Props) {
 return (
  <div className={cn("flex min-w-0 items-center gap-0.5", className)}>
   <button
    type="button"
    className="inline-flex min-w-0 items-center gap-1 hover:text-foreground"
    onClick={onToggle}
   >
    <span className="truncate">{label}</span>
    {active ? (
     dir === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 shrink-0" aria-hidden />
     ) : (
      <ArrowDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
     )
    ) : (
     <ArrowUpDown className="h-3.5 w-3.5 shrink-0 opacity-40" aria-hidden />
    )}
   </button>
   {children}
  </div>
 )
}
