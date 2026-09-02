import { useState } from "react"
import { Link } from "react-router-dom"
import { ChevronRight, LayoutGrid, Search } from "lucide-react"

import { AdminPageHeader } from "@/components/detail/AdminPageHeader"
import {
 ADMIN_ALL_FEATURES_NAV,
 filterAdminFeatureSections,
} from "@/lib/adminNavigation"
import {
 NAV_STRUCTURE,
 buildFeatureSections,
 keepHomeworkTutorOnlyNav,
 stripHomeworkTutoringNav,
} from "@/lib/navStructure"
import { useAuth } from "@/lib/authBootstrap"
import { useTeacherHomeworkNavFlags } from "@/hooks/useHomeworkTutoringNavVisible"
import { cn } from "@/lib/utils"
import { StaggerItem, StaggerList } from "@/components/ui/stagger-list"
import { Input } from "@/components/ui/input"
import { usesSharedAppShell } from "@/lib/mgmtRole"

export function AllFeaturesView() {
 const { ready, role } = useAuth()
 const { homeworkTutoringNavVisible, homeworkTutorOnly } = useTeacherHomeworkNavFlags()
 const [query, setQuery] = useState("")
 if (!ready || !role) return null

 let navSource = NAV_STRUCTURE
 if (role === "teacher" && homeworkTutorOnly) {
  navSource = keepHomeworkTutorOnlyNav(NAV_STRUCTURE)
 } else if (role === "teacher" && !homeworkTutoringNavVisible) {
  navSource = stripHomeworkTutoringNav(NAV_STRUCTURE)
 }
 const allSections = buildFeatureSections(
  role,
  role === "admin" ? ADMIN_ALL_FEATURES_NAV : navSource
 )
 const sections =
  role === "admin" ? filterAdminFeatureSections(allSections, query) : allSections
 const totalCount = allSections.reduce((n, s) => n + s.items.length, 0)
 const shownCount = sections.reduce((n, s) => n + s.items.length, 0)

 return (
  <div className="space-y-6">
   {usesSharedAppShell(role) ? (
    <AdminPageHeader
     eyebrow="網站地圖"
     title="所有功能"
     description={`完整列出行政可使用的功能；目前顯示 ${shownCount} / ${totalCount} 項。`}
    />
   ) : (
    <header>
     <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
      <LayoutGrid className="h-7 w-7 text-info" aria-hidden />
      所有功能
     </h1>
     <p className="mt-2 hidden text-sm text-muted-foreground md:block">
      依系統層面分類，共 {totalCount} 項你可使用的功能。
     </p>
    </header>
   )}

   {role === "admin" ? (
    <div className="relative max-w-md">
     <Search
      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      aria-hidden
     />
     <Input
      type="search"
      value={query}
      onChange={(event) => setQuery(event.target.value)}
      placeholder="搜尋功能…"
      autoComplete="off"
      aria-label="搜尋所有功能"
      className="pl-9"
     />
    </div>
   ) : null}

   {sections.length === 0 ? (
    <p className="text-sm text-muted-foreground" role="status">
     找不到符合「{query.trim()}」的功能。
    </p>
   ) : (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 md:items-start">
     {sections.map((section) => {
      const SectionIcon = section.kind === "group" ? section.icon : LayoutGrid
      return (
       <section
        key={section.label}
        className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
       >
        <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-3 md:px-5">
         <SectionIcon className="h-5 w-5 shrink-0 text-info" aria-hidden />
         <h2 className="text-base font-semibold text-foreground md:text-lg">{section.label}</h2>
         <span className="ml-auto text-xs tabular-nums text-muted-foreground">
          {section.items.length} 項
         </span>
        </div>
        <StaggerList as="ul" className="divide-y divide-border">
         {section.items.map((item) => {
          const Icon = item.icon
          return (
           <StaggerItem key={`${item.path}::${item.label}`} as="li">
            <Link
             to={item.path}
             className={cn(
              "group flex items-center gap-3 px-4 py-3 transition-colors md:px-5 md:py-3.5",
              "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
             )}
            >
             <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-info/10 group-hover:text-info">
              <Icon className="h-4 w-4" aria-hidden />
             </span>
             <span className="min-w-0 flex-1">
              <span className="block truncate font-medium text-foreground">{item.label}</span>
              <span className="mt-0.5 hidden truncate text-xs text-muted-foreground sm:block">
               {item.path}
              </span>
             </span>
             <ChevronRight
              className="h-4 w-4 shrink-0 text-muted-foreground opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100"
              aria-hidden
             />
            </Link>
           </StaggerItem>
          )
         })}
        </StaggerList>
       </section>
      )
     })}
    </div>
   )}
  </div>
 )
}
