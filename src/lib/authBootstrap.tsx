import {
 createContext,
 useCallback,
 useContext,
 useEffect,
 useMemo,
 useState,
 type ReactNode,
} from "react"

import type { AuthzProfile } from "@/lib/authzProfile"
import {
 applyProfileToStorage,
 bootstrapRoleFromSession,
 clearAuthState,
} from "@/lib/authSession"
import { flushMgmtErrorQueue } from "@/lib/mgmtErrorReporting"
import type { MgmtRole } from "@/lib/mgmtRole"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { getAuthSession, subscribeAuthStateChange } from "@/lib/supabaseAuth"
import { switchCurrentMgmtRoleV2 } from "@/services/authzProfileQueries"

type AuthContextValue = {
 /** Auth bootstrap finished (session checked at least once). */
 ready: boolean
 profile: AuthzProfile | null
 role: MgmtRole | null
 switchRole: (role: MgmtRole) => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
 ready: false,
 profile: null,
 role: null,
 switchRole: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
 const [ready, setReady] = useState(false)
 const [profile, setProfile] = useState<AuthzProfile | null>(null)

 useEffect(() => {
  if (!isSupabaseConfigured) {
   setProfile(null)
   setReady(true)
   return
  }

  let active = true

  const syncSession = async () => {
   const { session, error } = await getAuthSession()
   if (error) throw error
   const nextProfile = await bootstrapRoleFromSession(session)
   if (!active) return
   setProfile(nextProfile)
   if (nextProfile) void flushMgmtErrorQueue()
  }

  void syncSession()
   .catch(() => {
    if (active) {
     clearAuthState()
     setProfile(null)
    }
   })
   .finally(() => {
    if (active) setReady(true)
   })

  const unsubscribe = subscribeAuthStateChange((_event, session) => {
   void bootstrapRoleFromSession(session)
    .then((nextProfile) => {
     if (!active) return
     setProfile(nextProfile)
     if (nextProfile) void flushMgmtErrorQueue()
    })
    .catch(() => {
     if (active) {
      clearAuthState()
      setProfile(null)
     }
    })
  })

  return () => {
   active = false
   unsubscribe()
  }
 }, [])

 const role = profile?.activeRole ?? null
 const switchRole = useCallback(async (nextRole: MgmtRole) => {
  if (!isSupabaseConfigured) throw new Error("尚未設定 Supabase，暫時無法切換身份。")
  const nextProfile = await switchCurrentMgmtRoleV2(nextRole)
  applyProfileToStorage(nextProfile)
  setProfile(nextProfile)
 }, [])

 const value = useMemo(
  () => ({
   ready,
   profile,
   role,
   switchRole,
  }),
  [ready, profile, role, switchRole]
 )

 return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
 return useContext(AuthContext)
}
