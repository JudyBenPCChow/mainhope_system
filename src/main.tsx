import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import App from "@/App"
import { AppErrorBoundary } from "@/components/AppErrorBoundary"
import { AppBannerProvider } from "@/lib/appBanner"
import { AppConfirmProvider } from "@/lib/appConfirm"
import { AuthProvider } from "@/lib/authBootstrap"
import "@/index.css"

createRoot(document.getElementById("root")!).render(
 <StrictMode>
  <AppErrorBoundary>
   <AppConfirmProvider>
    <AppBannerProvider>
     <AuthProvider>
      <App />
     </AuthProvider>
    </AppBannerProvider>
   </AppConfirmProvider>
  </AppErrorBoundary>
 </StrictMode>
)
