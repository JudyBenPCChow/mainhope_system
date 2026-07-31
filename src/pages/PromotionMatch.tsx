import { RequireMgmtRoles } from "@/components/auth/RequireMgmtRoles"
import { PromotionMatchView } from "@/components/promotionMatch/PromotionMatchView"

export default function PromotionMatch() {
 return (
  <RequireMgmtRoles roles={["admin", "alien"]}>
   <PromotionMatchView />
  </RequireMgmtRoles>
 )
}
