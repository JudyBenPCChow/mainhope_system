import type { ReactNode } from "react"

import type { ListLoad } from "@/lib/listLoad"

type Props<T> = {
 load: ListLoad<T>
 skeleton: ReactNode
 errorFallback?: (message?: string) => ReactNode
 children: (rows: T[]) => ReactNode
}

export function ListLoadBoundary<T>({
 load,
 skeleton,
 errorFallback,
 children,
}: Props<T>) {
 if (load.status === "loading") return <>{skeleton}</>
 if (load.status === "error") {
  return (
   <>
    {errorFallback?.() ?? (
     <p className="py-8 text-center text-sm text-destructive" role="alert">
      載入失敗，請稍後再試。
     </p>
    )}
   </>
  )
 }
 if (load.rows.length === 0) {
  return (
   <p className="py-8 text-center text-sm text-muted-foreground" role="status">
    沒有資料
   </p>
  )
 }
 return <>{children(load.rows)}</>
}
