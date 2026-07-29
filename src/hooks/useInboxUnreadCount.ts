import { useCallback, useEffect, useState } from "react"

import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { fetchInboxUnreadCount } from "@/services/inboxQueries"

/** 側欄未讀數；路徑變更或手動 refresh 時重算 */
export function useInboxUnreadCount(refreshKey?: string) {
 const [count, setCount] = useState(0)

 const refresh = useCallback(async () => {
  if (!isSupabaseConfigured) {
   setCount(0)
   return
  }
  try {
   const n = await fetchInboxUnreadCount()
   setCount(n)
  } catch {
   // 側欄提示失敗不阻斷
  }
 }, [])

 useEffect(() => {
  void refresh()
 }, [refresh, refreshKey])

 useEffect(() => {
  const id = window.setInterval(() => void refresh(), 60_000)
  return () => window.clearInterval(id)
 }, [refresh])

 return { unreadCount: count, refreshUnread: refresh }
}
