import { type ReactElement, useEffect, useState } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import { Layout } from "@/components/Layout"
import { AppBannerProvider } from "@/lib/appBanner"
import { AppConfirmProvider } from "@/lib/appConfirm"
import { bootstrapRoleFromSession } from "@/lib/authSession"
import { type MgmtRole, getMgmtRole } from "@/lib/mgmtRole"
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient"
import TeacherDetail from "@/components/teachers/TeacherDetail"
import Attendance from "@/pages/Attendance"
import AttendanceRecords from "@/pages/AttendanceRecords"
import ClassDetail from "@/pages/ClassDetail"
import EnrollmentChanges from "@/pages/EnrollmentChanges"
import Classrooms from "@/pages/Classrooms"
import Classes from "@/pages/Classes"
import Calendar from "@/pages/Calendar"
import Home from "@/pages/Home"
import LeaveManagement from "@/pages/LeaveManagement"
import PaymentDiscounts from "@/pages/PaymentDiscounts"
import Payments from "@/pages/Payments"
import Schedule from "@/pages/Schedule"
import ScheduleDetail from "@/pages/ScheduleDetail"
import SystemIssues from "@/pages/SystemIssues"
import SystemLogs from "@/pages/SystemLogs"
import RoomBooking from "@/pages/RoomBooking"
import RoomBookingAdmin from "@/pages/RoomBookingAdmin"
import StudentDetail from "@/pages/StudentDetail"
import Students from "@/pages/Students"
import Teachers from "@/pages/Teachers"
import TeacherProfile from "@/pages/TeacherProfile"
import TeacherTimetable from "@/pages/TeacherTimetable"
import TrialSessions from "@/pages/TrialSessions"
import UserManagement from "@/pages/UserManagement"
import Login from "@/pages/Login"

function RequireAuth({ children }: { children: ReactElement }) {
 const role = getMgmtRole()
 if (!role) return <Navigate to="/Login" replace />
 return children
}

function RequireRole({ children, roles }: { children: ReactElement; roles: MgmtRole[] }) {
 const role = getMgmtRole()
 if (!role) return <Navigate to="/Login" replace />
 if (!roles.includes(role)) return <Navigate to="/Home" replace />
 return children
}

export default function App() {
 const [authReady, setAuthReady] = useState(!isSupabaseConfigured)

 useEffect(() => {
  if (!supabase || !isSupabaseConfigured) {
   setAuthReady(true)
   return
  }
  let active = true
  void (async () => {
   const { data } = await supabase.auth.getSession()
   await bootstrapRoleFromSession(data.session)
   if (active) setAuthReady(true)
  })()
  const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
   void bootstrapRoleFromSession(session)
  })
  return () => {
   active = false
   sub.subscription.unsubscribe()
  }
 }, [])

 if (!authReady) {
  return (
   <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">驗證登入狀態中…</div>
  )
 }

 return (
  <AppBannerProvider>
   <AppConfirmProvider>
    <BrowserRouter>
     <Routes>
      <Route path="/" element={<Navigate to="/Home" replace />} />
      <Route path="/Login" element={<Login />} />
      <Route
       element={
        <RequireAuth>
         <Layout />
        </RequireAuth>
       }
      >
       <Route path="Home" element={<Home />} />
       <Route path="Users" element={<RequireRole roles={["alien"]}><UserManagement /></RequireRole>} />
       <Route path="Students" element={<RequireRole roles={["admin", "alien"]}><Students /></RequireRole>} />
       <Route path="Students/:studentId" element={<RequireRole roles={["admin", "alien"]}><StudentDetail /></RequireRole>} />
       <Route path="Teachers" element={<RequireRole roles={["admin", "alien"]}><Teachers /></RequireRole>} />
       <Route path="Teachers/:teacherId" element={<RequireRole roles={["admin", "alien"]}><TeacherDetail /></RequireRole>} />
       <Route path="Classes" element={<RequireRole roles={["admin", "teacher", "alien"]}><Classes /></RequireRole>} />
       <Route path="Classes/:classId" element={<RequireRole roles={["admin", "teacher", "alien"]}><ClassDetail /></RequireRole>} />
       <Route path="Classrooms" element={<RequireRole roles={["admin", "alien"]}><Classrooms /></RequireRole>} />
       <Route path="TeacherTimetable" element={<RequireRole roles={["teacher"]}><TeacherTimetable /></RequireRole>} />
       <Route path="TeacherProfile" element={<RequireRole roles={["teacher"]}><TeacherProfile /></RequireRole>} />
       <Route path="Attendance" element={<RequireRole roles={["admin", "teacher", "alien"]}><Attendance /></RequireRole>} />
       <Route path="AttendanceRecords" element={<RequireRole roles={["admin", "teacher", "alien"]}><AttendanceRecords /></RequireRole>} />
       <Route path="Payments" element={<RequireRole roles={["admin", "alien"]}><Payments /></RequireRole>} />
       <Route path="PaymentDiscounts" element={<RequireRole roles={["alien"]}><PaymentDiscounts /></RequireRole>} />
       <Route path="Calendar" element={<RequireRole roles={["admin", "teacher", "alien"]}><Calendar /></RequireRole>} />
       <Route path="EnrollmentChanges" element={<RequireRole roles={["admin", "alien"]}><EnrollmentChanges /></RequireRole>} />
       <Route path="Schedule/:scheduleId" element={<RequireRole roles={["admin", "teacher", "alien"]}><ScheduleDetail /></RequireRole>} />
       <Route path="Schedule" element={<RequireRole roles={["admin", "teacher", "alien"]}><Schedule /></RequireRole>} />
       <Route path="RoomBooking" element={<RequireRole roles={["teacher"]}><RoomBooking /></RequireRole>} />
       <Route path="RoomBookingAdmin" element={<RequireRole roles={["admin", "alien"]}><RoomBookingAdmin /></RequireRole>} />
       <Route path="LeaveManagement" element={<RequireRole roles={["admin", "alien"]}><LeaveManagement /></RequireRole>} />
       <Route path="TrialSessions" element={<RequireRole roles={["admin", "alien"]}><TrialSessions /></RequireRole>} />
       <Route path="SystemLogs" element={<RequireRole roles={["alien"]}><SystemLogs /></RequireRole>} />
       <Route path="SystemIssues" element={<RequireRole roles={["alien"]}><SystemIssues /></RequireRole>} />
      </Route>
     </Routes>
    </BrowserRouter>
   </AppConfirmProvider>
  </AppBannerProvider>
 )
}
