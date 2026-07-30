import { TeachersListPage } from "@/components/teachers/TeachersListPage"
import { RequireMgmtRoles } from "@/components/auth/RequireMgmtRoles"

export default function TeachersPage() {
 return (
  <RequireMgmtRoles roles={["admin", "alien"]}>
   <TeachersListPage />
  </RequireMgmtRoles>
 )
}
