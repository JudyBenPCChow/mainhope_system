import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
 CalendarDays,
 CalendarOff,
 ChevronRight,
 ClipboardCheck,
 GraduationCap,
 HandCoins,
 ListOrdered,
 Pin,
 X,
 type LucideIcon,
} from "lucide-react"

import { Tag } from "@/components/ui/tag"
import { usePinnedPages } from "@/hooks/usePinnedPages"
import { useAppBanner } from "@/lib/appBanner"
import { useAuth } from "@/lib/authBootstrap"
import { can } from "@/lib/authzProfile"
import { formatUnknownError } from "@/lib/formatUnknownError"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { normalizePinnableHref, resolvePinnedPages, visibleDefaultHomeActionPaths } from "@/lib/pinnedPages"
import { cn } from "@/lib/utils"
import { fetchAdminDashboard } from "@/services/dashboard"

type CompactProps = {
 pendingPaymentCount: number
 loading?: boolean
}

type Tile = {
 path: string
 label: string
 description: string
 icon: LucideIcon
 need?: "pay" | "leave"
 badge?: "pending"
}

const TILES: Tile[] = [
 {
  path: "/FrontDeskWizard",
  label: "新生登記",
  description: "按情境完成查詢、新生登記及後續安排。",
  icon: ListOrdered,
 },
 {
  path: "/Payments",
  label: "收款登記",
  description: "登記學費、核對堂數並建立收據紀錄。",
  icon: HandCoins,
  need: "pay",
  badge: "pending",
 },
 {
  path: "/LeaveManagement",
  label: "登記請假",
  description: "處理學生請假與補堂跟進。",
  icon: CalendarOff,
  need: "leave",
 },
 {
  path: "/Attendance",
  label: "進行點名",
  description: "開啟即日課堂點名紙並確認出席狀態。",
  icon: ClipboardCheck,
 },
 {
  path: "/TrialSessions",
  label: "試堂紀錄",
  description: "查閱試堂並跟進出單確認。",
  icon: GraduationCap,
 },
 {
  path: "/Schedule?view=day",
  label: "打開日視圖",
  description: "以課室時間表查看當日排程，並可調整課室。",
  icon: CalendarDays,
 },
]

const tileLinkClass =
 "group flex min-w-0 items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"

function PendingBadge({ count, loading }: { count: number; loading?: boolean }) {
 if (loading || count <= 0) return null
 return (
  <Tag tone="warning" size="sm">
   {count}
  </Tag>
 )
}

/** 手機：三個主鍵，不佔右側預覽欄。 */
export function AdminHomeMobileActions({ pendingPaymentCount, loading }: CompactProps) {
 return (
  <nav aria-label="常用工作" className="grid grid-cols-3 gap-2">
   {TILES.slice(0, 3).map((tile) => {
    const Icon = tile.icon
    return (
     <Link
      key={tile.path}
      to={tile.path}
      className="flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-2 py-3 text-xs font-medium shadow-sm"
     >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
       <Icon className="h-5 w-5" aria-hidden />
      </span>
      {tile.label}
      {tile.badge === "pending" ? (
       <PendingBadge count={pendingPaymentCount} loading={loading} />
      ) : null}
     </Link>
    )
   })}
  </nav>
 )
}

/** 桌面首頁右側：沿用線上行政首頁「快速功能」卡片樣式。 */
export function HomeActionsPreviewPanel() {
 const { profile, role } = useAuth()
 const { pushBanner } = useAppBanner()
 const caps = profile?.activeCapabilities
 const canPay = can(caps, "payments.create") || can(caps, "payments.mark_received")
 const canLeave = can(caps, "leaves.read") || can(caps, "leaves.manage")
 const { paths, hiddenDefaults, toggle, hideDefault, restoreHiddenDefaults, ready } = usePinnedPages()
 const pinnedPages = role ? resolvePinnedPages(paths, role) : []
 const visibleDefaultHrefs = new Set(
  visibleDefaultHomeActionPaths(
   TILES.map((tile) => tile.path),
   paths,
   hiddenDefaults
  )
 )

 const reportPrefsError = (error: unknown, source: string, title: string) => {
  reportUserFacingError(error, { source })
  pushBanner({
   tone: "error",
   title,
   message: formatUnknownError(error),
  })
 }

 const [pending, setPending] = useState(0)
 const [loading, setLoading] = useState(true)

 useEffect(() => {
  let cancelled = false
  setLoading(true)
  void fetchAdminDashboard()
   .then((d) => {
    if (!cancelled) setPending(d.pendingPaymentCount)
   })
   .finally(() => {
    if (!cancelled) setLoading(false)
   })
  return () => {
   cancelled = true
  }
 }, [])

 const tiles = TILES.filter((tile) => {
  if (!visibleDefaultHrefs.has(normalizePinnableHref(tile.path))) return false
  if (tile.need === "pay") return canPay
  if (tile.need === "leave") return canLeave
  return true
 })

 return (
  <div className="flex min-h-full flex-col px-4 pb-5 pt-12">
   <header className="pr-8">
    <h2 className="text-[1.3rem] font-semibold text-foreground">常用工作</h2>
    <p className="mt-1 text-sm text-muted-foreground">
     直接前往常用的行政工作。釘選與移走的預設捷徑會記在你的帳戶，換裝置仍保留。
     <span className="mt-1 block font-medium text-destructive">可以在每頁左上角「釘選」，加入到常用工作區！</span>
    </p>
   </header>

   {pinnedPages.length > 0 ? (
    <nav aria-label="已釘選" className="mt-4 flex flex-col gap-3">
     <p className="text-xs font-semibold tracking-wide text-muted-foreground">已釘選</p>
     {pinnedPages.map((page) => {
      const Icon = page.icon
      return (
       <div key={page.href} className="relative">
        <Link to={page.href} className={cn(tileLinkClass, "pr-12")}>
         <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-info/10 group-hover:text-info">
          <Icon className="h-5 w-5" aria-hidden />
         </span>
         <span className="min-w-0 flex-1">
          <span className="font-medium text-foreground">{page.label}</span>
          <span className="mt-1 block text-sm leading-5 text-muted-foreground">你釘選的頁面</span>
         </span>
         <ChevronRight
          className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
          aria-hidden
         />
        </Link>
        <button
         type="button"
         className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-primary hover:bg-muted"
         title={`取消釘選「${page.label}」`}
         aria-label={`取消釘選${page.label}`}
         onClick={() => {
          void toggle(page.href).catch((error: unknown) => {
           reportPrefsError(error, "HomeActionsPreviewPanel.togglePin", "未能取消釘選")
          })
         }}
        >
         <Pin className="h-4 w-4 fill-current" aria-hidden />
        </button>
       </div>
      )
     })}
    </nav>
   ) : (
    <p className="mt-4 text-sm text-muted-foreground">可在各頁左上角按「釘選」，把常用頁面放在這裡。</p>
   )}

   {hiddenDefaults.length > 0 ? (
    <button
     type="button"
     className="mt-3 self-start text-sm font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
     disabled={!ready}
     onClick={() => {
      void restoreHiddenDefaults().catch((error: unknown) => {
       reportPrefsError(error, "HomeActionsPreviewPanel.restoreHiddenDefaults", "未能還原預設捷徑")
      })
     }}
    >
     還原已移走的預設捷徑
    </button>
   ) : null}

   <nav aria-label="常用工作" className="mt-4 flex flex-col gap-3">
    {tiles.map((tile) => {
     const Icon = tile.icon
     const showPending = tile.badge === "pending"
     const href = normalizePinnableHref(tile.path)
     return (
      <div key={tile.path} className="relative">
       <Link to={tile.path} className={cn(tileLinkClass, "pr-12")}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-info/10 group-hover:text-info">
         <Icon className="h-5 w-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
         <span className="flex flex-wrap items-center gap-2 font-medium text-foreground">
          {tile.label}
          {showPending ? <PendingBadge count={pending} loading={loading} /> : null}
         </span>
         <span className="mt-1 block text-sm leading-5 text-muted-foreground">
          {tile.description}
         </span>
        </span>
        <ChevronRight
         className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
         aria-hidden
        />
       </Link>
       <button
        type="button"
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
        title={`從常用功能移走「${tile.label}」`}
        aria-label={`從常用功能移走${tile.label}`}
        disabled={!ready}
        onClick={() => {
         void hideDefault(href).catch((error: unknown) => {
          reportPrefsError(error, "HomeActionsPreviewPanel.hideDefault", "未能移走預設捷徑")
         })
        }}
       >
        <X className="h-4 w-4" aria-hidden />
       </button>
      </div>
     )
    })}
   </nav>
  </div>
 )
}
