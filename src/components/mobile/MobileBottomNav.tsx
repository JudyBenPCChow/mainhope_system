import { Link, useLocation } from "react-router-dom"

import { getMobileBottomTabs, tabIsActive } from "@/lib/mobileNav"
import type { Role } from "@/lib/navStructure"
import { cn } from "@/lib/utils"

type MobileBottomNavProps = {
 role: Role
 homeworkTutorOnly?: boolean
}

export function MobileBottomNav({ role, homeworkTutorOnly = false }: MobileBottomNavProps) {
 const { pathname } = useLocation()
 const tabs = getMobileBottomTabs(role, { homeworkTutorOnly })

 return (
  <nav
   className="shrink-0 border-t border-border bg-card shadow-[0_-4px_16px_-8px_rgba(15,23,42,0.2)]"
   aria-label="快捷導覽"
  >
   <div
    className={cn(
     "grid pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1",
     tabs.length >= 5 ? "grid-cols-5" : "grid-cols-4"
    )}
   >
    {tabs.map((tab) => {
     const active = tabIsActive(pathname, tab.path)
     const Icon = tab.icon
     return (
      <Link
       key={tab.path}
       to={tab.path}
       className={cn(
        "flex min-h-10 min-w-0 flex-col items-center gap-0.5 px-0.5 py-1.5 text-[11px] transition-colors",
        active ? "font-semibold text-info" : "text-muted-foreground hover:text-foreground"
       )}
       aria-current={active ? "page" : undefined}
      >
       <span
        className={cn(
         "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
         active ? "bg-info/10" : "bg-transparent"
        )}
       >
        <Icon className="h-[18px] w-[18px]" aria-hidden />
       </span>
       <span className="truncate">{tab.label}</span>
      </Link>
     )
    })}
   </div>
  </nav>
 )
}
