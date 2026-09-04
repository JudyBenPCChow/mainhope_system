import { useCallback, useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"

import { ScheduleListCard } from "@/components/schedules/ScheduleListCard"
import { Button } from "@/components/ui/button"
import { StaggerItem, StaggerList } from "@/components/ui/stagger-list"
import { Tag } from "@/components/ui/tag"
import { type ListLoad } from "@/lib/listLoad"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { statusToTagTone } from "@/lib/statusTag"
import { buildFutureSchedulesCsv, futureSchedulesTabKind } from "@/lib/studentFutureSchedulesTab"
import { todayYmdLocal } from "@/lib/weekdayUtils"
import {
 fetchScheduleStudentHintsByClass,
 type ScheduleStudentHints,
} from "@/services/classQueries"
import {
 fetchUpcomingSchedulesForStudent,
 type StudentUpcomingScheduleRow,
} from "@/services/leaveQueries"

export function StudentFutureSchedulesTab({
 studentId,
 active,
 reloadToken,
}: {
 studentId: string
 active: boolean
 reloadToken: number
}) {
 const [load, setLoad] = useState<ListLoad<StudentUpcomingScheduleRow>>({ status: "loading" })
 const [hints, setHints] = useState<Map<string, ScheduleStudentHints>>(new Map())
 const [hintsLoading, setHintsLoading] = useState(false)
 const [hintsError, setHintsError] = useState(false)
 const loadedRef = useRef(false)
 const hintsRequestIdRef = useRef(0)

 useEffect(() => {
  loadedRef.current = false
  setLoad({ status: "loading" })
  setHints(new Map())
  setHintsError(false)
 }, [studentId])

 const loadHints = useCallback((fs: StudentUpcomingScheduleRow[]) => {
  const byClass = new Map<string, { id: string; scheduled_date: string }[]>()
  for (const row of fs) {
   const arr = byClass.get(row.class_id) ?? []
   arr.push({ id: row.id, scheduled_date: row.scheduled_date })
   byClass.set(row.class_id, arr)
  }
  const reqId = ++hintsRequestIdRef.current
  setHintsLoading(true)
  setHintsError(false)
  void fetchScheduleStudentHintsByClass(byClass)
   .then((next) => {
    if (reqId !== hintsRequestIdRef.current) return
    setHints(next)
   })
   .catch((e) => {
    if (reqId !== hintsRequestIdRef.current) return
    reportUserFacingError(e, { source: "StudentFutureSchedulesTab.hints" })
    setHintsError(true)
    setHints(new Map())
   })
   .finally(() => {
    if (reqId === hintsRequestIdRef.current) setHintsLoading(false)
   })
 }, [])

 const loadRows = useCallback(async () => {
  setLoad({ status: "loading" })
  try {
   const rows = await fetchUpcomingSchedulesForStudent(studentId, todayYmdLocal())
   setLoad({ status: "ready", rows })
   loadedRef.current = true
   loadHints(rows)
  } catch (e) {
   reportUserFacingError(e, { source: "StudentFutureSchedulesTab.load" })
   setLoad({ status: "error" })
  }
 }, [studentId, loadHints])

 useEffect(() => {
  if (!active && !loadedRef.current) return
  void loadRows()
 }, [active, reloadToken, loadRows])

 const kind = futureSchedulesTabKind(load)
 const rows = load.status === "ready" ? load.rows : []

 const exportCsv = () => {
  if (load.status !== "ready") return
  const csv = buildFutureSchedulesCsv(load.rows)
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = `student-upcoming-schedules-${studentId}-${todayYmdLocal()}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
 }

 if (!active && !loadedRef.current && load.status === "loading") return null

 return (
  <div hidden={!active} className="space-y-4">
   <div className="flex flex-wrap items-center justify-between gap-2">
    <p className="text-sm text-muted-foreground">
     顯示就讀中班別的未來未完成排程，以及已指定的調堂補堂（可跨班）
     {kind === "rows" ? `，共 ${rows.length} 筆。` : "。"}
    </p>
    <Button
     type="button"
     variant="outline"
     size="sm"
     onClick={exportCsv}
     disabled={kind !== "rows"}
    >
     匯出 CSV
    </Button>
   </div>
   {kind === "loading" ? (
    <p className="text-sm text-muted-foreground">載入中…</p>
   ) : kind === "error" ? (
    <div className="space-y-2" role="alert">
     <p role="alert" className="text-sm text-destructive">未來排程未能載入。</p>
     <button type="button" className="text-sm font-medium text-primary hover:underline" onClick={() => void loadRows()}>
      重試
     </button>
    </div>
   ) : kind === "empty" ? (
    <p className="py-8 text-center text-sm text-muted-foreground">尚無未來排程</p>
   ) : (
    <StaggerList as="div" className="space-y-2">
     {hintsError ? (
      <p className="text-sm text-destructive" role="alert">
       點名冊名單未能載入；排程列仍可查看。
      </p>
     ) : null}
     {rows.map((row) => {
      const rowHints = hints.get(row.id)
      return (
       <StaggerItem key={row.id} as="div">
       <ScheduleListCard
        sessionNumber={row.session_number}
        scheduledDate={row.scheduled_date}
        startTime={row.start_time}
        endTime={row.end_time}
        attendingNames={rowHints?.attendingNames}
        leaveNames={rowHints?.leaveNames}
        namesLoading={hintsLoading}
        subtitle={
         <span className="inline-flex flex-wrap items-center gap-2">
          <Link to={`/Classes/${row.class_id}`} className="text-primary hover:underline">
           {row.subject}
           {row.course_code_full ? `（${row.course_code_full}）` : ""}
          </Link>
          {row.source === "makeup" ? (
           <Tag tone={statusToTagTone("補堂")} size="sm">
            補堂
           </Tag>
          ) : null}
         </span>
        }
        controls={
         <div className="text-right text-sm text-muted-foreground">
          <div>{row.teacher_name ?? "—"}</div>
          <div>{row.status || "—"}</div>
         </div>
        }
       />
       </StaggerItem>
      )
     })}
    </StaggerList>
   )}
  </div>
 )
}
