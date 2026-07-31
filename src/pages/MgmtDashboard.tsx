import { RequireMgmtRoles } from "@/components/auth/RequireMgmtRoles"
import { MgmtDashboardView } from "@/components/mgmtDashboard/MgmtDashboardView"

export default function MgmtDashboardPage() {
 return (
  <RequireMgmtRoles roles={["manager", "alien"]}>
   <MgmtDashboardView />
  </RequireMgmtRoles>
 )
}
