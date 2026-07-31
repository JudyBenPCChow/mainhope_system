import { RequireMgmtRoles } from "@/components/auth/RequireMgmtRoles"
import { PaymentDiscountsView } from "@/components/payments/PaymentDiscountsView"

export default function PaymentDiscountsPage() {
 return (
  <RequireMgmtRoles roles={["admin", "alien"]}>
   <PaymentDiscountsView />
  </RequireMgmtRoles>
 )
}
