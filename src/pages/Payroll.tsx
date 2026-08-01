import { RequireMgmtRoles } from "@/components/auth/RequireMgmtRoles"
import { PayrollPrototypeView } from "@/prototypes/payroll/PayrollPrototypeView"

export default function PayrollPage() {
  return (
    <RequireMgmtRoles roles={["admin", "manager", "alien"]}>
      <PayrollPrototypeView />
    </RequireMgmtRoles>
  )
}
