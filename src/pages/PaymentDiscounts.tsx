import { PaymentDiscountsView } from "@/components/payments/PaymentDiscountsView"
import { PagePlaceholder } from "@/pages/PagePlaceholder"

type Role = "admin" | "teacher" | "alien"

export default function PaymentDiscountsPage() {
  const role = (typeof localStorage !== "undefined"
    ? (localStorage.getItem("mgmt_role") as Role | null)
    : null) ?? null

  if (role !== "alien") {
    return (
      <PagePlaceholder
        title="僅限外星人"
        description="優惠折扣的維護僅開放「外星人」角色。請於首頁切換角色，或由外星人操作。"
      />
    )
  }

  return <PaymentDiscountsView />
}
