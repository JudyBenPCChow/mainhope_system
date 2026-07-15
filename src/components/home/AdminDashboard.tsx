import { useCallback, useEffect, useState } from "react"

import { AdminHomeStudentsTrialsPanel } from "@/components/home/AdminHomeStudentsTrialsPanel"
import { DashboardBoard } from "@/components/home/DashboardBoard"
import { DashboardTopMetrics } from "@/components/home/DashboardTopMetrics"
import { RecentPaymentsCard } from "@/components/home/RecentPaymentsCard"
import { RevenueChart } from "@/components/home/RevenueChart"
import { UnpaidAlert } from "@/components/home/UnpaidAlert"
import { dashboardTitleDate, todayYmdLocal } from "@/components/home/format"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DEMO_ADMIN_GREETING_NAME } from "@/lib/demoMgmtPersonas"
import { clearAuthState } from "@/lib/authSession"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { supabase } from "@/lib/supabaseClient"
import {
 fetchAdminDashboard,
 fetchScheduleBoardForDate,
 type AdminDashboardPayload,
 type DashboardTodayClassCard,
} from "@/services/dashboard"

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
 todosToday: [],
 roomVacancy: [],
 todayLeaves: [],
}

const HOME_TAB_SCHEDULE = "schedule"
const HOME_TAB_STUDENTS = "students-trials"
const HOME_TAB_PAYMENTS = "payments"

export function AdminDashboard() {
 const greetingName =
  (typeof localStorage !== "undefined" ? localStorage.getItem("mgmt_display_name") : null) ||
  DEMO_ADMIN_GREETING_NAME

 const [data, setData] = useState<AdminDashboardPayload>(empty)
 const [loading, setLoading] = useState(true)
 const [scheduleViewYmd, setScheduleViewYmd] = useState(todayYmdLocal)
 const [scheduleBoardCards, setScheduleBoardCards] = useState<DashboardTodayClassCard[]>([])
 const [scheduleBoardLoading, setScheduleBoardLoading] = useState(false)

 const load = useCallback(async () => {
  setLoading(true)
  try {
   const d = await fetchAdminDashboard()
   setData(d)
  } finally {
   setLoading(false)
  }
 }, [])

 useEffect(() => {
  void load()
 }, [load])

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
  <div className="space-y-6 p-4 md:p-6 lg:space-y-8">
   <header className="flex flex-wrap items-end justify-between gap-4">
    <div>
     <p className="text-sm font-medium uppercase tracking-wide text-info/90">管理中心</p>
     <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
      你好，{greetingName}！
     </h1>
     <p className="mt-2 text-base text-muted-foreground md:text-lg">
      今日 {dashboardTitleDate()} · 儀表板與班務總覽
     </p>
    </div>
    <Button
     type="button"
     variant="outline"
     size="default"
     onClick={async () => {
      if (supabase) await supabase.auth.signOut()
      clearAuthState()
      window.location.href = "/Login"
     }}
    >
     登出
    </Button>
   </header>

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

   <Tabs defaultValue={HOME_TAB_SCHEDULE} className="w-full min-w-0">
    <TabsList aria-label="管理中心功能" className="w-full sm:w-auto">
     <TabsTrigger value={HOME_TAB_SCHEDULE}>排程與今日課堂</TabsTrigger>
     <TabsTrigger value={HOME_TAB_STUDENTS}>新增學生及試堂</TabsTrigger>
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
     />
    </TabsContent>

    <TabsContent value={HOME_TAB_PAYMENTS} className="space-y-4">
     <UnpaidAlert items={data.unpaid} total={data.unpaidTotal} loading={loading} />
     <RecentPaymentsCard payments={data.recentPayments} loading={loading} />
     <RevenueChart bars={data.revenueBars} loading={loading} />
    </TabsContent>
   </Tabs>
  </div>
 )
}
