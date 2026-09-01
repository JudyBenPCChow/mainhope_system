import { createContext, useContext, useLayoutEffect, useRef, type ReactNode } from "react"

import { cn } from "@/lib/utils"

const StickyListActiveContext = createContext(false)

type ShellProps = {
 header: ReactNode
 children: ReactNode
 /** 桌面清單凍結頂列；流動裝置維持一般文件流 */
 sticky?: boolean
 className?: string
}

type LeadProps = {
 children: ReactNode
 className?: string
}

/**
 * 桌面清單版面殼：頂列不隨內容捲動；其餘為唯一捲動區（直向＋橫向）。
 * 表頭凍結請用 `stickyTableHeadClass`＋`stickyTableHeadCellClass`＋`stickyTableBodyClass`（相對此捲動區 `top-0`）。
 * 捲動區本身不要加 `pt-*`，否則凍結表頭上方會露出滑動中的列。
 * 流動裝置 `sticky={false}`，不要改 MobileLayout。
 */
export function StickyListShell({ header, children, sticky = true, className }: ShellProps) {
 const bodyRef = useRef<HTMLDivElement>(null)

 useLayoutEffect(() => {
  if (!sticky) return
  const body = bodyRef.current
  if (!body) return
  const apply = () => {
   body.style.setProperty("--sticky-list-viewport-w", `${body.clientWidth}px`)
  }
  apply()
  const ro = new ResizeObserver(apply)
  ro.observe(body)
  return () => ro.disconnect()
 }, [sticky])

 if (!sticky) {
  return (
   <StickyListActiveContext.Provider value={false}>
    <div className={cn("space-y-5 py-4 md:p-6", className)}>
     {header}
     {children}
    </div>
   </StickyListActiveContext.Provider>
  )
 }

 return (
  <StickyListActiveContext.Provider value={true}>
   <div
    data-sticky-list-shell=""
    className={cn("flex h-full min-h-0 flex-1 flex-col overflow-hidden", className)}
   >
    <header className="shrink-0 space-y-3 border-b border-border bg-background pb-4">
     {header}
    </header>
    {/* 內距放在內層，勿放在 overflow 容器：否則 sticky 表頭下方會露出滑動中的列 */}
    <div
     ref={bodyRef}
     className="min-h-0 flex-1 overflow-auto overscroll-contain"
    >
     <div className="flex min-h-0 flex-col gap-5 pt-4">
      {children}
     </div>
    </div>
   </div>
  </StickyListActiveContext.Provider>
 )
}

/**
 * 寬表橫向捲動時，把統計／篩選等區塊釘在可視區左邊，避免整列被拖走。
 */
export function StickyListLead({ children, className }: LeadProps) {
 const active = useContext(StickyListActiveContext)
 if (!active) {
  return <div className={cn("space-y-5", className)}>{children}</div>
 }
 return (
  <div
   className={cn("sticky left-0 z-[1] space-y-5 bg-background", className)}
   style={{ width: "var(--sticky-list-viewport-w, 100%)" }}
  >
   {children}
  </div>
 )
}

/** 表頭 `<thead>`：高於 tbody 的堆疊層，避免列（含入場 transform）蓋過凍結表頭。 */
export const stickyTableHeadClass = "relative z-20"

/** 貼在清單捲動區頂的表頭列外觀；真正的 `sticky` 在儲存格。 */
export const stickyTableHeadRowClass = "border-b border-border bg-muted text-left"

/**
 * 凍結表頭儲存格。底色必須不透明；`z-20` 須高於 tbody。
 * `border-collapse` 會令 sticky 失效，表格需 `border-separate`。
 */
export const stickyTableHeadCellClass =
 "sticky top-0 z-20 border-b border-border bg-muted"

/** 清單 `<tbody>`：把列的堆疊關在表頭之下。 */
export const stickyTableBodyClass = "relative z-0"
