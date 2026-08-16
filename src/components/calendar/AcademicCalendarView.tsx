import { useCallback, useEffect, useMemo, useState } from "react"
import { CalendarX, Plus, Trash2, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import { confirmNonCurrentAcademicYearWrite } from "@/lib/academicYearSoftGuard"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import {
 deleteAcademicCalendarClosure,
 fetchAcademicCalendarClosures,
 importAcademicCalendarClosures,
 saveAcademicCalendarClosure,
 type AcademicCalendarClosure,
} from "@/services/academicCalendarQueries"
import {
 fetchAcademicYearsWithDates,
 type AcademicYearRange,
} from "@/services/teacherAvailabilityQueries"

function parseImportText(text: string): Array<{ closureDate: string; name: string; notes: string | null }> {
 return text
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => {
   const [date = "", name = "", ...notes] = line.split(/[\t,，]/).map((part) => part.trim())
   return {
    closureDate: date.slice(0, 10),
    name,
    notes: notes.join("；") || null,
   }
  })
  .filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.closureDate) && row.name.length > 0)
}

export function AcademicCalendarView() {
 const { pushBanner } = useAppBanner()
 const { confirmDialog } = useAppConfirm()
 const [years, setYears] = useState<AcademicYearRange[]>([])
 const [yearId, setYearId] = useState("")
 const [rows, setRows] = useState<AcademicCalendarClosure[]>([])
 const [date, setDate] = useState("")
 const [name, setName] = useState("")
 const [notes, setNotes] = useState("")
 const [importText, setImportText] = useState("")
 const [loading, setLoading] = useState(true)
 const [saving, setSaving] = useState(false)
 const [err, setErr] = useState<string | null>(null)

 const selectedYear = useMemo(
  () => years.find((year) => year.id === yearId) ?? null,
  [years, yearId]
 )

 const reloadRows = useCallback(async (id: string) => {
  if (!id) {
   setRows([])
   return
  }
  setRows(await fetchAcademicCalendarClosures(id))
 }, [])

 useEffect(() => {
  let cancelled = false
  setLoading(true)
  void fetchAcademicYearsWithDates()
   .then(async (list) => {
    if (cancelled) return
    setYears(list)
    const initial = list.find((year) => year.label === "2627") ?? list.find((year) => year.is_current) ?? list[0]
    if (!initial) return
    setYearId(initial.id)
    setRows(await fetchAcademicCalendarClosures(initial.id))
   })
   .catch((error) => {
    if (!cancelled) reportUserFacingError(error, { source: "AcademicCalendarView.load", setErr })
   })
   .finally(() => {
    if (!cancelled) setLoading(false)
   })
  return () => {
   cancelled = true
  }
 }, [])

 const changeYear = async (nextId: string) => {
  setYearId(nextId)
  setErr(null)
  try {
   await reloadRows(nextId)
  } catch (error) {
   reportUserFacingError(error, { source: "AcademicCalendarView.changeYear", setErr })
  }
 }

 const addClosure = async () => {
  if (!yearId || saving) return
  if (selectedYear && (date < selectedYear.start_date || date > selectedYear.end_date)) {
   setErr(`日期必須在 ${selectedYear.start_date} 至 ${selectedYear.end_date} 內`)
   return
  }
  if (
   !(await confirmNonCurrentAcademicYearWrite(confirmDialog, {
    label: selectedYear?.label,
    dateYmd: date,
    source: "AcademicCalendarView.add",
   }))
  ) {
   return
  }
  setSaving(true)
  setErr(null)
  try {
   await saveAcademicCalendarClosure({
    academicYearId: yearId,
    closureDate: date,
    name,
    notes,
   })
   await reloadRows(yearId)
   setDate("")
   setName("")
   setNotes("")
   pushBanner({ tone: "success", title: "已儲存停課日" })
  } catch (error) {
   reportUserFacingError(error, { source: "AcademicCalendarView.add", setErr })
  } finally {
   setSaving(false)
  }
 }

 const importClosures = async () => {
  if (!yearId || saving) return
  const parsed = parseImportText(importText)
  if (parsed.length === 0) {
   setErr("請按每行「YYYY-MM-DD, 停課名稱」格式貼上校曆")
   return
  }
  if (
   selectedYear &&
   parsed.some(
    (row) => row.closureDate < selectedYear.start_date || row.closureDate > selectedYear.end_date
   )
  ) {
   setErr(`所有日期必須在 ${selectedYear.start_date} 至 ${selectedYear.end_date} 內`)
   return
  }
  if (
   !(await confirmNonCurrentAcademicYearWrite(confirmDialog, {
    label: selectedYear?.label,
    source: "AcademicCalendarView.import",
   }))
  ) {
   return
  }
  setSaving(true)
  setErr(null)
  try {
   const count = await importAcademicCalendarClosures(yearId, parsed)
   await reloadRows(yearId)
   setImportText("")
   pushBanner({ tone: "success", title: "校曆匯入完成", message: `已處理 ${count} 個停課日` })
  } catch (error) {
   reportUserFacingError(error, { source: "AcademicCalendarView.import", setErr })
  } finally {
   setSaving(false)
  }
 }

 const removeClosure = async (row: AcademicCalendarClosure) => {
  if (
   !(await confirmNonCurrentAcademicYearWrite(confirmDialog, {
    label: selectedYear?.label,
    dateYmd: row.closureDate,
    source: "AcademicCalendarView.delete",
   }))
  ) {
   return
  }
  if (
   !(await confirmDialog({
    title: "刪除停課日",
    description: `確定刪除 ${row.closureDate}「${row.name}」？之後批量排程將再次把該日列為候選。`,
    confirmText: "刪除",
    tone: "destructive",
   }))
  ) {
   return
  }
  setErr(null)
  try {
   await deleteAcademicCalendarClosure(row.id, row.closureDate)
   await reloadRows(yearId)
   pushBanner({ tone: "success", title: "已刪除停課日" })
  } catch (error) {
   reportUserFacingError(error, { source: "AcademicCalendarView.delete", setErr })
  }
 }

 return (
  <div className="mx-auto max-w-6xl space-y-6">
   <header>
    <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
     <CalendarX className="h-7 w-7 text-warning" aria-hidden />
     校曆
    </h1>
    <p className="mt-1 text-sm text-muted-foreground">
     登記全校停課日；批量排程會自動排除，月費亦按最終上課日計算。
    </p>
   </header>

   <section className="rounded-xl border border-border bg-card p-4">
    <label className="text-sm font-medium" htmlFor="calendar-year">
     學年
    </label>
    <Select
     id="calendar-year"
     className="mt-1 max-w-xs"
     value={yearId}
     onChange={(event) => void changeYear(event.target.value)}
    >
     <option value="">請選擇學年</option>
     {years.map((year) => (
      <option key={year.id} value={year.id}>
       {year.label}（{year.start_date} 至 {year.end_date}）
      </option>
     ))}
    </Select>
   </section>

   <div className="grid gap-4 lg:grid-cols-2">
    <section className="rounded-xl border border-border bg-card p-4">
     <h2 className="text-base font-semibold">新增單一停課日</h2>
     <div className="mt-3 grid gap-3 sm:grid-cols-2">
      <label className="text-sm">
       <span className="mb-1 block text-muted-foreground">日期</span>
       <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </label>
      <label className="text-sm">
       <span className="mb-1 block text-muted-foreground">名稱</span>
       <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：中秋節翌日" />
      </label>
      <label className="text-sm sm:col-span-2">
       <span className="mb-1 block text-muted-foreground">備註</span>
       <Input value={notes} onChange={(event) => setNotes(event.target.value)} />
      </label>
     </div>
     <Button className="mt-3" type="button" onClick={() => void addClosure()} disabled={!yearId || saving}>
      <Plus className="h-4 w-4" />
      新增停課日
     </Button>
    </section>

    <section className="rounded-xl border border-border bg-card p-4">
     <h2 className="text-base font-semibold">批量貼上校曆</h2>
     <p className="mt-1 text-xs text-muted-foreground">每行：YYYY-MM-DD, 停課名稱, 備註（備註可省略）</p>
     <Textarea
      className="mt-3 min-h-28"
      value={importText}
      onChange={(event) => setImportText(event.target.value)}
      placeholder={"2026-10-01, 國慶日\n2026-10-02, 校內停課"}
     />
     <Button className="mt-3" type="button" variant="outline" onClick={() => void importClosures()} disabled={!yearId || saving}>
      <Upload className="h-4 w-4" />
      匯入校曆
     </Button>
    </section>
   </div>

   {err ? <p role="alert" className="text-sm text-destructive">{err}</p> : null}

   <section>
    <h2 className="text-base font-semibold">
     {selectedYear?.label ?? "所選學年"}停課日（{rows.length}）
    </h2>
    {loading ? (
     <p className="mt-3 text-sm text-muted-foreground">載入中…</p>
    ) : rows.length === 0 ? (
     <p className="mt-3 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      尚未登記停課日。
     </p>
    ) : (
     <div className="mt-3 overflow-x-auto rounded-lg border border-border">
      <table className="w-full table-fixed text-sm">
       <thead className="bg-muted/50 text-left">
        <tr>
         <th className="w-[22%] px-3 py-2 font-medium">日期</th>
         <th className="w-[28%] px-3 py-2 font-medium">名稱</th>
         <th className="w-[40%] px-3 py-2 font-medium">備註</th>
         <th className="w-[10%] px-3 py-2 text-right font-medium">操作</th>
        </tr>
       </thead>
       <tbody>
        {rows.map((row) => (
         <tr key={row.id} className="border-t border-border">
          <td className="px-3 py-2 tabular-nums">{row.closureDate}</td>
          <td className="break-words px-3 py-2 font-medium">{row.name}</td>
          <td className="break-words px-3 py-2 text-muted-foreground">{row.notes || "—"}</td>
          <td className="px-3 py-2 text-right">
           <Button type="button" variant="ghost" size="icon" onClick={() => void removeClosure(row)} aria-label={`刪除 ${row.closureDate}`}>
            <Trash2 className="h-4 w-4" />
           </Button>
          </td>
         </tr>
        ))}
       </tbody>
      </table>
     </div>
    )}
   </section>
  </div>
 )
}
