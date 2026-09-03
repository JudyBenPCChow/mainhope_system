import {
 BookOpen,
 CalendarCheck,
 CalendarDays,
 CalendarRange,
 CircleUser,
 ClipboardCheck,
 ClipboardList,
 DoorOpen,
 Home,
 Inbox,
 LayoutGrid,
 NotebookPen,
 Settings,
 UserRound,
} from "lucide-react"

import { HW_PATH } from "@/lib/homeworkTutoringNav"
import {
 flattenNav,
 pathIsActive,
 type NavEntryDef,
 type NavLeafDef,
} from "@/lib/navStructure"

const TEACHER_HOMEWORK_GROUP_ID = "teacher-homework"

/** 老師專用主選單（有功輔入口）：固定頂層列，與 NAV_STRUCTURE 分開。 */
export const TEACHER_MAIN_NAV: NavEntryDef[] = [
 { kind: "leaf", path: "/Home", label: "首頁", roles: ["teacher"], icon: Home },
 { kind: "leaf", path: "/Attendance", label: "點名", roles: ["teacher"], icon: ClipboardCheck },
 {
  kind: "leaf",
  path: "/TeacherTimetable",
  label: "時間表",
  roles: ["teacher"],
  icon: CalendarRange,
 },
 { kind: "leaf", path: "/Classes", label: "我的班別", roles: ["teacher"], icon: BookOpen },
 { kind: "leaf", path: "/Schedule", label: "排程", roles: ["teacher"], icon: CalendarDays },
 {
  kind: "group",
  id: "teacher-teaching",
  label: "教學與資源",
  icon: NotebookPen,
  children: [
   { path: "/TeachingRecords", label: "教學紀錄", roles: ["teacher"], icon: NotebookPen },
   { path: "/PrivateTutoring", label: "我的私人課程", roles: ["teacher"], icon: UserRound },
   { path: "/RoomBooking", label: "預約空房", roles: ["teacher"], icon: DoorOpen },
   { path: "/AttendanceRecords", label: "出席紀錄", roles: ["teacher"], icon: ClipboardList },
  ],
 },
 {
  kind: "group",
  id: TEACHER_HOMEWORK_GROUP_ID,
  label: "功課輔導",
  icon: ClipboardList,
  children: [
   { path: HW_PATH.submit, label: "功輔報更", roles: ["teacher"], icon: ClipboardList },
   { path: HW_PATH.myDuty, label: "我的當值", roles: ["teacher"], icon: CalendarCheck },
  ],
 },
 { kind: "leaf", path: "/AllFeatures", label: "所有功能", roles: ["teacher"], icon: LayoutGrid },
]

/** 純功輔導師：只保留功輔日常入口。 */
export const TEACHER_HOMEWORK_TUTOR_ONLY_NAV: NavEntryDef[] = [
 { kind: "leaf", path: "/Home", label: "首頁", roles: ["teacher"], icon: Home },
 { kind: "leaf", path: HW_PATH.submit, label: "功輔報更", roles: ["teacher"], icon: ClipboardList },
 { kind: "leaf", path: HW_PATH.myDuty, label: "我的當值", roles: ["teacher"], icon: CalendarCheck },
 { kind: "leaf", path: "/AllFeatures", label: "所有功能", roles: ["teacher"], icon: LayoutGrid },
]

/** 老師「所有功能」網站地圖（一般老師／含功輔入口）。 */
export const TEACHER_ALL_FEATURES_NAV: NavEntryDef[] = [
 {
  kind: "group",
  id: "teacher-map-home",
  label: "首頁與通知",
  icon: Home,
  children: [
   { path: "/Home", label: "首頁", roles: ["teacher"], icon: Home },
   { path: "/Inbox", label: "收件匣", roles: ["teacher"], icon: Inbox },
  ],
 },
 {
  kind: "group",
  id: "teacher-map-class",
  label: "課堂與點名",
  icon: ClipboardCheck,
  children: [
   { path: "/Attendance", label: "點名", roles: ["teacher"], icon: ClipboardCheck },
   { path: "/TeacherTimetable", label: "時間表", roles: ["teacher"], icon: CalendarRange },
   { path: "/Schedule", label: "排程", roles: ["teacher"], icon: CalendarDays },
   { path: "/AttendanceRecords", label: "出席紀錄", roles: ["teacher"], icon: ClipboardList },
  ],
 },
 {
  kind: "group",
  id: "teacher-map-teaching",
  label: "班別與教學",
  icon: BookOpen,
  children: [
   { path: "/Classes", label: "我的班別", roles: ["teacher"], icon: BookOpen },
   { path: "/TeachingRecords", label: "教學紀錄", roles: ["teacher"], icon: NotebookPen },
   { path: "/PrivateTutoring", label: "我的私人課程", roles: ["teacher"], icon: UserRound },
  ],
 },
 {
  kind: "group",
  id: "teacher-map-room",
  label: "課室",
  icon: DoorOpen,
  children: [{ path: "/RoomBooking", label: "預約空房", roles: ["teacher"], icon: DoorOpen }],
 },
 {
  kind: "group",
  id: "teacher-map-homework",
  label: "功課輔導",
  icon: ClipboardList,
  children: [
   { path: HW_PATH.submit, label: "功輔報更", roles: ["teacher"], icon: ClipboardList },
   { path: HW_PATH.myDuty, label: "我的當值", roles: ["teacher"], icon: CalendarCheck },
  ],
 },
 {
  kind: "group",
  id: "teacher-map-account",
  label: "帳戶",
  icon: Settings,
  children: [
   { path: "/TeacherProfile", label: "個人資料", roles: ["teacher"], icon: CircleUser },
   { path: "/Settings", label: "設定", roles: ["teacher"], icon: Settings },
  ],
 },
]

/** 純功輔導師網站地圖。 */
export const TEACHER_HOMEWORK_TUTOR_ONLY_ALL_FEATURES_NAV: NavEntryDef[] = [
 {
  kind: "group",
  id: "teacher-hw-map-home",
  label: "首頁與通知",
  icon: Home,
  children: [
   { path: "/Home", label: "首頁", roles: ["teacher"], icon: Home },
   { path: "/Inbox", label: "收件匣", roles: ["teacher"], icon: Inbox },
  ],
 },
 {
  kind: "group",
  id: "teacher-hw-map-homework",
  label: "功課輔導",
  icon: ClipboardList,
  children: [
   { path: HW_PATH.submit, label: "功輔報更", roles: ["teacher"], icon: ClipboardList },
   { path: HW_PATH.myDuty, label: "我的當值", roles: ["teacher"], icon: CalendarCheck },
  ],
 },
 {
  kind: "group",
  id: "teacher-hw-map-account",
  label: "帳戶",
  icon: Settings,
  children: [
   { path: "/TeacherProfile", label: "個人資料", roles: ["teacher"], icon: CircleUser },
   { path: "/Settings", label: "設定", roles: ["teacher"], icon: Settings },
  ],
 },
]

export type TeacherNavFlags = {
 homeworkTutoringNavVisible: boolean
 homeworkTutorOnly: boolean
}

/** 依功輔旗標回傳老師側欄頂層列。 */
export function resolveTeacherMainNav(flags: TeacherNavFlags): NavEntryDef[] {
 if (flags.homeworkTutorOnly) return TEACHER_HOMEWORK_TUTOR_ONLY_NAV
 if (!flags.homeworkTutoringNavVisible) {
  return TEACHER_MAIN_NAV.filter(
   (entry) => !(entry.kind === "group" && entry.id === TEACHER_HOMEWORK_GROUP_ID)
  )
 }
 return TEACHER_MAIN_NAV
}

/** 依功輔旗標回傳老師「所有功能」真源。 */
export function resolveTeacherAllFeaturesNav(flags: TeacherNavFlags): NavEntryDef[] {
 if (flags.homeworkTutorOnly) return TEACHER_HOMEWORK_TUTOR_ONLY_ALL_FEATURES_NAV
 if (!flags.homeworkTutoringNavVisible) {
  return TEACHER_ALL_FEATURES_NAV.filter(
   (entry) => !(entry.kind === "group" && entry.id === "teacher-map-homework")
  )
 }
 return TEACHER_ALL_FEATURES_NAV
}

export function teacherNavPathIsActive(pathname: string, itemPath: string): boolean {
 return pathIsActive(pathname, itemPath)
}

export function teacherNavEntryIsActive(pathname: string, entry: NavEntryDef): boolean {
 if (entry.kind === "leaf") return teacherNavPathIsActive(pathname, entry.path)
 return entry.children.some((child) => teacherNavPathIsActive(pathname, child.path))
}

/** 老師手機頂欄標題；以最長匹配優先。 */
export function resolveTeacherPageTitle(pathname: string, flags: TeacherNavFlags): string | null {
 let bestLabel: string | null = null
 let bestLength = -1
 const visit = (item: NavLeafDef) => {
  if (!pathIsActive(pathname, item.path)) return
  if (item.path.length >= bestLength) {
   bestLabel = item.label
   bestLength = item.path.length
  }
 }

 const main = resolveTeacherMainNav(flags)
 const map = resolveTeacherAllFeaturesNav(flags)
 for (const entry of [...main, ...map]) {
  if (entry.kind === "leaf") visit(entry)
  else entry.children.forEach(visit)
 }

 return bestLabel
}

export function flattenTeacherNavPaths(flags: TeacherNavFlags): string[] {
 return flattenNav(resolveTeacherMainNav(flags)).map((leaf) => leaf.path)
}
