import { RequireMgmtRoles } from "@/components/auth/RequireMgmtRoles"
import { ScheduleManagePage } from "@/components/schedule/ScheduleManagePage"

export default function SchedulePage() {
 return (
  <RequireMgmtRoles roles={["admin", "manager", "finance", "teacher", "alien"]}>
   <ScheduleManagePage />
  </RequireMgmtRoles>
 )
}
