import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { StaggerItem, StaggerList } from "@/components/ui/stagger-list"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { confirmNonCurrentAcademicYearWrite } from "@/lib/academicYearSoftGuard"
import { isBillableAttendanceStatus } from "@/lib/attendanceBilling"
import { formatUnknownError } from "@/lib/formatUnknownError"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import {
 attendanceClassOptions,
 attendanceTabKind,
 filterSortAttendance,
 summarizeAttendanceStats,
 type AttendanceSort,
 type AttendanceStatusFilter,
} from "@/lib/studentAttendanceTab"
import { cn } from "@/lib/utils"
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import {
 deleteAttendanceDetailAsMgmt,
 formatAttendanceHitsDescription,
 type AttendanceLifecycleHit,
} from "@/services/attendanceLifecycleQueries"
import { fetchAttendanceForStudent, type AttendanceRow } from "@/services/studentQueries"

export function StudentAttendanceTab({
 studentId,
 studentName,
 active,
 reloadToken,
 canDeleteAttendance,
 onChanged,
}: {
 studentId: string
 studentName: string
 active: boolean
 reloadToken: number
 canDeleteAttendance: boolean
 onChanged: () => Promise<void> | void
}) {
 const { pushBanner } = useAppBanner()
 const { confirmDialog } = useAppConfirm()
 const [rows, setRows] = useState<AttendanceRow[]>([])
 const [loadState, setLoadState] = useState<"idle" | "loading" | "ready" | "error">("idle")
 const [err, setErr] = useState<string | null>(null)
 const loadedRef = useRef(false)

 useEffect(() => {
  loadedRef.current = false
  setRows([])
  setLoadState("idle")
  setErr(null)
 }, [studentId])

 const [attClassFilter, setAttClassFilter] = useState("all")
 const [attStatusFilter, setAttStatusFilter] = useState<AttendanceStatusFilter>("all")
 const [attDateFrom, setAttDateFrom] = useState("")
 const [attDateTo, setAttDateTo] = useState("")
 const [attSort, setAttSort] = useState<AttendanceSort>("dateDesc")

 const load = useCallback(async () => {
  setLoadState("loading")
  setErr(null)
  try {
   const data = await fetchAttendanceForStudent(studentId)
   setRows(data)
   setLoadState("ready")
   loadedRef.current = true
  } catch (e) {
   const message = formatUnknownError(e)
   setErr(message)
   setLoadState("error")
   reportUserFacingError(e, { source: "StudentAttendanceTab.load" })
  }
 }, [studentId])

 useEffect(() => {
  if (!active && !loadedRef.current) return
  void load()
 }, [active, reloadToken, load])

 const attStats = useMemo(() => summarizeAttendanceStats(rows), [rows])
 const classOptions = useMemo(() => attendanceClassOptions(rows), [rows])
 const filteredSortedAttendance = useMemo(
  () =>
   filterSortAttendance(rows, {
    classFilter: attClassFilter,
    statusFilter: attStatusFilter,
    dateFrom: attDateFrom,
    dateTo: attDateTo,
    sort: attSort,
   }),
  [rows, attClassFilter, attStatusFilter, attDateFrom, attDateTo, attSort]
 )

 const deleteAttendanceRow = async (row: AttendanceRow) => {
  const surname = studentName.trim().slice(0, 1)
  const hit: AttendanceLifecycleHit = {
   id: row.id,
   studentId: row.studentId,
   classId: row.classId,
   scheduleId: row.scheduleId,
   attendanceDate: row.attendance_date,
   status: row.status,
   updatedAt: row.updatedAt,
   studentName: studentName.trim() || null,
  }
  const billable = isBillableAttendanceStatus(row.status)
  const ok = await confirmDialog({
   title: "刪除單筆出席紀錄？",
   description: `${formatAttendanceHitsDescription([hit])}\n\n此操作不可還原（除非重新點名）。過渡權限＝mgmtRole（admin／外星人），非 Auth。`,
   confirmText: billable ? "⚠️ 刪除計費出席（影響已扣堂數）" : "確認刪除",
   cancelText: "取消",
   tone: "destructive",
   ...(billable && surname
    ? {
       confirmInput: {
        label: `請輸入學生姓氏「${surname}」以確認刪除計費出席`,
        expected: surname,
        placeholder: surname,
       },
      }
    : {}),
  })
  if (ok !== true) return
  if (
   !(await confirmNonCurrentAcademicYearWrite(confirmDialog, {
    dateYmd: row.attendance_date,
    source: "StudentDetailView.deleteAttendance",
   }))
  ) {
   return
  }
  try {
   await deleteAttendanceDetailAsMgmt(row.id, "mgmt_single_delete_student_detail")
   pushBanner({ tone: "success", title: "已刪除出席", message: `${row.attendance_date} · ${row.status}` })
   await onChanged()
  } catch (e) {
   reportUserFacingError(e, { source: "StudentDetailView.deleteAttendance" })
   pushBanner({
    tone: "error",
    title: "刪除失敗",
    message: e instanceof Error ? e.message : String(e),
   })
  }
 }

 if (!active && !loadedRef.current && loadState === "idle") return null

 const kind = attendanceTabKind(
  loadState === "error"
   ? { status: "error", message: err ?? "" }
   : loadState === "ready"
     ? { status: "ready", rows }
     : { status: "loading" }
 )

 return (
  <div hidden={!active} className="space-y-4">
   <div className="grid grid-cols-3 gap-2 md:gap-3">
    <div className="rounded-xl border border-success/30 bg-success/10 p-2.5 text-center md:p-4">
     <div className="text-xl font-bold text-success md:text-2xl">
      {kind === "error" ? "—" : attStats.present}
     </div>
     <div className="text-[11px] text-success/90 md:text-xs">總上堂</div>
    </div>
    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-2.5 text-center md:p-4">
     <div className="text-xl font-bold text-destructive md:text-2xl">
      {kind === "error" ? "—" : attStats.absent}
     </div>
     <div className="text-[11px] text-destructive/90 md:text-xs">總缺席</div>
    </div>
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-center md:p-4">
     <div className="text-xl font-bold text-amber-800 md:text-2xl">
      {kind === "error" ? "—" : attStats.makeup}
     </div>
     <div className="text-[11px] text-amber-900/90 md:text-xs">待補堂</div>
    </div>
   </div>
   <p className="hidden text-xs text-muted-foreground md:block">
    上方數字為<strong className="text-foreground">全部</strong>紀錄統計；下方列表可依條件篩選與排序。
    {canDeleteAttendance ? " 管理員／外星人可刪單筆出席（須確認；計費列會影響已扣堂數）。" : null}
   </p>
   {kind === "loading" ? (
    <p className="py-8 text-center text-sm text-muted-foreground">載入中…</p>
   ) : kind === "error" ? (
    <div className="space-y-2 py-8 text-center" role="alert">
     <p role="alert" className="text-sm text-destructive">上課紀錄未能載入{err ? `：${err}` : "。"}</p>
     <button type="button" className="text-sm font-medium text-primary hover:underline" onClick={() => void load()}>
      重試
     </button>
    </div>
   ) : kind === "empty" ? (
    <p className="py-8 text-center text-sm text-muted-foreground">尚無出勤紀錄</p>
   ) : (
    <>
     <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-sm sm:flex-row sm:flex-wrap sm:items-end">
      <label className="grid w-full gap-1 text-xs text-muted-foreground sm:w-auto">
       <span>班別</span>
       <Select
        className="h-9 w-full min-w-0 rounded-md border border-input bg-background px-2 text-sm sm:min-w-[10rem]"
        value={attClassFilter}
        onChange={(e) => setAttClassFilter(e.target.value)}
       >
        <option value="all">全部班別</option>
        {classOptions.map(([cid, label]) => (
         <option key={cid} value={cid}>
          {label}
         </option>
        ))}
       </Select>
      </label>
      <label className="grid w-full gap-1 text-xs text-muted-foreground sm:w-auto">
       <span>狀態</span>
       <Select
        className="h-9 w-full min-w-0 rounded-md border border-input bg-background px-2 text-sm sm:min-w-[8rem]"
        value={attStatusFilter}
        onChange={(e) => setAttStatusFilter(e.target.value as AttendanceStatusFilter)}
       >
        <option value="all">全部</option>
        <option value="present">出席類</option>
        <option value="absent">缺席類</option>
        <option value="other">其他</option>
       </Select>
      </label>
      <label className="grid w-full gap-1 text-xs text-muted-foreground sm:w-auto">
       <span>上課日起</span>
       <Input
        type="date"
        value={attDateFrom}
        onChange={(e) => setAttDateFrom(e.target.value)}
        className="h-9 w-full sm:w-[11rem]"
       />
      </label>
      <label className="grid w-full gap-1 text-xs text-muted-foreground sm:w-auto">
       <span>上課日迄</span>
       <Input
        type="date"
        value={attDateTo}
        onChange={(e) => setAttDateTo(e.target.value)}
        className="h-9 w-full sm:w-[11rem]"
       />
      </label>
      <label className="grid w-full gap-1 text-xs text-muted-foreground sm:w-auto">
       <span>排序</span>
       <Select
        className="h-9 w-full min-w-0 rounded-md border border-input bg-background px-2 text-sm sm:min-w-[11rem]"
        value={attSort}
        onChange={(e) => setAttSort(e.target.value as AttendanceSort)}
       >
        <option value="dateDesc">上課日（新→舊）</option>
        <option value="dateAsc">上課日（舊→新）</option>
        <option value="classAsc">班別名稱（A→Z）</option>
        <option value="classDesc">班別名稱（Z→A）</option>
        <option value="statusAsc">狀態（筆畫序）</option>
       </Select>
      </label>
      <Button
       type="button"
       variant="outline"
       size="sm"
       className="h-9"
       onClick={() => {
        setAttClassFilter("all")
        setAttStatusFilter("all")
        setAttDateFrom("")
        setAttDateTo("")
        setAttSort("dateDesc")
       }}
      >
       重設篩選
      </Button>
     </div>
     <p className="text-sm text-muted-foreground">
      篩選結果：<strong className="text-foreground">{filteredSortedAttendance.length}</strong> 筆
      （共 {rows.length} 筆）
     </p>
     {filteredSortedAttendance.length === 0 ? (
      <p className="py-8 text-center text-sm text-muted-foreground">此條件下沒有紀錄</p>
     ) : (
      <div className="overflow-hidden rounded-xl border border-border bg-card">
       <div
        className={cn(
         "hidden gap-x-3 border-b border-border bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground sm:grid",
         canDeleteAttendance
          ? "grid-cols-[minmax(0,1fr)_auto_auto_auto]"
          : "grid-cols-[minmax(0,1fr)_auto_auto]"
        )}
       >
        <span>班別</span>
        <span className="text-right">日期</span>
        <span className="text-right">狀態</span>
        {canDeleteAttendance ? <span className="text-right">操作</span> : null}
       </div>
       <StaggerList as="ul" className="divide-y divide-border">
        {filteredSortedAttendance.map((a) => (
         <StaggerItem
          key={a.id}
          as="li"
          className={cn(
           "grid items-center gap-x-3 gap-y-1 px-4 py-3 text-sm",
           canDeleteAttendance
            ? "grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]"
            : "grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_auto_auto]"
          )}
         >
          <span className="min-w-0 truncate font-medium">
           {a.classId ? (
            <Link to={`/Classes/${a.classId}`} className="block truncate text-primary hover:underline">
             {a.classLabel}
            </Link>
           ) : (
            a.classLabel
           )}
          </span>
          <span className="text-right tabular-nums text-muted-foreground">{a.attendance_date}</span>
          <span className="col-span-2 text-right text-xs text-muted-foreground sm:col-span-1">{a.status}</span>
          {canDeleteAttendance ? (
           <span className="col-span-2 text-right sm:col-span-1">
            <button
             type="button"
             className="text-xs font-medium text-destructive hover:underline"
             onClick={() => void deleteAttendanceRow(a)}
            >
             刪除
            </button>
           </span>
          ) : null}
         </StaggerItem>
        ))}
       </StaggerList>
      </div>
     )}
    </>
   )}
  </div>
 )
}
