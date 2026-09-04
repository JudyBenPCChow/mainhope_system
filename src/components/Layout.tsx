import { Link, Navigate, Outlet, useLocation } from "react-router-dom"
import { useEffect, useMemo, useState } from "react"
import {
 ChevronDown,
 ChevronLeft,
 ChevronRight,
 Flame,
 Inbox,
 PanelLeftClose,
 PanelLeftOpen,
} from "lucide-react"

import { AdminMainTopBar } from "@/components/account/AdminMainTopBar"
import { AdminSidebarFooter } from "@/components/account/AdminSidebarFooter"
import { adminContentShellClass, adminPageSurfaceClass } from "@/components/detail/AdminPageHeader"
import { RecordPreviewProvider } from "@/components/recordPreview/recordPreviewContext"
import { RecordPreviewRail } from "@/components/recordPreview/RecordPreviewRail"
import { RoleSwitcher } from "@/components/account/RoleSwitcher"
import { ApoAssistant } from "@/components/assistant/ApoAssistant"
import { ChickenGentlemanNudge } from "@/components/home/ChickenGentlemanNudge"
import { HomeActionsPreviewPanel } from "@/components/home/AdminHomeActionRail"
import { Button } from "@/components/ui/button"
import { useInboxUnreadCount } from "@/hooks/useInboxUnreadCount"
import { useTeacherHomeworkNavFlags } from "@/hooks/useHomeworkTutoringNavVisible"
import { useAuth } from "@/lib/authBootstrap"
import { AppBannerViewport } from "@/lib/appBanner"
import { clearAuthState } from "@/lib/authSession"
import { signOutAuth } from "@/lib/supabaseAuth"
import { usePasswordChangeNudgeBanner } from "@/lib/usePasswordChangeNudgeBanner"
import {
 NAV_STRUCTURE,
 filterFooterNavLeaves,
 filterNavForRole,
 flattenNav,
 isHomeworkTutorOnlyAllowedPath,
 pathIsActive,
} from "@/lib/navStructure"
import { HW_PATH } from "@/lib/homeworkTutoringNav"
import {
 resolveRoleMainNav,
 roleNavEntryIsActive,
 roleNavPathIsActive,
} from "@/lib/roleMainNav"
import {
 navCollapsedIconClass,
 navFooterIconClass,
 navGroupClass,
 adminNavL2IconClass,
 navL1Class,
 navL1IconClass,
 navL2Class,
 navL2IconClass,
 navL2RailClass,
} from "@/lib/navItemStyles"
import { cn } from "@/lib/utils"
import { usesSharedAppShell } from "@/lib/mgmtRole"

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
 const useShell = usesSharedAppShell(role)
 const { homeworkTutoringNavVisible, homeworkTutorOnly } = useTeacherHomeworkNavFlags()
 const teacherNavFlags = useMemo(
  () => ({ homeworkTutoringNavVisible, homeworkTutorOnly }),
  [homeworkTutoringNavVisible, homeworkTutorOnly]
 )
 const userDisplayName =
  profile?.displayName?.trim() ||
  profile?.email ||
  (typeof localStorage !== "undefined" ? localStorage.getItem("mgmt_display_name") : null)?.trim() ||
  (typeof localStorage !== "undefined" ? localStorage.getItem("mgmt_email") : null) ||
  "用戶"

 const navEntries = useMemo(() => {
  if (!role) return []
  return resolveRoleMainNav(role, teacherNavFlags)
 }, [role, teacherNavFlags])
 const footerNavLeaves = useMemo(() => {
  if (!role) return []
  const byRole = filterFooterNavLeaves(filterNavForRole(role, NAV_STRUCTURE))
  if (role === "teacher" && homeworkTutorOnly) {
   return byRole.filter((e) => isHomeworkTutorOnlyAllowedPath(e.path))
  }
  return byRole
 }, [role, homeworkTutorOnly])
 const { unreadCount } = useInboxUnreadCount()

 const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set())
 const [shellOpenGroup, setShellOpenGroup] = useState<string | null>(null)

 useEffect(() => {
  const pathname = location.pathname
  if (useShell && role) {
   const activeGroup = navEntries.find(
    (entry) =>
     entry.kind === "group" &&
     entry.children.some((child) => roleNavPathIsActive(role, pathname, child.path))
   )
   if (activeGroup?.kind === "group") setShellOpenGroup(activeGroup.id)
   return
  }
  setOpenGroups((prev) => {
   const next = new Set(prev)
   for (const e of navEntries) {
    if (e.kind !== "group") continue
    const hasActive = e.children.some((c) => pathIsActive(pathname, c.path))
    if (hasActive) next.add(e.id)
   }
   return next
  })
 }, [location.pathname, navEntries, role, useShell])

 const logout = () => {
  void (async () => {
   clearAuthState()
   await signOutAuth()
   window.location.href = "/Login"
  })()
 }

 if (
  ready &&
  role === "teacher" &&
  homeworkTutorOnly &&
  !isHomeworkTutorOnlyAllowedPath(location.pathname)
 ) {
  return <Navigate to={HW_PATH.submit} replace />
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

 const collapsedLinks = useShell ? [] : flattenNav(navEntries)
 const leafActive = (itemPath: string) => {
  const [path, qs] = itemPath.split("?")
  const pathOk = role
   ? roleNavPathIsActive(role, location.pathname, path)
   : pathIsActive(location.pathname, path)
  if (!pathOk) return false
  if (path === "/Schedule") {
   const wantDay = new URLSearchParams(qs ?? "").get("view") === "day"
   const haveDay = new URLSearchParams(location.search).get("view") === "day"
   return wantDay === haveDay
  }
  return true
 }
 const entryActive = (entry: (typeof navEntries)[number]) =>
  role
   ? roleNavEntryIsActive(role, location.pathname, entry)
   : entry.kind === "leaf"
     ? pathIsActive(location.pathname, entry.path)
     : entry.children.some((c) => pathIsActive(location.pathname, c.path))

 return (
  <RecordPreviewProvider>
  <div className="flex h-svh min-h-0 w-full overflow-hidden bg-brand-bg">
   <AppBannerViewport />
   <aside
    className={cn(
     "relative z-10 flex h-full min-h-0 shrink-0 flex-col overflow-hidden border-r text-white transition-[width] duration-200 ease-out",
     useShell
      ? "border-white/[0.12] bg-[linear-gradient(180deg,#1e3a6e_0%,#2A4E8A_58%,#3B6AB3_100%)] shadow-[6px_0_28px_-12px_rgba(23,45,87,0.58)]"
      : "border-white/10 bg-gradient-to-b from-[#1e3a6e] via-[#2A4E8A] to-[#3B6AB3] shadow-[4px_0_24px_-4px_rgba(30,58,110,0.35)]",
     collapsed ? "w-[4.25rem]" : useShell ? "w-64" : "w-60 md:w-64"
    )}
   >
    <div
     className={cn(
      "flex shrink-0 items-center justify-between gap-2 border-b",
      useShell
       ? "min-h-[4.625rem] border-white/10 py-3.5 pl-4 pr-3"
       : "border-white/10 px-3 py-4"
     )}
    >
     {!collapsed && (
      <div className="min-w-0 leading-tight">
       <div
        className={cn(
         "tracking-tight",
         useShell ? "text-[1.02rem] font-bold" : "text-[1.00625rem] font-semibold"
        )}
       >
        明學教育
       </div>
       <div
        className={cn(
         useShell ? "mt-px text-[0.8rem] text-white/72" : "text-[0.8625rem] text-white/80"
        )}
       >
        管理系統
       </div>
      </div>
     )}
     <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
       "shrink-0 text-white",
       useShell
        ? "h-[2.375rem] w-[2.375rem] rounded-[0.625rem] bg-white/8 hover:bg-white/18"
        : "h-9 w-9 hover:bg-white/10",
       collapsed && "mx-auto"
      )}
     onClick={() =>
      setCollapsed((current) => {
       const next = !current
       if (next && useShell) setShellOpenGroup(null)
       localStorage.setItem("mgmt_sidebar_collapsed", String(next))
       return next
      })
     }
      aria-label={collapsed ? "展開側欄" : "收起側欄"}
     >
      {useShell ? (
       collapsed ? (
        <PanelLeftOpen className="h-5 w-5" />
       ) : (
        <PanelLeftClose className="h-5 w-5" />
       )
      ) : collapsed ? (
       <ChevronRight className="h-4 w-4" />
      ) : (
       <ChevronLeft className="h-4 w-4" />
      )}
     </Button>
    </div>

    <nav
     className={cn(
      "flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden px-3 py-4 overscroll-contain",
      useShell && "py-3.5",
      collapsed && "items-center px-2"
     )}
     aria-label="主選單"
    >
     {collapsed
      ? useShell
       ? navEntries.map((entry) => {
         const active = entryActive(entry)
         const Icon = entry.icon
         if (entry.kind === "group") {
          return (
           <button
            key={entry.id}
            type="button"
            title={entry.label}
            aria-label={`展開${entry.label}`}
            aria-expanded={false}
            className={navCollapsedIconClass({ active, admin: true })}
            onClick={() => {
             setCollapsed(false)
             setShellOpenGroup(entry.id)
             localStorage.setItem("mgmt_sidebar_collapsed", "false")
            }}
           >
            <Icon className={navL1IconClass} aria-hidden />
            <span className="sr-only">{entry.label}</span>
           </button>
          )
         }
         return (
          <Link
           key={`${entry.path}::${entry.label}`}
           to={entry.path}
           title={entry.label}
           className={navCollapsedIconClass({ active, admin: true })}
          >
           <Icon className={navL1IconClass} aria-hidden />
           <span className="sr-only">{entry.label}</span>
          </Link>
         )
        })
       : collapsedLinks.map((item) => {
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
         const active = leafActive(entry.path)
         const Icon = entry.icon
         return (
          <Link
           key={`${entry.path}::${entry.label}`}
           to={entry.path}
           className={navL1Class({ active, admin: useShell })}
          >
           <Icon className={navL1IconClass} aria-hidden />
           <span className="truncate">{entry.label}</span>
          </Link>
         )
        }

        const open = useShell ? shellOpenGroup === entry.id : openGroups.has(entry.id)
        const groupActive = entryActive(entry)
        const GroupIcon = entry.icon

        return (
         <div key={entry.id} className="flex flex-col gap-0.5">
          <button
           type="button"
           className={navGroupClass({ childActive: groupActive, admin: useShell })}
           aria-expanded={open}
           onClick={() => {
            if (useShell) {
             setShellOpenGroup((current) => (current === entry.id ? null : entry.id))
             return
            }
            setOpenGroups((prev) => {
             const next = new Set(prev)
             if (next.has(entry.id)) next.delete(entry.id)
             else next.add(entry.id)
             return next
            })
           }}
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
          <div className={navL2RailClass({ open, admin: useShell })}>
           {open
            ? entry.children.map((child) => {
              const active = leafActive(child.path)
              const ChildIcon = child.icon
              return (
               <Link
                key={`${child.path}::${child.label}`}
                to={child.path}
                className={navL2Class({ active, admin: useShell })}
               >
                <ChildIcon
                 className={useShell ? adminNavL2IconClass : navL2IconClass}
                 aria-hidden
                />
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

    {useShell ? (
     <AdminSidebarFooter
      collapsed={collapsed}
      onLogout={logout}
     />
    ) : (
    <div className="shrink-0 border-t border-white/10 bg-gradient-to-t from-[#1e3a6e]/90 to-transparent p-3 md:p-4 text-[0.8625rem]">
     {!collapsed ? (
      <div className="mb-3">
       <RoleSwitcher />
      </div>
     ) : null}
     {!collapsed ? (
      <Link
       to="/Inbox"
       className={cn(
        "mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-white/90 transition-colors hover:bg-white/10",
        pathIsActive(location.pathname, "/Inbox") && "bg-white/15 text-white"
       )}
       aria-label={unreadCount > 0 ? `收件匣，${unreadCount} 則未讀` : "收件匣"}
      >
       <Inbox className="h-4 w-4 shrink-0 opacity-95" aria-hidden />
       <span className="min-w-0 flex-1 truncate font-medium">收件匣</span>
       {unreadCount > 0 ? (
        <Flame className="h-4 w-4 shrink-0 text-orange-400" aria-hidden />
       ) : null}
      </Link>
     ) : (
      <Link
       to="/Inbox"
       title={unreadCount > 0 ? `收件匣（${unreadCount} 未讀）` : "收件匣"}
       aria-label={unreadCount > 0 ? `收件匣，${unreadCount} 則未讀` : "收件匣"}
       className={cn(
        "mb-2 flex items-center justify-center rounded-lg p-2 text-white/90 hover:bg-white/10",
        pathIsActive(location.pathname, "/Inbox") && "bg-white/15 text-white"
       )}
      >
       <span className="relative inline-flex">
        <Inbox className="h-4 w-4 opacity-95" aria-hidden />
        {unreadCount > 0 ? (
         <Flame className="absolute -right-2 -top-2 h-3 w-3 text-orange-400" aria-hidden />
        ) : null}
       </span>
      </Link>
     )}
     {!collapsed && (
      <div className="mb-3 flex items-center gap-2">
       <div
        className="min-w-0 flex-1 truncate rounded-lg bg-white/10 px-3 py-2 text-white/90"
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
    )}
   </aside>

   <div className="flex min-h-0 min-w-0 flex-1">
   <main
    className={cn(
     "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
     useShell ? adminPageSurfaceClass : "bg-background"
    )}
   >
    {useShell ? (
     <AdminMainTopBar pathname={location.pathname} unreadCount={unreadCount} />
    ) : null}
    <div className="h-full min-h-0 flex-1 overflow-y-auto">
     <div
      className={cn(
       useShell
        ? adminContentShellClass
        : "mx-auto flex min-h-full w-full max-w-[1600px] flex-col px-5 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 lg:px-10 lg:py-12 has-[[data-sticky-list-shell]]:h-full has-[[data-sticky-list-shell]]:min-h-0 has-[[data-sticky-list-shell]]:overflow-hidden"
      )}
     >
      <Outlet />
     </div>
    </div>
   </main>
   <RecordPreviewRail
    empty={role === "admin" ? <HomeActionsPreviewPanel /> : undefined}
   />
   </div>
   <ApoAssistant role={role} />
   <ChickenGentlemanNudge role={role} />
  </div>
  </RecordPreviewProvider>
 )
}
