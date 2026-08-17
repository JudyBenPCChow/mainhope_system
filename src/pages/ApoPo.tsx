import { ApoPoChatView } from "@/components/apoPo/ApoPoChatView"
import { canSeeApoPo } from "@/lib/apoPoPermissions"
import { useAuth } from "@/lib/authBootstrap"
import { PagePlaceholder } from "@/pages/PagePlaceholder"

export default function ApoPoPage() {
  const { ready, role } = useAuth()
  if (!ready) return null

  if (!canSeeApoPo(role)) {
    return (
      <PagePlaceholder
        title="僅限外星人"
        description="阿Po 僅開放外星人角色。請於登入頁切換為外星人後再試。"
      />
    )
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <ApoPoChatView />
    </div>
  )
}
