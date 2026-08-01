import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"

import { AppBannerProvider, AppBannerViewport } from "@/lib/appBanner"
import { PayrollPrototypeView } from "@/prototypes/payroll/PayrollPrototypeView"
import "@/index.css"

/**
 * 獨立沙盒：只載入計糧 mock UI。
 * 不連 Supabase、無登入、無正式後台路由。
 */
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AppBannerProvider>
        <AppBannerViewport />
        <div className="min-h-svh bg-background text-foreground">
          <PayrollPrototypeView />
        </div>
      </AppBannerProvider>
    </BrowserRouter>
  </StrictMode>
)
