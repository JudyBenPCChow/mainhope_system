import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import { formatUnknownError } from "@/lib/formatUnknownError"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { countPendingLeaveRows, filterMakeupCandidates, leaveTabKind } from "@/lib/studentLeaveTab"
import { cn } from "@/lib/utils"
import {
 fetchEnrolledClassesForStudent,
 fetchMakeupCandidateSchedules,
 fetchUpcomingSchedulesForClass,
 formatLeaveScheduleOptionLabel,
 formatMakeupCandidateLabel,
 insertLeaveMakeupForSchedule,
 LEAVE_MAKEUP_OPTIONS,
 LEAVE_REASON_OPTIONS,
 validateMakeupScheduleForStudent,
 type ClassScheduleOption,
 type ConsecutiveLeaveScope,
 type EnrolledClassOption,
} from "@/services/leaveQueries"
import type { ScheduleManageRow } from "@/services/scheduleQueries"
import { fetchLeaveForStudent, type LeaveRow } from "@/services/studentQueries"

function localTodayYmd() {
 const d = new Date()
 return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function Field({
 label,
 children,
 className,
}: {
 label: string
 children: React.ReactNode
 className?: string
}) {
 return (
  <div className={cn("space-y-1", className)}>
   <label className="text-xs font-medium text-muted-foreground">{label}</label>
   {children}
  </div>
 )
}

export function StudentLeaveTab({
 studentId,
 active,
 reloadToken,
 canMutateLeave,
 canOpenLeaveManagement,
 onChanged,
}: {
 studentId: string
 active: boolean
 reloadToken: number
 canMutateLeave: boolean
 canOpenLeaveManagement: boolean
 onChanged: () => Promise<void> | void
}) {
 const { pushBanner } = useAppBanner()
 const { confirmDialog } = useAppConfirm()
 const [rows, setRows] = useState<LeaveRow[]>([])
 const [loadState, setLoadState] = useState<"idle" | "loading" | "ready" | "error">("idle")
 const [listErr, setListErr] = useState<string | null>(null)
 const loadedRef = useRef(false)

 useEffect(() => {
  loadedRef.current = false
  setRows([])
  setLoadState("idle")
  setListErr(null)
 }, [studentId])

 const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
 const [leaveClasses, setLeaveClasses] = useState<EnrolledClassOption[]>([])
 const [leaveClassId, setLeaveClassId] = useState("")
 const [leaveScheduleOptions, setLeaveScheduleOptions] = useState<ClassScheduleOption[]>([])
 const [leaveScheduleId, setLeaveScheduleId] = useState("")
 const [leaveReasonPick, setLeaveReasonPick] = useState<(typeof LEAVE_REASON_OPTIONS)[number]>("病假")
 const [leaveMakeup, setLeaveMakeup] = useState<(typeof LEAVE_MAKEUP_OPTIONS)[number]>("待安排")
 const [leaveMakeupScheduleId, setLeaveMakeupScheduleId] = useState("")
 const [leaveMakeupSearch, setLeaveMakeupSearch] = useState("")
 const [leaveMakeupCandidates, setLeaveMakeupCandidates] = useState<ScheduleManageRow[]>([])
 const [leaveConsecutiveScope, setLeaveConsecutiveScope] = useState<ConsecutiveLeaveScope>("this_slot")
 const [leaveRemarks, setLeaveRemarks] = useState("")
 const [leaveSaving, setLeaveSaving] = useState(false)
 const [leaveErr, setLeaveErr] = useState<string | null>(null)

 const load = useCallback(async () => {
  setLoadState("loading")
  setListErr(null)
  try {
   const data = await fetchLeaveForStudent(studentId)
   setRows(data)
   setLoadState("ready")
   loadedRef.current = true
  } catch (e) {
   const message = formatUnknownError(e)
   setListErr(message)
   setLoadState("error")
   reportUserFacingError(e, { source: "StudentLeaveTab.load" })
  }
 }, [studentId])

 useEffect(() => {
  if (!active && !loadedRef.current) return
  void load()
 }, [active, reloadToken, load])

 const leaveMakeupFiltered = useMemo(
  () => filterMakeupCandidates(leaveMakeupCandidates, leaveMakeupSearch),
  [leaveMakeupCandidates, leaveMakeupSearch]
 )

 const openLeaveDialog = async () => {
  if (!canMutateLeave) return
  setLeaveErr(null)
  setLeaveClassId("")
  setLeaveScheduleId("")
  setLeaveScheduleOptions([])
  setLeaveReasonPick("病假")
  setLeaveMakeup("待安排")
  setLeaveMakeupScheduleId("")
  setLeaveMakeupSearch("")
  setLeaveConsecutiveScope("this_slot")
  setLeaveRemarks("")
  setLeaveDialogOpen(true)
  try {
   const classes = await fetchEnrolledClassesForStudent(studentId)
   setLeaveClasses(classes)
   setLeaveMakeupCandidates([])
  } catch (e) {
   reportUserFacingError(e, { source: "StudentDetailView.openLeaveDialog", setErr: setLeaveErr })
   setLeaveClasses([])
   setLeaveMakeupCandidates([])
  }
 }

 useEffect(() => {
  if (!leaveDialogOpen || leaveMakeup !== "調堂" || !studentId) {
   if (!leaveDialogOpen || leaveMakeup !== "調堂") {
    setLeaveMakeupCandidates([])
    setLeaveMakeupScheduleId("")
   }
   return
  }
  void fetchMakeupCandidateSchedules({
   studentId,
   excludeScheduleIds: leaveScheduleId ? [leaveScheduleId] : undefined,
  })
   .then((list) => {
    setLeaveMakeupCandidates(list)
    setLeaveMakeupScheduleId((prev) => (prev && list.some((s) => s.id === prev) ? prev : ""))
   })
   .catch((e) => {
    reportUserFacingError(e, { source: "StudentDetailView.loadMakeupCandidates", setErr: setLeaveErr })
    setLeaveMakeupCandidates([])
   })
 }, [leaveDialogOpen, leaveMakeup, studentId, leaveScheduleId])

 useEffect(() => {
  if (!leaveDialogOpen || !leaveClassId) {
   setLeaveScheduleOptions([])
   setLeaveScheduleId("")
   return
  }
  void fetchUpcomingSchedulesForClass(leaveClassId, localTodayYmd(), studentId).then((opts) => {
   setLeaveScheduleOptions(opts)
   setLeaveScheduleId("")
  })
 }, [leaveDialogOpen, leaveClassId, studentId])

 const submitStudentLeave = async () => {
  if (!leaveClassId || !leaveScheduleId) {
   setLeaveErr("請選擇班別與請假排程")
   return
  }
  if (leaveMakeup === "調堂" && !leaveMakeupScheduleId) {
   setLeaveErr("補課安排為「調堂」時請選擇補堂排程")
   return
  }
  const sched = leaveScheduleOptions.find((s) => s.id === leaveScheduleId)
  if (!sched) {
   setLeaveErr("請假排程無效")
   return
  }
  const makeupRow =
   leaveMakeup === "調堂" ? leaveMakeupCandidates.find((s) => s.id === leaveMakeupScheduleId) : undefined
  if (makeupRow) {
   const makeupErr = await validateMakeupScheduleForStudent(studentId, makeupRow, leaveScheduleId)
   if (makeupErr) {
    setLeaveErr(makeupErr)
    return
   }
  }
  const consecutiveScope = sched.consecutive_group_id ? leaveConsecutiveScope : "this_slot"
  if (
   consecutiveScope === "all" &&
   !(await confirmDialog({
    title: "連堂兩節一併請假",
    description: "將建立兩筆請假，欠補最多 2 堂。若只欠一節，請改選「只請本節」。",
    confirmText: "確認兩節一併",
    tone: "warning",
   }))
  ) {
   return
  }
  setLeaveSaving(true)
  setLeaveErr(null)
  try {
   await insertLeaveMakeupForSchedule({
    student_id: studentId,
    class_id: leaveClassId,
    schedule_id: leaveScheduleId,
    leave_date: sched.scheduled_date,
    leave_reason: leaveReasonPick,
    makeup_type: leaveMakeup,
    makeup_schedule_id: leaveMakeup === "調堂" ? leaveMakeupScheduleId : null,
    makeup_date: makeupRow?.scheduled_date ?? null,
    remarks: leaveRemarks.trim() || null,
    status: "待補課",
    consecutiveScope,
   })
   setLeaveDialogOpen(false)
   await onChanged()
   pushBanner({ tone: "success", title: "已新增請假", message: "請假紀錄已建立。" })
  } catch (e) {
   reportUserFacingError(e, { source: "StudentDetailView.submitLeave", setErr: setLeaveErr })
  } finally {
   setLeaveSaving(false)
  }
 }

 if (!active && !loadedRef.current && loadState === "idle") return null

 const kind = leaveTabKind(
  loadState === "error"
   ? { status: "error", message: listErr ?? "" }
   : loadState === "ready"
     ? { status: "ready", rows }
     : { status: "loading" }
 )
 const pendingCount = countPendingLeaveRows(rows)

 return (
  <div hidden={!active} className="mx-auto max-w-3xl space-y-4">
   <div className="flex flex-wrap items-center justify-between gap-2">
    <p className="text-sm text-muted-foreground">
     {kind === "error" ? (
      "請假紀錄未能載入。"
     ) : kind === "loading" ? (
      "載入中…"
     ) : (
      <>
       共 {rows.length} 筆請假記錄 · 待補 {pendingCount} 堂。
       {canOpenLeaveManagement ? (
        <span className="hidden sm:inline"> 點一筆可開啟請假管理並定位該紀錄。</span>
       ) : (
        <span className="mt-1 block text-xs text-muted-foreground sm:mt-0 sm:ml-1 sm:inline">
         補堂安排請交行政處理。
        </span>
       )}
      </>
     )}
    </p>
    {canMutateLeave ? (
     <Button type="button" variant="secondary" size="sm" onClick={() => void openLeaveDialog()}>
      <Plus className="h-4 w-4" />
      新增請假
     </Button>
    ) : null}
   </div>

   {canMutateLeave ? (
    <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
     <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
      <DialogHeader>
       <DialogTitle>新增請假</DialogTitle>
      </DialogHeader>
      <div className="grid gap-3 text-sm">
       <Field label="班別（就讀中）">
        <Select
         className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm shadow-sm"
         value={leaveClassId}
         onChange={(e) => setLeaveClassId(e.target.value)}
         disabled={leaveClasses.length === 0}
        >
         {leaveClasses.length === 0 ? (
          <option value="">尚無就讀中班別</option>
         ) : (
          [
           <option key="__placeholder_class__" value="">
            請選擇班別
           </option>,
           ...leaveClasses.map((c) => (
            <option key={c.id} value={c.id}>
             {c.subject}
             {c.course_code_full ? `（${c.course_code_full}）` : ""}
            </option>
           )),
          ]
         )}
        </Select>
       </Field>
       <Field label="請假排程（今日起、未取消／完成）">
        <Select
         className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm shadow-sm"
         value={leaveScheduleId}
         onChange={(e) => {
          setLeaveScheduleId(e.target.value)
          setLeaveConsecutiveScope("this_slot")
         }}
         disabled={!leaveClassId || leaveScheduleOptions.length === 0}
        >
         {!leaveClassId ? (
          <option value="">請先選擇班別</option>
         ) : leaveScheduleOptions.length === 0 ? (
          <option value="">此班尚無符合條件之排程</option>
         ) : (
          [
           <option key="__placeholder_schedule__" value="">
            請選擇堂次
           </option>,
           ...leaveScheduleOptions.map((s) => (
            <option key={s.id} value={s.id}>
             {formatLeaveScheduleOptionLabel(s)}
            </option>
           )),
          ]
         )}
        </Select>
       </Field>
       {leaveScheduleOptions.find((s) => s.id === leaveScheduleId)?.consecutive_group_id ? (
        <Field label="連堂請假範圍">
         <Select
          className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm shadow-sm"
          value={leaveConsecutiveScope}
          onChange={(e) => setLeaveConsecutiveScope(e.target.value as ConsecutiveLeaveScope)}
         >
          <option value="this_slot">只請本節（欠 1 堂；預設）</option>
          <option value="all">連堂兩節一併請假（欠最多 2 堂）</option>
         </Select>
         {leaveConsecutiveScope === "all" ? (
          <p className="text-xs text-warning">將欠補 2 堂；若只欠一節請改回「只請本節」。</p>
         ) : (
          <p className="text-xs text-muted-foreground">只欠一節時請維持此選項；兩節都欠才改「兩節一併」。</p>
         )}
        </Field>
       ) : null}
       <Field label="原因">
        <Select
         className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm shadow-sm"
         value={leaveReasonPick}
         onChange={(e) => setLeaveReasonPick(e.target.value as (typeof LEAVE_REASON_OPTIONS)[number])}
        >
         {LEAVE_REASON_OPTIONS.map((o) => (
          <option key={o} value={o}>
           {o}
          </option>
         ))}
        </Select>
       </Field>
       <Field label="補課安排">
        <Select
         className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm shadow-sm"
         value={leaveMakeup}
         onChange={(e) => {
          const v = e.target.value as (typeof LEAVE_MAKEUP_OPTIONS)[number]
          setLeaveMakeup(v)
          if (v !== "調堂") setLeaveMakeupScheduleId("")
         }}
        >
         {LEAVE_MAKEUP_OPTIONS.map((o) => (
          <option key={o} value={o}>
           {o}
          </option>
         ))}
        </Select>
       </Field>
       {leaveMakeup === "調堂" ? (
        <div className="space-y-2 rounded-lg border border-info bg-info/40 p-3">
         <p className="text-xs font-medium text-info">
          補堂排程（未來一個月內、可跨班；連堂請選正確那一節，只計 1 堂）
         </p>
         <Input
          placeholder="搜尋科目、代碼、老師、日期…"
          value={leaveMakeupSearch}
          onChange={(e) => setLeaveMakeupSearch(e.target.value)}
          className="h-9"
         />
         <Select
          className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
          value={leaveMakeupScheduleId}
          onChange={(e) => setLeaveMakeupScheduleId(e.target.value)}
         >
          <option value="">請選擇補堂排程</option>
          {leaveMakeupFiltered.map((s) => (
           <option key={s.id} value={s.id}>
            {formatMakeupCandidateLabel(s)}
           </option>
          ))}
         </Select>
        </div>
       ) : null}
       <Field label="備註（選填）">
        <Input value={leaveRemarks} onChange={(e) => setLeaveRemarks(e.target.value)} className="h-9" />
       </Field>
       {leaveErr ? <p className="text-sm text-destructive">{leaveErr}</p> : null}
       <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" disabled={leaveSaving} onClick={() => setLeaveDialogOpen(false)}>
         取消
        </Button>
        <Button type="button" disabled={leaveSaving} onClick={() => void submitStudentLeave()}>
         {leaveSaving ? "儲存中…" : "儲存"}
        </Button>
       </div>
      </div>
     </DialogContent>
    </Dialog>
   ) : null}

   {kind === "loading" ? (
    <p className="py-8 text-center text-sm text-muted-foreground">載入中…</p>
   ) : kind === "error" ? (
    <div className="space-y-2 py-8 text-center" role="alert">
     <p className="text-sm text-destructive">請假紀錄未能載入{listErr ? `：${listErr}` : "。"}</p>
     <button type="button" className="text-sm font-medium text-primary hover:underline" onClick={() => void load()}>
      重試
     </button>
    </div>
   ) : kind === "empty" ? (
    <p className="py-8 text-center text-sm text-muted-foreground">尚無請假記錄</p>
   ) : (
    <ul className="space-y-2">
     {rows.map((x) => (
      <li key={x.id}>
       {canOpenLeaveManagement ? (
        <Link
         to={`/LeaveManagement?${new URLSearchParams({ studentId, record: x.id }).toString()}`}
         className="block rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm transition-colors hover:border-primary/50 hover:bg-muted/40"
        >
         <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="font-medium text-primary">{x.classLabel}</span>
          <span className="text-xs text-muted-foreground">請假管理 →</span>
         </div>
         <div className="mt-1 text-muted-foreground">
          {x.leave_date} · {x.leave_reason ?? "—"} · {x.status}
         </div>
        </Link>
       ) : (
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm">
         <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="font-medium">{x.classLabel}</span>
         </div>
         <div className="mt-1 text-muted-foreground">
          {x.leave_date} · {x.leave_reason ?? "—"} · {x.status}
         </div>
        </div>
       )}
      </li>
     ))}
    </ul>
   )}
  </div>
 )
}
