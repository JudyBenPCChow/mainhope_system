import { Link, Navigate, Outlet, useLocation } from "react-router-dom"
import { useEffect, useMemo, useState } from "react"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"

import { RoleSwitcher } from "@/components/account/RoleSwitcher"
import { ApoAssistant } from "@/components/assistant/ApoAssistant"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/authBootstrap"
import { AppBannerViewport } from "@/lib/appBanner"
import { clearAuthState } from "@/lib/authSession"
import { usePasswordChangeNudgeBanner } from "@/lib/usePasswordChangeNudgeBanner"
import {
 NAV_STRUCTURE,
 filterFooterNavLeaves,
 filterMainNavEntries,
 filterNavForRole,
 flattenNav,
 pathIsActive,
} from "@/lib/navStructure"
import {
 navCollapsedIconClass,
 navFooterIconClass,
 navGroupClass,
 navL1Class,
 navL1IconClass,
 navL2Class,
 navL2IconClass,
 navL2RailClass,
} from "@/lib/navItemStyles"
import { supabase } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"

function initialSidebarCollapsed(): boolean {
 if (typeof localStorage === "undefined") return false
 return localStorage.getItem("mgmt_sidebar_collapsed") === "true"
}

export function Layout() {
 const location = useLocation()
 const [collapsed, setCollapsed] = useState(initialSidebarCollapsed)
 const { ready, role: authRole, profile } = useAuth()
 usePasswordChangeNudgeBanner()
 const role = authRole
 const userDisplayName =
  profile?.displayName?.trim() ||
  profile?.email ||
  (typeof localStorage !== "undefined" ? localStorage.getItem("mgmt_display_name") : null)?.trim() ||
  (typeof localStorage !== "undefined" ? localStorage.getItem("mgmt_email") : null) ||
  "用戶"

 const navEntries = useMemo(
  () => (role ? filterMainNavEntries(filterNavForRole(role, NAV_STRUCTURE)) : []),
  [role]
 )
 const footerNavLeaves = useMemo(
  () => (role ? filterFooterNavLeaves(filterNavForRole(role, NAV_STRUCTURE)) : []),
  [role]
 )

 const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set())

 useEffect(() => {
  const pathname = location.pathname
  setOpenGroups((prev) => {
   const next = new Set(prev)
   for (const e of navEntries) {
    if (e.kind !== "group") continue
    const hasActive = e.children.some((c) => pathIsActive(pathname, c.path))
    if (hasActive) next.add(e.id)
   }
   return next
  })
 }, [location.pathname, navEntries])

 const logout = () => {
  void (async () => {
   clearAuthState()
   if (supabase) await supabase.auth.signOut()
   window.location.href = "/Login"
  })()
 }

 if (!ready) {
  return (
   <div className="flex min-h-svh items-center justify-center bg-brand-bg text-sm text-muted-foreground">
    正在確認登入狀態…
   </div>
  )
 }

 if (!role) {
  return <Navigate to="/Login" replace state={{ from: location.pathname }} />
 }

 const collapsedLinks = flattenNav(navEntries)

 return (
  <div className="flex h-svh min-h-0 w-full overflow-hidden bg-brand-bg">
   <AppBannerViewport />
   <aside
    className={cn(
     "flex h-full min-h-0 shrink-0 flex-col overflow-hidden border-r border-neutral-700 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-800 text-white shadow-[4px_0_24px_-4px_rgba(0,0,0,0.45)] transition-[width] duration-200 ease-out",
     collapsed ? "w-[4.25rem]" : "w-60 md:w-64"
    )}
   >
    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-neutral-700 px-3 py-4">
     {!collapsed && (
      <div className="min-w-0 leading-tight">
       <div className="text-[1.00625rem] font-semibold tracking-tight text-white">明學補習社</div>
       <div className="text-[0.8625rem] text-neutral-400">管理系統</div>
      </div>
     )}
     <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
       "h-9 w-9 shrink-0 text-neutral-300 hover:bg-neutral-800 hover:text-white",
       collapsed && "mx-auto"
      )}
     onClick={() =>
      setCollapsed((current) => {
       const next = !current
       localStorage.setItem("mgmt_sidebar_collapsed", String(next))
       return next
      })
     }
      aria-label={collapsed ? "展開側欄" : "收起側欄"}
     >
      {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
     </Button>
    </div>

    <nav
     className={cn(
      "flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden px-3 py-4 overscroll-contain",
      collapsed && "items-center px-2"
     )}
     aria-label="主選單"
    >
     {collapsed
      ? collapsedLinks.map((item) => {
        const active = pathIsActive(location.pathname, item.path)
        const Icon = item.icon
        return (
         <Link
          key={`${item.path}::${item.label}`}
          to={item.path}
          title={item.label}
          className={navCollapsedIconClass({ active })}
         >
          <Icon className={navL1IconClass} aria-hidden />
          <span className="sr-only">{item.label}</span>
         </Link>
        )
       })
      : navEntries.map((entry) => {
        if (entry.kind === "leaf") {
         const active = pathIsActive(location.pathname, entry.path)
         const Icon = entry.icon
         return (
          <Link
           key={`${entry.path}::${entry.label}`}
           to={entry.path}
           className={navL1Class({ active })}
          >
           <Icon className={navL1IconClass} aria-hidden />
           <span className="truncate">{entry.label}</span>
          </Link>
         )
        }

        const open = openGroups.has(entry.id)
        const groupActive = entry.children.some((c) => pathIsActive(location.pathname, c.path))
        const GroupIcon = entry.icon

        return (
         <div key={entry.id} className="flex flex-col gap-0.5">
          <button
           type="button"
           className={navGroupClass({ childActive: groupActive })}
           aria-expanded={open}
           onClick={() =>
            setOpenGroups((prev) => {
             const next = new Set(prev)
             if (next.has(entry.id)) next.delete(entry.id)
             else next.add(entry.id)
             return next
            })
           }
          >
           <span className="flex min-w-0 items-center gap-3">
            <GroupIcon className={navL1IconClass} aria-hidden />
            <span className="truncate font-medium">{entry.label}</span>
           </span>
           <ChevronDown
            className={cn(
             "h-4 w-4 shrink-0 opacity-80 transition-transform duration-200",
             open && "rotate-180"
            )}
            aria-hidden
           />
          </button>
          <div className={navL2RailClass({ open })}>
           {open
            ? entry.children.map((child) => {
              const active = pathIsActive(location.pathname, child.path)
              const ChildIcon = child.icon
              return (
               <Link
                key={`${child.path}::${child.label}`}
                to={child.path}
                className={navL2Class({ active })}
               >
                <ChildIcon className={navL2IconClass} aria-hidden />
                <span className="truncate">{child.label}</span>
               </Link>
              )
             })
            : null}
          </div>
         </div>
        )
       })}
    </nav>

    <div className="shrink-0 border-t border-neutral-700 bg-gradient-to-t from-black/80 to-transparent p-3 md:p-4 text-[0.8625rem]">
     {!collapsed ? (
      <div className="mb-3">
       <RoleSwitcher />
      </div>
     ) : null}
     {!collapsed && (
      <div className="mb-3 flex items-center gap-2">
       <div
        className="min-w-0 flex-1 truncate rounded-lg bg-neutral-800 px-3 py-2 text-neutral-200"
        title={userDisplayName}
       >
        你登入為 {userDisplayName}
       </div>
       {footerNavLeaves.map((item) => {
        const active = pathIsActive(location.pathname, item.path)
        const Icon = item.icon
        return (
         <Link
          key={`${item.path}::${item.label}`}
          to={item.path}
          title={item.label}
          aria-label={item.label}
          className={navFooterIconClass({ active })}
         >
          <Icon className="h-4 w-4 opacity-95" aria-hidden />
          <span className="sr-only">{item.label}</span>
         </Link>
        )
       })}
      </div>
     )}
     {collapsed && footerNavLeaves.length > 0 ? (
      <div className="mb-2 flex flex-col items-center gap-1">
       {footerNavLeaves.map((item) => {
        const active = pathIsActive(location.pathname, item.path)
        const Icon = item.icon
        return (
         <Link
          key={`${item.path}::${item.label}`}
          to={item.path}
          title={item.label}
          aria-label={item.label}
          className={navFooterIconClass({ active })}
         >
          <Icon className="h-4 w-4 opacity-95" aria-hidden />
          <span className="sr-only">{item.label}</span>
         </Link>
        )
       })}
      </div>
     ) : null}
     <Button
      type="button"
      variant="secondary"
      className={cn("w-full transition-all hover:opacity-95", collapsed && "px-2")}
      title={collapsed ? `你登入為 ${userDisplayName} · 登出` : undefined}
      onClick={logout}
     >
      {!collapsed ? "登出" : "出"}
     </Button>
    </div>
   </aside>

   <main className="min-h-0 flex-1 overflow-y-auto bg-background">
    <div className="mx-auto min-h-full max-w-[1600px] px-5 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 lg:px-10 lg:py-12">
     <Outlet />
    </div>
   </main>
   <ApoAssistant role={role} />
  </div>
 )
}
