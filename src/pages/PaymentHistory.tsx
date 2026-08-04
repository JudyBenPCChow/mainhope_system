import { PaymentHistoryView } from "@/components/payments/PaymentHistoryView"
import { RequireMgmtRoles } from "@/components/auth/RequireMgmtRoles"

export default function PaymentHistoryPage() {
 return (
  <RequireMgmtRoles roles={["admin", "manager", "finance", "alien"]}>
    <PaymentHistoryView />
  </RequireMgmtRoles>
 )
}
