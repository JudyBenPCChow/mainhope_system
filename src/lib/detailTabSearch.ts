import type { SetURLSearchParams } from "react-router-dom"

/** 以 `replace` 寫入 `?tab=`，保留其餘 query。 */
export function replaceTabSearchParam(setSearchParams: SetURLSearchParams, tab: string) {
 setSearchParams(
  (prev) => {
   const nextParams = new URLSearchParams(prev)
   nextParams.set("tab", tab)
   return nextParams
  },
  { replace: true }
 )
}
