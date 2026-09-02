import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { TriangleAlert } from "lucide-react"

import { AdminPageHeader } from "@/components/detail/AdminPageHeader"
import { AdminHomeStudentsTrialsPanel } from "@/components/home/AdminHomeStudentsTrialsPanel"
import { AdminQuickActions } from "@/components/home/AdminQuickActions"
import { DashboardBoard } from "@/components/home/DashboardBoard"
import { DashboardTopMetrics } from "@/components/home/DashboardTopMetrics"
import { RecentPaymentsCard } from "@/components/home/RecentPaymentsCard"
import { RevenueChart } from "@/components/home/RevenueChart"
import { UnpaidAlert } from "@/components/home/UnpaidAlert"
import { dashboardTitleDate, todayYmdLocal } from "@/components/home/format"
import { Button } from "@/components/ui/button"
import { Tag } from "@/components/ui/tag"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useIsMobile } from "@/hooks/use-mobile"
import { DEMO_ADMIN_GREETING_NAME } from "@/lib/demoMgmtPersonas"
import { clearAuthState } from "@/lib/authSession"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { signOutAuth } from "@/lib/supabaseAuth"
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
 monthRevenue: 0,
 unpaid: [],
 unpaidTotal: 0,
 todaySchedules: [],
 recentPayments: [],
 revenueBars: [],
 studentStatusSlices: [],
 todayClassCards: [],
 roomVacancy: [],
 todayLeaves: [],
}

const HOME_TAB_SCHEDULE = "schedule"
const HOME_TAB_STUDENTS = "students-trials"
const HOME_TAB_PAYMENTS = "payments"

export function AdminDashboard() {
 const isMobile = useIsMobile()
 const greetingName =
  (typeof localStorage !== "undefined" ? localStorage.getItem("mgmt_display_name") : null) ||
  DEMO_ADMIN_GREETING_NAME

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
  <div className="space-y-4 md:space-y-6 lg:space-y-8">
   <AdminPageHeader
    eyebrow="管理中心"
    title={`你好，${greetingName}！`}
    description={
     isMobile ? dashboardTitleDate() : <>今日 {dashboardTitleDate()} · 儀表板與班務總覽</>
    }
    actions={
     <Button
      type="button"
      variant="outline"
      size="default"
      className="hidden md:inline-flex"
      onClick={async () => {
       await signOutAuth()
       clearAuthState()
       window.location.href = "/Login"
      }}
     >
      登出
     </Button>
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

   <DashboardTopMetrics
    todayClassCount={data.todayClassCount}
    pendingPayCount={data.pendingPaymentCount}
    loading={loading}
   />

   <AdminQuickActions />

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

   <Tabs defaultValue={HOME_TAB_SCHEDULE} className="w-full min-w-0">
    <TabsList aria-label="管理中心功能" className="grid w-full grid-cols-3 sm:inline-flex sm:w-auto">
     <TabsTrigger value={HOME_TAB_SCHEDULE}>{isMobile ? "排程" : "排程與今日課堂"}</TabsTrigger>
     <TabsTrigger value={HOME_TAB_STUDENTS}>{isMobile ? "學生" : "新增學生及試堂"}</TabsTrigger>
     <TabsTrigger value={HOME_TAB_PAYMENTS}>繳費</TabsTrigger>
    </TabsList>

    <TabsContent value={HOME_TAB_SCHEDULE} className="space-y-4">
     <DashboardBoard
      scheduleViewYmd={scheduleViewYmd}
      onScheduleViewYmdChange={setScheduleViewYmd}
      todayClassCards={scheduleBoardCards}
      scheduleColumnLoading={scheduleBoardLoading}
      todayLeaves={data.todayLeaves}
      loading={loading}
     />
    </TabsContent>

    <TabsContent value={HOME_TAB_STUDENTS}>
     <AdminHomeStudentsTrialsPanel
      studentStatusSlices={data.studentStatusSlices}
      loading={loading}
      compact={isMobile}
     />
    </TabsContent>

    <TabsContent value={HOME_TAB_PAYMENTS} className="space-y-4">
     <UnpaidAlert items={data.unpaid} total={data.unpaidTotal} loading={loading} />
     <RecentPaymentsCard payments={data.recentPayments} loading={loading} />
     {!isMobile ? <RevenueChart bars={data.revenueBars} loading={loading} /> : null}
    </TabsContent>
   </Tabs>
  </div>
 )
}
