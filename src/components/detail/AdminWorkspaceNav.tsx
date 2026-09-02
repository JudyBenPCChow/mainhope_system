import { useLocation, useNavigate } from "react-router-dom"

import { RecordPageTabs } from "@/components/detail/RecordPageTabs"
import { useIsMobile } from "@/hooks/use-mobile"
import {
 resolveAdminWorkspacePath,
 workspaceTabsForRole,
 type AdminWorkspaceId,
} from "@/lib/adminNavigation"
import { useAuth } from "@/lib/authBootstrap"
import { usesSharedAppShell } from "@/lib/mgmtRole"

type AdminWorkspaceNavProps = {
 workspace: AdminWorkspaceId
 className?: string
}

/** 共用殼的跨路由工作域導航；僅顯示該角色可見且至少兩頁的分頁。 */
export function AdminWorkspaceNav({ workspace, className }: AdminWorkspaceNavProps) {
 const { role } = useAuth()
 const location = useLocation()
 const navigate = useNavigate()
 const isMobile = useIsMobile()

 if (!usesSharedAppShell(role)) return null

 const tabs = workspaceTabsForRole(workspace, role).map((tab) => ({
  id: tab.path,
  label: tab.label,
 }))
 if (tabs.length < 2) return null

 const activePath = resolveAdminWorkspacePath(workspace, location.pathname, role)
 if (!activePath) return null

 return (
  <RecordPageTabs
   tabs={tabs}
   value={activePath}
   onChange={(path) => navigate(path)}
   isMobile={isMobile}
   className={className}
  />
 )
}
