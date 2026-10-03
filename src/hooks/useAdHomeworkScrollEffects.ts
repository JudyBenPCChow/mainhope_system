import { type RefObject, useEffect } from "react"

import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion"

/** AdHomework 公開頁：區塊滾動出現＋ hero 背景輕微視差。 */
export function useAdHomeworkScrollEffects(rootRef: RefObject<HTMLElement | null>) {
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const root = rootRef.current
    if (!root || reduced) {
      root?.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
        el.classList.add("is-in")
      })
      return
    }

    const revealNodes = [...root.querySelectorAll<HTMLElement>("[data-reveal]")]
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add("is-in")
          observer.unobserve(entry.target)
        }
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    )
    for (const el of revealNodes) observer.observe(el)

    const heroBg = root.querySelector<HTMLElement>(".hero-bg")
    let raf = 0
    let ticking = false

    const applyParallax = () => {
      ticking = false
      if (!heroBg?.isConnected) return
      const hero = heroBg.parentElement
      if (!hero) return
      const rect = hero.getBoundingClientRect()
      if (rect.bottom <= 0 || rect.top >= window.innerHeight) {
        heroBg.style.setProperty("--parallax-y", "0px")
        return
      }
      const progress = (window.innerHeight / 2 - (rect.top + rect.height / 2)) / window.innerHeight
      const offset = Math.max(-48, Math.min(48, progress * 56))
      heroBg.style.setProperty("--parallax-y", `${offset.toFixed(1)}px`)
    }

    const onScroll = () => {
      if (ticking) return
      ticking = true
      raf = requestAnimationFrame(applyParallax)
    }

    applyParallax()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)

    return () => {
      observer.disconnect()
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      cancelAnimationFrame(raf)
      heroBg?.style.removeProperty("--parallax-y")
    }
  }, [reduced, rootRef])

  return reduced ? ("off" as const) : ("on" as const)
}
