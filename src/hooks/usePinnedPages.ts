import { useCallback, useEffect, useSyncExternalStore } from "react"

import { useAuth } from "@/lib/authBootstrap"
import {
 hideDefaultHomeActionPath,
 normalizePinnableHref,
 togglePinnedPagePaths,
} from "@/lib/pinnedPages"
import {
 fetchAppUserPinnedPagesPrefs,
 saveAppUserPinnedPagesPrefs,
 type AppUserPinnedPagesPrefs,
} from "@/services/pinnedPagesQueries"

const EMPTY: string[] = []
const listeners = new Set<() => void>()

type Cache = {
 appUserId: string
 prefs: AppUserPinnedPagesPrefs
 loaded: boolean
}

let cache: Cache | null = null
let loadSeq = 0

function emptyPrefs(): AppUserPinnedPagesPrefs {
 return { paths: [], hiddenDefaults: [] }
}

function emit() {
 listeners.forEach((listener) => listener())
}

function subscribe(onStoreChange: () => void) {
 listeners.add(onStoreChange)
 return () => {
  listeners.delete(onStoreChange)
 }
}

function getPrefs(appUserId: string | null): AppUserPinnedPagesPrefs {
 if (!appUserId) return emptyPrefs()
 if (cache?.appUserId === appUserId) return cache.prefs
 return emptyPrefs()
}

function getPathsSnapshot(appUserId: string | null): string[] {
 const paths = getPrefs(appUserId).paths
 return paths.length === 0 ? EMPTY : paths
}

function getHiddenSnapshot(appUserId: string | null): string[] {
 const hidden = getPrefs(appUserId).hiddenDefaults
 return hidden.length === 0 ? EMPTY : hidden
}

export function usePinnedPages() {
 const { profile } = useAuth()
 const appUserId = profile?.appUserId ?? null
 const paths = useSyncExternalStore(
  subscribe,
  () => getPathsSnapshot(appUserId),
  () => EMPTY
 )
 const hiddenDefaults = useSyncExternalStore(
  subscribe,
  () => getHiddenSnapshot(appUserId),
  () => EMPTY
 )

 useEffect(() => {
  if (!appUserId) {
   cache = null
   emit()
   return
  }
  if (cache?.appUserId === appUserId && cache.loaded) return
  const seq = ++loadSeq
  cache = {
   appUserId,
   prefs: cache?.appUserId === appUserId ? cache.prefs : emptyPrefs(),
   loaded: false,
  }
  emit()
  void fetchAppUserPinnedPagesPrefs(appUserId)
   .then((prefs) => {
    if (seq !== loadSeq) return
    cache = { appUserId, prefs, loaded: true }
    emit()
   })
   .catch(() => {
    if (seq !== loadSeq) return
    cache = {
     appUserId,
     prefs: cache?.appUserId === appUserId ? cache.prefs : emptyPrefs(),
     loaded: true,
    }
    emit()
   })
 }, [appUserId])

 const persist = useCallback(
  async (next: AppUserPinnedPagesPrefs) => {
   if (!appUserId) return
   const prev = getPrefs(appUserId)
   cache = { appUserId, prefs: next, loaded: true }
   emit()
   try {
    const saved = await saveAppUserPinnedPagesPrefs(appUserId, next)
    cache = { appUserId, prefs: saved, loaded: true }
    emit()
   } catch (error) {
    cache = { appUserId, prefs: prev, loaded: true }
    emit()
    throw error
   }
  },
  [appUserId]
 )

 const toggle = useCallback(
  async (itemPath: string) => {
   if (!appUserId) return
   const prev = getPrefs(appUserId)
   await persist({
    paths: togglePinnedPagePaths(prev.paths, itemPath),
    hiddenDefaults: prev.hiddenDefaults,
   })
  },
  [appUserId, persist]
 )

 const hideDefault = useCallback(
  async (itemPath: string) => {
   if (!appUserId) return
   const prev = getPrefs(appUserId)
   await persist({
    paths: prev.paths,
    hiddenDefaults: hideDefaultHomeActionPath(prev.hiddenDefaults, itemPath),
   })
  },
  [appUserId, persist]
 )

 const restoreHiddenDefaults = useCallback(async () => {
  if (!appUserId) return
  const prev = getPrefs(appUserId)
  await persist({ paths: prev.paths, hiddenDefaults: [] })
 }, [appUserId, persist])

 return {
  paths,
  hiddenDefaults,
  toggle,
  hideDefault,
  restoreHiddenDefaults,
  ready: Boolean(appUserId) && cache?.appUserId === appUserId && cache.loaded,
  isPinned: (itemPath: string) => {
   const href = normalizePinnableHref(itemPath)
   return paths.some((path) => normalizePinnableHref(path) === href)
  },
 }
}
