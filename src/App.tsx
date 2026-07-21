import { lazy, Suspense } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { SpeedInsights } from "@vercel/speed-insights/react"

import { AdaptiveLayout } from "@/components/AdaptiveLayout"
import TeacherDetail from "@/components/teachers/TeacherDetail"
import Attendance from "@/pages/Attendance"
import AttendanceRecords from "@/pages/AttendanceRecords"
import ClassDetail from "@/pages/ClassDetail"
import EnrollmentChanges from "@/pages/EnrollmentChanges"
import FrontDeskIntake from "@/pages/FrontDeskIntake"
import FrontDeskWizard from "@/pages/FrontDeskWizard"
import PortalEnrollmentRequests from "@/pages/PortalEnrollmentRequests"
import Classrooms from "@/pages/Classrooms"
import Classes from "@/pages/Classes"
import ClassNew from "@/pages/ClassNew"
import TeacherAvailability from "@/pages/TeacherAvailability"
import Calendar from "@/pages/Calendar"
import AcademicCalendar from "@/pages/AcademicCalendar"
import TodoDetail from "@/pages/TodoDetail"
import AllFeatures from "@/pages/AllFeatures"
import Home from "@/pages/Home"
import LeaveManagement from "@/pages/LeaveManagement"
import LessonBalanceMismatch from "@/pages/LessonBalanceMismatch"
import Login from "@/pages/Login"
import Courses from "@/pages/Courses"
import PaymentDiscounts from "@/pages/PaymentDiscounts"
import PrivateTutoring from "@/pages/PrivateTutoring"
import ReferralRebates from "@/pages/ReferralRebates"
import PaymentHistory from "@/pages/PaymentHistory"
import Payments from "@/pages/Payments"
import MonthlyTuition from "@/pages/MonthlyTuition"
 import Schedule from "@/pages/Schedule"
import ScheduleDetail from "@/pages/ScheduleDetail"
import ScriptLibrary from "@/pages/ScriptLibrary"
import Settings from "@/pages/Settings"
import SystemIssues from "@/pages/SystemIssues"
import SystemLogs from "@/pages/SystemLogs"
import RoomBooking from "@/pages/RoomBooking"
import RoomBookingAdmin from "@/pages/RoomBookingAdmin"
import StudentDetail from "@/pages/StudentDetail"
import Students from "@/pages/Students"
import Teachers from "@/pages/Teachers"
import TeacherProfile from "@/pages/TeacherProfile"
import TeacherTimetable from "@/pages/TeacherTimetable"
import TeachingRecords from "@/pages/TeachingRecords"
import TeacherLeaveWizard from "@/pages/TeacherLeaveWizard"
import TomorrowReminders from "@/pages/TomorrowReminders"
import TrialSessions from "@/pages/TrialSessions"
import UserManagement from "@/pages/UserManagement"
import ApoPo from "@/pages/ApoPo"
import PrototypeFrontDeskWizard from "@/pages/PrototypeFrontDeskWizard"
import PrototypeScheduleRollCall from "@/pages/PrototypeScheduleRollCall"
import PrototypeTeacherLeaveWizard from "@/pages/PrototypeTeacherLeaveWizard"
import PromotionMatch from "@/pages/PromotionMatch"
import ReceiptDemo from "@/pages/ReceiptDemo"

const AiReports = lazy(() => import("@/pages/AiReports"))
const EnrollmentReports = lazy(() => import("@/pages/EnrollmentReports"))
const MgmtDashboard = lazy(() => import("@/pages/MgmtDashboard"))

export default function App() {
 return (
  <BrowserRouter>
   <Routes>
    <Route path="/" element={<Navigate to="/Home" replace />} />
    <Route path="/Login" element={<Login />} />
    <Route path="/receipt-demo" element={<ReceiptDemo />} />
    <Route path="/prototype/ReceiptDemo" element={<ReceiptDemo />} />
    {/* 家長連結填表：公開頁，不經側欄／登入閘 */}
    <Route path="/FrontDeskIntake/:token" element={<FrontDeskIntake />} />
    <Route element={<AdaptiveLayout />}>
     <Route path="/Home" element={<Home />} />
     <Route path="/AllFeatures" element={<AllFeatures />} />
     <Route path="/Users" element={<UserManagement />} />
     <Route path="/Students" element={<Students />} />
     <Route path="/Students/:studentId" element={<StudentDetail />} />
     <Route path="/LessonBalanceMismatch" element={<LessonBalanceMismatch />} />
     <Route path="/FrontDeskWizard" element={<FrontDeskWizard />} />
     <Route path="/TomorrowReminders" element={<TomorrowReminders />} />
     <Route path="/PrivateTutoring" element={<PrivateTutoring />} />
     <Route path="/Teachers" element={<Teachers />} />
     <Route path="/Teachers/:teacherId" element={<TeacherDetail />} />
     <Route path="/Classes" element={<Classes />} />
     <Route path="/Classes/New" element={<ClassNew />} />
     <Route path="/Courses" element={<Courses />} />
     <Route path="/Classes/:classId" element={<ClassDetail />} />
     <Route path="/TeacherAvailability" element={<TeacherAvailability />} />
     <Route path="/Classrooms" element={<Classrooms />} />
     <Route path="/TeacherTimetable" element={<TeacherTimetable />} />
     <Route path="/TeacherProfile" element={<TeacherProfile />} />
     <Route path="/Settings" element={<Settings />} />
     <Route path="/Attendance" element={<Attendance />} />
     <Route path="/AttendanceRecords" element={<AttendanceRecords />} />
     <Route path="/Payments" element={<Payments />} />
     <Route path="/MonthlyTuition" element={<MonthlyTuition />} />
     <Route path="/PaymentHistory" element={<PaymentHistory />} />
     <Route path="/Apo" element={<ApoPo />} />
     <Route
      path="/AiReports"
      element={
       <Suspense
        fallback={
         <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          載入 AI 報表…
         </div>
        }
       >
        <AiReports />
       </Suspense>
      }
     />
     <Route
      path="/EnrollmentReports"
      element={
       <Suspense
        fallback={
         <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          載入人數報表…
         </div>
        }
       >
        <EnrollmentReports />
       </Suspense>
      }
     />
     <Route
      path="/MgmtDashboard"
      element={
       <Suspense
        fallback={
         <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          載入營運總覽…
         </div>
        }
       >
        <MgmtDashboard />
       </Suspense>
      }
     />
     <Route path="/PaymentDiscounts" element={<PaymentDiscounts />} />
     <Route path="/ReferralRebates" element={<ReferralRebates />} />
     <Route path="/Calendar" element={<Calendar />} />
     <Route path="/AcademicCalendar" element={<AcademicCalendar />} />
     <Route path="/Calendar/:eventId" element={<TodoDetail />} />
     <Route path="/EnrollmentChanges" element={<EnrollmentChanges />} />
     <Route path="/PromotionMatch" element={<PromotionMatch />} />
     <Route path="/PortalEnrollmentRequests" element={<PortalEnrollmentRequests />} />
     <Route path="/Schedule/:scheduleId" element={<ScheduleDetail />} />
     <Route path="/Schedule" element={<Schedule />} />
     <Route path="/TeachingRecords" element={<TeachingRecords />} />
     <Route path="/RoomBooking" element={<RoomBooking />} />
     <Route path="/RoomBookingAdmin" element={<RoomBookingAdmin />} />
     <Route path="/LeaveManagement" element={<LeaveManagement />} />
     <Route path="/TeacherLeaveWizard" element={<TeacherLeaveWizard />} />
     <Route path="/TrialSessions" element={<TrialSessions />} />
     <Route path="/ScriptLibrary" element={<ScriptLibrary />} />
     <Route path="/SystemLogs" element={<SystemLogs />} />
     <Route path="/SystemIssues" element={<SystemIssues />} />
     {/* 保留既有沙盒（前台精靈／排程點名／老師請假）；明日提醒已正式化 */}
     <Route path="/prototype/ScheduleRollCall" element={<PrototypeScheduleRollCall />} />
     <Route path="/prototype/FrontDeskWizard" element={<PrototypeFrontDeskWizard />} />
     <Route path="/prototype/TeacherLeaveWizard" element={<PrototypeTeacherLeaveWizard />} />
    </Route>
   </Routes>
   <SpeedInsights />
  </BrowserRouter>
 )
}
