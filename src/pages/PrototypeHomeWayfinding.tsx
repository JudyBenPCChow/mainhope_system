import { AppBannerViewport } from "@/lib/appBanner"
import { HomeWayfindingPrototypeView } from "@/prototypes/homeWayfinding/HomeWayfindingPrototypeView"

/**
 * 免登入首頁 wayfinding UX 沙盒（示範資料）。
 * 不掛正式側欄；不連接資料庫。
 */
export default function PrototypeHomeWayfinding() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <AppBannerViewport />
      <HomeWayfindingPrototypeView />
    </div>
  )
}
