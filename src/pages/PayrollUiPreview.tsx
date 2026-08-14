import { AppBannerViewport } from "@/lib/appBanner"
import { PayrollView } from "@/components/payroll/PayrollView"

/**
 * 免登入計糧 UI 預覽（示範資料）。
 * 僅在 DEV，或建置時設 VITE_PAYROLL_UI_PREVIEW=1 時掛路由（見 App.tsx）。
 */
export default function PayrollUiPreviewPage() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <AppBannerViewport />
      <PayrollView />
    </div>
  )
}
