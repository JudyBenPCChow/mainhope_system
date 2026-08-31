import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Loader2 } from "lucide-react"

import {
 useOpenStudentRecord,
 useOpenTeacherRecord,
} from "@/components/recordPreview/recordPreviewContext"
import { PreviewCell, PreviewError, PreviewLoading } from "@/components/recordPreview/previewUi"
import { Button } from "@/components/ui/button"
import { Tag } from "@/components/ui/tag"
import { formatClassTimeDisplay } from "@/lib/consecutiveLesson"
import { classDisplayName } from "@/lib/courseLabel"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { classKindLabel, resolveClassKind } from "@/lib/privateClassKind"
import { statusToTagTone } from "@/lib/statusTag"
import { formatWeekdaysDisplay } from "@/lib/weekdayUtils"
import {
 fetchClassStudents,
 getClassById,
 type ClassRecord,
 type ClassStudentRow,
} from "@/services/classQueries"

const PREVIEW_ROSTER_CAP = 8

type Props = {
 classId: string
}

export function ClassPreviewPanel({ classId }: Props) {
 const openStudent = useOpenStudentRecord()
 const openTeacher = useOpenTeacherRecord()
 const [cls, setCls] = useState<ClassRecord | null>(null)
 const [roster, setRoster] = useState<ClassStudentRow[]>([])
 const [rosterLoading, setRosterLoading] = useState(true)
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState(false)

 useEffect(() => {
  let cancelled = false
  setLoading(true)
  setError(false)
  setCls(null)
  setRoster([])
  setRosterLoading(true)

  void (async () => {
   try {
    const row = await getClassById(classId)
    if (cancelled) return
    setCls(row)
    if (!row) setError(true)
   } catch (e) {
    reportUserFacingError(e, { source: "ClassPreviewPanel.load" })
    if (!cancelled) {
     setCls(null)
     setError(true)
    }
   } finally {
    if (!cancelled) setLoading(false)
   }
  })()

  void (async () => {
   try {
    const students = await fetchClassStudents(classId)
    if (!cancelled) setRoster(students.filter((s) => s.status !== "已退讀"))
   } catch (e) {
    reportUserFacingError(e, { source: "ClassPreviewPanel.roster" })
    if (!cancelled) setRoster([])
   } finally {
    if (!cancelled) setRosterLoading(false)
   }
  })()

  return () => {
   cancelled = true
  }
 }, [classId])

 const shown = useMemo(() => roster.slice(0, PREVIEW_ROSTER_CAP), [roster])
 const rest = Math.max(0, roster.length - shown.length)

 if (loading) return <PreviewLoading />
 if (error || !cls) return <PreviewError message="班別資料未能載入。" />

 const kind = resolveClassKind(cls.class_kind, cls.subject)
 const timeLine = formatClassTimeDisplay({
  dayOfWeek: formatWeekdaysDisplay(cls.day_of_week),
  timeSlot: cls.time_slot,
  lessonSlotsPerSession: cls.lesson_slots_per_session,
 })

 return (
  <div className="space-y-3 text-sm">
   <h2 className="pr-6 text-2xl font-bold leading-tight">
    {classDisplayName({ subject: cls.subject, courseName: cls.course_name })}
   </h2>
   <div className="font-mono text-xs tabular-nums text-muted-foreground">
    {cls.course_code_full ?? cls.id.slice(0, 8)}
   </div>
   <div className="flex flex-wrap items-center gap-1.5">
    <Tag tone="info" size="sm">
     {classKindLabel(kind)}
    </Tag>
    {kind === "private" ? (
     <Tag tone="info" size="sm">
      {cls.capacity === 2 ? "一對二" : "一對一"}
     </Tag>
    ) : null}
    <Tag tone={statusToTagTone(cls.status)} size="sm">
     {cls.status}
    </Tag>
   </div>
   <div className="grid grid-cols-2 gap-2">
    <PreviewCell label="時間">{timeLine}</PreviewCell>
    <PreviewCell label="年級">{(cls.grade ?? []).join("、") || "—"}</PreviewCell>
    <PreviewCell label="課室">{cls.classroom_name ?? "未指定"}</PreviewCell>
    <PreviewCell label="名單">
     {rosterLoading ? "…" : cls.capacity != null ? `${roster.length}／${cls.capacity} 人` : `${roster.length} 人`}
    </PreviewCell>
   </div>
   <div className="text-xs">
    <span className="text-muted-foreground">任教老師 </span>
    {cls.teacher_id ? (
     <button
      type="button"
      className="font-medium text-primary underline-offset-4 hover:underline"
      onClick={() => openTeacher(cls.teacher_id as string)}
     >
      {cls.teacher_name ?? "—"}
     </button>
    ) : (
     <span>未指定</span>
    )}
   </div>
   <div className="rounded-xl border border-border p-3">
    <p className="text-xs font-semibold">學生名單</p>
    {rosterLoading ? (
     <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground" role="status">
      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
      載入名單…
     </p>
    ) : roster.length === 0 ? (
     <p className="mt-2 text-xs text-muted-foreground">目前沒有在讀學生</p>
    ) : (
     <div className="mt-2 flex flex-wrap gap-1.5">
      {shown.map((s) => (
       <button key={s.studentId} type="button" className="inline-flex" onClick={() => openStudent(s.studentId)}>
        <Tag tone="info" size="sm">
         {s.fullName}
        </Tag>
       </button>
      ))}
     </div>
    )}
    {rest > 0 ? (
     <Link to={`/Classes/${cls.id}`} className="mt-2 inline-block text-xs font-medium text-primary hover:underline">
      仲有 {rest} 人
     </Link>
    ) : null}
   </div>
   <div className="space-y-2 border-t border-border pt-3">
    <Button asChild className="w-full justify-start">
     <Link to={`/Classes/${cls.id}`}>開完整詳情</Link>
    </Button>
   </div>
  </div>
 )
}
