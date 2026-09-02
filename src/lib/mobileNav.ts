import type { LucideIcon } from "lucide-react"
import {
 AlertTriangle,
 CalendarCheck,
 CalendarDays,
 ClipboardCheck,
 ClipboardList,
 Home,
 Inbox,
 LayoutGrid,
 CalendarRange,
 Wallet,
} from "lucide-react"

import { HW_PATH } from "@/lib/homeworkTutoringNav"
import { resolveAdminPageTitle } from "@/lib/adminNavigation"
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

export type MobileBottomTabsOptions = {
 /** 純功輔導師：底欄改功輔報更／我的當值 */
 homeworkTutorOnly?: boolean
}

export function getMobileBottomTabs(
 role: Role,
 opts: MobileBottomTabsOptions = {}
): MobileTabItem[] {
 if (role === "teacher" && opts.homeworkTutorOnly) {
  return [
   { path: "/Home", label: "首頁", icon: Home },
   { path: HW_PATH.submit, label: "報更", icon: ClipboardList },
   { path: HW_PATH.myDuty, label: "當值", icon: CalendarCheck },
   { path: "/Inbox", label: "收件匣", icon: Inbox },
   { path: "/AllFeatures", label: "更多", icon: LayoutGrid },
  ]
 }
 switch (role) {
  case "teacher":
   return [
    { path: "/Home", label: "首頁", icon: Home },
    { path: "/Attendance", label: "點名", icon: ClipboardCheck },
    { path: "/TeacherTimetable", label: "時間表", icon: CalendarRange },
    { path: "/Inbox", label: "收件匣", icon: Inbox },
    { path: "/AllFeatures", label: "更多", icon: LayoutGrid },
   ]
  case "finance":
   return [
    { path: "/Home", label: "首頁", icon: Home },
    { path: "/Payroll", label: "計糧", icon: Wallet },
    { path: "/AttendanceRecords", label: "出席", icon: ClipboardCheck },
    { path: "/AllFeatures", label: "更多", icon: LayoutGrid },
   ]
  case "manager":
   return [
    { path: "/Home", label: "首頁", icon: Home },
    { path: "/Schedule", label: "排程", icon: CalendarDays },
    { path: "/Inbox", label: "收件匣", icon: Inbox },
    { path: "/AllFeatures", label: "更多", icon: LayoutGrid },
   ]
  case "alien":
   return [
    { path: "/Home", label: "首頁", icon: Home },
    { path: "/Schedule", label: "排程", icon: CalendarDays },
    { path: "/SystemIssues", label: "報錯", icon: AlertTriangle },
    { path: "/Inbox", label: "收件匣", icon: Inbox },
    { path: "/AllFeatures", label: "更多", icon: LayoutGrid },
   ]
  case "admin":
  default:
   return [
    { path: "/Home", label: "首頁", icon: Home },
    { path: "/Attendance", label: "點名", icon: ClipboardCheck },
    { path: "/Schedule", label: "排程", icon: CalendarDays },
    { path: "/Inbox", label: "收件匣", icon: Inbox },
    { path: "/AllFeatures", label: "更多", icon: LayoutGrid },
   ]
 }
}

/** 依目前路由與角色，從導航結構解析頁面標題 */
export function resolveMobilePageTitle(pathname: string, role: Role): string {
 if (role === "admin") {
  const adminTitle = resolveAdminPageTitle(pathname)
  if (adminTitle) return adminTitle
 }

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
 if (pathname.startsWith("/Inbox")) return "收件匣"

 return "明學管理"
}

export function tabIsActive(pathname: string, tabPath: string): boolean {
 if (tabPath === "/AllFeatures") {
  return pathname === "/AllFeatures"
 }
 return pathIsActive(pathname, tabPath)
}
