import { useCallback, useEffect, useMemo, useState } from "react"
import { CalendarX, Trash2 } from "lucide-react"

import { AdminPageHeader } from "@/components/detail/AdminPageHeader"
import { AdminWorkspaceNav } from "@/components/detail/AdminWorkspaceNav"
import {
 ADMIN_WORKSPACE_DESCRIPTION,
 adminWorkspacePageClass,
} from "@/lib/adminNavigation"
import { Button } from "@/components/ui/button"
import { StaggerItem, StaggerList } from "@/components/ui/stagger-list"
import { Select } from "@/components/ui/select"
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import { useAuth } from "@/lib/authBootstrap"
import { confirmNonCurrentAcademicYearWrite } from "@/lib/academicYearSoftGuard"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { cn } from "@/lib/utils"
import {
 deleteAcademicCalendarClosure,
 fetchAcademicCalendarClosures,
 type AcademicCalendarClosure,
} from "@/services/academicCalendarQueries"
import {
 fetchAcademicYearsWithDates,
 type AcademicYearRange,
} from "@/services/teacherAvailabilityQueries"
import { usesSharedAppShell } from "@/lib/mgmtRole"

export function AcademicCalendarView() {
 const { pushBanner } = useAppBanner()
 const { confirmDialog } = useAppConfirm()
 const { role } = useAuth()
 const [years, setYears] = useState<AcademicYearRange[]>([])
 const [yearId, setYearId] = useState("")
 const [rows, setRows] = useState<AcademicCalendarClosure[]>([])
 const [loading, setLoading] = useState(true)
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
    title: "刪除校舍假期",
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
   pushBanner({ tone: "success", title: "已刪除校舍假期" })
  } catch (error) {
   reportUserFacingError(error, { source: "AcademicCalendarView.delete", setErr })
  }
 }

 return (
  <div className={cn(adminWorkspacePageClass, role !== "admin" && "mx-auto max-w-6xl")}>
   {usesSharedAppShell(role) ? (
    <AdminPageHeader
     eyebrow="工作域"
     title="專科校曆"
     description={ADMIN_WORKSPACE_DESCRIPTION.specialty}
    />
   ) : (
    <header>
     <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
      <CalendarX className="h-7 w-7 text-warning" aria-hidden />
      校曆
     </h1>
     <p className="mt-1 text-sm text-muted-foreground">
      列出本社沒有任何課堂的校舍假期；批量排程會自動排除，月費亦按最終上課日計算。
     </p>
    </header>
   )}

   <AdminWorkspaceNav workspace="specialty" />

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

   {err ? <p role="alert" className="text-sm text-destructive">{err}</p> : null}

   <section>
    <h2 className="text-base font-semibold">
     {selectedYear?.label ?? "所選學年"}校舍假期（{rows.length}）
    </h2>
    {loading ? (
     <p className="mt-3 text-sm text-muted-foreground">載入中…</p>
    ) : rows.length === 0 ? (
     <p className="mt-3 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      尚未登記校舍假期。
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
       <StaggerList as="tbody">
        {rows.map((row) => (
         <StaggerItem key={row.id} as="tr" className="border-t border-border">
          <td className="px-3 py-2 tabular-nums">{row.closureDate}</td>
          <td className="break-words px-3 py-2 font-medium">{row.name}</td>
          <td className="break-words px-3 py-2 text-muted-foreground">{row.notes || "—"}</td>
          <td className="px-3 py-2 text-right">
           <Button type="button" variant="ghost" size="icon" onClick={() => void removeClosure(row)} aria-label={`刪除 ${row.closureDate}`}>
            <Trash2 className="h-4 w-4" />
           </Button>
          </td>
         </StaggerItem>
        ))}
       </StaggerList>
      </table>
     </div>
    )}
   </section>
  </div>
 )
}
