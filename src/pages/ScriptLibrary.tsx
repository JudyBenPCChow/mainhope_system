import { RequireMgmtRoles } from "@/components/auth/RequireMgmtRoles"
import { ScriptLibraryView } from "@/components/scriptLibrary/ScriptLibraryView"

export default function ScriptLibraryPage() {
 return (
  <RequireMgmtRoles roles={["admin", "alien"]}>
   <ScriptLibraryView />
  </RequireMgmtRoles>
 )
}
