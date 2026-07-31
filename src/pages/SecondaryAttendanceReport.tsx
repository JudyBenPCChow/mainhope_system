import { RequireMgmtRoles } from "@/components/auth/RequireMgmtRoles"
import { SecondaryAttendanceReportView } from "@/components/reports/SecondaryAttendanceReportView"

export default function SecondaryAttendanceReportPage() {
 return (
  <RequireMgmtRoles roles={["manager", "alien"]}>
   <SecondaryAttendanceReportView />
  </RequireMgmtRoles>
 )
}
