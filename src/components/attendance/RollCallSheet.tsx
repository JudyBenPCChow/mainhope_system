import { useCallback, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

import {
 RollCallClassPanel,
 type RollCallPanelStats,
} from "@/components/attendance/RollCallClassPanel"
import { Button } from "@/components/ui/button"
import { useAppConfirm } from "@/lib/appConfirm"
import type { RollCallScheduleEntry } from "@/lib/consecutiveLesson"
import { cn } from "@/lib/utils"
import type { ScheduleManageRow } from "@/services/scheduleQueries"

type Props = {
 entry: RollCallScheduleEntry
 scheduleMeta: ScheduleManageRow
 dateEditable: boolean
 teacherTid: string | null
 isMobile: boolean
 onClose: () => void
 onSaved?: () => void
}

export function RollCallSheet({
 entry,
 scheduleMeta,
 dateEditable,
 teacherTid,
 isMobile,
 onClose,
 onSaved,
}: Props) {
 const { confirmDialog } = useAppConfirm()
 const dirtyRef = useRef(false)

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
    description: "關閉後，尚未按「確定」的變更將不會寫入。",
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

 const handleStats = useCallback((next: RollCallPanelStats) => {
  dirtyRef.current = next.isDirty
 }, [])

 const node = (
  <div
   className="fixed inset-0 z-[200] flex flex-col justify-end md:items-center md:justify-center md:p-5"
   role="dialog"
   aria-modal="true"
   aria-label="點名紙"
  >
   <button
    type="button"
    className="absolute inset-0 animate-in fade-in duration-200 bg-slate-950/45 backdrop-blur-[2px] transition-opacity hover:bg-slate-950/50"
    aria-label="關閉點名紙"
    onClick={() => void requestClose()}
   />
   <div
    className={cn(
     "relative z-[1] flex h-[min(92vh,920px)] w-full max-w-3xl flex-col overflow-hidden rounded-t-[1.25rem] border border-info/30 bg-background",
     "shadow-[0_0_0_1px_hsl(var(--info)/0.12),0_-12px_48px_rgba(0,0,0,0.2)]",
     "animate-in fade-in slide-in-from-bottom-8 duration-300 ease-out fill-mode-both",
     "md:h-[min(86vh,900px)] md:rounded-2xl md:slide-in-from-bottom-4"
    )}
   >
    <div className="flex shrink-0 justify-center bg-gradient-to-b from-muted/40 to-transparent pt-2 md:hidden">
     <div className="h-1 w-11 rounded-full bg-muted-foreground/30" aria-hidden />
    </div>
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 px-4 py-2.5 md:px-5">
     <p className="text-xs font-medium tracking-wide text-info">點名紙</p>
     <Button type="button" variant="ghost" size="icon" onClick={() => void requestClose()}>
      <X className="h-5 w-5" />
      <span className="sr-only">關閉</span>
     </Button>
    </div>
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 md:px-4">
     <RollCallClassPanel
      entry={entry}
      scheduleMeta={scheduleMeta}
      open
      onOpenChange={(o) => {
       if (!o) void requestClose()
      }}
      dateEditable={dateEditable}
      teacherTid={teacherTid}
      isMobile={isMobile}
      presentation="sheet"
      autoPrefillWhenEmpty
      onStats={handleStats}
      onConfirmed={onSaved}
     />
    </div>
   </div>
  </div>
 )

 return createPortal(node, document.body)
}
