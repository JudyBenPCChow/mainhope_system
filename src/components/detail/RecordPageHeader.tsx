import type { ReactNode } from "react"
import { ChevronLeft } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"

type RecordPageHeaderProps = {
 backLabel: string
 onBack: () => void
 title: ReactNode
 meta?: ReactNode
 exception?: ReactNode
 actions?: ReactNode
 loading?: boolean
 loadingLabel?: string
}

/** 桌面紀錄頁頁首：圖示＋文字返回＋標題區＋右側動作。流動裝置改由 `DetailLayerChrome` 承擔識別。 */
export function RecordPageHeader({
 backLabel,
 onBack,
 title,
 meta,
 exception,
 actions,
 loading = false,
 loadingLabel = "載入中…",
}: RecordPageHeaderProps) {
 const isMobile = useIsMobile()
 if (isMobile) return null

 return (
  <div className="space-y-3">
   <button
    type="button"
    className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
    onClick={onBack}
   >
    <ChevronLeft className="h-4 w-4" aria-hidden />
    {backLabel}
   </button>
   <div className="flex flex-wrap items-start justify-between gap-3">
    <div className="min-w-0">
     {loading ? (
      <p className="text-lg">{loadingLabel}</p>
     ) : (
      <>
       <h1 className="truncate text-xl font-bold md:text-2xl">{title}</h1>
       {meta ? (
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
         {meta}
        </div>
       ) : null}
       {exception}
      </>
     )}
    </div>
    {actions ? <div className="flex w-fit shrink-0 flex-wrap gap-2">{actions}</div> : null}
   </div>
  </div>
 )
}
