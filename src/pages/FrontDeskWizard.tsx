import { RequireMgmtRoles } from "@/components/auth/RequireMgmtRoles"
import { FrontDeskWizardView } from "@/components/frontDesk/FrontDeskWizardView"

export default function FrontDeskWizard() {
 return (
  <RequireMgmtRoles roles={["admin", "alien"]}>
   <FrontDeskWizardView />
  </RequireMgmtRoles>
 )
}
