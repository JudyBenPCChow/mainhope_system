import { AiReportsView } from "@/components/ai/AiReportsView"
import { canSeeAiReports } from "@/lib/aiPermissions"
import { useAuth } from "@/lib/authBootstrap"
import { PagePlaceholder } from "@/pages/PagePlaceholder"

export default function AiReportsPage() {
  const { ready, role } = useAuth()
  if (!ready) return null

  if (!canSeeAiReports(role)) {
    return (
      <PagePlaceholder
        title="僅限外星人"
        description="AI 報表暫時僅開放外星人角色。請於登入頁切換為外星人後再試。"
      />
    )
  }

  return <AiReportsView />
}
