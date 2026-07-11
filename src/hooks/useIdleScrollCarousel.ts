import { type RefObject, useEffect } from "react"

type Options = {
 /** 無操作多久後開始輪播（毫秒） */
 idleMs?: number
 /** 單格捲動動畫時間（毫秒） */
 stepDurationMs?: number
 /** 停在一格後，再往下一格之前暫停（毫秒） */
 pauseBetweenStepsMs?: number
 /** 捲到最後一格後，回到頂部前暫停（毫秒） */
 pauseAtEndMs?: number
}

function easeOutQuad(t: number): number {
 return 1 - (1 - t) * (1 - t)
}

/** 以固定時長緩慢捲動（比瀏覽器內建 smooth 更易調速度） */
function animateScrollTop(
 el: HTMLElement,
 targetTop: number,
 durationMs: number,
 shouldAbort?: () => boolean
): Promise<void> {
 const from = el.scrollTop
 const delta = targetTop - from
 if (Math.abs(delta) < 0.5) return Promise.resolve()

 const start = performance.now()
 return new Promise((resolve) => {
  function frame(now: number) {
   if (shouldAbort?.()) {
    resolve()
    return
   }
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

function snapItems(container: HTMLElement): HTMLElement[] {
 const list = container.querySelector(":scope > ul, :scope > ol")
 const parent = list ?? container
 return Array.from(parent.children).filter(
  (node): node is HTMLElement => node instanceof HTMLElement
 )
}

function scrollTopForItem(container: HTMLElement, item: HTMLElement): number {
 const cRect = container.getBoundingClientRect()
 const iRect = item.getBoundingClientRect()
 return Math.max(0, container.scrollTop + (iRect.top - cRect.top))
}

/**
 * 可捲動容器在閒置一段時間後：一格一格往下捲（滑一格 → 停 → 再滑），
 * 到底後回到頂部循環。僅在內容高度大於可視高度時作用；
 * 使用者滾輪／觸控會重設閒置計時。
 */
export function useIdleScrollCarousel(
 ref: RefObject<HTMLElement | null>,
 enabled: boolean,
 /** 列表內容變更時重設輪播（例如筆數、載入完） */
 resetKey?: string | number,
 options: Options = {}
): void {
 const idleMs = options.idleMs ?? 2800
 const stepDurationMs = options.stepDurationMs ?? 520
 const pauseBetweenStepsMs = options.pauseBetweenStepsMs ?? 1400
 const pauseAtEndMs = options.pauseAtEndMs ?? 1800

 useEffect(() => {
  if (!enabled) return
  const el = ref.current
  if (!el) return

  let idleTimer: ReturnType<typeof setTimeout> | undefined
  let cancelled = false
  let interrupted = false
  let stepIndex = 0

  const clearTimers = () => {
   if (idleTimer != null) clearTimeout(idleTimer)
   idleTimer = undefined
  }

  const shouldStop = () => cancelled || interrupted || !el.isConnected

  const runCycle = async () => {
   interrupted = false
   if (shouldStop()) return
   const max = el.scrollHeight - el.clientHeight
   if (max <= 4) {
    scheduleIdle()
    return
   }

   const items = snapItems(el)
   if (items.length === 0) {
    scheduleIdle()
    return
   }

   // 從目前可視位置對齊最近的一格，再往下一格
   const currentTop = el.scrollTop
   let nearest = 0
   let nearestDist = Number.POSITIVE_INFINITY
   for (let i = 0; i < items.length; i++) {
    const top = scrollTopForItem(el, items[i]!)
    const dist = Math.abs(top - currentTop)
    if (dist < nearestDist) {
     nearestDist = dist
     nearest = i
    }
   }
   stepIndex = nearest

   while (!shouldStop()) {
    const next = stepIndex + 1
    if (next >= items.length) {
     await new Promise((r) => setTimeout(r, pauseAtEndMs))
     if (shouldStop()) break
     await animateScrollTop(el, 0, stepDurationMs, shouldStop)
     stepIndex = 0
     break
    }

    const target = scrollTopForItem(el, items[next]!)
    // 已貼底且無法再顯示下一格完整位置時，回到頂
    if (target > max + 2 && el.scrollTop >= max - 2) {
     await new Promise((r) => setTimeout(r, pauseAtEndMs))
     if (shouldStop()) break
     await animateScrollTop(el, 0, stepDurationMs, shouldStop)
     stepIndex = 0
     break
    }

    await animateScrollTop(el, Math.min(target, max), stepDurationMs, shouldStop)
    if (shouldStop()) break
    stepIndex = next
    await new Promise((r) => setTimeout(r, pauseBetweenStepsMs))
   }

   if (!cancelled) scheduleIdle()
  }

  const scheduleIdle = () => {
   clearTimers()
   idleTimer = setTimeout(() => {
    void runCycle()
   }, idleMs)
  }

  const onUserIntent = () => {
   interrupted = true
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
 }, [enabled, idleMs, stepDurationMs, pauseBetweenStepsMs, pauseAtEndMs, ref, resetKey])
}
