import * as React from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type LoadMoreFooterProps = {
 sentinelRef?: React.Ref<HTMLDivElement>
 hasMore: boolean
 loadingMore: boolean
 totalShown: number
 onManualLoad?: () => void
 className?: string
}

export const LoadMoreFooter = React.forwardRef<HTMLDivElement, LoadMoreFooterProps>(
 ({ sentinelRef, hasMore, loadingMore, totalShown, onManualLoad, className }, ref) => {
  return (
   <div ref={ref} className={cn("space-y-3", className)}>
    {loadingMore ? (
     <div
      className="flex flex-col items-center justify-center gap-2 py-8"
      role="status"
      aria-live="polite"
      aria-busy="true"
     >
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
      <span className="sr-only">載入更多…</span>
     </div>
    ) : (
     <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground" role="status">
       {hasMore ? `已載入 ${totalShown} 筆` : `已顯示全部 ${totalShown} 筆`}
      </p>
      {hasMore && onManualLoad ? (
       <Button type="button" variant="secondary" size="sm" onClick={() => void onManualLoad()}>
        載入更多
       </Button>
      ) : null}
     </div>
    )}
    {hasMore ? <div ref={sentinelRef} className="h-px w-full" aria-hidden /> : null}
   </div>
  )
 }
)
LoadMoreFooter.displayName = "LoadMoreFooter"

export function InfiniteScrollSentinel({
 sentinelRef,
 className,
}: {
 sentinelRef: React.Ref<HTMLDivElement>
 className?: string
}) {
 return <div ref={sentinelRef} className={cn("h-px w-full", className)} aria-hidden />
}
