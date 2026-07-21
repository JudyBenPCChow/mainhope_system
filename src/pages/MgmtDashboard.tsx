import { MgmtDashboardView } from "@/components/mgmtDashboard/MgmtDashboardView"
import { isMgmtStaff } from "@/lib/mgmtRole"
import { PagePlaceholder } from "@/pages/PagePlaceholder"

export default function MgmtDashboardPage() {
 if (!isMgmtStaff()) {
  return (
   <PagePlaceholder
    title="僅限行政／外星人"
    description="營運總覽僅開放管理員（行政）與外星人角色。請於登入頁切換角色後再試。"
   />
  )
 }

 return <MgmtDashboardView />
}
