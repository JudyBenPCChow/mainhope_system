import { RequireMgmtRoles } from "@/components/auth/RequireMgmtRoles"
import { StaffPerformanceView } from "@/components/staffPerformance/StaffPerformanceView"

export default function StaffPerformancePage() {
  return (
    <RequireMgmtRoles roles={["manager", "alien"]}>
      <StaffPerformanceView />
    </RequireMgmtRoles>
  )
}
