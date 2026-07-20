import { Navigate } from "react-router-dom"

import { TeacherLeaveWizardView } from "@/components/schedule/TeacherLeaveWizardView"
import { getMgmtRole } from "@/lib/mgmtRole"

export default function TeacherLeaveWizard() {
  if (getMgmtRole() === "teacher") return <Navigate to="/Home" replace />
  return <TeacherLeaveWizardView />
}
