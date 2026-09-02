import { useLocation, useNavigate } from "react-router-dom"

import { RecordPageTabs } from "@/components/detail/RecordPageTabs"
import { useIsMobile } from "@/hooks/use-mobile"
import {
 ADMIN_WORKSPACE_TABS,
 resolveAdminWorkspacePath,
 type AdminWorkspaceId,
} from "@/lib/adminNavigation"
import { useAuth } from "@/lib/authBootstrap"

type AdminWorkspaceNavProps = {
 workspace: AdminWorkspaceId
 className?: string
}

/** 行政限定的跨路由工作域導航；其他角色維持原有畫面。 */
export function AdminWorkspaceNav({ workspace, className }: AdminWorkspaceNavProps) {
 const { role } = useAuth()
 const location = useLocation()
 const navigate = useNavigate()
 const isMobile = useIsMobile()

 if (role !== "admin") return null

 const activePath = resolveAdminWorkspacePath(workspace, location.pathname)
 if (!activePath) return null

 const tabs = ADMIN_WORKSPACE_TABS[workspace].map((tab) => ({
  id: tab.path,
  label: tab.label,
 }))

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
