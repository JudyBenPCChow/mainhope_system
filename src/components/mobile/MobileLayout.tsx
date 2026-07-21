import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useState } from "react"

import { ApoAssistant } from "@/components/assistant/ApoAssistant"
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav"
import { MobileHeader } from "@/components/mobile/MobileHeader"
import { MobileNavDrawer } from "@/components/mobile/MobileNavDrawer"
import { useAuth } from "@/lib/authBootstrap"
import { AppBannerViewport } from "@/lib/appBanner"
import { clearAuthState } from "@/lib/authSession"
import { usePasswordChangeNudgeBanner } from "@/lib/usePasswordChangeNudgeBanner"
import { supabase } from "@/lib/supabaseClient"

/**
 * 流動裝置專用版面：頂部標題列、底部快捷導覽、側滑全功能選單。
 * 桌面版仍使用既有 `Layout`，兩者共用相同路由與頁面元件。
 */
export function MobileLayout() {
 const location = useLocation()
 const [navOpen, setNavOpen] = useState(false)
 const { ready, role: authRole, profile } = useAuth()
 usePasswordChangeNudgeBanner()
 const role = authRole
 const userDisplayName =
  profile?.displayName?.trim() ||
  profile?.email ||
  (typeof localStorage !== "undefined" ? localStorage.getItem("mgmt_display_name") : null)?.trim() ||
  (typeof localStorage !== "undefined" ? localStorage.getItem("mgmt_email") : null) ||
  "用戶"

 const logout = () => {
  void (async () => {
   clearAuthState()
   if (supabase) await supabase.auth.signOut()
   window.location.href = "/Login"
  })()
 }

 if (!ready) {
  return (
   <div className="flex min-h-svh items-center justify-center bg-brand-bg text-sm text-muted-foreground">
    正在確認登入狀態…
   </div>
  )
 }

 if (!role) {
  return <Navigate to="/Login" replace state={{ from: location.pathname }} />
 }

 return (
  <div className="flex h-svh min-h-0 w-full flex-col overflow-hidden bg-brand-bg">
   <AppBannerViewport />
   <MobileHeader pathname={location.pathname} role={role} onOpenNav={() => setNavOpen(true)} />
   <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-background">
    <div className="mx-auto min-h-full w-full max-w-lg px-4 py-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:max-w-xl">
     <Outlet />
    </div>
   </main>
   <MobileBottomNav role={role} />
   <MobileNavDrawer
    open={navOpen}
    onClose={() => setNavOpen(false)}
    role={role}
    userDisplayName={userDisplayName}
    onLogout={logout}
   />
   <ApoAssistant role={role} />
  </div>
 )
}
