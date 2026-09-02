import { Link } from "react-router-dom"
import { Flame, Inbox, LogOut } from "lucide-react"

import { RoleSwitcher } from "@/components/account/RoleSwitcher"
import { Button } from "@/components/ui/button"
import { pathIsActive, type NavLeafOnly } from "@/lib/navStructure"
import { cn } from "@/lib/utils"

type AdminSidebarFooterProps = {
 collapsed?: boolean
 onLogout: () => void
 /** 手機抽屜仍顯示收件匣／設定；桌面改由主欄頂部白條提供。 */
 showQuickLinks?: boolean
 pathname?: string
 unreadCount?: number
 footerNavLeaves?: NavLeafOnly[]
 onNavigate?: () => void
 className?: string
}

/** 行政側欄底部：身份卡與登出；可選收件匣／設定（手機抽屜）。 */
export function AdminSidebarFooter({
 collapsed = false,
 onLogout,
 showQuickLinks = false,
 pathname = "",
 unreadCount = 0,
 footerNavLeaves = [],
 onNavigate,
 className,
}: AdminSidebarFooterProps) {
 const inboxLabel = unreadCount > 0 ? `收件匣，${unreadCount} 則未讀` : "收件匣"

 return (
  <div
   className={cn(
    "shrink-0 border-t border-white/10 bg-gradient-to-t from-[#172d57]/50 to-transparent p-3 text-[0.8625rem]",
    collapsed && "px-2.5",
    className
   )}
  >
   {!collapsed ? (
    <>
     <div className="mb-2">
      <RoleSwitcher variant="card" />
     </div>
     {showQuickLinks ? (
      <div className="mb-2 flex items-center gap-1.5">
       <Link
        to="/Inbox"
        onClick={onNavigate}
        aria-label={inboxLabel}
        className={cn(
         "flex h-[2.375rem] min-w-0 flex-1 items-center gap-2 rounded-[0.5625rem] px-2.5 text-white/90 transition-colors hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
         pathIsActive(pathname, "/Inbox") && "bg-white/15 text-white"
        )}
       >
        <Inbox className="h-5 w-5 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1 truncate font-medium">收件匣</span>
        {unreadCount > 0 ? (
         <Flame className="h-4 w-4 shrink-0 text-orange-400" aria-hidden />
        ) : null}
       </Link>
       {footerNavLeaves.map((item) => {
        const Icon = item.icon
        const active = pathIsActive(pathname, item.path)
        return (
         <Link
          key={`${item.path}::${item.label}`}
          to={item.path}
          onClick={onNavigate}
          title={item.label}
          aria-label={item.label}
          className={cn(
           "flex h-[2.375rem] w-[2.375rem] shrink-0 items-center justify-center rounded-[0.625rem] bg-white/8 text-white transition-colors hover:bg-white/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
           active && "bg-white/22 ring-1 ring-white/15"
          )}
         >
          <Icon className="h-5 w-5" aria-hidden />
         </Link>
        )
       })}
      </div>
     ) : null}
     <Button type="button" variant="secondary" className="h-9 w-full" onClick={onLogout}>
      登出
     </Button>
    </>
   ) : (
    <div className="flex flex-col items-center gap-1.5">
     {showQuickLinks ? (
      <>
       <Link
        to="/Inbox"
        onClick={onNavigate}
        title={unreadCount > 0 ? `收件匣（${unreadCount} 未讀）` : "收件匣"}
        aria-label={inboxLabel}
        className={cn(
         "flex h-[2.625rem] w-[2.625rem] items-center justify-center rounded-[0.5625rem] text-white/90 transition-colors hover:bg-white/15",
         pathIsActive(pathname, "/Inbox") && "bg-white/22 text-white"
        )}
       >
        <span className="relative inline-flex">
         <Inbox className="h-5 w-5" aria-hidden />
         {unreadCount > 0 ? (
          <Flame className="absolute -right-2 -top-2 h-3 w-3 text-orange-400" aria-hidden />
         ) : null}
        </span>
       </Link>
       {footerNavLeaves.map((item) => {
        const Icon = item.icon
        const active = pathIsActive(pathname, item.path)
        return (
         <Link
          key={`${item.path}::${item.label}`}
          to={item.path}
          onClick={onNavigate}
          title={item.label}
          aria-label={item.label}
          className={cn(
           "flex h-[2.625rem] w-[2.625rem] items-center justify-center rounded-[0.5625rem] bg-white/8 text-white transition-colors hover:bg-white/18",
           active && "bg-white/22 ring-1 ring-white/15"
          )}
         >
          <Icon className="h-5 w-5" aria-hidden />
         </Link>
        )
       })}
      </>
     ) : null}
     <Button
      type="button"
      variant="secondary"
      size="icon"
      className="h-[2.625rem] w-[2.625rem]"
      title="登出"
      aria-label="登出"
      onClick={onLogout}
     >
      <LogOut className="h-4 w-4" aria-hidden />
     </Button>
    </div>
   )}
  </div>
 )
}
