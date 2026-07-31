import { RequireMgmtRoles } from "@/components/auth/RequireMgmtRoles"
import { TeacherLeaveWizardView } from "@/components/schedule/TeacherLeaveWizardView"

export default function TeacherLeaveWizard() {
 return (
  <RequireMgmtRoles roles={["admin", "alien"]}>
   <TeacherLeaveWizardView />
  </RequireMgmtRoles>
 )
}
