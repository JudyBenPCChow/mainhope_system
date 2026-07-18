import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { CheckCircle2, ListChecks, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tag } from "@/components/ui/tag"
import { useAppConfirm } from "@/lib/appConfirm"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"
import type { ScheduleManageRow } from "@/services/scheduleQueries"

import {
 isPrototypeBillableStatus,
 PROTOTYPE_BILLABLE_OPTIONS,
 PROTOTYPE_NON_BILLABLE_OPTIONS,
 PROTOTYPE_STATUS_HELP,
 rollcallHintForSchedule,
 suggestedPrefillForStudent,
 type PrototypeStatus,
 type PrototypeStudent,
} from "./mockData"

type Props = {
 schedule: ScheduleManageRow
 students: PrototypeStudent[]
 onClose: () => void
 onSaved?: (scheduleId: string) => void
 initiallySaved?: boolean
}

function mapsEqual(a: Map<string, string>, b: Map<string, string>): boolean {
 if (a.size !== b.size) return false
 for (const [k, v] of a) {
  if (b.get(k) !== v) return false
 }
 return true
}

/** 開紙即預填：有請假依安排建議，其餘預設「現場」 */
function buildInitialStatusMap(students: PrototypeStudent[]): Map<string, string> {
 const next = new Map<string, string>()
 for (const s of students) {
  next.set(s.id, suggestedPrefillForStudent(s) ?? "現場")
 }
 return next
}

function statusActiveButtonClass(status: PrototypeStatus): string {
 switch (status) {
  case "現場":
   return "border-success bg-success text-white shadow-sm ring-2 ring-success/30"
  case "錄影回放":
   return "border-info bg-info text-info-foreground shadow-sm ring-2 ring-info/30"
  case "zoom實時網課":
   return "border-neutral-700 bg-neutral-700 text-white shadow-sm ring-2 ring-neutral-700/30"
  case "no show":
   return "border-destructive bg-destructive text-white shadow-sm ring-2 ring-destructive/30"
  case "請假而不需補回":
   return "border-warning bg-warning text-warning-foreground shadow-sm ring-2 ring-warning/40"
  case "事假":
   return "border-warning/80 bg-warning/25 text-warning shadow-sm ring-2 ring-warning/25"
  case "病假":
   return "border-warning bg-warning/40 text-warning-foreground shadow-sm ring-2 ring-warning/30"
 }
}

function StatusOptionButton({
 status,
 active,
 onSelect,
}: {
 status: PrototypeStatus
 active: boolean
 onSelect: () => void
}) {
 return (
  <span className="relative inline-flex">
   <button
    type="button"
    onClick={onSelect}
    className={cn(
     "peer rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-all duration-150 active:scale-[0.97]",
     active
      ? statusActiveButtonClass(status)
      : "border-border bg-background text-muted-foreground hover:bg-muted/60"
    )}
   >
    {status}
   </button>
   {/* 桌面懸停說明；手機不顯示 */}
   <span
    role="tooltip"
    className={cn(
     "pointer-events-none absolute left-0 top-full z-30 mt-1.5 hidden w-56",
     "rounded-lg border border-border bg-background px-3 py-2 text-left text-xs leading-relaxed text-foreground shadow-lg",
     "opacity-0 transition-opacity duration-150",
     "md:block md:peer-hover:opacity-100 md:peer-focus-visible:opacity-100"
    )}
   >
    <span className="mb-0.5 block font-semibold">{status}</span>
    {PROTOTYPE_STATUS_HELP[status]}
   </span>
  </span>
 )
}

export function PrototypeRollCallSheet({
 schedule,
 students,
 onClose,
 onSaved,
 initiallySaved,
}: Props) {
 const { confirmDialog } = useAppConfirm()
 const [statusMap, setStatusMap] = useState(() => buildInitialStatusMap(students))
 const [savedMap, setSavedMap] = useState<Map<string, string>>(() => new Map())
 const [confirmSaving, setConfirmSaving] = useState(false)
 const [justSaved, setJustSaved] = useState(Boolean(initiallySaved))
 const [formErr, setFormErr] = useState<string | null>(null)

 const hints = rollcallHintForSchedule(schedule.id)
 const isConsecutive = Boolean(schedule.consecutive_group_id) || schedule.class_lesson_slots_per_session >= 2
 const lessonUnits = isConsecutive ? 2 : 1
 const timeLabel =
  schedule.start_time && schedule.end_time
   ? `${schedule.start_time}–${schedule.end_time}`
   : schedule.start_time ?? "—"

 const dirty = useMemo(() => !mapsEqual(statusMap, savedMap), [statusMap, savedMap])
 const dirtyRef = useRef(dirty)
 dirtyRef.current = dirty

 const billableCount = useMemo(() => {
  let n = 0
  for (const s of students) {
   const st = statusMap.get(s.id)
   if (st && isPrototypeBillableStatus(st)) n += lessonUnits
  }
  return n
 }, [students, statusMap, lessonUnits])

 useEffect(() => {
  const prev = document.body.style.overflow
  document.body.style.overflow = "hidden"
  return () => {
   document.body.style.overflow = prev
  }
 }, [])

 const requestClose = useCallback(async () => {
  if (dirtyRef.current) {
   const ok = await confirmDialog({
    title: "放棄未儲存的點名？",
    description: "關閉後，此原型頁的草稿狀態會遺失（不會影響真實資料）。",
    confirmText: "放棄並關閉",
    cancelText: "繼續編輯",
    tone: "destructive",
   })
   if (!ok) return
  }
  onClose()
 }, [confirmDialog, onClose])

 useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
   if (e.key === "Escape") void requestClose()
  }
  window.addEventListener("keydown", onKey)
  return () => window.removeEventListener("keydown", onKey)
 }, [requestClose])

 const setStatus = (studentId: string, status: PrototypeStatus) => {
  setStatusMap((prev) => {
   const next = new Map(prev)
   next.set(studentId, status)
   return next
  })
  setJustSaved(false)
  setFormErr(null)
 }

 /** 全部現場：當日有請假單的學生一律不覆蓋 */
 const fillAllPresent = () => {
  setStatusMap((prev) => {
   const next = new Map(prev)
   for (const s of students) {
    if (s.leave) continue
    next.set(s.id, "現場")
   }
   return next
  })
  setJustSaved(false)
  setFormErr(null)
 }

 const handleConfirm = () => {
  const missing = students.filter((s) => !statusMap.get(s.id))
  if (missing.length > 0) {
   setFormErr(`還有 ${missing.length} 位未選狀態（原型提示，不會寫入資料庫）。`)
   return
  }
  setFormErr(null)
  setConfirmSaving(true)
  window.setTimeout(() => {
   setSavedMap(new Map(statusMap))
   setJustSaved(true)
   setConfirmSaving(false)
   onSaved?.(schedule.id)
  }, 280)
 }

 const filled = students.filter((s) => statusMap.has(s.id)).length
 const classTitle = schedule.course_code_full
  ? `${schedule.classLabel}（${schedule.course_code_full}）`
  : schedule.classLabel

 const node = (
  <div
   className="fixed inset-0 z-[200] flex flex-col justify-end md:items-center md:justify-center md:p-5"
   role="dialog"
   aria-modal="true"
   aria-label="點名紙原型"
  >
   <button
    type="button"
    className="absolute inset-0 animate-in fade-in duration-200 bg-slate-950/45 backdrop-blur-[2px] transition-opacity hover:bg-slate-950/50"
    aria-label="關閉點名紙"
    onClick={() => void requestClose()}
   />
   <div
    className={cn(
     "relative z-[1] flex h-[min(92vh,920px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-[1.25rem] border border-info/30 bg-background",
     "shadow-[0_0_0_1px_hsl(var(--info)/0.12),0_-12px_48px_rgba(0,0,0,0.2)]",
     "animate-in fade-in slide-in-from-bottom-8 duration-300 ease-out fill-mode-both",
     "md:h-[min(86vh,840px)] md:rounded-2xl md:slide-in-from-bottom-4 md:shadow-[0_0_0_1px_hsl(var(--info)/0.12),0_25px_80px_rgba(0,0,0,0.22)]"
    )}
   >
    <div className="flex shrink-0 justify-center bg-gradient-to-b from-muted/40 to-transparent pt-2 md:hidden">
     <div className="h-1 w-11 rounded-full bg-muted-foreground/30" aria-hidden />
    </div>

    <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border/60 px-4 py-3 md:px-5">
     <div className="min-w-0 space-y-1">
      <p className="text-xs font-medium tracking-wide text-info">點名紙 · 原型</p>
      <h2 className="truncate text-lg font-semibold md:text-xl">{classTitle}</h2>
      <p className="text-sm text-muted-foreground">
       {timeLabel} · 課室 {schedule.classroom_name ?? "—"}
       {isConsecutive ? ` · 連續 ${lessonUnits} 堂` : " · 1 堂"}
      </p>
      <div className="flex flex-wrap gap-1.5 pt-1">
       <Tag tone={statusToTagTone(schedule.status)} size="sm">
        {schedule.status}
       </Tag>
       {hints.leaveHint ? (
        <Tag tone="warning" size="sm">
         {hints.leaveHint}
        </Tag>
       ) : null}
       {hints.trialHint ? (
        <Tag tone="info" size="sm">
         {hints.trialHint}
        </Tag>
       ) : null}
       {dirty ? (
        <Tag tone="warning" size="sm">
         未儲存
        </Tag>
       ) : null}
       {justSaved && !dirty ? (
        <Tag tone="success" size="sm">
         已點名（本地）
        </Tag>
       ) : null}
      </div>
      <p className="hidden pt-1 text-xs leading-relaxed text-muted-foreground md:block">
       桌面可將滑鼠移到狀態按鈕上查看說明。扣堂：現場／錄影回放／zoom實時網課／no show／請假而不需補回。不扣堂：事假／病假。
      </p>
     </div>
     <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => void requestClose()}>
      <X className="h-5 w-5" />
      <span className="sr-only">關閉</span>
     </Button>
    </header>

    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border/50 bg-muted/20 px-4 py-2.5 md:px-5">
     <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={fillAllPresent}>
      <ListChecks className="h-4 w-4" />
      全部現場
     </Button>
     <span className="ml-auto text-sm tabular-nums text-muted-foreground">
      已標記 {filled}/{students.length}
      {filled > 0 ? ` · 預估扣 ${billableCount} 堂` : ""}
     </span>
    </div>
    <p className="border-b border-border/40 bg-muted/10 px-4 py-1.5 text-xs text-muted-foreground md:px-5">
     已依請假／預設帶入狀態，可直接改選。所有狀態一次列出；「全部現場」不會覆蓋有請假單的學生。
    </p>

    <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4 md:px-5">
     {students.map((s, index) => {
      const status = statusMap.get(s.id) as PrototypeStatus | undefined
      const suggested = suggestedPrefillForStudent(s)
      const billable = status ? isPrototypeBillableStatus(status) : null
      const fromLeavePrefill = Boolean(suggested && status === suggested)
      return (
       <li
        key={s.id}
        className={cn(
         "rounded-xl border border-border bg-card p-3 shadow-sm transition-all duration-200",
         "animate-in fade-in slide-in-from-bottom-2 fill-mode-both",
         status ? "border-border" : "border-dashed"
        )}
        style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}
       >
        <div className="mb-3 flex flex-wrap items-center gap-2">
         <p className="font-medium">
          {s.fullName}
          {s.englishName ? (
           <span className="ml-1.5 text-sm font-normal text-muted-foreground">{s.englishName}</span>
          ) : null}
         </p>
         {s.grade ? (
          <Tag tone="default" size="sm">
           {s.grade}
          </Tag>
         ) : null}
         {s.source === "trial" ? (
          <Tag tone="info" size="sm">
           試堂
          </Tag>
         ) : null}
         {s.source === "makeup" ? (
          <Tag tone="warning" size="sm">
           補堂
          </Tag>
         ) : null}
         {s.leave ? (
          <Tag tone="warning" size="sm">
           請假：{s.leave.leaveReason}／{s.leave.makeupType}
          </Tag>
         ) : null}
         {fromLeavePrefill ? (
          <Tag tone="info" size="sm">
           已預填
          </Tag>
         ) : null}
         {status ? (
          <Tag tone={statusToTagTone(status)} size="sm">
           {status}
          </Tag>
         ) : null}
         {billable === true ? (
          <Tag tone="success" size="sm">
           扣堂{isConsecutive ? `×${lessonUnits}` : ""}
          </Tag>
         ) : null}
         {billable === false ? (
          <Tag tone="default" size="sm">
           不扣堂
          </Tag>
         ) : null}
        </div>

        <div className="space-y-2.5">
         <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">會扣堂</p>
          <div className="flex flex-wrap gap-1.5">
           {PROTOTYPE_BILLABLE_OPTIONS.map((opt) => (
            <StatusOptionButton
             key={opt}
             status={opt}
             active={status === opt}
             onSelect={() => setStatus(s.id, opt)}
            />
           ))}
          </div>
         </div>
         <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">不扣堂</p>
          <div className="flex flex-wrap gap-1.5">
           {PROTOTYPE_NON_BILLABLE_OPTIONS.map((opt) => (
            <StatusOptionButton
             key={opt}
             status={opt}
             active={status === opt}
             onSelect={() => setStatus(s.id, opt)}
            />
           ))}
          </div>
         </div>
        </div>
       </li>
      )
     })}
    </ul>

    <footer className="flex shrink-0 flex-col gap-2 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:px-5">
     {formErr ? <p className="text-sm text-destructive">{formErr}</p> : null}
     <div className="flex items-center justify-between gap-3">
      <p className="text-xs text-muted-foreground md:text-sm">
       原型：確定只更新本頁 · 未點名不會自動銷堂
      </p>
      <Button
       type="button"
       size="lg"
       className="min-w-[8rem] gap-2 transition-transform active:scale-[0.98]"
       disabled={confirmSaving}
       onClick={handleConfirm}
      >
       <CheckCircle2 className="h-5 w-5" />
       {confirmSaving ? "儲存中…" : "確定"}
      </Button>
     </div>
    </footer>
   </div>
  </div>
 )

 return createPortal(node, document.body)
}
