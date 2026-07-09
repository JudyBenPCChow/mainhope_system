import * as React from "react"

import { MOBILE_BREAKPOINT, MOBILE_MEDIA_QUERY } from "@/lib/layoutBreakpoint"

export function useIsMobile() {
 const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

 React.useEffect(() => {
  const mql = window.matchMedia(MOBILE_MEDIA_QUERY)
  const onChange = () => {
   setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
  }
  mql.addEventListener("change", onChange)
  setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
  return () => mql.removeEventListener("change", onChange)
 }, [])

 return !!isMobile
}
