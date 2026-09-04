import {
 CalendarDays,
 ClipboardCheck,
 Home,
 Inbox,
 LayoutGrid,
 Settings,
 Wallet,
} from "lucide-react"

import { pathIsActive, type NavEntryDef, type NavLeafDef } from "@/lib/navStructure"

/** 財務專用主選單：固定 6 個頂層列，與 NAV_STRUCTURE 分開。 */
export const FINANCE_MAIN_NAV: NavEntryDef[] = [
 { kind: "leaf", path: "/Home", label: "首頁", roles: ["finance"], icon: Home },
 { kind: "leaf", path: "/Payroll", label: "計糧", roles: ["finance"], icon: Wallet },
 {
  kind: "leaf",
  path: "/AttendanceRecords",
  label: "出席紀錄",
  roles: ["finance"],
  icon: ClipboardCheck,
 },
 { kind: "leaf", path: "/PaymentHistory", label: "繳費紀錄", roles: ["finance"], icon: Wallet },
 {
  kind: "group",
  id: "finance-schedule",
  label: "排程",
  icon: CalendarDays,
  children: [
   { path: "/Schedule", label: "清單", roles: ["finance"], icon: CalendarDays },
   { path: "/Schedule?view=day", label: "日視圖", roles: ["finance"], icon: CalendarDays },
  ],
 },
 { kind: "leaf", path: "/AllFeatures", label: "所有功能", roles: ["finance"], icon: LayoutGrid },
]

/** 財務「所有功能」網站地圖。 */
export const FINANCE_ALL_FEATURES_NAV: NavEntryDef[] = [
 {
  kind: "group",
  id: "finance-map-home",
  label: "首頁與通知",
  icon: Home,
  children: [
   { path: "/Home", label: "首頁", roles: ["finance"], icon: Home },
   { path: "/Inbox", label: "收件匣", roles: ["finance"], icon: Inbox },
  ],
 },
 {
  kind: "group",
  id: "finance-map-payroll",
  label: "計糧與核對",
  icon: Wallet,
  children: [
   { path: "/Payroll", label: "計糧", roles: ["finance"], icon: Wallet },
   { path: "/AttendanceRecords", label: "出席紀錄", roles: ["finance"], icon: ClipboardCheck },
   { path: "/Schedule", label: "清單", roles: ["finance"], icon: CalendarDays },
   { path: "/Schedule?view=day", label: "日視圖", roles: ["finance"], icon: CalendarDays },
  ],
 },
 {
  kind: "group",
  id: "finance-map-payments",
  label: "繳費",
  icon: Wallet,
  children: [
   { path: "/PaymentHistory", label: "繳費紀錄", roles: ["finance"], icon: Wallet },
  ],
 },
 {
  kind: "group",
  id: "finance-map-account",
  label: "設定",
  icon: Settings,
  children: [{ path: "/Settings", label: "設定", roles: ["finance"], icon: Settings }],
 },
]

export function financeNavPathIsActive(pathname: string, itemPath: string): boolean {
 return pathIsActive(pathname, itemPath)
}

export function financeNavEntryIsActive(pathname: string, entry: NavEntryDef): boolean {
 if (entry.kind === "leaf") return financeNavPathIsActive(pathname, entry.path)
 return entry.children.some((child) => financeNavPathIsActive(pathname, child.path))
}

/** 財務手機頂欄標題；以最長匹配優先。 */
export function resolveFinancePageTitle(pathname: string): string | null {
 let bestLabel: string | null = null
 let bestLength = -1
 const visit = (item: NavLeafDef) => {
  if (!pathIsActive(pathname, item.path)) return
  if (item.path.length >= bestLength) {
   bestLabel = item.label
   bestLength = item.path.length
  }
 }

 for (const entry of [...FINANCE_MAIN_NAV, ...FINANCE_ALL_FEATURES_NAV]) {
  if (entry.kind === "leaf") visit(entry)
  else entry.children.forEach(visit)
 }

 return bestLabel
}
