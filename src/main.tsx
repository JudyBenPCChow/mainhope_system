import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import App from "@/App"
import { AppErrorBoundary } from "@/components/AppErrorBoundary"
import { AppUpdateGuard } from "@/components/AppUpdateGuard"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppBannerProvider } from "@/lib/appBanner"
import { AppConfirmProvider } from "@/lib/appConfirm"
import { AuthProvider } from "@/lib/authBootstrap"
import "@/index.css"

createRoot(document.getElementById("root")!).render(
 <StrictMode>
  <AppErrorBoundary>
   <TooltipProvider delayDuration={700} skipDelayDuration={300}>
    <AppConfirmProvider>
     <AppBannerProvider>
      <AuthProvider>
       <App />
       <AppUpdateGuard />
      </AuthProvider>
     </AppBannerProvider>
    </AppConfirmProvider>
   </TooltipProvider>
  </AppErrorBoundary>
 </StrictMode>
)
