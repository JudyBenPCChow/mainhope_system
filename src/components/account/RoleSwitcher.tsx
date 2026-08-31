import { useState } from "react"

import { Select } from "@/components/ui/select"
import { useAppBanner } from "@/lib/appBanner"
import { useAuth } from "@/lib/authBootstrap"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { formatMgmtRoleLabel, type MgmtRole } from "@/lib/mgmtRole"

export function RoleSwitcher() {
 const { profile, role, switchRole } = useAuth()
 const { pushBanner } = useAppBanner()
 const [switching, setSwitching] = useState(false)

 if (!profile || !role || profile.availableRoles.length < 2) return null

 const handleChange = async (nextRole: MgmtRole) => {
  if (nextRole === role || switching) return
  setSwitching(true)
  try {
   await switchRole(nextRole)
   window.location.assign("/Home")
  } catch (error) {
   reportUserFacingError(error, { source: "RoleSwitcher.switchRole" })
   pushBanner({
    tone: "error",
    title: "未能切換身份",
    message: error instanceof Error ? error.message : "請稍後再試。",
   })
   setSwitching(false)
  }
 }

 return (
  <label className="block space-y-1.5">
   <span className="text-[0.790625rem] font-medium text-white/75">目前操作身份</span>
   <Select
    value={role}
    disabled={switching}
    className="min-h-9 border-white/20 bg-white/10 text-white shadow-none hover:border-white/35"
    onChange={(event) => void handleChange(event.target.value as MgmtRole)}
   >
    {profile.availableRoles.map((availableRole) => (
     <option key={availableRole} value={availableRole}>
      {formatMgmtRoleLabel(availableRole)}
     </option>
    ))}
   </Select>
  </label>
 )
}
