import { RequireMgmtRoles } from "@/components/auth/RequireMgmtRoles"
import { RollCallPage } from "@/components/attendance/RollCallPage"

export default function AttendancePage() {
 return (
  <RequireMgmtRoles roles={["admin", "teacher", "alien"]}>
   <RollCallPage />
  </RequireMgmtRoles>
 )
}
