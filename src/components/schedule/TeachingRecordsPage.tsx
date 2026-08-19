import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ChevronDown, NotebookPen, Search } from "lucide-react"

import { TeachingNotesEditor } from "@/components/schedule/TeachingNotesEditor"
import { Button } from "@/components/ui/button"
import { DateRangeInput, type DateRangeValue } from "@/components/ui/date-range-input"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { useAuth } from "@/lib/authBootstrap"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { statusToTagTone } from "@/lib/statusTag"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { getTeacherScopeTeacherId } from "@/lib/teacherScope"
import { cn } from "@/lib/utils"
import { localYmd } from "@/services/teacherQueries"
import {
 fetchTeachingNotesInRange,
 type TeachingNotesRow,
} from "@/services/teachingNotesQueries"

type NotesScope = "withNotes" | "all"

function defaultRange(): DateRangeValue {
 const to = new Date()
 const from = new Date()
 from.setDate(from.getDate() - 45)
 return { from: localYmd(from), to: localYmd(to) }
}

function snippet(text: string, max = 90): string {
 const one = text.replace(/\s+/g, " ").trim()
 if (one.length <= max) return one
 return `${one.slice(0, max)}…`
}

export function TeachingRecordsPage() {
 const { profile } = useAuth()
 const teacherTid = getTeacherScopeTeacherId(profile)
 const [dateRange, setDateRange] = useState<DateRangeValue>(() => defaultRange())
 const [keyword, setKeyword] = useState("")
 const [scope, setScope] = useState<NotesScope>("withNotes")
 const [classFilter, setClassFilter] = useState("all")
 const [rows, setRows] = useState<TeachingNotesRow[]>([])
 const [loading, setLoading] = useState(true)
 const [err, setErr] = useState<string | null>(null)
 const [expandedId, setExpandedId] = useState<string | null>(null)

 const reload = useCallback(async () => {
  if (!isSupabaseConfigured) return
  setLoading(true)
  setErr(null)
  try {
   const from = dateRange.from || localYmd()
   const to = dateRange.to || from
   const list = await fetchTeachingNotesInRange(from, to, { teacherId: teacherTid })
   setRows(list)
  } catch (e) {
   reportUserFacingError(e, { source: "TeachingRecordsPage.reload", setErr })
   setRows([])
  } finally {
   setLoading(false)
  }
 }, [dateRange.from, dateRange.to, teacherTid])

 useEffect(() => {
  void reload()
 }, [reload])

 const classOptions = useMemo(() => {
  const m = new Map<string, string>()
  for (const r of rows) {
   if (!r.class_id) continue
   if (!m.has(r.class_id)) m.set(r.class_id, r.classLabel)
  }
  return [...m.entries()]
   .map(([id, label]) => ({ id, label }))
   .sort((a, b) => a.label.localeCompare(b.label, "zh-Hant"))
 }, [rows])

 const notesCount = useMemo(
  () => rows.filter((r) => r.teaching_notes?.trim()).length,
  [rows]
 )

 const displayRows = useMemo(() => {
  const q = keyword.trim().toLowerCase()
  return rows.filter((r) => {
   const filled = Boolean(r.teaching_notes?.trim())
   if (scope === "withNotes" && !filled) return false
   if (classFilter !== "all" && r.class_id !== classFilter) return false
   if (q) {
    const hay = `${r.classLabel} ${r.course_code_full ?? ""} ${r.teaching_notes ?? ""} ${r.classroom_name ?? ""}`.toLowerCase()
    if (!hay.includes(q)) return false
   }
   return true
  })
 }, [rows, keyword, scope, classFilter])

 const onRowSaved = (id: string, notes: string | null) => {
  setRows((prev) => prev.map((r) => (r.id === id ? { ...r, teaching_notes: notes } : r)))
 }

 return (
  <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
   <header className="space-y-1">
    <div className="flex items-center gap-2">
     <NotebookPen className="h-6 w-6 text-info" aria-hidden />
     <h1 className="text-2xl font-semibold tracking-tight">教學紀錄</h1>
    </div>
    <p className="text-sm text-muted-foreground md:text-base">
     選填備忘，方便日後回查進度；亦可於點名或排程詳情隨手記下。
    </p>
   </header>

   {!isSupabaseConfigured ? (
    <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
     尚未設定 Supabase，無法載入教學紀錄。
    </p>
   ) : null}

   <section className="rounded-2xl border border-border bg-card p-4 shadow-sm md:p-5">
    <div className="flex flex-wrap gap-3 text-sm">
     <span className="rounded-lg bg-info/10 px-3 py-1.5 text-info tabular-nums">
      有紀錄 <strong>{notesCount}</strong> 堂
     </span>
     <span className="rounded-lg bg-muted/60 px-3 py-1.5 tabular-nums text-muted-foreground">
      區間排程 {rows.length} 堂
     </span>
    </div>

    <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
     <div className="space-y-1.5 lg:col-span-2">
      <label className="text-xs font-medium text-muted-foreground">日期區間</label>
      <DateRangeInput value={dateRange} onChange={setDateRange} />
     </div>
     <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">顯示範圍</label>
      <Select
       value={scope}
       onChange={(e) => setScope(e.target.value as NotesScope)}
       aria-label="顯示範圍"
      >
       <option value="withNotes">僅有紀錄</option>
       <option value="all">全部堂次</option>
      </Select>
     </div>
     <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">班別</label>
      <Select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} aria-label="班別">
       <option value="all">全部班別</option>
       {classOptions.map((c) => (
        <option key={c.id} value={c.id}>
         {c.label}
        </option>
       ))}
      </Select>
     </div>
     <div className="relative space-y-1.5 md:col-span-2 lg:col-span-4">
      <label className="text-xs font-medium text-muted-foreground">搜尋</label>
      <div className="relative">
       <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
       <Input
        className="pl-9"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="搜尋班別、內容關鍵字…"
        aria-label="搜尋教學紀錄"
       />
      </div>
     </div>
    </div>
   </section>

   {err ? (
    <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
     {err}
    </p>
   ) : null}

   <section className="space-y-2">
    {loading ? (
     <p className="text-sm text-muted-foreground">載入中…</p>
    ) : displayRows.length === 0 ? (
     <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
      {scope === "withNotes"
       ? "這個區間尚無教學紀錄。需要時可改為「全部堂次」再展開填寫。"
       : "這個篩選條件下沒有堂次，可放寬日期或班別。"}
     </p>
    ) : (
     <ul className="space-y-2">
      {displayRows.map((r) => {
       const filled = Boolean(r.teaching_notes?.trim())
       const open = expandedId === r.id
       return (
        <li key={r.id} className="rounded-xl border border-border bg-card shadow-sm">
         <button
          type="button"
          className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30"
          onClick={() => setExpandedId(open ? null : r.id)}
          aria-expanded={open}
         >
          <ChevronDown
           className={cn(
            "mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
           )}
           aria-hidden
          />
          <div className="min-w-0 flex-1">
           <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-foreground">{r.classLabel}</span>
            <Tag tone={statusToTagTone(r.status)} size="sm">
             {r.status}
            </Tag>
            {filled ? (
             <Tag tone="info" size="sm">
              已有紀錄
             </Tag>
            ) : null}
           </div>
           <p className="mt-1 text-sm text-muted-foreground">
            {r.scheduled_date}
            {r.start_time ? ` · ${String(r.start_time).slice(0, 5)}` : ""}
            {r.end_time ? `–${String(r.end_time).slice(0, 5)}` : ""}
            {r.session_number != null ? ` · 第 ${r.session_number} 堂` : ""}
            {r.classroom_name ? ` · ${r.classroom_name}` : ""}
           </p>
           {filled && !open ? (
            <p className="mt-2 text-sm text-foreground">{snippet(r.teaching_notes!)}</p>
           ) : null}
          </div>
         </button>
         {open ? (
          <div className="space-y-3 border-t border-border px-4 py-4">
           <TeachingNotesEditor
            scheduleId={r.id}
            initialNotes={r.teaching_notes}
            classId={r.class_id}
            scheduledDate={r.scheduled_date}
            startTime={r.start_time}
            compact
            errorSource="TeachingRecordsPage"
            onSaved={(notes) => onRowSaved(r.id, notes)}
           />
           <Button type="button" variant="outline" size="sm" asChild>
            <Link to={`/Schedule/${r.id}`}>開啟排程詳情</Link>
           </Button>
          </div>
         ) : null}
        </li>
      )
      })}
     </ul>
    )}
   </section>
  </div>
 )
}
