import type { ReactNode } from "react"

import { useAuth } from "@/lib/authBootstrap"
import { canAny } from "@/lib/authzProfile"
import { PagePlaceholder } from "@/pages/PagePlaceholder"

type Props = {
 anyOf: readonly string[]
 children: ReactNode
}

/** 以 Auth profile 的 active capabilities 守住敏感頁面。側欄入口仍跟 nav（IA1），唔當授權。 */
export function RequireCapabilities({ anyOf, children }: Props) {
 const { ready, profile } = useAuth()
 if (!ready) return null

 const allowed = canAny(profile?.activeCapabilities, anyOf)
 if (allowed) return <>{children}</>

 return (
  <PagePlaceholder
   title="沒有此功能權限"
   description="你目前使用的身份沒有開啟此頁所需權限。請於首頁切換身份後再試。"
  />
 )
}
