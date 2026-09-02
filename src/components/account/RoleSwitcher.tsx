import { useState } from "react"

import { Select } from "@/components/ui/select"
import { useAppBanner } from "@/lib/appBanner"
import { useAuth } from "@/lib/authBootstrap"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { formatMgmtRoleLabel, type MgmtRole } from "@/lib/mgmtRole"

type RoleSwitcherProps = {
 variant?: "default" | "card"
}

export function RoleSwitcher({ variant = "default" }: RoleSwitcherProps) {
 const { profile, role, switchRole } = useAuth()
 const { pushBanner } = useAppBanner()
 const [switching, setSwitching] = useState(false)

 if (!profile || !role) return null

 const canSwitch = profile.availableRoles.length >= 2
 if (!canSwitch && variant === "default") return null

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

 if (variant === "card") {
  return (
   <div className="rounded-[0.5625rem] border border-white/[0.12] bg-white/[0.08] px-2.5 py-2">
    <div className="text-[0.7rem] font-semibold tracking-[0.03em] text-white/[0.66]">
     目前操作身份
    </div>
    {canSwitch ? (
     <Select
      value={role}
      disabled={switching}
      aria-label="目前操作身份"
      className="mt-1 min-h-8 rounded-[0.5rem] !border-white/15 !bg-transparent px-2 text-[0.84rem] font-semibold text-white !shadow-none hover:!border-white/25 hover:!bg-white/[0.06] focus:!ring-0 [&>svg]:!text-white/70"
      onChange={(event) => void handleChange(event.target.value as MgmtRole)}
     >
      {profile.availableRoles.map((availableRole) => (
       <option key={availableRole} value={availableRole}>
        {formatMgmtRoleLabel(availableRole)}
       </option>
      ))}
     </Select>
    ) : (
     <div className="mt-0.5 text-[0.84rem] font-semibold text-white">
      {formatMgmtRoleLabel(role)}
     </div>
    )}
   </div>
  )
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
