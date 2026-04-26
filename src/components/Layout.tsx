import { Link, Outlet, useLocation } from "react-router-dom"
import { useEffect, useMemo, useState } from "react"
import type { LucideIcon } from "lucide-react"
import {
 AlertTriangle,
 BookOpen,
 Building2,
 CalendarDays,
 CalendarRange,
 CalendarX,
 ChevronDown,
 ChevronLeft,
 ChevronRight,
 ClipboardCheck,
 ClipboardList,
 DoorOpen,
 FileSearch,
 GraduationCap,
 Home,
 ListTodo,
 NotebookTabs,
 School,
 ScrollText,
 Percent,
 Sparkles,
 UserCog,
 UserRound,
 Users,
 CircleUser,
 Wallet,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Role = "admin" | "teacher" | "alien"

type NavLeafDef = {
 path: string
 label: string
 roles: Role[]
 icon: LucideIcon
}

type NavGroupDef = {
 kind: "group"
 id: string
 label: string
 icon: LucideIcon
 children: NavLeafDef[]
}

type NavLeafOnly = {
 kind: "leaf"
 path: string
 label: string
 roles: Role[]
 icon: LucideIcon
}

type NavEntryDef = NavGroupDef | NavLeafOnly

const NAV_STRUCTURE: NavEntryDef[] = [
 { kind: "leaf", path: "/Home", label: "首頁", roles: ["admin", "teacher", "alien"], icon: Home },
 { kind: "leaf", path: "/SystemLogs", label: "系統日志", roles: ["alien"], icon: FileSearch },
 { kind: "leaf", path: "/SystemIssues", label: "報錯與問題", roles: ["alien"], icon: AlertTriangle },
 {
  kind: "leaf",
  path: "/Attendance",
  label: "進行點名",
  roles: ["admin", "teacher", "alien"],
  icon: ClipboardCheck,
 },
 { kind: "leaf", path: "/TeacherTimetable", label: "時間表", roles: ["teacher"], icon: CalendarRange },
 { kind: "leaf", path: "/TeacherProfile", label: "個人資料", roles: ["teacher"], icon: CircleUser },
 { kind: "leaf", path: "/Users", label: "用戶管理", roles: ["alien"], icon: UserCog },
 { kind: "leaf", path: "/PaymentDiscounts", label: "優惠折扣", roles: ["alien"], icon: Percent },
 {
  kind: "group",
  id: "registry",
  label: "學籍與班務",
  icon: Users,
  children: [
   { path: "/Students", label: "學生管理", roles: ["admin", "alien"], icon: GraduationCap },
   { path: "/Teachers", label: "老師管理", roles: ["admin", "alien"], icon: UserRound },
   { path: "/Classes", label: "班別管理", roles: ["admin", "alien"], icon: BookOpen },
   { path: "/Classes", label: "我的班別", roles: ["teacher"], icon: BookOpen },
   { path: "/Classrooms", label: "課室管理", roles: ["admin", "alien"], icon: School },
  ],
 },
 {
  kind: "group",
  id: "schedule",
  label: "排程與出勤",
  icon: CalendarRange,
  children: [
   { path: "/Schedule", label: "排程管理", roles: ["admin", "teacher", "alien"], icon: CalendarDays },
   { path: "/RoomBooking", label: "預約空房", roles: ["teacher"], icon: DoorOpen },
   { path: "/RoomBookingAdmin", label: "約房審批", roles: ["admin", "alien"], icon: Building2 },
   { path: "/AttendanceRecords", label: "出席紀錄", roles: ["admin", "teacher", "alien"], icon: ClipboardList },
  ],
 },
 {
  kind: "group",
  id: "leave-trial",
  label: "請假與試堂",
  icon: NotebookTabs,
  children: [
   { path: "/LeaveManagement", label: "請假管理", roles: ["admin", "alien"], icon: CalendarX },
   { path: "/TrialSessions", label: "試堂紀錄", roles: ["admin", "alien"], icon: Sparkles },
  ],
 },
 {
  kind: "leaf",
  path: "/Payments",
  label: "繳費紀錄",
  roles: ["admin", "alien"],
  icon: Wallet,
 },
 {
  kind: "leaf",
  path: "/Todos",
  label: "待辦事項",
  roles: ["admin", "alien"],
  icon: ListTodo,
 },
 {
  kind: "leaf",
  path: "/EnrollmentChanges",
  label: "增退紀錄",
  roles: ["admin", "alien"],
  icon: ScrollText,
 },
]

function filterNavForRole(role: Role, entries: NavEntryDef[]): NavEntryDef[] {
 const out: NavEntryDef[] = []
 for (const e of entries) {
  if (e.kind === "leaf") {
   if (e.roles.includes(role)) out.push(e)
   continue
  }
  const children = e.children.filter((c) => c.roles.includes(role))
  if (children.length === 0) continue
  // 專班老師：不顯示「學籍與班務」「排程與出勤」分組，子項目改為側欄第一層
  if (role === "teacher" && (e.id === "registry" || e.id === "schedule")) {
   for (const c of children) {
    out.push({ kind: "leaf", path: c.path, label: c.label, roles: c.roles, icon: c.icon })
   }
   continue
  }
  out.push({ ...e, children })
 }
 return out
}

function pathIsActive(pathname: string, itemPath: string): boolean {
 if (itemPath === "/Home") return pathname === "/Home"
 return pathname === itemPath || pathname.startsWith(`${itemPath}/`)
}

function flattenNav(entries: NavEntryDef[]): NavLeafDef[] {
 const out: NavLeafDef[] = []
 for (const e of entries) {
  if (e.kind === "leaf") {
   out.push({ path: e.path, label: e.label, roles: e.roles, icon: e.icon })
  } else {
   out.push(...e.children)
  }
 }
 return out
}

function roleLabel(role: Role | null) {
 if (role === "admin") return "管／管理員"
 if (role === "teacher") return "師／專科班老師"
 if (role === "alien") return "外／外星人"
 return "未登入"
}

const linkBase =
 "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#2A4E8A]"

function initialSidebarCollapsed(): boolean {
 if (typeof localStorage === "undefined") return false
 return localStorage.getItem("mgmt_role") === "alien"
}

export function Layout() {
 const location = useLocation()
 const [collapsed, setCollapsed] = useState(initialSidebarCollapsed)
 const role = (localStorage.getItem("mgmt_role") as Role | null) ?? null

 const navEntries = useMemo(() => (role ? filterNavForRole(role, NAV_STRUCTURE) : []), [role])

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
  localStorage.removeItem("mgmt_role")
  localStorage.removeItem("teacher_id")
  window.location.href = "/"
 }

 if (!role) {
  return (
   <div className="min-h-svh bg-brand-bg">
    <Outlet />
   </div>
  )
 }

 const collapsedLinks = flattenNav(navEntries)

 return (
  <div className="flex h-svh min-h-0 w-full overflow-hidden bg-brand-bg">
   <aside
    className={cn(
     "flex h-full min-h-0 shrink-0 flex-col overflow-hidden border-r border-white/10 bg-gradient-to-b from-[#1e3a6e] via-[#2A4E8A] to-[#3B6AB3] text-white shadow-[4px_0_24px_-4px_rgba(30,58,110,0.35)] transition-[width] duration-200 ease-out",
     collapsed ? "w-[4.25rem]" : "w-60 md:w-64"
    )}
   >
    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3 py-4">
     {!collapsed && (
      <div className="min-w-0 leading-tight">
       <div className="text-sm font-semibold tracking-tight">明學補習社</div>
       <div className="text-xs text-white/80">管理系統</div>
      </div>
     )}
     <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
       "h-9 w-9 shrink-0 text-white hover:bg-white/10",
       collapsed && "mx-auto"
      )}
      onClick={() => setCollapsed((c) => !c)}
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
          className={cn(
           linkBase,
           "w-10 justify-center px-0 py-2.5",
           active && "bg-white/18 font-medium shadow-inner ring-1 ring-white/10"
          )}
         >
          <Icon className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
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
           className={cn(
            linkBase,
            active && "bg-white/18 font-medium shadow-sm ring-1 ring-white/10",
            !active && "hover:bg-white/10 hover:shadow-sm"
           )}
          >
           <Icon className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
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
           className={cn(
            linkBase,
            "w-full justify-between text-left",
            groupActive && "bg-white/10",
            !groupActive && "hover:bg-white/10"
           )}
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
            <GroupIcon className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
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
          <div
           className={cn(
            "ml-2 space-y-0.5 overflow-hidden border-l border-white/15 pl-2 transition-all duration-200",
            open ? "max-h-[28rem] py-1 opacity-100" : "max-h-0 py-0 opacity-0"
           )}
          >
           {open
            ? entry.children.map((child) => {
              const active = pathIsActive(location.pathname, child.path)
              const ChildIcon = child.icon
              return (
               <Link
                key={`${child.path}::${child.label}`}
                to={child.path}
                className={cn(
                 linkBase,
                 "gap-2.5 py-2 pl-3 pr-2 text-[13px]",
                 active && "bg-white/20 font-medium shadow-sm ring-1 ring-white/10",
                 !active && "hover:bg-white/10"
                )}
               >
                <ChildIcon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
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

    <div className="shrink-0 border-t border-white/10 bg-gradient-to-t from-[#1e3a6e]/90 to-transparent p-3 md:p-4 text-xs">
     {!collapsed && (
      <div className="mb-3 rounded-lg bg-white/10 px-3 py-2 text-white/90">
       角色：{roleLabel(role)}
      </div>
     )}
     <Button
      type="button"
      variant="secondary"
      className={cn("w-full transition-all hover:opacity-95", collapsed && "px-2")}
      title={collapsed ? `角色：${roleLabel(role)} · 登出` : undefined}
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
  </div>
 )
}
