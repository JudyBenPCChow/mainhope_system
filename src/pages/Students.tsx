import { Navigate } from "react-router-dom"

import { StudentsListPage } from "@/components/students/StudentsListPage"
import { useAuth } from "@/lib/authBootstrap"

export default function Students() {
 const { ready, role } = useAuth()
 if (!ready) return null
 if (role === "teacher") return <Navigate to="/Classes" replace />
 return <StudentsListPage />
}
