import { RequireMgmtRoles } from "@/components/auth/RequireMgmtRoles"
import { PayrollView } from "@/components/payroll/PayrollView"

export default function PayrollPage() {
  return (
    <RequireMgmtRoles roles={["admin", "manager", "finance", "alien"]}>
      <PayrollView />
    </RequireMgmtRoles>
  )
}
