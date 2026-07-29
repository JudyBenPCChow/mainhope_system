import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react"
import {
 createContext,
 useCallback,
 useContext,
 useEffect,
 useMemo,
 useRef,
 useState,
 type PropsWithChildren,
} from "react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type BannerTone = "default" | "info" | "success" | "warning" | "error"

/** 自動關閉秒數（毫秒） */
export const BANNER_AUTO_DISMISS_MS = 2000

type BannerAction = {
 pageLabel: string
 to: string
}

export type AppBannerInput = {
 tone?: BannerTone
 title: string
 message?: string
 action?: BannerAction
}

type BannerItem = AppBannerInput & {
 id: string
 expanded: boolean
}

type AppBannerContextValue = {
 banners: BannerItem[]
 pushBanner: (input: AppBannerInput) => void
 dismissBanner: (id: string) => void
 toggleExpand: (id: string) => void
}

const AppBannerContext = createContext<AppBannerContextValue | null>(null)

function toneClasses(tone: BannerTone): string {
 if (tone === "info") return "bg-info text-info-foreground"
 if (tone === "success") return "bg-success text-success-foreground"
 if (tone === "warning") return "bg-warning text-warning-foreground"
 if (tone === "error") return "bg-destructive text-destructive-foreground"
 return "bg-neutral-700 text-white"
}

function toneIcon(tone: BannerTone) {
 if (tone === "info") return Info
 if (tone === "success") return CheckCircle2
 if (tone === "warning") return AlertTriangle
 return AlertCircle
}

function nextBannerId(): string {
 return `bnr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function AppBannerProvider({ children }: PropsWithChildren) {
 const [banners, setBanners] = useState<BannerItem[]>([])
 const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

 const clearBannerTimer = useCallback((id: string) => {
  const timer = timersRef.current.get(id)
  if (!timer) return
  clearTimeout(timer)
  timersRef.current.delete(id)
 }, [])

 const dismissBanner = useCallback(
  (id: string) => {
   clearBannerTimer(id)
   setBanners((prev) => prev.filter((b) => b.id !== id))
  },
  [clearBannerTimer]
 )

 const pushBanner = useCallback(
  (input: AppBannerInput) => {
   const id = nextBannerId()
   setBanners((prev) => [{ id, expanded: false, tone: input.tone ?? "default", ...input }, ...prev])
   const timer = setTimeout(() => {
    timersRef.current.delete(id)
    setBanners((prev) => prev.filter((b) => b.id !== id))
   }, BANNER_AUTO_DISMISS_MS)
   timersRef.current.set(id, timer)
  },
  []
 )

 const toggleExpand = useCallback((id: string) => {
  setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, expanded: !b.expanded } : b)))
 }, [])

 useEffect(() => {
  return () => {
   for (const timer of timersRef.current.values()) clearTimeout(timer)
   timersRef.current.clear()
  }
 }, [])

 const value = useMemo<AppBannerContextValue>(
  () => ({ banners, pushBanner, dismissBanner, toggleExpand }),
  [banners, dismissBanner, pushBanner, toggleExpand]
 )

 return (
  <AppBannerContext.Provider value={value}>
   {children}
  </AppBannerContext.Provider>
 )
}

export function useAppBanner() {
 const ctx = useContext(AppBannerContext)
 if (!ctx) throw new Error("useAppBanner 必須在 AppBannerProvider 內使用")
 return ctx
}

export function AppBannerViewport() {
 const navigate = useNavigate()
 const { banners, dismissBanner, toggleExpand } = useAppBanner()

 if (banners.length === 0) return null

 return (
  <div className="pointer-events-none fixed left-1/2 top-3 z-[70] w-[min(900px,calc(100vw-1.5rem))] -translate-x-1/2">
   <div className="flex flex-col gap-2">
    {banners.map((b) => {
     const Icon = toneIcon(b.tone ?? "default")
     const action = b.action
     return (
      <article
       key={b.id}
       className={cn(
        "pointer-events-auto overflow-hidden rounded-xl shadow-lg ring-1 ring-black/5 animate-in slide-in-from-top-4 fade-in duration-300",
        toneClasses(b.tone ?? "default")
       )}
      >
       <div className="flex items-start gap-3 px-4 py-3">
        <button type="button" className="flex min-w-0 flex-1 items-start gap-3 text-left" onClick={() => toggleExpand(b.id)}>
         <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
         <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-medium">{b.title}</p>
          {b.expanded && b.message ? <p className="mt-1 text-sm/6 opacity-95">{b.message}</p> : null}
         </div>
        </button>
        {action ? (
          <Button
           type="button"
           size="sm"
           variant="outline"
           className="h-8 border-white/70 bg-transparent text-current hover:bg-white/15 hover:text-current"
           onClick={(e) => {
            e.stopPropagation()
            navigate(action.to)
            dismissBanner(b.id)
           }}
          >
           {`前往${action.pageLabel}頁面`}
          </Button>
         ) : null}
        <button
         type="button"
         className="rounded-md p-1 opacity-90 transition hover:bg-white/15"
         aria-label="關閉通知"
         onClick={(e) => {
          e.stopPropagation()
          dismissBanner(b.id)
         }}
        >
         <X className="h-4 w-4" />
        </button>
       </div>
      </article>
     )
    })}
   </div>
  </div>
 )
}
