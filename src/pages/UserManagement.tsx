import { UserManagementView } from "@/components/users/UserManagementView"
import { RequireMgmtRoles } from "@/components/auth/RequireMgmtRoles"

export default function UserManagementPage() {
 return (
  <RequireMgmtRoles roles={["alien"]}>
   <UserManagementView />
  </RequireMgmtRoles>
 )
}
