import { RequireMgmtRoles } from "@/components/auth/RequireMgmtRoles"
import { TomorrowRemindersPage } from "@/components/reminders/TomorrowRemindersPage"

export default function TomorrowReminders() {
 return (
  <RequireMgmtRoles roles={["admin", "alien"]}>
   <TomorrowRemindersPage />
  </RequireMgmtRoles>
 )
}
