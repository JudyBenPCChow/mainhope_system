import { X } from "lucide-react"

import { Button } from "@/components/ui/button"

type DetailLayerChromeProps = {
 title: string
 subtitle?: string | null
 /** 學號等識別列，顯示於標題之上。 */
 eyebrow?: string | null
 onClose: () => void
}

/** 流動裝置 bottom sheet 頂列：識別文字＋關閉。桌面由 `AdaptiveDetailLayer` 忽略 chrome。 */
export function DetailLayerChrome({ title, subtitle, eyebrow, onClose }: DetailLayerChromeProps) {
 return (
  <div className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-2.5">
   <div className="min-w-0 flex-1">
    {eyebrow ? (
     <p className="truncate text-xs tabular-nums text-muted-foreground">{eyebrow}</p>
    ) : null}
    <p className="truncate text-sm font-semibold text-foreground">{title}</p>
    {subtitle ? (
     <p className="truncate text-xs tabular-nums text-muted-foreground">{subtitle}</p>
    ) : null}
   </div>
   <Button
    type="button"
    variant="ghost"
    size="icon"
    className="shrink-0"
    aria-label="關閉"
    onClick={onClose}
   >
    <X className="h-4 w-4" />
   </Button>
  </div>
 )
}
