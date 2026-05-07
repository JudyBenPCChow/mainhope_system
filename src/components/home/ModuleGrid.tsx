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

type Mod = {
 to: string
 title: string
 desc: string
 icon: typeof GraduationCap
 card: string
 iconWrap: string
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
    card: "border-sky-100 bg-sky-50/80 hover:bg-sky-50",
    iconWrap: "bg-sky-500 text-white",
   },
   {
    to: "/Teachers",
    title: "老師管理",
    desc: "老師資料、時數及薪酬報表",
    icon: UserCircle,
    card: "border-teal-100 bg-teal-50/80 hover:bg-teal-50",
    iconWrap: "bg-teal-600 text-white",
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
    card: "border-sky-100 bg-sky-50/80 hover:bg-sky-50",
    iconWrap: "bg-sky-600 text-white",
   },
   {
    to: "/Classrooms",
    title: "課室管理",
    desc: "課室配置、時段佔用檢查",
    icon: Building2,
    card: "border-teal-100 bg-teal-50/80 hover:bg-teal-50",
    iconWrap: "bg-teal-500 text-white",
   },
   {
    to: "/Schedule",
    title: "排程管理",
    desc: "課堂排程及衝突檢查",
    icon: CalendarDays,
    card: "border-emerald-100 bg-emerald-50/80 hover:bg-emerald-50",
    iconWrap: "bg-emerald-600 text-white",
   },
   {
    to: "/Attendance",
    title: "進行點名",
    desc: "當日排程點名、預填請假／補堂",
    icon: ClipboardCheck,
    card: "border-amber-100 bg-amber-50/80 hover:bg-amber-50",
    iconWrap: "bg-amber-500 text-white",
   },
   {
    to: "/AttendanceRecords",
    title: "出席紀錄",
    desc: "今日列表、月視表、班別看板",
    icon: ListChecks,
    card: "border-lime-100 bg-lime-50/80 hover:bg-lime-50",
    iconWrap: "bg-lime-600 text-white",
   },
   {
    to: "/LeaveManagement",
    title: "請假管理",
    desc: "請假與補課紀錄",
    icon: ClipboardList,
    card: "border-sky-100 bg-sky-50/80 hover:bg-sky-50",
    iconWrap: "bg-sky-600 text-white",
   },
   {
    to: "/TrialSessions",
    title: "試堂記錄",
    desc: "試聽與轉正追蹤",
    icon: School,
    card: "border-indigo-100 bg-indigo-50/80 hover:bg-indigo-50",
    iconWrap: "bg-indigo-600 text-white",
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
    card: "border-orange-100 bg-orange-50/80 hover:bg-orange-50",
    iconWrap: "bg-orange-500 text-white",
   },
   {
    to: "/Calendar",
    title: "待辦事項",
    desc: "管理待辦（日期、分類、狀態、關聯對象）",
    icon: ListTodo,
    card: "border-sky-100 bg-sky-50/80 hover:bg-sky-50",
    iconWrap: "bg-sky-600 text-white",
   },
   {
    to: "/EnrollmentChanges",
    title: "增退紀錄",
    desc: "全班別報讀／退讀事件查詢",
    icon: ScrollText,
    card: "border-teal-100 bg-teal-50/80 hover:bg-teal-50",
    iconWrap: "bg-teal-600 text-white",
   },
   {
    to: "/PaymentDiscounts",
    title: "優惠折扣",
    desc: "維護繳費可選優惠（僅外星人）",
    icon: Percent,
    card: "border-rose-100 bg-rose-50/80 hover:bg-rose-50",
    iconWrap: "bg-rose-600 text-white",
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
       {g.items.filter((m) => !m.alienOnly || role === "alien").map((m) => (
        <Link
         key={m.to}
         to={m.to}
         className={cn(
          "flex gap-4 rounded-xl border p-5 shadow-sm transition-colors md:p-6",
          m.card
         )}
        >
         <div
          className={cn(
           "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg shadow-sm md:h-14 md:w-14",
           m.iconWrap
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
       ))}
      </div>
     </div>
    ))}
   </div>
  </section>
 )
}
