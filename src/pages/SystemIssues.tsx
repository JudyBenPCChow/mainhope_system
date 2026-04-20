import { SystemIssuesView } from "@/components/system/SystemIssuesView"
import { PagePlaceholder } from "@/pages/PagePlaceholder"

type Role = "admin" | "teacher" | "alien"

export default function SystemIssuesPage() {
  const role = (typeof localStorage !== "undefined"
    ? (localStorage.getItem("mgmt_role") as Role | null)
    : null) ?? null

  if (role !== "alien") {
    return (
      <PagePlaceholder
        title="僅限外星人"
        description="報錯與問題僅開放「外星人」角色檢視。請於首頁切換為外星人。"
      />
    )
  }

  return <SystemIssuesView />
}
