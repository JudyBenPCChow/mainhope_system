import type { LucideIcon } from "lucide-react"
import {
  AlertCircle,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Settings,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react"

export type AdminPageId = "overview" | "students" | "fees" | "roster" | "calendar" | "settings"
export type ManagerPageId = "home" | "duty" | "progress" | "fees" | "access"
export type TeacherPageId = "submit" | "myDuty"

export type SandboxNavItem<T extends string> = {
  value: T
  label: string
  icon: LucideIcon
}

/** 側欄一級「功課輔導」底下的各頁（唔用頁內標籤） */
export const ADMIN_NAV: SandboxNavItem<AdminPageId>[] = [
  { value: "overview", label: "概覽", icon: LayoutDashboard },
  { value: "students", label: "報讀學生", icon: Users },
  { value: "fees", label: "月費", icon: Wallet },
  { value: "roster", label: "當值編更", icon: ClipboardList },
  { value: "calendar", label: "功輔校曆", icon: CalendarDays },
  { value: "settings", label: "設定", icon: Settings },
]

export const MANAGER_NAV: SandboxNavItem<ManagerPageId>[] = [
  { value: "home", label: "監督首屏", icon: LayoutDashboard },
  { value: "duty", label: "本月當值", icon: CalendarCheck },
  { value: "progress", label: "報更進度", icon: ClipboardList },
  { value: "fees", label: "月費異常", icon: AlertCircle },
  { value: "access", label: "老師入口", icon: UserCheck },
]

export const TEACHER_NAV: SandboxNavItem<TeacherPageId>[] = [
  { value: "submit", label: "功輔報更", icon: ClipboardList },
  { value: "myDuty", label: "我的當值", icon: CalendarCheck },
]
