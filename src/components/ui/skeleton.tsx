import * as React from "react"

import { cn } from "@/lib/utils"

export type SkeletonVariant = "shimmer" | "pulse"

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
 variant?: SkeletonVariant
}

export function Skeleton({ className, variant = "shimmer", ...props }: SkeletonProps) {
 return (
  <div
   aria-hidden
   className={cn(
    "rounded-md bg-muted/40",
    variant === "shimmer" &&
     "bg-[length:200%_100%] bg-gradient-to-r from-muted/30 via-muted/60 to-muted/30 motion-reduce:animate-pulse motion-safe:animate-skeleton-shimmer",
    variant === "pulse" && "animate-pulse",
    className
   )}
   {...props}
  />
 )
}

export function SkeletonInlineBadge({ className, ...props }: Omit<SkeletonProps, "variant">) {
 return <Skeleton variant="pulse" className={cn("inline-block rounded", className)} {...props} />
}

export function SkeletonStatGrid({
 count = 4,
 className,
}: {
 count?: number
 className?: string
}) {
 return (
  <div
   className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}
   aria-busy="true"
   aria-label="載入中"
  >
   {Array.from({ length: count }, (_, i) => (
    <div key={i} className="space-y-3 rounded-xl border border-border bg-card p-4">
     <Skeleton className="h-4 w-24" />
     <Skeleton className="h-8 w-16" />
    </div>
   ))}
  </div>
 )
}

export function SkeletonCardGrid({
 count = 6,
 className,
}: {
 count?: number
 className?: string
}) {
 return (
  <div
   className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}
   aria-busy="true"
   aria-label="載入中"
  >
   {Array.from({ length: count }, (_, i) => (
    <div key={i} className="space-y-3 rounded-xl border border-border bg-card p-4">
     <Skeleton className="h-5 w-3/5" />
     <Skeleton className="h-4 w-2/5" />
     <Skeleton className="h-16 w-full rounded-lg" />
    </div>
   ))}
  </div>
 )
}

export function SkeletonTableRows({
 rows = 8,
 columns = 5,
 className,
}: {
 rows?: number
 columns?: number
 className?: string
}) {
 return (
  <div className={cn("space-y-2", className)} aria-busy="true" aria-label="載入中">
   <div className="flex gap-3 border-b border-border pb-2">
    {Array.from({ length: columns }, (_, i) => (
     <Skeleton key={i} className="h-4 flex-1" />
    ))}
   </div>
   {Array.from({ length: rows }, (_, row) => (
    <div key={row} className="flex gap-3 py-2">
     {Array.from({ length: columns }, (_, col) => (
      <Skeleton key={col} className={cn("h-4 flex-1", col === 0 && "max-w-[6rem]")} />
     ))}
    </div>
   ))}
  </div>
 )
}

export function SkeletonTimetableBlock({ className }: { className?: string }) {
 return (
  <div className={cn("space-y-3", className)} aria-busy="true" aria-label="載入中">
   <Skeleton className="h-8 w-64" />
   <Skeleton className="h-64 w-full rounded-xl" />
  </div>
 )
}

export function SkeletonDetailHeader({ className }: { className?: string }) {
 return (
  <div className={cn("space-y-3", className)} aria-busy="true" aria-label="載入中">
   <Skeleton className="h-9 w-48" />
   <div className="flex flex-wrap gap-2">
    <Skeleton className="h-6 w-20 rounded-full" />
    <Skeleton className="h-6 w-24 rounded-full" />
    <Skeleton className="h-6 w-16 rounded-full" />
   </div>
  </div>
 )
}
