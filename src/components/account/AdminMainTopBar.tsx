import { Link } from "react-router-dom"
import { Flame, Inbox, Settings } from "lucide-react"

import { pathIsActive } from "@/lib/navStructure"
import { cn } from "@/lib/utils"

type AdminMainTopBarProps = {
 pathname: string
 unreadCount: number
}

/** 行政主欄頂部白條：右側收件匣與設定圖示捷徑。 */
export function AdminMainTopBar({ pathname, unreadCount }: AdminMainTopBarProps) {
 const inboxLabel = unreadCount > 0 ? `收件匣，${unreadCount} 則未讀` : "收件匣"

 return (
  <header
   className="z-20 flex min-h-[3.625rem] shrink-0 items-center justify-end gap-1.5 border-b border-[#dde4ee] bg-white px-4 py-2.5 sm:px-[1.375rem]"
   data-admin-main-topbar
  >
   <div className="flex items-center gap-1.5" aria-label="快捷入口">
    <Link
     to="/Inbox"
     title={unreadCount > 0 ? `收件匣（${unreadCount} 未讀）` : "收件匣"}
     aria-label={inboxLabel}
     className={cn(
      "relative inline-flex h-[2.375rem] w-[2.375rem] items-center justify-center rounded-[0.625rem] border border-[#dde4ee] bg-white text-slate-700 transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
      pathIsActive(pathname, "/Inbox") && "border-sky-300 bg-sky-50 text-primary"
     )}
    >
     <Inbox className="h-[1.125rem] w-[1.125rem]" aria-hidden />
     {unreadCount > 0 ? (
      <Flame className="absolute -right-1 -top-1 h-3 w-3 text-orange-400" aria-hidden />
     ) : null}
    </Link>
    <Link
     to="/Settings"
     title="設定"
     aria-label="設定"
     className={cn(
      "inline-flex h-[2.375rem] w-[2.375rem] items-center justify-center rounded-[0.625rem] border border-[#dde4ee] bg-white text-slate-700 transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
      pathIsActive(pathname, "/Settings") && "border-sky-300 bg-sky-50 text-primary"
     )}
    >
     <Settings className="h-[1.125rem] w-[1.125rem]" aria-hidden />
    </Link>
   </div>
  </header>
 )
}
