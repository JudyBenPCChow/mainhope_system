import {
 BarChart3,
 BellRing,
 BookOpen,
 Building2,
 CalendarClock,
 CalendarDays,
 CalendarX,
 ClipboardCheck,
 ClipboardList,
 Contact,
 FileText,
 GraduationCap,
 HandCoins,
 Home,
 Inbox,
 LayoutDashboard,
 LayoutGrid,
 ListOrdered,
 MessageSquareQuote,
 NotebookPen,
 Percent,
 Plus,
 Scale,
 School,
 ScrollText,
 Settings,
 UserPlus,
 UserRound,
 UserRoundX,
 Users,
 Wallet,
} from "lucide-react"

import { HW_PATH, isHomeworkTutoringPath } from "@/lib/homeworkTutoringNav"
import {
 filterNavForRole,
 flattenNav,
 NAV_STRUCTURE,
 pathIsActive,
 type FeatureSection,
 type NavEntryDef,
 type NavLeafDef,
 type Role,
} from "@/lib/navStructure"

/** 行政專用主選單：固定 8 個頂層列，與其他角色的 NAV_STRUCTURE 分開。 */
export const ADMIN_MAIN_NAV: NavEntryDef[] = [
 { kind: "leaf", path: "/Home", label: "首頁", roles: ["admin"], icon: Home },
 { kind: "leaf", path: "/Students", label: "學生", roles: ["admin"], icon: Users },
 { kind: "leaf", path: "/Schedule", label: "排程", roles: ["admin"], icon: CalendarDays },
 { kind: "leaf", path: "/Attendance", label: "點名", roles: ["admin"], icon: ClipboardCheck },
 { kind: "leaf", path: "/Payments", label: "收款登記", roles: ["admin"], icon: Wallet },
 {
  kind: "group",
  id: "admin-courses",
  label: "課程",
  icon: BookOpen,
  children: [
   { path: "/Classes", label: "專科班", roles: ["admin"], icon: BookOpen },
   { path: "/PrivateTutoring", label: "私人課程", roles: ["admin"], icon: Users },
   { path: HW_PATH.overview, label: "功課輔導", roles: ["admin"], icon: ClipboardList },
  ],
 },
 {
  kind: "group",
  id: "admin-followup",
  label: "跟進與紀錄",
  icon: BellRing,
  children: [
   { path: "/TomorrowReminders", label: "課堂提醒", roles: ["admin"], icon: BellRing },
   { path: "/LeaveManagement", label: "請假管理", roles: ["admin"], icon: CalendarX },
   { path: "/TrialSessions", label: "試堂紀錄", roles: ["admin"], icon: GraduationCap },
   { path: "/AttendanceRecords", label: "出席紀錄", roles: ["admin"], icon: FileText },
  ],
 },
 { kind: "leaf", path: "/AllFeatures", label: "所有功能", roles: ["admin"], icon: LayoutGrid },
]

/**
 * 行政「所有功能」網站地圖。每條可用路徑只出現一次；分組只服務發現與搜尋，
 * 不會反向改變側欄主入口。
 */
export const ADMIN_ALL_FEATURES_NAV: NavEntryDef[] = [
 {
  kind: "group",
  id: "admin-map-home",
  label: "首頁與收件匣",
  icon: Home,
  children: [
   { path: "/Home", label: "首頁", roles: ["admin"], icon: Home },
   { path: "/Inbox", label: "收件匣", roles: ["admin"], icon: Inbox },
  ],
 },
 {
  kind: "group",
  id: "admin-map-students",
  label: "學生與報讀",
  icon: Users,
  children: [
   { path: "/Students", label: "學生", roles: ["admin"], icon: GraduationCap },
   { path: "/PortalEnrollmentRequests", label: "家長報讀申請", roles: ["admin"], icon: ClipboardList },
   { path: "/EnrollmentChanges", label: "增退紀錄", roles: ["admin"], icon: ScrollText },
   { path: "/PromotionMatch", label: "宣傳配對", roles: ["admin"], icon: UserPlus },
   { path: "/ContactUpdateCampaign", label: "聯絡資料更新", roles: ["admin"], icon: Contact },
  ],
 },
 {
  kind: "group",
  id: "admin-map-courses",
  label: "課程與教學",
  icon: BookOpen,
  children: [
   { path: "/Classes", label: "班別管理", roles: ["admin"], icon: BookOpen },
   { path: "/Classes/New", label: "新增班別", roles: ["admin"], icon: Plus },
   { path: "/AcademicCalendar", label: "專科校曆", roles: ["admin"], icon: CalendarX },
   { path: "/TeachingRecords", label: "教學紀錄", roles: ["admin"], icon: NotebookPen },
   { path: "/PrivateTutoring", label: "私人課程", roles: ["admin"], icon: UserRound },
   { path: HW_PATH.overview, label: "今日情況", roles: ["admin"], icon: LayoutDashboard },
   { path: HW_PATH.students, label: "功輔報讀學生", roles: ["admin"], icon: Users },
   { path: HW_PATH.fees, label: "功輔月費", roles: ["admin"], icon: Wallet },
   { path: HW_PATH.roster, label: "功輔當值編更", roles: ["admin"], icon: ClipboardList },
   { path: HW_PATH.calendar, label: "功輔校曆", roles: ["admin"], icon: CalendarDays },
   { path: HW_PATH.settings, label: "功輔設定", roles: ["admin"], icon: Settings },
  ],
 },
 {
  kind: "group",
  id: "admin-map-followup",
  label: "排程、出席與跟進",
  icon: CalendarDays,
  children: [
   { path: "/Schedule", label: "排程", roles: ["admin"], icon: CalendarDays },
   { path: "/Attendance", label: "點名", roles: ["admin"], icon: ClipboardCheck },
   { path: "/TomorrowReminders", label: "課堂提醒", roles: ["admin"], icon: MessageSquareQuote },
   { path: "/LeaveManagement", label: "請假管理", roles: ["admin"], icon: CalendarX },
   { path: "/TrialSessions", label: "試堂紀錄", roles: ["admin"], icon: GraduationCap },
   { path: "/AttendanceRecords", label: "出席紀錄", roles: ["admin"], icon: FileText },
  ],
 },
 {
  kind: "group",
  id: "admin-map-finance",
  label: "收款與帳務",
  icon: Wallet,
  children: [
   { path: "/Payments", label: "收款登記", roles: ["admin"], icon: HandCoins },
   { path: "/PaymentHistory", label: "繳費紀錄", roles: ["admin"], icon: Wallet },
   { path: "/PaymentDiscounts", label: "優惠折扣", roles: ["admin"], icon: Percent },
   { path: "/ExpenseJournalRecords", label: "日記帳紀錄", roles: ["admin"], icon: ScrollText },
   { path: "/ExpenseJournal", label: "日記帳入帳", roles: ["admin"], icon: NotebookPen },
   { path: "/Payroll", label: "計糧", roles: ["admin"], icon: Wallet },
  ],
 },
 {
  kind: "group",
  id: "admin-map-academics",
  label: "教務與資源",
  icon: School,
  children: [
   { path: "/Teachers", label: "老師管理", roles: ["admin"], icon: UserRound },
   { path: "/TeacherAvailability", label: "老師檔期規劃", roles: ["admin"], icon: CalendarClock },
   { path: "/Classrooms", label: "課室管理", roles: ["admin"], icon: School },
   { path: "/RoomBookingAdmin", label: "約房審批", roles: ["admin"], icon: Building2 },
  ],
 },
 {
  kind: "group",
  id: "admin-map-reports",
  label: "報表與分析",
  icon: BarChart3,
  children: [
   { path: "/LessonBalanceMismatch", label: "堂數對帳", roles: ["admin"], icon: Scale },
   { path: "/PaymentCorrection", label: "單據／堂數更正", roles: ["admin"], icon: Scale },
  ],
 },
 {
  kind: "group",
  id: "admin-map-tools",
  label: "工具與系統",
  icon: Settings,
  children: [
   { path: "/FrontDeskWizard", label: "前台指引精靈", roles: ["admin"], icon: ListOrdered },
   { path: "/TeacherLeaveWizard", label: "老師請假處理", roles: ["admin"], icon: UserRoundX },
   { path: "/ScriptLibrary", label: "話術庫", roles: ["admin"], icon: MessageSquareQuote },
   { path: "/Settings", label: "設定", roles: ["admin"], icon: Settings },
  ],
 },
]

export type AdminWorkspaceId = "payments" | "specialty" | "homework" | "journal"

export type AdminWorkspaceTab = {
 path: string
 label: string
}

export const ADMIN_WORKSPACE_TABS: Record<AdminWorkspaceId, readonly AdminWorkspaceTab[]> = {
 payments: [
  { path: "/Payments", label: "收款登記" },
  { path: "/PaymentHistory", label: "繳費紀錄" },
  { path: "/PaymentDiscounts", label: "優惠折扣" },
 ],
 specialty: [
  { path: "/Classes", label: "班別管理" },
  { path: "/AcademicCalendar", label: "專科校曆" },
  { path: "/TeachingRecords", label: "教學紀錄" },
 ],
 homework: [
  { path: HW_PATH.overview, label: "今日情況" },
  { path: HW_PATH.students, label: "報讀學生" },
  { path: HW_PATH.fees, label: "月費" },
  { path: HW_PATH.roster, label: "當值編更" },
  { path: HW_PATH.calendar, label: "功輔校曆" },
  { path: HW_PATH.settings, label: "設定" },
 ],
 journal: [
  { path: "/ExpenseJournalRecords", label: "日記帳紀錄" },
  { path: "/ExpenseJournal", label: "入帳" },
 ],
}

/** 同一工作域兄弟頁共用簡介，切換分頁時標題區文案穩定。 */
export const ADMIN_WORKSPACE_DESCRIPTION: Record<AdminWorkspaceId, string> = {
 payments: "登記學費、檢視繳費紀錄及管理優惠折扣。",
 specialty: "管理專科班、專科校曆及教學紀錄。",
 homework: "管理功課輔導的今日情況、報讀、月費、當值與校曆。",
 journal: "查閱日記帳紀錄及新增入帳。",
}

/** 工作域頁外殼：全寬、僅垂直間距；留白交由 Layout。 */
export const adminWorkspacePageClass = "space-y-6"

/** 依角色可見路徑篩選工作域分頁（至少兩頁才顯示導航）。 */
export function workspaceTabsForRole(
 workspace: AdminWorkspaceId,
 role: Role | null | undefined
): AdminWorkspaceTab[] {
 const tabs = ADMIN_WORKSPACE_TABS[workspace]
 if (!role) return []
 if (role === "admin") return [...tabs]
 const allowed = new Set(
  flattenNav(filterNavForRole(role, NAV_STRUCTURE)).map((leaf) => leaf.path)
 )
 return tabs.filter((tab) => allowed.has(tab.path))
}

/** 工作域目前路徑；最長前綴優先。僅在該角色可見分頁內比對。 */
export function resolveAdminWorkspacePath(
 workspace: AdminWorkspaceId,
 pathname: string,
 role: Role | null | undefined = "admin"
): string | null {
 let best: AdminWorkspaceTab | null = null
 for (const tab of workspaceTabsForRole(workspace, role)) {
  if (!pathIsActive(pathname, tab.path)) continue
  if (!best || tab.path.length > best.path.length) best = tab
 }
 return best?.path ?? null
}

/** 行政側欄高亮：主入口可涵蓋已移到頁內導航的兄弟頁。 */
export function adminNavPathIsActive(pathname: string, itemPath: string): boolean {
 if (itemPath === "/Payments") return resolveAdminWorkspacePath("payments", pathname) != null
 if (itemPath === "/Classes") return resolveAdminWorkspacePath("specialty", pathname) != null
 if (itemPath === HW_PATH.overview) return isHomeworkTutoringPath(pathname)
 return pathIsActive(pathname, itemPath)
}

export function adminNavEntryIsActive(pathname: string, entry: NavEntryDef): boolean {
 if (entry.kind === "leaf") return adminNavPathIsActive(pathname, entry.path)
 return entry.children.some((child) => adminNavPathIsActive(pathname, child.path))
}

/** 行政手機頂欄標題；以最長匹配避免 `/Classes/New` 被 `/Classes` 蓋過。 */
export function resolveAdminPageTitle(pathname: string): string | null {
 let bestLabel: string | null = null
 let bestLength = -1
 const visit = (item: NavLeafDef) => {
  if (!pathIsActive(pathname, item.path)) return
  if (item.path.length >= bestLength) {
   bestLabel = item.label
   bestLength = item.path.length
  }
 }

 for (const entry of [...ADMIN_MAIN_NAV, ...ADMIN_ALL_FEATURES_NAV]) {
  if (entry.kind === "leaf") visit(entry)
  else entry.children.forEach(visit)
 }

 return bestLabel
}

export function normalizeAdminFeatureQuery(query: string): string {
 return query.trim().toLowerCase().replace(/\s+/g, "")
}

export function filterAdminFeatureSections(
 sections: readonly FeatureSection[],
 query: string
): FeatureSection[] {
 const normalized = normalizeAdminFeatureQuery(query)
 if (!normalized) return [...sections]

 const matches = (item: NavLeafDef) => {
  const label = normalizeAdminFeatureQuery(item.label)
  return label.includes(normalized) || item.path.toLowerCase().includes(normalized)
 }

 return sections.flatMap((section) => {
  const sectionMatches = normalizeAdminFeatureQuery(section.label).includes(normalized)
  const items = sectionMatches ? section.items : section.items.filter(matches)
  if (items.length === 0) return []
  return [{ ...section, items } as FeatureSection]
 })
}
