import { useEffect, useState } from "react"
import { History, NotebookPen } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { formatUnknownError } from "@/lib/formatUnknownError"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { cn } from "@/lib/utils"
import { updateSchedule } from "@/services/scheduleWriteQueries"
import {
 fetchPreviousTeachingNotes,
 type PreviousTeachingNotes,
} from "@/services/teachingNotesQueries"
import { invalidateTeachingRecordsDataCache } from "@/components/schedule/teachingRecordsState"

/** 老師常用開頭，一鍵插入加快入田 */
export const TEACHING_NOTE_QUICK_PHRASES = [
 "進度：",
 "下次：",
 "功課：",
 "家長溝通：",
 "需跟進：",
] as const

type Props = {
 scheduleId: string
 initialNotes: string | null
 classId?: string | null
 scheduledDate?: string | null
 startTime?: string | null
 /** 儲存成功後回呼（可帶最新內容） */
 onSaved?: (notes: string | null) => void
 /** 緊湊模式（點名紙／列表展開） */
 compact?: boolean
 className?: string
 /** 錯誤上報來源前綴 */
 errorSource?: string
}

export function TeachingNotesEditor({
 scheduleId,
 initialNotes,
 classId,
 scheduledDate,
 startTime,
 onSaved,
 compact = false,
 className,
 errorSource = "TeachingNotesEditor",
}: Props) {
 const [draft, setDraft] = useState(initialNotes ?? "")
 const [baseline, setBaseline] = useState(initialNotes ?? "")
 const [saving, setSaving] = useState(false)
 const [err, setErr] = useState<string | null>(null)
 const [savedFlash, setSavedFlash] = useState(false)
 const [prev, setPrev] = useState<PreviousTeachingNotes | null>(null)
 const [prevLoading, setPrevLoading] = useState(false)
 const [showPrev, setShowPrev] = useState(false)

 useEffect(() => {
  const next = initialNotes ?? ""
  setDraft(next)
  setBaseline(next)
 }, [initialNotes, scheduleId])

 useEffect(() => {
  if (!classId || !scheduledDate) {
   setPrev(null)
   return
  }
  let cancelled = false
  setPrevLoading(true)
  void fetchPreviousTeachingNotes({
   classId,
   beforeDate: scheduledDate,
   beforeStartTime: startTime,
   excludeScheduleId: scheduleId,
  })
   .then((row) => {
    if (!cancelled) setPrev(row)
   })
   .catch(() => {
    if (!cancelled) setPrev(null)
   })
   .finally(() => {
    if (!cancelled) setPrevLoading(false)
   })
  return () => {
   cancelled = true
  }
 }, [classId, scheduledDate, startTime, scheduleId])

 const dirty = draft !== baseline

 const insertPhrase = (phrase: string) => {
  setDraft((cur) => {
   const trimmed = cur.trimEnd()
   if (!trimmed) return phrase
   const needsNewline = !trimmed.endsWith("\n")
   return `${trimmed}${needsNewline ? "\n" : ""}${phrase}`
  })
 }

 const appendPrevious = () => {
  if (!prev) return
  setDraft((cur) => {
   const block = `（延續 ${prev.scheduled_date}）\n${prev.teaching_notes}`
   const trimmed = cur.trim()
   if (!trimmed) return block
   return `${trimmed}\n\n${block}`
  })
  setShowPrev(true)
 }

 const save = async () => {
  setSaving(true)
  setErr(null)
  setSavedFlash(false)
  try {
   const next = draft.trim() || null
   await updateSchedule(scheduleId, { teaching_notes: next })
   invalidateTeachingRecordsDataCache()
   setBaseline(next ?? "")
   setDraft(next ?? "")
   onSaved?.(next)
   setSavedFlash(true)
   window.setTimeout(() => setSavedFlash(false), 2000)
  } catch (e) {
   reportUserFacingError(e, {
    source: `${errorSource}.save`,
    setErr,
    userMessage: formatUnknownError(e),
   })
  } finally {
   setSaving(false)
  }
 }

 return (
  <div className={cn("space-y-3", className)}>
   {!compact ? (
    <div className="flex items-start gap-2">
     <NotebookPen className="mt-0.5 h-5 w-5 shrink-0 text-info" aria-hidden />
     <div className="min-w-0">
      <p className="text-base font-semibold text-foreground">教學紀錄</p>
      <p className="mt-0.5 text-sm text-muted-foreground">
       記錄本堂進度、內容或備忘（選填）；僅此堂可見，與營運備註分開。
      </p>
     </div>
    </div>
   ) : null}

   <div className="flex flex-wrap gap-1.5">
    {TEACHING_NOTE_QUICK_PHRASES.map((phrase) => (
     <Button
      key={phrase}
      type="button"
      variant="outline"
      size="sm"
      className="h-7 px-2 text-xs"
      onClick={() => insertPhrase(phrase)}
     >
      {phrase.replace(/：$/, "")}
     </Button>
    ))}
    {prev ? (
     <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-7 gap-1 px-2 text-xs"
      onClick={appendPrevious}
     >
      <History className="h-3.5 w-3.5" aria-hidden />
      延續上堂
     </Button>
    ) : null}
   </div>

   {prev && (showPrev || !compact) ? (
    <div className="rounded-lg border border-border/80 bg-muted/30 px-3 py-2 text-sm">
     <button
      type="button"
      className="flex w-full items-center justify-between gap-2 text-left text-xs font-medium text-muted-foreground"
      onClick={() => setShowPrev((v) => !v)}
     >
      <span>
       上堂紀錄（{prev.scheduled_date}
       {prev.start_time ? ` ${String(prev.start_time).slice(0, 5)}` : ""}）
      </span>
      <span>{showPrev ? "收起" : "展開"}</span>
     </button>
     {showPrev ? (
      <p className="mt-2 whitespace-pre-wrap text-foreground">{prev.teaching_notes}</p>
     ) : null}
    </div>
   ) : prevLoading && !compact ? (
    <p className="text-xs text-muted-foreground">載入上堂紀錄…</p>
   ) : null}

   <Textarea
    className={cn(compact ? "min-h-[88px] text-sm" : "min-h-[140px] text-base")}
    value={draft}
    onChange={(e) => setDraft(e.target.value)}
    placeholder="例如：進度：完成第 3 章&#10;下次：測驗範圍 p.40–55&#10;功課：練習卷 A"
   />

   {err ? (
    <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
     {err}
    </p>
   ) : null}

   <div className="flex flex-wrap items-center gap-3">
    <Button type="button" size={compact ? "sm" : "default"} disabled={saving || !dirty} onClick={() => void save()}>
     {saving ? "儲存中…" : "儲存教學紀錄"}
    </Button>
    {dirty ? <span className="text-xs text-amber-700">有未儲存變更</span> : null}
    {savedFlash && !dirty ? (
     <span className="text-xs text-success" role="status">
      已儲存
     </span>
    ) : null}
   </div>
  </div>
 )
}
