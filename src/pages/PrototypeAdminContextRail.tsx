import { AppBannerViewport } from "@/lib/appBanner"
import { AdminContextRailPrototypeView } from "@/prototypes/adminContextRail/AdminContextRailPrototypeView"

/**
 * 管理員桌面三欄右欄 UX 沙盒（示範資料）。
 * 不掛正式側欄；不連接資料庫；不跳轉正式頁。
 */
export default function PrototypeAdminContextRail() {
  return (
    <>
      <AppBannerViewport />
      <AdminContextRailPrototypeView />
    </>
  )
}
