import { useEffect, useRef, useState, type ReactNode } from "react"
import { ChevronDown } from "lucide-react"

import { Tag } from "@/components/ui/tag"
import { cn } from "@/lib/utils"

const HOVER_CLOSE_DELAY_MS = 180

type CollapsibleFilterCardProps = {
 children: ReactNode
 /** 收合時標題，預設「篩選項」 */
 label?: string
 /** 已啟用篩選數；大於 0 時顯示徽章 */
 activeCount?: number
 open?: boolean
 defaultOpen?: boolean
 onOpenChange?: (open: boolean) => void
 className?: string
}

export function CollapsibleFilterCard({
 children,
 label = "篩選項",
 activeCount = 0,
 open: controlledOpen,
 defaultOpen = false,
 onOpenChange,
 className,
}: CollapsibleFilterCardProps) {
 const isControlled = controlledOpen !== undefined
 const [pinned, setPinned] = useState(defaultOpen)
 const [hovered, setHovered] = useState(false)
 const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

 const open = isControlled ? controlledOpen : pinned || hovered

 const clearCloseTimer = () => {
  if (closeTimerRef.current != null) {
   clearTimeout(closeTimerRef.current)
   closeTimerRef.current = null
  }
 }

 useEffect(() => () => clearCloseTimer(), [])

 const toggle = () => {
  clearCloseTimer()
  // 已釘住展開 → 收合；否則釘住展開（含僅靠 hover 展開時）
  const next = !(isControlled ? open : pinned)
  setPinned(next)
  if (!next) setHovered(false)
  onOpenChange?.(next)
 }

 const onMouseEnter = () => {
  clearCloseTimer()
  setHovered(true)
  if (isControlled && !open) onOpenChange?.(true)
 }

 const onMouseLeave = () => {
  clearCloseTimer()
  closeTimerRef.current = setTimeout(() => {
   setHovered(false)
   // 未點擊釘住時，移出即收合
   if (isControlled && !pinned) onOpenChange?.(false)
   closeTimerRef.current = null
  }, HOVER_CLOSE_DELAY_MS)
 }

 return (
  <div
   className={cn(
    "rounded-xl border border-border bg-card shadow-sm",
    !open && "group",
    className
   )}
   onMouseEnter={onMouseEnter}
   onMouseLeave={onMouseLeave}
  >
   <div className="flex items-center justify-between gap-3 px-4 py-3">
    <span className="text-sm font-semibold tracking-wide text-foreground">{label}</span>
    <div className="flex items-center gap-2">
     {activeCount > 0 ? (
      <Tag tone="info" size="sm">
       {activeCount}
      </Tag>
     ) : null}
     <button
      type="button"
      onClick={toggle}
      aria-expanded={open}
      aria-label={open ? "收合篩選項" : "展開篩選項"}
      className={cn(
       "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
       open
        ? "hover:bg-muted hover:text-foreground"
        : "group-hover:bg-muted group-hover:text-foreground"
      )}
     >
      <ChevronDown
       className={cn(
        "h-4 w-4 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        open && "rotate-180"
       )}
       aria-hidden
      />
     </button>
    </div>
   </div>

   <div
    className={cn(
     "grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
     open ? "grid-rows-[1fr] opacity-100" : "pointer-events-none grid-rows-[0fr] opacity-0"
    )}
    aria-hidden={!open}
   >
    <div className="min-h-0 overflow-hidden">
     <div
      className={cn(
       "space-y-5 border-t border-border px-4 py-4 transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
       open ? "opacity-100" : "opacity-0"
      )}
     >
      {children}
     </div>
    </div>
   </div>
  </div>
 )
}
