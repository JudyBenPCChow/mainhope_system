import { Navigate } from "react-router-dom"

import { AdminDashboard } from "@/components/home/AdminDashboard"
import { AlienGodViewHome } from "@/components/home/AlienGodViewHome"
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

 if (role === "admin") {
  return <AdminDashboard />
 }

 return <Navigate to="/Login" replace />
}
