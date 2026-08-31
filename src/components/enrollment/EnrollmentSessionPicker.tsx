import { fetchClassSchedules, type ClassScheduleRow } from "@/services/classQueries"
import { useEffect, useState } from "react"

type Props = {
 classId: string
 selectedIds: string[]
 onChange: (scheduleIds: string[]) => void
 disabled?: boolean
}

export function EnrollmentSessionPicker({
 classId,
 selectedIds,
 onChange,
 disabled,
}: Props) {
 const [rows, setRows] = useState<ClassScheduleRow[]>([])
 const [loading, setLoading] = useState(false)
 const [err, setErr] = useState<string | null>(null)

 useEffect(() => {
  if (!classId) {
   setRows([])
   return
  }
  let cancelled = false
  setLoading(true)
  setErr(null)
  void fetchClassSchedules(classId)
   .then((list) => {
    if (!cancelled) setRows(list.filter((s) => !s.status.includes("取消")))
   })
   .catch((e) => {
    if (!cancelled) setErr(e instanceof Error ? e.message : "載入排程失敗")
   })
   .finally(() => {
    if (!cancelled) setLoading(false)
   })
  return () => {
   cancelled = true
  }
 }, [classId])

 const toggle = (id: string) => {
  if (disabled) return
  if (selectedIds.includes(id)) onChange(selectedIds.filter((x) => x !== id))
  else onChange([...selectedIds, id])
 }

 const selectAll = () => {
  if (disabled) return
  onChange(rows.map((r) => r.id))
 }

 const clearAll = () => {
  if (disabled) return
  onChange([])
 }

 return (
  <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
   <div className="flex flex-wrap items-center justify-between gap-2">
    <p className="text-sm font-medium">選擇報讀堂數</p>
    <div className="flex gap-2">
     <button
      type="button"
      className="text-xs text-primary hover:underline disabled:opacity-50"
      disabled={disabled || rows.length === 0}
      onClick={selectAll}
     >
      全選
     </button>
     <button
      type="button"
      className="text-xs text-muted-foreground hover:underline disabled:opacity-50"
      disabled={disabled || selectedIds.length === 0}
      onClick={clearAll}
     >
      清除
     </button>
    </div>
   </div>
   {loading ? <p className="text-sm text-muted-foreground">載入堂次…</p> : null}
   {err ? <p role="alert" className="text-sm text-destructive">{err}</p> : null}
   {!loading && !err && rows.length === 0 ? (
    <p className="text-sm text-muted-foreground">此班尚無排程，請先建立課堂。</p>
   ) : null}
   <ul className="max-h-56 space-y-1.5 overflow-y-auto">
    {rows.map((r) => {
     const label = [
      r.session_number != null ? `第${r.session_number}堂` : "堂次未編號",
      r.scheduled_date,
      r.start_time ? String(r.start_time).slice(0, 5) : null,
     ]
      .filter(Boolean)
      .join(" · ")
     const checked = selectedIds.includes(r.id)
     return (
      <li key={r.id}>
       <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50">
        <input
         type="checkbox"
         className="h-4 w-4 accent-primary"
         checked={checked}
         disabled={disabled}
         onChange={() => toggle(r.id)}
        />
        <span>{label}</span>
       </label>
      </li>
     )
    })}
   </ul>
   <p className="text-xs text-muted-foreground">已選 {selectedIds.length} 堂</p>
  </div>
 )
}
