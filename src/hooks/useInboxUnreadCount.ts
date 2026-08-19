import { useCallback, useEffect, useState } from "react"

import { useAuth } from "@/lib/authBootstrap"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import {
 fetchInboxUnreadCount,
 INBOX_UNREAD_CHANGED_EVENT,
} from "@/services/inboxQueries"

/**
 * 側欄未讀數。
 * - 首次載入＋每 60s 用快取／輕量刷新（唔跟住每次轉頁重算）
 * - 標記已讀／發佈通知時經 INBOX_UNREAD_CHANGED_EVENT 強制刷新
 */
export function useInboxUnreadCount() {
 const { ready, role, profile } = useAuth()
 const [count, setCount] = useState(0)

 const refresh = useCallback(async (force = false) => {
  if (!isSupabaseConfigured || !ready || !role) {
   setCount(0)
   return
  }
  try {
   const n = await fetchInboxUnreadCount({
    force,
    activeRole: role,
    teacherId: profile?.teacherId ?? null,
   })
   setCount(n)
  } catch {
   // 側欄提示失敗不阻斷
  }
 }, [ready, role, profile?.teacherId])

 useEffect(() => {
  void refresh(false)
  const onChanged = () => void refresh(true)
  window.addEventListener(INBOX_UNREAD_CHANGED_EVENT, onChanged)
  const id = window.setInterval(() => void refresh(false), 60_000)
  return () => {
   window.removeEventListener(INBOX_UNREAD_CHANGED_EVENT, onChanged)
   window.clearInterval(id)
  }
 }, [refresh])

 return { unreadCount: count, refreshUnread: () => void refresh(true) }
}
