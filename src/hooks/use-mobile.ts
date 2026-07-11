import * as React from "react"

import { MOBILE_BREAKPOINT, MOBILE_MEDIA_QUERY } from "@/lib/layoutBreakpoint"

function readIsMobile(): boolean {
 if (typeof window === "undefined") return false
 return window.matchMedia(MOBILE_MEDIA_QUERY).matches
}

/**
 * 是否為流動裝置版面（&lt; md / 768px）。
 * 必須在首幀同步讀取 matchMedia，避免 iPhone 先渲染桌面側欄再切換，
 * 造成整頁被撐寬、Safari 自動縮小比例。
 */
export function useIsMobile() {
 const [isMobile, setIsMobile] = React.useState(readIsMobile)

 React.useEffect(() => {
  const mql = window.matchMedia(MOBILE_MEDIA_QUERY)
  const onChange = () => {
   setIsMobile(mql.matches || window.innerWidth < MOBILE_BREAKPOINT)
  }
  onChange()
  mql.addEventListener("change", onChange)
  return () => mql.removeEventListener("change", onChange)
 }, [])

 return isMobile
}
