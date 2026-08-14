import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"

import { AppBannerProvider, AppBannerViewport } from "@/lib/appBanner"
import { AppConfirmProvider } from "@/lib/appConfirm"
import { PayrollView } from "@/components/payroll/PayrollView"
import "@/index.css"

/**
 * 獨立沙盒：只載入計糧 mock UI。
 * 不連 Supabase、無登入、無正式後台路由。
 * Banner／Confirm 與正式後台同一套 Provider。
 */
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AppConfirmProvider>
        <AppBannerProvider>
          <AppBannerViewport />
          <div className="min-h-svh bg-background text-foreground">
            <PayrollView />
          </div>
        </AppBannerProvider>
      </AppConfirmProvider>
    </BrowserRouter>
  </StrictMode>
)
