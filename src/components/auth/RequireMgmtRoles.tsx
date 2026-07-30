import type { ReactNode } from "react"

import { getMgmtRole, type MgmtRole } from "@/lib/mgmtRole"
import { PagePlaceholder } from "@/pages/PagePlaceholder"

const ROLE_LABEL: Record<MgmtRole, string> = {
 admin: "行政",
 teacher: "專班老師",
 alien: "外星人",
}

function titleForRoles(roles: readonly MgmtRole[]): string {
 const labels = roles.map((r) => ROLE_LABEL[r])
 if (labels.length === 1) return `僅限${labels[0]}`
 return `僅限${labels.join("／")}`
}

function descriptionForRoles(roles: readonly MgmtRole[]): string {
 const labels = roles.map((r) => ROLE_LABEL[r]).join("／")
 return `此頁僅開放「${labels}」角色。請於首頁切換角色後再試。`
}

type Props = {
 roles: readonly MgmtRole[]
 children: ReactNode
}

/** 與 nav `roles` 對齊的頁級守衛；無權限時顯示說明，避免 deep-link 半殘畫面。 */
export function RequireMgmtRoles({ roles, children }: Props) {
 const role = getMgmtRole()
 if (role && roles.includes(role)) return <>{children}</>
 return (
  <PagePlaceholder title={titleForRoles(roles)} description={descriptionForRoles(roles)} />
 )
}
