import { Link } from "react-router-dom"
import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import { resolveMobilePageTitle } from "@/lib/mobileNav"
import type { Role } from "@/lib/navStructure"

type MobileHeaderProps = {
 pathname: string
 role: Role
 onOpenNav: () => void
}

export function MobileHeader({ pathname, role, onOpenNav }: MobileHeaderProps) {
 const title = resolveMobilePageTitle(pathname, role)

 return (
  <header className="sticky top-0 z-40 shrink-0 border-b border-white/10 bg-gradient-to-r from-[#1e3a6e] via-[#2A4E8A] to-[#3B6AB3] text-white shadow-sm">
   <div className="flex items-center gap-2 px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
    <Button
     type="button"
     variant="ghost"
     size="icon"
     className="h-10 w-10 shrink-0 text-white hover:bg-white/10"
     onClick={onOpenNav}
     aria-label="開啟選單"
    >
     <Menu className="h-5 w-5" aria-hidden />
    </Button>
    <div className="min-w-0 flex-1">
     <p className="truncate text-base font-semibold tracking-tight">{title}</p>
     <p className="truncate text-xs text-white/75">明學補習社</p>
    </div>
    <Link
     to="/Home"
     className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-white/90 transition-colors hover:bg-white/10"
    >
     首頁
    </Link>
   </div>
  </header>
 )
}
