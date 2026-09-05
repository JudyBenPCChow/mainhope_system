import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { CalendarDays, LayoutGrid, TriangleAlert, Wallet } from "lucide-react"

import { AdminPageHeader } from "@/components/detail/AdminPageHeader"
import { AdminHomeMobileActions } from "@/components/home/AdminHomeActionRail"
import { DashboardBoard } from "@/components/home/DashboardBoard"
import { dashboardTitleDate, todayYmdLocal } from "@/components/home/format"
import { Tag } from "@/components/ui/tag"
import { DEMO_ADMIN_GREETING_NAME } from "@/lib/demoMgmtPersonas"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import {
 fetchAdminDashboard,
 fetchScheduleBoardForDate,
 type AdminDashboardPayload,
 type DashboardTodayClassCard,
} from "@/services/dashboard"
import {
 fetchPrivateScheduleTeacherNullAudit,
 type PrivateScheduleTeacherNullAuditRow,
} from "@/services/privateTutoringQueries"

const empty: AdminDashboardPayload = {
 todayClassCount: 0,
 pendingPaymentCount: 0,
 todayClassCards: [],
 todayLeaves: [],
}

const shortcutCardClass =
 "group flex min-h-[4.5rem] flex-col justify-center rounded-xl border border-border bg-card px-3 py-2.5 shadow-sm transition-colors hover:border-primary/35 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

export function AdminDashboard() {
 const greetingName =
  (typeof localStorage !== "undefined" ? localStorage.getItem("mgmt_display_name") : null) ||
  DEMO_ADMIN_GREETING_NAME
 const todayYmd = todayYmdLocal()

 const [data, setData] = useState<AdminDashboardPayload>(empty)
 const [loading, setLoading] = useState(true)
 const [scheduleViewYmd, setScheduleViewYmd] = useState(todayYmdLocal)
 const [scheduleBoardCards, setScheduleBoardCards] = useState<DashboardTodayClassCard[]>([])
 const [scheduleBoardLoading, setScheduleBoardLoading] = useState(false)
 const [teacherNullAudit, setTeacherNullAudit] = useState<PrivateScheduleTeacherNullAuditRow[]>(
  []
 )

 const load = useCallback(async () => {
  setLoading(true)
  try {
   const d = await fetchAdminDashboard()
   setData(d)
  } finally {
   setLoading(false)
  }
 }, [])

 const loadTeacherNullAudit = useCallback(async () => {
  if (!isSupabaseConfigured) {
   setTeacherNullAudit([])
   return
  }
  try {
   setTeacherNullAudit(await fetchPrivateScheduleTeacherNullAudit())
  } catch (e) {
   reportUserFacingError(e, { source: "AdminDashboard.loadTeacherNullAudit" })
   setTeacherNullAudit([])
  }
 }, [])

 useEffect(() => {
  void load()
  void loadTeacherNullAudit()
 }, [load, loadTeacherNullAudit])

 useEffect(() => {
  if (scheduleViewYmd !== todayYmdLocal()) return
  setScheduleBoardCards(data.todayClassCards)
  setScheduleBoardLoading(false)
 }, [scheduleViewYmd, data.todayClassCards])

 useEffect(() => {
  if (scheduleViewYmd === todayYmdLocal()) return
  let cancelled = false
  setScheduleBoardLoading(true)
  void fetchScheduleBoardForDate(scheduleViewYmd).then((r) => {
   if (cancelled) return
   setScheduleBoardCards(r.todayClassCards)
   setScheduleBoardLoading(false)
  })
  return () => {
   cancelled = true
  }
 }, [scheduleViewYmd])

 return (
  <div className="space-y-4 md:space-y-6">
   <AdminPageHeader
    eyebrow="主頁"
    title={`你好，${greetingName}！`}
    description={`${dashboardTitleDate()} · 校舍課堂與請假`}
    afterDescription={
     <nav className="mt-3 grid w-full max-w-2xl grid-cols-2 gap-2 sm:grid-cols-3" aria-label="常用捷徑">
      <Link
       to={`/Schedule?view=byDate&date=${todayYmd}`}
       className={shortcutCardClass}
       aria-label={
        loading ? "今日排程，載入中，前往清單" : `今日排程，${data.todayClassCount} 堂，前往清單`
       }
      >
       <span className="text-2xl font-bold tabular-nums leading-none text-primary">
        {loading ? "…" : data.todayClassCount}
        {!loading ? (
         <span className="ml-1 text-sm font-medium text-muted-foreground">堂</span>
        ) : null}
       </span>
       <span className="mt-1.5 inline-flex items-center gap-1 text-sm text-muted-foreground">
        <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
        今日排程
       </span>
      </Link>
      <Link
       to={`/Schedule?view=day&date=${todayYmd}`}
       className={shortcutCardClass}
       aria-label="課室狀態，前往日視圖"
      >
       <span className="inline-flex items-center gap-1.5 text-lg font-semibold leading-none text-foreground">
        <LayoutGrid className="h-5 w-5 shrink-0 text-primary" aria-hidden />
        課室狀態
       </span>
       <span className="mt-1.5 text-sm text-muted-foreground">前往日視圖</span>
      </Link>
      <Link
       to="/PaymentHistory"
       className={shortcutCardClass}
       aria-label="繳費紀錄，前往繳費紀錄"
      >
       <span className="inline-flex items-center gap-1.5 text-lg font-semibold leading-none text-foreground">
        <Wallet className="h-5 w-5 shrink-0 text-primary" aria-hidden />
        繳費紀錄
       </span>
       <span className="mt-1.5 text-sm text-muted-foreground">前往繳費紀錄</span>
      </Link>
     </nav>
    }
   />

   {!isSupabaseConfigured ? (
    <div
     className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-base text-amber-950 dark:text-amber-100"
     role="status"
    >
     尚未設定 Supabase（純文字 <code className="mx-0.5 rounded bg-muted px-1">.env</code>
     ）。數字將為 0；設定後請重啟 <code className="mx-0.5 rounded bg-muted px-1">npm run dev</code>。
    </div>
   ) : null}

   {teacherNullAudit.length > 0 ? (
    <section
     role="alert"
     className="rounded-xl border-2 border-warning/40 bg-warning/10 p-4 shadow-sm md:p-5"
    >
     <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 space-y-1">
       <h2 className="flex flex-wrap items-center gap-2 text-base font-semibold text-foreground md:text-lg">
        <TriangleAlert className="h-5 w-5 shrink-0 text-warning" aria-hidden />
        私人班排程老師缺漏
        <Tag tone="warning" size="sm">
         {teacherNullAudit.length} 班／
         {teacherNullAudit.reduce((n, r) => n + r.nullScheduleTeacherCount, 0)} 堂
        </Tag>
       </h2>
       <p className="text-sm text-muted-foreground">
        班別已指定任教老師，但仍有排程老師為空；老師時間表會漏堂。請至私人課程頁稽核並同步。
       </p>
      </div>
      <Link
       to="/PrivateTutoring"
       className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
       前往處理 →
      </Link>
     </div>
    </section>
   ) : null}

   <div className="lg:hidden">
    <AdminHomeMobileActions
     pendingPaymentCount={data.pendingPaymentCount}
     loading={loading}
    />
   </div>

   <DashboardBoard
    scheduleViewYmd={scheduleViewYmd}
    onScheduleViewYmdChange={setScheduleViewYmd}
    todayClassCards={scheduleBoardCards}
    scheduleColumnLoading={scheduleBoardLoading}
    todayLeaves={data.todayLeaves}
    loading={loading}
   />
  </div>
 )
}
