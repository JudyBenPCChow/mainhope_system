import type { LucideIcon } from "lucide-react"
import {
 AlertTriangle,
 BarChart3,
 BookOpen,
 Bot,
 Building2,
 CalendarDays,
 CalendarRange,
 CalendarClock,
 CalendarX,
 ClipboardCheck,
 ClipboardList,
 DoorOpen,
 FileSearch,
 GraduationCap,
 HandCoins,
 Home,
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
 Sparkles,
 UserCog,
 UserRound,
 UserRoundX,
 Users,
 CircleUser,
 Wallet,
} from "lucide-react"

export type Role = "admin" | "teacher" | "alien"

export type NavLeafDef = {
 path: string
 label: string
 roles: Role[]
 icon: LucideIcon
}

export type NavGroupDef = {
 kind: "group"
 id: string
 label: string
 icon: LucideIcon
 children: NavLeafDef[]
}

export type NavLeafOnly = {
 kind: "leaf"
 path: string
 label: string
 roles: Role[]
 icon: LucideIcon
 /** 預設主選單；footer 僅顯示於側欄底部登入列（icon） */
 placement?: "nav" | "footer"
}

export type NavEntryDef = NavGroupDef | NavLeafOnly

export const NAV_STRUCTURE: NavEntryDef[] = [
 { kind: "leaf", path: "/Home", label: "首頁", roles: ["admin", "teacher", "alien"], icon: Home },
 {
  kind: "leaf",
  path: "/AllFeatures",
  label: "所有功能",
  roles: ["admin", "teacher", "alien"],
  icon: LayoutGrid,
 },
 {
  kind: "group",
  id: "daily-work",
  label: "日常工作",
  icon: ClipboardCheck,
  children: [
   { path: "/FrontDeskWizard", label: "前台指引精靈", roles: ["admin", "alien"], icon: ListOrdered },
   { path: "/TomorrowReminders", label: "明日課堂提醒", roles: ["admin", "alien"], icon: MessageSquareQuote },
   { path: "/Attendance", label: "進行點名", roles: ["admin", "teacher", "alien"], icon: ClipboardCheck },
   { path: "/Calendar", label: "待辦事項", roles: ["admin", "teacher", "alien"], icon: CalendarClock },
   { path: "/ScriptLibrary", label: "話術庫", roles: ["admin", "alien"], icon: MessageSquareQuote },
  ],
 },
 {
  kind: "group",
  id: "students-enrollment",
  label: "學生與報讀",
  icon: Users,
  children: [
   { path: "/Students", label: "學生管理", roles: ["admin", "alien"], icon: GraduationCap },
   {
    path: "/PortalEnrollmentRequests",
    label: "家長報讀申請",
    roles: ["admin", "alien"],
    icon: ClipboardList,
   },
   { path: "/EnrollmentChanges", label: "增退紀錄", roles: ["admin", "alien"], icon: ScrollText },
   { path: "/TrialSessions", label: "試堂紀錄", roles: ["admin", "alien"], icon: Sparkles },
   { path: "/PrivateTutoring", label: "一對一學生", roles: ["admin", "alien"], icon: UserRound },
   { path: "/PrivateTutoring", label: "我的一對一學生", roles: ["teacher"], icon: UserRound },
   { path: "/EnrollmentReports", label: "人數報表", roles: ["admin", "alien"], icon: BarChart3 },
   { path: "/LessonBalanceMismatch", label: "堂數對帳", roles: ["admin", "alien"], icon: Scale },
  ],
 },
 {
  kind: "group",
  id: "classes-teachers",
  label: "班別與教務",
  icon: BookOpen,
  children: [
   { path: "/Classes", label: "班別管理", roles: ["admin", "alien"], icon: BookOpen },
   { path: "/Classes/New", label: "新增班別", roles: ["admin", "alien"], icon: Plus },
   { path: "/Classes", label: "我的班別", roles: ["teacher"], icon: BookOpen },
   { path: "/Teachers", label: "老師管理", roles: ["admin", "alien"], icon: UserRound },
   { path: "/TeacherAvailability", label: "老師檔期規劃", roles: ["admin", "alien"], icon: CalendarClock },
   { path: "/Courses", label: "課程管理", roles: ["alien"], icon: BookOpen },
   { path: "/Classrooms", label: "課室管理", roles: ["admin", "alien"], icon: School },
  ],
 },
 {
  kind: "group",
  id: "schedule-attendance",
  label: "排程與出勤",
  icon: CalendarRange,
  children: [
   { path: "/Schedule", label: "排程管理", roles: ["admin", "teacher", "alien"], icon: CalendarDays },
   { path: "/TeacherTimetable", label: "時間表", roles: ["teacher"], icon: CalendarRange },
   {
    path: "/TeachingRecords",
    label: "教學紀錄",
    roles: ["admin", "teacher", "alien"],
    icon: NotebookPen,
   },
   { path: "/TeacherLeaveWizard", label: "老師請假處理", roles: ["admin", "alien"], icon: UserRoundX },
   { path: "/LeaveManagement", label: "請假管理", roles: ["admin", "alien"], icon: CalendarX },
   { path: "/RoomBooking", label: "預約空房", roles: ["teacher"], icon: DoorOpen },
   { path: "/RoomBookingAdmin", label: "約房審批", roles: ["admin", "alien"], icon: Building2 },
   { path: "/AttendanceRecords", label: "出席紀錄", roles: ["admin", "teacher", "alien"], icon: ClipboardList },
  ],
 },
 {
  kind: "group",
  id: "finance",
  label: "收費與優惠",
  icon: Wallet,
  children: [
   { path: "/Payments", label: "收款登記", roles: ["admin", "alien"], icon: HandCoins },
   { path: "/PaymentHistory", label: "繳費紀錄", roles: ["admin", "alien"], icon: Wallet },
   { path: "/PaymentDiscounts", label: "優惠折扣", roles: ["admin", "alien"], icon: Percent },
   { path: "/ReferralRebates", label: "推薦回贈", roles: ["alien"], icon: HandCoins },
  ],
 },
 {
  kind: "group",
  id: "intelligence",
  label: "智能分析",
  icon: Bot,
  children: [
   { path: "/Apo", label: "阿Po", roles: ["alien"], icon: Sparkles },
   { path: "/AiReports", label: "AI 報表", roles: ["alien"], icon: Bot },
  ],
 },
 {
  kind: "group",
  id: "system",
  label: "系統管理",
  icon: Settings,
  children: [
   { path: "/Users", label: "用戶管理", roles: ["alien"], icon: UserCog },
   { path: "/SystemIssues", label: "報錯與問題", roles: ["alien"], icon: AlertTriangle },
   { path: "/SystemLogs", label: "系統日志", roles: ["alien"], icon: FileSearch },
  ],
 },
 {
  kind: "leaf",
  path: "/TeacherProfile",
  label: "個人資料",
  roles: ["teacher"],
  icon: CircleUser,
  placement: "footer",
 },
 {
  kind: "leaf",
  path: "/Settings",
  label: "設定",
  roles: ["admin", "teacher", "alien"],
  icon: Settings,
  placement: "footer",
 },
]

export function filterNavForRole(role: Role, entries: NavEntryDef[]): NavEntryDef[] {
 const out: NavEntryDef[] = []
 for (const e of entries) {
  if (e.kind === "leaf") {
   if (e.roles.includes(role)) out.push(e)
   continue
  }
  const children = e.children.filter((c) => c.roles.includes(role))
  if (children.length === 0) continue
  if (role === "teacher") {
   for (const c of children) {
    out.push({ kind: "leaf", path: c.path, label: c.label, roles: c.roles, icon: c.icon })
   }
   continue
  }
  out.push({ ...e, children })
 }
 return out
}

/** 側欄／抽屜主選單（排除 footer 放置項） */
export function filterMainNavEntries(entries: NavEntryDef[]): NavEntryDef[] {
 return entries.filter((e) => !(e.kind === "leaf" && e.placement === "footer"))
}

/** 側欄底部登入列旁的 icon 導航 */
export function filterFooterNavLeaves(entries: NavEntryDef[]): NavLeafOnly[] {
 return entries.filter((e): e is NavLeafOnly => e.kind === "leaf" && e.placement === "footer")
}

/** 所有功能頁：保留分組層級，僅依角色篩選可見項目 */
export function filterNavForAllFeatures(role: Role, entries: NavEntryDef[]): NavEntryDef[] {
 const out: NavEntryDef[] = []
 for (const e of entries) {
  if (e.kind === "leaf") {
   if (e.path === "/AllFeatures") continue
   if (e.roles.includes(role)) out.push(e)
   continue
  }
  const children = e.children.filter((c) => c.roles.includes(role))
  if (children.length === 0) continue
  out.push({ ...e, children })
 }
 return out
}

export function pathIsActive(pathname: string, itemPath: string): boolean {
 if (itemPath === "/Home") return pathname === "/Home"
 return pathname === itemPath || pathname.startsWith(`${itemPath}/`)
}

export function flattenNav(entries: NavEntryDef[]): NavLeafDef[] {
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

export type FeatureSection =
 | { kind: "group"; label: string; icon: LucideIcon; items: NavLeafDef[] }
 | { kind: "leaves"; label: string; items: NavLeafDef[] }

/** 將導航結構轉為分層區塊（連續的單頁項目合併為「快捷功能」） */
export function buildFeatureSections(role: Role, entries: NavEntryDef[] = NAV_STRUCTURE): FeatureSection[] {
 const filtered = filterNavForAllFeatures(role, entries)
 const sections: FeatureSection[] = []
 let pendingLeaves: NavLeafDef[] = []

 const flushLeaves = () => {
  if (pendingLeaves.length === 0) return
  sections.push({ kind: "leaves", label: "快捷功能", items: pendingLeaves })
  pendingLeaves = []
 }

 for (const e of filtered) {
  if (e.kind === "leaf") {
   pendingLeaves.push({ path: e.path, label: e.label, roles: e.roles, icon: e.icon })
   continue
  }
  flushLeaves()
  sections.push({ kind: "group", label: e.label, icon: e.icon, items: e.children })
 }
 flushLeaves()
 return sections
}
