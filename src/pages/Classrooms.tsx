import { RequireMgmtRoles } from "@/components/auth/RequireMgmtRoles"
import { ClassroomsManagePage } from "@/components/classrooms/ClassroomsManagePage"

export default function ClassroomsPage() {
 return (
  <RequireMgmtRoles roles={["admin", "alien"]}>
   <ClassroomsManagePage />
  </RequireMgmtRoles>
 )
}
