import { type RefObject, useEffect } from "react"

type Options = {
 /** 無操作多久後開始輪播（毫秒） */
 idleMs?: number
 /** 單程捲動（頂→底 或 底→頂）動畫時間（毫秒） */
 scrollDurationMs?: number
 /** 捲到底後，開始往回捲之前暫停（毫秒） */
 pauseAtBottomMs?: number
 /** 回到頂後，下一輪循環開始前暫停（毫秒） */
 pauseAtTopMs?: number
}

function easeOutQuad(t: number): number {
 return 1 - (1 - t) * (1 - t)
}

/** 以固定時長緩慢捲動（比瀏覽器內建 smooth 更易調速度） */
function animateScrollTop(el: HTMLElement, targetTop: number, durationMs: number): Promise<void> {
 const from = el.scrollTop
 const delta = targetTop - from
 if (Math.abs(delta) < 0.5) return Promise.resolve()

 const start = performance.now()
 return new Promise((resolve) => {
  function frame(now: number) {
   const t = Math.min(1, (now - start) / durationMs)
   el.scrollTop = from + delta * easeOutQuad(t)
   if (t < 1) {
    requestAnimationFrame(frame)
   } else {
    el.scrollTop = targetTop
    resolve()
   }
  }
  requestAnimationFrame(frame)
 })
}

/**
 * 可捲動容器在閒置一段時間後：先捲至底部，再回頂部循環。
 * 僅在內容高度大於可視高度時作用；使用者滾輪／觸控會重設閒置計時。
 */
export function useIdleScrollCarousel(
 ref: RefObject<HTMLElement | null>,
 enabled: boolean,
 /** 列表內容變更時重設輪播（例如筆數、載入完） */
 resetKey?: string | number,
 options: Options = {}
): void {
 const idleMs = options.idleMs ?? 3000
 const scrollDurationMs = options.scrollDurationMs ?? 3600
 const pauseAtBottomMs = options.pauseAtBottomMs ?? 1000
 const pauseAtTopMs = options.pauseAtTopMs ?? 1000

 useEffect(() => {
  if (!enabled) return
  const el = ref.current
  if (!el) return

  let idleTimer: ReturnType<typeof setTimeout> | undefined
  let cancelled = false

  const clearTimers = () => {
   if (idleTimer != null) clearTimeout(idleTimer)
   idleTimer = undefined
  }

  const runCycle = async () => {
   if (cancelled || !el.isConnected) return
   const max = el.scrollHeight - el.clientHeight
   if (max <= 4) {
    scheduleIdle()
    return
   }
   await animateScrollTop(el, max, scrollDurationMs)
   if (cancelled || !el.isConnected) return
   await new Promise((r) => setTimeout(r, pauseAtBottomMs))
   if (cancelled || !el.isConnected) return
   await animateScrollTop(el, 0, scrollDurationMs)
   if (cancelled || !el.isConnected) return
   await new Promise((r) => setTimeout(r, pauseAtTopMs))
   scheduleIdle()
  }

  const scheduleIdle = () => {
   clearTimers()
   idleTimer = setTimeout(() => {
    void runCycle()
   }, idleMs)
  }

  const onUserIntent = () => {
   scheduleIdle()
  }

  el.addEventListener("wheel", onUserIntent, { passive: true })
  el.addEventListener("touchstart", onUserIntent, { passive: true })
  el.addEventListener("pointerdown", onUserIntent)

  scheduleIdle()

  return () => {
   cancelled = true
   el.removeEventListener("wheel", onUserIntent)
   el.removeEventListener("touchstart", onUserIntent)
   el.removeEventListener("pointerdown", onUserIntent)
   clearTimers()
  }
 }, [enabled, idleMs, scrollDurationMs, pauseAtBottomMs, pauseAtTopMs, ref, resetKey])
}
