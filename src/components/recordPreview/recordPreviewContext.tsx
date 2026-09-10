import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { useIsMobile } from "@/hooks/use-mobile"
import { useAuth } from "@/lib/authBootstrap"
import type { TuitionChasePeriodRef, TuitionChaseStudentRow } from "@/services/tuitionChaseQueries"

export type RecordPreviewKind = "student" | "class" | "teacher" | "schedule" | "tuitionChase"

export type RecordPreviewTarget =
 | { kind: "student" | "class" | "teacher" | "schedule"; id: string }
 | {
    kind: "tuitionChase"
    id: string
    poolKey?: string
    row: TuitionChaseStudentRow
    currentPeriod: TuitionChasePeriodRef | null
    nextPeriod: TuitionChasePeriodRef | null
    academicYearLabel?: string
   }

type RecordPreviewContextValue = {
 preview: RecordPreviewTarget | null
 openPreview: (target: RecordPreviewTarget) => void
 /** 不切換關閉，用於更新同一預覽（例如學費追收改組別）。 */
 replacePreview: (target: RecordPreviewTarget) => void
 closePreview: () => void
 emptyOpen: boolean
 setEmptyOpen: (open: boolean) => void
}

const RecordPreviewContext = createContext<RecordPreviewContextValue | null>(null)

const disabledPreview: Omit<RecordPreviewContextValue, "preview"> & {
 preview: RecordPreviewTarget | null
 enabled: false
} = {
 preview: null,
 openPreview: () => {},
 replacePreview: () => {},
 closePreview: () => {},
 emptyOpen: false,
 setEmptyOpen: () => {},
 enabled: false,
}

export function RecordPreviewProvider({ children }: { children: React.ReactNode }) {
 const location = useLocation()
 const [preview, setPreview] = useState<RecordPreviewTarget | null>(null)
 const [emptyOpen, setEmptyOpen] = useState(() => location.pathname === "/Home")

 const closePreview = useCallback(() => setPreview(null), [])

 const openPreview = useCallback((target: RecordPreviewTarget) => {
  setPreview((prev) =>
   prev && prev.kind === target.kind && prev.id === target.id ? null : target
  )
 }, [])

 const replacePreview = useCallback((target: RecordPreviewTarget) => {
  setPreview(target)
 }, [])

 useEffect(() => {
  setPreview(null)
  setEmptyOpen(location.pathname === "/Home")
 }, [location.pathname])

 useEffect(() => {
  if (!preview) return
  const onKey = (e: KeyboardEvent) => {
   if (e.key === "Escape") setPreview(null)
  }
  window.addEventListener("keydown", onKey)
  return () => window.removeEventListener("keydown", onKey)
 }, [preview])

 const value = useMemo(
  () => ({ preview, openPreview, replacePreview, closePreview, emptyOpen, setEmptyOpen }),
  [preview, openPreview, replacePreview, closePreview, emptyOpen]
 )

 return <RecordPreviewContext.Provider value={value}>{children}</RecordPreviewContext.Provider>
}

export function useRecordPreview() {
 const ctx = useContext(RecordPreviewContext)
 const isMobile = useIsMobile()
 const { role } = useAuth()
 const enabled = Boolean(ctx) && !isMobile && (role === "admin" || role === "alien")

 if (!ctx || !enabled) {
  return { ...disabledPreview, enabled: false as const }
 }

 return { ...ctx, enabled: true as const }
}

function useOpenRecord(
 kind: Exclude<RecordPreviewKind, "tuitionChase">,
 pathPrefix: string
) {
 const navigate = useNavigate()
 const location = useLocation()
 const { enabled, openPreview } = useRecordPreview()

 return useCallback(
  (id: string) => {
   if (enabled) {
    openPreview({ kind, id })
    return
   }
   navigate(`${pathPrefix}/${id}`, { state: { from: `${location.pathname}${location.search}` } })
  },
  [enabled, openPreview, navigate, location.pathname, location.search, kind, pathPrefix]
 )
}

/** 桌面 admin／外星人：右側預覽。其餘：去完整詳情頁。 */
export function useOpenStudentRecord() {
 return useOpenRecord("student", "/Students")
}

export function useOpenClassRecord() {
 return useOpenRecord("class", "/Classes")
}

export function useOpenTeacherRecord() {
 return useOpenRecord("teacher", "/Teachers")
}
