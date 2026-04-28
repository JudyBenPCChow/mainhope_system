import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import { Layout } from "@/components/Layout"
import TeacherDetail from "@/components/teachers/TeacherDetail"
import Attendance from "@/pages/Attendance"
import AttendanceRecords from "@/pages/AttendanceRecords"
import ClassDetail from "@/pages/ClassDetail"
import EnrollmentChanges from "@/pages/EnrollmentChanges"
import Classrooms from "@/pages/Classrooms"
import Classes from "@/pages/Classes"
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
import Todos from "@/pages/Todos"
import TeacherProfile from "@/pages/TeacherProfile"
import TeacherTimetable from "@/pages/TeacherTimetable"
import TrialSessions from "@/pages/TrialSessions"
import UserManagement from "@/pages/UserManagement"
import Login from "@/pages/Login"

export default function App() {
 return (
  <BrowserRouter>
   <Routes>
    <Route path="/" element={<Navigate to="/Home" replace />} />
   <Route path="/Login" element={<Login />} />
   <Route path="/login" element={<Login />} />
    <Route element={<Layout />}>
     <Route path="/Home" element={<Home />} />
     <Route path="/Users" element={<UserManagement />} />
     <Route path="/Students" element={<Students />} />
     <Route path="/Students/:studentId" element={<StudentDetail />} />
     <Route path="/Teachers" element={<Teachers />} />
     <Route path="/Teachers/:teacherId" element={<TeacherDetail />} />
     <Route path="/Classes" element={<Classes />} />
     <Route path="/Classes/:classId" element={<ClassDetail />} />
     <Route path="/Classrooms" element={<Classrooms />} />
     <Route path="/TeacherTimetable" element={<TeacherTimetable />} />
     <Route path="/TeacherProfile" element={<TeacherProfile />} />
     <Route path="/Attendance" element={<Attendance />} />
     <Route path="/AttendanceRecords" element={<AttendanceRecords />} />
     <Route path="/Payments" element={<Payments />} />
     <Route path="/PaymentDiscounts" element={<PaymentDiscounts />} />
     <Route path="/Todos" element={<Todos />} />
     <Route path="/EnrollmentChanges" element={<EnrollmentChanges />} />
     <Route path="/Schedule/:scheduleId" element={<ScheduleDetail />} />
     <Route path="/Schedule" element={<Schedule />} />
     <Route path="/RoomBooking" element={<RoomBooking />} />
     <Route path="/RoomBookingAdmin" element={<RoomBookingAdmin />} />
     <Route path="/LeaveManagement" element={<LeaveManagement />} />
     <Route path="/TrialSessions" element={<TrialSessions />} />
     <Route path="/SystemLogs" element={<SystemLogs />} />
     <Route path="/SystemIssues" element={<SystemIssues />} />
    </Route>
   <Route path="*" element={<Navigate to="/Home" replace />} />
   </Routes>
  </BrowserRouter>
 )
}
