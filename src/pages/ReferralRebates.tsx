import { ReferralRebatesView } from "@/components/payments/ReferralRebatesView"
import { PagePlaceholder } from "@/pages/PagePlaceholder"

type Role = "admin" | "teacher" | "alien"

export default function ReferralRebatesPage() {
 const role = (typeof localStorage !== "undefined"
  ? (localStorage.getItem("mgmt_role") as Role | null)
  : null) ?? null

 if (role !== "alien") {
  return (
   <PagePlaceholder
    title="僅限外星人"
    description="推薦回贈待發清單僅開放「外星人」角色。"
   />
  )
 }

 return <ReferralRebatesView />
}
