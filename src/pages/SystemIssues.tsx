import { SystemIssuesView } from "@/components/system/SystemIssuesView"
import { useAuth } from "@/lib/authBootstrap"
import { PagePlaceholder } from "@/pages/PagePlaceholder"

export default function SystemIssuesPage() {
 const { ready, role } = useAuth()
 if (!ready) return null

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
