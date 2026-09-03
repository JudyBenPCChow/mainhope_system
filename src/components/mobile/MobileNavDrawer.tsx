import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react"
import { Link, useLocation } from "react-router-dom"
import { ChevronDown, Flame, Inbox, X } from "lucide-react"

import { AdminSidebarFooter } from "@/components/account/AdminSidebarFooter"
import { RoleSwitcher } from "@/components/account/RoleSwitcher"
import { Button } from "@/components/ui/button"
import { useInboxUnreadCount } from "@/hooks/useInboxUnreadCount"
import {
 filterFooterNavLeaves,
 filterNavForRole,
 flattenNav,
 isHomeworkTutorOnlyAllowedPath,
 NAV_STRUCTURE,
 pathIsActive,
 type NavEntryDef,
 type Role,
} from "@/lib/navStructure"
import {
 resolveRoleMainNav,
 roleNavEntryIsActive,
 roleNavPathIsActive,
} from "@/lib/roleMainNav"
import {
 adminNavL2IconClass,
 navFooterIconClass,
 navGroupClass,
 navL1Class,
 navL1IconClass,
 navL2Class,
 navL2IconClass,
 navL2RailClass,
} from "@/lib/navItemStyles"
import { cn } from "@/lib/utils"
import { usesSharedAppShell } from "@/lib/mgmtRole"

type MobileNavDrawerProps = {
 open: boolean
 onClose: () => void
 role: Role
 userDisplayName: string
 onLogout: () => void
 homeworkTutoringNavVisible?: boolean
 /** 純功輔導師：側欄收窄至功輔＋共用入口 */
 homeworkTutorOnly?: boolean
}

export function MobileNavDrawer({
 open,
 onClose,
 role,
 userDisplayName,
 onLogout,
 homeworkTutoringNavVisible = true,
 homeworkTutorOnly = false,
}: MobileNavDrawerProps) {
 const location = useLocation()
 const { unreadCount } = useInboxUnreadCount()
 const useShell = usesSharedAppShell(role)
 const teacherNavFlags = useMemo(
  () => ({ homeworkTutoringNavVisible, homeworkTutorOnly }),
  [homeworkTutoringNavVisible, homeworkTutorOnly]
 )
 const navEntries = useMemo(
  () => resolveRoleMainNav(role, teacherNavFlags),
  [role, teacherNavFlags]
 )
 const footerNavLeaves = useMemo(() => {
  const byRole = filterFooterNavLeaves(filterNavForRole(role, NAV_STRUCTURE))
  if (role === "teacher" && homeworkTutorOnly) {
   return byRole.filter((e) => isHomeworkTutorOnlyAllowedPath(e.path))
  }
  return byRole
 }, [role, homeworkTutorOnly])
 const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set())
 const [shellOpenGroup, setShellOpenGroup] = useState<string | null>(null)

 useEffect(() => {
  if (!open) return
  const onKey = (e: KeyboardEvent) => {
   if (e.key === "Escape") onClose()
  }
  window.addEventListener("keydown", onKey)
  return () => window.removeEventListener("keydown", onKey)
 }, [open, onClose])

 useEffect(() => {
  const pathname = location.pathname
  if (useShell) {
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

 useEffect(() => {
  if (open) {
   document.body.style.overflow = "hidden"
   return () => {
    document.body.style.overflow = ""
   }
  }
 }, [open])

 if (!open) return null

 return (
  <div className="fixed inset-0 z-[250]" role="dialog" aria-modal="true" aria-label="主選單">
   <button
    type="button"
    className="absolute inset-0 bg-black/50"
    aria-label="關閉選單"
    onClick={onClose}
   />
   <aside
    className={cn(
     "absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] flex-col overflow-hidden",
     useShell
      ? "border-r border-white/12 bg-[linear-gradient(180deg,#1e3a6e_0%,#2A4E8A_58%,#3B6AB3_100%)] text-white shadow-[6px_0_28px_-12px_rgba(23,45,87,0.58)]"
      : "border-r border-white/10 bg-gradient-to-b from-[#1e3a6e] via-[#2A4E8A] to-[#3B6AB3] text-white shadow-xl",
     "animate-in slide-in-from-left duration-200"
    )}
   >
    <div
     className={cn(
      "flex min-h-[4.625rem] shrink-0 items-center justify-between gap-2 border-b px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]",
      role === "admin" ? "border-white/10" : "border-white/10"
     )}
    >
     <div className="min-w-0 leading-tight">
      <div
       className={cn(
        "tracking-tight",
        useShell ? "text-[1.02rem] font-bold" : "text-[1.00625rem] font-semibold"
       )}
      >
       明學教育
      </div>
      <div className={useShell ? "mt-px text-[0.8rem] text-white/72" : "text-[0.8625rem] text-white/80"}>
       管理系統
      </div>
     </div>
     <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
       "shrink-0 text-white",
       useShell
        ? "h-[2.375rem] w-[2.375rem] rounded-[0.625rem] bg-white/8 hover:bg-white/18"
        : "h-9 w-9 hover:bg-white/10"
      )}
      onClick={onClose}
      aria-label="關閉選單"
     >
      <X className="h-4 w-4" />
     </Button>
    </div>

    <nav
     className={cn(
      "flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain px-3 py-4",
      useShell && "py-3.5"
     )}
     aria-label="主選單"
    >
     {navEntries.map((entry) => (
      <NavEntry
       key={entry.kind === "leaf" ? `${entry.path}::${entry.label}` : entry.id}
       entry={entry}
       role={role}
       pathname={location.pathname}
       openGroups={openGroups}
       setOpenGroups={setOpenGroups}
       shellOpenGroup={shellOpenGroup}
       setShellOpenGroup={setShellOpenGroup}
       useShell={useShell}
       onNavigate={onClose}
      />
     ))}
    </nav>

    {useShell ? (
     <AdminSidebarFooter
      showQuickLinks
      pathname={location.pathname}
      unreadCount={unreadCount}
      footerNavLeaves={footerNavLeaves}
      onNavigate={onClose}
      className="pb-[max(1rem,env(safe-area-inset-bottom))]"
      onLogout={() => {
       onClose()
       onLogout()
      }}
     />
    ) : (
    <div className="shrink-0 border-t border-white/10 bg-gradient-to-t from-[#1e3a6e]/90 to-transparent p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-[0.8625rem]">
     <div className="mb-3">
      <RoleSwitcher />
     </div>
     <Link
      to="/Inbox"
      onClick={onClose}
      className={cn(
       "mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-white/90 transition-colors hover:bg-white/10",
       pathIsActive(location.pathname, "/Inbox") && "bg-white/15 text-white"
      )}
      aria-label={unreadCount > 0 ? `收件匣，${unreadCount} 則未讀` : "收件匣"}
     >
      <Inbox className="h-4 w-4 shrink-0 opacity-95" aria-hidden />
      <span className="min-w-0 flex-1 truncate font-medium">收件匣</span>
      {unreadCount > 0 ? <Flame className="h-4 w-4 shrink-0 text-orange-400" aria-hidden /> : null}
     </Link>
     <div className="mb-3 flex items-center gap-2">
      <div className="min-w-0 flex-1 truncate rounded-lg bg-white/10 px-3 py-2 text-white/90" title={userDisplayName}>
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
         onClick={onClose}
         className={navFooterIconClass({ active })}
        >
         <Icon className="h-4 w-4 opacity-95" aria-hidden />
         <span className="sr-only">{item.label}</span>
        </Link>
       )
      })}
     </div>
     <Button
      type="button"
      variant="secondary"
      className="w-full transition-all hover:opacity-95"
      onClick={() => {
       onClose()
       onLogout()
      }}
     >
      登出
     </Button>
    </div>
    )}
   </aside>
  </div>
 )
}

type NavEntryProps = {
 entry: NavEntryDef
 role: Role
 pathname: string
 openGroups: Set<string>
 setOpenGroups: Dispatch<SetStateAction<Set<string>>>
 shellOpenGroup: string | null
 setShellOpenGroup: Dispatch<SetStateAction<string | null>>
 useShell: boolean
 onNavigate: () => void
}

function NavEntry({
 entry,
 role,
 pathname,
 openGroups,
 setOpenGroups,
 shellOpenGroup,
 setShellOpenGroup,
 useShell,
 onNavigate,
}: NavEntryProps) {
 if (entry.kind === "leaf") {
  const active = roleNavPathIsActive(role, pathname, entry.path)
  const Icon = entry.icon
  return (
   <Link
    to={entry.path}
    onClick={onNavigate}
    className={navL1Class({ active, admin: useShell })}
   >
    <Icon className={navL1IconClass} aria-hidden />
    <span className="truncate">{entry.label}</span>
   </Link>
  )
 }

 const open = useShell ? shellOpenGroup === entry.id : openGroups.has(entry.id)
 const groupActive = roleNavEntryIsActive(role, pathname, entry)
 const GroupIcon = entry.icon

 return (
  <div className="flex flex-col gap-0.5">
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
     className={cn("h-4 w-4 shrink-0 opacity-80 transition-transform duration-200", open && "rotate-180")}
     aria-hidden
    />
   </button>
   <div className={navL2RailClass({ open, admin: useShell })}>
    {open
     ? entry.children.map((child) => {
       const active = roleNavPathIsActive(role, pathname, child.path)
       const ChildIcon = child.icon
       return (
        <Link
         key={`${child.path}::${child.label}`}
         to={child.path}
         onClick={onNavigate}
         className={navL2Class({ active, admin: useShell })}
        >
         <ChildIcon className={useShell ? adminNavL2IconClass : navL2IconClass} aria-hidden />
         <span className="truncate">{child.label}</span>
        </Link>
       )
      })
     : null}
   </div>
  </div>
 )
}

/** 供「所有功能」頁等需要扁平清單時使用 */
export function getMobileFlatNav(role: Role) {
 return flattenNav(filterNavForRole(role, NAV_STRUCTURE))
}
