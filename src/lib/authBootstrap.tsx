import {
 createContext,
 useCallback,
 useContext,
 useEffect,
 useMemo,
 useState,
 type ReactNode,
} from "react"

import {
 bootstrapRoleFromSession,
 clearAuthState,
 type MgmtProfile,
} from "@/lib/authSession"
import { flushMgmtErrorQueue } from "@/lib/mgmtErrorReporting"
import { getMgmtRole, type MgmtRole } from "@/lib/mgmtRole"
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient"
import { switchCurrentMgmtRole } from "@/services/authRoleQueries"

type AuthContextValue = {
 /** Auth bootstrap finished (session checked at least once). */
 ready: boolean
 profile: MgmtProfile | null
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
 const [profile, setProfile] = useState<MgmtProfile | null>(null)

 useEffect(() => {
  const client = supabase
  if (!client || !isSupabaseConfigured) {
   setProfile(null)
   setReady(true)
   return
  }

  let active = true

  const syncSession = async () => {
   const { data, error } = await client.auth.getSession()
   if (error) throw error
   const nextProfile = await bootstrapRoleFromSession(data.session)
   if (!active) return
   setProfile(nextProfile)
   if (nextProfile) void flushMgmtErrorQueue()
  }

  void syncSession()
   .catch(() => {
    if (active) clearAuthState()
   })
   .finally(() => {
    if (active) setReady(true)
   })

  const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
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
   sub.subscription.unsubscribe()
  }
 }, [])

 const role = profile?.role ?? getMgmtRole()
 const switchRole = useCallback(async (nextRole: MgmtRole) => {
  const client = supabase
  if (!client) throw new Error("尚未設定 Supabase，暫時無法切換身份。")
  await switchCurrentMgmtRole(nextRole)
  const { data, error } = await client.auth.getSession()
  if (error) throw error
  const nextProfile = await bootstrapRoleFromSession(data.session)
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
