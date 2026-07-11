import { useEffect, type ReactNode } from "react"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tag } from "@/components/ui/tag"
import { cn } from "@/lib/utils"

type MobileFilterSheetProps = {
 open: boolean
 onClose: () => void
 title: string
 activeCount?: number
 children: ReactNode
 onReset?: () => void
}

export function MobileFilterSheet({
 open,
 onClose,
 title,
 activeCount = 0,
 children,
 onReset,
}: MobileFilterSheetProps) {
 useEffect(() => {
  if (!open) return
  const onKey = (e: KeyboardEvent) => {
   if (e.key === "Escape") onClose()
  }
  window.addEventListener("keydown", onKey)
  return () => window.removeEventListener("keydown", onKey)
 }, [open, onClose])

 useEffect(() => {
  if (!open) return
  const prev = document.body.style.overflow
  document.body.style.overflow = "hidden"
  return () => {
   document.body.style.overflow = prev
  }
 }, [open])

 if (!open) return null

 return (
  <div className="fixed inset-0 z-[270] md:hidden" role="dialog" aria-modal="true" aria-label={title}>
   <button type="button" className="absolute inset-0 bg-black/50" aria-label="關閉篩選" onClick={onClose} />
   <div
    className={cn(
     "absolute inset-x-0 bottom-0 flex max-h-[min(88vh,40rem)] flex-col overflow-hidden rounded-t-2xl",
     "border border-border bg-background shadow-2xl animate-in slide-in-from-bottom duration-200"
    )}
   >
    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 pb-3 pt-4">
     <div className="flex min-w-0 items-center gap-2">
      <h2 className="truncate text-base font-semibold">{title}</h2>
      {activeCount > 0 ? (
       <Tag tone="info" size="sm">
        {activeCount} 項
       </Tag>
      ) : null}
     </div>
     <div className="flex shrink-0 items-center gap-1">
      {onReset ? (
       <Button type="button" variant="ghost" size="sm" onClick={onReset}>
        重設
       </Button>
      ) : null}
      <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={onClose} aria-label="關閉篩選">
       <X className="h-4 w-4" />
      </Button>
     </div>
    </div>
    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
     {children}
    </div>
    <div className="shrink-0 border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
     <Button type="button" className="w-full" onClick={onClose}>
      套用篩選
     </Button>
    </div>
   </div>
  </div>
 )
}
