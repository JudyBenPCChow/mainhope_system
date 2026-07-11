import { Layout } from "@/components/Layout"
import { MobileLayout } from "@/components/mobile/MobileLayout"
import { useIsMobile } from "@/hooks/use-mobile"

/**
 * 依視窗寬度在桌面側欄版面與流動裝置版面之間切換。
 * 桌面版 `Layout` 維持原樣；小螢幕使用獨立的 `MobileLayout`。
 *
 * `useIsMobile` 會在首幀同步讀取 matchMedia，避免 iPhone 先畫桌面版再切換。
 */
export function AdaptiveLayout() {
 const isMobile = useIsMobile()

 if (isMobile) {
  return <MobileLayout />
 }

 return <Layout />
}
