import { RequireMgmtRoles } from "@/components/auth/RequireMgmtRoles"
import { EnrollmentReportsView } from "@/components/reports/EnrollmentReportsView"

export default function EnrollmentReportsPage() {
 return (
  <RequireMgmtRoles roles={["manager", "alien"]}>
   <EnrollmentReportsView />
  </RequireMgmtRoles>
 )
}
