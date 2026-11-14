import { useCallback, useEffect, useMemo, useState } from "react"

import { TeacherTrialPreviewPanel } from "@/components/trials/TeacherTrialPreviewPanel"
import {
 getTeacherTrialStudentsCache,
 invalidateTeacherTrialStudentsCache,
 isTeacherTrialStudentsCacheFresh,
 setTeacherTrialStudentsCache,
} from "@/components/trials/teacherTrialStudentsState"
import { AdminPageHeader, pagePadClass } from "@/components/detail/AdminPageHeader"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { Textarea } from "@/components/ui/textarea"
import { StaggerItem, StaggerList } from "@/components/ui/stagger-list"
import { useRecordPreview } from "@/components/recordPreview/recordPreviewContext"
import { useAuth } from "@/lib/authBootstrap"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { usesSharedAppShell } from "@/lib/mgmtRole"
import { formatStudentGrade } from "@/lib/studentGrade"
import { statusToTagTone } from "@/lib/statusTag"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { getTeacherScopeTeacherId } from "@/lib/teacherScope"
import {
 filterTeacherTrialRows,
 teacherCanWriteTrialComment,
 type TeacherTrialStatusFilter,
} from "@/lib/teacherTrialList"
import {
 clampTrialTeacherComment,
 commentCharCount,
 commentCountLabel,
 commentCountTone,
 hasNonBlankTrialComment,
} from "@/lib/trialTeacherComment"
import { cn } from "@/lib/utils"
import {
 fetchTrialsForTeacher,
 saveTrialTeacherComment,
 type TeacherTrialRow,
 type TeacherTrialSemester,
} from "@/services/trialQueries"

const STATUS_OPTIONS: { value: TeacherTrialStatusFilter; label: string }[] = [
 { value: "all", label: "全部狀態" },
 { value: "booked", label: "已預約" },
 { value: "reschedule", label: "待改期" },
 { value: "done", label: "已完成" },
 { value: "cancel", label: "已取消" },
]

function timeLabel(row: TeacherTrialRow): string | null {
 if (!row.sched_start || !row.sched_end) return null
 return `${String(row.sched_start).slice(0, 5)}–${String(row.sched_end).slice(0, 5)}`
}

function TrialCommentCell({
 row,
 teacherId,
 saving,
 onSave,
}: {
 row: TeacherTrialRow
 teacherId: string
 saving: boolean
 onSave: (trialId: string, comment: string) => Promise<void>
}) {
 const canWrite = teacherCanWriteTrialComment(row.schedule_teacher_id, teacherId)
 const [draft, setDraft] = useState(row.teacher_comment ?? "")
 const [err, setErr] = useState<string | null>(null)

 useEffect(() => {
  setDraft(row.teacher_comment ?? "")
  setErr(null)
 }, [row.id, row.teacher_comment])

 if (!canWrite) {
  return (
   <div className="text-sm">
    <p className="whitespace-pre-wrap">{row.teacher_comment?.trim() || "—"}</p>
    {!row.teacher_comment?.trim() ? (
     <p className="mt-1 text-xs text-muted-foreground">只有該堂實際授課老師可以撰寫評語。</p>
    ) : null}
   </div>
  )
 }

 const dirty = draft.trim() !== (row.teacher_comment ?? "").trim()
 const count = commentCharCount(draft)
 const canSave = dirty && hasNonBlankTrialComment(draft) && !saving

 return (
  <div className="grid gap-1">
   <Textarea
    value={draft}
    disabled={saving}
    aria-label={`${row.student_name ?? "學生"}的試堂評語`}
    placeholder="約 30 字，說明學習情況"
    className="min-h-[4.5rem]"
    onChange={(e) => {
     setDraft(clampTrialTeacherComment(e.target.value))
     setErr(null)
    }}
   />
   <p className={cn("text-[11px]", commentCountTone(count) === "warning" ? "text-warning" : "text-muted-foreground")}>
    {commentCountLabel(count)}
   </p>
   {err ? (
    <p role="alert" className="text-xs text-destructive">
     {err}
    </p>
   ) : null}
   {dirty ? (
    <div>
     <Button
      type="button"
      size="sm"
      disabled={!canSave}
      onClick={() => {
       void onSave(row.id, draft.trim()).catch((e) => {
        reportUserFacingError(e, { source: "TeacherTrialStudentsView.comment", setErr })
       })
      }}
     >
      {saving ? "儲存中…" : "儲存評語"}
     </Button>
    </div>
   ) : null}
  </div>
 )
}

export function TeacherTrialStudentsView() {
 const { profile, role } = useAuth()
 const teacherId = getTeacherScopeTeacherId(profile)
 const { enabled: previewEnabled, preview, openPreview, replacePreview, closePreview } = useRecordPreview()
 const [mobileTrialId, setMobileTrialId] = useState<string | null>(null)

 const cached = getTeacherTrialStudentsCache()
 const cacheMatches = cached != null && cached.teacherId === teacherId
 const [rows, setRows] = useState<TeacherTrialRow[]>(() => (cacheMatches ? cached.rows : []))
 const [semester, setSemester] = useState<TeacherTrialSemester | null>(() =>
  cacheMatches ? cached.semester : null
 )
 const [loading, setLoading] = useState(() => !cacheMatches)
 const [err, setErr] = useState<string | null>(null)
 const [savingId, setSavingId] = useState<string | null>(null)
 const [classId, setClassId] = useState("all")
 const [dateFrom, setDateFrom] = useState("")
 const [dateTo, setDateTo] = useState("")
 const [status, setStatus] = useState<TeacherTrialStatusFilter>("all")

 const reload = useCallback(async () => {
  if (!teacherId || !isSupabaseConfigured) return
  invalidateTeacherTrialStudentsCache()
  const hadCache = getTeacherTrialStudentsCache()?.teacherId === teacherId
  if (!hadCache) setLoading(true)
  setErr(null)
  try {
   const list = await fetchTrialsForTeacher(teacherId)
   setRows(list.rows)
   setSemester(list.semester)
   setTeacherTrialStudentsCache({
    teacherId,
    rows: list.rows,
    semester: list.semester,
   })
  } catch (e) {
   reportUserFacingError(e, { source: "TeacherTrialStudentsView.reload", setErr })
   setRows([])
   setSemester(null)
  } finally {
   setLoading(false)
  }
 }, [teacherId])

 useEffect(() => {
  if (!teacherId) return
  if (isTeacherTrialStudentsCacheFresh(teacherId)) return
  void reload()
 }, [reload, teacherId])

 useEffect(() => {
  if (!previewEnabled || preview?.kind !== "teacherTrial") return
  const fresh = rows.find((row) => row.id === preview.id)
  if (!fresh) {
   closePreview()
   return
  }
  if (fresh === preview.row) return
  replacePreview({ kind: "teacherTrial", id: fresh.id, row: fresh, teacherId: preview.teacherId })
 }, [rows, previewEnabled, preview, replacePreview, closePreview])

 useEffect(() => {
  if (!mobileTrialId) return
  if (!rows.some((row) => row.id === mobileTrialId)) setMobileTrialId(null)
 }, [rows, mobileTrialId])

 const classOptions = useMemo(() => {
  const byId = new Map<string, string>()
  for (const row of rows) {
   if (!row.class_id || byId.has(row.class_id)) continue
   byId.set(row.class_id, row.class_label || "—")
  }
  return [...byId.entries()].sort((a, b) => a[1].localeCompare(b[1], "zh-Hant"))
 }, [rows])

 const filtered = useMemo(
  () => filterTeacherTrialRows(rows, { classId, dateFrom, dateTo, status }),
  [rows, classId, dateFrom, dateTo, status]
 )

 const filtersActive = classId !== "all" || dateFrom !== "" || dateTo !== "" || status !== "all"

 const openTrial = (row: TeacherTrialRow) => {
  if (!teacherId) return
  if (previewEnabled) {
   openPreview({ kind: "teacherTrial", id: row.id, row, teacherId })
   return
  }
  setMobileTrialId(row.id)
 }

 const saveComment = async (trialId: string, comment: string) => {
  setSavingId(trialId)
  setErr(null)
  try {
   await saveTrialTeacherComment(trialId, comment)
   const next = rows.map((row) =>
    row.id === trialId
     ? {
        ...row,
        teacher_comment: comment,
        teacher_comment_at: row.teacher_comment_at ?? new Date().toISOString(),
        teacher_comment_by_name: row.teacher_comment_by_name ?? profile?.displayName ?? null,
        teacher_comment_edited_at: row.teacher_comment_at ? new Date().toISOString() : null,
       }
     : row
   )
   setRows(next)
   if (teacherId) {
    setTeacherTrialStudentsCache({
     teacherId,
     rows: next,
     semester,
    })
   }
  } finally {
   setSavingId(null)
  }
 }

 const previewTrialId = preview?.kind === "teacherTrial" ? preview.id : null
 const mobileTrial = rows.find((row) => row.id === mobileTrialId) ?? null

 const resetFilters = () => {
  setClassId("all")
  setDateFrom("")
  setDateTo("")
  setStatus("all")
 }

 const filterFields = (
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
   <label className="grid gap-1 text-xs text-muted-foreground">
    <span>班別</span>
    <Select className="h-10 min-h-10 w-full" value={classId} onChange={(e) => setClassId(e.target.value)}>
     <option value="all">全部班別</option>
     {classOptions.map(([id, label]) => (
      <option key={id} value={id}>
       {label}
      </option>
     ))}
    </Select>
   </label>
   <label className="grid gap-1 text-xs text-muted-foreground">
    <span>由</span>
    <Input type="date" aria-label="試堂日期由" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
   </label>
   <label className="grid gap-1 text-xs text-muted-foreground">
    <span>至</span>
    <Input type="date" aria-label="試堂日期至" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
   </label>
   <label className="grid gap-1 text-xs text-muted-foreground">
    <span>狀態</span>
    <Select
     className="h-10 min-h-10 w-full"
     value={status}
     onChange={(e) => setStatus(e.target.value as TeacherTrialStatusFilter)}
    >
     {STATUS_OPTIONS.map((option) => (
      <option key={option.value} value={option.value}>
       {option.label}
      </option>
     ))}
    </Select>
   </label>
  </div>
 )

 if (!isSupabaseConfigured) {
  return (
   <p role="alert" className="text-sm text-warning">
    尚未設定 Supabase。
   </p>
  )
 }

 if (!teacherId) {
  return (
   <p role="alert" className="text-sm text-warning">
    此頁只列出已綁定老師帳戶的試堂學生。
   </p>
  )
 }

 const semesterName = semester?.label?.trim() || "本學期"
 const pageDescription = semester
  ? `只列出${semesterName}（${semester.startYmd} 至 ${semester.endYmd}）、你任教班別的試堂。按下該列可看詳細資料，評語在清單填入。`
  : "只列出本學期、你任教班別的試堂。按下該列可看詳細資料，評語在清單填入。"

 return (
  <div className={cn("space-y-4", pagePadClass(role, "p-4 md:p-6"))}>
   {usesSharedAppShell(role) ? (
    <AdminPageHeader
     eyebrow="工作域"
     title="試堂學生"
     description={pageDescription}
     titleExtra={
      <Tag tone="info" size="sm">
       {rows.length} 筆
      </Tag>
     }
    />
   ) : (
    <header>
     <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight">
      試堂學生
      <Tag tone="info" size="sm">
       {rows.length} 筆
      </Tag>
     </h1>
     <p className="mt-1 text-sm text-muted-foreground">{pageDescription}</p>
    </header>
   )}

   {err ? (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
     {err}
    </div>
   ) : null}

   {filterFields}
   {filtersActive ? (
    <div>
     <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
      清除篩選
     </Button>
    </div>
   ) : null}

   {loading ? (
    <p className="text-sm text-muted-foreground">載入中…</p>
   ) : filtered.length === 0 ? (
    <div className="space-y-3 py-12 text-center">
     <p className="text-sm text-muted-foreground">
      {rows.length === 0 ? "本學期尚未有試堂學生" : "此條件下沒有試堂學生"}
     </p>
    </div>
   ) : (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
     <table className="w-full min-w-[880px] table-fixed border-collapse text-sm">
      <thead>
       <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
        <th className="w-[16%] px-3 py-2 font-medium">試堂日期</th>
        <th className="w-[16%] px-3 py-2 font-medium">學生姓名</th>
        <th className="w-[22%] px-3 py-2 font-medium">試堂班別</th>
        <th className="w-[12%] px-3 py-2 font-medium">狀態</th>
        <th className="w-[34%] px-3 py-2 font-medium">評語</th>
       </tr>
      </thead>
      <StaggerList as="tbody">
       {filtered.map((row, idx) => {
        const when = timeLabel(row)
        const selected = previewTrialId === row.id || mobileTrialId === row.id
        return (
         <StaggerItem
          key={row.id}
          as="tr"
          onClick={() => openTrial(row)}
          className={cn(
           "cursor-pointer border-b border-border last:border-0 transition-colors",
           selected ? "bg-info/15 hover:bg-info/20" : "hover:bg-muted/60",
           !selected && idx % 2 === 1 && "bg-muted/20"
          )}
         >
          <td className="px-3 py-2 align-top">
           <div className="font-medium tabular-nums">{row.trial_date || "—"}</div>
           {when ? <div className="text-xs tabular-nums text-muted-foreground">{when}</div> : null}
          </td>
          <td className="px-3 py-2 align-top">
           <div className="font-medium">{row.student_name ?? "—"}</div>
           {row.student_grade ? (
            <div className="text-xs text-muted-foreground">{formatStudentGrade(row.student_grade)}</div>
           ) : null}
          </td>
          <td className="px-3 py-2 align-top font-medium">{row.class_label || "—"}</td>
          <td className="px-3 py-2 align-top">
           <Tag tone={statusToTagTone(row.status)} size="sm">
            {row.status || "—"}
           </Tag>
          </td>
          <td className="px-3 py-2 align-top" onClick={(event) => event.stopPropagation()}>
           <TrialCommentCell
            row={row}
            teacherId={teacherId}
            saving={savingId === row.id}
            onSave={saveComment}
           />
          </td>
         </StaggerItem>
        )
       })}
      </StaggerList>
     </table>
     <div className="border-t border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
      共 {filtered.length} 筆試堂學生
      {filtered.length !== rows.length ? `（全部 ${rows.length} 筆）` : null}
     </div>
    </div>
   )}

   {mobileTrial && !previewEnabled ? (
    <Dialog
     open
     onOpenChange={(open) => {
      if (!open) setMobileTrialId(null)
     }}
    >
     <DialogContent className="max-h-[85vh] overflow-y-auto p-0">
      <DialogTitle className="sr-only">{mobileTrial.student_name ?? "試堂學生"}</DialogTitle>
      <TeacherTrialPreviewPanel row={mobileTrial} teacherId={teacherId} />
     </DialogContent>
    </Dialog>
   ) : null}
  </div>
 )
}
