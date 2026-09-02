import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { useIsMobile } from "@/hooks/use-mobile"
import { useAuth } from "@/lib/authBootstrap"

export type RecordPreviewKind = "student" | "class" | "teacher" | "schedule"

export type RecordPreviewTarget = {
 kind: RecordPreviewKind
 id: string
}

type RecordPreviewContextValue = {
 preview: RecordPreviewTarget | null
 openPreview: (target: RecordPreviewTarget) => void
 closePreview: () => void
}

const RecordPreviewContext = createContext<RecordPreviewContextValue | null>(null)

export function RecordPreviewProvider({ children }: { children: React.ReactNode }) {
 const location = useLocation()
 const [preview, setPreview] = useState<RecordPreviewTarget | null>(null)

 const closePreview = useCallback(() => setPreview(null), [])

 const openPreview = useCallback((target: RecordPreviewTarget) => {
  setPreview((prev) =>
   prev && prev.kind === target.kind && prev.id === target.id ? null : target
  )
 }, [])

 useEffect(() => {
  setPreview(null)
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
  () => ({ preview, openPreview, closePreview }),
  [preview, openPreview, closePreview]
 )

 return <RecordPreviewContext.Provider value={value}>{children}</RecordPreviewContext.Provider>
}

export function useRecordPreview() {
 const ctx = useContext(RecordPreviewContext)
 const isMobile = useIsMobile()
 const { role } = useAuth()
 const enabled = Boolean(ctx) && !isMobile && (role === "admin" || role === "alien")

 if (!ctx || !enabled) {
  return {
   preview: null as RecordPreviewTarget | null,
   openPreview: (_target: RecordPreviewTarget) => {},
   closePreview: () => {},
   enabled: false,
  }
 }

 return { ...ctx, enabled: true }
}

function useOpenRecord(kind: RecordPreviewKind, pathPrefix: string) {
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
