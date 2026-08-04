import { RequireMgmtRoles } from "@/components/auth/RequireMgmtRoles"
import { ScheduleDetailView } from "@/components/schedule/ScheduleDetailView"

export default function ScheduleDetail() {
 return (
  <RequireMgmtRoles roles={["admin", "manager", "finance", "teacher", "alien"]}>
   <ScheduleDetailView />
  </RequireMgmtRoles>
 )
}
