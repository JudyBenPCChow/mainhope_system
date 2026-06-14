import { Navigate } from "react-router-dom"

import { StudentsListPage } from "@/components/students/StudentsListPage"
import { getMgmtRole } from "@/lib/mgmtRole"

export default function Students() {
 if (getMgmtRole() === "teacher") return <Navigate to="/Classes" replace />
 return <StudentsListPage />
}
