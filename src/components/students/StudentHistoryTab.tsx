import { useCallback, useEffect, useRef, useState } from "react"

import { formatUnknownError } from "@/lib/formatUnknownError"
import { StaggerItem, StaggerList } from "@/components/ui/stagger-list"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { cn } from "@/lib/utils"
import { fetchStudentActivity, type HistoryRow, type StudentActivityResult } from "@/services/studentQueries"

const ACTIVITY_KIND_LABEL: Record<HistoryRow["kind"], string> = {
 status: "狀態變更",
 payment: "繳費",
 enrollment: "報讀",
 withdrawal: "退讀",
}

function failedActivityMessage(kinds: StudentActivityResult["failedKinds"]): string {
 return `${kinds.map((kind) => ACTIVITY_KIND_LABEL[kind]).join("、")}未能載入。`
}

export function StudentHistoryTab({
 studentId,
 active,
 reloadToken,
 includePayments,
}: {
 studentId: string
 active: boolean
 reloadToken: number
 includePayments: boolean
}) {
 const [rows, setRows] = useState<HistoryRow[]>([])
 const [failedKinds, setFailedKinds] = useState<StudentActivityResult["failedKinds"]>([])
 const [loadState, setLoadState] = useState<"idle" | "loading" | "ready" | "error">("idle")
 const [err, setErr] = useState<string | null>(null)
 const loadedRef = useRef(false)

 useEffect(() => {
  loadedRef.current = false
  setRows([])
  setFailedKinds([])
  setLoadState("idle")
  setErr(null)
 }, [studentId])

 const load = useCallback(async () => {
  setLoadState("loading")
  setErr(null)
  setFailedKinds([])
  try {
   const data = await fetchStudentActivity(studentId, { includePayments })
   setRows(data.rows)
   setFailedKinds(data.failedKinds)
   setLoadState("ready")
   loadedRef.current = true
  } catch (e) {
   const message = formatUnknownError(e)
   setErr(message)
   setLoadState("error")
   reportUserFacingError(e, { source: "StudentHistoryTab.load" })
  }
 }, [studentId, includePayments])

 useEffect(() => {
  if (!active && !loadedRef.current) return
  void load()
 }, [active, reloadToken, load])

 if (!active && !loadedRef.current && loadState === "idle") return null

 return (
  <div hidden={!active} className="space-y-4">
   <p className="text-sm text-muted-foreground">顯示所有涉及此學生的變動紀錄。</p>
   {loadState === "loading" && rows.length === 0 ? (
    <p className="text-sm text-muted-foreground">載入中…</p>
   ) : loadState === "error" ? (
    <div className="space-y-2" role="alert">
     <p className="text-sm text-destructive">更動紀錄未能載入{err ? `：${err}` : "。"}</p>
     <button type="button" className="text-sm font-medium text-primary hover:underline" onClick={() => void load()}>
      重試
     </button>
    </div>
   ) : (
    <>
   {failedKinds.length > 0 ? (
    <div className="space-y-2" role="alert">
     <p className="text-sm text-destructive">{failedActivityMessage(failedKinds)}</p>
     <button type="button" className="text-sm font-medium text-primary hover:underline" onClick={() => void load()}>
      重試
     </button>
    </div>
   ) : null}
   {rows.length === 0 && failedKinds.length === 0 ? (
    <p className="text-sm text-muted-foreground">尚無紀錄。</p>
   ) : rows.length > 0 ? (
    <StaggerList as="ul" className="space-y-3">
     {rows.map((h) => (
      <StaggerItem
       key={h.id}
       as="li"
       className={cn(
        "rounded-xl border px-4 py-3 text-sm shadow-sm",
        h.tone === "green" && "border-success/50 bg-success/10",
        h.tone === "blue" && "border-info/50 bg-info/10",
        h.tone === "amber" && "border-warning/50 bg-warning/10",
        h.tone === "muted" && "border-border bg-muted/30"
       )}
      >
       <div className="flex flex-wrap items-start justify-between gap-2">
        <div
         className={cn(
          "font-medium",
          h.tone === "green" && "text-success",
          h.tone === "blue" && "text-info",
          h.tone === "amber" && "text-warning",
          h.tone === "muted" && "text-foreground"
         )}
        >
         {h.title}
        </div>
        <div className="text-xs text-neutral-700">{h.date}</div>
       </div>
       {h.subtitle ? <div className="mt-1 text-xs text-neutral-700">{h.subtitle}</div> : null}
      </StaggerItem>
     ))}
    </StaggerList>
   ) : null}
    </>
   )}
  </div>
 )
}
