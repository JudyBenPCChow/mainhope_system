import { useCallback, useEffect, useRef, useState } from "react"

import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion"

type Options = {
 onLoadMore: () => void | Promise<void>
 hasMore: boolean
 disabled?: boolean
 rootMargin?: string
}

export function useInfiniteScroll({
 onLoadMore,
 hasMore,
 disabled = false,
 rootMargin = "200px",
}: Options) {
 const reducedMotion = usePrefersReducedMotion()
 const [loadingMore, setLoadingMore] = useState(false)
 const sentinelRef = useRef<HTMLDivElement | null>(null)
 const onLoadMoreRef = useRef(onLoadMore)
 onLoadMoreRef.current = onLoadMore

 const loadMore = useCallback(async () => {
  if (loadingMore || disabled || !hasMore) return
  setLoadingMore(true)
  try {
   await onLoadMoreRef.current()
  } finally {
   setLoadingMore(false)
  }
 }, [disabled, hasMore, loadingMore])

 useEffect(() => {
  if (reducedMotion || disabled || !hasMore) return
  const node = sentinelRef.current
  if (!node) return

  const observer = new IntersectionObserver(
   (entries) => {
    if (entries.some((e) => e.isIntersecting)) {
     void loadMore()
    }
   },
   { rootMargin }
  )
  observer.observe(node)
  return () => observer.disconnect()
 }, [disabled, hasMore, loadMore, reducedMotion, rootMargin])

 return {
  sentinelRef,
  loadingMore,
  loadMore,
  hasMore,
 }
}
