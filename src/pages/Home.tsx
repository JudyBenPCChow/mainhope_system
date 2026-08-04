import { Navigate } from "react-router-dom"

import { AdminDashboard } from "@/components/home/AdminDashboard"
import { AlienGodViewHome } from "@/components/home/AlienGodViewHome"
import { MgmtDashboardView } from "@/components/mgmtDashboard/MgmtDashboardView"
import { TeacherHomeView } from "@/components/home/TeacherHomeView"
import { getMgmtRole } from "@/lib/mgmtRole"

export default function Home() {
 const role = getMgmtRole()

 if (role === "teacher") {
  return <TeacherHomeView />
 }

 if (role === "alien") {
  return <AlienGodViewHome />
 }

 if (role === "manager") {
  return <MgmtDashboardView />
 }

 if (role === "finance") {
  return <Navigate to="/Payroll" replace />
 }

 if (role === "admin") {
  return <AdminDashboard />
 }

 return <Navigate to="/Login" replace />
}
