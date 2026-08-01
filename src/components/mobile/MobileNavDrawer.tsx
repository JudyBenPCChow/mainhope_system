import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react"
import { Link, useLocation } from "react-router-dom"
import { ChevronDown, Flame, Inbox, X } from "lucide-react"

import { RoleSwitcher } from "@/components/account/RoleSwitcher"
import { Button } from "@/components/ui/button"
import { useInboxUnreadCount } from "@/hooks/useInboxUnreadCount"
import {
 filterFooterNavLeaves,
 filterMainNavEntries,
 filterNavForRole,
 flattenNav,
 NAV_STRUCTURE,
 pathIsActive,
 type NavEntryDef,
 type Role,
} from "@/lib/navStructure"
import {
 navFooterIconClass,
 navGroupClass,
 navL1Class,
 navL1IconClass,
 navL2Class,
 navL2IconClass,
 navL2RailClass,
} from "@/lib/navItemStyles"
import { cn } from "@/lib/utils"

type MobileNavDrawerProps = {
 open: boolean
 onClose: () => void
 role: Role
 userDisplayName: string
 onLogout: () => void
}

export function MobileNavDrawer({ open, onClose, role, userDisplayName, onLogout }: MobileNavDrawerProps) {
 const location = useLocation()
 const { unreadCount } = useInboxUnreadCount()
 const navEntries = useMemo(
  () => filterMainNavEntries(filterNavForRole(role, NAV_STRUCTURE)),
  [role]
 )
 const footerNavLeaves = useMemo(
  () => filterFooterNavLeaves(filterNavForRole(role, NAV_STRUCTURE)),
  [role]
 )
 const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set())

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
     "border-r border-white/10 bg-gradient-to-b from-[#1e3a6e] via-[#2A4E8A] to-[#3B6AB3] text-white shadow-xl",
     "animate-in slide-in-from-left duration-200"
    )}
   >
    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
     <div className="min-w-0 leading-tight">
      <div className="text-[1.00625rem] font-semibold tracking-tight">明學教育</div>
      <div className="text-[0.8625rem] text-white/80">管理系統</div>
     </div>
     <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-9 w-9 shrink-0 text-white hover:bg-white/10"
      onClick={onClose}
      aria-label="關閉選單"
     >
      <X className="h-4 w-4" />
     </Button>
    </div>

    <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain px-3 py-4" aria-label="主選單">
     {navEntries.map((entry) => (
      <NavEntry
       key={entry.kind === "leaf" ? `${entry.path}::${entry.label}` : entry.id}
       entry={entry}
       pathname={location.pathname}
       openGroups={openGroups}
       setOpenGroups={setOpenGroups}
       onNavigate={onClose}
      />
     ))}
    </nav>

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
   </aside>
  </div>
 )
}

type NavEntryProps = {
 entry: NavEntryDef
 pathname: string
 openGroups: Set<string>
 setOpenGroups: Dispatch<SetStateAction<Set<string>>>
 onNavigate: () => void
}

function NavEntry({ entry, pathname, openGroups, setOpenGroups, onNavigate }: NavEntryProps) {
 if (entry.kind === "leaf") {
  const active = pathIsActive(pathname, entry.path)
  const Icon = entry.icon
  return (
   <Link
    to={entry.path}
    onClick={onNavigate}
    className={navL1Class({ active })}
   >
    <Icon className={navL1IconClass} aria-hidden />
    <span className="truncate">{entry.label}</span>
   </Link>
  )
 }

 const open = openGroups.has(entry.id)
 const groupActive = entry.children.some((c) => pathIsActive(pathname, c.path))
 const GroupIcon = entry.icon

 return (
  <div className="flex flex-col gap-0.5">
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
     className={cn("h-4 w-4 shrink-0 opacity-80 transition-transform duration-200", open && "rotate-180")}
     aria-hidden
    />
   </button>
   <div className={navL2RailClass({ open })}>
    {open
     ? entry.children.map((child) => {
       const active = pathIsActive(pathname, child.path)
       const ChildIcon = child.icon
       return (
        <Link
         key={`${child.path}::${child.label}`}
         to={child.path}
         onClick={onNavigate}
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
}

/** 供「所有功能」頁等需要扁平清單時使用 */
export function getMobileFlatNav(role: Role) {
 return flattenNav(filterNavForRole(role, NAV_STRUCTURE))
}
