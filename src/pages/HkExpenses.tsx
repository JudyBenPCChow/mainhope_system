import { RequireMgmtRoles } from "@/components/auth/RequireMgmtRoles"
import { HkExpensesView } from "@/components/hkExpenses/HkExpensesView"

export default function HkExpensesPage() {
  return (
    <RequireMgmtRoles roles={["manager", "alien"]}>
      <HkExpensesView />
    </RequireMgmtRoles>
  )
}
