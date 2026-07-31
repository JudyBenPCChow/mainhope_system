import { RequireMgmtRoles } from "@/components/auth/RequireMgmtRoles"
import { PortalEnrollmentRequestsView } from "@/components/enrollment/PortalEnrollmentRequestsView"

export default function PortalEnrollmentRequestsPage() {
 return (
  <RequireMgmtRoles roles={["admin", "alien"]}>
   <PortalEnrollmentRequestsView />
  </RequireMgmtRoles>
 )
}
