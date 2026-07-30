import { TrialSessionsView } from "@/components/trials/TrialSessionsView"
import { RequireMgmtRoles } from "@/components/auth/RequireMgmtRoles"

export default function TrialSessions() {
 return (
  <RequireMgmtRoles roles={["admin", "alien"]}>
   <TrialSessionsView />
  </RequireMgmtRoles>
 )
}
