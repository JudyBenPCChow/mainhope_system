import { RequireMgmtRoles } from "@/components/auth/RequireMgmtRoles"
import { ContactUpdateCampaignView } from "@/components/contactUpdate/ContactUpdateCampaignView"

export default function ContactUpdateCampaign() {
  return (
    <RequireMgmtRoles roles={["admin", "alien"]}>
      <ContactUpdateCampaignView />
    </RequireMgmtRoles>
  )
}
