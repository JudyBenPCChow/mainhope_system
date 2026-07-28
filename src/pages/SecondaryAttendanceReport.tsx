import { SecondaryAttendanceReportView } from "@/components/reports/SecondaryAttendanceReportView"
import { isAlien } from "@/lib/mgmtRole"
import { PagePlaceholder } from "@/pages/PagePlaceholder"

export default function SecondaryAttendanceReportPage() {
  if (!isAlien()) {
    return (
      <PagePlaceholder
        title="僅限外星人"
        description="老師中學出席統計僅開放外星人角色。請於登入頁切換為外星人後再試。"
      />
    )
  }

  return <SecondaryAttendanceReportView />
}
