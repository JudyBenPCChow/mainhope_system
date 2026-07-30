import { LeaveManagementView } from "@/components/leaves/LeaveManagementView"
import { RequireMgmtRoles } from "@/components/auth/RequireMgmtRoles"

export default function LeaveManagementPage() {
 return (
  <RequireMgmtRoles roles={["admin", "alien"]}>
   <LeaveManagementView />
  </RequireMgmtRoles>
 )
}
