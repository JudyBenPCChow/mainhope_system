import { Navigate, useSearchParams } from "react-router-dom"

import { PaymentsPageView } from "@/components/payments/PaymentsPageView"
import { RequireMgmtRoles } from "@/components/auth/RequireMgmtRoles"

/** 相容舊連結：/Payments?tab=history → /PaymentHistory */
export default function PaymentsPage() {
 const [searchParams] = useSearchParams()
 if (searchParams.get("tab") === "history") {
  const next = new URLSearchParams(searchParams)
  next.delete("tab")
  const qs = next.toString()
  return <Navigate to={qs ? `/PaymentHistory?${qs}` : "/PaymentHistory"} replace />
 }
 return (
  <RequireMgmtRoles roles={["admin", "alien"]}>
   <PaymentsPageView />
  </RequireMgmtRoles>
 )
}
