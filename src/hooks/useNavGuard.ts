import { useContext, useEffect } from "react"
import { UNSAFE_NavigationContext } from "react-router-dom"

type HistoryBlocker = {
 block?: (cb: (tx: { retry: () => void }) => void) => () => void
}

/**
 * 未儲存離開：瀏覽器重新整理／關閉，以及（若 navigator 支援）應用內路由切換。
 * `onAllow` 回傳 true 才放行。
 */
export function useNavGuard(when: boolean, onAllow: () => Promise<boolean>) {
 const { navigator } = useContext(UNSAFE_NavigationContext)

 useEffect(() => {
  if (!when) return
  const onBeforeUnload = (e: BeforeUnloadEvent) => {
   e.preventDefault()
   e.returnValue = ""
  }
  window.addEventListener("beforeunload", onBeforeUnload)
  return () => window.removeEventListener("beforeunload", onBeforeUnload)
 }, [when])

 useEffect(() => {
  if (!when) return
  const nav = navigator as unknown as HistoryBlocker
  if (typeof nav.block !== "function") return
  const unblock = nav.block((tx) => {
   void onAllow().then((ok) => {
    if (!ok) return
    unblock()
    tx.retry()
   })
  })
  return unblock
 }, [when, navigator, onAllow])
}
