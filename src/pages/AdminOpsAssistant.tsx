import { Navigate } from "react-router-dom"

import { AdminOpsChatView } from "@/components/adminOpsAssistant/AdminOpsChatView"
import { canSeeAdminOpsAssistant } from "@/lib/adminOpsAssistant/permissions"
import { useAuth } from "@/lib/authBootstrap"

export default function AdminOpsAssistantPage() {
  const { ready, role } = useAuth()
  if (!ready) return null
  if (!canSeeAdminOpsAssistant(role)) return <Navigate to="/Home" replace />
  return (
    <div className="space-y-4 p-4 md:p-6">
      <AdminOpsChatView />
    </div>
  )
}
