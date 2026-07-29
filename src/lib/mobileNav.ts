import type { LucideIcon } from "lucide-react"
import {
 AlertTriangle,
 CalendarDays,
 ClipboardCheck,
 Home,
 LayoutGrid,
 CalendarRange,
} from "lucide-react"

import {
 filterNavForRole,
 flattenNav,
 NAV_STRUCTURE,
 pathIsActive,
 type NavLeafDef,
 type Role,
} from "@/lib/navStructure"

export type MobileTabItem = {
 path: string
 label: string
 icon: LucideIcon
}

export function getMobileBottomTabs(role: Role): MobileTabItem[] {
 switch (role) {
  case "teacher":
   return [
    { path: "/Home", label: "首頁", icon: Home },
    { path: "/Attendance", label: "點名", icon: ClipboardCheck },
    { path: "/TeacherTimetable", label: "時間表", icon: CalendarRange },
    { path: "/AllFeatures", label: "更多", icon: LayoutGrid },
   ]
  case "alien":
   return [
    { path: "/Home", label: "首頁", icon: Home },
    { path: "/Schedule", label: "排程", icon: CalendarDays },
    { path: "/SystemIssues", label: "報錯", icon: AlertTriangle },
    { path: "/AllFeatures", label: "更多", icon: LayoutGrid },
   ]
  case "admin":
  default:
   return [
    { path: "/Home", label: "首頁", icon: Home },
    { path: "/Attendance", label: "點名", icon: ClipboardCheck },
    { path: "/Schedule", label: "排程", icon: CalendarDays },
    { path: "/AllFeatures", label: "更多", icon: LayoutGrid },
   ]
 }
}

/** 依目前路由與角色，從導航結構解析頁面標題 */
export function resolveMobilePageTitle(pathname: string, role: Role): string {
 const leaves = flattenNav(filterNavForRole(role, NAV_STRUCTURE))
 let best: NavLeafDef | null = null
 let bestLen = -1

 for (const leaf of leaves) {
  if (!pathIsActive(pathname, leaf.path)) continue
  if (leaf.path.length > bestLen) {
   best = leaf
   bestLen = leaf.path.length
  }
 }

 if (best) return best.label

 if (pathname.startsWith("/Students/")) return "學生詳情"
 if (pathname.startsWith("/Teachers/")) return "老師詳情"
 if (pathname.startsWith("/Classes/")) {
  return pathname.endsWith("/New") ? "新增班別" : "班別詳情"
 }
 if (pathname.startsWith("/Schedule/")) return "排程詳情"
 if (pathname.startsWith("/Calendar/")) return "待辦詳情"
 if (pathname.startsWith("/Inbox")) return "收件匣"

 return "明學管理"
}

export function tabIsActive(pathname: string, tabPath: string): boolean {
 if (tabPath === "/AllFeatures") {
  return pathname === "/AllFeatures"
 }
 return pathIsActive(pathname, tabPath)
}
