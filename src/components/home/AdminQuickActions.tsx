import { Link } from "react-router-dom"
import {
 CalendarCheck,
 CalendarDays,
 ChevronRight,
 ClipboardCheck,
 GraduationCap,
 HandCoins,
 Inbox,
 ListOrdered,
 MessageSquareQuote,
 School,
} from "lucide-react"

const QUICK_ACTIONS = [
 {
  path: "/FrontDeskWizard",
  label: "前台指引精靈",
  description: "按情境完成查詢、新生登記及後續安排。",
  icon: ListOrdered,
 },
 {
  path: "/Students",
  label: "學生管理",
  description: "搜尋學生、更新基本資料及處理報讀。",
  icon: GraduationCap,
 },
 {
  path: "/Classes",
  label: "班別管理",
  description: "查閱班別名單、課堂資料及收生情況。",
  icon: School,
 },
 {
  path: "/Schedule",
  label: "排程管理",
  description: "編排課堂、調整時間及查看課室安排。",
  icon: CalendarDays,
 },
 {
  path: "/Attendance",
  label: "進行點名",
  description: "開啟即日課堂點名紙並確認出席狀態。",
  icon: ClipboardCheck,
 },
 {
  path: "/TeacherLeaveWizard",
  label: "老師請假處理",
  description: "整理請假影響，安排代課或補堂跟進。",
  icon: CalendarCheck,
 },
 {
  path: "/Payments",
  label: "收款登記",
  description: "登記學費、核對堂數並建立收據紀錄。",
  icon: HandCoins,
 },
 {
  path: "/TomorrowReminders",
  label: "明日課堂提醒",
  description: "查看明日課堂並準備家長提醒內容。",
  icon: MessageSquareQuote,
 },
 {
  path: "/Inbox",
  label: "收件匣",
  description: "查看排程／班別變動、增退讀、請假與點名提醒。",
  icon: Inbox,
 },
] as const

export function AdminQuickActions() {
 return (
  <section aria-labelledby="admin-quick-actions-title" className="space-y-3">
   <div className="flex items-end justify-between gap-3">
    <div>
     <h2 id="admin-quick-actions-title" className="text-lg font-semibold text-foreground md:text-xl">
      快速功能
     </h2>
     <p className="mt-1 text-sm text-muted-foreground">直接前往常用的行政工作。</p>
    </div>
    <Link
     to="/AllFeatures"
     className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
    >
     所有功能
    </Link>
   </div>

   <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {QUICK_ACTIONS.map((action) => {
     const Icon = action.icon
     return (
      <Link
       key={action.path}
       to={action.path}
       className="group flex min-w-0 items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
       <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-info/10 group-hover:text-info">
        <Icon className="h-5 w-5" aria-hidden />
       </span>
       <span className="min-w-0 flex-1">
        <span className="block font-medium text-foreground">{action.label}</span>
        <span className="mt-1 block text-sm leading-5 text-muted-foreground">
         {action.description}
        </span>
       </span>
       <ChevronRight
        className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        aria-hidden
       />
      </Link>
     )
    })}
   </div>
  </section>
 )
}
