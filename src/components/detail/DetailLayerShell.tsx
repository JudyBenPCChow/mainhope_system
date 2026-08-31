import { useEffect } from "react"
import { createPortal } from "react-dom"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

type DetailLayerVariant = "student" | "teacher"

type DetailLayerShellProps = {
 children: React.ReactNode
 onDismiss: () => void
 /** 用於外框色調提示 */
 variant?: DetailLayerVariant
 /** 頂部輔助列文案；傳 `null` 可隱藏 */
 layerLabel?: string | null
}

const variantPanelRing: Record<DetailLayerVariant, string> = {
 student:
  "border-primary/25 shadow-[0_0_0_1px_hsl(var(--primary)/0.12),0_-12px_48px_rgba(0,0,0,0.2)] md:shadow-[0_0_0_1px_hsl(var(--primary)/0.12),0_25px_80px_rgba(0,0,0,0.22)]",
 teacher:
  "border-success/25 shadow-[0_0_0_1px_rgba(16,185,129,0.15),0_-12px_48px_rgba(0,0,0,0.2)] md:shadow-[0_0_0_1px_rgba(16,185,129,0.15),0_25px_80px_rgba(0,0,0,0.22)]",
}

/**
 * 第二層詳情外殼：遮罩 + 實色面板向上滑入。
 * 使用 portal 掛到 body，避免主內容區 overflow 影響 fixed 定位。
 */
export function DetailLayerShell({
 children,
 onDismiss,
 variant = "student",
 layerLabel = "詳情檢視",
}: DetailLayerShellProps) {
 useEffect(() => {
  const prev = document.body.style.overflow
  document.body.style.overflow = "hidden"
  return () => {
   document.body.style.overflow = prev
  }
 }, [])

 useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
   if (e.key === "Escape") onDismiss()
  }
  window.addEventListener("keydown", onKey)
  return () => window.removeEventListener("keydown", onKey)
 }, [onDismiss])

 const node = (
  <div
   className="fixed inset-0 z-[200] flex flex-col justify-end md:items-center md:justify-center md:p-5"
   role="dialog"
   aria-modal="true"
  >
   <button
    type="button"
    className="absolute inset-0 animate-in fade-in duration-200 bg-slate-950/45 backdrop-blur-[2px] transition-opacity hover:bg-slate-950/50"
    aria-label="關閉詳情並返回列表"
    onClick={onDismiss}
   />
   <div
    className={cn(
     "relative z-[1] flex h-[min(90vh,920px)] w-full max-w-5xl flex-col overflow-hidden rounded-t-[1.25rem] border border-border bg-background ring-1 ring-black/10 animate-in fade-in slide-in-from-bottom-8 duration-300 ease-out fill-mode-both md:h-[min(86vh,900px)] md:rounded-2xl md:slide-in-from-bottom-4",
     variantPanelRing[variant]
    )}
   >
    <div className="flex shrink-0 justify-center bg-gradient-to-b from-muted/40 to-transparent pt-2 md:hidden">
     <div className="h-1 w-11 rounded-full bg-muted-foreground/30" aria-hidden />
    </div>
    {layerLabel ? (
     <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-background px-4 py-2 md:rounded-t-2xl">
      <p className="text-xs font-medium tracking-wide text-muted-foreground">{layerLabel}</p>
      <span className="rounded-md bg-background/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-border/60">
       第二層
      </span>
     </div>
    ) : null}
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
   </div>
  </div>
 )

 return createPortal(node, document.body)
}

/** 流動裝置維持 bottom sheet；桌面當普通頁（無遮罩／無 portal）。 */
export function AdaptiveDetailLayer(props: DetailLayerShellProps) {
 const isMobile = useIsMobile()
 if (isMobile) return <DetailLayerShell {...props} />
 return <>{props.children}</>
}
