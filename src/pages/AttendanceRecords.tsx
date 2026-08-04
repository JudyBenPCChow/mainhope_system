import { RequireMgmtRoles } from "@/components/auth/RequireMgmtRoles"
import { AttendanceRecordsPage } from "@/components/attendance/AttendanceRecordsPage"

export default function AttendanceRecordsPageRoute() {
 return (
  <RequireMgmtRoles roles={["admin", "manager", "finance", "teacher", "alien"]}>
   <AttendanceRecordsPage />
  </RequireMgmtRoles>
 )
}
