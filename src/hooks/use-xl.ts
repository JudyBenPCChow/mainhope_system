import * as React from "react"

import { XL_BREAKPOINT, XL_MEDIA_QUERY } from "@/lib/layoutBreakpoint"

function readIsXl(): boolean {
 if (typeof window === "undefined") return false
 return window.matchMedia(XL_MEDIA_QUERY).matches
}

/** 是否為 `xl`（≥1280px）桌面版面。 */
export function useIsXl() {
 const [isXl, setIsXl] = React.useState(readIsXl)

 React.useEffect(() => {
  const mql = window.matchMedia(XL_MEDIA_QUERY)
  const onChange = () => {
   setIsXl(mql.matches || window.innerWidth >= XL_BREAKPOINT)
  }
  onChange()
  mql.addEventListener("change", onChange)
  return () => mql.removeEventListener("change", onChange)
 }, [])

 return isXl
}
