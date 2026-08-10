import { PaymentCorrectionView } from "@/components/payments/PaymentCorrectionView"
import { RequireMgmtRoles } from "@/components/auth/RequireMgmtRoles"

export default function PaymentCorrectionPage() {
 return (
  <RequireMgmtRoles roles={["admin", "manager", "alien"]}>
   <PaymentCorrectionView />
  </RequireMgmtRoles>
 )
}
