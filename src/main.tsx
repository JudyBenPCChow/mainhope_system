import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import App from "@/App"
import { AppErrorBoundary } from "@/components/AppErrorBoundary"
import { AppBannerProvider } from "@/lib/appBanner"
import { AppConfirmProvider } from "@/lib/appConfirm"
import { flushMgmtErrorQueue } from "@/lib/mgmtErrorReporting"
import "@/index.css"

void flushMgmtErrorQueue()

createRoot(document.getElementById("root")!).render(
 <StrictMode>
  <AppErrorBoundary>
   <AppConfirmProvider>
    <AppBannerProvider>
     <App />
    </AppBannerProvider>
   </AppConfirmProvider>
  </AppErrorBoundary>
 </StrictMode>
)
