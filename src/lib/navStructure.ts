import type { LucideIcon } from "lucide-react"
import {
 AlertTriangle,
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
 MessageSquareQuote,
 NotebookTabs,
 Percent,
 Plus,
 School,
 ScrollText,
 Settings,
 Sparkles,
 UserCog,
 UserRound,
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
 { kind: "leaf", path: "/Users", label: "用戶管理", roles: ["alien"], icon: UserCog },
 { kind: "leaf", path: "/PaymentDiscounts", label: "優惠折扣", roles: ["alien"], icon: Percent },
 { kind: "leaf", path: "/ReferralRebates", label: "推薦回贈", roles: ["alien"], icon: HandCoins },
 { kind: "leaf", path: "/Courses", label: "課程管理", roles: ["alien"], icon: BookOpen },
 {
  kind: "group",
  id: "registry",
  label: "學籍與班務",
  icon: Users,
  children: [
   { path: "/Students", label: "學生管理", roles: ["admin", "alien"], icon: GraduationCap },
   { path: "/PrivateTutoring", label: "一對一學生", roles: ["admin", "alien"], icon: UserRound },
   { path: "/PrivateTutoring", label: "我的一對一學生", roles: ["teacher"], icon: UserRound },
   { path: "/Teachers", label: "老師管理", roles: ["admin", "alien"], icon: UserRound },
   { path: "/Classes", label: "班別管理", roles: ["admin", "alien"], icon: BookOpen },
   { path: "/Classes/New", label: "新增班別", roles: ["admin", "alien"], icon: Plus },
   { path: "/TeacherAvailability", label: "老師檔期規劃", roles: ["admin", "alien"], icon: CalendarClock },
   { path: "/Classes", label: "我的班別", roles: ["teacher"], icon: BookOpen },
   { path: "/Classrooms", label: "課室管理", roles: ["admin", "alien"], icon: School },
   {
    path: "/PortalEnrollmentRequests",
    label: "家長報讀申請",
    roles: ["admin", "alien"],
    icon: ClipboardList,
   },
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
  path: "/Apo",
  label: "阿Po",
  roles: ["alien"],
  icon: Sparkles,
 },
 {
  kind: "leaf",
  path: "/AiReports",
  label: "AI 報表",
  roles: ["alien"],
  icon: Bot,
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
  path: "/ScriptLibrary",
  label: "話術庫",
  roles: ["admin", "alien"],
  icon: MessageSquareQuote,
 },
 {
  kind: "leaf",
  path: "/Calendar",
  label: "待辦事項",
  roles: ["admin", "teacher", "alien"],
  icon: CalendarClock,
 },
 {
  kind: "leaf",
  path: "/EnrollmentChanges",
  label: "增退紀錄",
  roles: ["admin", "alien"],
  icon: ScrollText,
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
