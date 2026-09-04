import { Link, useLocation } from "react-router-dom"
import { Flame, Inbox, PanelRight, Pin, Settings } from "lucide-react"

import { useRecordPreview } from "@/components/recordPreview/recordPreviewContext"
import { usePinnedPages } from "@/hooks/usePinnedPages"
import { useAppBanner } from "@/lib/appBanner"
import { useAuth } from "@/lib/authBootstrap"
import { formatUnknownError } from "@/lib/formatUnknownError"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { pathIsActive } from "@/lib/navStructure"
import { buildPinnablePage } from "@/lib/pinnedPages"
import { cn } from "@/lib/utils"

type AdminMainTopBarProps = {
 pathname: string
 unreadCount: number
}

const topBarButtonClass =
 "inline-flex h-[2.375rem] items-center justify-center rounded-[0.625rem] border border-[#dde4ee] bg-white text-slate-700 transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"

/** 共用主欄頂部白條：左釘選本頁，右為常用功能、收件匣、設定。 */
export function AdminMainTopBar({ pathname, unreadCount }: AdminMainTopBarProps) {
 const { role } = useAuth()
 const location = useLocation()
 const { pushBanner } = useAppBanner()
 const inboxLabel = unreadCount > 0 ? `收件匣，${unreadCount} 則未讀` : "收件匣"
 const { preview, closePreview, emptyOpen, setEmptyOpen } = useRecordPreview()
 const showHomeActions = role === "admin"
 const homeActionsOpen = showHomeActions && emptyOpen && !preview
 const pinnable = role ? buildPinnablePage(pathname, location.search, role) : null
 const { isPinned, toggle, ready } = usePinnedPages()
 const pinned = pinnable ? isPinned(pinnable.href) : false

 const toggleHomeActions = () => {
  if (preview) {
   closePreview()
   setEmptyOpen(true)
   return
  }
  setEmptyOpen(!emptyOpen)
 }

 return (
  <header
   className="z-20 flex min-h-[3.625rem] shrink-0 items-center justify-between gap-1.5 border-b border-[#dde4ee] bg-white px-4 py-2.5 sm:px-[1.375rem]"
   data-admin-main-topbar
  >
   <div className="flex min-w-0 items-center">
    {pinnable ? (
     <button
      type="button"
      title={pinned ? `取消釘選「${pinnable.label}」` : `釘選「${pinnable.label}」到常用功能`}
      aria-label={pinned ? `取消釘選${pinnable.label}` : `釘選${pinnable.label}`}
      aria-pressed={pinned}
      disabled={!ready}
      onClick={() => {
       const willPin = !pinned
       void toggle(pinnable.href).then(
        () => {
         if (willPin && showHomeActions) {
          closePreview()
          setEmptyOpen(true)
         }
        },
        (error: unknown) => {
         reportUserFacingError(error, { source: "AdminMainTopBar.togglePin" })
         pushBanner({
          tone: "error",
          title: "未能儲存釘選",
          message: formatUnknownError(error),
         })
        }
       )
      }}
      className={cn(
       topBarButtonClass,
       "gap-1.5 px-2.5 text-sm font-medium",
       pinned && "border-sky-300 bg-sky-50 text-primary"
      )}
     >
      <Pin className={cn("h-[1.125rem] w-[1.125rem]", pinned && "fill-current")} aria-hidden />
      <span className="hidden sm:inline">{pinned ? "已釘選" : "釘選"}</span>
     </button>
    ) : null}
   </div>
   <div className="flex items-center gap-1.5" aria-label="快捷入口">
    {showHomeActions ? (
     <>
      <span className="hidden whitespace-nowrap text-sm font-medium text-destructive sm:inline">
       小提醒︰這裡可以打開常用功能---&gt;
      </span>
      <button
       type="button"
       title={homeActionsOpen ? "摺疊常用功能" : "展開常用功能"}
       aria-label={homeActionsOpen ? "摺疊常用功能" : "展開常用功能"}
       aria-pressed={homeActionsOpen}
       onClick={toggleHomeActions}
       className={cn(
        topBarButtonClass,
        "gap-1.5 px-2.5 text-sm font-medium",
        homeActionsOpen && "border-sky-300 bg-sky-50 text-primary"
       )}
      >
       <PanelRight className="h-[1.125rem] w-[1.125rem]" aria-hidden />
       常用功能
      </button>
     </>
    ) : null}
    <Link
     to="/Inbox"
     title={unreadCount > 0 ? `收件匣（${unreadCount} 未讀）` : "收件匣"}
     aria-label={inboxLabel}
     className={cn(
      topBarButtonClass,
      "relative gap-1.5 px-2.5 text-sm font-medium",
      pathIsActive(pathname, "/Inbox") && "border-sky-300 bg-sky-50 text-primary"
     )}
    >
     <Inbox className="h-[1.125rem] w-[1.125rem]" aria-hidden />
     收件匣
     {unreadCount > 0 ? (
      <Flame className="absolute -right-1 -top-1 h-3 w-3 text-orange-400" aria-hidden />
     ) : null}
    </Link>
    <Link
     to="/Settings"
     title="設定"
     aria-label="設定"
     className={cn(
      topBarButtonClass,
      "gap-1.5 px-2.5 text-sm font-medium",
      pathIsActive(pathname, "/Settings") && "border-sky-300 bg-sky-50 text-primary"
     )}
    >
     <Settings className="h-[1.125rem] w-[1.125rem]" aria-hidden />
     設定
    </Link>
   </div>
  </header>
 )
}
