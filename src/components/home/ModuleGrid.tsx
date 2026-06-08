import { Link } from "react-router-dom"
import {
 Banknote,
 BookOpen,
 Building2,
 CalendarDays,
 GraduationCap,
 School,
 UserCircle,
 ClipboardCheck,
 ClipboardList,
 ListChecks,
 ListTodo,
 Percent,
 ScrollText,
} from "lucide-react"

import { cn } from "@/lib/utils"

type ModTone = "info" | "success" | "warning" | "neutral"

const TONE_STYLES: Record<ModTone, { card: string; iconWrap: string }> = {
 info: {
  card: "border-info/25 bg-info/5 hover:bg-info/10",
  iconWrap: "bg-info text-info-foreground",
 },
 success: {
  card: "border-success/25 bg-success/5 hover:bg-success/10",
  iconWrap: "bg-success text-success-foreground",
 },
 warning: {
  card: "border-warning/25 bg-warning/5 hover:bg-warning/10",
  iconWrap: "bg-warning text-warning-foreground",
 },
 neutral: {
  card: "border-border bg-muted/30 hover:bg-muted/45",
  iconWrap: "bg-secondary text-secondary-foreground",
 },
}

type Mod = {
 to: string
 title: string
 desc: string
 icon: typeof GraduationCap
 tone: ModTone
 /** 僅外星人（alien）可看見 */
 alienOnly?: boolean
}

const GROUPS: { title: string; items: Mod[] }[] = [
 {
  title: "學員資訊",
  items: [
   {
    to: "/Students",
    title: "學生管理",
    desc: "學生資料、狀態、家長聯絡",
    icon: GraduationCap,
    tone: "info",
   },
   {
    to: "/Teachers",
    title: "老師管理",
    desc: "老師資料、時數及薪酬報表",
    icon: UserCircle,
    tone: "success",
   },
  ],
 },
 {
  title: "課程安排",
  items: [
   {
    to: "/Classes",
    title: "班別管理",
    desc: "課程設定、老師、收費",
    icon: BookOpen,
    tone: "info",
   },
   {
    to: "/Classrooms",
    title: "課室管理",
    desc: "課室配置、時段佔用檢查",
    icon: Building2,
    tone: "success",
   },
   {
    to: "/Schedule",
    title: "排程管理",
    desc: "課堂排程及衝突檢查",
    icon: CalendarDays,
    tone: "info",
   },
   {
    to: "/Attendance",
    title: "進行點名",
    desc: "當日排程點名、預填請假／補堂",
    icon: ClipboardCheck,
    tone: "warning",
   },
   {
    to: "/AttendanceRecords",
    title: "出席紀錄",
    desc: "今日列表、月視表、班別看板",
    icon: ListChecks,
    tone: "success",
   },
   {
    to: "/LeaveManagement",
    title: "請假管理",
    desc: "請假與補課紀錄",
    icon: ClipboardList,
    tone: "info",
   },
   {
    to: "/TrialSessions",
    title: "試堂記錄",
    desc: "試聽與轉正追蹤",
    icon: School,
    tone: "neutral",
   },
  ],
 },
 {
  title: "行政收費",
  items: [
   {
    to: "/Payments",
    title: "繳費記錄",
    desc: "收費、收據、月結報表",
    icon: Banknote,
    tone: "warning",
   },
   {
    to: "/Calendar",
    title: "待辦事項",
    desc: "管理待辦（日期、分類、狀態、關聯對象）",
    icon: ListTodo,
    tone: "info",
   },
   {
    to: "/EnrollmentChanges",
    title: "增退紀錄",
    desc: "全班別報讀／退讀事件查詢",
    icon: ScrollText,
    tone: "success",
   },
   {
    to: "/PaymentDiscounts",
    title: "優惠折扣",
    desc: "維護繳費可選優惠（僅外星人）",
    icon: Percent,
    tone: "neutral",
    alienOnly: true,
   },
  ],
 },
]

export function ModuleGrid() {
 const role =
  typeof localStorage !== "undefined"
   ? (localStorage.getItem("mgmt_role") as "admin" | "teacher" | "alien" | null)
   : null

 return (
  <section className="rounded-xl border border-border bg-card p-5 shadow-sm md:p-6">
   <h2 className="mb-5 text-xl font-semibold md:text-2xl">功能模組</h2>
   <div className="space-y-8">
    {GROUPS.map((g) => (
     <div key={g.title}>
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground md:text-base">
       {g.title}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
       {g.items.filter((m) => !m.alienOnly || role === "alien").map((m) => {
        const styles = TONE_STYLES[m.tone]
        return (
         <Link
          key={m.to}
          to={m.to}
          className={cn(
           "flex gap-4 rounded-xl border p-5 shadow-sm transition-colors md:p-6",
           styles.card
          )}
         >
          <div
           className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg shadow-sm md:h-14 md:w-14",
            styles.iconWrap
           )}
          >
           <m.icon className="h-6 w-6 md:h-7 md:w-7" strokeWidth={2} />
          </div>
          <div className="min-w-0">
           <div className="text-lg font-semibold text-foreground md:text-xl">{m.title}</div>
           <p className="mt-1.5 text-sm leading-snug text-muted-foreground md:text-base">
            {m.desc}
           </p>
          </div>
         </Link>
        )
       })}
      </div>
     </div>
    ))}
   </div>
  </section>
 )
}
