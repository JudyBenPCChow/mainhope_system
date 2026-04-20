import { User } from "@/api/entities"
import { EntityListPage } from "@/components/EntityListPage"

export default function UserManagementPage() {
  return (
    <EntityListPage
      title="用戶管理"
      subtitle="資料來自 Supabase 表 app_users（後台使用者；之後可併入 Auth）。"
      load={() => User.list()}
      columns={[
        { key: "email", label: "Email" },
        { key: "display_name", label: "顯示名稱" },
        { key: "role", label: "角色" },
        { key: "teacher_id", label: "綁定老師" },
        { key: "updated_at", label: "更新時間" },
      ]}
    />
  )
}
