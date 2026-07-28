import { SecondaryAttendanceReportView } from "@/components/reports/SecondaryAttendanceReportView"
import { isMgmtStaff } from "@/lib/mgmtRole"
import { PagePlaceholder } from "@/pages/PagePlaceholder"

export default function SecondaryAttendanceReportPage() {
  if (!isMgmtStaff()) {
    return (
      <PagePlaceholder
        title="僅限管理員"
        description="老師中學出席統計僅開放管理員或外星人角色。請切換為管理員後再試。"
      />
    )
  }

  return <SecondaryAttendanceReportView />
}
