import { TeacherDetailView } from "@/components/teachers/TeacherDetailView"
import { RequireMgmtRoles } from "@/components/auth/RequireMgmtRoles"

/** 對齊路由：`/Teachers/:teacherId` */
export default function TeacherDetail() {
 return (
  <RequireMgmtRoles roles={["admin", "manager", "alien"]}>
   <TeacherDetailView />
  </RequireMgmtRoles>
 )
}
