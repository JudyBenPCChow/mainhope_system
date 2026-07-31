import { RequireMgmtRoles } from "@/components/auth/RequireMgmtRoles"
import { RoomBookingAdminView } from "@/components/roomBooking/RoomBookingAdminView"

export default function RoomBookingAdmin() {
 return (
  <RequireMgmtRoles roles={["admin", "alien"]}>
   <RoomBookingAdminView />
  </RequireMgmtRoles>
 )
}
