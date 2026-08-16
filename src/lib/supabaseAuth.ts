import type { AuthChangeEvent, AuthError, Session, User } from "@supabase/supabase-js"

import { supabase } from "@/lib/supabaseClient"

/**
 * UI／page／lib 的 Auth 出口。資料查詢仍走 services／；禁止在畫面 import raw `supabase`。
 */
export async function signOutAuth(): Promise<void> {
 if (supabase) await supabase.auth.signOut()
}

export async function signInWithPasswordAuth(
 email: string,
 password: string
): Promise<{
 data: { user: User | null; session: Session | null }
 error: AuthError | Error | null
}> {
 if (!supabase) {
  return {
   data: { user: null, session: null },
   error: new Error("尚未設定 Supabase，暫時無法登入。"),
  }
 }
 return supabase.auth.signInWithPassword({ email, password })
}

export async function getAuthSession(): Promise<{
 session: Session | null
 error: AuthError | Error | null
}> {
 if (!supabase) return { session: null, error: null }
 const { data, error } = await supabase.auth.getSession()
 return { session: data.session ?? null, error }
}

export function subscribeAuthStateChange(
 callback: (event: AuthChangeEvent, session: Session | null) => void
): () => void {
 if (!supabase) return () => {}
 const { data } = supabase.auth.onAuthStateChange(callback)
 return () => data.subscription.unsubscribe()
}
